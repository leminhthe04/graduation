import { useState, useEffect } from 'react'
import Lenis from 'lenis'
import { I18nProvider } from './i18n'
import Header from './components/Header'
import LeftNav from './components/LeftNav'
import Hero from './components/Hero'
import Countdown from './components/Countdown'
import Gallery from './components/Gallery'
import CheckinForm from './components/CheckinForm'
import AdminModal from './components/AdminModal'
import Footer from './components/Footer'

export default function App() {
  const [adminOpen, setAdminOpen] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })

    lenis.on('scroll', (e: { progress: number }) => {
      setProgress(Math.min(Math.max(e.progress, 0), 1))
    })

    let rafId: number
    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  useEffect(() => {
    const revealSelectors = [
      '.fade-up', '.slide-up', '.slide-left', '.slide-right',
      '.scale-reveal', '.zoom-reveal', '.fade-in', '.stagger-children',
      '.reveal-clip', '.stagger-reveal',
      '.rotate-reveal', '.rotate-reveal-right', '.blur-reveal',
      '.flip-x', '.flip-y', '.skew-left', '.skew-right',
      '.wipe-down', '.wipe-right', '.wipe-center-v', '.wipe-center-h',
      '.slide-diagonal', '.slide-diagonal-right',
      '.bounce-reveal', '.elastic-reveal',
      '.expand-width', '.expand-height',
      '.grow-line', '.grow-line-center',
      '.count-up',
      '.img-grayscale-scroll', '.img-blur-scroll',
    ].join(', ')

    const exitSelectors = [
      '.fade-out-up', '.fade-out-scale',
      '.slide-out-left', '.slide-out-right',
    ].join(', ')

    const revealObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
          } else {
            e.target.classList.remove('visible')
          }
        }),
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    )

    const exitObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) {
            e.target.classList.add('exit')
          } else {
            e.target.classList.remove('exit')
          }
        }),
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    )

    const observedReveal = new Set<Element>()
    const observedExit = new Set<Element>()

    function observeAll() {
      document.querySelectorAll(revealSelectors).forEach((el) => {
        if (!observedReveal.has(el)) {
          observedReveal.add(el)
          revealObserver.observe(el)
        }
      })
      document.querySelectorAll(exitSelectors).forEach((el) => {
        if (!observedExit.has(el)) {
          observedExit.add(el)
          exitObserver.observe(el)
        }
      })
    }

    observeAll()

    const mutationObserver = new MutationObserver(() => observeAll())
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    const rafId = requestAnimationFrame(() => observeAll())

    return () => {
      revealObserver.disconnect()
      exitObserver.disconnect()
      mutationObserver.disconnect()
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <I18nProvider>
      <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] pointer-events-none">
        <div className="h-full bg-linear-to-r from-blue to-navy transition-all duration-150 ease-out" style={{ width: `${progress * 100}%` }} />
      </div>

      <Header onAdminClick={() => setAdminOpen(true)} />
      <LeftNav />
      <main>
        <Hero />

        {/* Section divider */}
        <div className="relative py-16 md:py-20 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-px h-full bg-linear-to-b from-transparent via-blue/20 to-transparent grow-line" />
          </div>
          <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full glass-panel flex items-center justify-center animate-float shadow-[0_0_30px_rgba(20,136,219,0.1)] hover-rotate">
            <span className="text-2xl md:text-3xl">⏳</span>
          </div>
        </div>

        <Countdown />

        {/* Section divider */}
        <div className="relative py-16 md:py-20 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-px h-full bg-linear-to-b from-transparent via-blue/20 to-transparent grow-line" />
          </div>
          <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full glass-panel flex items-center justify-center animate-float shadow-[0_0_30px_rgba(20,136,219,0.1)] hover-rotate" style={{ animationDelay: '-1s' }}>
            <span className="text-2xl md:text-3xl">🎟</span>
          </div>
        </div>

        <CheckinForm />

        {/* Section divider */}
        <div className="relative py-16 md:py-20 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-px h-full bg-linear-to-b from-transparent via-blue/20 to-transparent grow-line" />
          </div>
          <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full glass-panel flex items-center justify-center animate-float shadow-[0_0_30px_rgba(20,136,219,0.1)] hover-rotate" style={{ animationDelay: '-2s' }}>
            <span className="text-2xl md:text-3xl">📸</span>
          </div>
        </div>

        <Gallery />
      </main>
      <Footer />
      <AdminModal open={adminOpen} onClose={() => setAdminOpen(false)} />
    </I18nProvider>
  )
}