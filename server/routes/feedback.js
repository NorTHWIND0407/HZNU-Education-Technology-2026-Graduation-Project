/**
 * 反馈路由
 * Feedback Routes
 */

import express from 'express'
import { FeedbackDB, SessionDB } from '../db/index.js'
import { broadcast } from '../index.js'

const router = express.Router()
const VALID_STATUSES = ['pending', 'reviewed', 'resolved', 'archived']

// 认证中间件
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: '需要登录' })
  }

  const session = SessionDB.findValid(token)
  if (!session) {
    return res.status(401).json({ error: 'Invalid session', message: '会话已过期' })
  }

  req.user = {
    id: session.user_id,
    username: session.username,
    role: session.role,
    classId: session.class_id
  }

  next()
}

function normalizeClassId(rawClassId) {
  const value = String(rawClassId || '').trim().toLowerCase()
  if (!value) return null
  return value.startsWith('class_') ? value : `class_${value}`
}

function sameClass(left, right) {
  return normalizeClassId(left) === normalizeClassId(right)
}

function canReadFeedback(user, feedback) {
  if (user.role === 'admin') return true
  if (user.role === 'teacher') return sameClass(user.classId, feedback.class_id)
  return feedback.user_id === user.id
}

function canManageFeedback(user, feedback) {
  if (user.role === 'admin') return true
  if (user.role === 'teacher') return sameClass(user.classId, feedback.class_id)
  return false
}

function canEditOwnFeedback(user, feedback) {
  return user.role === 'student' && feedback.user_id === user.id
}

/**
 * POST /api/feedback
 * 提交反馈
 */
router.post('/', authMiddleware, (req, res) => {
  try {
    const {
      feedbackType = 'general',
      classId,
      grade,
      modulesUsed,
      lessonId,
      understandingScore,
      interestScore,
      difficultyScore,
      difficultyAspects,
      teachingEffectiveness,
      studentEngagement,
      technicalIssues,
      openComment,
      suggestions,
      rating,
      tags
    } = req.body

    // 验证必填字段
    const numericRating = Number(rating)
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        error: 'Invalid rating',
        message: '请提供1-5的评分'
      })
    }

    const ownClassId = normalizeClassId(req.user.classId)
    const requestedClassId = normalizeClassId(classId)
    let targetClassId = requestedClassId || ownClassId

    if (req.user.role === 'student') {
      targetClassId = ownClassId
    }

    if (req.user.role === 'teacher') {
      if (!ownClassId) {
        return res.status(400).json({
          error: 'Missing class',
          message: '教师账号未绑定班级'
        })
      }
      if (requestedClassId && requestedClassId !== ownClassId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: '教师只能提交本班反馈'
        })
      }
      targetClassId = ownClassId
    }

    // 准备数据
    const feedbackData = {
      user_id: req.user.id,
      role: req.user.role,
      feedback_type: feedbackType,
      class_id: targetClassId,
      grade,
      modules_used: modulesUsed ? JSON.stringify(modulesUsed) : null,
      lesson_id: lessonId,
      understanding_score: understandingScore,
      interest_score: interestScore,
      difficulty_score: difficultyScore,
      difficulty_aspects: difficultyAspects ? JSON.stringify(difficultyAspects) : null,
      teaching_effectiveness: teachingEffectiveness,
      student_engagement: studentEngagement,
      technical_issues: technicalIssues,
      open_comment: openComment,
      suggestions,
      rating: numericRating,
      tags: tags ? JSON.stringify(tags) : null,
      status: 'pending'
    }

    const result = FeedbackDB.create(feedbackData)
    const feedback = FeedbackDB.findById(result.lastInsertRowid)

    // 广播新反馈（WebSocket实时更新）
    broadcast('feedback', {
      type: 'new_feedback',
      data: feedback
    })

    res.json({
      success: true,
      message: '反馈提交成功',
      feedback
    })
  } catch (err) {
    console.error('[Feedback] Submit error:', err)
    res.status(500).json({
      error: 'Submit failed',
      message: '提交失败，请稍后重试'
    })
  }
})

/**
 * GET /api/feedback
 * 获取反馈列表
 */
router.get('/', authMiddleware, (req, res) => {
  try {
    const { role, class_id, status, feedback_type, limit = 50 } = req.query
    const parsedLimit = Number.parseInt(String(limit), 10)
    const normalizedClassId = class_id ? normalizeClassId(class_id) : null

    const filters = {
      role,
      status,
      feedback_type,
      limit: Number.isNaN(parsedLimit) ? 50 : parsedLimit
    }

    // 教师可以查看本班所有反馈
    // 学生只能查看自己的反馈
    if (req.user.role === 'student') {
      // 学生只能查看自己的
      const feedbacks = FeedbackDB.list({ ...filters, user_id: req.user.id })
      return res.json({ success: true, feedbacks })
    }

    if (req.user.role === 'teacher') {
      const ownClassId = normalizeClassId(req.user.classId)
      if (!ownClassId) {
        return res.status(400).json({
          error: 'Missing class',
          message: '教师账号未绑定班级'
        })
      }
      if (normalizedClassId && normalizedClassId !== ownClassId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: '教师只能查看本班反馈'
        })
      }
      filters.class_id = ownClassId
    } else if (normalizedClassId) {
      filters.class_id = normalizedClassId
    }

    const feedbacks = FeedbackDB.list(filters)

    res.json({
      success: true,
      feedbacks,
      count: feedbacks.length
    })
  } catch (err) {
    console.error('[Feedback] List error:', err)
    res.status(500).json({
      error: 'Failed to fetch feedbacks',
      message: '获取反馈列表失败'
    })
  }
})

/**
 * GET /api/feedback/:id
 * 获取单个反馈详情
 */
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params
    const feedback = FeedbackDB.findById(id)

    if (!feedback) {
      return res.status(404).json({
        error: 'Not found',
        message: '反馈不存在'
      })
    }

    if (!canReadFeedback(req.user, feedback)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '无权查看此反馈'
      })
    }

    res.json({
      success: true,
      feedback
    })
  } catch (err) {
    console.error('[Feedback] Get error:', err)
    res.status(500).json({
      error: 'Failed to fetch feedback',
      message: '获取反馈失败'
    })
  }
})

/**
 * PATCH /api/feedback/:id
 * 更新反馈（学生可改自己；教师/管理员可管理班级）
 */
router.patch('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params
    const feedback = FeedbackDB.findById(id)
    if (!feedback) {
      return res.status(404).json({
        error: 'Not found',
        message: '反馈不存在'
      })
    }

    const managerAllowed = ['teacher', 'admin'].includes(req.user.role) && canManageFeedback(req.user, feedback)
    const studentAllowed = canEditOwnFeedback(req.user, feedback)
    if (!managerAllowed && !studentAllowed) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '无权修改此反馈'
      })
    }

    const {
      feedbackType,
      classId,
      grade,
      modulesUsed,
      lessonId,
      understandingScore,
      interestScore,
      difficultyScore,
      difficultyAspects,
      teachingEffectiveness,
      studentEngagement,
      technicalIssues,
      openComment,
      suggestions,
      rating,
      tags,
      status,
      adminNotes
    } = req.body

    const updates = {}
    const isStudent = req.user.role === 'student'

    if (isStudent && classId !== undefined) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '学生不能修改班级'
      })
    }
    if (isStudent && status !== undefined) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '学生不能修改反馈状态'
      })
    }
    if (isStudent && adminNotes !== undefined) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '学生不能修改管理员备注'
      })
    }

    if (feedbackType !== undefined) updates.feedback_type = feedbackType
    if (grade !== undefined) updates.grade = grade
    if (lessonId !== undefined) updates.lesson_id = lessonId
    if (understandingScore !== undefined) updates.understanding_score = understandingScore
    if (interestScore !== undefined) updates.interest_score = interestScore
    if (difficultyScore !== undefined) updates.difficulty_score = difficultyScore
    if (!isStudent && teachingEffectiveness !== undefined) updates.teaching_effectiveness = teachingEffectiveness
    if (!isStudent && studentEngagement !== undefined) updates.student_engagement = studentEngagement
    if (!isStudent && technicalIssues !== undefined) updates.technical_issues = technicalIssues
    if (openComment !== undefined) updates.open_comment = openComment
    if (suggestions !== undefined) updates.suggestions = suggestions
    if (modulesUsed !== undefined) updates.modules_used = modulesUsed ? JSON.stringify(modulesUsed) : null
    if (difficultyAspects !== undefined) updates.difficulty_aspects = difficultyAspects ? JSON.stringify(difficultyAspects) : null
    if (tags !== undefined) updates.tags = tags ? JSON.stringify(tags) : null
    if (!isStudent && adminNotes !== undefined) updates.admin_notes = adminNotes

    if (rating !== undefined) {
      const numericRating = Number(rating)
      if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({
          error: 'Invalid rating',
          message: '评分必须在 1-5 之间'
        })
      }
      updates.rating = numericRating
    }

    if (classId !== undefined) {
      const normalizedClassId = normalizeClassId(classId)
      if (!normalizedClassId) {
        return res.status(400).json({
          error: 'Invalid classId',
          message: '班级不能为空'
        })
      }
      if (req.user.role === 'teacher' && !sameClass(req.user.classId, normalizedClassId)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: '教师只能修改本班反馈'
        })
      }
      updates.class_id = normalizedClassId
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          message: '无效的状态值'
        })
      }
    }

    const hasFieldUpdates = Object.keys(updates).length > 0
    const hasStatusUpdate = !isStudent && status !== undefined

    if (!hasFieldUpdates && !hasStatusUpdate) {
      return res.status(400).json({
        error: 'No updates',
        message: '没有可更新的字段'
      })
    }

    if (hasFieldUpdates) {
      FeedbackDB.update(id, updates)
    }

    if (hasStatusUpdate) {
      FeedbackDB.updateStatus(id, status, req.user.id)
    }

    const updatedFeedback = FeedbackDB.findById(id)

    broadcast('feedback', {
      type: 'feedback_updated',
      data: updatedFeedback
    })

    res.json({
      success: true,
      message: '反馈已更新',
      feedback: updatedFeedback
    })
  } catch (err) {
    console.error('[Feedback] Update error:', err)
    res.status(500).json({
      error: 'Failed to update feedback',
      message: '更新反馈失败'
    })
  }
})

/**
 * PATCH /api/feedback/:id/status
 * 更新反馈状态（教师/管理员）
 */
router.patch('/:id/status', authMiddleware, (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    // 只有教师和管理员可以更新状态
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '无权修改反馈状态'
      })
    }

    const feedback = FeedbackDB.findById(id)
    if (!feedback) {
      return res.status(404).json({
        error: 'Not found',
        message: '反馈不存在'
      })
    }

    if (!canManageFeedback(req.user, feedback)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '无权修改此反馈'
      })
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: '无效的状态值'
      })
    }

    FeedbackDB.updateStatus(id, status, req.user.id)
    const updatedFeedback = FeedbackDB.findById(id)

    // 广播状态更新
    broadcast('feedback', {
      type: 'feedback_updated',
      data: updatedFeedback
    })

    res.json({
      success: true,
      message: '状态已更新',
      feedback: updatedFeedback
    })
  } catch (err) {
    console.error('[Feedback] Update status error:', err)
    res.status(500).json({
      error: 'Failed to update status',
      message: '更新状态失败'
    })
  }
})

/**
 * DELETE /api/feedback/:id
 * 删除反馈（学生可撤回自己的；教师/管理员可管理班级）
 */
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params

    const feedback = FeedbackDB.findById(id)
    if (!feedback) {
      return res.status(404).json({
        error: 'Not found',
        message: '反馈不存在'
      })
    }

    const managerAllowed = ['teacher', 'admin'].includes(req.user.role) && canManageFeedback(req.user, feedback)
    const studentAllowed = canEditOwnFeedback(req.user, feedback)
    if (!managerAllowed && !studentAllowed) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '无权撤回/删除此反馈'
      })
    }

    FeedbackDB.delete(id)

    broadcast('feedback', {
      type: 'feedback_deleted',
      data: { id: Number(id) }
    })

    res.json({
      success: true,
      message: studentAllowed ? '反馈已撤回' : '反馈已删除'
    })
  } catch (err) {
    console.error('[Feedback] Delete error:', err)
    res.status(500).json({
      error: 'Failed to delete feedback',
      message: '删除失败'
    })
  }
})

/**
 * POST /api/feedback/batch
 * 批量提交反馈（教师为学生批量提交）
 */
router.post('/batch', authMiddleware, (req, res) => {
  try {
    // 只有教师可以批量提交
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        error: 'Forbidden',
        message: '只有教师可以批量提交'
      })
    }

    const { feedbacks } = req.body

    if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
      return res.status(400).json({
        error: 'Invalid data',
        message: '请提供反馈数组'
      })
    }

    const teacherClassId = normalizeClassId(req.user.classId)
    if (!teacherClassId) {
      return res.status(400).json({
        error: 'Missing class',
        message: '教师账号未绑定班级'
      })
    }

    const results = []
    for (const fb of feedbacks) {
      try {
        const feedbackData = {
          user_id: fb.userId,
          role: 'student',
          feedback_type: fb.feedbackType || 'general',
          class_id: teacherClassId,
          grade: fb.grade,
          modules_used: fb.modulesUsed ? JSON.stringify(fb.modulesUsed) : null,
          understanding_score: fb.understandingScore,
          interest_score: fb.interestScore,
          difficulty_score: fb.difficultyScore,
          open_comment: fb.openComment,
          rating: fb.rating,
          status: 'pending'
        }

        const result = FeedbackDB.create(feedbackData)
        results.push({ success: true, id: result.lastInsertRowid })
      } catch (err) {
        results.push({ success: false, error: err.message })
      }
    }

    res.json({
      success: true,
      message: `成功提交 ${results.filter(r => r.success).length}/${feedbacks.length} 条反馈`,
      results
    })
  } catch (err) {
    console.error('[Feedback] Batch submit error:', err)
    res.status(500).json({
      error: 'Batch submit failed',
      message: '批量提交失败'
    })
  }
})

export default router
