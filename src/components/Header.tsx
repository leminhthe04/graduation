import { useState, useEffect, useRef } from 'react'
import { useI18n } from '../i18n'
import type { Lang } from '../i18n'

export default function Header({ onAdminClick }: { onAdminClick: () => void }) {
  const { t, lang, setLang, LANG_LABELS } = useI18n()
  const [scrolled, setScrolled] = useState(false)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const langRef = useRef<HTMLDivElement>(null)
  const langBtnsRef = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const idx = (['vi', 'en', 'fr'] as Lang[]).indexOf(lang)
    const btn = langBtnsRef.current[idx]
    const container = langRef.current
    if (btn && container) {
      const cr = container.getBoundingClientRect()
      const br = btn.getBoundingClientRect()
      setIndicatorStyle({ left: br.left - cr.left, width: br.width })
    }
  }, [lang])

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
          className="text-lg font-black text-navy hover:text-blue transition-all duration-300 tracking-tight cursor-pointer bg-transparent border-none hover-lift"
        >
          {t('brand')}
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={onAdminClick}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 border border-white/30 text-gray-dark hover:text-blue transition-all duration-300 cursor-pointer text-lg active:scale-90 hover:scale-110 shadow-sm backdrop-blur-md hover-jello"
            title={t('potato.title')}
          >
            🥔
          </button>

          <div ref={langRef} className="relative z-[2001] bg-white/20 rounded-full border border-white/30 backdrop-blur-md">
            {/* Sliding indicator */}
            <div
              className="absolute top-0.5 bottom-0.5 rounded-full bg-blue shadow-[0_2px_10px_rgba(20,136,219,0.3)] transition-all duration-400 ease-out"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
              }}
            />
            <div className="flex gap-0.5 p-0.5 relative">
              {(['vi', 'en', 'fr'] as Lang[]).map((l, i) => (
                <button
                  key={l}
                  ref={el => { langBtnsRef.current[i] = el }}
                  onClick={() => setLang(l)}
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all duration-300 cursor-pointer border-none ${
                    lang === l
                      ? 'text-white scale-100'
                      : 'text-navy/60 hover:text-blue scale-90 hover:scale-100'
                  }`}
                >
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

