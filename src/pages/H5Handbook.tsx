import React from 'react'
import { fetchJSONC } from '../lib/api'

type Chapter = { id: string; title: string; svg?: string; audio?: string; quiz?: { q: string; a: string[]; correct: number }[] }

export default function H5Handbook() {
  const [chapters, setChapters] = React.useState<Chapter[]>([])
  const [idx, setIdx] = React.useState(0)
  const [score, setScore] = React.useState(0)
  React.useEffect(() => { fetchJSONC<Chapter[]>('/content/handbook.json').then(setChapters) }, [])
  const cur = chapters[idx]

  function onAnswer(i: number, correct: number) {
    if (i === correct) setScore(s => s + 1)
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">H5 互动手册（占位）</h1>
        <p className="text-sm text-gray-500">TODO: 题库、插图与音频均以占位，章节滑动/点击可交互（Mock）。</p>
      </header>
      {cur ? (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">{cur.title}</h3>
            <div className="text-sm">进度 {idx+1}/{chapters.length} | 得分 {score}</div>
          </div>
          {cur.svg && <img src={cur.svg} alt="章节插图占位 // TODO 替换 SVG" className="rounded mb-3" />}
          {cur.audio && <audio controls src={cur.audio} className="w-full mb-3" />}
          <div className="space-y-3">
            {(cur.quiz ?? []).map((q, qi) => (
              <div key={qi} className="p-3 border rounded">
                <p className="font-medium">{q.q}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {q.a.map((opt, i) => (
                    <button key={i} className="btn" onClick={() => onAnswer(i, q.correct)}>{opt}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            <button className="btn" disabled={idx<=0} onClick={()=>setIdx(i=>i-1)}>上一章</button>
            <button className="btn" disabled={idx>=chapters.length-1} onClick={()=>setIdx(i=>i+1)}>下一章</button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">加载章节中…</p>
      )}
      <aside className="text-xs text-gray-500">TODO: 关卡与成就开关默认开，可通过 JSON 字段启用/关闭。</aside>
    </div>
  )
}

