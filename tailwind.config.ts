import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Traditional Chinese color palette
        brand: {
          DEFAULT: '#c8383d', // 中国红
          50: '#fef2f2',
          100: '#fee2e3',
          200: '#fecacc',
          300: '#fca5a8',
          400: '#f87479',
          500: '#c8383d',
          600: '#b02f34',
          700: '#8e262a',
          800: '#701f23',
          900: '#5a191c'
        },
        gold: {
          DEFAULT: '#d4a574', // 金色
          50: '#fdf8f3',
          100: '#faf0e4',
          200: '#f5dfc4',
          300: '#ebc79e',
          400: '#d4a574',
          500: '#c69257',
          600: '#b0794a',
          700: '#8f6139',
          800: '#6d4a2b',
          900: '#4f3520'
        },
        jade: {
          DEFAULT: '#5a9e7e', // 玉色
          50: '#f2f9f6',
          100: '#e3f3ec',
          200: '#c7e7d9',
          300: '#a1d5bf',
          400: '#5a9e7e',
          500: '#478668',
          600: '#3a6e55',
          700: '#305845',
          800: '#264637',
          900: '#1e372c'
        },
        ink: {
          DEFAULT: '#2c2416', // 墨色
          50: '#f5f4f2',
          100: '#e8e6e2',
          200: '#d1cdc5',
          300: '#aba599',
          400: '#847b6c',
          500: '#6b5d49',
          600: '#564936',
          700: '#453a2b',
          800: '#2c2416',
          900: '#1a1410'
        },
        paper: {
          DEFAULT: '#faf8f3', // 宣纸白
          dark: '#1a1410' // 深色模式背景
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Noto Sans SC"', '"Microsoft YaHei"', 'sans-serif'],
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', 'Georgia', 'serif'],
        mono: ['"SF Mono"', '"Cascadia Code"', 'Consolas', 'monospace']
      },
      boxShadow: {
        'traditional': '0 4px 8px rgba(44, 36, 22, 0.12), 0 2px 4px rgba(44, 36, 22, 0.08)',
        'traditional-lg': '0 8px 16px rgba(44, 36, 22, 0.16), 0 4px 8px rgba(44, 36, 22, 0.12)',
        'traditional-xl': '0 12px 24px rgba(44, 36, 22, 0.20), 0 8px 16px rgba(44, 36, 22, 0.16)'
      }
    }
  },
  plugins: []
} satisfies Config

