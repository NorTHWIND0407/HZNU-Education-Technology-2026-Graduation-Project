import React from 'react'

export default function ARViewer() {
  const useAR = (import.meta.env.VITE_USE_AR ?? 'true') !== 'false'
  const [aframeReady, setAframeReady] = React.useState(false)

  React.useEffect(() => {
    if (!useAR) return
    // Try to load A-Frame from CDN. If blocked, we stay in Mock mode.
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/aframe@1.5.0/dist/aframe.min.js' // TODO: 可改为本地或固定版本
    script.onload = () => setAframeReady(true)
    script.onerror = () => setAframeReady(false)
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [useAR])

  if (!useAR) {
    return (
      <div className="card p-4">
        <p className="mb-2">AR 模式已关闭（.env 设置 VITE_USE_AR=false）。</p>
        <p className="text-sm text-gray-500">TODO: 放置模型 /public/models/lantern.glb 并开启 AR。</p>
      </div>
    )
  }

  if (!aframeReady) {
    return (
      <div className="card p-4">
        <p className="mb-2">设备支持检测 / 资源加载中（Mock）。</p>
        <ul className="list-disc pl-6 text-sm text-gray-500">
          <li>TODO: 替换模型 /public/models/lantern.glb （建议 &lt; 5MB, 使用 Draco/meshopt 压缩）</li>
          <li>TODO: 纹理尺寸建议不超过 1024x1024</li>
          <li>TODO: 分层命名规范，例如 parts/base, parts/handle</li>
        </ul>
      </div>
    )
  }

  // Mock scene with a box if no model. For real model, place <a-entity gltf-model="/models/lantern.glb"></a-entity>
  return (
    <div className="card p-2">
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore - A-Frame custom elements */}
      <a-scene embedded vr-mode-ui="enabled: false" renderer="colorManagement: true">
        {/* TODO: 替换为真实模型 */}
        {/* @ts-ignore */}
        <a-entity position="0 1.6 -3" rotation="0 45 0">
          {/* @ts-ignore */}
          <a-box depth="1" height="1" width="1" color="#e76f51"></a-box>
          {/* @ts-ignore */}
          <a-sky color="#ECECEC"></a-sky>
          {/* @ts-ignore */}
          <a-entity position="0 1 3">
            {/* @ts-ignore */}
            <a-camera></a-camera>
          </a-entity>
        </a-entity>
      </a-scene>
      <p className="text-xs text-gray-500 p-2">Mock AR 场景。TODO: 用 /models/lantern.glb 替换。</p>
    </div>
  )
}
