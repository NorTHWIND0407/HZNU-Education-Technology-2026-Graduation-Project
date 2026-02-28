import React from 'react'
import { validateFeedback, type FeedbackForm } from '../lib/validators'
import { ChartBar, ChartLine, ChartPie, ChartRadar } from '../components/charts/Charts'
import { mockInterestDistribution, mockProgressOverTime, mockSelfEvalRadar, mockUsageByModule } from '../lib/charts'

export default function Feedback() {
  const [data, setData] = React.useState<FeedbackForm>({
    classId: 'TODO_Class_1',
    studentId: 'TODO_0001',
    grade: '小学3年级',
    modulesUsed: ['microdoc','lessons'],
    selfEvaluation: { understanding: 3, interest: 4, difficulty: ['动作节拍'] },
    openComment: 'TODO 开放性意见…',
    ts: new Date().toISOString()
  })
  const [errors, setErrors] = React.useState<string[]>([])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const r = validateFeedback(data)
    setErrors(r.errors)
    if (r.valid) {
      const key = 'lp_feedback_mock'
      const arr = JSON.parse(localStorage.getItem(key) || '[]')
      arr.push(data)
      localStorage.setItem(key, JSON.stringify(arr))
      alert('已保存到本地（Mock）')
    }
  }

  function exportCSV() {
    const key = 'lp_feedback_mock'
    const arr: FeedbackForm[] = JSON.parse(localStorage.getItem(key) || '[]')
    const headers = Object.keys(arr[0] ?? data)
    const rows = [headers.join(',')]
    for (const it of arr) {
      rows.push(headers.map(h => JSON.stringify((it as any)[h] ?? '')).join(','))
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'feedback_mock.csv'; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">课堂反馈 & 数据可视化（占位）</h1>
        <p className="text-sm text-gray-500">表单入 LocalStorage 或 Mock API。图表映射规则见注释。</p>
      </header>

      <form className="card p-4 space-y-3" onSubmit={onSubmit}>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">班级 ID
            <input className="w-full border rounded px-2 py-1 bg-transparent" value={data.classId} onChange={e=>setData({...data, classId:e.target.value})} />
          </label>
          <label className="text-sm">学生 ID/匿名
            <input className="w-full border rounded px-2 py-1 bg-transparent" value={data.studentId} onChange={e=>setData({...data, studentId:e.target.value})} />
          </label>
          <label className="text-sm">年级（小学1-6年级）
            <input className="w-full border rounded px-2 py-1 bg-transparent" value={data.grade} onChange={e=>setData({...data, grade:e.target.value})} />
          </label>
          <fieldset className="text-sm">
            <legend>使用模块</legend>
            {['microdoc','lessons','h5','webar','aiqa'].map(m => (
              <label key={m} className="mr-3">
                <input type="checkbox" className="mr-1" checked={data.modulesUsed.includes(m)} onChange={(e)=>{
                  const next = new Set(data.modulesUsed); e.target.checked ? next.add(m) : next.delete(m)
                  setData({...data, modulesUsed: Array.from(next)})
                }} />{m}
              </label>
            ))}
          </fieldset>
          <label className="text-sm">理解度 (1-5)
            <input type="number" min={1} max={5} className="w-full border rounded px-2 py-1 bg-transparent" value={data.selfEvaluation.understanding} onChange={e=>setData({...data, selfEvaluation:{...data.selfEvaluation, understanding: Number(e.target.value)}})} />
          </label>
          <label className="text-sm">兴趣度 (1-5)
            <input type="number" min={1} max={5} className="w-full border rounded px-2 py-1 bg-transparent" value={data.selfEvaluation.interest} onChange={e=>setData({...data, selfEvaluation:{...data.selfEvaluation, interest: Number(e.target.value)}})} />
          </label>
        </div>
        <label className="text-sm block">开放性意见
          <textarea className="w-full border rounded px-2 py-1 bg-transparent" rows={3} value={data.openComment} onChange={e=>setData({...data, openComment:e.target.value})} />
        </label>
        {errors.length>0 && <ul className="text-red-500 text-sm list-disc pl-6">{errors.map((e,i)=><li key={i}>{e}</li>)}</ul>}
        <div className="flex gap-2">
          <button className="btn" type="submit">提交（Mock）</button>
          <button className="btn" type="button" onClick={exportCSV}>导出 CSV（Mock）</button>
        </div>
      </form>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="card p-3">
          <h3 className="font-medium mb-2">模块使用次数（Bar）</h3>
          <ChartBar data={mockUsageByModule()} />
          <p className="text-xs text-gray-500 mt-1">映射：真实字段 -&gt; 模块名 module / 使用次数 usage</p>
        </div>
        <div className="card p-3">
          <h3 className="font-medium mb-2">学习进步（Line）</h3>
          <ChartLine data={mockProgressOverTime()} />
          <p className="text-xs text-gray-500 mt-1">映射：真实字段 -&gt; 时间 time / 分数 score</p>
        </div>
        <div className="card p-3">
          <h3 className="font-medium mb-2">兴趣分布（Pie）</h3>
          <ChartPie data={mockInterestDistribution()} />
          <p className="text-xs text-gray-500 mt-1">映射：真实字段 -&gt; 类别 label / 值 value</p>
        </div>
        <div className="card p-3">
          <h3 className="font-medium mb-2">自评雷达（Radar）</h3>
          <ChartRadar data={mockSelfEvalRadar()} />
          <p className="text-xs text-gray-500 mt-1">映射：真实字段 -&gt; 维度 aspect / 分数 score</p>
        </div>
      </section>
    </div>
  )
}
