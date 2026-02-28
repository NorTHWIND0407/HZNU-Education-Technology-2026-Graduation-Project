import React from 'react'

export default function StepAnnotator({
  thumb,
  beats,
  steps
}: {
  thumb: string // TODO: 缩略图路径，建议 320x180 JPG
  beats: number // TODO: 节拍数，如 4 或 8
  steps: string[] // TODO: 每步说明，建议短句
}) {
  const [counting, setCounting] = React.useState(false)
  const [bpm, setBpm] = React.useState(90) // TODO: 替换为与音频/视频对齐
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    if (!counting) return
    const interval = Math.max(200, Math.round(60000 / bpm))
    const id = setInterval(() => setTick(t => (t + 1) % beats), interval)
    return () => clearInterval(id)
  }, [counting, bpm, beats])

  return (
    <div className="card p-4 flex flex-col gap-3">
      <img src={thumb} alt="动作缩略图 (占位) // TODO 替换为真实帧图" className="max-h-40 rounded" />
      <div className="flex items-center gap-2">
        <button className="btn" onClick={() => setCounting(v => !v)}>{counting ? 'Stop' : 'Start'} 计数</button>
        <label className="text-sm">BPM
          <input className="ml-2 border rounded px-2 py-1 w-20 bg-transparent" type="number" value={bpm} onChange={e => setBpm(Number(e.target.value)||90)} />
        </label>
        <span className="text-sm text-gray-500">当前拍：{tick + 1}/{beats} (Mock)</span>
      </div>
      <ol className="list-decimal pl-6 text-sm">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    </div>
  )
}

