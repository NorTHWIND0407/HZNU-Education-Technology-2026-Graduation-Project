/**
 * 认证状态管理
 * Authentication State Management
 */

import { create } from 'zustand'
import { authAPI, getSavedUser, clearAuth, type User } from './apiClient'

interface AuthState {
  // 状态
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // 操作
  login: (username: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // 初始状态
  user: getSavedUser(),
  isAuthenticated: !!getSavedUser(),
  isLoading: false,
  error: null,

  // 登录
  login: async (username: string) => {
    set({ isLoading: true, error: null })

    try {
      const response = await authAPI.login(username)

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      })
    } catch (error: any) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || '登录失败'
      })
      throw error
    }
  },

  // 登出
  logout: async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuth()
      set({
        user: null,
        isAuthenticated: false,
        error: null
      })
    }
  },

  // 检查认证状态
  checkAuth: async () => {
    const savedUser = getSavedUser()

    if (!savedUser) {
      set({ isAuthenticated: false, user: null })
      return
    }

    set({ isLoading: true })

    try {
      const user = await authAPI.getCurrentUser()
      set({
        user,
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error) {
      clearAuth()
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  },

  // 清除错误
  clearError: () => {
    set({ error: null })
  },

  // 更新用户信息
  updateUser: (updates: Partial<User>) => {
    const currentUser = get().user
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates }
      set({ user: updatedUser })
      localStorage.setItem('user_info', JSON.stringify(updatedUser))
    }
  }
}))
