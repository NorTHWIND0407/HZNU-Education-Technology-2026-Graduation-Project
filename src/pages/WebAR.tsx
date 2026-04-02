import { Link } from 'react-router-dom'
import ARViewer from '../components/ARViewer'

export default function WebAR() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">WebAR｜临平滚灯交互展示</h1>
        <p className="text-sm text-gray-500">
          本页已接入 Three.js + WebXR 命中测试，默认可在网页端直接程序生成滚灯，并支持真实 AR 放置、旋转与自由缩放。
        </p>
      </header>

      <ARViewer />

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="card p-3">
          <h3 className="font-medium">操作说明</h3>
          <p className="text-sm text-gray-500">进入 AR 后先寻找平面，再点击放置；单指拖拽旋转，双指捏合可无级缩放。</p>
        </div>

        <div className="card p-3">
          <h3 className="font-medium">兼容说明</h3>
          <p className="text-sm text-gray-500">优先支持 Android + Chrome（HTTPS）。iOS Safari 目前暂不支持标准 WebXR immersive-ar。</p>
        </div>
      </section>

      <section className="card p-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-medium">扩展发布</h3>
          <p className="text-sm text-gray-500">若要提供 Unity 安装包或源码下载，请进入模块下载中心统一发布。</p>
        </div>
        <Link to="/module-download" className="btn">进入模块下载中心</Link>
      </section>

      <aside className="text-xs text-gray-500">
        当前 WebAR 默认会直接程序生成滚灯；如需替换为更精细的静态模型，仍可放入 `public/models/rolling-lantern.glb`（兼容 `public/models/lantern.glb`），并将 `.env` 中 `VITE_AR_MODEL_SOURCE` 设为 `auto` 或 `glb`。
      </aside>
    </div>
  )
}
