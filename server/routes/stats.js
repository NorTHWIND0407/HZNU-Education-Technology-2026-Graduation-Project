/**
 * 统计数据路由
 * Statistics Routes
 */

import express from 'express'
import { StatsDB, SessionDB, FeedbackDB } from '../db/index.js'

const router = express.Router()

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
    role: session.role,
    classId: session.class_id
  }

  next()
}

function toFiniteNumber(value, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function average(values) {
  if (!values.length) return 0
  const sum = values.reduce((acc, item) => acc + item, 0)
  return sum / values.length
}

function toCsvValue(value) {
  if (value == null) return '""'
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

router.get('/overview', authMiddleware, (req, res) => {
  try {
    const overview = StatsDB.overview()

    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('[Stats] Overview error:', err)
    res.status(500).json({
      error: 'Failed to fetch overview',
      message: '获取概览统计失败'
    })
  }
})

router.get('/module-usage', authMiddleware, (req, res) => {
  try {
    const data = StatsDB.moduleUsage()

    const chartData = data.map(item => ({
      module: item.module_name || item.module || 'unknown',
      usage: toFiniteNumber(item.total_visits ?? item.usage_count, 0),
      uniqueUsers: toFiniteNumber(item.unique_users, 0),
      avgCompletion: Math.round(toFiniteNumber(item.avg_completion, 0))
    }))

    res.json({
      success: true,
      data: chartData
    })
  } catch (err) {
    console.error('[Stats] Module usage error:', err)
    res.status(500).json({
      error: 'Failed to fetch module usage',
      message: '获取模块使用统计失败'
    })
  }
})

router.get('/rating-trend', authMiddleware, (req, res) => {
  try {
    const { days = 30 } = req.query
    const data = StatsDB.ratingTrend(parseInt(days, 10))

    const chartData = data.map(item => ({
      time: item.date,
      score: parseFloat(toFiniteNumber(item.avg_rating, 0).toFixed(2)),
      count: toFiniteNumber(item.count, 0),
      understanding: parseFloat(toFiniteNumber(item.avg_understanding, 0).toFixed(2)),
      interest: parseFloat(toFiniteNumber(item.avg_interest, 0).toFixed(2))
    }))

    res.json({
      success: true,
      data: chartData
    })
  } catch (err) {
    console.error('[Stats] Rating trend error:', err)
    res.status(500).json({
      error: 'Failed to fetch rating trend',
      message: '获取评分趋势失败'
    })
  }
})

router.get('/interest-distribution', authMiddleware, (req, res) => {
  try {
    const data = StatsDB.interestDistribution()

    const chartData = data.map(item => ({
      label: `${item.score}分`,
      value: item.count
    }))

    res.json({
      success: true,
      data: chartData
    })
  } catch (err) {
    console.error('[Stats] Interest distribution error:', err)
    res.status(500).json({
      error: 'Failed to fetch interest distribution',
      message: '获取兴趣度分布失败'
    })
  }
})

router.get('/understanding-distribution', authMiddleware, (req, res) => {
  try {
    const data = StatsDB.understandingDistribution()

    const chartData = data.map(item => ({
      label: `${item.score}分`,
      value: item.count
    }))

    res.json({
      success: true,
      data: chartData
    })
  } catch (err) {
    console.error('[Stats] Understanding distribution error:', err)
    res.status(500).json({
      error: 'Failed to fetch understanding distribution',
      message: '获取理解度分布失败'
    })
  }
})

router.get('/class-performance', authMiddleware, (req, res) => {
  try {
    let data = StatsDB.classPerformance()

    if (req.user.role === 'teacher') {
      data = data.filter(item => item.class_id === req.user.classId)
    }

    res.json({
      success: true,
      data
    })
  } catch (err) {
    console.error('[Stats] Class performance error:', err)
    res.status(500).json({
      error: 'Failed to fetch class performance',
      message: '获取班级表现统计失败'
    })
  }
})

router.get('/self-eval-radar', authMiddleware, (req, res) => {
  try {
    const { userId, classId } = req.query
    const filters = { limit: 100000 }

    if (req.user.role === 'student') {
      filters.user_id = req.user.id
    }

    if (req.user.role === 'teacher') {
      filters.class_id = req.user.classId
      if (classId && classId !== req.user.classId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: '教师只能查看本班数据'
        })
      }
    }

    if (req.user.role === 'admin' && classId) {
      filters.class_id = classId
    }

    if (userId) {
      const numericUserId = parseInt(userId, 10)
      if (Number.isNaN(numericUserId)) {
        return res.status(400).json({
          error: 'Invalid userId',
          message: 'userId 格式错误'
        })
      }
      if (req.user.role === 'student' && numericUserId !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: '无权查看其他用户数据'
        })
      }
      filters.user_id = numericUserId
    }

    const feedbacks = FeedbackDB.list(filters)
    const valid = feedbacks.filter(item => item.rating || item.understanding_score || item.interest_score || item.difficulty_score)

    const understanding = average(valid.map(item => toFiniteNumber(item.understanding_score, 0)).filter(value => value > 0))
    const interest = average(valid.map(item => toFiniteNumber(item.interest_score, 0)).filter(value => value > 0))
    const difficulty = average(valid.map(item => toFiniteNumber(item.difficulty_score, 0)).filter(value => value > 0))
    const overall = average(valid.map(item => toFiniteNumber(item.rating, 0)).filter(value => value > 0))

    const chartData = [
      { aspect: '理解度', score: Number(understanding.toFixed(2)) },
      { aspect: '兴趣度', score: Number(interest.toFixed(2)) },
      { aspect: '难度适宜', score: Number((difficulty > 0 ? 5 - difficulty : 0).toFixed(2)) },
      { aspect: '总体评价', score: Number(overall.toFixed(2)) }
    ]

    res.json({
      success: true,
      data: chartData
    })
  } catch (err) {
    console.error('[Stats] Self eval radar error:', err)
    res.status(500).json({
      error: 'Failed to fetch self eval data',
      message: '获取自评数据失败'
    })
  }
})

router.get('/export/csv', authMiddleware, (req, res) => {
  try {
    const { type = 'feedbacks', classId } = req.query

    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '无权导出数据'
      })
    }

    if (type !== 'feedbacks') {
      return res.status(400).json({
        error: 'Invalid type',
        message: '当前仅支持导出 feedbacks'
      })
    }

    const filters = { limit: 100000 }

    if (req.user.role === 'teacher') {
      filters.class_id = req.user.classId
    } else if (classId) {
      filters.class_id = classId
    }

    const feedbacks = FeedbackDB.list(filters)
    const headers = feedbacks.length > 0
      ? Object.keys(feedbacks[0])
      : [
          'id', 'user_id', 'username', 'display_name', 'role', 'feedback_type', 'class_id',
          'grade', 'modules_used', 'understanding_score', 'interest_score', 'difficulty_score',
          'open_comment', 'suggestions', 'rating', 'status', 'created_at'
        ]

    const lines = [headers.join(',')]
    for (const row of feedbacks) {
      lines.push(headers.map(header => toCsvValue(row[header])).join(','))
    }

    const csvData = lines.join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="feedback-export-${Date.now()}.csv"`)
    res.send('\uFEFF' + csvData)
  } catch (err) {
    console.error('[Stats] Export error:', err)
    res.status(500).json({
      error: 'Export failed',
      message: '导出失败'
    })
  }
})

export default router
