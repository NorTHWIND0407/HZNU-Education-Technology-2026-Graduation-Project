/**
 * 登录页面
 * Login Page
 */

import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../lib/authStore'
import { useAppStore } from '../lib/store'
import { t } from '../lib/i18n'
import { InlineLoading } from '../components/Loading'

type LoginLocationState = {
  from?: {
    pathname?: string
  }
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const lang = useAppStore(s => s.lang)

  const { login, isLoading, error, clearError } = useAuthStore()

  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showHelper, setShowHelper] = React.useState(false)

  // 清除错误
  React.useEffect(() => {
    return () => clearError()
  }, [clearError])

  // 处理登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password.trim()) {
      return
    }

    try {
      await login(username.trim(), password.trim())

      // 登录成功，跳转到之前的页面或首页
      const from = (location.state as LoginLocationState | null)?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch (err) {
      // 错误已经在store中处理
      console.error('Login failed:', err)
    }
  }

  // 快速登录示例
  const quickLogin = (role: 'student' | 'teacher' | 'admin') => {
    const usernames = {
      student: 's30101',
      teacher: 't301',
      admin: 'admin'
    }
    const account = usernames[role]
    setUsername(account)
    setPassword(account)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-paper to-gold-50 dark:from-paper-dark dark:to-ink-900 px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo和标题 */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-gold-500 shadow-traditional-lg mb-4">
            <span className="text-white text-4xl font-bold">灯</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-ink-900 dark:text-gray-100 mb-2">
            {t('hero_title', lang)}
          </h1>
          <p className="text-lg text-ink-600 dark:text-gray-400">
            {lang === 'zh' ? '文化传承教育平台' : 'Cultural Heritage Education Platform'}
          </p>
        </div>

        {/* 登录卡片 */}
        <div className="card p-8 animate-slide-up">
          <h2 className="text-2xl font-serif font-bold text-center mb-6 text-ink-900 dark:text-gray-100">
            {lang === 'zh' ? '登录系统' : 'Login'}
          </h2>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm animate-fade-in">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* 登录表单 */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-2">
                {lang === 'zh' ? '账号' : 'Account'}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={lang === 'zh' ? '请输入账号（如 s30101 / t301 / admin）' : 'Enter account'}
                className="input text-lg"
                disabled={isLoading}
                autoFocus
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink-700 dark:text-gray-300 mb-2">
                {lang === 'zh' ? '密码' : 'Password'}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={lang === 'zh' ? '请输入密码' : 'Enter password'}
                className="input text-lg"
                disabled={isLoading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !username.trim() || !password.trim()}
              className="btn w-full !py-3 text-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <InlineLoading />
                  <span>{lang === 'zh' ? '登录中...' : 'Logging in...'}</span>
                </span>
              ) : (
                <span>{lang === 'zh' ? '登录' : 'Login'}</span>
              )}
            </button>
          </form>

          {/* 帮助按钮 */}
          <div className="mt-6">
            <button
              onClick={() => setShowHelper(!showHelper)}
              className="w-full text-center text-sm text-ink-600 dark:text-gray-400 hover:text-brand transition-colors"
            >
              {showHelper ? '隐藏帮助' : lang === 'zh' ? '查看示例账号' : 'View Example Accounts'}
              <svg className={`inline-block w-4 h-4 ml-1 transition-transform ${showHelper ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* 示例账号 */}
          {showHelper && (
            <div className="mt-4 p-4 rounded-md bg-gold-50 dark:bg-gold-900/10 border border-gold-200 dark:border-gold-800 animate-fade-in">
              <p className="text-sm font-medium text-ink-800 dark:text-gray-200 mb-3">
                {lang === 'zh' ? '快速登录示例账号：' : 'Quick Login Examples:'}
              </p>
              <div className="space-y-2">
                {[
                  { role: 'student' as const, id: 's30101', label: lang === 'zh' ? '学生账号' : 'Student' },
                  { role: 'teacher' as const, id: 't301', label: lang === 'zh' ? '教师账号' : 'Teacher' },
                  { role: 'admin' as const, id: 'admin', label: lang === 'zh' ? '管理员' : 'Admin' }
                ].map(({ role, id, label }) => (
                  <button
                    key={role}
                    onClick={() => quickLogin(role)}
                    className="w-full flex items-center justify-between p-3 rounded-md border-2 border-gold-200 dark:border-gold-800 hover:border-brand-400 hover:bg-white dark:hover:bg-ink-800 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <div className="text-sm font-medium text-ink-800 dark:text-gray-200">{label}</div>
                        <div className="text-xs text-ink-500 dark:text-gray-500 font-mono">{id}</div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-ink-400 dark:text-gray-500 group-hover:text-brand transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-ink-600 dark:text-gray-400">
                {lang === 'zh'
                  ? '规则：学生 s+年级(3-9)+班级(01-10)+学号(01-45)（示例 s30101，学生账号与密码相同）；教师 t+年级+班级（示例 t301）；管理员 admin。'
                  : 'Rule: student s+class+number; teacher t+class; admin is admin.'}
              </p>
            </div>
          )}
        </div>

        {/* 底部说明 */}
        <div className="mt-6 text-center text-sm text-ink-600 dark:text-gray-400">
          <p>{lang === 'zh' ? '首次使用将自动创建账户档案' : 'Your profile will be created on first use'}</p>
          <p className="mt-2 text-xs">
            {lang === 'zh' ? '登录后默认姓名为账号，可在右上角菜单修改为真实姓名' : 'Display name defaults to account and can be changed in the user menu'}
          </p>
          <p className="mt-2 text-xs">
            {lang === 'zh'
              ? '系统仅做登录校验，不保存账号密码'
              : 'The system validates login only and does not store passwords'}
          </p>
        </div>

        {/* 装饰元素 */}
        <div className="mt-8 flex justify-center">
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent rounded-full"></div>
        </div>
      </div>
    </div>
  )
}
