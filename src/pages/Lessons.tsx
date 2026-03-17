import React from 'react'
import { fetchJSONC } from '../lib/api'
import VideoPlayer from '../components/VideoPlayer'
import { getWebSocketUrl, microdocAPI, type MicrodocComment } from '../lib/apiClient'
import { useAuthStore } from '../lib/authStore'
import { useAppStore } from '../lib/store'
import type { Lesson } from '../types/content'

const VISITOR_STORAGE_KEY = 'microdoc_visitor_id'
const COMMENT_MAX_LENGTH = 300

type LessonDiscussionState = {
  isOpen: boolean
  isLoading: boolean
  isSubmitting: boolean
  isLiking: boolean
  isReplySubmitting: boolean
  commentLoginRequired: boolean
  likeCount: number
  likedByMe: boolean
  draft: string
  replyDraft: string
  replyToCommentId: number | null
  error: string
  comments: MicrodocComment[]
  commentLikeLoading: Record<number, boolean>
}

function createDiscussionState(): LessonDiscussionState {
  return {
    isOpen: false,
    isLoading: true,
    isSubmitting: false,
    isLiking: false,
    isReplySubmitting: false,
    commentLoginRequired: true,
    likeCount: 0,
    likedByMe: false,
    draft: '',
    replyDraft: '',
    replyToCommentId: null,
    error: '',
    comments: [],
    commentLikeLoading: {}
  }
}

function generateVisitorId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '')
  }
  return `${Date.now()}${Math.random().toString(36).slice(2, 12)}`
}

function getOrCreateVisitorId() {
  try {
    const existing = localStorage.getItem(VISITOR_STORAGE_KEY)
    if (existing) return existing
    const created = generateVisitorId()
    localStorage.setItem(VISITOR_STORAGE_KEY, created)
    return created
  } catch {
    return generateVisitorId()
  }
}

function formatCommentTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('zh-CN', { hour12: false })
}

function updateCommentLikeSnapshot(
  comments: MicrodocComment[],
  commentId: number,
  likeCount: number,
  likedByMe?: boolean
) {
  return comments.map(comment => {
    if (comment.id !== commentId) return comment
    return {
      ...comment,
      likeCount,
      likedByMe: typeof likedByMe === 'boolean' ? likedByMe : comment.likedByMe
    }
  })
}

function buildCommentTree(comments: MicrodocComment[]) {
  const topLevel: MicrodocComment[] = []
  const repliesByParent = new Map<number, MicrodocComment[]>()

  for (const comment of comments) {
    if (comment.parentCommentId == null) {
      topLevel.push(comment)
      continue
    }
    const list = repliesByParent.get(comment.parentCommentId) || []
    list.push(comment)
    repliesByParent.set(comment.parentCommentId, list)
  }

  const toTime = (value: string) => {
    const ts = new Date(value).getTime()
    return Number.isNaN(ts) ? 0 : ts
  }

  topLevel.sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt) || b.id - a.id)
  for (const list of repliesByParent.values()) {
    list.sort((a, b) => toTime(a.createdAt) - toTime(b.createdAt) || a.id - b.id)
  }

  return { topLevel, repliesByParent }
}

export default function Lessons() {
  const [items, setItems] = React.useState<Lesson[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeLessonId, setActiveLessonId] = React.useState<string | null>(null)
  const [visitorId] = React.useState(() => getOrCreateVisitorId())
  const [discussionByLesson, setDiscussionByLesson] = React.useState<Record<string, LessonDiscussionState>>({})
  const { lessonProgress, setLessonProgress } = useAppStore()
  const user = useAuthStore(s => s.user)
  const actorKey = user ? `user:${user.id}` : `visitor:${visitorId}`

  const updateLessonState = React.useCallback(
    (lessonId: string, updater: (prev: LessonDiscussionState) => LessonDiscussionState) => {
      setDiscussionByLesson(prev => {
        const current = prev[lessonId] || createDiscussionState()
        return {
          ...prev,
          [lessonId]: updater(current)
        }
      })
    },
    []
  )

  React.useEffect(() => {
    let cancelled = false

    fetchJSONC<Lesson[]>('/content/lessons.json')
      .then(data => {
        if (cancelled) return
        setItems(data)
        setActiveLessonId(prev => (prev && data.some(item => item.id === prev) ? prev : data[0]?.id ?? null))
      })
      .catch(() => {
        if (cancelled) return
        setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  React.useEffect(() => {
    if (items.length === 0) return

    let cancelled = false
    setDiscussionByLesson(prev => {
      const next = { ...prev }
      for (const lesson of items) {
        if (!next[lesson.id]) next[lesson.id] = createDiscussionState()
      }
      return next
    })

    Promise.all(
      items.map(async lesson => {
        try {
          const data = await microdocAPI.getEngagement(lesson.id, visitorId)
          return { lessonId: lesson.id, data }
        } catch {
          return { lessonId: lesson.id, data: null }
        }
      })
    ).then(results => {
      if (cancelled) return
      setDiscussionByLesson(prev => {
        const next = { ...prev }
        for (const item of results) {
          const current = next[item.lessonId] || createDiscussionState()
          if (!item.data) {
            next[item.lessonId] = { ...current, isLoading: false }
            continue
          }
          next[item.lessonId] = {
            ...current,
            isLoading: false,
            likeCount: item.data.likeCount,
            likedByMe: item.data.likedByMe,
            comments: item.data.comments,
            commentLoginRequired: item.data.commentLoginRequired !== false
          }
        }
        return next
      })
    })

    return () => {
      cancelled = true
    }
  }, [items, visitorId, user?.id])

  React.useEffect(() => {
    if (items.length === 0) return

    const ws = new WebSocket(getWebSocketUrl('/ws'))
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', channel: 'microdoc' }))
    }
    ws.onmessage = event => {
      try {
        const payload = JSON.parse(String(event.data || '{}'))

        if (payload?.type === 'microdoc_like_updated' && typeof payload?.clipId === 'string') {
          updateLessonState(payload.clipId, state => ({
            ...state,
            likeCount: Number(payload.likeCount || 0),
            likedByMe: payload.actorKey === actorKey ? Boolean(payload.liked) : state.likedByMe
          }))
        }

        if (payload?.type === 'microdoc_comment_added' && typeof payload?.clipId === 'string' && payload?.comment?.id) {
          const incoming = payload.comment as MicrodocComment
          updateLessonState(payload.clipId, state => {
            if (state.comments.some(item => item.id === incoming.id)) return state
            return {
              ...state,
              comments: [incoming, ...state.comments]
            }
          })
        }

        if (
          payload?.type === 'microdoc_comment_like_updated' &&
          typeof payload?.clipId === 'string' &&
          typeof payload?.commentId === 'number'
        ) {
          updateLessonState(payload.clipId, state => ({
            ...state,
            comments: updateCommentLikeSnapshot(
              state.comments,
              Number(payload.commentId),
              Number(payload.likeCount || 0),
              payload.actorKey === actorKey ? Boolean(payload.liked) : undefined
            )
          }))
        }
      } catch (err) {
        console.error('[Lessons] WebSocket message parse error:', err)
      }
    }

    return () => ws.close()
  }, [items.length, actorKey, updateLessonState])

  const selectedLesson = React.useMemo(() => {
    if (items.length === 0) return null
    return items.find(item => item.id === activeLessonId) ?? items[0]
  }, [items, activeLessonId])

  const selectedIndex = React.useMemo(() => {
    if (!selectedLesson) return -1
    return items.findIndex(item => item.id === selectedLesson.id)
  }, [items, selectedLesson])

  const completedCount = React.useMemo(
    () => items.reduce((count, item) => count + (lessonProgress[item.id] ? 1 : 0), 0),
    [items, lessonProgress]
  )

  const selectedDiscussion = React.useMemo(() => {
    if (!selectedLesson) return createDiscussionState()
    return discussionByLesson[selectedLesson.id] || createDiscussionState()
  }, [selectedLesson, discussionByLesson])

  const canComment = !selectedDiscussion.commentLoginRequired || Boolean(user)

  const toggleDiscussion = React.useCallback(
    (lessonId: string) => {
      updateLessonState(lessonId, state => ({ ...state, isOpen: !state.isOpen }))
    },
    [updateLessonState]
  )

  const onDraftChange = React.useCallback(
    (lessonId: string, value: string) => {
      updateLessonState(lessonId, state => ({ ...state, draft: value, error: '' }))
    },
    [updateLessonState]
  )

  const onToggleLike = React.useCallback(
    async (lessonId: string) => {
      updateLessonState(lessonId, state => ({ ...state, isLiking: true, error: '' }))
      try {
        const result = await microdocAPI.toggleLike(lessonId, visitorId)
        updateLessonState(lessonId, state => ({
          ...state,
          isLiking: false,
          likeCount: result.likeCount,
          likedByMe: result.likedByMe
        }))
      } catch (err) {
        updateLessonState(lessonId, state => ({
          ...state,
          isLiking: false,
          error: (err as Error).message || '点赞失败，请稍后重试'
        }))
      }
    },
    [updateLessonState, visitorId]
  )

  const onSubmitComment = React.useCallback(
    async (lessonId: string) => {
      const current = discussionByLesson[lessonId] || createDiscussionState()
      const content = current.draft.trim()
      if (current.commentLoginRequired && !user) {
        updateLessonState(lessonId, state => ({ ...state, error: '当前仅登录用户可评论，请先登录' }))
        return
      }
      if (!content) {
        updateLessonState(lessonId, state => ({ ...state, error: '评论内容不能为空' }))
        return
      }
      if (content.length > COMMENT_MAX_LENGTH) {
        updateLessonState(lessonId, state => ({ ...state, error: `评论最多 ${COMMENT_MAX_LENGTH} 个字符` }))
        return
      }

      updateLessonState(lessonId, state => ({ ...state, isSubmitting: true, error: '' }))
      try {
        const result = await microdocAPI.createComment(lessonId, { content, visitorId })
        updateLessonState(lessonId, state => {
          const exists = state.comments.some(item => item.id === result.comment.id)
          return {
            ...state,
            isSubmitting: false,
            draft: '',
            comments: exists ? state.comments : [result.comment, ...state.comments]
          }
        })
      } catch (err) {
        updateLessonState(lessonId, state => ({
          ...state,
          isSubmitting: false,
          error: (err as Error).message || '发布评论失败'
        }))
      }
    },
    [discussionByLesson, updateLessonState, visitorId, user]
  )

  const onToggleReply = React.useCallback((lessonId: string, commentId: number) => {
    updateLessonState(lessonId, state => ({
      ...state,
      error: '',
      replyToCommentId: state.replyToCommentId === commentId ? null : commentId,
      replyDraft: state.replyToCommentId === commentId ? '' : state.replyDraft
    }))
  }, [updateLessonState])

  const onReplyDraftChange = React.useCallback((lessonId: string, value: string) => {
    updateLessonState(lessonId, state => ({ ...state, replyDraft: value, error: '' }))
  }, [updateLessonState])

  const onSubmitReply = React.useCallback(async (lessonId: string, parentCommentId: number) => {
    const current = discussionByLesson[lessonId] || createDiscussionState()
    const content = current.replyDraft.trim()
    if (current.commentLoginRequired && !user) {
      updateLessonState(lessonId, state => ({ ...state, error: '当前仅登录用户可评论，请先登录' }))
      return
    }
    if (!content) {
      updateLessonState(lessonId, state => ({ ...state, error: '回复内容不能为空' }))
      return
    }
    if (content.length > COMMENT_MAX_LENGTH) {
      updateLessonState(lessonId, state => ({ ...state, error: `评论最多 ${COMMENT_MAX_LENGTH} 个字符` }))
      return
    }

    updateLessonState(lessonId, state => ({ ...state, isReplySubmitting: true, error: '' }))
    try {
      const result = await microdocAPI.createComment(lessonId, {
        content,
        visitorId,
        parentCommentId
      })
      updateLessonState(lessonId, state => {
        const exists = state.comments.some(item => item.id === result.comment.id)
        return {
          ...state,
          isReplySubmitting: false,
          replyDraft: '',
          replyToCommentId: null,
          comments: exists ? state.comments : [result.comment, ...state.comments]
        }
      })
    } catch (err) {
      updateLessonState(lessonId, state => ({
        ...state,
        isReplySubmitting: false,
        error: (err as Error).message || '回复发布失败'
      }))
    }
  }, [discussionByLesson, updateLessonState, visitorId, user])

  const onToggleCommentLike = React.useCallback(async (lessonId: string, commentId: number) => {
    updateLessonState(lessonId, state => ({
      ...state,
      error: '',
      commentLikeLoading: { ...state.commentLikeLoading, [commentId]: true }
    }))
    try {
      const result = await microdocAPI.toggleCommentLike(lessonId, commentId, visitorId)
      updateLessonState(lessonId, state => ({
        ...state,
        comments: updateCommentLikeSnapshot(state.comments, commentId, result.likeCount, result.likedByMe),
        commentLikeLoading: { ...state.commentLikeLoading, [commentId]: false }
      }))
    } catch (err) {
      updateLessonState(lessonId, state => ({
        ...state,
        commentLikeLoading: { ...state.commentLikeLoading, [commentId]: false },
        error: (err as Error).message || '评论点赞失败，请稍后重试'
      }))
    }
  }, [updateLessonState, visitorId])

  const selectedTree = React.useMemo(
    () => buildCommentTree(selectedDiscussion.comments),
    [selectedDiscussion.comments]
  )

  return (
    <div className="mx-auto w-full max-w-[1360px] space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">动作微课（10 课）</h1>
        <p className="mt-1 text-sm text-gray-600">
          基于海盐滚灯老年动作课堂整理，动作节奏慢、细节清晰，适合初学者循序渐进学习。
        </p>
        <p className="mt-2 text-xs text-gray-500">
          学习进度：已完成 {completedCount} / {items.length || 10} 课（本地记录）
        </p>
      </header>

      {items.length > 0 && (
        <section className="card p-3 lg:hidden">
          <h2 className="text-sm font-semibold text-ink-800 dark:text-gray-100">选择课程</h2>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {items.map((lesson, index) => (
              <button
                key={lesson.id}
                type="button"
                onClick={() => setActiveLessonId(lesson.id)}
                className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  selectedLesson?.id === lesson.id
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-gray-300 bg-white text-ink-700 hover:border-brand-300'
                }`}
              >
                第{index + 1}课
              </button>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">课程资源加载中...</p>
      ) : items.length === 0 || !selectedLesson ? (
        <p className="text-sm text-gray-500">未找到课程内容，请检查 `content/lessons.json`。</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-4">
            <article className="card p-4 md:p-5 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                  第 {selectedIndex + 1} 课 / 共 {items.length} 课
                </p>
                <h2 className="text-xl font-semibold text-ink-900 dark:text-gray-100">{selectedLesson.title}</h2>
                {selectedLesson.summary ? (
                  <p className="text-sm text-ink-600 dark:text-gray-300">{selectedLesson.summary}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-gold-300 bg-gold-50 px-2.5 py-1 text-ink-700">
                  建议节拍：{selectedLesson.beats} 拍
                </span>
                {selectedLesson.durationHint ? (
                  <span className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-brand-700">
                    {selectedLesson.durationHint}
                  </span>
                ) : null}
              </div>

              <VideoPlayer
                key={selectedLesson.id}
                size="large"
                poster={selectedLesson.thumb}
                sources={[{ label: '课程视频', src: selectedLesson.clip }]}
              />

              <section className="rounded-lg border border-gold-200 bg-gold-50/40 p-4">
                <h3 className="text-sm font-semibold text-ink-800 dark:text-gray-100">动作要领</h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-ink-700 dark:text-gray-200">
                  {selectedLesson.steps.map((step, idx) => (
                    <li key={`${selectedLesson.id}-step-${idx}`}>{step}</li>
                  ))}
                </ul>
              </section>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-3">
                <label className="text-sm text-ink-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={Boolean(lessonProgress[selectedLesson.id])}
                    onChange={event => setLessonProgress(selectedLesson.id, event.target.checked)}
                  />
                  本课已练习完成
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-ghost !px-3 !py-2 text-sm disabled:opacity-40"
                    onClick={() => setActiveLessonId(items[selectedIndex - 1]?.id ?? selectedLesson.id)}
                    disabled={selectedIndex <= 0}
                  >
                    上一课
                  </button>
                  <button
                    type="button"
                    className="btn !px-3 !py-2 text-sm disabled:opacity-40"
                    onClick={() => setActiveLessonId(items[selectedIndex + 1]?.id ?? selectedLesson.id)}
                    disabled={selectedIndex >= items.length - 1}
                  >
                    下一课
                  </button>
                </div>
              </div>
            </article>

            <section className="card p-4 md:p-5">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-ink-800 dark:text-gray-100"
                  onClick={() => toggleDiscussion(selectedLesson.id)}
                >
                  <span>本课评论区</span>
                  <span className="text-xs font-normal text-ink-500 dark:text-gray-400">
                    {selectedDiscussion.isOpen ? '收起' : '展开'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleLike(selectedLesson.id)}
                  disabled={selectedDiscussion.isLiking}
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    selectedDiscussion.likedByMe
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-300 text-gray-700 hover:border-brand-400 hover:text-brand-700'
                  }`}
                >
                  <span>{selectedDiscussion.likedByMe ? '👍 已赞' : '👍 点赞'}</span>
                  <span className="font-semibold">{selectedDiscussion.likeCount}</span>
                </button>
              </div>

              {selectedDiscussion.isOpen && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-col gap-2">
                    <textarea
                      className="w-full min-h-[92px] rounded-md border bg-transparent px-3 py-2 text-sm"
                      value={selectedDiscussion.draft}
                      maxLength={COMMENT_MAX_LENGTH}
                      disabled={!canComment || selectedDiscussion.isSubmitting}
                      onChange={event => onDraftChange(selectedLesson.id, event.target.value)}
                      placeholder={canComment ? '写下你对本课动作练习的看法...' : '登录后可发表评论'}
                    />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{user ? `当前身份：${user.displayName}` : '当前身份：游客'}</span>
                      <span>{selectedDiscussion.draft.length}/{COMMENT_MAX_LENGTH}</span>
                    </div>
                    {!canComment && (
                      <p className="text-xs text-amber-700">当前评论区仅登录用户可发布，游客可浏览评论内容。</p>
                    )}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="btn"
                        disabled={!canComment || selectedDiscussion.isSubmitting}
                        onClick={() => onSubmitComment(selectedLesson.id)}
                      >
                        {!canComment ? '登录后可评论' : selectedDiscussion.isSubmitting ? '发布中...' : '发布评论'}
                      </button>
                    </div>
                  </div>

                  {selectedDiscussion.error && (
                    <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {selectedDiscussion.error}
                    </div>
                  )}

                  {selectedDiscussion.isLoading ? (
                    <p className="text-sm text-gray-500">评论加载中...</p>
                  ) : selectedTree.topLevel.length === 0 ? (
                    <p className="text-sm text-gray-500">暂无评论，欢迎发布第一条评论。</p>
                  ) : (
                    <ul className="space-y-3">
                      {selectedTree.topLevel.map(comment => {
                        const renderCommentNode = (current: MicrodocComment, depth = 0): React.ReactNode => {
                          const children = selectedTree.repliesByParent.get(current.id) || []
                          const isReplying = selectedDiscussion.replyToCommentId === current.id
                          const isCommentLikeLoading = Boolean(selectedDiscussion.commentLikeLoading[current.id])
                          const depthIndent = Math.min(depth, 5) * 16

                          return (
                            <li key={current.id} className="space-y-2">
                              <article
                                className="rounded-md border border-gray-200 bg-white/70 px-3 py-2"
                                style={depthIndent > 0 ? { marginLeft: `${depthIndent}px` } : undefined}
                              >
                                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-gray-500">
                                  <span className="font-medium text-ink-700 dark:text-gray-200">{current.displayName}</span>
                                  <span>{formatCommentTime(current.createdAt)}</span>
                                </div>
                                <p className="whitespace-pre-wrap break-words text-sm text-ink-700 dark:text-gray-200">
                                  {current.content}
                                </p>
                                <div className="mt-2 flex items-center gap-3 text-xs">
                                  <button
                                    type="button"
                                    disabled={isCommentLikeLoading}
                                    className={`rounded px-2 py-1 transition-colors ${
                                      current.likedByMe
                                        ? 'bg-brand-50 text-brand-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                    onClick={() => onToggleCommentLike(selectedLesson.id, current.id)}
                                  >
                                    {current.likedByMe ? '👍 已赞' : '👍 点赞'} {current.likeCount}
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded px-2 py-1 text-gray-600 transition-colors hover:bg-gray-100"
                                    onClick={() => onToggleReply(selectedLesson.id, current.id)}
                                  >
                                    {isReplying ? '取消回复' : '回复'}
                                  </button>
                                </div>

                                {isReplying && (
                                  <div className="mt-3 space-y-2 rounded-md border border-gray-200 bg-white p-3">
                                    <textarea
                                      className="w-full min-h-[72px] rounded-md border bg-transparent px-3 py-2 text-sm"
                                      value={selectedDiscussion.replyDraft}
                                      maxLength={COMMENT_MAX_LENGTH}
                                      disabled={!canComment || selectedDiscussion.isReplySubmitting}
                                      onChange={event => onReplyDraftChange(selectedLesson.id, event.target.value)}
                                      placeholder={canComment ? '写下你的回复...' : '登录后可回复'}
                                    />
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                      <span>{selectedDiscussion.replyDraft.length}/{COMMENT_MAX_LENGTH}</span>
                                      <button
                                        type="button"
                                        className="btn !px-3 !py-1.5 text-xs"
                                        disabled={!canComment || selectedDiscussion.isReplySubmitting}
                                        onClick={() => onSubmitReply(selectedLesson.id, current.id)}
                                      >
                                        {!canComment ? '登录后可回复' : selectedDiscussion.isReplySubmitting ? '发布中...' : '发布回复'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </article>

                              {children.length > 0 && (
                                <ul className="space-y-2">
                                  {children.map(child => renderCommentNode(child, depth + 1))}
                                </ul>
                              )}
                            </li>
                          )
                        }

                        return renderCommentNode(comment)
                      })}
                    </ul>
                  )}
                </div>
              )}
            </section>
          </section>

          <aside className="hidden lg:block">
            <div className="card p-3 lg:sticky lg:top-24">
              <h2 className="text-sm font-semibold text-ink-800 dark:text-gray-100">课程选择</h2>
              <ul className="mt-3 space-y-2">
                {items.map((lesson, index) => {
                  const active = lesson.id === selectedLesson.id
                  const done = Boolean(lessonProgress[lesson.id])
                  return (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        onClick={() => setActiveLessonId(lesson.id)}
                        className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                          active
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-ink-800 dark:text-gray-100">
                            第{index + 1}课
                          </span>
                          <span className={`text-xs ${done ? 'text-emerald-600' : 'text-gray-500'}`}>
                            {done ? '已完成' : '未完成'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-ink-600 dark:text-gray-300">{lesson.title}</p>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
