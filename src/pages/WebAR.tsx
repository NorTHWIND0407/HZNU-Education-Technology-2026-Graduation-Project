import ARViewer from '../components/ARViewer'

export default function WebAR() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">WebAR｜滚灯结构与学科融合（占位）</h1>
        <p className="text-sm text-gray-500">默认走设备支持检测 + Mock 引导。TODO: 将 /public/models/lantern.glb 替换为真实模型。</p>
      </header>
      <ARViewer />
      <section className="grid sm:grid-cols-2 gap-4">
        {['语文','美术','音乐','科学'].map((s, i) => (
          <div key={i} className="card p-3">
            <h3 className="font-medium">{s} 融合点（占位）</h3>
            <p className="text-sm text-gray-500">TODO: 在模型零件上绑定交互点，展示 {s} 相关知识与引导。</p>
          </div>
        ))}
      </section>
      <aside className="text-xs text-gray-500">
        模型替换步骤：将 GLB 放到 /public/models/lantern.glb；建议三角面数 &lt; 50k，贴图不超过 1024px；使用 Draco/meshopt 压缩；命名分层。
      </aside>
    </div>
  )
}

