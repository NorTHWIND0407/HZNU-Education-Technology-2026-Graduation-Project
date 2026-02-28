/**
 * Loading组件
 * 统一的加载状态显示
 */

import React from 'react'

interface LoadingProps {
  /** 加载文本 */
  text?: string
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 是否全屏 */
  fullScreen?: boolean
  /** 自定义类名 */
  className?: string
}

/**
 * Loading组件
 *
 * @example
 * <Loading />
 * <Loading text="加载中..." size="lg" />
 * <Loading fullScreen />
 */
export default function Loading({
  text = '加载中...',
  size = 'md',
  fullScreen = false,
  className = ''
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4'
  }

  const spinner = (
    <div className={`inline-block ${sizeClasses[size]} border-brand-200 border-t-brand-600 dark:border-brand-800 dark:border-t-brand-400 rounded-full animate-spin`} />
  )

  const content = (
    <div className={`text-center ${className}`}>
      {spinner}
      {text && (
        <p className={`mt-4 text-ink-600 dark:text-gray-400 ${
          size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
        }`}>
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper dark:bg-paper-dark">
        {content}
      </div>
    )
  }

  return content
}

/**
 * 行内Loading组件（用于按钮等）
 */
export function InlineLoading({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin h-5 w-5 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
