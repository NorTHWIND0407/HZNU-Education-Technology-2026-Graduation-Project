import React from 'react'
import VideoPlayer from '../components/VideoPlayer'
import { fetchJSONC } from '../lib/api'
import type { MicrodocClip } from '../types/content'

export default function Microdoc() {
  const [playlist, setPlaylist] = React.useState<MicrodocClip[]>([])

  React.useEffect(() => {
    fetchJSONC<MicrodocClip[]>('/content/microdoc.json')
      .then(setPlaylist)
      .catch(() => setPlaylist([]))
  }, [])

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">微纪录片展示（占位）</h1>
        <p className="text-sm text-gray-500">TODO: 将真实视频放入 /public/videos，文件命名见 README，建议 H.264 MP4，720p/1080p，平均码率 3-6Mbps。播放清单位于 content/microdoc.json。</p>
      </header>
      {playlist.length === 0 ? (
        <p className="text-sm text-gray-500">加载微纪录片资源中…</p>
      ) : (
        <ul className="space-y-4">
          {playlist.map(item => (
            <li key={item.id}>
              <h3 className="font-medium mb-2">{item.title}</h3>
              <VideoPlayer sources={item.sources} poster={item.poster} iframeSrc={item.iframeSrc} iframeTitle={item.iframeTitle} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
