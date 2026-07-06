import { useState, useEffect, useRef } from 'react'
import { useI18n } from '../i18n'
import { GraduationCap, Timer, Ticket, Camera } from 'lucide-react'

const sections = [
  { id: 'hero', key: 'nav.hero', icon: GraduationCap },
  { id: 'countdown', key: 'nav.countdown', icon: Timer },
  { id: 'checkin', key: 'nav.checkin', icon: Ticket },
  { id: 'gallery', key: 'nav.gallery', icon: Camera },
]

export default function LeftNav() {
  const { t } = useI18n()
  const [active, setActive] = useState('hero')
  const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      let current = sections[0].id
      for (const s of sections) {
        const el = document.getElementById(s.id)
        if (el) {
          const rect = el.getBoundingClientRect()
          // If the top of the section is near or above the center of screen
          if (rect.top <= window.innerHeight / 2) {
            current = s.id
          }
        }
      }
      setActive(current)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const activeIndex = sections.findIndex(s => s.id === active)

  // Direct mouse wheel scrolling on the left nav scrolls sections
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (wheelTimeoutRef.current) return

    const direction = e.deltaY > 0 ? 1 : -1
    const nextIndex = Math.max(0, Math.min(sections.length - 1, activeIndex + direction))

    if (nextIndex !== activeIndex) {
      scrollTo(sections[nextIndex].id)
      wheelTimeoutRef.current = setTimeout(() => {
        wheelTimeoutRef.current = null
      }, 800)
    }
  }

  return (
    <div 
      className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center"
      onWheel={handleWheel}
    >
      {/* 3D Wheel Container */}
      <div className="glass-panel w-18 h-[260px] rounded-full flex flex-col justify-center items-center relative overflow-hidden wheel-container py-4 shadow-[0_12px_40px_rgba(20,136,219,0.15)] border border-white/40 hover-glow">
        
        {/* Stationary Highlight Capsule (Liquid Glass Bubble) */}
        <div className="absolute w-14 h-14 bg-blue/15 backdrop-blur-[2px] rounded-full border border-blue/30 shadow-[0_0_15px_rgba(20,136,219,0.15)] pointer-events-none transition-all duration-500 ease-out top-1/2 -translate-y-1/2" />
        
        {/* Sliding Wheel List */}
        <div 
          className="flex flex-col gap-5 transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1)"
          style={{ 
            transform: `translateY(${(1.5 - activeIndex) * 76}px)` 
          }}
        >
          {sections.map((s, idx) => {
            const Icon = s.icon
            const dist = idx - activeIndex
            const isActive = idx === activeIndex

            return (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`w-14 h-14 flex flex-col items-center justify-center cursor-pointer border-none bg-transparent rounded-2xl transition-all duration-500 ease-out select-none group wheel-item relative`}
                style={{
                  transform: `rotateX(${dist * 25}deg) scale(${isActive ? 1.15 : 0.85 - Math.abs(dist) * 0.08})`,
                  opacity: isActive ? 1 : 0.5 - Math.abs(dist) * 0.08,
                  transformStyle: 'preserve-3d',
                }}
                title={t(s.key)}
              >
                <Icon 
                  size={isActive ? 22 : 18} 
                  className={`transition-colors duration-300 ${
                    isActive ? 'text-blue' : 'text-navy/70 group-hover:text-blue'
                  }`} 
                />
                
                {/* Floating tooltip on hover */}
                <div className="absolute left-18 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/50 text-[11px] font-bold text-navy shadow-lg opacity-0 pointer-events-none translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap">
                  {t(s.key)}
                </div>
              </button>
            )
          })}
        </div>
      </div>
      
    </div>
  )
}
