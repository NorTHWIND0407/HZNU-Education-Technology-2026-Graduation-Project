import React from 'react'
import type { VideoSource } from '../types/content'

export default function VideoPlayer({
  sources = [],
  poster,
  iframeSrc,
  iframeTitle
}: {
  sources?: VideoSource[]
  poster?: string
  iframeSrc?: string
  iframeTitle?: string
}) {
  const hasIframe = Boolean(iframeSrc)
  const [showIframe, setShowIframe] = React.useState(!hasIframe)

  React.useEffect(() => {
    setShowIframe(!hasIframe)
  }, [hasIframe, iframeSrc])

  return (
    <div className="card p-3">
      {hasIframe ? (
        <div className="relative w-full overflow-hidden rounded bg-black" style={{ paddingTop: '56.25%' }}>
          {showIframe ? (
            <iframe
              src={iframeSrc}
              title={iframeTitle ?? '外部视频播放器'}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              type="button"
              className="absolute inset-0 flex h-full w-full items-center justify-center bg-black text-sm text-white"
              onClick={() => setShowIframe(true)}
            >
              {poster ? <img src={poster} alt="视频预览" className="absolute inset-0 h-full w-full object-cover" /> : null}
              <span className="relative z-10 rounded border border-white/40 bg-black/60 px-3 py-1">点击播放</span>
            </button>
          )}
        </div>
      ) : (
        <div className="relative w-full overflow-hidden rounded bg-black" style={{ paddingTop: '56.25%' }}>
          <video controls poster={poster} className="absolute inset-0 h-full w-full rounded bg-black object-contain">
            {sources.map((s) => (
              <source key={s.label} src={s.src} type="video/mp4" />
            ))}
            您的浏览器不支持 video 标签。
          </video>
        </div>
      )}

      {sources.length > 0 && !hasIframe && (
        <div className="mt-2 flex gap-2 text-xs text-gray-500">
          {sources.map((s) => (
            <span key={s.label} className="px-2 py-1 border rounded">{s.label}</span>
          ))}
        </div>
      )}

      {hasIframe && (
        <p className="mt-2 text-xs text-gray-500">当前为 B 站外链嵌入播放，如在部分浏览器受限可改为本地 MP4 方案。</p>
      )}
    </div>
  )
}
