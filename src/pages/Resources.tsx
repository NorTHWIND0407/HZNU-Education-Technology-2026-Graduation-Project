import React from 'react'
import { fetchJSONC } from '../lib/api'
import { useAppStore } from '../lib/store'
import { resourcesAPI, type CourseResourceItem, type ResourceFileItem } from '../lib/apiClient'
import { useAuthStore } from '../lib/authStore'
import type { CourseResource } from '../types/content'

const SUBJECTS = ['语文', '数学', '英语', '科学', '信息科技', '美术', '音乐']
const INFO_TECH_SUBJECT = '信息科技'
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '')

function resolveResourceUrl(url?: string) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/api/')) return `${API_BASE}${url}`
  return url
}

function mapStaticResources(items: CourseResource[]): CourseResourceItem[] {
  return items.map(item => ({
    ...item,
    files: item.files.map(file => ({
      ...file,
      downloadUrl: file.downloadUrl
    }))
  }))
}

export default function Resources() {
  const lang = useAppStore(s => s.lang)
  const user = useAuthStore(s => s.user)
  const canUpload = Boolean(user && ['teacher', 'admin'].includes(user.role))

  const [items, setItems] = React.useState<CourseResourceItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [activeSubject, setActiveSubject] = React.useState<string>('ALL')
  const [selectedFile, setSelectedFile] = React.useState<(ResourceFileItem & { projectTitle: string; subject: string }) | null>(null)
  const [uploadSubject, setUploadSubject] = React.useState('语文')
  const [uploadTitle, setUploadTitle] = React.useState('')
  const [uploadGrade, setUploadGrade] = React.useState('')
  const [uploadSummary, setUploadSummary] = React.useState('')
  const [uploadKeywords, setUploadKeywords] = React.useState('')
  const [uploadType, setUploadType] = React.useState('教案')
  const [uploadFile, setUploadFile] = React.useState<File | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [uploadMessage, setUploadMessage] = React.useState<string | null>(null)

  const visibleItems = React.useMemo(
    () => items.filter(item => item.title !== '语文上传联调样例'),
    [items]
  )

  React.useEffect(() => {
    const loadResources = async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const response = await resourcesAPI.list()
        setItems(response.items || [])
      } catch {
        try {
          const fallback = await fetchJSONC<CourseResource[]>('/content/resources.json')
          setItems(mapStaticResources(fallback))
          setLoadError(
            lang === 'zh'
              ? '后端资源服务未连接，已切换为本地静态资源模式。'
              : 'Backend resource service is unavailable. Switched to local static resources.'
          )
        } catch {
          setItems([])
          setLoadError(
            lang === 'zh'
              ? '课程资源加载失败，请检查前后端服务。'
              : 'Failed to load course resources.'
          )
        }
      } finally {
        setLoading(false)
      }
    }

    loadResources()
  }, [])

  const filtered = React.useMemo(
    () =>
      activeSubject === 'ALL'
        ? visibleItems
        : visibleItems.filter(it => it.subject === activeSubject),
    [visibleItems, activeSubject]
  )

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setUploadError(null)
    setUploadMessage(null)

    if (!canUpload) {
      setUploadError(lang === 'zh' ? '请先以教师或管理员身份登录。' : 'Please sign in as teacher/admin first.')
      return
    }
    if (uploadSubject === INFO_TECH_SUBJECT) {
      setUploadError(lang === 'zh' ? '信息科技学科为平台内置示例，请上传到其他学科。' : 'Info Tech is reserved as a platform demo subject.')
      return
    }
    if (!uploadTitle.trim()) {
      setUploadError(lang === 'zh' ? '请填写资源标题。' : 'Please enter a title.')
      return
    }
    if (!uploadFile) {
      setUploadError(lang === 'zh' ? '请先选择要上传的文件。' : 'Please choose a file to upload.')
      return
    }

    setUploading(true)
    try {
      const created = await resourcesAPI.upload({
        subject: uploadSubject,
        title: uploadTitle.trim(),
        grade: uploadGrade.trim() || undefined,
        summary: uploadSummary.trim() || undefined,
        keywords: uploadKeywords.trim(),
        file: uploadFile,
        fileType: uploadType,
        fileLabel: uploadFile.name
      })

      if (created) {
        setItems(prev => [created, ...prev])
      }

      setUploadTitle('')
      setUploadGrade('')
      setUploadSummary('')
      setUploadKeywords('')
      setUploadType('教案')
      setUploadFile(null)
      setActiveSubject(uploadSubject)
      setUploadMessage(lang === 'zh' ? '教案上传成功，已加入当前学科列表。' : 'Upload succeeded and has been added to the current subject.')
    } catch (error: any) {
      setUploadError(error?.message || (lang === 'zh' ? '上传失败，请稍后重试。' : 'Upload failed.'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold">
          {lang === 'zh' ? '滚灯课程资源中心' : 'Rolling Lantern Course Resources'}
        </h1>
        <p className="text-sm text-gray-500">
          {lang === 'zh'
            ? '覆盖语文、数学、英语、科学、信息科技、美术、音乐七个学科。信息科技由平台提供示例资源，其他学科支持教师上传教案并在线浏览。'
            : 'Covers seven subjects. Information Technology is prebuilt by the platform, while other subjects support teacher uploads and online preview.'}
        </p>
        <p className="text-xs text-gray-400">
          {lang === 'zh'
            ? '建议优先上传 PDF/TXT/图片等可直接在线预览格式。若上传 DOCX/PPTX，仍可下载但浏览器可能无法直接预览。'
            : 'PDF/TXT/images are recommended for direct browser preview. DOCX/PPTX can still be downloaded.'}
        </p>
        {loadError && (
          <p className="text-xs text-amber-600 dark:text-amber-300">{loadError}</p>
        )}
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
        {SUBJECTS.map(sub => (
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

      {/* 上传模块（除信息科技外） */}
      <section className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">
            {lang === 'zh' ? '教案上传（语文/数学/英语/科学/美术/音乐）' : 'Lesson Plan Upload'}
          </h2>
          <span className="text-xs text-gray-500">
            {lang === 'zh' ? '信息科技学科为平台内置示例，不开放上传。' : 'Information Technology is reserved as a built-in demo.'}
          </span>
        </div>

        {!canUpload ? (
          <p className="text-sm text-gray-500">
            {lang === 'zh'
              ? '当前账号不可上传。请使用教师或管理员账号登录后上传教案。'
              : 'Upload is available for teacher/admin accounts.'}
          </p>
        ) : (
          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleUpload}>
            <label className="space-y-1">
              <span className="text-xs text-gray-500">{lang === 'zh' ? '学科' : 'Subject'}</span>
              <select
                className="input"
                value={uploadSubject}
                onChange={e => setUploadSubject(e.target.value)}
              >
                {SUBJECTS.filter(sub => sub !== INFO_TECH_SUBJECT).map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs text-gray-500">{lang === 'zh' ? '资源类型' : 'Type'}</span>
              <select className="input" value={uploadType} onChange={e => setUploadType(e.target.value)}>
                {['教案', '课件', '活动单', '任务书'].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-xs text-gray-500">{lang === 'zh' ? '标题' : 'Title'}</span>
              <input
                className="input"
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                placeholder={lang === 'zh' ? '例如：语文项目化学习教案（滚灯主题）' : 'Resource title'}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-gray-500">{lang === 'zh' ? '年级（可选）' : 'Grade (optional)'}</span>
              <input
                className="input"
                value={uploadGrade}
                onChange={e => setUploadGrade(e.target.value)}
                placeholder={lang === 'zh' ? '例如：五年级' : 'e.g. Grade 5'}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-gray-500">{lang === 'zh' ? '关键词（逗号分隔）' : 'Keywords (comma separated)'}</span>
              <input
                className="input"
                value={uploadKeywords}
                onChange={e => setUploadKeywords(e.target.value)}
                placeholder={lang === 'zh' ? '滚灯, 项目化学习, 学科融合' : 'keywords'}
              />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-xs text-gray-500">{lang === 'zh' ? '简介（可选）' : 'Summary (optional)'}</span>
              <textarea
                className="input min-h-24"
                value={uploadSummary}
                onChange={e => setUploadSummary(e.target.value)}
                placeholder={lang === 'zh' ? '简要说明教案如何与临平滚灯结合。' : 'Brief summary'}
              />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-xs text-gray-500">{lang === 'zh' ? '上传文件' : 'Upload file'}</span>
              <input
                className="input"
                type="file"
                onChange={e => setUploadFile(e.target.files?.[0] || null)}
                accept=".pdf,.txt,.md,.doc,.docx,.ppt,.pptx,.zip,.png,.jpg,.jpeg,.webp"
              />
              {uploadFile && (
                <p className="text-xs text-gray-500">
                  {uploadFile.name} · {(uploadFile.size / 1024).toFixed(1)} KB
                </p>
              )}
            </label>

            {uploadError && (
              <p className="text-xs text-red-500 md:col-span-2">{uploadError}</p>
            )}
            {uploadMessage && (
              <p className="text-xs text-emerald-600 md:col-span-2">{uploadMessage}</p>
            )}

            <div className="md:col-span-2">
              <button type="submit" className="btn" disabled={uploading}>
                {uploading
                  ? (lang === 'zh' ? '上传中...' : 'Uploading...')
                  : (lang === 'zh' ? '上传教案' : 'Upload')}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 资源卡片列表 */}
      <section className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-500">
            {lang === 'zh' ? '课程资源加载中...' : 'Loading resources...'}
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500">
            {lang === 'zh'
              ? (activeSubject === 'ALL'
                ? '当前暂无课程资源。'
                : `${activeSubject}学科当前暂无资源，可通过上方模块上传教案。`)
              : 'No resources found for current filter.'}
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
                      {project.isSystem && (
                        <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                          {lang === 'zh' ? '平台示例' : 'System'}
                        </span>
                      )}
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

                {project.files.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">
                    {lang === 'zh'
                      ? '当前学科暂未提供可下载内容，可通过上方上传模块提交教案。'
                      : 'No downloadable files yet for this subject.'}
                  </p>
                ) : (
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
                                  previewUrl: resolveResourceUrl(file.previewUrl),
                                  downloadUrl: resolveResourceUrl(file.downloadUrl),
                                  projectTitle: project.title,
                                  subject: project.subject,
                                })
                              }
                            >
                              {lang === 'zh' ? '在线预览' : 'Preview'}
                            </button>
                          )}
                          <a
                            href={resolveResourceUrl(file.downloadUrl)}
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
                )}
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
                  href={resolveResourceUrl(selectedFile.previewUrl)}
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
                src={resolveResourceUrl(selectedFile.previewUrl)}
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
