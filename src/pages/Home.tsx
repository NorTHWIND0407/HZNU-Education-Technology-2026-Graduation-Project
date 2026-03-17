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

  const timelineHighlights = React.useMemo(() => {
    const stageEntries = entries.filter(e => e.id !== 'overview')
    return stageEntries.slice(-4)
  }, [entries])

  const modules = [
    { to: '/about-linping-lantern', title: 'module_about_title', desc: 'module_about_desc' },
    { to: '/microdoc', title: 'module_microdoc_title', desc: 'module_microdoc_desc' },
    { to: '/lessons', title: 'module_lessons_title', desc: 'module_lessons_desc' },
    { to: '/resources', title: 'module_resources_title', desc: 'module_resources_desc' },
    { to: '/h5-handbook', title: 'module_handbook_title', desc: 'module_handbook_desc' },
    { to: '/webar', title: 'module_webar_title', desc: 'module_webar_desc' },
    { to: '/ai-qa', title: 'module_aiqa_title', desc: 'module_aiqa_desc' },
    { to: '/feedback', title: 'module_feedback_title', desc: 'module_feedback_desc' },
  ]

  const features = [
    { title: lang === 'zh' ? 'AI智能辅助' : 'AI-Powered', desc: lang === 'zh' ? '智能问答，个性化学习' : 'Smart Q&A, Personalized Learning' },
    { title: lang === 'zh' ? 'AR沉浸体验' : 'AR Experience', desc: lang === 'zh' ? '3D立体观察，直观认知' : '3D Visualization, Intuitive Understanding' },
    { title: lang === 'zh' ? '互动式教学' : 'Interactive Learning', desc: lang === 'zh' ? '寓教于乐，趣味学习' : 'Learning Through Play, Engaging Content' },
    { title: lang === 'zh' ? '文化传承' : 'Heritage Preservation', desc: lang === 'zh' ? '非遗保护，创新发展' : 'Intangible Heritage, Innovative Development' },
  ]
  const springGalaVideoSrc = '/videos/spring-festival-gala-2026-zhuma-tadeng.mp4'

  return (
    <div className="space-y-10 md:space-y-11 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-gold-600 text-white shadow-traditional-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 texture-paper"></div>
        </div>
        <div className="relative px-6 py-10 md:px-10 md:py-14">
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-center">
            <div className="space-y-3 md:space-y-4">
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
              <blockquote className="rounded-lg border border-white/30 bg-white/10 p-3 text-sm md:text-base leading-7 text-white/95">
                <p>
                  “别处的灯，要么提要么挂，要么抬要么放，总是稳稳当当得摆着给人看的。只有这滚灯，可以抛可以掷，可以滚可以压，烛火总不会灭。我就当自己是这灯吧，不是给谁看的，就是给自己长长久久地照个亮儿。”——《双枰记》
                </p>
              </blockquote>
              <div className="flex flex-wrap gap-3 pt-2">
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
                src="/images/home/home-hero-lantern-01.jpg"
                alt={lang === 'zh' ? '临平滚灯主题海报' : 'Linping Rolling Lantern Poster'}
                className="rounded-lg shadow-2xl w-full h-full max-h-[520px] object-cover"
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
              <div className="w-10 h-1 bg-gradient-to-r from-brand-500 to-gold-500 rounded-full mx-auto mb-4" />
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
            </Link>
          ))}
        </div>
      </section>

      {/* Timeline Section */}
      <section>
        <h2 className="section-title">{t('home_timeline_title', lang)}</h2>
        <div className="card p-6">
          {timelineHighlights.length > 0 ? (
            <Timeline items={timelineHighlights} />
          ) : (
            <div className="text-center py-12 text-ink-500 dark:text-gray-500">
              {lang === 'zh' ? '正在加载历史时间线...' : 'Loading historical timeline...'}
            </div>
          )}
        </div>
      </section>

      {/* Reference Video (Auxiliary) */}
      <section>
        <h2 className="section-title">
          {lang === 'zh' ? '资料视频' : 'Reference Video'}
        </h2>
        <div className="card p-4 md:p-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,340px)_1fr] md:items-center">
            <div>
              <h3 className="font-serif font-bold text-base text-ink-900 dark:text-gray-100 mb-2">
                {lang === 'zh' ? '临平滚灯上春晚（资料）' : 'Linping Rolling Lantern on Spring Festival Gala'}
              </h3>
              <div className="relative w-full overflow-hidden rounded-md bg-black aspect-video">
                <video controls className="absolute inset-0 h-full w-full bg-black object-contain">
                  <source src={springGalaVideoSrc} type="video/mp4" />
                  {lang === 'zh' ? '您的浏览器不支持 video 标签。' : 'Your browser does not support the video tag.'}
                </video>
              </div>
            </div>
            <blockquote className="rounded-lg border border-gold-300/60 bg-gold-50/70 p-4 md:p-4 lg:p-5 text-base md:text-[1.02rem] leading-7 text-ink-700 text-center dark:border-gold-700/60 dark:bg-ink-900/60 dark:text-gray-300 flex items-center justify-center">
              <p>
                2月14日（腊月廿七），杭州市临平区群星滚灯艺术团亮相CCTV-3综艺频道《2026年开门迎春晚》收官之夜。团队将国家级非遗临平滚灯与浙江省级非遗高头竹马创新融合，带来节目《竹马踏灯》，刚柔相济、气势恢宏，为全国观众献上一场充满江南韵味与新春喜气的文化盛宴。
              </p>
            </blockquote>
          </div>
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
