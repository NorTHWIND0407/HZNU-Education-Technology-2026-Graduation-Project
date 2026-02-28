/**
 * 数据库工具类
 * Database Utility
 */

import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DB_PATH = process.env.DATABASE_PATH || join(__dirname, '../data/feedback.db')

// 创建数据库连接
let db = null

export function getDB() {
  if (!db) {
    db = new Database(DB_PATH, { verbose: console.log })
    db.pragma('journal_mode = WAL')
    console.log(`[DB] Connected to ${DB_PATH}`)
  }
  return db
}

// 初始化数据库
export function initDB() {
  const db = getDB()
  const schemaPath = join(__dirname, '../../database-schema.sql')
  const schema = readFileSync(schemaPath, 'utf-8')

  // 分割并执行SQL语句
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'))

  statements.forEach(statement => {
    try {
      if (statement) {
        db.exec(statement)
      }
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.error('SQL Error:', err.message)
      }
    }
  })

  console.log('[DB] Database initialized')
  return db
}

// 关闭数据库连接
export function closeDB() {
  if (db) {
    db.close()
    db = null
    console.log('[DB] Connection closed')
  }
}

// ============================================
// 用户相关操作
// ============================================

export const UserDB = {
  // 创建用户
  create(userData) {
    const db = getDB()
    const stmt = db.prepare(`
      INSERT INTO users (username, display_name, role, grade, class_id, school_id, metadata)
      VALUES (@username, @display_name, @role, @grade, @class_id, @school_id, @metadata)
    `)
    return stmt.run(userData)
  },

  // 通过用户名查找
  findByUsername(username) {
    const db = getDB()
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  },

  // 通过ID查找
  findById(id) {
    const db = getDB()
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  },

  // 更新最后登录时间
  updateLastLogin(id) {
    const db = getDB()
    return db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(id)
  },

  // 获取班级用户列表
  findByClass(classId) {
    const db = getDB()
    return db.prepare('SELECT * FROM users WHERE class_id = ? AND is_active = 1').all(classId)
  }
}

// ============================================
// Session相关操作
// ============================================

export const SessionDB = {
  // 创建session
  create(userId, token, expiresAt, ipAddress, userAgent) {
    const db = getDB()
    const stmt = db.prepare(`
      INSERT INTO sessions (user_id, session_token, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `)
    return stmt.run(userId, token, expiresAt, ipAddress, userAgent)
  },

  // 查找有效session
  findValid(token) {
    const db = getDB()
    return db.prepare(`
      SELECT s.*, u.* FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ? AND s.expires_at > datetime('now')
    `).get(token)
  },

  // 删除session
  delete(token) {
    const db = getDB()
    return db.prepare('DELETE FROM sessions WHERE session_token = ?').run(token)
  },

  // 清理过期session
  cleanExpired() {
    const db = getDB()
    return db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run()
  }
}

// ============================================
// 反馈相关操作
// ============================================

export const FeedbackDB = {
  // 创建反馈
  create(feedbackData) {
    const db = getDB()
    const stmt = db.prepare(`
      INSERT INTO feedbacks (
        user_id, role, feedback_type, class_id, grade, modules_used,
        understanding_score, interest_score, difficulty_score, difficulty_aspects,
        teaching_effectiveness, student_engagement, technical_issues,
        open_comment, suggestions, rating, tags, status
      ) VALUES (
        @user_id, @role, @feedback_type, @class_id, @grade, @modules_used,
        @understanding_score, @interest_score, @difficulty_score, @difficulty_aspects,
        @teaching_effectiveness, @student_engagement, @technical_issues,
        @open_comment, @suggestions, @rating, @tags, @status
      )
    `)
    return stmt.run(feedbackData)
  },

  // 获取反馈列表
  list(filters = {}) {
    const db = getDB()
    let query = 'SELECT f.*, u.username, u.display_name FROM feedbacks f JOIN users u ON f.user_id = u.id WHERE 1=1'
    const params = []

    if (filters.role) {
      query += ' AND f.role = ?'
      params.push(filters.role)
    }
    if (filters.class_id) {
      query += ' AND f.class_id = ?'
      params.push(filters.class_id)
    }
    if (filters.status) {
      query += ' AND f.status = ?'
      params.push(filters.status)
    }
    if (filters.feedback_type) {
      query += ' AND f.feedback_type = ?'
      params.push(filters.feedback_type)
    }

    query += ' ORDER BY f.created_at DESC'

    if (filters.limit) {
      query += ' LIMIT ?'
      params.push(filters.limit)
    }

    return db.prepare(query).all(...params)
  },

  // 获取单个反馈
  findById(id) {
    const db = getDB()
    return db.prepare(`
      SELECT f.*, u.username, u.display_name
      FROM feedbacks f
      JOIN users u ON f.user_id = u.id
      WHERE f.id = ?
    `).get(id)
  },

  // 更新反馈状态
  updateStatus(id, status, reviewedBy = null) {
    const db = getDB()
    return db.prepare(`
      UPDATE feedbacks
      SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, reviewedBy, id)
  },

  // 删除反馈
  delete(id) {
    const db = getDB()
    return db.prepare('DELETE FROM feedbacks WHERE id = ?').run(id)
  }
}

// ============================================
// 统计相关操作
// ============================================

export const StatsDB = {
  // 模块使用统计
  moduleUsage() {
    const db = getDB()
    return db.prepare(`
      SELECT * FROM v_module_usage_stats
    `).all()
  },

  // 评分趋势（按时间）
  ratingTrend(days = 30) {
    const db = getDB()
    return db.prepare(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count,
        AVG(rating) as avg_rating,
        AVG(understanding_score) as avg_understanding,
        AVG(interest_score) as avg_interest
      FROM feedbacks
      WHERE created_at >= datetime('now', '-' || ? || ' days')
        AND rating IS NOT NULL
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all(days)
  },

  // 兴趣度分布
  interestDistribution() {
    const db = getDB()
    return db.prepare(`
      SELECT
        interest_score as score,
        COUNT(*) as count
      FROM feedbacks
      WHERE interest_score IS NOT NULL
      GROUP BY interest_score
      ORDER BY score
    `).all()
  },

  // 理解度分布
  understandingDistribution() {
    const db = getDB()
    return db.prepare(`
      SELECT
        understanding_score as score,
        COUNT(*) as count
      FROM feedbacks
      WHERE understanding_score IS NOT NULL
      GROUP BY understanding_score
      ORDER BY score
    `).all()
  },

  // 班级表现统计
  classPerformance() {
    const db = getDB()
    return db.prepare('SELECT * FROM v_class_performance').all()
  },

  // 实时概览
  overview() {
    const db = getDB()
    return {
      totalFeedbacks: db.prepare('SELECT COUNT(*) as count FROM feedbacks').get().count,
      totalUsers: db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get().count,
      todayFeedbacks: db.prepare(`
        SELECT COUNT(*) as count FROM feedbacks
        WHERE DATE(created_at) = DATE('now')
      `).get().count,
      avgRating: db.prepare(`
        SELECT AVG(rating) as avg FROM feedbacks
        WHERE rating IS NOT NULL AND created_at >= datetime('now', '-7 days')
      `).get().avg || 0,
      pendingFeedbacks: db.prepare(`
        SELECT COUNT(*) as count FROM feedbacks WHERE status = 'pending'
      `).get().count
    }
  }
}

// ============================================
// 学习进度相关操作
// ============================================

export const ProgressDB = {
  // 更新或创建进度
  upsert(userId, moduleName, lessonId, data) {
    const db = getDB()
    const stmt = db.prepare(`
      INSERT INTO learning_progress (
        user_id, module_name, lesson_id, completed, completion_rate,
        time_spent, attempts, score, max_score, started_at, last_accessed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, module_name, lesson_id) DO UPDATE SET
        completed = excluded.completed,
        completion_rate = excluded.completion_rate,
        time_spent = time_spent + excluded.time_spent,
        attempts = attempts + 1,
        score = excluded.score,
        last_accessed = CURRENT_TIMESTAMP,
        completed_at = CASE WHEN excluded.completed = 1 THEN CURRENT_TIMESTAMP ELSE completed_at END
    `)
    return stmt.run(
      userId, moduleName, lessonId, data.completed, data.completion_rate,
      data.time_spent, 1, data.score, data.max_score, data.started_at
    )
  },

  // 获取用户进度
  getUserProgress(userId) {
    const db = getDB()
    return db.prepare(`
      SELECT * FROM learning_progress
      WHERE user_id = ?
      ORDER BY last_accessed DESC
    `).all(userId)
  }
}

export default { getDB, initDB, closeDB, UserDB, SessionDB, FeedbackDB, StatsDB, ProgressDB }
