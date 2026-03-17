import express from 'express'

const router = express.Router()

const VOLC_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const REQUEST_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS || 45000)
const MAX_TOKENS = Number(process.env.AI_MAX_TOKENS || 1800)
const TEMPERATURE = Number(process.env.AI_TEMPERATURE || 0.6)
const SYSTEM_PROMPT = process.env.AI_SYSTEM_PROMPT ||
  '你是一个专门介绍临平滚灯文化的AI助手。请用简洁、生动的语言回答问题，适合小学生理解。'

function getVolcengineConfig() {
  const apiKey = String(process.env.VOLCENGINE_API_KEY || '').trim()
  const endpointId = String(process.env.VOLCENGINE_ENDPOINT_ID || '').trim()
  const model = String(process.env.VOLCENGINE_MODEL || endpointId || 'Doubao-1.5-pro-256k').trim()
  return { apiKey, endpointId, model }
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return []
  return history
    .slice(-20)
    .map(item => ({
      role: item?.role,
      content: String(item?.content || '').trim()
    }))
    .filter(item =>
      ['system', 'user', 'assistant'].includes(item.role) &&
      item.content.length > 0
    )
}

function buildMessages({ question, history, contextDocs }) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT }
  ]

  if (Array.isArray(contextDocs) && contextDocs.length > 0) {
    const refs = contextDocs
      .map(item => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 20)
    if (refs.length > 0) {
      messages.push({
        role: 'system',
        content: `参考资料：\n${refs.join('\n\n')}`
      })
    }
  }

  messages.push(...normalizeHistory(history))
  messages.push({ role: 'user', content: question })
  return messages
}

function createUpstreamPayload({ question, history, contextDocs, stream = false }) {
  const { endpointId } = getVolcengineConfig()
  return {
    model: endpointId,
    messages: buildMessages({ question, history, contextDocs }),
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    stream
  }
}

router.post('/chat', async (req, res) => {
  const { apiKey, endpointId, model } = getVolcengineConfig()
  if (!apiKey || !endpointId) {
    return res.status(500).json({
      error: 'AI not configured',
      message: 'AI 服务未配置，请在 server/.env 中设置 VOLCENGINE_API_KEY 和 VOLCENGINE_ENDPOINT_ID'
    })
  }

  const question = String(req.body?.question || '').trim()
  if (!question) {
    return res.status(400).json({ error: 'Invalid question', message: '问题不能为空' })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const upstream = await fetch(VOLC_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify(
        createUpstreamPayload({
          question,
          history: req.body?.history,
          contextDocs: req.body?.contextDocs,
          stream: false
        })
      )
    })

    if (!upstream.ok) {
      const errorText = await upstream.text()
      return res.status(upstream.status).json({
        error: 'AI upstream error',
        message: errorText || '模型服务调用失败'
      })
    }

    const data = await upstream.json()
    const answer = data?.choices?.[0]?.message?.content || ''
    const usage = data?.usage

    res.json({
      success: true,
      data: {
        answer,
        usage: usage ? {
          promptTokens: Number(usage.prompt_tokens || 0),
          completionTokens: Number(usage.completion_tokens || 0),
          totalTokens: Number(usage.total_tokens || 0)
        } : undefined,
        meta: {
          mode: 'volcengine-proxy',
          model,
          finishReason: data?.choices?.[0]?.finish_reason || null
        }
      }
    })
  } catch (err) {
    console.error('[AI] chat error:', err)
    res.status(500).json({
      error: 'AI request failed',
      message: 'AI 请求失败，请稍后重试'
    })
  } finally {
    clearTimeout(timeoutId)
  }
})

router.post('/chat/stream', async (req, res) => {
  const { apiKey, endpointId } = getVolcengineConfig()
  if (!apiKey || !endpointId) {
    return res.status(500).json({
      error: 'AI not configured',
      message: 'AI 服务未配置，请在 server/.env 中设置 VOLCENGINE_API_KEY 和 VOLCENGINE_ENDPOINT_ID'
    })
  }

  const question = String(req.body?.question || '').trim()
  if (!question) {
    return res.status(400).json({ error: 'Invalid question', message: '问题不能为空' })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  req.on('close', () => controller.abort())

  try {
    const upstream = await fetch(VOLC_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify(
        createUpstreamPayload({
          question,
          history: req.body?.history,
          contextDocs: req.body?.contextDocs,
          stream: true
        })
      )
    })

    if (!upstream.ok || !upstream.body) {
      const errorText = await upstream.text()
      return res.status(upstream.status || 500).json({
        error: 'AI upstream error',
        message: errorText || '模型流式调用失败'
      })
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders?.()

    for await (const chunk of upstream.body) {
      res.write(Buffer.from(chunk))
    }
    res.end()
  } catch (err) {
    console.error('[AI] stream error:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: 'AI stream failed', message: 'AI 流式请求失败' })
    } else {
      res.write('data: [DONE]\n\n')
      res.end()
    }
  } finally {
    clearTimeout(timeoutId)
  }
})

export default router
