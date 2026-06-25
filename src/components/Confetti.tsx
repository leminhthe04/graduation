import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

export default function Confetti({ active = false }: { active?: boolean }) {
  const fired = useRef(false)

  useEffect(() => {
    if (active && !fired.current) {
      fired.current = true
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#1488DB', '#030391', '#ffd700'],
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#1488DB', '#030391', '#ffd700'],
        })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
    }
  }, [active])

  return null
}

export function burstConfetti() {
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.6 },
    colors: ['#1488DB', '#030391', '#ffffff', '#ffd700'],
  })
}
