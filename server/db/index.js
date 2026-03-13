/**
 * SQLite 文件数据库工具（基于 sql.js）
 * Persistent SQLite DB (using sql.js)
 */

import initSqlJs from 'sql.js'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, isAbsolute, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const serverRoot = join(__dirname, '..')
const configuredPath = process.env.DATABASE_PATH || './data/feedback.db'
const DB_PATH = isAbsolute(configuredPath) ? configuredPath : resolve(serverRoot, configuredPath)
const SCHEMA_PATH = join(serverRoot, '../database-schema.sql')

let SQLRuntime = null
let db = null

function ensureDirForFile(filePath) {
  const dir = dirname(filePath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function assertReady() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.')
  }
}

function persistDB() {
  assertReady()
  ensureDirForFile(DB_PATH)
  const data = db.export()
  writeFileSync(DB_PATH, Buffer.from(data))
}

function queryAll(sql, params = []) {
  assertReady()
  const stmt = db.prepare(sql)
  try {
    stmt.bind(params)
    const rows = []
    while (stmt.step()) {
      rows.push(stmt.getAsObject())
    }
    return rows
  } finally {
    stmt.free()
  }
}

function queryGet(sql, params = []) {
  const rows = queryAll(sql, params)
  return rows[0] || null
}

function run(sql, params = []) {
  assertReady()
  db.run(sql, params)
  const changes = Number(db.getRowsModified() || 0)
  const result = db.exec('SELECT last_insert_rowid() AS id')
  const lastInsertRowid = Number(result?.[0]?.values?.[0]?.[0] || 0)
  persistDB()
  return {
    lastInsertRowid,
    changes
  }
}

function normalizeNullable(value) {
  if (value === undefined || value === null || value === '') return null
  return value
}

function isExpired(isoOrDateTimeText) {
  const ts = new Date(isoOrDateTimeText).getTime()
  if (Number.isNaN(ts)) return true
  return ts <= Date.now()
}

function seedDefaultUsers() {
  const defaults = [
    ['admin', '管理员', 'admin', null, null, 'linping_primary'],
    ['T001', '张老师', 'teacher', '三年级', 'class_3a', 'linping_primary'],
    ['student001', '小明', 'student', '三年级', 'class_3a', 'linping_primary']
  ]

  for (const [username, displayName, role, grade, classId, schoolId] of defaults) {
    run(
      `INSERT OR IGNORE INTO users
        (username, display_name, role, grade, class_id, school_id, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, displayName, role, grade, classId, schoolId, '{}']
    )
  }
}

// 初始化数据库
export async function initDB() {
  if (db) return db

  SQLRuntime = await initSqlJs()
  ensureDirForFile(DB_PATH)

  if (existsSync(DB_PATH)) {
    db = new SQLRuntime.Database(readFileSync(DB_PATH))
    console.log(`[DB] Loaded database from ${DB_PATH}`)
  } else {
    db = new SQLRuntime.Database()
    const schema = readFileSync(SCHEMA_PATH, 'utf-8')
    db.exec(schema)
    persistDB()
    console.log(`[DB] Created database at ${DB_PATH}`)
  }

  // 首次或升级后兜底写入示例账号（避免前端示例账号无班级）
  seedDefaultUsers()
  return db
}

export function getDB() {
  assertReady()
  return db
}

// 关闭数据库连接
export function closeDB() {
  if (!db) return
  persistDB()
  db.close()
  db = null
  console.log('[DB] Connection closed')
}

// ============================================
// 用户相关操作
// ============================================

export const UserDB = {
  create(userData) {
    return run(
      `INSERT INTO users (username, display_name, role, grade, class_id, school_id, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userData.username,
        userData.display_name,
        userData.role,
        normalizeNullable(userData.grade),
        normalizeNullable(userData.class_id),
        normalizeNullable(userData.school_id),
        normalizeNullable(userData.metadata)
      ]
    )
  },

  findByUsername(username) {
    return queryGet('SELECT * FROM users WHERE username = ?', [username])
  },

  findById(id) {
    return queryGet('SELECT * FROM users WHERE id = ?', [Number(id)])
  },

  updateLastLogin(id) {
    return run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [Number(id)])
  },

  findByClass(classId) {
    return queryAll('SELECT * FROM users WHERE class_id = ? AND is_active = 1', [classId])
  },

  updateProfile(id, updates) {
    const sets = []
    const params = []

    if (updates.displayName !== undefined) {
      sets.push('display_name = ?')
      params.push(normalizeNullable(updates.displayName))
    }
    if (updates.grade !== undefined) {
      sets.push('grade = ?')
      params.push(normalizeNullable(updates.grade))
    }
    if (updates.classId !== undefined) {
      sets.push('class_id = ?')
      params.push(normalizeNullable(updates.classId))
    }
    if (updates.avatarUrl !== undefined) {
      sets.push('avatar_url = ?')
      params.push(normalizeNullable(updates.avatarUrl))
    }

    if (!sets.length) return { changes: 0 }

    params.push(Number(id))
    return run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params)
  }
}

// ============================================
// Session相关操作
// ============================================

export const SessionDB = {
  create(userId, token, expiresAt, ipAddress, userAgent) {
    return run(
      `INSERT INTO sessions (user_id, session_token, expires_at, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
      [Number(userId), token, expiresAt, normalizeNullable(ipAddress), normalizeNullable(userAgent)]
    )
  },

  findValid(token) {
    const row = queryGet(
      `SELECT
         s.id AS session_id,
         s.user_id,
         s.session_token,
         s.expires_at,
         s.created_at AS session_created_at,
         s.ip_address,
         s.user_agent,
         u.id AS id,
         u.username,
         u.display_name,
         u.role,
         u.grade,
         u.class_id,
         u.school_id,
         u.avatar_url,
         u.created_at,
         u.last_login,
         u.is_active
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.session_token = ?`,
      [token]
    )

    if (!row || isExpired(row.expires_at)) {
      if (row) this.delete(token)
      return null
    }

    return row
  },

  delete(token) {
    return run('DELETE FROM sessions WHERE session_token = ?', [token])
  },

  cleanExpired() {
    const sessions = queryAll('SELECT id, expires_at FROM sessions')
    const expiredIds = sessions.filter(item => isExpired(item.expires_at)).map(item => Number(item.id))
    if (!expiredIds.length) return { changes: 0 }

    const placeholders = expiredIds.map(() => '?').join(', ')
    return run(`DELETE FROM sessions WHERE id IN (${placeholders})`, expiredIds)
  }
}

// ============================================
// 反馈相关操作
// ============================================

export const FeedbackDB = {
  create(feedbackData) {
    return run(
      `INSERT INTO feedbacks (
         user_id, role, feedback_type, class_id, grade, modules_used, lesson_id,
         understanding_score, interest_score, difficulty_score, difficulty_aspects,
         teaching_effectiveness, student_engagement, technical_issues,
         open_comment, suggestions, rating, tags, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(feedbackData.user_id),
        feedbackData.role,
        feedbackData.feedback_type,
        normalizeNullable(feedbackData.class_id),
        normalizeNullable(feedbackData.grade),
        normalizeNullable(feedbackData.modules_used),
        normalizeNullable(feedbackData.lesson_id),
        normalizeNullable(feedbackData.understanding_score),
        normalizeNullable(feedbackData.interest_score),
        normalizeNullable(feedbackData.difficulty_score),
        normalizeNullable(feedbackData.difficulty_aspects),
        normalizeNullable(feedbackData.teaching_effectiveness),
        normalizeNullable(feedbackData.student_engagement),
        normalizeNullable(feedbackData.technical_issues),
        normalizeNullable(feedbackData.open_comment),
        normalizeNullable(feedbackData.suggestions),
        normalizeNullable(feedbackData.rating),
        normalizeNullable(feedbackData.tags),
        feedbackData.status || 'pending'
      ]
    )
  },

  list(filters = {}) {
    let sql = `
      SELECT f.*, u.username, u.display_name
      FROM feedbacks f
      JOIN users u ON f.user_id = u.id
      WHERE 1=1`
    const params = []

    if (filters.user_id) {
      sql += ' AND f.user_id = ?'
      params.push(Number(filters.user_id))
    }
    if (filters.role) {
      sql += ' AND f.role = ?'
      params.push(filters.role)
    }
    if (filters.class_id) {
      sql += ' AND f.class_id = ?'
      params.push(filters.class_id)
    }
    if (filters.status) {
      sql += ' AND f.status = ?'
      params.push(filters.status)
    }
    if (filters.feedback_type) {
      sql += ' AND f.feedback_type = ?'
      params.push(filters.feedback_type)
    }

    sql += ' ORDER BY f.created_at DESC'

    if (filters.limit) {
      sql += ' LIMIT ?'
      params.push(Number(filters.limit))
    }

    return queryAll(sql, params)
  },

  findById(id) {
    return queryGet(
      `SELECT f.*, u.username, u.display_name
       FROM feedbacks f
       JOIN users u ON f.user_id = u.id
       WHERE f.id = ?`,
      [Number(id)]
    )
  },

  updateStatus(id, status, reviewedBy = null) {
    return run(
      `UPDATE feedbacks
       SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, normalizeNullable(reviewedBy), Number(id)]
    )
  },

  delete(id) {
    return run('DELETE FROM feedbacks WHERE id = ?', [Number(id)])
  }
}

// ============================================
// 统计相关操作
// ============================================

export const StatsDB = {
  moduleUsage() {
    return queryAll('SELECT * FROM v_module_usage_stats')
  },

  ratingTrend(days = 30) {
    return queryAll(
      `SELECT
         DATE(created_at) AS date,
         COUNT(*) AS count,
         AVG(rating) AS avg_rating,
         AVG(understanding_score) AS avg_understanding,
         AVG(interest_score) AS avg_interest
       FROM feedbacks
       WHERE created_at >= datetime('now', '-' || ? || ' days')
         AND rating IS NOT NULL
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [Number(days)]
    )
  },

  interestDistribution() {
    return queryAll(
      `SELECT interest_score AS score, COUNT(*) AS count
       FROM feedbacks
       WHERE interest_score IS NOT NULL
       GROUP BY interest_score
       ORDER BY score`
    )
  },

  understandingDistribution() {
    return queryAll(
      `SELECT understanding_score AS score, COUNT(*) AS count
       FROM feedbacks
       WHERE understanding_score IS NOT NULL
       GROUP BY understanding_score
       ORDER BY score`
    )
  },

  classPerformance() {
    return queryAll('SELECT * FROM v_class_performance')
  },

  overview() {
    return {
      totalFeedbacks: Number(queryGet('SELECT COUNT(*) AS count FROM feedbacks')?.count || 0),
      totalUsers: Number(queryGet('SELECT COUNT(*) AS count FROM users WHERE is_active = 1')?.count || 0),
      todayFeedbacks: Number(
        queryGet("SELECT COUNT(*) AS count FROM feedbacks WHERE DATE(created_at) = DATE('now')")?.count || 0
      ),
      avgRating: Number(
        queryGet(
          `SELECT AVG(rating) AS avg
           FROM feedbacks
           WHERE rating IS NOT NULL AND created_at >= datetime('now', '-7 days')`
        )?.avg || 0
      ),
      pendingFeedbacks: Number(queryGet("SELECT COUNT(*) AS count FROM feedbacks WHERE status = 'pending'")?.count || 0)
    }
  }
}

// ============================================
// 学习进度相关操作
// ============================================

export const ProgressDB = {
  upsert(userId, moduleName, lessonId, data) {
    return run(
      `INSERT INTO learning_progress (
         user_id, module_name, lesson_id, completed, completion_rate,
         time_spent, attempts, score, max_score, started_at, last_accessed
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, module_name, lesson_id) DO UPDATE SET
         completed = excluded.completed,
         completion_rate = excluded.completion_rate,
         time_spent = learning_progress.time_spent + excluded.time_spent,
         attempts = learning_progress.attempts + 1,
         score = excluded.score,
         max_score = excluded.max_score,
         last_accessed = CURRENT_TIMESTAMP,
         completed_at = CASE WHEN excluded.completed = 1 THEN CURRENT_TIMESTAMP ELSE learning_progress.completed_at END`,
      [
        Number(userId),
        moduleName,
        normalizeNullable(lessonId),
        data.completed ? 1 : 0,
        Number(data.completion_rate || 0),
        Number(data.time_spent || 0),
        1,
        normalizeNullable(data.score),
        normalizeNullable(data.max_score),
        normalizeNullable(data.started_at) || new Date().toISOString()
      ]
    )
  },

  getUserProgress(userId) {
    return queryAll(
      `SELECT * FROM learning_progress
       WHERE user_id = ?
       ORDER BY last_accessed DESC`,
      [Number(userId)]
    )
  }
}

export default { getDB, initDB, closeDB, UserDB, SessionDB, FeedbackDB, StatsDB, ProgressDB }
