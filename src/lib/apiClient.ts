/**
 * API客户端
 * 统一管理所有API请求
 */

import axios, { AxiosInstance, AxiosError } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// 创建axios实例
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('session_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
  response => response.data,
  (error: AxiosError<any>) => {
    // Token过期或无效
    if (error.response?.status === 401) {
      localStorage.removeItem('session_token')
      localStorage.removeItem('user_info')
      // 跳转登录页（如果不在登录页）
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }

    // 返回错误信息
    const message = error.response?.data?.message || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

// ============================================
// 类型定义
// ============================================

export interface User {
  id: number
  username: string
  displayName: string
  role: 'student' | 'teacher' | 'admin'
  grade?: string
  classId?: string
}

export interface LoginResponse {
  success: boolean
  user: User
  session: {
    token: string
    expiresAt: string
  }
}

export interface FeedbackData {
  feedbackType?: string
  classId?: string
  grade?: string
  modulesUsed?: string[]
  lessonId?: string
  understandingScore?: number
  interestScore?: number
  difficultyScore?: number
  difficultyAspects?: string[]
  teachingEffectiveness?: number
  studentEngagement?: number
  technicalIssues?: string
  openComment?: string
  suggestions?: string
  rating: number
  tags?: string[]
}

export interface Feedback extends FeedbackData {
  id: number
  userId: number
  username: string
  displayName: string
  role: string
  status: 'pending' | 'reviewed' | 'resolved' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface StatsOverview {
  totalFeedbacks: number
  totalUsers: number
  todayFeedbacks: number
  avgRating: number
  pendingFeedbacks: number
}

export interface ChartDataPoint {
  [key: string]: any
}

export interface MicrodocComment {
  id: number
  clipId: string
  userId: number | null
  username: string
  displayName: string
  content: string
  createdAt: string
  updatedAt?: string
}

export interface MicrodocEngagement {
  clipId: string
  likeCount: number
  likedByMe: boolean
  comments: MicrodocComment[]
  commentLoginRequired?: boolean
}

export interface ResourceFileItem {
  id: string
  fileDbId?: number
  label: string
  type: string
  format?: string
  previewUrl?: string
  downloadUrl: string
  originalName?: string
  mimeType?: string
  fileSize?: number
}

export interface CourseResourceItem {
  id: string
  resourceDbId?: number
  subject: string
  subjectEn?: string
  title: string
  grade?: string
  summary?: string
  keywords?: string[]
  status?: string
  isSystem?: boolean
  files: ResourceFileItem[]
}

export interface ResourceUploadPayload {
  subject: string
  title: string
  grade?: string
  summary?: string
  keywords?: string[] | string
  file: File
  fileLabel?: string
  fileType?: string
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

// ============================================
// 认证 API
// ============================================

export const authAPI = {
  /**
   * 登录/注册
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<any, LoginResponse>('/auth/login', { username, password })

    if (response.success) {
      // 保存token和用户信息
      localStorage.setItem('session_token', response.session.token)
      localStorage.setItem('user_info', JSON.stringify(response.user))
    }

    return response
  },

  /**
   * 登出
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      // 无论成功与否，都清除本地数据
      localStorage.removeItem('session_token')
      localStorage.removeItem('user_info')
    }
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<any, { success: boolean; user: User }>('/auth/me')
    return response.user
  },

  /**
   * 快速登录（二维码）
   */
  async quickLogin(): Promise<{ quickCode: string; qrCodeUrl: string; expiresIn: number }> {
    const response = await apiClient.post<any, any>('/auth/quick-login')
    return response
  }
}

// ============================================
// 反馈 API
// ============================================

export const feedbackAPI = {
  /**
   * 提交反馈
   */
  async submit(data: FeedbackData): Promise<Feedback> {
    const response = await apiClient.post<any, { success: boolean; feedback: Feedback }>('/feedback', data)
    return response.feedback
  },

  /**
   * 获取反馈列表
   */
  async list(params?: {
    role?: string
    class_id?: string
    status?: string
    feedback_type?: string
    limit?: number
  }): Promise<Feedback[]> {
    const response = await apiClient.get<any, { success: boolean; feedbacks: Feedback[] }>('/feedback', { params })
    return response.feedbacks
  },

  /**
   * 获取单个反馈
   */
  async getById(id: number): Promise<Feedback> {
    const response = await apiClient.get<any, { success: boolean; feedback: Feedback }>(`/feedback/${id}`)
    return response.feedback
  },

  /**
   * 更新反馈（教师/管理员）
   */
  async update(id: number, data: Partial<FeedbackData> & { status?: string; adminNotes?: string; classId?: string }): Promise<Feedback> {
    const response = await apiClient.patch<any, { success: boolean; feedback: Feedback }>(`/feedback/${id}`, data)
    return response.feedback
  },

  /**
   * 更新反馈状态
   */
  async updateStatus(id: number, status: string): Promise<Feedback> {
    const response = await apiClient.patch<any, { success: boolean; feedback: Feedback }>(`/feedback/${id}/status`, { status })
    return response.feedback
  },

  /**
   * 删除反馈
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/feedback/${id}`)
  },

  /**
   * 批量提交（教师）
   */
  async batchSubmit(feedbacks: Array<Partial<FeedbackData> & { userId: number }>): Promise<any> {
    const response = await apiClient.post<any, any>('/feedback/batch', { feedbacks })
    return response
  }
}

// ============================================
// 微纪录片评论区 API
// ============================================

export const microdocAPI = {
  async getEngagement(clipId: string, visitorId?: string): Promise<MicrodocEngagement> {
    const response = await apiClient.get<any, { success: boolean; data: MicrodocEngagement }>(
      `/microdoc/${encodeURIComponent(clipId)}`,
      { params: { visitorId } }
    )
    return response.data
  },

  async toggleLike(clipId: string, visitorId?: string): Promise<Pick<MicrodocEngagement, 'clipId' | 'likeCount' | 'likedByMe'>> {
    const response = await apiClient.post<any, {
      success: boolean
      data: Pick<MicrodocEngagement, 'clipId' | 'likeCount' | 'likedByMe'>
    }>(`/microdoc/${encodeURIComponent(clipId)}/like`, { visitorId })
    return response.data
  },

  async createComment(clipId: string, payload: {
    content: string
    visitorId?: string
  }): Promise<{ clipId: string; comment: MicrodocComment }> {
    const response = await apiClient.post<any, {
      success: boolean
      data: { clipId: string; comment: MicrodocComment }
    }>(`/microdoc/${encodeURIComponent(clipId)}/comments`, payload)
    return response.data
  }
}

// ============================================
// 统计 API
// ============================================

export const statsAPI = {
  /**
   * 获取概览统计
   */
  async overview(): Promise<StatsOverview> {
    const response = await apiClient.get<any, { success: boolean; data: StatsOverview }>('/stats/overview')
    return response.data
  },

  /**
   * 模块使用统计
   */
  async moduleUsage(): Promise<ChartDataPoint[]> {
    const response = await apiClient.get<any, { success: boolean; data: ChartDataPoint[] }>('/stats/module-usage')
    return response.data
  },

  /**
   * 评分趋势
   */
  async ratingTrend(days: number = 30): Promise<ChartDataPoint[]> {
    const response = await apiClient.get<any, { success: boolean; data: ChartDataPoint[] }>('/stats/rating-trend', {
      params: { days }
    })
    return response.data
  },

  /**
   * 兴趣度分布
   */
  async interestDistribution(): Promise<ChartDataPoint[]> {
    const response = await apiClient.get<any, { success: boolean; data: ChartDataPoint[] }>('/stats/interest-distribution')
    return response.data
  },

  /**
   * 理解度分布
   */
  async understandingDistribution(): Promise<ChartDataPoint[]> {
    const response = await apiClient.get<any, { success: boolean; data: ChartDataPoint[] }>('/stats/understanding-distribution')
    return response.data
  },

  /**
   * 班级表现
   */
  async classPerformance(): Promise<ChartDataPoint[]> {
    const response = await apiClient.get<any, { success: boolean; data: ChartDataPoint[] }>('/stats/class-performance')
    return response.data
  },

  /**
   * 自评雷达图
   */
  async selfEvalRadar(userId?: number, classId?: string): Promise<ChartDataPoint[]> {
    const response = await apiClient.get<any, { success: boolean; data: ChartDataPoint[] }>('/stats/self-eval-radar', {
      params: { userId, classId }
    })
    return response.data
  },

  /**
   * 导出CSV
   */
  async exportCSV(type: string = 'feedbacks', classId?: string): Promise<Blob> {
    const response = await apiClient.get('/stats/export/csv', {
      params: { type, classId },
      responseType: 'blob'
    })
    return response as any
  }
}

// ============================================
// 用户 API
// ============================================

export const userAPI = {
  /**
   * 获取班级用户列表
   */
  async getClassUsers(classId: string): Promise<User[]> {
    const response = await apiClient.get<any, { success: boolean; users: User[] }>(`/users/class/${classId}`)
    return response.users
  },

  /**
   * 获取用户详情
   */
  async getById(id: number): Promise<User> {
    const response = await apiClient.get<any, { success: boolean; user: User }>(`/users/${id}`)
    return response.user
  },

  /**
   * 更新用户信息
   */
  async update(id: number, data: Partial<User>): Promise<User> {
    const response = await apiClient.patch<any, { success: boolean; user: User }>(`/users/${id}`, data)
    return response.user
  }
}

// ============================================
// 课程资源 API
// ============================================

export const resourcesAPI = {
  async list(params?: { subject?: string }): Promise<{ subjects: string[]; items: CourseResourceItem[] }> {
    const response = await apiClient.get<any, { success: boolean; subjects: string[]; items: CourseResourceItem[] }>(
      '/resources',
      { params }
    )
    return { subjects: response.subjects || [], items: response.items || [] }
  },

  async upload(payload: ResourceUploadPayload): Promise<CourseResourceItem | null> {
    const fileBase64 = await fileToBase64(payload.file)
    const response = await apiClient.post<any, { success: boolean; item: CourseResourceItem | null }>(
      '/resources/upload',
      {
        subject: payload.subject,
        title: payload.title,
        grade: payload.grade,
        summary: payload.summary,
        keywords: payload.keywords,
        fileBase64,
        fileName: payload.file.name,
        mimeType: payload.file.type,
        fileLabel: payload.fileLabel,
        fileType: payload.fileType
      }
    )
    return response.item || null
  }
}

// ============================================
// 工具函数
// ============================================

/**
 * 获取保存的用户信息
 */
export function getSavedUser(): User | null {
  try {
    const userStr = localStorage.getItem('user_info')
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  const token = localStorage.getItem('session_token')
  const user = getSavedUser()
  return !!(token && user)
}

/**
 * 清除登录信息
 */
export function clearAuth(): void {
  localStorage.removeItem('session_token')
  localStorage.removeItem('user_info')
}

/**
 * 获取实时 WebSocket 地址
 */
export function getWebSocketUrl(path: string = '/ws'): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'
  const apiUrl = new URL(API_BASE_URL, origin)
  const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${apiUrl.host}${path}`
}

export default {
  auth: authAPI,
  feedback: feedbackAPI,
  microdoc: microdocAPI,
  stats: statsAPI,
  user: userAPI,
  resources: resourcesAPI,
  getSavedUser,
  isLoggedIn,
  clearAuth
}
