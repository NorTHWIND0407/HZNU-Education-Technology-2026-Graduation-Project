import { describe, it, expect } from 'vitest'

// Simple similarity function example (front-end coarse ranking demo)
function keywordHit(q: string, text: string) {
  q = q.toLowerCase(); text = text.toLowerCase()
  return q.split(/\s+/).filter(t => t && text.includes(t)).length
}

describe('keywordHit', () => {
  it('counts overlapping terms', () => {
    expect(keywordHit('linping lantern', 'linping rolling lantern heritage')).toBe(2)
  })
})

