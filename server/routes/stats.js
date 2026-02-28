/**
 * 统计数据路由
 * Statistics Routes
 */

import express from 'express'
import { StatsDB, SessionDB } from '../db/mock.js'

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
    role: session.role,
    classId: session.class_id
  }

  next()
}

/**
 * GET /api/stats/overview
 * 获取总体概览统计
 */
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

/**
 * GET /api/stats/module-usage
 * 获取模块使用统计
 */
router.get('/module-usage', authMiddleware, (req, res) => {
  try {
    const data = StatsDB.moduleUsage()

    // 转换为图表格式
    const chartData = data.map(item => ({
      module: item.module_name,
      usage: item.total_visits,
      uniqueUsers: item.unique_users,
      avgCompletion: Math.round(item.avg_completion || 0)
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

/**
 * GET /api/stats/rating-trend
 * 获取评分趋势（折线图）
 */
router.get('/rating-trend', authMiddleware, (req, res) => {
  try {
    const { days = 30 } = req.query
    const data = StatsDB.ratingTrend(parseInt(days))

    // 转换为图表格式
    const chartData = data.map(item => ({
      time: item.date,
      score: parseFloat(item.avg_rating?.toFixed(2) || 0),
      count: item.count,
      understanding: parseFloat(item.avg_understanding?.toFixed(2) || 0),
      interest: parseFloat(item.avg_interest?.toFixed(2) || 0)
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

/**
 * GET /api/stats/interest-distribution
 * 获取兴趣度分布（饼图）
 */
router.get('/interest-distribution', authMiddleware, (req, res) => {
  try {
    const data = StatsDB.interestDistribution()

    // 转换为图表格式
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

/**
 * GET /api/stats/understanding-distribution
 * 获取理解度分布
 */
router.get('/understanding-distribution', authMiddleware, (req, res) => {
  try {
    const data = StatsDB.understandingDistribution()

    // 转换为图表格式
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

/**
 * GET /api/stats/class-performance
 * 获取班级表现统计
 */
router.get('/class-performance', authMiddleware, (req, res) => {
  try {
    // 教师只能查看自己班级的
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

/**
 * GET /api/stats/self-eval-radar
 * 获取自评雷达图数据
 */
router.get('/self-eval-radar', authMiddleware, (req, res) => {
  try {
    const { userId, classId } = req.query

    // 构建查询
    let query = `
      SELECT
        AVG(understanding_score) as understanding,
        AVG(interest_score) as interest,
        AVG(difficulty_score) as difficulty,
        AVG(rating) as overall
      FROM feedbacks
      WHERE understanding_score IS NOT NULL
    `
    const params = []

    if (userId) {
      query += ' AND user_id = ?'
      params.push(userId)
    } else if (classId || req.user.classId) {
      query += ' AND class_id = ?'
      params.push(classId || req.user.classId)
    }

    const db = require('../db/index.js').getDB()
    const result = db.prepare(query).get(...params)

    // 转换为雷达图格式
    const chartData = [
      { aspect: '理解度', score: parseFloat(result.understanding?.toFixed(2) || 0) },
      { aspect: '兴趣度', score: parseFloat(result.interest?.toFixed(2) || 0) },
      { aspect: '难度适宜', score: 5 - parseFloat(result.difficulty?.toFixed(2) || 3) }, // 反转难度
      { aspect: '总体评价', score: parseFloat(result.overall?.toFixed(2) || 0) }
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

/**
 * GET /api/stats/export/csv
 * 导出统计数据为CSV
 */
router.get('/export/csv', authMiddleware, (req, res) => {
  try {
    const { type = 'feedbacks', classId } = req.query

    // 只有教师和管理员可以导出
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '无权导出数据'
      })
    }

    let csvData = ''
    const db = require('../db/index.js').getDB()

    if (type === 'feedbacks') {
      let query = 'SELECT * FROM feedbacks WHERE 1=1'
      const params = []

      if (req.user.role === 'teacher') {
        query += ' AND class_id = ?'
        params.push(req.user.classId)
      } else if (classId) {
        query += ' AND class_id = ?'
        params.push(classId)
      }

      query += ' ORDER BY created_at DESC'

      const feedbacks = db.prepare(query).all(...params)

      // 生成CSV
      if (feedbacks.length > 0) {
        const headers = Object.keys(feedbacks[0])
        csvData = headers.join(',') + '\n'
        csvData += feedbacks.map(row =>
          headers.map(h => JSON.stringify(row[h] || '')).join(',')
        ).join('\n')
      }
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="feedback-export-${Date.now()}.csv"`)
    res.send('\uFEFF' + csvData) // BOM for Excel UTF-8
  } catch (err) {
    console.error('[Stats] Export error:', err)
    res.status(500).json({
      error: 'Export failed',
      message: '导出失败'
    })
  }
})

export default router
