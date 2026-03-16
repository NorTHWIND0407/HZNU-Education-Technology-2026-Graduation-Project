import React from 'react'
import { ChartBar, ChartLine, ChartPie, ChartRadar } from '../components/charts/Charts'
import { feedbackAPI, statsAPI, type FeedbackData } from '../lib/apiClient'
import { useAuthStore } from '../lib/authStore'

type BackendFeedback = {
  id: number
  user_id?: number
  userId?: number
  username?: string
  display_name?: string
  displayName?: string
  role?: string
  class_id?: string
  classId?: string
  grade?: string
  modules_used?: string | string[]
  modulesUsed?: string[]
  understanding_score?: number
  understandingScore?: number
  interest_score?: number
  interestScore?: number
  difficulty_score?: number
  difficultyScore?: number
  open_comment?: string
  openComment?: string
  suggestions?: string
  rating?: number
  status?: string
  created_at?: string
  createdAt?: string
}

type FeedbackRecord = {
  id: number
  userId: number | null
  username: string
  displayName: string
  role: string
  classId: string
  grade: string
  modulesUsed: string[]
  understandingScore: number
  interestScore: number
  difficultyScore: number
  openComment: string
  suggestions: string
  rating: number
  status: string
  createdAt: string
}

type FormState = {
  feedbackType: string
  classId: string
  grade: string
  modulesUsed: string[]
  understandingScore: number
  interestScore: number
  difficultyScore: number
  openComment: string
  suggestions: string
  rating: number
}

const MODULE_OPTIONS = ['microdoc', 'lessons', 'h5', 'webar', 'aiqa']
const FEEDBACK_TYPE_OPTIONS = ['general', 'lesson', 'module', 'bug']

function parseModules(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.filter((item): item is string => typeof item === 'string')
  }
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input)
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
    } catch {
      return []
    }
  }
  return []
}

function normalizeFeedback(item: BackendFeedback): FeedbackRecord {
  return {
    id: item.id,
    userId: item.user_id ?? item.userId ?? null,
    username: item.username || '',
    displayName: item.display_name || item.displayName || item.username || '',
    role: item.role || 'student',
    classId: item.class_id || item.classId || '',
    grade: item.grade || '',
    modulesUsed: parseModules(item.modules_used ?? item.modulesUsed),
    understandingScore: item.understanding_score ?? item.understandingScore ?? 0,
    interestScore: item.interest_score ?? item.interestScore ?? 0,
    difficultyScore: item.difficulty_score ?? item.difficultyScore ?? 0,
    openComment: item.open_comment ?? item.openComment ?? '',
    suggestions: item.suggestions ?? '',
    rating: item.rating ?? 0,
    status: item.status ?? 'pending',
    createdAt: item.created_at || item.createdAt || new Date().toISOString()
  }
}

function toCsvValue(value: unknown): string {
  const text = value == null ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function buildFallbackCsv(rows: FeedbackRecord[]): Blob {
  const headers = [
    'id',
    'userId',
    'username',
    'displayName',
    'role',
    'classId',
    'grade',
    'modulesUsed',
    'understandingScore',
    'interestScore',
    'difficultyScore',
    'openComment',
    'suggestions',
    'rating',
    'status',
    'createdAt'
  ]
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push([
      row.id,
      row.userId ?? '',
      row.username,
      row.displayName,
      row.role,
      row.classId,
      row.grade,
      row.modulesUsed.join('|'),
      row.understandingScore,
      row.interestScore,
      row.difficultyScore,
      row.openComment,
      row.suggestions,
      row.rating,
      row.status,
      row.createdAt
    ].map(toCsvValue).join(','))
  }
  return new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
}

export default function Feedback() {
  const user = useAuthStore(s => s.user)
  const [form, setForm] = React.useState<FormState>({
    feedbackType: 'general',
    classId: user?.classId || '',
    grade: user?.grade || '',
    modulesUsed: ['microdoc', 'lessons'],
    understandingScore: 3,
    interestScore: 3,
    difficultyScore: 3,
    openComment: '',
    suggestions: '',
    rating: 4
  })

  const [feedbacks, setFeedbacks] = React.useState<FeedbackRecord[]>([])
  const [statusFilter, setStatusFilter] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState('')
  const [classFilter, setClassFilter] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)
  const [actionFeedbackId, setActionFeedbackId] = React.useState<number | null>(null)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')

  const canExport = user?.role === 'teacher' || user?.role === 'admin'
  const canManage = user?.role === 'teacher' || user?.role === 'admin'
  const canSelfManage = user?.role === 'student'
  const canShowActions = canManage || canSelfManage

  React.useEffect(() => {
    if (!user) return
    setForm(prev => ({
      ...prev,
      classId: prev.classId || user.classId || '',
      grade: prev.grade || user.grade || ''
    }))
  }, [user])

  React.useEffect(() => {
    if (!user) return
    if (user.role === 'teacher') {
      setClassFilter(user.classId || '')
      return
    }
    setClassFilter('')
  }, [user])

  const loadFeedbacks = React.useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const params: {
        limit: number
        status?: string
        feedback_type?: string
        class_id?: string
      } = { limit: 500 }

      if (statusFilter) params.status = statusFilter
      if (typeFilter) params.feedback_type = typeFilter
      if (user?.role === 'teacher' && user.classId) {
        params.class_id = user.classId
      }
      if (user?.role === 'admin' && classFilter.trim()) {
        params.class_id = classFilter.trim()
      }

      const list = await feedbackAPI.list(params)
      setFeedbacks((list as BackendFeedback[]).map(normalizeFeedback))
    } catch (err) {
      setError((err as Error).message || '加载反馈失败')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, typeFilter, classFilter, user])

  React.useEffect(() => {
    if (!user) return
    loadFeedbacks()
  }, [user, loadFeedbacks])

  const chartModuleUsage = React.useMemo(() => {
    const counts = new Map<string, number>()
    feedbacks.forEach(f => {
      f.modulesUsed.forEach(module => {
        counts.set(module, (counts.get(module) || 0) + 1)
      })
    })
    return Array.from(counts.entries()).map(([module, usage]) => ({ module, usage }))
  }, [feedbacks])

  const chartRatingTrend = React.useMemo(() => {
    const group = new Map<string, { sum: number; count: number }>()
    feedbacks.forEach(f => {
      if (!f.createdAt || !f.rating) return
      const day = f.createdAt.slice(0, 10)
      const item = group.get(day) || { sum: 0, count: 0 }
      item.sum += f.rating
      item.count += 1
      group.set(day, item)
    })
    return Array.from(group.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, value]) => ({
        time,
        score: Number((value.sum / value.count).toFixed(2))
      }))
  }, [feedbacks])

  const chartInterestDistribution = React.useMemo(() => {
    const dist = new Map<number, number>()
    feedbacks.forEach(f => {
      if (f.interestScore < 1 || f.interestScore > 5) return
      dist.set(f.interestScore, (dist.get(f.interestScore) || 0) + 1)
    })
    return Array.from(dist.entries())
      .sort(([a], [b]) => a - b)
      .map(([score, count]) => ({ label: `${score}分`, value: count }))
  }, [feedbacks])

  const chartRadar = React.useMemo(() => {
    if (feedbacks.length === 0) return []
    const sum = feedbacks.reduce((acc, item) => {
      acc.understanding += item.understandingScore || 0
      acc.interest += item.interestScore || 0
      acc.difficulty += item.difficultyScore || 0
      acc.overall += item.rating || 0
      return acc
    }, { understanding: 0, interest: 0, difficulty: 0, overall: 0 })
    const total = feedbacks.length
    const avgDifficulty = sum.difficulty / total
    return [
      { aspect: '理解度', score: Number((sum.understanding / total).toFixed(2)) },
      { aspect: '兴趣度', score: Number((sum.interest / total).toFixed(2)) },
      { aspect: '难度适宜', score: Number((5 - avgDifficulty).toFixed(2)) },
      { aspect: '总体评分', score: Number((sum.overall / total).toFixed(2)) }
    ]
  }, [feedbacks])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.rating < 1 || form.rating > 5) {
      setError('评分必须在 1 到 5 之间')
      return
    }
    if (form.modulesUsed.length === 0) {
      setError('请至少选择一个使用模块')
      return
    }

    const payload: FeedbackData = {
      feedbackType: form.feedbackType,
      classId: form.classId || user?.classId || '',
      grade: form.grade || user?.grade || '',
      modulesUsed: form.modulesUsed,
      understandingScore: form.understandingScore,
      interestScore: form.interestScore,
      difficultyScore: form.difficultyScore,
      openComment: form.openComment,
      suggestions: form.suggestions,
      rating: form.rating
    }

    setIsSubmitting(true)
    try {
      await feedbackAPI.submit(payload)
      setSuccess('反馈提交成功')
      setForm(prev => ({
        ...prev,
        openComment: '',
        suggestions: ''
      }))
      await loadFeedbacks()
    } catch (err) {
      setError((err as Error).message || '提交失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function exportCSV() {
    if (!canExport) return
    setIsExporting(true)
    setError('')
    try {
      const blob = await statsAPI.exportCSV('feedbacks', user?.role === 'admin' ? form.classId : undefined)
      downloadBlob(blob, `feedback-export-${new Date().toISOString().slice(0, 10)}.csv`)
    } catch (err) {
      const fallbackBlob = buildFallbackCsv(feedbacks)
      downloadBlob(fallbackBlob, `feedback-export-local-${new Date().toISOString().slice(0, 10)}.csv`)
      setError((err as Error).message || '服务端导出失败，已切换为本地导出')
    } finally {
      setIsExporting(false)
    }
  }

  async function updateStatus(id: number, status: string) {
    if (!canManage) return
    setActionFeedbackId(id)
    setError('')
    setSuccess('')
    try {
      await feedbackAPI.updateStatus(id, status)
      setSuccess('状态已更新')
      await loadFeedbacks()
    } catch (err) {
      setError((err as Error).message || '更新状态失败')
    } finally {
      setActionFeedbackId(null)
    }
  }

  async function quickEdit(item: FeedbackRecord) {
    if (!canShowActions) return
    const ratingInput = window.prompt('请输入评分（1-5）', String(item.rating || 4))
    if (ratingInput == null) return
    const rating = Number(ratingInput)
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      setError('评分必须在 1 到 5 之间')
      return
    }
    const openComment = window.prompt('请输入意见反馈（可留空）', item.openComment || '')
    if (openComment == null) return

    setActionFeedbackId(item.id)
    setError('')
    setSuccess('')
    try {
      await feedbackAPI.update(item.id, { rating, openComment })
      setSuccess('反馈已修改')
      await loadFeedbacks()
    } catch (err) {
      setError((err as Error).message || '修改失败')
    } finally {
      setActionFeedbackId(null)
    }
  }

  async function deleteFeedback(id: number) {
    if (!canShowActions) return
    const actionText = canSelfManage ? '撤回' : '删除'
    const confirmed = window.confirm(`确认${actionText}这条反馈吗？此操作不可恢复。`)
    if (!confirmed) return

    setActionFeedbackId(id)
    setError('')
    setSuccess('')
    try {
      await feedbackAPI.delete(id)
      setSuccess(canSelfManage ? '反馈已撤回' : '反馈已删除')
      await loadFeedbacks()
    } catch (err) {
      setError((err as Error).message || '删除失败')
    } finally {
      setActionFeedbackId(null)
    }
  }

  return (
    <div className="space-y-4">
      <header className="card p-4">
        <h1 className="text-xl font-semibold">课堂反馈与数据可视化</h1>
        <p className="text-sm text-gray-500 mt-1">
          {user?.role === 'student'
            ? '你提交后可查看、修改和撤回自己的反馈记录。'
            : user?.role === 'teacher'
              ? '你可以查看本班反馈并导出 CSV。'
              : '你可以查看反馈并按班级导出 CSV。'}
        </p>
      </header>

      <form className="card p-4 space-y-3" onSubmit={onSubmit}>
        <h2 className="font-medium">提交反馈</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">反馈类型
            <select
              className="w-full border rounded px-2 py-1 bg-transparent"
              value={form.feedbackType}
              onChange={e => setForm({ ...form, feedbackType: e.target.value })}
            >
              {FEEDBACK_TYPE_OPTIONS.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>

          <label className="text-sm">班级 ID
            <input
              className="w-full border rounded px-2 py-1 bg-transparent"
              value={form.classId}
              onChange={e => setForm({ ...form, classId: e.target.value })}
              placeholder="例如：class_301"
            />
          </label>

          <label className="text-sm">年级
            <input
              className="w-full border rounded px-2 py-1 bg-transparent"
              value={form.grade}
              onChange={e => setForm({ ...form, grade: e.target.value })}
              placeholder="例如：三年级"
            />
          </label>

          <label className="text-sm">总体评分 (1-5)
            <input
              type="number"
              min={1}
              max={5}
              className="w-full border rounded px-2 py-1 bg-transparent"
              value={form.rating}
              onChange={e => setForm({ ...form, rating: Number(e.target.value) })}
            />
          </label>

          <label className="text-sm">理解度 (1-5)
            <input
              type="number"
              min={1}
              max={5}
              className="w-full border rounded px-2 py-1 bg-transparent"
              value={form.understandingScore}
              onChange={e => setForm({ ...form, understandingScore: Number(e.target.value) })}
            />
          </label>

          <label className="text-sm">兴趣度 (1-5)
            <input
              type="number"
              min={1}
              max={5}
              className="w-full border rounded px-2 py-1 bg-transparent"
              value={form.interestScore}
              onChange={e => setForm({ ...form, interestScore: Number(e.target.value) })}
            />
          </label>

          <label className="text-sm">难度 (1-5, 越高越难)
            <input
              type="number"
              min={1}
              max={5}
              className="w-full border rounded px-2 py-1 bg-transparent"
              value={form.difficultyScore}
              onChange={e => setForm({ ...form, difficultyScore: Number(e.target.value) })}
            />
          </label>

          <fieldset className="text-sm">
            <legend className="mb-1">使用模块</legend>
            <div className="flex flex-wrap gap-3">
              {MODULE_OPTIONS.map(m => (
                <label key={m}>
                  <input
                    type="checkbox"
                    className="mr-1"
                    checked={form.modulesUsed.includes(m)}
                    onChange={e => {
                      const next = new Set(form.modulesUsed)
                      if (e.target.checked) next.add(m)
                      else next.delete(m)
                      setForm({ ...form, modulesUsed: Array.from(next) })
                    }}
                  />
                  {m}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <label className="text-sm block">意见反馈
          <textarea
            className="w-full border rounded px-2 py-1 bg-transparent"
            rows={3}
            value={form.openComment}
            onChange={e => setForm({ ...form, openComment: e.target.value })}
            placeholder="填写学习感受、问题与建议"
          />
        </label>

        <label className="text-sm block">改进建议
          <textarea
            className="w-full border rounded px-2 py-1 bg-transparent"
            rows={2}
            value={form.suggestions}
            onChange={e => setForm({ ...form, suggestions: e.target.value })}
            placeholder="例如：希望增加动作分步示例"
          />
        </label>

        {error && (
          <div className="text-sm rounded border border-red-300 bg-red-50 px-3 py-2 text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-700">
            {success}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '提交中...' : '提交反馈'}
          </button>
          {canExport && (
            <button className="btn" type="button" onClick={exportCSV} disabled={isExporting}>
              {isExporting ? '导出中...' : '导出当前可见数据 CSV'}
            </button>
          )}
          <button className="btn" type="button" onClick={loadFeedbacks} disabled={isLoading}>
            {isLoading ? '刷新中...' : '刷新列表'}
          </button>
        </div>
      </form>

      <section className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-medium">反馈列表</h2>
          <label className="text-sm">
            状态
            <select
              className="ml-2 border rounded px-2 py-1 bg-transparent"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">全部</option>
              <option value="pending">pending</option>
              <option value="reviewed">reviewed</option>
              <option value="resolved">resolved</option>
              <option value="archived">archived</option>
            </select>
          </label>
          <label className="text-sm">
            类型
            <select
              className="ml-2 border rounded px-2 py-1 bg-transparent"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="">全部</option>
              {FEEDBACK_TYPE_OPTIONS.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <label className="text-sm">
              班级
              <input
                className="ml-2 border rounded px-2 py-1 bg-transparent"
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                placeholder="例如：class_301"
                readOnly={user?.role === 'teacher'}
              />
            </label>
          )}
          <span className="text-sm text-gray-500">共 {feedbacks.length} 条</span>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">时间</th>
                <th className="py-2 pr-3">学生</th>
                <th className="py-2 pr-3">班级</th>
                <th className="py-2 pr-3">评分</th>
                <th className="py-2 pr-3">理解</th>
                <th className="py-2 pr-3">兴趣</th>
                <th className="py-2 pr-3">状态</th>
                <th className="py-2 pr-3">意见</th>
                {canShowActions && <th className="py-2 pr-3">操作</th>}
              </tr>
            </thead>
            <tbody>
              {feedbacks.map(item => (
                <tr key={item.id} className="border-b align-top">
                  <td className="py-2 pr-3 whitespace-nowrap">{item.createdAt.slice(0, 16).replace('T', ' ')}</td>
                  <td className="py-2 pr-3">{item.displayName || item.username || '-'}</td>
                  <td className="py-2 pr-3">{item.classId || '-'}</td>
                  <td className="py-2 pr-3">{item.rating || '-'}</td>
                  <td className="py-2 pr-3">{item.understandingScore || '-'}</td>
                  <td className="py-2 pr-3">{item.interestScore || '-'}</td>
                  <td className="py-2 pr-3">
                    {canManage ? (
                      <select
                        className="border rounded px-1 py-0.5 bg-transparent"
                        value={item.status}
                        disabled={actionFeedbackId === item.id}
                        onChange={e => updateStatus(item.id, e.target.value)}
                      >
                        <option value="pending">pending</option>
                        <option value="reviewed">reviewed</option>
                        <option value="resolved">resolved</option>
                        <option value="archived">archived</option>
                      </select>
                    ) : (
                      item.status
                    )}
                  </td>
                  <td className="py-2 pr-3 max-w-xs">{item.openComment || item.suggestions || '-'}</td>
                  {canShowActions && (
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn !py-1 !px-2 text-xs"
                          onClick={() => quickEdit(item)}
                          disabled={actionFeedbackId === item.id}
                        >
                          修改
                        </button>
                        <button
                          type="button"
                          className="btn !py-1 !px-2 text-xs"
                          onClick={() => deleteFeedback(item.id)}
                          disabled={actionFeedbackId === item.id}
                        >
                          {canSelfManage ? '撤回' : '删除'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {feedbacks.length === 0 && (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={canShowActions ? 9 : 8}>暂无反馈数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="card p-3">
          <h3 className="font-medium mb-2">模块使用次数（Bar）</h3>
          <ChartBar data={chartModuleUsage} />
        </div>
        <div className="card p-3">
          <h3 className="font-medium mb-2">评分趋势（Line）</h3>
          <ChartLine data={chartRatingTrend} />
        </div>
        <div className="card p-3">
          <h3 className="font-medium mb-2">兴趣分布（Pie）</h3>
          <ChartPie data={chartInterestDistribution} />
        </div>
        <div className="card p-3">
          <h3 className="font-medium mb-2">自评雷达（Radar）</h3>
          <ChartRadar data={chartRadar} />
        </div>
      </section>
    </div>
  )
}
