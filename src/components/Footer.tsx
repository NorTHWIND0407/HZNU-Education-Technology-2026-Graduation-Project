import { Link } from 'react-router-dom'
import { useAppStore } from '../lib/store'
import { t } from '../lib/i18n'

export default function Footer() {
  const lang = useAppStore(s => s.lang)
  const currentYear = new Date().getFullYear()
  const officialLinks = [
    {
      key: 'footer_link_lp_digital_museum',
      href: 'http://www.hzlpwhg.com/'
    },
    {
      key: 'footer_link_lp_gov',
      href: 'https://www.linping.gov.cn/'
    },
    {
      key: 'footer_link_ihchina',
      href: 'https://www.ihchina.cn/'
    },
    {
      key: 'footer_link_zj_culture',
      href: 'https://ct.zj.gov.cn/'
    }
  ] as const

  return (
    <footer className="border-t-2 border-gold-200 dark:border-gold-800/30 bg-gradient-to-b from-paper to-gold-50 dark:from-paper-dark dark:to-ink-900 mt-12">
      <div className="container-narrow py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
          {/* About Section */}
          <div>
            <h3 className="font-serif font-bold text-lg mb-3 text-ink-900 dark:text-gray-100">
              {t('hero_title', lang)}
            </h3>
            <p className="text-sm text-ink-600 dark:text-gray-400 leading-relaxed">
              {t('hero_desc', lang)}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif font-bold text-lg mb-3 text-ink-900 dark:text-gray-100">
              {lang === 'zh' ? '快速链接' : 'Quick Links'}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about-linping-lantern" className="text-ink-600 dark:text-gray-400 hover:text-brand transition-colors">
                  {t('nav_about', lang)}
                </Link>
              </li>
              <li>
                <Link to="/lessons" className="text-ink-600 dark:text-gray-400 hover:text-brand transition-colors">
                  {t('nav_lessons', lang)}
                </Link>
              </li>
              <li>
                <Link to="/ai-qa" className="text-ink-600 dark:text-gray-400 hover:text-brand transition-colors">
                  {t('nav_aiqa', lang)}
                </Link>
              </li>
            </ul>
          </div>

          {/* Official Links */}
          <div>
            <h3 className="font-serif font-bold text-lg mb-3 text-ink-900 dark:text-gray-100">
              {t('footer_official_links', lang)}
            </h3>
            <ul className="space-y-2 text-sm">
              {officialLinks.map(link => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink-600 dark:text-gray-400 hover:text-brand transition-colors"
                  >
                    {t(link.key, lang)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Info */}
          <div>
            <h3 className="font-serif font-bold text-lg mb-3 text-ink-900 dark:text-gray-100">
              {lang === 'zh' ? '联系信息' : 'Contact Info'}
            </h3>
            <div className="space-y-2 text-sm text-ink-600 dark:text-gray-400">
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                northwind0ywl@gmail.com
              </p>
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {lang === 'zh' ? '浙江省杭州市临平区' : 'Linping, Hangzhou, Zhejiang'}
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="divider-gold"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2 text-ink-600 dark:text-gray-400">
            <span>© {currentYear}</span>
            <span>·</span>
            <span>{t('footer_copyright', lang)}</span>
          </div>

          {/* Mock Notice Badge */}
          <div className="flex items-center gap-2">
            <span className="badge-gold text-xs">
              {t('footer_mock_notice', lang)}
            </span>
          </div>
        </div>

        {/* Traditional decoration pattern */}
        <div className="mt-6 flex justify-center">
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent rounded-full"></div>
        </div>
      </div>
    </footer>
  )
}
