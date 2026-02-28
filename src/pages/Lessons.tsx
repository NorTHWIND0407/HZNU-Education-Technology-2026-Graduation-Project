import React from 'react'
import { fetchJSONC } from '../lib/api'
import StepAnnotator from '../components/StepAnnotator'
import { useAppStore } from '../lib/store'

type Lesson = { id: string; title: string; thumb: string; clip: string; beats: number; steps: string[] }

export default function Lessons() {
  const [items, setItems] = React.useState<Lesson[]>([])
  const { lessonProgress, setLessonProgress } = useAppStore()
  React.useEffect(() => { fetchJSONC<Lesson[]>('/content/lessons.json').then(setItems) }, [])

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">微课 & 动作详解（占位）</h1>
        <p className="text-sm text-gray-500">TODO: content/lessons.json 字段 thumb/clip/beats/steps 均可替换，支持本地进度记录。</p>
      </header>
      <ul className="grid sm:grid-cols-2 gap-4">
        {items.map((it) => (
          <li key={it.id} className="space-y-2">
            <div className="card p-3 flex items-center justify-between">
              <div>
                <h3 className="font-medium">{it.title}</h3>
                <label className="text-sm">
                  <input type="checkbox" className="mr-2" checked={!!lessonProgress[it.id]} onChange={e => setLessonProgress(it.id, e.target.checked)} />
                  本地练习完成 (LocalStorage)
                </label>
              </div>
              <a className="btn" href={it.clip} target="_blank" rel="noreferrer">预览短片 (Mock)</a>
            </div>
            <StepAnnotator thumb={it.thumb} beats={it.beats} steps={it.steps} />
          </li>
        ))}
      </ul>
    </div>
  )
}

