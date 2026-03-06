import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAppStore } from '../lib/store'
import { useAuthStore } from '../lib/authStore'
import { t } from '../lib/i18n'
import React from 'react'

export default function Nav() {
  const navigate = useNavigate()
  const { theme, toggleTheme, lang, toggleLang } = useAppStore()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [userMenuOpen, setUserMenuOpen] = React.useState(false)

  const navItems = [
    { to: '/', label: 'nav_home' },
    { to: '/about-linping-lantern', label: 'nav_about' },
    { to: '/microdoc', label: 'nav_microdoc' },
    { to: '/lessons', label: 'nav_lessons' },
    { to: '/resources', label: 'nav_resources' },
    { to: '/h5-handbook', label: 'nav_handbook' },
    { to: '/webar', label: 'nav_webar' },
    { to: '/ai-qa', label: 'nav_aiqa' },
    { to: '/feedback', label: 'nav_feedback' },
  ]

  const roleBadgeClass =
    user?.role === 'teacher'
      ? 'badge-gold'
      : user?.role === 'admin'
        ? 'badge-jade'
        : 'badge'

  return (
    <header className="sticky top-0 z-50 border-b-2 border-gold-200 dark:border-gold-800/30 bg-paper/95 dark:bg-paper-dark/95 backdrop-blur-md shadow-traditional">
      <div className="container-narrow">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-gold-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white text-lg font-bold">灯</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-serif font-bold text-xl text-gradient-brand">
                {t('hero_title', lang)}
              </div>
              <div className="text-xs text-ink-500 dark:text-gray-400">
                {lang === 'zh' ? 'Rolling Lantern' : '滚灯'}
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-brand text-white shadow-md'
                      : 'text-ink-700 dark:text-gray-300 hover:bg-gold-100 dark:hover:bg-gold-900/20'
                  }`
                }
              >
                {t(item.label, lang)}
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="btn-ghost !px-3 !py-2 text-sm font-medium"
              aria-label={t('lang_switch', lang)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span className="hidden sm:inline">{lang === 'zh' ? 'EN' : '中'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="btn-ghost !px-3 !py-2"
              aria-label={theme === 'dark' ? t('theme_light', lang) : t('theme_dark', lang)}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* User Menu */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gold-100 dark:hover:bg-gold-900/20 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-gold-400 flex items-center justify-center text-white font-bold text-sm">
                    {user.displayName[0]}
                  </div>
                  <span className="hidden md:inline text-sm font-medium text-ink-800 dark:text-gray-200">
                    {user.displayName}
                  </span>
                  <svg className={`w-4 h-4 text-ink-600 dark:text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 card p-3 shadow-traditional-lg animate-fade-in">
                    <div className="pb-3 mb-3 border-b border-gold-200 dark:border-gold-800">
                      <p className="font-semibold text-ink-900 dark:text-gray-100">{user.displayName}</p>
                      <p className="text-xs text-ink-500 dark:text-gray-500 font-mono">{user.username}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={roleBadgeClass}>
                          {user.role === 'student' && (lang === 'zh' ? '学生' : 'Student')}
                          {user.role === 'teacher' && (lang === 'zh' ? '教师' : 'Teacher')}
                          {user.role === 'admin' && (lang === 'zh' ? '管理员' : 'Admin')}
                        </span>
                        {user.grade && <span className="text-xs text-ink-600 dark:text-gray-400">{user.grade}</span>}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        setUserMenuOpen(false)
                        await logout()
                        navigate('/login')
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {lang === 'zh' ? '退出登录' : 'Logout'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn !px-4 !py-2 text-sm">
                {lang === 'zh' ? '登录' : 'Login'}
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden btn-ghost !px-3 !py-2"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t-2 border-gold-200 dark:border-gold-800/30 animate-fade-in">
            <nav className="flex flex-col gap-2">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-md text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand text-white shadow-md'
                        : 'text-ink-700 dark:text-gray-300 hover:bg-gold-100 dark:hover:bg-gold-900/20'
                    }`
                  }
                >
                  {t(item.label, lang)}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
