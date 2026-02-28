/**
 * Mock数据库实现（无需native依赖）
 * Mock Database Implementation (No native dependencies)
 */

// 内存存储
const users = new Map()
const sessions = new Map()
const feedbacks = []

let userIdCounter = 1
let sessionIdCounter = 1
let feedbackIdCounter = 1

// ============================================
// 数据库初始化
// ============================================

export function getDB() {
  return { connected: true }
}

export function initDB() {
  console.log('[DB] Mock database initialized')

  // 创建示例用户
  const exampleUsers = [
    {
      username: 'student001',
      display_name: '小明',
      role: 'student',
      grade: '三年级',
      class_id: 'class_3a',
      school_id: 'linping_primary',
      metadata: '{}'
    },
    {
      username: 'T001',
      display_name: '张老师',
      role: 'teacher',
      grade: '三年级',
      class_id: 'class_3a',
      school_id: 'linping_primary',
      metadata: '{}'
    },
    {
      username: 'admin',
      display_name: '管理员',
      role: 'admin',
      grade: null,
      class_id: null,
      school_id: 'linping_primary',
      metadata: '{}'
    }
  ]

  exampleUsers.forEach(userData => {
    const id = userIdCounter++
    users.set(id, {
      id,
      ...userData,
      is_active: 1,
      created_at: new Date().toISOString(),
      last_login: null
    })
    // Also index by username
    users.set(userData.username, id)
  })

  return { connected: true }
}

export function closeDB() {
  console.log('[DB] Mock connection closed')
}

// ============================================
// 用户相关操作
// ============================================

export const UserDB = {
  create(userData) {
    const id = userIdCounter++
    const user = {
      id,
      username: userData.username,
      display_name: userData.display_name,
      role: userData.role,
      grade: userData.grade || null,
      class_id: userData.class_id || null,
      school_id: userData.school_id || 'linping_primary',
      metadata: userData.metadata || '{}',
      is_active: 1,
      created_at: new Date().toISOString(),
      last_login: null
    }
    users.set(id, user)
    users.set(userData.username, id)
    return { lastInsertRowid: id }
  },

  findByUsername(username) {
    const userId = users.get(username)
    if (typeof userId === 'number') {
      return users.get(userId)
    }
    return null
  },

  findById(id) {
    return users.get(id) || null
  },

  updateLastLogin(id) {
    const user = users.get(id)
    if (user) {
      user.last_login = new Date().toISOString()
    }
    return { changes: user ? 1 : 0 }
  },

  findByClass(classId) {
    return Array.from(users.values())
      .filter(u => typeof u.id === 'number' && u.class_id === classId && u.is_active === 1)
  }
}

// ============================================
// Session相关操作
// ============================================

export const SessionDB = {
  create(userId, token, expiresAt, ipAddress, userAgent) {
    const id = sessionIdCounter++
    const session = {
      id,
      user_id: userId,
      session_token: token,
      expires_at: expiresAt,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    }
    sessions.set(token, session)
    return { lastInsertRowid: id }
  },

  findValid(token) {
    const session = sessions.get(token)
    if (!session) return null

    const now = new Date()
    const expires = new Date(session.expires_at)

    if (expires <= now) return null

    const user = users.get(session.user_id)
    if (!user) return null

    return { ...session, ...user }
  },

  delete(token) {
    const deleted = sessions.delete(token)
    return { changes: deleted ? 1 : 0 }
  },

  cleanExpired() {
    const now = new Date()
    let count = 0
    for (const [token, session] of sessions.entries()) {
      if (new Date(session.expires_at) <= now) {
        sessions.delete(token)
        count++
      }
    }
    return { changes: count }
  }
}

// ============================================
// 反馈相关操作
// ============================================

export const FeedbackDB = {
  create(feedbackData) {
    const id = feedbackIdCounter++
    const feedback = {
      id,
      user_id: feedbackData.user_id,
      role: feedbackData.role,
      feedback_type: feedbackData.feedback_type || 'individual',
      class_id: feedbackData.class_id,
      grade: feedbackData.grade,
      modules_used: feedbackData.modules_used,
      understanding_score: feedbackData.understanding_score,
      interest_score: feedbackData.interest_score,
      difficulty_score: feedbackData.difficulty_score,
      difficulty_aspects: feedbackData.difficulty_aspects,
      teaching_effectiveness: feedbackData.teaching_effectiveness,
      student_engagement: feedbackData.student_engagement,
      technical_issues: feedbackData.technical_issues,
      open_comment: feedbackData.open_comment,
      suggestions: feedbackData.suggestions,
      rating: feedbackData.rating,
      tags: feedbackData.tags,
      status: feedbackData.status || 'pending',
      reviewed_by: null,
      reviewed_at: null,
      created_at: new Date().toISOString()
    }
    feedbacks.push(feedback)
    return { lastInsertRowid: id }
  },

  list(filters = {}) {
    let results = [...feedbacks]

    // 用户ID过滤（学生只能看自己的）
    if (filters.user_id) {
      results = results.filter(f => f.user_id === filters.user_id)
    }
    if (filters.role) {
      results = results.filter(f => f.role === filters.role)
    }
    if (filters.class_id) {
      results = results.filter(f => f.class_id === filters.class_id)
    }
    if (filters.status) {
      results = results.filter(f => f.status === filters.status)
    }
    if (filters.feedback_type) {
      results = results.filter(f => f.feedback_type === filters.feedback_type)
    }

    // Sort by created_at DESC
    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    if (filters.limit) {
      results = results.slice(0, filters.limit)
    }

    // Join with user data
    return results.map(f => {
      const user = users.get(f.user_id)
      return {
        ...f,
        username: user?.username,
        display_name: user?.display_name
      }
    })
  },

  findById(id) {
    const feedback = feedbacks.find(f => f.id === id)
    if (!feedback) return null

    const user = users.get(feedback.user_id)
    return {
      ...feedback,
      username: user?.username,
      display_name: user?.display_name
    }
  },

  updateStatus(id, status, reviewedBy = null) {
    const feedback = feedbacks.find(f => f.id === id)
    if (!feedback) return { changes: 0 }

    feedback.status = status
    feedback.reviewed_by = reviewedBy
    feedback.reviewed_at = new Date().toISOString()
    return { changes: 1 }
  },

  delete(id) {
    const index = feedbacks.findIndex(f => f.id === id)
    if (index === -1) return { changes: 0 }

    feedbacks.splice(index, 1)
    return { changes: 1 }
  }
}

// ============================================
// 统计相关操作
// ============================================

export const StatsDB = {
  moduleUsage() {
    const usage = {}
    feedbacks.forEach(f => {
      if (!f.modules_used) return
      const modules = JSON.parse(f.modules_used || '[]')
      modules.forEach(m => {
        usage[m] = (usage[m] || 0) + 1
      })
    })
    return Object.entries(usage).map(([module_name, usage_count]) => ({
      module_name,
      usage_count,
      avg_rating: 0,
      avg_interest: 0
    }))
  },

  ratingTrend(days = 30) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    const byDate = {}
    feedbacks
      .filter(f => f.rating && new Date(f.created_at) >= cutoff)
      .forEach(f => {
        const date = f.created_at.split('T')[0]
        if (!byDate[date]) {
          byDate[date] = { count: 0, totalRating: 0, totalUnderstanding: 0, totalInterest: 0 }
        }
        byDate[date].count++
        byDate[date].totalRating += f.rating
        byDate[date].totalUnderstanding += f.understanding_score || 0
        byDate[date].totalInterest += f.interest_score || 0
      })

    return Object.entries(byDate).map(([date, data]) => ({
      date,
      count: data.count,
      avg_rating: data.totalRating / data.count,
      avg_understanding: data.totalUnderstanding / data.count,
      avg_interest: data.totalInterest / data.count
    }))
  },

  interestDistribution() {
    const dist = {}
    feedbacks.forEach(f => {
      if (f.interest_score) {
        dist[f.interest_score] = (dist[f.interest_score] || 0) + 1
      }
    })
    return Object.entries(dist).map(([score, count]) => ({
      score: parseInt(score),
      count
    }))
  },

  understandingDistribution() {
    const dist = {}
    feedbacks.forEach(f => {
      if (f.understanding_score) {
        dist[f.understanding_score] = (dist[f.understanding_score] || 0) + 1
      }
    })
    return Object.entries(dist).map(([score, count]) => ({
      score: parseInt(score),
      count
    }))
  },

  classPerformance() {
    return []
  },

  overview() {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    return {
      totalFeedbacks: feedbacks.length,
      totalUsers: Array.from(users.values()).filter(u => typeof u.id === 'number' && u.is_active === 1).length,
      todayFeedbacks: feedbacks.filter(f => f.created_at.startsWith(today)).length,
      avgRating: feedbacks
        .filter(f => f.rating && new Date(f.created_at) >= weekAgo)
        .reduce((sum, f, i, arr) => sum + f.rating / arr.length, 0) || 0,
      pendingFeedbacks: feedbacks.filter(f => f.status === 'pending').length
    }
  }
}

// ============================================
// 学习进度相关操作
// ============================================

const progress = []
let progressIdCounter = 1

export const ProgressDB = {
  upsert(userId, moduleName, lessonId, data) {
    const existing = progress.find(p =>
      p.user_id === userId && p.module_name === moduleName && p.lesson_id === lessonId
    )

    if (existing) {
      existing.completed = data.completed
      existing.completion_rate = data.completion_rate
      existing.time_spent += data.time_spent
      existing.attempts += 1
      existing.score = data.score
      existing.last_accessed = new Date().toISOString()
      if (data.completed) {
        existing.completed_at = new Date().toISOString()
      }
      return { changes: 1 }
    } else {
      const id = progressIdCounter++
      progress.push({
        id,
        user_id: userId,
        module_name: moduleName,
        lesson_id: lessonId,
        completed: data.completed,
        completion_rate: data.completion_rate,
        time_spent: data.time_spent,
        attempts: 1,
        score: data.score,
        max_score: data.max_score,
        started_at: data.started_at || new Date().toISOString(),
        last_accessed: new Date().toISOString(),
        completed_at: data.completed ? new Date().toISOString() : null
      })
      return { lastInsertRowid: id }
    }
  },

  getUserProgress(userId) {
    return progress
      .filter(p => p.user_id === userId)
      .sort((a, b) => new Date(b.last_accessed) - new Date(a.last_accessed))
  }
}

export default { getDB, initDB, closeDB, UserDB, SessionDB, FeedbackDB, StatsDB, ProgressDB }
