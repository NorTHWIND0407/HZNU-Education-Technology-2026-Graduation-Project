import React from 'react'
import { fetchJSONC } from '../lib/api'
import { useAppStore } from '../lib/store'

type ResourceFile = {
  id: string
  label: string
  type: string
  format?: string
  previewUrl?: string
  downloadUrl: string
}

type CourseResource = {
  id: string
  subject: string
  subjectEn?: string
  title: string
  grade?: string
  summary?: string
  keywords?: string[]
  files: ResourceFile[]
}

export default function Resources() {
  const lang = useAppStore(s => s.lang)
  const [items, setItems] = React.useState<CourseResource[]>([])
  const [activeSubject, setActiveSubject] = React.useState<string>('ALL')
  const [selectedFile, setSelectedFile] = React.useState<(ResourceFile & { projectTitle: string; subject: string }) | null>(null)

  React.useEffect(() => {
    fetchJSONC<CourseResource[]>('/content/resources.json')
      .then(setItems)
      .catch(() => {
        setItems([])
      })
  }, [])

  const subjects = React.useMemo(() => {
    const set = new Set<string>()
    items.forEach(it => set.add(it.subject))
    return Array.from(set)
  }, [items])

  const filtered = React.useMemo(
    () =>
      activeSubject === 'ALL'
        ? items
        : items.filter(it => it.subject === activeSubject),
    [items, activeSubject]
  )

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold">
          {lang === 'zh' ? '滚灯课程资源中心（占位）' : 'Rolling Lantern Course Resources (Mock)'}
        </h1>
        <p className="text-sm text-gray-500">
          {lang === 'zh'
            ? '按学科集中存放与临平滚灯相关的课件、教案和课堂小软件资源。可根据 JSON 配置扩展不同年级与跨学科项目，并支持部分资源在线预览。'
            : 'Central place for subject-based teaching materials, lesson plans and small tools related to the Rolling Lantern. Backed by JSON configuration and supports online preview for selected files.'}
        </p>
        <p className="text-xs text-gray-400">
          {lang === 'zh'
            ? '提示：建议将 PPT/Word 另存为 PDF 放入 /public/resources 下，并在 content/resources.json 中填写 previewUrl 字段，浏览器即可通过内置 PDF 插件在线预览。'
            : 'Tip: export PPT/Word as PDF into /public/resources and fill the previewUrl field in content/resources.json so the browser can preview via its built-in PDF viewer.'}
        </p>
      </header>

      {/* 学科筛选 */}
      <section className="card p-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">
          {lang === 'zh' ? '按学科筛选：' : 'Filter by subject:'}
        </span>
        <button
          type="button"
          onClick={() => setActiveSubject('ALL')}
          className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
            activeSubject === 'ALL'
              ? 'border-brand bg-brand-50 text-brand-900'
              : 'border-gold-200 dark:border-gold-800 text-gray-700 dark:text-gray-200 hover:bg-gold-50 dark:hover:bg-gold-900/30'
          }`}
        >
          {lang === 'zh' ? '全部学科' : 'All'}
        </button>
        {subjects.map(sub => (
          <button
            key={sub}
            type="button"
            onClick={() => setActiveSubject(sub)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
              activeSubject === sub
                ? 'border-brand bg-brand-50 text-brand-900'
                : 'border-gold-200 dark:border-gold-800 text-gray-700 dark:text-gray-200 hover:bg-gold-50 dark:hover:bg-gold-900/30'
            }`}
          >
            {sub}
          </button>
        ))}
      </section>

      {/* 资源卡片列表 */}
      <section className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500">
            {lang === 'zh'
              ? '当前暂无配置的课程资源。请编辑 content/resources.json 添加占位项目。'
              : 'No course resources configured yet. Edit content/resources.json to add placeholder items.'}
          </p>
        ) : (
          <ul className="space-y-3">
            {filtered.map(project => (
              <li key={project.id} className="card p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="px-2 py-0.5 rounded-full bg-gold-50 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300 border border-gold-200 dark:border-gold-800">
                        {project.subject}
                        {project.subjectEn && ` / ${project.subjectEn}`}
                      </span>
                      {project.grade && (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-ink-800 text-gray-600 dark:text-gray-200">
                          {project.grade}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-1 text-base font-semibold">
                      {project.title}
                    </h2>
                  </div>
                  {project.files.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {lang === 'zh'
                        ? `资源文件：${project.files.length} 个`
                        : `Files: ${project.files.length}`}
                    </div>
                  )}
                </div>

                {project.summary && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {project.summary}
                  </p>
                )}

                {project.keywords && project.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    {project.keywords.map(k => (
                      <span
                        key={k}
                        className="px-2 py-0.5 rounded-full border border-gold-200 dark:border-gold-800"
                      >
                        #{k}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {project.files.map(file => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-gold-200 dark:border-gold-800 bg-gold-50/40 dark:bg-gold-900/20"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                          {file.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {file.type}
                          {file.format && ` · ${file.format.toUpperCase()}`}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        {file.previewUrl && (
                          <button
                            type="button"
                            className="btn-ghost !px-2 !py-1 text-xs"
                            onClick={() =>
                              setSelectedFile({
                                ...file,
                                projectTitle: project.title,
                                subject: project.subject,
                              })
                            }
                          >
                            {lang === 'zh' ? '在线预览' : 'Preview'}
                          </button>
                        )}
                        <a
                          href={file.downloadUrl}
                          className="btn !px-3 !py-1 text-xs"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {lang === 'zh' ? '下载' : 'Download'}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 在线预览模态框 */}
      {selectedFile && selectedFile.previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelectedFile(null)}
          />
          <div className="relative z-10 w-full max-w-5xl h-[80vh] mx-4 card p-3 flex flex-col bg-paper dark:bg-paper-dark">
            <header className="flex items-center justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="text-xs text-gray-400">
                  {selectedFile.subject}
                </div>
                <div className="text-sm font-semibold truncate">
                  {selectedFile.projectTitle} · {selectedFile.label}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedFile.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost !px-3 !py-1 text-xs"
                >
                  {lang === 'zh' ? '在新标签打开' : 'Open in new tab'}
                </a>
                <button
                  type="button"
                  className="btn-ghost !px-3 !py-1 text-xs"
                  onClick={() => setSelectedFile(null)}
                >
                  {lang === 'zh' ? '关闭' : 'Close'}
                </button>
              </div>
            </header>
            <div className="flex-1 border border-gold-200 dark:border-gold-800 rounded-md overflow-hidden bg-white dark:bg-ink-900">
              <iframe
                src={selectedFile.previewUrl}
                title={selectedFile.label}
                className="w-full h-full"
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              {lang === 'zh'
                ? '说明：此处使用浏览器内置 PDF/图片/HTML 渲染能力，无需额外插件。若文件无法预览，请检查格式或尝试在新标签中打开。'
                : 'Note: This viewer relies on the browser’s built-in PDF / image / HTML rendering. If the file cannot be displayed, please check its format or open it in a new tab.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

