import React from 'react'
import VideoPlayer from '../components/VideoPlayer'
import { fetchJSONC } from '../lib/api'
import { getWebSocketUrl, microdocAPI, type MicrodocComment } from '../lib/apiClient'
import { useAuthStore } from '../lib/authStore'
import type { MicrodocClip } from '../types/content'

const VISITOR_STORAGE_KEY = 'microdoc_visitor_id'
const COMMENT_MAX_LENGTH = 300

type ClipDiscussionState = {
  isOpen: boolean
  isLoading: boolean
  isSubmitting: boolean
  isLiking: boolean
  commentLoginRequired: boolean
  likeCount: number
  likedByMe: boolean
  draft: string
  error: string
  comments: MicrodocComment[]
}

function createDiscussionState(): ClipDiscussionState {
  return {
    isOpen: false,
    isLoading: true,
    isSubmitting: false,
    isLiking: false,
    commentLoginRequired: true,
    likeCount: 0,
    likedByMe: false,
    draft: '',
    error: '',
    comments: []
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

export default function Microdoc() {
  const user = useAuthStore(s => s.user)
  const [playlist, setPlaylist] = React.useState<MicrodocClip[]>([])
  const [visitorId] = React.useState(() => getOrCreateVisitorId())
  const [discussionByClip, setDiscussionByClip] = React.useState<Record<string, ClipDiscussionState>>({})
  const actorKey = user ? `user:${user.id}` : `visitor:${visitorId}`

  const updateClipState = React.useCallback((clipId: string, updater: (prev: ClipDiscussionState) => ClipDiscussionState) => {
    setDiscussionByClip(prev => {
      const current = prev[clipId] || createDiscussionState()
      return {
        ...prev,
        [clipId]: updater(current)
      }
    })
  }, [])

  React.useEffect(() => {
    fetchJSONC<MicrodocClip[]>('/content/microdoc.json')
      .then(setPlaylist)
      .catch(() => setPlaylist([]))
  }, [])

  React.useEffect(() => {
    if (playlist.length === 0) return

    let cancelled = false
    setDiscussionByClip(prev => {
      const next = { ...prev }
      for (const clip of playlist) {
        if (!next[clip.id]) next[clip.id] = createDiscussionState()
      }
      return next
    })

    Promise.all(
      playlist.map(async clip => {
        try {
          const data = await microdocAPI.getEngagement(clip.id, visitorId)
          return { clipId: clip.id, data }
        } catch {
          return { clipId: clip.id, data: null }
        }
      })
    ).then(results => {
      if (cancelled) return
      setDiscussionByClip(prev => {
        const next = { ...prev }
        for (const item of results) {
          const current = next[item.clipId] || createDiscussionState()
          if (!item.data) {
            next[item.clipId] = { ...current, isLoading: false }
            continue
          }
          next[item.clipId] = {
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
  }, [playlist, visitorId, user?.id])

  React.useEffect(() => {
    if (playlist.length === 0) return

    const ws = new WebSocket(getWebSocketUrl('/ws'))
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', channel: 'microdoc' }))
    }
    ws.onmessage = event => {
      try {
        const payload = JSON.parse(String(event.data || '{}'))

        if (payload?.type === 'microdoc_like_updated' && typeof payload?.clipId === 'string') {
          updateClipState(payload.clipId, state => ({
            ...state,
            likeCount: Number(payload.likeCount || 0),
            likedByMe: payload.actorKey === actorKey ? Boolean(payload.liked) : state.likedByMe
          }))
        }

        if (payload?.type === 'microdoc_comment_added' && typeof payload?.clipId === 'string' && payload?.comment?.id) {
          const incoming = payload.comment as MicrodocComment
          updateClipState(payload.clipId, state => {
            if (state.comments.some(item => item.id === incoming.id)) return state
            return {
              ...state,
              comments: [incoming, ...state.comments]
            }
          })
        }
      } catch (err) {
        console.error('[Microdoc] WebSocket message parse error:', err)
      }
    }

    return () => ws.close()
  }, [playlist.length, actorKey, updateClipState])

  const toggleDiscussion = React.useCallback((clipId: string) => {
    updateClipState(clipId, state => ({ ...state, isOpen: !state.isOpen }))
  }, [updateClipState])

  const onDraftChange = React.useCallback((clipId: string, value: string) => {
    updateClipState(clipId, state => ({ ...state, draft: value, error: '' }))
  }, [updateClipState])

  const onToggleLike = React.useCallback(async (clipId: string) => {
    updateClipState(clipId, state => ({ ...state, isLiking: true, error: '' }))
    try {
      const result = await microdocAPI.toggleLike(clipId, visitorId)
      updateClipState(clipId, state => ({
        ...state,
        isLiking: false,
        likeCount: result.likeCount,
        likedByMe: result.likedByMe
      }))
    } catch (err) {
      updateClipState(clipId, state => ({
        ...state,
        isLiking: false,
        error: (err as Error).message || '点赞失败，请稍后重试'
      }))
    }
  }, [updateClipState, visitorId])

  const onSubmitComment = React.useCallback(async (clipId: string) => {
    const current = discussionByClip[clipId] || createDiscussionState()
    const content = current.draft.trim()
    if (current.commentLoginRequired && !user) {
      updateClipState(clipId, state => ({ ...state, error: '当前仅登录用户可评论，请先登录' }))
      return
    }
    if (!content) {
      updateClipState(clipId, state => ({ ...state, error: '评论内容不能为空' }))
      return
    }
    if (content.length > COMMENT_MAX_LENGTH) {
      updateClipState(clipId, state => ({ ...state, error: `评论最多 ${COMMENT_MAX_LENGTH} 个字符` }))
      return
    }

    updateClipState(clipId, state => ({ ...state, isSubmitting: true, error: '' }))
    try {
      const result = await microdocAPI.createComment(clipId, { content, visitorId })
      updateClipState(clipId, state => {
        const exists = state.comments.some(item => item.id === result.comment.id)
        return {
          ...state,
          isSubmitting: false,
          draft: '',
          comments: exists ? state.comments : [result.comment, ...state.comments]
        }
      })
    } catch (err) {
      updateClipState(clipId, state => ({
        ...state,
        isSubmitting: false,
        error: (err as Error).message || '发布评论失败'
      }))
    }
  }, [discussionByClip, updateClipState, visitorId, user])

  return (
    <div className="mx-auto w-full max-w-[1360px] space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">微纪录片展示</h1>
        <p className="text-sm text-gray-500">微纪录片内容持续更新中，点击下方视频即可播放。</p>
      </header>

      {playlist.length === 0 ? (
        <p className="text-sm text-gray-500">加载微纪录片资源中…</p>
      ) : (
        <ul className="space-y-6">
          {playlist.map(item => {
            const discussion = discussionByClip[item.id] || createDiscussionState()
            const canComment = !discussion.commentLoginRequired || Boolean(user)
            return (
              <li key={item.id} className="space-y-3">
                <h3 className="font-medium mb-2">{item.title}</h3>
                <VideoPlayer
                  sources={item.sources}
                  poster={item.poster}
                  iframeSrc={item.iframeSrc}
                  iframeTitle={item.iframeTitle}
                  size="large"
                />

                <section className="card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-ink-800 dark:text-gray-100"
                      onClick={() => toggleDiscussion(item.id)}
                    >
                      <span>评论区</span>
                      <span className="text-xs font-normal text-ink-500 dark:text-gray-400">
                        {discussion.isOpen ? '收起' : '展开'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleLike(item.id)}
                      disabled={discussion.isLiking}
                      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                        discussion.likedByMe
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-gray-300 text-gray-700 hover:border-brand-400 hover:text-brand-700'
                      }`}
                    >
                      <span>{discussion.likedByMe ? '👍 已赞' : '👍 点赞'}</span>
                      <span className="font-semibold">{discussion.likeCount}</span>
                    </button>
                  </div>

                  {discussion.isOpen && (
                    <div className="mt-4 space-y-3">
                      <div className="flex flex-col gap-2">
                        <textarea
                          className="w-full min-h-[92px] rounded-md border bg-transparent px-3 py-2 text-sm"
                          value={discussion.draft}
                          maxLength={COMMENT_MAX_LENGTH}
                          disabled={!canComment || discussion.isSubmitting}
                          onChange={event => onDraftChange(item.id, event.target.value)}
                          placeholder={canComment ? '写下你对这条微纪录片的看法...' : '登录后可发表评论'}
                        />
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{user ? `当前身份：${user.displayName}` : '当前身份：游客'}</span>
                          <span>{discussion.draft.length}/{COMMENT_MAX_LENGTH}</span>
                        </div>
                        {!canComment && (
                          <p className="text-xs text-amber-700">
                            当前评论区仅登录用户可发布，游客可浏览评论内容。
                          </p>
                        )}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className="btn"
                            disabled={!canComment || discussion.isSubmitting}
                            onClick={() => onSubmitComment(item.id)}
                          >
                            {!canComment ? '登录后可评论' : discussion.isSubmitting ? '发布中...' : '发布评论'}
                          </button>
                        </div>
                      </div>

                      {discussion.error && (
                        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                          {discussion.error}
                        </div>
                      )}

                      {discussion.isLoading ? (
                        <p className="text-sm text-gray-500">评论加载中...</p>
                      ) : discussion.comments.length === 0 ? (
                        <p className="text-sm text-gray-500">暂无评论，欢迎发布第一条评论。</p>
                      ) : (
                        <ul className="space-y-3">
                          {discussion.comments.map(comment => (
                            <li key={comment.id} className="rounded-md border border-gray-200 bg-white/60 px-3 py-2">
                              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-gray-500">
                                <span className="font-medium text-ink-700 dark:text-gray-200">{comment.displayName}</span>
                                <span>{formatCommentTime(comment.createdAt)}</span>
                              </div>
                              <p className="whitespace-pre-wrap break-words text-sm text-ink-700 dark:text-gray-200">
                                {comment.content}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </section>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
