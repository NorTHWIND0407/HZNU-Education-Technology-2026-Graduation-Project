import type { Entry } from '../types/content'

export default function Timeline({ items }: { items: Entry[] }) {
  return (
    <ol className="relative border-s border-gray-200 dark:border-gray-800 ml-3">
      {items.map((it) => (
        <li key={it.id} className="mb-6 ms-4">
          <div className="absolute w-3 h-3 bg-brand rounded-full mt-2.5 -start-1.5 border border-white dark:border-gray-900" />
          <time className="mb-1 text-xs text-gray-500">{it.ts || 'TODO 时间节点'}</time>
          <h3 className="text-base font-semibold">{it.title}</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">{it.desc}</p>
        </li>
      ))}
    </ol>
  )
}
