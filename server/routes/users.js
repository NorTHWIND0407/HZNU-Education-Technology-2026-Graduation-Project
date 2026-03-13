/**
 * 用户管理路由
 * User Management Routes
 */

import express from 'express'
import { UserDB, SessionDB } from '../db/index.js'

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
 * GET /api/users/class/:classId
 * 获取班级用户列表（教师功能）
 */
router.get('/class/:classId', authMiddleware, (req, res) => {
  try {
    const { classId } = req.params

    // 只有教师和管理员可以查看
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '无权查看班级用户'
      })
    }

    // 教师只能查看自己的班级
    if (req.user.role === 'teacher' && classId !== req.user.classId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '只能查看自己班级的用户'
      })
    }

    const users = UserDB.findByClass(classId)

    res.json({
      success: true,
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.display_name,
        role: u.role,
        grade: u.grade,
        lastLogin: u.last_login
      }))
    })
  } catch (err) {
    console.error('[Users] Get class users error:', err)
    res.status(500).json({
      error: 'Failed to fetch users',
      message: '获取用户列表失败'
    })
  }
})

/**
 * GET /api/users/:id
 * 获取用户详情
 */
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params

    // 只能查看自己或管理员查看所有
    if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: '无权查看此用户信息'
      })
    }

    const user = UserDB.findById(id)

    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: '用户不存在'
      })
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        grade: user.grade,
        classId: user.class_id,
        schoolId: user.school_id,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    })
  } catch (err) {
    console.error('[Users] Get user error:', err)
    res.status(500).json({
      error: 'Failed to fetch user',
      message: '获取用户信息失败'
    })
  }
})

/**
 * PATCH /api/users/:id
 * 更新用户信息
 */
router.patch('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params
    const { displayName, grade, classId, avatarUrl } = req.body
    const numericId = parseInt(id, 10)

    // 只能更新自己或管理员更新所有
    if (req.user.id !== numericId && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: '无权修改此用户信息'
      })
    }

    const updateResult = UserDB.updateProfile(numericId, { displayName, grade, classId, avatarUrl })
    if (!updateResult.changes) {
      return res.status(400).json({
        error: 'No updates',
        message: '没有要更新的字段'
      })
    }

    const user = UserDB.findById(numericId)

    res.json({
      success: true,
      message: '用户信息已更新',
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        grade: user.grade,
        classId: user.class_id
      }
    })
  } catch (err) {
    console.error('[Users] Update user error:', err)
    res.status(500).json({
      error: 'Failed to update user',
      message: '更新用户信息失败'
    })
  }
})

export default router
