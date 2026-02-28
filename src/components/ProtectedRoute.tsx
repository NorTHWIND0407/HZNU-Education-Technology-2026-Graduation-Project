/**
 * 路由守卫组件
 * Protected Route Component
 */

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../lib/authStore'
import Loading from './Loading'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: ('student' | 'teacher' | 'admin')[]
}

/**
 * 受保护的路由
 * 需要登录才能访问
 * 可选：限制特定角色访问
 */
export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, user, isLoading, checkAuth } = useAuthStore()

  // 初始化时检查认证状态
  React.useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // 加载中显示loading
  if (isLoading) {
    return <Loading fullScreen text="验证身份中..." />
  }

  // 未登录，跳转到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 角色检查
  if (roles && roles.length > 0 && user) {
    if (!roles.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="card p-8 max-w-md text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-serif font-bold text-ink-900 dark:text-gray-100 mb-2">
              权限不足
            </h1>
            <p className="text-ink-600 dark:text-gray-400 mb-6">
              您没有权限访问此页面
            </p>
            <button
              onClick={() => window.history.back()}
              className="btn"
            >
              返回
            </button>
          </div>
        </div>
      )
    }
  }

  // 通过验证，渲染子组件
  return <>{children}</>
}
