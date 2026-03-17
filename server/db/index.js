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
const SUBJECT_CATALOG = ['语文', '数学', '英语', '科学', '信息科技', '美术', '音乐']
const SYSTEM_IT_RESOURCE_KEY = 'it-rolling-lantern-system'
const SUBJECT_EN_MAP = {
  语文: 'Chinese Language',
  数学: 'Mathematics',
  英语: 'English',
  科学: 'Science',
  信息科技: 'Information Technology',
  美术: 'Art',
  音乐: 'Music'
}

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

function tableHasColumn(tableName, columnName) {
  const rows = queryAll(`PRAGMA table_info(${tableName})`)
  return rows.some(row => String(row.name || '').toLowerCase() === String(columnName || '').toLowerCase())
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

function safeParseJSON(value, fallback) {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function isExpired(isoOrDateTimeText) {
  const ts = new Date(isoOrDateTimeText).getTime()
  if (Number.isNaN(ts)) return true
  return ts <= Date.now()
}

function seedDefaultUsers() {
  const defaults = [
    ['admin', '管理员', 'admin', null, null, 'linping_primary'],
    ['t301', 't301', 'teacher', '3年级', 'class_301', 'linping_primary'],
    ['s30101', 's30101', 'student', '3年级', 'class_301', 'linping_primary']
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

function ensureMicrodocSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS microdoc_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clip_id VARCHAR(80) NOT NULL,
      user_id INTEGER,
      username VARCHAR(80),
      display_name VARCHAR(120) NOT NULL,
      content TEXT NOT NULL,
      parent_comment_id INTEGER,
      visitor_id VARCHAR(80),
      is_deleted BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (parent_comment_id) REFERENCES microdoc_comments(id) ON DELETE CASCADE
    );
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS microdoc_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clip_id VARCHAR(80) NOT NULL,
      actor_key VARCHAR(120) NOT NULL,
      user_id INTEGER,
      visitor_id VARCHAR(80),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      UNIQUE(clip_id, actor_key)
    );
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS microdoc_comment_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_id INTEGER NOT NULL,
      actor_key VARCHAR(120) NOT NULL,
      user_id INTEGER,
      visitor_id VARCHAR(80),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (comment_id) REFERENCES microdoc_comments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      UNIQUE(comment_id, actor_key)
    );
  `)

  if (!tableHasColumn('microdoc_comments', 'parent_comment_id')) {
    db.exec('ALTER TABLE microdoc_comments ADD COLUMN parent_comment_id INTEGER')
  }

  db.exec('CREATE INDEX IF NOT EXISTS idx_microdoc_comments_clip ON microdoc_comments(clip_id)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_microdoc_comments_created ON microdoc_comments(created_at)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_microdoc_comments_parent ON microdoc_comments(parent_comment_id)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_microdoc_likes_clip ON microdoc_likes(clip_id)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_microdoc_comment_likes_comment ON microdoc_comment_likes(comment_id)')

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_microdoc_comments_timestamp
    AFTER UPDATE ON microdoc_comments
    BEGIN
      UPDATE microdoc_comments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `)
  persistDB()
}

function ensureResourceSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS course_resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_key VARCHAR(120) UNIQUE,
      subject VARCHAR(30) NOT NULL,
      subject_en VARCHAR(80),
      title VARCHAR(255) NOT NULL,
      grade VARCHAR(60),
      summary TEXT,
      keywords TEXT,
      is_system BOOLEAN DEFAULT 0,
      status VARCHAR(20) DEFAULT 'published' CHECK(status IN ('draft', 'pending', 'published', 'rejected')),
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS resource_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_id INTEGER NOT NULL,
      label VARCHAR(255) NOT NULL,
      type VARCHAR(60) NOT NULL,
      format VARCHAR(30),
      preview_url TEXT,
      download_url TEXT,
      storage_path TEXT,
      original_name VARCHAR(255),
      mime_type VARCHAR(120),
      file_size INTEGER,
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resource_id) REFERENCES course_resources(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `)

  db.exec('CREATE INDEX IF NOT EXISTS idx_course_resources_subject ON course_resources(subject)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_course_resources_status ON course_resources(status)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_resource_files_resource ON resource_files(resource_id)')
  persistDB()
}

function seedSystemResources() {
  const existing = queryGet('SELECT id FROM course_resources WHERE resource_key = ?', [SYSTEM_IT_RESOURCE_KEY])
  let resourceId = Number(existing?.id || 0)

  if (!resourceId) {
    const result = run(
      `INSERT INTO course_resources
        (resource_key, subject, subject_en, title, grade, summary, keywords, is_system, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'published', NULL)`,
      [
        SYSTEM_IT_RESOURCE_KEY,
        '信息科技',
        'Information Technology',
        '信息科技学科示例：临平滚灯数字展示任务',
        '五-六年级',
        '围绕临平滚灯完成信息收集、素材整理、页面结构设计与数字化展示，形成可复用的信息科技学科任务模板。',
        JSON.stringify(['信息科技', '网页设计', '数字展示', '临平滚灯'])
      ]
    )
    resourceId = result.lastInsertRowid
  }

  const hasFile = queryGet('SELECT id FROM resource_files WHERE resource_id = ?', [resourceId])
  if (!hasFile) {
    run(
      `INSERT INTO resource_files
        (resource_id, label, type, format, preview_url, download_url, storage_path, original_name, mime_type, file_size, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL, NULL)`,
      [
        resourceId,
        '信息任务书：滚灯数字展示页（TXT）',
        '任务书',
        'txt',
        '/resources/info-rolling-lantern-task.txt',
        '/resources/info-rolling-lantern-task.txt',
        'info-rolling-lantern-task.txt',
        'text/plain'
      ]
    )
  }
}

function seedSubjectPlaceholders() {
  const placeholderSubjects = SUBJECT_CATALOG.filter(subject => subject !== '信息科技')
  for (const subject of placeholderSubjects) {
    const resourceKey = `placeholder-${subject}`
    const exists = queryGet('SELECT id FROM course_resources WHERE resource_key = ?', [resourceKey])
    if (exists) continue

    run(
      `INSERT INTO course_resources
        (resource_key, subject, subject_en, title, grade, summary, keywords, is_system, status, created_by)
       VALUES (?, ?, ?, ?, NULL, ?, ?, 0, 'published', NULL)`,
      [
        resourceKey,
        subject,
        SUBJECT_EN_MAP[subject] || null,
        `${subject}学科`,
        `当前为${subject}学科入口，可由教师上传与临平滚灯相关的教案与课件资源。`,
        JSON.stringify([subject, '临平滚灯', '学科融合'])
      ]
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
  // 微纪录片评论/点赞 schema 迁移
  ensureMicrodocSchema()
  // 资源模块 schema 迁移与系统资源初始化
  ensureResourceSchema()
  seedSystemResources()
  seedSubjectPlaceholders()
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

  update(id, updates = {}) {
    const allowedColumns = [
      'feedback_type',
      'class_id',
      'grade',
      'modules_used',
      'lesson_id',
      'understanding_score',
      'interest_score',
      'difficulty_score',
      'difficulty_aspects',
      'teaching_effectiveness',
      'student_engagement',
      'technical_issues',
      'open_comment',
      'suggestions',
      'rating',
      'tags',
      'status',
      'admin_notes'
    ]

    const sets = []
    const params = []

    for (const key of allowedColumns) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        sets.push(`${key} = ?`)
        params.push(normalizeNullable(updates[key]))
      }
    }

    if (!sets.length) return { changes: 0 }

    params.push(Number(id))
    return run(`UPDATE feedbacks SET ${sets.join(', ')} WHERE id = ?`, params)
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

// ============================================
// 微纪录片评论/点赞相关操作
// ============================================

function normalizeMicrodocComment(row) {
  if (!row) return null
  return {
    id: Number(row.id),
    clipId: row.clip_id,
    userId: row.user_id != null ? Number(row.user_id) : null,
    username: row.username || '',
    displayName: row.display_name || '游客',
    content: row.content || '',
    parentCommentId: row.parent_comment_id != null ? Number(row.parent_comment_id) : null,
    likeCount: Number(row.like_count || 0),
    likedByMe: Boolean(Number(row.liked_by_me || 0)),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export const MicrodocDB = {
  listComments(clipId, limit = 100, actorKey = null) {
    const rows = queryAll(
      `SELECT
         c.id,
         c.clip_id,
         c.user_id,
         c.username,
         c.display_name,
         c.content,
         c.parent_comment_id,
         c.created_at,
         c.updated_at,
         (
           SELECT COUNT(*)
           FROM microdoc_comment_likes cl
           WHERE cl.comment_id = c.id
         ) AS like_count,
         CASE
           WHEN ? IS NOT NULL AND EXISTS(
             SELECT 1
             FROM microdoc_comment_likes cl2
             WHERE cl2.comment_id = c.id AND cl2.actor_key = ?
           ) THEN 1
           ELSE 0
         END AS liked_by_me
       FROM microdoc_comments c
       WHERE c.clip_id = ? AND c.is_deleted = 0
       ORDER BY c.created_at DESC, c.id DESC
       LIMIT ?`,
      [actorKey, actorKey, clipId, Number(limit)]
    )
    return rows.map(normalizeMicrodocComment)
  },

  createComment(commentData) {
    return run(
      `INSERT INTO microdoc_comments
        (clip_id, user_id, username, display_name, content, visitor_id, parent_comment_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        commentData.clip_id,
        normalizeNullable(commentData.user_id),
        normalizeNullable(commentData.username),
        commentData.display_name,
        commentData.content,
        normalizeNullable(commentData.visitor_id),
        normalizeNullable(commentData.parent_comment_id)
      ]
    )
  },

  findCommentById(id, actorKey = null) {
    const row = queryGet(
      `SELECT
         c.id,
         c.clip_id,
         c.user_id,
         c.username,
         c.display_name,
         c.content,
         c.parent_comment_id,
         c.created_at,
         c.updated_at,
         (
           SELECT COUNT(*)
           FROM microdoc_comment_likes cl
           WHERE cl.comment_id = c.id
         ) AS like_count,
         CASE
           WHEN ? IS NOT NULL AND EXISTS(
             SELECT 1
             FROM microdoc_comment_likes cl2
             WHERE cl2.comment_id = c.id AND cl2.actor_key = ?
           ) THEN 1
           ELSE 0
         END AS liked_by_me
       FROM microdoc_comments c
       WHERE c.id = ?`,
      [actorKey, actorKey, Number(id)]
    )
    return normalizeMicrodocComment(row)
  },

  getCommentMetaById(id) {
    return queryGet(
      `SELECT id, clip_id, parent_comment_id, is_deleted
       FROM microdoc_comments
       WHERE id = ?`,
      [Number(id)]
    )
  },

  countLikes(clipId) {
    const row = queryGet('SELECT COUNT(*) AS count FROM microdoc_likes WHERE clip_id = ?', [clipId])
    return Number(row?.count || 0)
  },

  hasLiked(clipId, actorKey) {
    const row = queryGet(
      'SELECT id FROM microdoc_likes WHERE clip_id = ? AND actor_key = ?',
      [clipId, actorKey]
    )
    return Boolean(row?.id)
  },

  toggleLike({ clipId, actorKey, userId = null, visitorId = null }) {
    const existing = queryGet(
      'SELECT id FROM microdoc_likes WHERE clip_id = ? AND actor_key = ?',
      [clipId, actorKey]
    )

    let liked = false
    if (existing?.id) {
      run('DELETE FROM microdoc_likes WHERE id = ?', [Number(existing.id)])
    } else {
      run(
        `INSERT INTO microdoc_likes (clip_id, actor_key, user_id, visitor_id)
         VALUES (?, ?, ?, ?)`,
        [clipId, actorKey, normalizeNullable(userId), normalizeNullable(visitorId)]
      )
      liked = true
    }

    return {
      liked,
      likeCount: this.countLikes(clipId)
    }
  },

  countCommentLikes(commentId) {
    const row = queryGet('SELECT COUNT(*) AS count FROM microdoc_comment_likes WHERE comment_id = ?', [Number(commentId)])
    return Number(row?.count || 0)
  },

  hasCommentLiked(commentId, actorKey) {
    const row = queryGet(
      'SELECT id FROM microdoc_comment_likes WHERE comment_id = ? AND actor_key = ?',
      [Number(commentId), actorKey]
    )
    return Boolean(row?.id)
  },

  toggleCommentLike({ commentId, actorKey, userId = null, visitorId = null }) {
    const existing = queryGet(
      'SELECT id FROM microdoc_comment_likes WHERE comment_id = ? AND actor_key = ?',
      [Number(commentId), actorKey]
    )

    let liked = false
    if (existing?.id) {
      run('DELETE FROM microdoc_comment_likes WHERE id = ?', [Number(existing.id)])
    } else {
      run(
        `INSERT INTO microdoc_comment_likes (comment_id, actor_key, user_id, visitor_id)
         VALUES (?, ?, ?, ?)`,
        [Number(commentId), actorKey, normalizeNullable(userId), normalizeNullable(visitorId)]
      )
      liked = true
    }

    return {
      liked,
      likeCount: this.countCommentLikes(commentId)
    }
  }
}

// ============================================
// 课程资源相关操作
// ============================================

function mapResourcesWithFiles(resourceRows, fileRows) {
  const filesByResourceId = new Map()
  for (const file of fileRows) {
    const resourceId = Number(file.resource_id)
    if (!filesByResourceId.has(resourceId)) {
      filesByResourceId.set(resourceId, [])
    }
    filesByResourceId.get(resourceId).push({
      id: `file-${file.id}`,
      fileDbId: Number(file.id),
      label: file.label,
      type: file.type,
      format: file.format || undefined,
      previewUrl: file.preview_url || undefined,
      downloadUrl: file.download_url || '',
      originalName: file.original_name || undefined,
      mimeType: file.mime_type || undefined,
      fileSize: file.file_size != null ? Number(file.file_size) : undefined
    })
  }

  return resourceRows.map(row => {
    const dbId = Number(row.id)
    return {
      id: row.resource_key || `resource-${dbId}`,
      resourceDbId: dbId,
      subject: row.subject,
      subjectEn: row.subject_en || undefined,
      title: row.title,
      grade: row.grade || undefined,
      summary: row.summary || undefined,
      keywords: safeParseJSON(row.keywords, []),
      status: row.status,
      isSystem: Boolean(Number(row.is_system || 0)),
      createdBy: row.created_by != null ? Number(row.created_by) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      files: filesByResourceId.get(dbId) || []
    }
  })
}

export const ResourceDB = {
  subjectCatalog() {
    return [...SUBJECT_CATALOG]
  },

  isValidSubject(subject) {
    return SUBJECT_CATALOG.includes(subject)
  },

  list(filters = {}) {
    let sql = 'SELECT * FROM course_resources WHERE 1=1'
    const params = []

    if (filters.subject) {
      sql += ' AND subject = ?'
      params.push(filters.subject)
    }
    if (filters.status) {
      sql += ' AND status = ?'
      params.push(filters.status)
    }
    if (filters.createdBy) {
      sql += ' AND created_by = ?'
      params.push(Number(filters.createdBy))
    }
    if (filters.excludeSystem) {
      sql += ' AND is_system = 0'
    }

    sql += ' ORDER BY is_system DESC, created_at DESC'
    const resources = queryAll(sql, params)
    if (!resources.length) return []

    const ids = resources.map(item => Number(item.id))
    const placeholders = ids.map(() => '?').join(', ')
    const files = queryAll(
      `SELECT * FROM resource_files WHERE resource_id IN (${placeholders}) ORDER BY created_at DESC`,
      ids
    )

    return mapResourcesWithFiles(resources, files)
  },

  findById(resourceId) {
    const resources = this.list({}).filter(item => item.resourceDbId === Number(resourceId))
    return resources[0] || null
  },

  createProject(data) {
    const result = run(
      `INSERT INTO course_resources
        (resource_key, subject, subject_en, title, grade, summary, keywords, is_system, status, created_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        normalizeNullable(data.resource_key),
        data.subject,
        normalizeNullable(data.subject_en),
        data.title,
        normalizeNullable(data.grade),
        normalizeNullable(data.summary),
        data.keywords ? JSON.stringify(data.keywords) : null,
        data.is_system ? 1 : 0,
        data.status || 'published',
        normalizeNullable(data.created_by)
      ]
    )
    return result.lastInsertRowid
  },

  addFile(resourceId, fileData) {
    return run(
      `INSERT INTO resource_files
        (resource_id, label, type, format, preview_url, download_url, storage_path, original_name, mime_type, file_size, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(resourceId),
        fileData.label,
        fileData.type,
        normalizeNullable(fileData.format),
        normalizeNullable(fileData.preview_url),
        normalizeNullable(fileData.download_url),
        normalizeNullable(fileData.storage_path),
        normalizeNullable(fileData.original_name),
        normalizeNullable(fileData.mime_type),
        normalizeNullable(fileData.file_size),
        normalizeNullable(fileData.uploaded_by)
      ]
    )
  },

  updateFileLinks(fileId, previewUrl, downloadUrl) {
    return run(
      `UPDATE resource_files
       SET preview_url = ?, download_url = ?
       WHERE id = ?`,
      [normalizeNullable(previewUrl), normalizeNullable(downloadUrl), Number(fileId)]
    )
  },

  findFileById(fileId) {
    return queryGet(
      `SELECT rf.*, cr.status AS resource_status, cr.subject, cr.title
       FROM resource_files rf
       JOIN course_resources cr ON rf.resource_id = cr.id
       WHERE rf.id = ?`,
      [Number(fileId)]
    )
  }
}

export default {
  getDB,
  initDB,
  closeDB,
  UserDB,
  SessionDB,
  FeedbackDB,
  StatsDB,
  ProgressDB,
  MicrodocDB,
  ResourceDB
}
