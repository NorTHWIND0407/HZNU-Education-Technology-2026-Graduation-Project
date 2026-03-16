/**
 * 认证路由
 * Authentication Routes
 */

import express from 'express'
import { nanoid } from 'nanoid'
import { UserDB, SessionDB } from '../db/index.js'

const router = express.Router()
const ADMIN_USERNAME = 'admin'
const TEACHER_RE = /^t([3-9])(0[1-9]|10)$/i
const STUDENT_RE = /^s([3-9])(0[1-9]|10)(0[1-9]|[1-3][0-9]|4[0-5])$/i

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

function buildClassId(gradeNo, classNo) {
  return `class_${gradeNo}${classNo}`
}

function parseAccount(rawUsername) {
  const username = String(rawUsername || '').trim()
  const normalizedUsername = username.toLowerCase()
  if (!username) return null

  if (normalizedUsername === ADMIN_USERNAME) {
    return {
      username: ADMIN_USERNAME,
      role: 'admin',
      classId: null,
      grade: null,
      displayName: '管理员',
      metadata: null
    }
  }

  const teacherMatch = normalizedUsername.match(TEACHER_RE)
  if (teacherMatch) {
    const gradeNo = teacherMatch[1]
    const classNo = teacherMatch[2]
    return {
      username: normalizedUsername,
      role: 'teacher',
      classId: buildClassId(gradeNo, classNo),
      grade: `${gradeNo}年级`,
      displayName: normalizedUsername,
      metadata: JSON.stringify({ gradeNo, classNo })
    }
  }

  const studentMatch = normalizedUsername.match(STUDENT_RE)
  if (studentMatch) {
    const gradeNo = studentMatch[1]
    const classNo = studentMatch[2]
    const studentNo = studentMatch[3]
    return {
      username: normalizedUsername,
      role: 'student',
      classId: buildClassId(gradeNo, classNo),
      grade: `${gradeNo}年级`,
      displayName: normalizedUsername,
      metadata: JSON.stringify({ gradeNo, classNo, studentNo })
    }
  }

  return null
}

/**
 * POST /api/auth/login
 * 账号登录（账号+密码）
 * 账号规则：
 * - 学生：s + 年级(3-9) + 班级(01-10) + 学号(01-45)，例如 s30101
 * - 教师：t + 年级(3-9) + 班级(01-10)，例如 t301
 * - 管理员：admin
 * 密码仅做一致性校验，不入库保存。
 */
router.post('/login', (req, res) => {
  try {
    const usernameInput = String(req.body?.username || '').trim()
    const passwordInput = String(req.body?.password || '').trim()

    if (!usernameInput || !passwordInput) {
      return res.status(400).json({
        error: 'Invalid credentials',
        message: '请输入账号和密码'
      })
    }

    // 账号与密码一致即通过（仅校验，不保存密码）
    if (usernameInput !== passwordInput) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: '账号或密码错误'
      })
    }

    const account = parseAccount(usernameInput)
    if (!account) {
      return res.status(400).json({
        error: 'Invalid username format',
        message: '账号格式错误：学生用 s30101，教师用 t301，管理员用 admin'
      })
    }

    // 查找用户
    let user = UserDB.findByUsername(account.username)

    // 首次登录自动建档（不存密码）
    if (!user) {
      const result = UserDB.create({
        username: account.username,
        display_name: account.displayName,
        role: account.role,
        grade: account.grade,
        class_id: account.classId,
        school_id: null,
        metadata: account.metadata
      })

      user = UserDB.findById(result.lastInsertRowid)
    }

    // 防止账号规则变更后出现角色错配
    if (user.role !== account.role) {
      return res.status(403).json({
        error: 'Role mismatch',
        message: '账号角色不匹配，请联系管理员'
      })
    }

    // 同步班级/年级信息（教师/学生）
    const profileUpdates = {}
    if (account.classId && user.class_id !== account.classId) {
      profileUpdates.classId = account.classId
    }
    if (account.grade && !user.grade) {
      profileUpdates.grade = account.grade
    }
    if (Object.keys(profileUpdates).length > 0) {
      UserDB.updateProfile(user.id, profileUpdates)
      user = UserDB.findById(user.id)
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
