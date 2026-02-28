/**
 * 环境变量验证
 * Environment Variable Validation
 */

interface EnvVars {
  VITE_API_URL?: string
  VITE_WS_URL?: string
  VITE_I18N_DEFAULT?: string
  VITE_ENABLE_MOCK?: string
  VITE_USE_AR?: string
}

/**
 * 必需的环境变量
 */
const REQUIRED_ENV_VARS: (keyof EnvVars)[] = [
  'VITE_API_URL',
  'VITE_I18N_DEFAULT'
]

/**
 * 可选的环境变量及其默认值
 */
const OPTIONAL_ENV_VARS: Partial<EnvVars> = {
  VITE_WS_URL: 'ws://localhost:3001/ws',
  VITE_ENABLE_MOCK: 'true',
  VITE_USE_AR: 'true'
}

/**
 * 验证环境变量
 * 检查所有必需的环境变量是否已配置
 */
export function validateEnv(): void {
  const missingVars: string[] = []

  // 检查必需的环境变量
  REQUIRED_ENV_VARS.forEach(key => {
    const value = import.meta.env[key]
    if (!value || value.trim() === '') {
      missingVars.push(key)
    }
  })

  if (missingVars.length > 0) {
    const errorMsg = `
❌ 缺少必需的环境变量 / Missing required environment variables:

${missingVars.map(v => `  - ${v}`).join('\n')}

请检查 .env 文件，确保所有必需的环境变量都已配置。
Please check your .env file and ensure all required variables are set.

参考 .env.example 文件获取配置示例。
Refer to .env.example for configuration examples.
    `.trim()

    console.error(errorMsg)
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }

  // 设置可选环境变量的默认值
  Object.entries(OPTIONAL_ENV_VARS).forEach(([key, defaultValue]) => {
    const currentValue = import.meta.env[key as keyof ImportMetaEnv]
    if (!currentValue || currentValue.trim() === '') {
      console.warn(`⚠️ 环境变量 ${key} 未配置，使用默认值: ${defaultValue}`)
    }
  })

  // 验证URL格式
  validateURL('VITE_API_URL')
  validateURL('VITE_WS_URL', false) // WebSocket URL可选

  console.log('✅ 环境变量验证通过 / Environment variables validated')
}

/**
 * 验证URL格式
 */
function validateURL(key: keyof EnvVars, required: boolean = true): void {
  const url = import.meta.env[key]

  if (!url) {
    if (required) {
      throw new Error(`${key} is required but not set`)
    }
    return
  }

  try {
    new URL(url)
  } catch {
    console.error(`❌ 无效的URL格式 / Invalid URL format: ${key} = ${url}`)
    throw new Error(`Invalid URL format for ${key}: ${url}`)
  }
}

/**
 * 获取环境变量值
 */
export function getEnv(key: keyof EnvVars, fallback: string = ''): string {
  const value = import.meta.env[key]
  if (!value || value.trim() === '') {
    const defaultValue = OPTIONAL_ENV_VARS[key] || fallback
    return defaultValue as string
  }
  return value
}

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
  return import.meta.env.PROD
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV
}

/**
 * 打印环境信息（仅开发环境）
 */
export function printEnvInfo(): void {
  if (isDevelopment()) {
    console.log('🔧 环境配置 / Environment Configuration:')
    console.log(`  - Mode: ${import.meta.env.MODE}`)
    console.log(`  - API URL: ${getEnv('VITE_API_URL')}`)
    console.log(`  - WebSocket URL: ${getEnv('VITE_WS_URL')}`)
    console.log(`  - Default Language: ${getEnv('VITE_I18N_DEFAULT')}`)
    console.log(`  - Enable Mock: ${getEnv('VITE_ENABLE_MOCK')}`)
    console.log(`  - Use AR: ${getEnv('VITE_USE_AR')}`)
  }
}

export default {
  validateEnv,
  getEnv,
  isProduction,
  isDevelopment,
  printEnvInfo
}
