import { Link } from 'react-router-dom'
import { useAppStore } from '../lib/store'
import { t } from '../lib/i18n'
import Timeline from '../components/Timeline'
import { fetchJSONC } from '../lib/api'
import React from 'react'
import type { Entry } from '../types/content'

export default function Home() {
  const lang = useAppStore(s => s.lang)
  const [entries, setEntries] = React.useState<Entry[]>([])

  React.useEffect(() => {
    fetchJSONC<Entry[]>('/content/entries.json').then(d => setEntries(d))
  }, [])

  const modules = [
    { to: '/about-linping-lantern', title: 'module_about_title', desc: 'module_about_desc', icon: '📚' },
    { to: '/microdoc', title: 'module_microdoc_title', desc: 'module_microdoc_desc', icon: '🎬' },
    { to: '/lessons', title: 'module_lessons_title', desc: 'module_lessons_desc', icon: '🎭' },
    { to: '/resources', title: 'module_resources_title', desc: 'module_resources_desc', icon: '📂' },
    { to: '/h5-handbook', title: 'module_handbook_title', desc: 'module_handbook_desc', icon: '📖' },
    { to: '/webar', title: 'module_webar_title', desc: 'module_webar_desc', icon: '🔮' },
    { to: '/ai-qa', title: 'module_aiqa_title', desc: 'module_aiqa_desc', icon: '🤖' },
    { to: '/feedback', title: 'module_feedback_title', desc: 'module_feedback_desc', icon: '📊' },
  ]

  const features = [
    { title: lang === 'zh' ? 'AI智能辅助' : 'AI-Powered', desc: lang === 'zh' ? '智能问答，个性化学习' : 'Smart Q&A, Personalized Learning', icon: '🧠' },
    { title: lang === 'zh' ? 'AR沉浸体验' : 'AR Experience', desc: lang === 'zh' ? '3D立体观察，直观认知' : '3D Visualization, Intuitive Understanding', icon: '🎯' },
    { title: lang === 'zh' ? '互动式教学' : 'Interactive Learning', desc: lang === 'zh' ? '寓教于乐，趣味学习' : 'Learning Through Play, Engaging Content', icon: '🎮' },
    { title: lang === 'zh' ? '文化传承' : 'Heritage Preservation', desc: lang === 'zh' ? '非遗保护，创新发展' : 'Intangible Heritage, Innovative Development', icon: '🏮' },
  ]

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-gold-600 text-white shadow-traditional-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 texture-paper"></div>
        </div>
        <div className="relative px-6 py-12 md:px-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                {lang === 'zh' ? '非物质文化遗产' : 'Intangible Cultural Heritage'}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight">
                {t('hero_title', lang)}
              </h1>
              <p className="text-xl md:text-2xl text-white/90 font-medium">
                {t('hero_subtitle', lang)}
              </p>
              <p className="text-lg text-white/80 leading-relaxed">
                {t('hero_desc', lang)}
              </p>
              <div className="flex flex-wrap gap-3 pt-4">
                <Link to="/lessons" className="btn bg-white text-brand-600 hover:bg-white/90 border-white">
                  {lang === 'zh' ? '开始学习' : 'Start Learning'}
                </Link>
                <Link to="/about-linping-lantern" className="btn-outline border-white text-white hover:bg-white/10">
                  {t('learn_more', lang)}
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <img
                src="/images/placeholder_hero.jpg"
                alt={lang === 'zh' ? '临平滚灯主题海报' : 'Linping Rolling Lantern Poster'}
                className="rounded-lg shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <h2 className="section-title">{t('home_features_title', lang)}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="card p-6 text-center hover:scale-105 transition-transform animate-slide-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="text-5xl mb-3">{feature.icon}</div>
              <h3 className="font-serif font-bold text-lg mb-2 text-ink-900 dark:text-gray-100">
                {feature.title}
              </h3>
              <p className="text-sm text-ink-600 dark:text-gray-400">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Modules Section */}
      <section>
        <h2 className="section-title">{t('home_modules_title', lang)}</h2>
        <div className="card-grid">
          {modules.map((module, idx) => (
            <Link
              key={module.to}
              to={module.to}
              className="card p-6 group hover:scale-102 transition-all animate-slide-up"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl group-hover:scale-110 transition-transform">
                  {module.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-serif font-bold text-xl mb-2 text-ink-900 dark:text-gray-100 group-hover:text-brand transition-colors">
                    {t(module.title, lang)}
                  </h3>
                  <p className="text-sm text-ink-600 dark:text-gray-400 leading-relaxed mb-4">
                    {t(module.desc, lang)}
                  </p>
                  <div className="inline-flex items-center gap-2 text-brand font-medium text-sm group-hover:gap-3 transition-all">
                    {t('enter', lang)}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Timeline Section */}
      <section>
        <h2 className="section-title">{t('home_timeline_title', lang)}</h2>
        <div className="card p-6">
          {entries.length > 0 ? (
            <Timeline items={entries.slice(0, 4)} />
          ) : (
            <div className="text-center py-12 text-ink-500 dark:text-gray-500">
              {lang === 'zh' ? '正在加载历史时间线...' : 'Loading historical timeline...'}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="card p-8 md:p-12 text-center bg-gradient-to-br from-gold-50 to-brand-50 dark:from-ink-900 dark:to-brand-900/20 border-gold-300 dark:border-gold-800">
        <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-ink-900 dark:text-gray-100">
          {lang === 'zh' ? '开启你的滚灯之旅' : 'Begin Your Rolling Lantern Journey'}
        </h2>
        <p className="text-lg text-ink-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
          {lang === 'zh'
            ? '通过AI智能辅助、AR沉浸体验和互动式教学，深入了解临平滚灯的文化魅力'
            : 'Explore the cultural charm of Linping Rolling Lantern through AI assistance, AR experiences, and interactive learning'}
        </p>
        <Link to="/lessons" className="btn btn-lg">
          {lang === 'zh' ? '立即开始' : 'Get Started'}
        </Link>
      </section>
    </div>
  )
}
