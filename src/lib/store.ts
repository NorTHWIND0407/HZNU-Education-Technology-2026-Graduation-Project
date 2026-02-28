import { create } from 'zustand'

type Theme = 'light' | 'dark'
type Lang = 'zh' | 'en'

type AppState = {
  theme: Theme
  toggleTheme: () => void
  lang: Lang
  toggleLang: () => void
  recentModules: string[]
  addRecent: (m: string) => void
  lessonProgress: Record<string, boolean>
  setLessonProgress: (id: string, done: boolean) => void
}

const LS_THEME = 'lp_theme'
const LS_LANG = 'lp_lang'
const LS_PROGRESS = 'lp_progress'
const LS_RECENT = 'lp_recent'

function load<T>(k: string, fallback: T): T {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback } catch { return fallback }
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: load(LS_THEME, 'light'),
  toggleTheme: () => set(s => {
    const next = s.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(LS_THEME, JSON.stringify(next))
    return { theme: next }
  }),
  lang: load(LS_LANG, (import.meta.env.VITE_I18N_DEFAULT ?? 'zh') as Lang),
  toggleLang: () => set(s => {
    const next = s.lang === 'zh' ? 'en' : 'zh'
    localStorage.setItem(LS_LANG, JSON.stringify(next))
    return { lang: next }
  }),
  recentModules: load(LS_RECENT, [] as string[]),
  addRecent: (m) => set(s => {
    const arr = Array.from(new Set([m, ...s.recentModules])).slice(0, 10)
    localStorage.setItem(LS_RECENT, JSON.stringify(arr))
    return { recentModules: arr }
  }),
  lessonProgress: load(LS_PROGRESS, {}),
  setLessonProgress: (id, done) => set(s => {
    const next = { ...s.lessonProgress, [id]: done }
    localStorage.setItem(LS_PROGRESS, JSON.stringify(next))
    return { lessonProgress: next }
  })
}))

