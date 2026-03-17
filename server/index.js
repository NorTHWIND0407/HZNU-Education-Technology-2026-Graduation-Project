/**
 * 临平滚灯反馈系统 - 后端服务器
 * Linping Rolling Lantern Feedback System - Backend Server
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import './config/loadEnv.js'
import { initDB, closeDB } from './db/index.js'

// 导入路由
import authRoutes from './routes/auth.js'
import feedbackRoutes from './routes/feedback.js'
import statsRoutes from './routes/stats.js'
import userRoutes from './routes/users.js'
import resourceRoutes from './routes/resources.js'
import microdocRoutes from './routes/microdoc.js'
import aiRoutes from './routes/ai.js'

const app = express()
const PORT = process.env.PORT || 3001

// ============================================
// 中间件配置
// ============================================

// 安全头部
app.use(helmet({
  frameguard: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}))

// CORS配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}))

// 解析JSON
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// 限流
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: '请求过于频繁，请稍后再试'
})
app.use('/api/', limiter)

// ============================================
// 路由配置
// ============================================

app.get('/', (req, res) => {
  res.json({
    name: '临平滚灯反馈系统 API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      feedback: '/api/feedback',
      microdoc: '/api/microdoc',
      stats: '/api/stats',
      users: '/api/users',
      resources: '/api/resources',
      ai: '/api/ai'
    }
  })
})

// API路由
app.use('/api/auth', authRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/microdoc', microdocRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/users', userRoutes)
app.use('/api/resources', resourceRoutes)
app.use('/api/ai', aiRoutes)

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `路径 ${req.path} 不存在`
  })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error('[Error]', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// ============================================
// WebSocket服务器（实时更新）
// ============================================

const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected')

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message)
      console.log('[WebSocket] Received:', data)

      // 处理不同类型的消息
      if (data.type === 'subscribe') {
        ws.channel = data.channel
      }
    } catch (err) {
      console.error('[WebSocket] Error:', err)
    }
  })

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected')
  })

  // 发送欢迎消息
  ws.send(JSON.stringify({ type: 'connected', message: '连接成功' }))
})

// 广播函数（用于实时更新）
export function broadcast(channel, data) {
  wss.clients.forEach(client => {
    if (client.readyState === 1 && (!channel || client.channel === channel)) {
      client.send(JSON.stringify(data))
    }
  })
}

// ============================================
// 启动服务器
// ============================================

async function startServer() {
  await initDB()

  server.listen(PORT, () => {
    console.log('='.repeat(50))
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
    console.log(`📊 WebSocket 端点: ws://localhost:${PORT}/ws`)
    console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`)
    console.log('='.repeat(50))
  })
}

startServer().catch(err => {
  console.error('[Server] Failed to start:', err)
  process.exit(1)
})

process.on('SIGINT', () => {
  closeDB()
  process.exit(0)
})

process.on('SIGTERM', () => {
  closeDB()
  process.exit(0)
})

export default app
