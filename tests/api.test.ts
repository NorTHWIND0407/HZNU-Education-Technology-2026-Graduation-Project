import { describe, expect, it } from 'vitest'
import { stripJSONComments } from '../src/lib/api'

describe('stripJSONComments', () => {
  it('removes line and block comments', () => {
    const raw = '{\n  // line\n  "a": 1,\n  /* block */\n  "b": 2\n}'
    const cleaned = stripJSONComments(raw)
    const parsed = JSON.parse(cleaned)
    expect(parsed).toEqual({ a: 1, b: 2 })
  })

  it('keeps urls and slashes inside strings', () => {
    const raw = '{"url":"https://example.com/a//b","note":"/*keep*/"}'
    const cleaned = stripJSONComments(raw)
    const parsed = JSON.parse(cleaned)
    expect(parsed.url).toBe('https://example.com/a//b')
    expect(parsed.note).toBe('/*keep*/')
  })
})
