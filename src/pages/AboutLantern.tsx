import React from 'react'
import { fetchJSONC } from '../lib/api'
import type { Entry } from '../types/content'

export default function AboutLantern() {
  const [entries, setEntries] = React.useState<Entry[]>([])
  const [q, setQ] = React.useState('')
  const [hasSearched, setHasSearched] = React.useState(false)
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = React.useState(false)

  React.useEffect(() => {
    fetchJSONC<Entry[]>('/content/entries.json').then(setEntries)
  }, [])

  const allKeywords = React.useMemo(() => {
    const set = new Set<string>()
    entries.forEach(e => {
      set.add(e.title)
      e.keywords?.forEach(k => set.add(k))
    })
    ;['滚灯 起源', '滚灯 制作', '滚灯 基本动作', '临平滚灯 非遗'].forEach(k => set.add(k))
    return Array.from(set)
  }, [entries])

  const suggestions = React.useMemo(() => {
    const input = q.trim().toLowerCase()
    if (!input) return []
    return allKeywords.filter(k => k.toLowerCase().includes(input)).slice(0, 8)
  }, [q, allKeywords])

  const filtered = React.useMemo(() => {
    const input = q.trim().toLowerCase()
    if (!hasSearched || !input) return []
     const tokens = input.split(/\s+/).filter(Boolean)
    return entries.filter(e => {
      const text = (e.title + e.desc + (e.keywords || []).join(' ')).toLowerCase()
      return tokens.every(t => text.includes(t))
    })
  }, [entries, q, hasSearched])

  const activeEntry: Entry | null =
    (activeId && entries.find(e => e.id === activeId)) || filtered[0] || null

  function triggerSearch(nextQ: string) {
    const value = nextQ.trim()
    if (!value) return
    setQ(nextQ)
    setHasSearched(true)
    setShowSuggestions(false)
  }

  function handleSearch() {
    triggerSearch(q)
  }

  function handleSuggestionClick(s: string) {
    triggerSearch(s)
  }

  const overview = entries.find(e => e.id === 'overview')

  return (
    <div className="space-y-4">
      {/* 顶部“搜索首页”式布局 */}
      <section className="card relative z-20 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-full md:w-1/3">
          <div className="relative rounded-xl overflow-hidden shadow-traditional-lg">
            <img
              src="/images/placeholder_about.jpg"
              alt="临平滚灯示意图（可替换为AI生成的小图）"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
        <div className="w-full md:w-2/3 space-y-4">
          <header>
            <h1 className="text-2xl md:text-3xl font-serif font-bold mb-2">
              临平滚灯文化百科
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              像搜索引擎一样输入「滚灯」「滚灯制作」「元宵节」等关键词，快速查找与临平滚灯相关的知识。
            </p>
          </header>

          {/* 搜索栏 */}
          <div className="relative">
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="请输入关键词，例如：滚灯、滚灯制作、元宵节…"
                value={q}
                onChange={e => {
                  setQ(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 150)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
              />
              <button
                type="button"
                className="btn whitespace-nowrap"
                onClick={handleSearch}
              >
                搜索
              </button>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-ink-900 border border-gold-200 dark:border-gold-800 rounded-md shadow-lg max-h-60 overflow-auto text-sm">
                {suggestions.map(s => (
                  <li
                    key={s}
                    className="px-3 py-2 cursor-pointer hover:bg-gold-50 dark:hover:bg-gold-900/30"
                    onMouseDown={e => {
                      e.preventDefault()
                      handleSuggestionClick(s)
                    }}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* 今日搜索推荐 */}
      <section className="card p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            今日搜索推荐
          </h2>
          <span className="text-xs text-gray-400">
            点击下方关键词，直接进行搜索
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {['临平滚灯', '滚灯 起源', '滚灯 制作', '滚灯 基本动作'].map(word => (
            <button
              key={word}
              type="button"
              className="px-3 py-1.5 rounded-full border border-gold-200 dark:border-gold-800 text-xs text-gray-700 dark:text-gray-200 hover:bg-gold-50 dark:hover:bg-gold-900/30 transition-colors"
              onClick={() => triggerSearch(word)}
            >
              {word}
            </button>
          ))}
        </div>
        {overview && (
          <div className="mt-2 border-t border-gold-100 dark:border-gold-900/40 pt-3 text-xs text-gray-600 dark:text-gray-300">
            <div className="font-semibold mb-1">推荐条目：{overview.title}</div>
            <p className="line-clamp-2">{overview.desc}</p>
          </div>
        )}
      </section>

      {/* 搜索结果区：只有搜索后才显示 */}
      {hasSearched && (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <h2 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
                搜索结果（{filtered.length}）
              </h2>
              {filtered.length === 0 ? (
                <p className="text-xs text-gray-500">
                  暂无匹配条目，请尝试调整或更换关键词。
                </p>
              ) : (
                <ul className="space-y-2">
                  {filtered.map(it => (
                    <li key={it.id}>
                      <button
                        type="button"
                        onClick={() => setActiveId(it.id)}
                        className={`w-full text-left px-3 py-2 rounded-md border text-sm transition-colors ${
                          activeEntry?.id === it.id
                            ? 'border-brand bg-brand-50 dark:bg-brand-900/20'
                            : 'border-gold-200 dark:border-gold-800 hover:bg-gold-50 dark:hover:bg-gold-900/20'
                        }`}
                      >
                        <div className="font-medium">{it.title}</div>
                        <div className="text-xs text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap">
                          {it.desc}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="md:col-span-2">
              {activeEntry ? (
                <article className="card p-4 space-y-3">
                  <header>
                    <div className="text-xs text-gray-500">
                      {activeEntry.ts || '百科条目'}
                    </div>
                    <h2 className="text-lg font-semibold">
                      {activeEntry.title}
                    </h2>
                  </header>
                  {activeEntry.media && (
                    <img
                      src={activeEntry.media}
                      alt={activeEntry.title}
                      className="rounded mb-2 max-h-56 object-cover w-full"
                    />
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                    {activeEntry.desc}
                  </p>
                  {activeEntry.keywords && activeEntry.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      {activeEntry.keywords.map(k => (
                        <span
                          key={k}
                          className="px-2 py-0.5 rounded-full border border-gold-200 dark:border-gold-800"
                        >
                          #{k}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ) : (
                <p className="text-sm text-gray-500">
                  暂无可显示条目，请在左侧选择一个结果。
                </p>
              )}
            </div>
          </div>

          <aside className="text-xs text-gray-500">
            提示：搜索框支持模糊匹配，例如输入“滚”即可联想到“滚灯”“滚灯制作”等相关组合。
          </aside>
        </>
      )}
    </div>
  )
}
