/**
 * AI问答聊天组件
 * 支持流式响应（打字机效果）和历史记录
 */

import React from 'react'
import { ask, askStream, getAIConfig, type ChatMessage } from '../lib/aiClient'
import { useAppStore } from '../lib/store'
import { t } from '../lib/i18n'
import { InlineLoading } from './Loading'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

const formatDateTime = (date: Date, lang: string) =>
  date.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', { hour12: false })

const formatFileTimestamp = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}${m}${d}-${h}${min}${s}`
}

export default function QAChat() {
  const lang = useAppStore(s => s.lang)
  const [question, setQuestion] = React.useState('')
  const [messages, setMessages] = React.useState<Message[]>([])
  const [loading, setLoading] = React.useState(false)
  const [streamingMessage, setStreamingMessage] = React.useState('')
  const [isStreaming, setIsStreaming] = React.useState(false)
  const [config, setConfig] = React.useState<any>(null)

  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const chatContainerRef = React.useRef<HTMLDivElement>(null)
  const isAutoScrollEnabled = React.useRef(true)  // 是否启用自动滚动
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // 获取AI配置
  React.useEffect(() => {
    setConfig(getAIConfig())
  }, [])

  // 检查是否在底部
  const isNearBottom = () => {
    const container = chatContainerRef.current
    if (!container) return true

    const { scrollTop, scrollHeight, clientHeight } = container
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    return distanceFromBottom < 100  // 距离底部100px以内认为在底部
  }

  // 滚动到底部
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      })
    }
  }

  // 监听用户滚动事件
  const handleScroll = () => {
    // 清除之前的定时器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // 检查用户是否在底部
    const nearBottom = isNearBottom()

    // 如果用户滚到底部，启用自动滚动
    // 如果用户向上滚动离开底部，禁用自动滚动
    isAutoScrollEnabled.current = nearBottom

    // 防抖：100ms后再次检查
    scrollTimeoutRef.current = setTimeout(() => {
      isAutoScrollEnabled.current = isNearBottom()
    }, 100)
  }

  // 监听滚动事件
  React.useEffect(() => {
    const container = chatContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true })
      return () => {
        container.removeEventListener('scroll', handleScroll)
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
      }
    }
  }, [])

  // 新消息添加时，如果启用了自动滚动才滚动
  React.useEffect(() => {
    if (messages.length > 0 && isAutoScrollEnabled.current) {
      scrollToBottom()
    }
  }, [messages])

  // 流式消息更新时，只在用户没有手动滚动的情况下自动跟随
  React.useEffect(() => {
    if (isStreaming && streamingMessage && isAutoScrollEnabled.current) {
      // 使用节流，每200ms最多滚动一次
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = setTimeout(() => {
        if (isAutoScrollEnabled.current) {
          scrollToBottom(false)  // 流式时使用instant滚动，减少卡顿
        }
      }, 200)
    }
  }, [streamingMessage, isStreaming])

  // 提交问题（流式响应）
  const handleAskStream = async () => {
    if (!question.trim() || loading) return

    const userQuestion = question.trim()
    setQuestion('')
    setLoading(true)
    setIsStreaming(true)

    // 开始新问题时，启用自动滚动
    isAutoScrollEnabled.current = true

    // 添加用户消息
    const userMessage: Message = {
      role: 'user',
      content: userQuestion,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      // 准备对话历史
      const history: ChatMessage[] = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }))

      let fullAnswer = ''
      setStreamingMessage('')

      // 流式接收回答
      for await (const chunk of askStream(userQuestion, { history })) {
        fullAnswer += chunk
        setStreamingMessage(fullAnswer)
      }

      if (!fullAnswer.trim()) {
        const fallback = await ask(userQuestion, { history })
        fullAnswer = fallback.answer
        setStreamingMessage(fullAnswer)
      }

      // 完成后添加到消息列表
      const assistantMessage: Message = {
        role: 'assistant',
        content: fullAnswer,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
      setStreamingMessage('')
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `抱歉，出现了错误：${error.message}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setStreamingMessage('')
    } finally {
      setLoading(false)
      setIsStreaming(false)
    }
  }

  // 提交问题（普通响应）
  const handleAsk = async () => {
    if (!question.trim() || loading) return

    const userQuestion = question.trim()
    setQuestion('')
    setLoading(true)

    // 添加用户消息
    const userMessage: Message = {
      role: 'user',
      content: userQuestion,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      // 准备对话历史
      const history: ChatMessage[] = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }))

      const result = await ask(userQuestion, { history })

      const assistantMessage: Message = {
        role: 'assistant',
        content: result.answer,
        timestamp: new Date(),
        usage: result.usage
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `抱歉，出现了错误：${error.message}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  // 清除对话
  const handleClear = () => {
    if (window.confirm(lang === 'zh' ? '确定清除所有对话记录吗？' : 'Clear all conversation history?')) {
      setMessages([])
      setStreamingMessage('')
    }
  }

  // 导出 TXT
  const handleExportTxt = () => {
    if (messages.length === 0 && !streamingMessage) {
      return
    }

    const exportedAt = new Date()
    const lines: string[] = []
    const modeText = config?.mode === 'mock' ? 'mock' : 'volcengine'
    const modelText = config?.model ? String(config.model) : 'unknown'

    lines.push('Linping Rolling Lantern - AI Chat Export')
    lines.push(`Exported At: ${formatDateTime(exportedAt, lang)}`)
    lines.push(`AI Mode: ${modeText}`)
    lines.push(`AI Model: ${modelText}`)
    lines.push('')
    lines.push('========================================')
    lines.push('')

    messages.forEach((msg, index) => {
      const roleText =
        msg.role === 'user'
          ? (lang === 'zh' ? '我' : 'Me')
          : 'AI'
      lines.push(`[${index + 1}] ${roleText} | ${formatDateTime(msg.timestamp, lang)}`)
      lines.push(msg.content)
      if (msg.usage) {
        lines.push(`Tokens: ${msg.usage.totalTokens} (prompt=${msg.usage.promptTokens}, completion=${msg.usage.completionTokens})`)
      }
      lines.push('')
    })

    if (isStreaming && streamingMessage) {
      lines.push(`[${messages.length + 1}] AI | ${formatDateTime(new Date(), lang)} | streaming`)
      lines.push(streamingMessage)
      lines.push('')
    }

    const content = `${lines.join('\n')}\n`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `ai-chat-${formatFileTimestamp(exportedAt)}.txt`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  // 快捷问题
  const quickQuestions = [
    lang === 'zh' ? '临平滚灯的历史是什么？' : 'What is the history of Linping Rolling Lantern?',
    lang === 'zh' ? '滚灯是怎么制作的？' : 'How is the rolling lantern made?',
    lang === 'zh' ? '滚灯表演有哪些技巧？' : 'What are the performance techniques?',
    lang === 'zh' ? '临平滚灯有什么文化意义？' : 'What is the cultural significance?',
    lang === 'zh' ? '我可以在哪里看到滚灯表演？' : 'Where can I see the rolling lantern performance?',
    lang === 'zh' ? '滚灯适合小朋友学习吗？' : 'Is rolling lantern suitable for children to learn?',
    lang === 'zh' ? '临平滚灯和其他地区的灯笼有什么不同？' : 'How is Linping Rolling Lantern different from other lanterns?',
    lang === 'zh' ? '临平滚灯最早是谁发明的？' : 'Who invented Linping Rolling Lantern?'
  ]

  // 处理快捷问题点击（直接发送）
  const handleQuickQuestion = async (q: string) => {
    if (loading) return

    setQuestion('')
    setLoading(true)
    setIsStreaming(true)

    // 开始新问题时，启用自动滚动
    isAutoScrollEnabled.current = true

    // 添加用户消息
    const userMessage: Message = {
      role: 'user',
      content: q,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      // 准备对话历史
      const history: ChatMessage[] = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }))

      let fullAnswer = ''
      setStreamingMessage('')

      // 流式接收回答
      for await (const chunk of askStream(q, { history })) {
        fullAnswer += chunk
        setStreamingMessage(fullAnswer)
      }

      if (!fullAnswer.trim()) {
        const fallback = await ask(q, { history })
        fullAnswer = fallback.answer
        setStreamingMessage(fullAnswer)
      }

      // 完成后添加到消息列表
      const assistantMessage: Message = {
        role: 'assistant',
        content: fullAnswer,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
      setStreamingMessage('')
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `抱歉，出现了错误：${error.message}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setStreamingMessage('')
    } finally {
      setLoading(false)
      setIsStreaming(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 配置状态提示 */}
      <div className={`p-3 rounded-lg border-2 ${
        config?.mode === 'mock'
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
          : config?.enabled
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
            : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            config?.mode === 'mock'
              ? 'bg-yellow-500'
              : config?.enabled
                ? 'bg-green-500 animate-pulse'
                : 'bg-red-500'
          }`} />
          <span className="text-sm font-medium text-ink-800 dark:text-gray-200">
            {config?.mode === 'mock'
              ? lang === 'zh' ? 'Mock模式 - 演示数据' : 'Mock Mode - Demo Data'
              : config?.enabled
                ? lang === 'zh' ? `火山引擎 AI (${config.model})` : `Volcengine AI (${config.model})`
                : lang === 'zh' ? 'AI未配置' : 'AI Not Configured'}
          </span>
        </div>
        {config?.mode === 'mock' && (
          <p className="mt-1 text-xs text-ink-600 dark:text-gray-400">
            {lang === 'zh'
              ? '当前使用Mock数据。要启用真实AI，请在 .env 文件中配置火山引擎API。'
              : 'Currently using mock data. To enable real AI, configure Volcengine API in .env file.'}
          </p>
        )}
      </div>

      {/* 聊天区域 */}
      <div className="card p-4 min-h-[400px] max-h-[600px] flex flex-col">
        {/* 消息列表 */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto space-y-3 mb-4 px-2"
          aria-live="polite"
        >
          {messages.length === 0 && !isStreaming && (
            <div className="text-center py-12 text-ink-500 dark:text-gray-400">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-gold-300 dark:border-gold-700 text-sm font-semibold text-ink-700 dark:text-gray-300 mb-4">
                AI
              </div>
              <p className="text-lg font-medium mb-2">
                {lang === 'zh' ? '开始你的探索之旅' : 'Start Your Journey'}
              </p>
              <p className="text-sm">
                {lang === 'zh'
                  ? '询问关于临平滚灯的任何问题'
                  : 'Ask anything about Linping Rolling Lantern'}
              </p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white'
                    : 'bg-gold-50 dark:bg-ink-800 border-2 border-gold-200 dark:border-gold-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-white/20 text-white'
                      : 'bg-brand-500/10 text-brand-700 dark:text-brand-300'
                  }`}>
                    {msg.role === 'user' ? (lang === 'zh' ? '我' : 'Me') : 'AI'}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm whitespace-pre-wrap ${
                      msg.role === 'user' ? 'text-white' : 'text-ink-800 dark:text-gray-200'
                    }`}>
                      {msg.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                      <span>
                        {msg.timestamp.toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {msg.usage && (
                        <span>• {msg.usage.totalTokens} tokens</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* 流式消息 */}
          {isStreaming && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[80%] rounded-lg p-3 bg-gold-50 dark:bg-ink-800 border-2 border-gold-200 dark:border-gold-800">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 bg-brand-500/10 text-brand-700 dark:text-brand-300">
                    AI
                  </div>
                  <div className="flex-1">
                    {streamingMessage ? (
                      <p className="text-sm whitespace-pre-wrap text-ink-800 dark:text-gray-200">
                        {streamingMessage}
                        <span className="inline-block w-2 h-4 ml-1 bg-brand-500 animate-pulse" />
                      </p>
                    ) : (
                      <p className="text-sm text-ink-700 dark:text-gray-300 flex items-center gap-2">
                        {lang === 'zh' ? 'AI 正在思考中' : 'AI is thinking'}
                        <span className="inline-flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse [animation-delay:120ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse [animation-delay:240ms]" />
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 快捷问题 */}
        {messages.length === 0 && !isStreaming && (
          <div className="mb-4">
            <p className="text-xs font-medium text-ink-600 dark:text-gray-400 mb-2">
              {lang === 'zh' ? '快捷提问（点击直接发送）：' : 'Quick Questions (Click to send):'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickQuestion(q)}
                  disabled={loading}
                  className="text-xs px-4 py-2.5 rounded-lg border-2 border-gold-300 dark:border-gold-700 hover:bg-gold-100 dark:hover:bg-gold-900/20 hover:border-brand-400 dark:hover:border-brand-500 transition-all text-left text-ink-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <span className="group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {q}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 输入区域 */}
        <div className="border-t-2 border-gold-200 dark:border-gold-800 pt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAskStream()
                }
              }}
              placeholder={lang === 'zh' ? '输入你的问题...' : 'Type your question...'}
              className="input flex-1"
              disabled={loading}
              aria-label={lang === 'zh' ? '问题输入框' : 'Question input'}
            />
            <button
              onClick={handleAskStream}
              disabled={loading || !question.trim()}
              className="btn px-6"
              aria-label={lang === 'zh' ? '发送' : 'Send'}
            >
              {loading ? (
                <InlineLoading />
              ) : (
                <span>{lang === 'zh' ? '发送' : 'Send'}</span>
              )}
            </button>
            {messages.length > 0 && (
              <button
                onClick={handleExportTxt}
                disabled={loading}
                className="btn-outline px-4"
                aria-label={lang === 'zh' ? '导出TXT' : 'Export TXT'}
              >
                {lang === 'zh' ? '导出TXT' : 'Export TXT'}
              </button>
            )}
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                disabled={loading}
                className="btn-outline px-4"
                aria-label={lang === 'zh' ? '清除' : 'Clear'}
              >
                {lang === 'zh' ? '清空' : 'Clear'}
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-ink-500 dark:text-gray-500">
            {lang === 'zh'
              ? '提示：按 Enter 发送，Shift+Enter 换行'
              : 'Tip: Press Enter to send, Shift+Enter for new line'}
          </p>
        </div>
      </div>

      {/* 统计信息 */}
      {messages.length > 0 && (
        <div className="text-xs text-center text-ink-500 dark:text-gray-500">
          {lang === 'zh' ? '对话轮数' : 'Conversations'}: {Math.floor(messages.length / 2)}
          {' • '}
          {lang === 'zh' ? '总消息数' : 'Total messages'}: {messages.length}
        </div>
      )}
    </div>
  )
}
