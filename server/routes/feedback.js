/**
 * 反馈路由
 * Feedback Routes
 */

import express from 'express'
import { FeedbackDB, SessionDB } from '../db/mock.js'
import { broadcast } from '../index.js'

const router = express.Router()

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
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Invalid rating',
        message: '请提供1-5的评分'
      })
    }

    // 准备数据
    const feedbackData = {
      user_id: req.user.id,
      role: req.user.role,
      feedback_type: feedbackType,
      class_id: classId || req.user.classId,
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
      rating,
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

    const filters = {
      role,
      class_id,
      status,
      feedback_type,
      limit: parseInt(limit)
    }

    // 教师可以查看本班所有反馈
    // 学生只能查看自己的反馈
    if (req.user.role === 'student') {
      // 学生只能查看自己的
      const feedbacks = FeedbackDB.list({ ...filters, user_id: req.user.id })
      return res.json({ success: true, feedbacks })
    }

    // 教师查看本班或全部
    if (req.user.role === 'teacher' && !filters.class_id) {
      filters.class_id = req.user.classId
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

    // 权限检查：学生只能查看自己的，教师可以查看本班的
    if (req.user.role === 'student' && feedback.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '无权查看此反馈'
      })
    }

    if (req.user.role === 'teacher' && feedback.class_id !== req.user.classId) {
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

    const validStatuses = ['pending', 'reviewed', 'resolved', 'archived']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: '无效的状态值'
      })
    }

    FeedbackDB.updateStatus(id, status, req.user.id)
    const feedback = FeedbackDB.findById(id)

    // 广播状态更新
    broadcast('feedback', {
      type: 'feedback_updated',
      data: feedback
    })

    res.json({
      success: true,
      message: '状态已更新',
      feedback
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
 * 删除反馈（仅管理员）
 */
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params

    // 只有管理员可以删除
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: '只有管理员可以删除反馈'
      })
    }

    FeedbackDB.delete(id)

    res.json({
      success: true,
      message: '反馈已删除'
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

    const results = []
    for (const fb of feedbacks) {
      try {
        const feedbackData = {
          user_id: fb.userId,
          role: 'student',
          feedback_type: fb.feedbackType || 'general',
          class_id: req.user.classId,
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
