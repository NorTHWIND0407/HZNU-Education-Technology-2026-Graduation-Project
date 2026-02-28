// Mock 数据构造与字段映射示例

export function mockUsageByModule() {
  return [
    { module: 'microdoc', usage: 12 },
    { module: 'lessons', usage: 20 },
    { module: 'h5', usage: 15 },
    { module: 'webar', usage: 8 },
    { module: 'aiqa', usage: 18 },
  ]
}

export function mockProgressOverTime() {
  return [
    { time: 'Week1', score: 2 },
    { time: 'Week2', score: 3 },
    { time: 'Week3', score: 3.5 },
    { time: 'Week4', score: 4 },
  ]
}

export function mockInterestDistribution() {
  return [
    { label: '历史', value: 25 },
    { label: '动作', value: 35 },
    { label: '音乐', value: 15 },
    { label: '造型', value: 25 },
  ]
}

export function mockSelfEvalRadar() {
  return [
    { aspect: '理解度', score: 3 },
    { aspect: '兴趣度', score: 4 },
    { aspect: '节拍感', score: 2 },
    { aspect: '合作', score: 3 },
    { aspect: '创作', score: 3 },
  ]
}

