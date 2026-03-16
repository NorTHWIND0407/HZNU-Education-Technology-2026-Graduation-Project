/**
 * 数据库初始化脚本
 * Database Initialization Script
 */

import { initDB } from '../db/index.js'

async function main() {
  try {
    console.log('='.repeat(50))
    console.log('初始化SQLite数据库...')
    console.log('='.repeat(50))

    // 初始化数据库
    await initDB()
    console.log('✓ SQLite数据库初始化完成')

    console.log('\n预设账号:')
    console.log('  - s30101 (学生)')
    console.log('  - t301 (教师)')
    console.log('  - admin (管理员)')

    console.log('\n' + '='.repeat(50))
    console.log('✓ 数据库初始化成功！')
    console.log('='.repeat(50))

    process.exit(0)
  } catch (err) {
    console.error('✗ 数据库初始化失败:', err)
    process.exit(1)
  }
}

main()
