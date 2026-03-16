import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ask } from '../src/lib/aiClient'

describe('aiClient (mock)', () => {
  beforeEach(() => {
    ;(globalThis as any).__FORCE_MOCK_AI__ = true
  })

  afterEach(() => {
    delete (globalThis as any).__FORCE_MOCK_AI__
  })

  it('returns mock answer', async () => {
    const res = await ask('历史')
    expect(res.answer.length).toBeGreaterThan(0)
    expect(res.meta?.mode).toBe('mock')
  })
})
