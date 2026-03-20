import React from 'react'
import { createBrowserRouter, Outlet, Link, useLocation } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import About from './pages/AboutLantern'
import Microdoc from './pages/Microdoc'
import Lessons from './pages/Lessons'
import Handbook from './pages/H5Handbook'
import WebAR from './pages/WebAR'
import ModuleDownload from './pages/ModuleDownload'
import AIQA from './pages/AIQA'
import Feedback from './pages/Feedback'
import Login from './pages/Login'
import Resources from './pages/Resources'

function Layout() {
  const loc = useLocation()
  const isMicrodocPage = loc.pathname.startsWith('/microdoc')

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className={isMicrodocPage ? 'flex-1 w-full px-3 md:px-6 lg:px-10 py-6' : 'flex-1 container-narrow py-6'}>
        <Breadcrumbs />
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

function Breadcrumbs() {
  const loc = useLocation()
  const parts = loc.pathname.split('/').filter(Boolean)
  const crumbs = [<Link key="home" to="/">首页 Home</Link>]
  let path = ''
  parts.forEach((p, i) => {
    path += `/${p}`
    crumbs.push(
      <span key={`sep-${i}`} className="mx-1 text-gray-400">/</span>,
      <Link key={`p-${i}`} to={path}>{decodeURIComponent(p)}</Link>
    )
  })
  return (
    <nav aria-label="Breadcrumb" className="text-sm mb-4 overflow-x-auto whitespace-nowrap">
      {crumbs}
    </nav>
  )
}

export const router = createBrowserRouter([
  // 登录页面（无需Layout）
  {
    path: '/login',
    element: <Login />
  },
  // 主应用Layout
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about-linping-lantern', element: <About /> },
      { path: 'microdoc', element: <Microdoc /> },
      { path: 'lessons', element: <Lessons /> },
      { path: 'resources', element: <Resources /> },
      { path: 'h5-handbook', element: <Handbook /> },
      { path: 'webar', element: <WebAR /> },
      { path: 'module-download', element: <ModuleDownload /> },
      { path: 'ai-qa', element: <AIQA /> },
      // 反馈页面需要登录
      {
        path: 'feedback',
        element: (
          <ProtectedRoute>
            <Feedback />
          </ProtectedRoute>
        )
      },
    ]
  }
])
