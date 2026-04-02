import React from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../lib/store'

type DownloadItem = {
  id: string
  titleZh: string
  titleEn: string
  descZh: string
  descEn: string
  path: string
  kind?: 'download' | 'guide'
}

const PROGRAM_ITEMS: DownloadItem[] = [
  {
    id: 'android-guide',
    titleZh: 'Android APK 生成教程',
    titleEn: 'Android APK Export Guide',
    descZh: '不直接提供 APK 下载，改为说明如何利用现有 Unity 源工程与模块包生成 APK。',
    descEn: 'APK download is replaced by a guide that explains how to build it from the current Unity source package.',
    path: '/downloads/android-apk-guide.html',
    kind: 'guide',
  },
  {
    id: 'windows-zip',
    titleZh: 'Windows 安装包（ZIP）',
    titleEn: 'Windows Package (ZIP)',
    descZh: '用于 PC 端离线展示（含 exe 发布内容）。',
    descEn: 'Offline PC demo package (contains exe build files).',
    path: '/downloads/rolling-lantern-ar-windows.zip',
  },
]

const MODULE_ITEMS: DownloadItem[] = [
  {
    id: 'unitypackage',
    titleZh: 'Unity 模块包（.unitypackage）',
    titleEn: 'Unity Module (.unitypackage)',
    descZh: '便于在其他 Unity 项目中复用滚灯模型与交互。',
    descEn: 'Reusable module for importing into other Unity projects.',
    path: '/downloads/rolling-lantern-module.unitypackage',
  },
  {
    id: 'source-zip',
    titleZh: 'Unity 源工程（ZIP）',
    titleEn: 'Unity Source Project (ZIP)',
    descZh: '完整工程备份，适合二次开发与协作交接。',
    descEn: 'Full source project archive for secondary development.',
    path: '/downloads/rolling-lantern-source.zip',
  },
]

async function checkAsset(path: string) {
  try {
    const response = await fetch(path, { method: 'HEAD', cache: 'no-store' })
    return response.ok
  } catch {
    return false
  }
}

export default function ModuleDownload() {
  const lang = useAppStore(s => s.lang)
  const [readyMap, setReadyMap] = React.useState<Record<string, boolean>>({})
  const [checking, setChecking] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    const items = [...PROGRAM_ITEMS, ...MODULE_ITEMS]

    const run = async () => {
      const pairs = await Promise.all(
        items.map(async item => {
          const ok = await checkAsset(item.path)
          return [item.id, ok] as const
        })
      )

      if (cancelled) return

      const map: Record<string, boolean> = {}
      pairs.forEach(([id, ok]) => {
        map[id] = ok
      })
      setReadyMap(map)
      setChecking(false)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [])

  const renderCard = (item: DownloadItem) => {
    const ready = readyMap[item.id]
    const isGuide = item.kind === 'guide'

    return (
      <article key={item.id} className="card p-4 flex flex-col gap-3">
        <div>
          <h3 className="font-semibold text-base text-ink-900 dark:text-gray-100">
            {lang === 'zh' ? item.titleZh : item.titleEn}
          </h3>
          <p className="text-sm text-ink-600 dark:text-gray-400 mt-1">
            {lang === 'zh' ? item.descZh : item.descEn}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {ready ? (
            <a
              href={item.path}
              {...(isGuide ? { target: '_blank', rel: 'noreferrer' } : { download: true })}
              className="btn"
            >
              {isGuide
                ? (lang === 'zh' ? '查看教程' : 'Open Guide')
                : (lang === 'zh' ? '下载文件' : 'Download')}
            </a>
          ) : (
            <button type="button" className="btn opacity-60 cursor-not-allowed" disabled>
              {checking ? (lang === 'zh' ? '检测中...' : 'Checking...') : (lang === 'zh' ? '暂不可用' : 'Unavailable')}
            </button>
          )}

          <span
            className={`text-xs px-2 py-1 rounded-full border ${
              ready
                ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:bg-emerald-950/30'
                : 'border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:bg-amber-950/30'
            }`}
          >
            {ready
              ? (isGuide ? (lang === 'zh' ? '可查看' : 'Ready') : (lang === 'zh' ? '可下载' : 'Ready'))
              : (lang === 'zh' ? '暂不可用' : 'Unavailable')}
          </span>
        </div>
      </article>
    )
  }

  return (
    <div className="space-y-5">
      <header className="card p-5 bg-gradient-to-br from-gold-50 to-brand-50 dark:from-ink-900 dark:to-brand-900/20 border-gold-300 dark:border-gold-800">
        <h1 className="text-2xl font-serif font-bold text-ink-900 dark:text-gray-100">
          {lang === 'zh' ? '模块下载中心' : 'Module Download Center'}
        </h1>
        <p className="text-sm text-ink-600 dark:text-gray-400 mt-2">
          {lang === 'zh'
            ? '本页用于统一提供 WebAR 入口、Windows 安装包、Unity 开发复用包，以及 Android APK 导出教程。'
            : 'Access WebAR, Windows package, Unity reusable bundles, and the Android APK export guide in one place.'}
        </p>
      </header>

      <section className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-lg text-ink-900 dark:text-gray-100">
              {lang === 'zh' ? 'WebAR 在线模块' : 'WebAR Online Module'}
            </h2>
            <p className="text-sm text-ink-600 dark:text-gray-400 mt-1">
              {lang === 'zh'
                ? '无需下载，直接在浏览器运行。适配 Android Chrome（HTTPS）。'
                : 'No download needed. Run directly in browser (Android Chrome + HTTPS).'}
            </p>
          </div>
          <Link to="/webar" className="btn">
            {lang === 'zh' ? '进入 WebAR 体验' : 'Open WebAR'}
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900 dark:text-gray-100">
          {lang === 'zh' ? 'Unity 发布程序与导出指引' : 'Unity Packages & Export Guide'}
        </h2>
        <div className="grid gap-3 md:grid-cols-2">{PROGRAM_ITEMS.map(renderCard)}</div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900 dark:text-gray-100">
          {lang === 'zh' ? 'Unity 开发复用包' : 'Unity Reusable Packages'}
        </h2>
        <div className="grid gap-3 md:grid-cols-2">{MODULE_ITEMS.map(renderCard)}</div>
      </section>
    </div>
  )
}
