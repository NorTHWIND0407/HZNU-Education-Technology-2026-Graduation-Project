import VideoPlayer from '../components/VideoPlayer'

export default function Microdoc() {
  const playlist = [
    {
      id: 'clip-01',
      title: 'TODO 微纪录片片段 1',
      poster: '/images/placeholder_microdoc.jpg', // TODO: 1280x720
      sources: [
        { label: '480p (Mock)', src: '/videos/placeholder_480p.mp4' },
        { label: '720p (Mock)', src: '/videos/placeholder_720p.mp4' },
        { label: '1080p (Mock)', src: '/videos/placeholder_1080p.mp4' },
      ]
    },
    {
      id: 'clip-02',
      title: 'TODO 微纪录片片段 2',
      poster: '/images/placeholder_microdoc.jpg',
      sources: [
        { label: '480p (Mock)', src: '/videos/placeholder_480p.mp4' },
        { label: '720p (Mock)', src: '/videos/placeholder_720p.mp4' }
      ]
    }
  ]
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">微纪录片展示（占位）</h1>
        <p className="text-sm text-gray-500">TODO: 将真实视频放入 /public/videos，文件命名见 README，建议 H.264 MP4，720p/1080p，平均码率 3-6Mbps。</p>
      </header>
      <ul className="space-y-4">
        {playlist.map(item => (
          <li key={item.id}>
            <h3 className="font-medium mb-2">{item.title}</h3>
            <VideoPlayer sources={item.sources} poster={item.poster} />
          </li>
        ))}
      </ul>
    </div>
  )
}

