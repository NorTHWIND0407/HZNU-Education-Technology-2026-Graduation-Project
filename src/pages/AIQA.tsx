/**
 * AI问答页面
 * 基于火山引擎的智能问答系统
 */

import React from 'react'
import QAChat from '../components/QAChat'
import { useAppStore } from '../lib/store'
import { t } from '../lib/i18n'

export default function AIQA() {
  const lang = useAppStore(s => s.lang)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面标题 */}
      <header className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-gold-500 shadow-traditional-lg mb-4">
          <span className="text-3xl">🤖</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-ink-900 dark:text-gray-100 mb-2">
          {lang === 'zh' ? 'AI 智能问答' : 'AI Q&A Assistant'}
        </h1>
        <p className="text-lg text-ink-600 dark:text-gray-400 max-w-2xl mx-auto">
          {lang === 'zh'
            ? '基于火山引擎AI的智能助手，帮助你了解临平滚灯的历史、制作工艺和文化内涵'
            : 'AI-powered assistant based on Volcengine, helping you learn about Linping Rolling Lantern'}
        </p>
      </header>

      {/* AI聊天组件 */}
      <QAChat />

      {/* 使用说明 */}
      <div className="card p-6">
        <h2 className="text-lg font-serif font-bold text-ink-900 dark:text-gray-100 mb-4">
          {lang === 'zh' ? '💡 使用说明' : '💡 How to Use'}
        </h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-ink-700 dark:text-gray-300">
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span>✨</span>
              {lang === 'zh' ? '功能特点' : 'Features'}
            </h3>
            <ul className="space-y-1 text-ink-600 dark:text-gray-400">
              <li>• {lang === 'zh' ? '智能对话：支持多轮对话，理解上下文' : 'Smart conversation with context awareness'}</li>
              <li>• {lang === 'zh' ? '流式响应：打字机效果，实时显示答案' : 'Streaming response with typewriter effect'}</li>
              <li>• {lang === 'zh' ? '专业知识：专门训练的临平滚灯知识库' : 'Specialized knowledge base'}</li>
              <li>• {lang === 'zh' ? '友好交互：适合小学生的语言风格' : 'Child-friendly language'}</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span>📝</span>
              {lang === 'zh' ? '提问技巧' : 'Tips'}
            </h3>
            <ul className="space-y-1 text-ink-600 dark:text-gray-400">
              <li>• {lang === 'zh' ? '具体明确：问题越具体，答案越准确' : 'Be specific for better answers'}</li>
              <li>• {lang === 'zh' ? '善用快捷：点击快捷问题快速开始' : 'Use quick questions to start'}</li>
              <li>• {lang === 'zh' ? '多轮对话：可以基于上一个回答继续提问' : 'Follow-up questions are supported'}</li>
              <li>• {lang === 'zh' ? '耐心等待：复杂问题可能需要几秒钟' : 'Complex questions may take a few seconds'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 安全与隐私 */}
      <div className="text-xs text-center text-ink-500 dark:text-gray-500 space-y-1">
        <p>
          {lang === 'zh'
            ? '🔒 所有对话内容仅用于学习目的，不会被永久保存'
            : '🔒 All conversations are for learning purposes only and will not be permanently stored'}
        </p>
        <p>
          {lang === 'zh'
            ? '⚠️ AI回答仅供参考，如有疑问请咨询老师'
            : '⚠️ AI answers are for reference only. Please consult your teacher if you have questions'}
        </p>
      </div>
    </div>
  )
}
