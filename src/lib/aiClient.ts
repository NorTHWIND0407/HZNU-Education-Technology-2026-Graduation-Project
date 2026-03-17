/**
 * AI客户端 - 统一接口
 * 支持后端代理与 Mock 模式
 *
 * 前端环境变量配置:
 * - VITE_ENABLE_MOCK: 是否启用Mock模式 (true/false)
 * - VITE_API_URL: 后端API地址（默认 http://localhost:3001/api）
 */

import { sleep } from './api'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type AskResult = {
  answer: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  meta?: Record<string, any>
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '')
const AI_API_BASE_URL = `${API_BASE_URL}/ai`

function isMockEnabled(): boolean {
  const forcedMock = (globalThis as any).__FORCE_MOCK_AI__
  if (typeof forcedMock === 'boolean') {
    return forcedMock
  }
  return (import.meta.env.VITE_ENABLE_MOCK ?? 'true') !== 'false'
}

function normalizeHistory(history?: ChatMessage[]): ChatMessage[] {
  if (!Array.isArray(history)) return []
  return history
    .slice(-20)
    .filter(item => ['system', 'user', 'assistant'].includes(item.role) && String(item.content || '').trim())
    .map(item => ({
      role: item.role,
      content: String(item.content || '').trim()
    }))
}

async function parseErrorMessage(response: Response): Promise<string> {
  const raw = await response.text().catch(() => '')
  if (!raw) {
    return `AI 请求失败 (${response.status})`
  }

  try {
    const json = JSON.parse(raw)
    const message = json?.message || json?.error || json?.error?.message
    if (typeof message === 'string' && message.trim()) {
      return message.trim()
    }
  } catch {
    // 非 JSON 响应，继续使用原始文本
  }

  return raw.slice(0, 240)
}

/**
 * Mock 模式回答
 */
async function askMock(question: string, contextDocs?: string[]): Promise<AskResult> {
  try {
    const { default: data } = await import('../../content/faq.json?raw')
    const text = typeof data === 'string' ? data : ''
    const cleaned = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

    let answer = '这是Mock模式的回答。临平滚灯是一项传统的民间艺术，有着悠久的历史...'

    try {
      const arr = JSON.parse(cleaned) as { q: string; a: string }[]
      const hit = arr.find(x => question.includes(x.q) || x.q.includes(question))
      if (hit) {
        answer = hit.a
      }
    } catch {
      // 解析失败，使用默认答案
    }

    await sleep(800)

    return {
      answer,
      meta: {
        mode: 'mock',
        question,
        contextDocs: contextDocs?.length || 0
      }
    }
  } catch (error) {
    return {
      answer: '抱歉，我暂时无法回答这个问题。请尝试换个方式提问。',
      meta: { mode: 'mock', error: String(error) }
    }
  }
}

/**
 * 主要的AI问答接口
 */
export async function ask(
  question: string,
  options?: {
    contextDocs?: string[]
    history?: ChatMessage[]
  }
): Promise<AskResult> {
  const useMock = isMockEnabled()

  if (useMock) {
    return askMock(question, options?.contextDocs)
  }

  try {
    const response = await fetch(`${AI_API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question,
        contextDocs: options?.contextDocs || [],
        history: normalizeHistory(options?.history)
      })
    })

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const payload = await response.json().catch(() => null)
    const data = payload?.data
    const answer = String(data?.answer || '').trim()

    if (!answer) {
      throw new Error('AI 返回内容为空')
    }

    return {
      answer,
      usage: data?.usage,
      meta: {
        mode: 'backend-proxy',
        ...data?.meta
      }
    }
  } catch (error: any) {
    console.error('AI请求失败:', error)

    return {
      answer: '抱歉，AI助手暂时无法回答。请检查后端 AI 配置或稍后重试。',
      meta: {
        mode: 'backend-proxy',
        error: error?.message || String(error)
      }
    }
  }
}

/**
 * 流式问答接口 (支持打字机效果)
 */
export async function* askStream(
  question: string,
  options?: {
    contextDocs?: string[]
    history?: ChatMessage[]
  }
): AsyncGenerator<string, void, unknown> {
  const useMock = isMockEnabled()

  if (useMock) {
    const result = await askMock(question, options?.contextDocs)
    const words = result.answer.split('')

    for (const word of words) {
      yield word
      await sleep(30)
    }
    return
  }

  try {
    const response = await fetch(`${AI_API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question,
        contextDocs: options?.contextDocs || [],
        history: normalizeHistory(options?.history)
      })
    })

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取AI流式响应')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      buffer = buffer.replace(/\r\n/g, '\n')

      let boundaryIndex = buffer.indexOf('\n\n')
      while (boundaryIndex !== -1) {
        const eventBlock = buffer.slice(0, boundaryIndex)
        buffer = buffer.slice(boundaryIndex + 2)
        boundaryIndex = buffer.indexOf('\n\n')

        const lines = eventBlock.split('\n').filter(line => line.trim() !== '')
        for (const line of lines) {
          if (!line.startsWith('data:')) continue

          const data = line.slice(5).trimStart()
          if (data === '[DONE]') continue

          try {
            const json = JSON.parse(data)
            const delta = json?.choices?.[0]?.delta?.content
            if (delta) {
              yield delta
            }
          } catch {
            // 忽略非JSON片段
          }
        }
      }
    }

    const tail = buffer.trim()
    if (tail.startsWith('data:')) {
      const data = tail.slice(5).trimStart()
      if (data !== '[DONE]') {
        try {
          const json = JSON.parse(data)
          const delta = json?.choices?.[0]?.delta?.content
          if (delta) {
            yield delta
          }
        } catch {
          // 忽略尾部解析错误
        }
      }
    }
  } catch (error: any) {
    yield `抱歉，AI助手暂时无法回答: ${error?.message || String(error)}`
  }
}

/**
 * 获取当前AI配置信息
 */
export function getAIConfig() {
  const useMock = isMockEnabled()

  if (useMock) {
    return {
      mode: 'mock',
      enabled: true
    }
  }

  return {
    mode: 'backend-proxy',
    enabled: true,
    provider: 'volcengine',
    apiBase: AI_API_BASE_URL
  }
}

export default { ask, askStream, getAIConfig }
