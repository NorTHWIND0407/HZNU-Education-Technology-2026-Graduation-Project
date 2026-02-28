import { describe, it, expect } from 'vitest'
import { validateFeedback, type FeedbackForm } from '../src/lib/validators'

describe('validators', () => {
  it('validates feedback form', () => {
    const form: FeedbackForm = {
      classId: 'Class-1',
      studentId: 'S1',
      grade: '小学3年级',
      modulesUsed: ['lessons'],
      selfEvaluation: { understanding: 3, interest: 4, difficulty: [] },
      openComment: '',
      ts: new Date().toISOString()
    }
    const r = validateFeedback(form)
    expect(r.valid).toBe(true)
  })
})

