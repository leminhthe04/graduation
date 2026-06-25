import { useEffect, useRef } from 'react'
import Confetti from './Confetti'
import { burstConfetti } from './Confetti'

export default function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const imgRef = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible')
      }),
      { threshold: 0.3 }
    )
    ;[titleRef, imgRef, subtitleRef].forEach(ref => {
      if (ref.current) observer.observe(ref.current)
    })
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="min-h-screen flex items-center justify-center text-center relative overflow-hidden pt-[70px]" id="hero">
      <Confetti active />

      <div className="absolute inset-0 bg-gradient-to-br from-blue/[0.05] to-navy/[0.05] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-10 px-6 mx-auto" style={{ maxWidth: 'var(--container-max)' }}>
        <div className="w-[200px] h-[200px] max-md:w-[160px] max-md:h-[160px] max-[480px]:w-[130px] max-[480px]:h-[130px] fade-up" ref={imgRef as any}>
          <div className="w-full h-full rounded-full border-4 border-blue overflow-hidden shadow-[0_0_40px_rgba(20,136,219,.3)] transition-transform duration-500 hover:scale-105 hover:-rotate-3">
            <img
              src="/hero-placeholder.jpg"
              alt="Tốt nghiệp"
              className="w-full h-full object-cover"
              id="hero-img"
            />
          </div>
        </div>

        <h1 className="text-[clamp(2.5rem,8vw,5rem)] font-black leading-[1.1] fade-up" ref={titleRef as any}>
          KHOAI{' '}
          <span className="text-navy">
            TỐT NGHIỆP
          </span>{' '}
          RỒI!
        </h1>

        <p className="text-lg text-gray-dark max-w-[500px] fade-up" ref={subtitleRef as any}>
          🎉 tới lúc khoai cúc khỏi cái trường này 🎉
        </p>

        <div className="flex gap-4 flex-wrap justify-center fade-up max-[480px]:flex-col max-[480px]:w-full">
          <button onClick={() => { scrollTo('checkin'); burstConfetti() }} className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold font-sans text-base cursor-pointer transition-all duration-300 bg-blue text-white hover:bg-navy hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(3,3,145,.3)] border-none">
            🎟 Check-in ngay
          </button>
          <button onClick={() => scrollTo('gallery')} className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold font-sans text-base cursor-pointer transition-all duration-300 bg-transparent text-blue border-2 border-blue hover:bg-blue hover:text-white hover:-translate-y-0.5">
            📸 Xem ảnh
          </button>
        </div>

        <div className="mt-8 animate-bounce-custom cursor-pointer text-gray-dark text-sm flex flex-col items-center gap-1" onClick={() => scrollTo('countdown')}>
          <span className="text-xl text-blue">↓</span>
        </div>
      </div>
    </section>
  )
}
