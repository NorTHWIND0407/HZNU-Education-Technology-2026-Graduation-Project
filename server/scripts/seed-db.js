/**
 * 示例数据填充脚本
 * Seed Script (minimal)
 */

import { initDB, FeedbackDB, UserDB } from '../db/index.js'

async function main() {
  try {
    await initDB()
    const feedbackCount = FeedbackDB.list({ limit: 1_000_000 }).length

    if (feedbackCount > 0) {
      console.log(`[Seed] 已存在 ${feedbackCount} 条反馈数据，跳过填充`)
      process.exit(0)
    }

    const student1 = UserDB.findByUsername('student001')
    let student2 = UserDB.findByUsername('student002')

    if (!student2) {
      const created = UserDB.create({
        username: 'student002',
        display_name: '小红',
        role: 'student',
        grade: '三年级',
        class_id: 'class_3a',
        school_id: 'linping_primary',
        metadata: '{}'
      })
      student2 = UserDB.findById(created.lastInsertRowid)
    }

    if (!student1 || !student2) {
      throw new Error('缺少示例学生账号，无法填充示例反馈')
    }

    FeedbackDB.create({
      user_id: student1.id,
      role: 'student',
      feedback_type: 'lesson',
      class_id: 'class_3a',
      grade: '三年级',
      modules_used: '["lessons", "microdoc"]',
      lesson_id: null,
      understanding_score: 4,
      interest_score: 5,
      difficulty_score: 3,
      difficulty_aspects: null,
      teaching_effectiveness: null,
      student_engagement: null,
      technical_issues: null,
      open_comment: '滚灯课程很有趣',
      suggestions: '希望增加慢动作分解',
      rating: 4,
      tags: '[]',
      status: 'pending'
    })

    FeedbackDB.create({
      user_id: student2.id,
      role: 'student',
      feedback_type: 'lesson',
      class_id: 'class_3a',
      grade: '三年级',
      modules_used: '["lessons", "webar"]',
      lesson_id: null,
      understanding_score: 3,
      interest_score: 4,
      difficulty_score: 4,
      difficulty_aspects: null,
      teaching_effectiveness: null,
      student_engagement: null,
      technical_issues: null,
      open_comment: '动作有点难',
      suggestions: '希望增加练习提示',
      rating: 4,
      tags: '[]',
      status: 'pending'
    })

    console.log('[Seed] 示例反馈数据填充完成')
    process.exit(0)
  } catch (err) {
    console.error('[Seed] 失败:', err)
    process.exit(1)
  }
}

main()
