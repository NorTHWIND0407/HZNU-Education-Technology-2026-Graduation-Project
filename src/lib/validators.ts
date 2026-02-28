// 简易校验器（Mock）

export type FeedbackForm = {
  classId: string
  studentId: string
  grade: string // 小学{1-6}年级
  modulesUsed: string[]
  selfEvaluation: {
    understanding: number
    interest: number
    difficulty: string[]
  }
  openComment: string
  ts: string
}

export function validateFeedback(data: FeedbackForm) {
  const errors: string[] = []
  if (!/^\w[\w-]{1,31}$/.test(data.classId)) errors.push('classId 格式不正确 // TODO: 允许的命名规范')
  if (!data.grade.includes('小学')) errors.push('grade 必须包含 小学{1-6}年级')
  if (!Array.isArray(data.modulesUsed) || data.modulesUsed.length === 0) errors.push('modulesUsed 至少选择 1 项')
  const u = data.selfEvaluation.understanding
  const i = data.selfEvaluation.interest
  if (u < 1 || u > 5) errors.push('understanding 范围 1-5')
  if (i < 1 || i > 5) errors.push('interest 范围 1-5')
  return { valid: errors.length === 0, errors }
}

