import express from 'express'
import { MicrodocDB, SessionDB } from '../db/index.js'
import { broadcast } from '../index.js'

const router = express.Router()
const CLIP_ID_RE = /^[a-zA-Z0-9_-]{2,80}$/
const VISITOR_ID_RE = /^[a-zA-Z0-9_-]{8,80}$/
const COMMENT_MAX_LENGTH = 300
const COMMENT_LOGIN_REQUIRED = String(process.env.MICRODOC_COMMENT_LOGIN_REQUIRED || 'true').toLowerCase() !== 'false'

function normalizeClipId(rawClipId) {
  const clipId = String(rawClipId || '').trim()
  if (!CLIP_ID_RE.test(clipId)) return null
  return clipId
}

function normalizeVisitorId(rawVisitorId) {
  const visitorId = String(rawVisitorId || '').trim()
  if (!visitorId) return null
  if (!VISITOR_ID_RE.test(visitorId)) return null
  return visitorId
}

function authOptional(req, _res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    req.user = null
    return next()
  }

  const session = SessionDB.findValid(token)
  if (!session) {
    req.user = null
    return next()
  }

  req.user = {
    id: session.user_id,
    username: session.username,
    displayName: session.display_name || session.username,
    role: session.role,
    classId: session.class_id
  }
  next()
}

function resolveActor(req, rawVisitorId, requireActor = true) {
  if (req.user) {
    return {
      actorKey: `user:${req.user.id}`,
      userId: req.user.id,
      visitorId: null
    }
  }

  const visitorId = normalizeVisitorId(rawVisitorId)
  if (!visitorId) {
    return requireActor ? null : { actorKey: null, userId: null, visitorId: null }
  }

  return {
    actorKey: `visitor:${visitorId}`,
    userId: null,
    visitorId
  }
}

router.get('/:clipId', authOptional, (req, res) => {
  try {
    const clipId = normalizeClipId(req.params.clipId)
    if (!clipId) {
      return res.status(400).json({ error: 'Invalid clipId', message: '视频标识不合法' })
    }

    const actor = resolveActor(req, req.query.visitorId, false)
    const likeCount = MicrodocDB.countLikes(clipId)
    const likedByMe = actor.actorKey ? MicrodocDB.hasLiked(clipId, actor.actorKey) : false
    const comments = MicrodocDB.listComments(clipId, 200)

    res.json({
      success: true,
      data: {
        clipId,
        likeCount,
        likedByMe,
        comments,
        commentLoginRequired: COMMENT_LOGIN_REQUIRED
      }
    })
  } catch (err) {
    console.error('[Microdoc] Get engagement error:', err)
    res.status(500).json({ error: 'Failed to fetch engagement', message: '获取评论区数据失败' })
  }
})

router.post('/:clipId/like', authOptional, (req, res) => {
  try {
    const clipId = normalizeClipId(req.params.clipId)
    if (!clipId) {
      return res.status(400).json({ error: 'Invalid clipId', message: '视频标识不合法' })
    }

    const actor = resolveActor(req, req.body?.visitorId, true)
    if (!actor) {
      return res.status(400).json({
        error: 'Missing actor',
        message: '请先登录或刷新页面后重试点赞'
      })
    }

    const result = MicrodocDB.toggleLike({
      clipId,
      actorKey: actor.actorKey,
      userId: actor.userId,
      visitorId: actor.visitorId
    })

    broadcast('microdoc', {
      type: 'microdoc_like_updated',
      clipId,
      likeCount: result.likeCount,
      actorKey: actor.actorKey,
      liked: result.liked
    })

    res.json({
      success: true,
      data: {
        clipId,
        likeCount: result.likeCount,
        likedByMe: result.liked
      }
    })
  } catch (err) {
    console.error('[Microdoc] Toggle like error:', err)
    res.status(500).json({ error: 'Failed to toggle like', message: '点赞失败，请稍后重试' })
  }
})

router.post('/:clipId/comments', authOptional, (req, res) => {
  try {
    const clipId = normalizeClipId(req.params.clipId)
    if (!clipId) {
      return res.status(400).json({ error: 'Invalid clipId', message: '视频标识不合法' })
    }

    const content = String(req.body?.content || '').trim()
    if (!content) {
      return res.status(400).json({ error: 'Invalid content', message: '评论内容不能为空' })
    }
    if (content.length > COMMENT_MAX_LENGTH) {
      return res.status(400).json({
        error: 'Content too long',
        message: `评论最多 ${COMMENT_MAX_LENGTH} 个字符`
      })
    }

    if (COMMENT_LOGIN_REQUIRED && !req.user) {
      return res.status(403).json({
        error: 'Login required',
        message: '请先登录后再发表评论'
      })
    }

    const actor = resolveActor(req, req.body?.visitorId, true)
    if (!actor) {
      return res.status(400).json({
        error: 'Missing actor',
        message: '请先登录或刷新页面后再评论'
      })
    }

    const displayName = req.user
      ? (req.user.displayName || req.user.username || '用户')
      : `游客${String(actor.visitorId).slice(-4)}`

    const created = MicrodocDB.createComment({
      clip_id: clipId,
      user_id: actor.userId,
      username: req.user?.username || null,
      display_name: displayName,
      content,
      visitor_id: actor.visitorId
    })
    const comment = MicrodocDB.findCommentById(created.lastInsertRowid)

    broadcast('microdoc', {
      type: 'microdoc_comment_added',
      clipId,
      comment
    })

    res.json({
      success: true,
      message: '评论已发布',
      data: {
        clipId,
        comment
      }
    })
  } catch (err) {
    console.error('[Microdoc] Create comment error:', err)
    res.status(500).json({ error: 'Failed to create comment', message: '发布评论失败，请稍后重试' })
  }
})

export default router
