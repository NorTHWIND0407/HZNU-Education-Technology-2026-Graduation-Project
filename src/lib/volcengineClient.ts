/**
 * 火山引擎 AI 客户端
 * Volcengine (ByteDance) AI Client
 *
 * 支持的模型：
 * - doubao-pro-32k (豆包专业版 32K)
 * - doubao-lite-32k (豆包轻量版 32K)
 * - doubao-pro-4k (豆包专业版 4K)
 */

export interface VolcengineConfig {
  /** API密钥 (从火山引擎控制台获取) */
  apiKey: string
  /** 端点ID (Endpoint ID) */
  endpointId: string
  /** 模型名称 */
  model?: string
  /** 最大tokens */
  maxTokens?: number
  /** 温度 (0-1) */
  temperature?: number
  /** 请求超时（毫秒） */
  timeoutMs?: number
  /** 系统提示词 */
  systemPrompt?: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  answer: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  meta?: Record<string, any>
}

/**
 * 火山引擎 AI 客户端类
 */
export class VolcengineAIClient {
  private config: Required<VolcengineConfig>
  private baseURL: string

  constructor(config: VolcengineConfig) {
    this.config = {
      apiKey: config.apiKey,
      endpointId: config.endpointId,
      model: config.model || 'doubao-lite-32k',
      maxTokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.7,
      timeoutMs: config.timeoutMs || 45000,
      systemPrompt: config.systemPrompt || '你是一个专门介绍临平滚灯文化的AI助手。请用简洁、生动的语言回答问题，适合小学生理解。'
    }

    // 火山引擎 API 端点
    this.baseURL = `https://ark.cn-beijing.volces.com/api/v3`
  }

  /**
   * 发送聊天请求
   */
  async chat(
    message: string,
    options?: {
      history?: ChatMessage[]
      context?: string[]
      stream?: boolean
    }
  ): Promise<ChatResponse> {
    const messages: ChatMessage[] = []

    // 添加系统提示词
    messages.push({
      role: 'system',
      content: this.config.systemPrompt
    })

    // 添加上下文信息
    if (options?.context && options.context.length > 0) {
      messages.push({
        role: 'system',
        content: `参考资料：\n${options.context.join('\n\n')}`
      })
    }

    // 添加历史对话
    if (options?.history && options.history.length > 0) {
      messages.push(...options.history)
    }

    // 添加当前消息
    messages.push({
      role: 'user',
      content: message
    })

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs)
      let response: Response
      try {
        response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: this.config.endpointId,
            messages: messages,
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            stream: options?.stream || false
          })
        })
      } finally {
        clearTimeout(timeoutId)
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          `火山引擎 API 错误 (${response.status}): ${errorData.error?.message || response.statusText}`
        )
      }

      const data = await response.json()

      // 解析响应
      const answer = data.choices?.[0]?.message?.content || '未获取到回答'
      const usage = data.usage

      return {
        answer,
        usage: usage ? {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens
        } : undefined,
        meta: {
          model: data.model,
          finishReason: data.choices?.[0]?.finish_reason
        }
      }
    } catch (error: any) {
      console.error('火山引擎 API 调用失败:', error)
      throw new Error(`AI 请求失败: ${error.message}`)
    }
  }

  /**
   * 流式聊天 (SSE)
   */
  async *chatStream(
    message: string,
    options?: {
      history?: ChatMessage[]
      context?: string[]
    }
  ): AsyncGenerator<string, void, unknown> {
    const messages: ChatMessage[] = []

    messages.push({
      role: 'system',
      content: this.config.systemPrompt
    })

    if (options?.context && options.context.length > 0) {
      messages.push({
        role: 'system',
        content: `参考资料：\n${options.context.join('\n\n')}`
      })
    }

    if (options?.history && options.history.length > 0) {
      messages.push(...options.history)
    }

    messages.push({
      role: 'user',
      content: message
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs)
    let response: Response
    try {
      response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.config.endpointId,
          messages: messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: true
        })
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      throw new Error(`火山引擎 API 错误 (${response.status})`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('无法读取响应流')
    }

    try {
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
              const delta = json.choices?.[0]?.delta?.content
              if (delta) {
                yield delta
              }
            } catch (e) {
              console.warn('解析流数据失败:', e)
            }
          }
        }
      }

      // 处理可能残留的最后一个事件块
      const tail = buffer.trim()
      if (tail.startsWith('data:')) {
        const data = tail.slice(5).trimStart()
        if (data !== '[DONE]') {
          try {
            const json = JSON.parse(data)
            const delta = json.choices?.[0]?.delta?.content
            if (delta) {
              yield delta
            }
          } catch (e) {
            console.warn('解析流尾数据失败:', e)
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * 获取配置信息（用于调试）
   */
  getConfig() {
    return {
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      timeoutMs: this.config.timeoutMs,
      hasApiKey: !!this.config.apiKey,
      hasEndpointId: !!this.config.endpointId
    }
  }
}

/**
 * 创建火山引擎客户端实例
 */
export function createVolcengineClient(config: VolcengineConfig): VolcengineAIClient {
  return new VolcengineAIClient(config)
}

export default VolcengineAIClient
