import { useState, useEffect } from 'react'
import { useI18n } from '../i18n'
import type { Lang } from '../i18n'

const sections = [
  { id: 'hero', key: 'nav.hero' },
  { id: 'countdown', key: 'nav.countdown' },
  { id: 'checkin', key: 'nav.checkin' },
  { id: 'gallery', key: 'nav.gallery' },
]

export default function Header({ onAdminClick }: { onAdminClick: () => void }) {
  const { t, lang, setLang, LANG_LABELS } = useI18n()
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('hero')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      let current = sections[0].id
      for (const s of sections) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top <= 120) current = s.id
      }
      setActive(current)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-[70px] transition-all duration-300 ${
        scrolled ? 'bg-white/92 backdrop-blur-[12px] shadow-sm' : ''
      }`}
    >
      <div className="h-full flex items-center justify-between px-6 mx-auto" style={{ maxWidth: 'var(--container-max)' }}>
        <button onClick={() => scrollTo('hero')} className="text-xl font-black text-navy hover:text-blue transition-colors tracking-tight cursor-pointer bg-transparent border-none hover:scale-105 active:scale-95">
          {t('brand')}
        </button>

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-1">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border-none active:scale-90 ${
                  active === s.id
                    ? 'bg-blue text-white shadow-[0_2px_8px_rgba(20,136,219,.3)]'
                    : 'bg-transparent text-gray-dark hover:text-blue hover:bg-gray-100'
                }`}
              >
                {t(s.key)}
              </button>
            ))}
          </nav>

          <button
            onClick={onAdminClick}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-transparent text-gray-dark hover:text-blue hover:bg-gray-100 transition-all duration-200 cursor-pointer border-none text-lg active:scale-90 hover:scale-110"
            title={t('potato.title')}
          >
            🥔
          </button>

          <div className="flex gap-0.5 relative z-[2001]">
            {(['vi', 'en', 'fr'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all duration-200 cursor-pointer border-none active:scale-90 ${
                  lang === l
                    ? 'bg-blue text-white shadow-[0_2px_8px_rgba(20,136,219,.3)]'
                    : 'bg-transparent text-gray-dark hover:text-blue hover:bg-gray-100'
                }`}
              >
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
