import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './styles/tailwind.css'
import { router } from './router'
import { useAppStore } from './lib/store'
import { validateEnv, printEnvInfo } from './lib/validateEnv'

// 验证环境变量
try {
  validateEnv()
  printEnvInfo()
} catch (error) {
  console.error('Environment validation failed:', error)
  // 在开发环境中可以继续运行，生产环境应该阻止
  if (import.meta.env.PROD) {
    throw error
  }
}

function AppShell() {
  const theme = useAppStore(s => s.theme)
  React.useEffect(() => {
    const cls = document.documentElement.classList
    theme === 'dark' ? cls.add('dark') : cls.remove('dark')
  }, [theme])
  return <RouterProvider router={router} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>
)

