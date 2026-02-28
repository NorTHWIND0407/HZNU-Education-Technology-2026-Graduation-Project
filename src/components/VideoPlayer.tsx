type Source = { label: string; src: string }

export default function VideoPlayer({
  sources,
  poster
}: {
  sources: Source[]
  poster?: string
}) {
  /* TODO: 替换说明
   * - sources: 提供不同清晰度的 mp4 地址，如 /videos/placeholder_480p.mp4
   * - poster: 预览图，建议 1280x720 JPG，放在 /public/images
   * - 命名建议：microdoc_part1_720p.mp4
   */
  return (
    <div className="card p-3">
      <video controls poster={poster} className="w-full rounded">
        {sources.map((s) => (
          <source key={s.label} src={s.src} type="video/mp4" />
        ))}
        您的浏览器不支持 video 标签。
      </video>
      <div className="mt-2 flex gap-2 text-xs text-gray-500">
        {sources.map(s => (
          <span key={s.label} className="px-2 py-1 border rounded">{s.label} (Mock)</span>
        ))}
      </div>
    </div>
  )
}

