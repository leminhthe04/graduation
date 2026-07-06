import { useState, useEffect } from 'react'
import { useI18n } from '../i18n'
import type { Lang } from '../i18n'

export default function Header({ onAdminClick }: { onAdminClick: () => void }) {
  const { t, lang, setLang, LANG_LABELS } = useI18n()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToHero = () => {
    document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-[70px] transition-all duration-500 ${
        scrolled 
          ? 'bg-white/30 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]' 
          : 'bg-transparent'
      }`}
    >
      <div className="h-full flex items-center justify-between px-6 mx-auto" style={{ maxWidth: 'var(--container-max)' }}>
        <button 
          onClick={scrollToHero} 
          className="text-lg font-black text-navy hover:text-blue transition-all duration-300 tracking-tight cursor-pointer bg-transparent border-none hover:scale-105 active:scale-95"
        >
          {t('brand')}
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={onAdminClick}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 border border-white/30 text-gray-dark hover:text-blue transition-all duration-300 cursor-pointer text-lg active:scale-90 hover:scale-110 shadow-sm backdrop-blur-md"
            title={t('potato.title')}
          >
            🥔
          </button>

          <div className="flex gap-1 relative z-[2001] bg-white/20 p-0.5 rounded-full border border-white/30 backdrop-blur-md">
            {(['vi', 'en', 'fr'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all duration-300 cursor-pointer border-none active:scale-90 ${
                  lang === l
                    ? 'bg-blue text-white shadow-[0_2px_10px_rgba(20,136,219,0.3)]'
                    : 'bg-transparent text-navy hover:text-blue hover:bg-white/30'
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

