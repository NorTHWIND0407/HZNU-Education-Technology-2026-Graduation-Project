import { describe, it, expect } from 'vitest'
import { ask } from '../src/lib/aiClient'

describe('aiClient (mock)', () => {
  it('returns mock answer', async () => {
    const res = await ask('历史')
    expect(res.answer.length).toBeGreaterThan(0)
  })
})

