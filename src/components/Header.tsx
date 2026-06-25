import { useState, useEffect } from 'react'

const sections = [
  { id: 'hero', label: 'Đầu' },
  { id: 'countdown', label: 'Đếm' },
  { id: 'gallery', label: 'Ảnh' },
  { id: 'checkin', label: 'Check-in' },
]

export default function Header({ onAdminClick }: { onAdminClick: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('hero')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActive(e.target.id)
        })
      },
      { rootMargin: '-50% 0px -50% 0px' }
    )
    sections.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
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
        <button onClick={() => scrollTo('hero')} className="text-xl font-black text-navy hover:text-blue transition-colors tracking-tight cursor-pointer bg-transparent border-none">
          🎓 GRAD
        </button>

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-1">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer border-none ${
                  active === s.id
                    ? 'bg-blue text-white'
                    : 'bg-transparent text-gray-dark hover:text-blue'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <button
            onClick={onAdminClick}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-transparent text-gray-dark hover:text-blue hover:bg-gray-100 transition-all duration-200 cursor-pointer border-none text-lg"
            title="Admin"
          >
            ⚙️
          </button>
        </div>
      </div>
    </header>
  )
}
