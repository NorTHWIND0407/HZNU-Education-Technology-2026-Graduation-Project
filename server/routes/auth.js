/**
 * 认证路由
 * Authentication Routes
 */

import express from 'express'
import { nanoid } from 'nanoid'
import { UserDB, SessionDB } from '../db/index.js'

const router = express.Router()

// 生成session token
function generateToken() {
  return nanoid(32)
}

// 计算过期时间
function getExpiryDate(hours = 24) {
  const date = new Date()
  date.setHours(date.getHours() + hours)
  return date.toISOString()
}

/**
 * POST /api/auth/login
 * 轻量级登录（无密码）
 * 适合教室环境，教师管理学生账号
 */
router.post('/login', (req, res) => {
  try {
    const { username } = req.body

    if (!username || username.trim().length < 2) {
      return res.status(400).json({
        error: 'Invalid username',
        message: '用户名至少2个字符'
      })
    }

    // 查找用户
    let user = UserDB.findByUsername(username.trim())

    // 如果用户不存在，自动创建（仅限学生）
    if (!user) {
      // 简单规则：工号以T开头的是教师，其他是学生
      const role = username.startsWith('T') ? 'teacher' : 'student'

      const result = UserDB.create({
        username: username.trim(),
        display_name: username.trim(),
        role,
        grade: null,
        class_id: null,
        school_id: null,
        metadata: null
      })

      user = UserDB.findById(result.lastInsertRowid)
    }

    // 检查用户是否激活
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Account disabled',
        message: '账号已被禁用，请联系管理员'
      })
    }

    // 创建session
    const token = generateToken()
    const expiresAt = getExpiryDate(24)
    const ipAddress = req.ip || req.connection.remoteAddress
    const userAgent = req.get('user-agent')

    SessionDB.create(user.id, token, expiresAt, ipAddress, userAgent)
    UserDB.updateLastLogin(user.id)

    // 清理过期session
    SessionDB.cleanExpired()

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        grade: user.grade,
        classId: user.class_id
      },
      session: {
        token,
        expiresAt
      }
    })
  } catch (err) {
    console.error('[Auth] Login error:', err)
    res.status(500).json({
      error: 'Login failed',
      message: '登录失败，请稍后重试'
    })
  }
})

/**
 * POST /api/auth/logout
 * 登出
 */
router.post('/logout', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (token) {
      SessionDB.delete(token)
    }

    res.json({
      success: true,
      message: '已登出'
    })
  } catch (err) {
    console.error('[Auth] Logout error:', err)
    res.status(500).json({
      error: 'Logout failed',
      message: '登出失败'
    })
  }
})

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '未提供认证令牌'
      })
    }

    const session = SessionDB.findValid(token)

    if (!session) {
      return res.status(401).json({
        error: 'Invalid session',
        message: '会话已过期或无效'
      })
    }

    res.json({
      success: true,
      user: {
        id: session.id,
        username: session.username,
        displayName: session.display_name,
        role: session.role,
        grade: session.grade,
        classId: session.class_id,
        lastLogin: session.last_login
      }
    })
  } catch (err) {
    console.error('[Auth] Get user error:', err)
    res.status(500).json({
      error: 'Failed to get user',
      message: '获取用户信息失败'
    })
  }
})

/**
 * POST /api/auth/quick-login
 * 快速登录（扫码登录占位）
 * 返回二维码URL或快速登录码
 */
router.post('/quick-login', (req, res) => {
  try {
    const code = nanoid(8).toUpperCase()

    // TODO: 实现二维码生成和短期token逻辑
    // 这里只是返回一个模拟的响应

    res.json({
      success: true,
      quickCode: code,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=LP_LANTERN_${code}`,
      expiresIn: 300 // 5分钟
    })
  } catch (err) {
    console.error('[Auth] Quick login error:', err)
    res.status(500).json({
      error: 'Quick login failed',
      message: '快速登录失败'
    })
  }
})

export default router
