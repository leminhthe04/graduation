import { useState, useEffect, useRef } from 'react'
import { collection, query, where, limit, getDocs, updateDoc, doc, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { onEventSettings, getEventSettings, getEventDefault } from '../firebase/event'
import type { EventSettings } from '../firebase/event'
import emailjs from '@emailjs/browser'
import { burstConfetti } from './Confetti'

export default function CheckinForm() {
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ code: string; settings: EventSettings } | null>(null)
  const [error, setError] = useState('')
  const [settings, setSettings] = useState<EventSettings>(getEventDefault())
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = onEventSettings(s => setSettings(s))
    return unsub
  }, [])

  useEffect(() => {
    if (!formRef.current) return
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible')
      }),
      { threshold: 0.2 }
    )
    const children = formRef.current.querySelectorAll('.fade-up')
    children.forEach(c => observer.observe(c))
    return () => observer.disconnect()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim() || !email.trim()) {
      setError('Vui lòng điền đầy đủ thông tin!')
      return
    }
    setLoading(true)
    setError('')

    try {
      const q = query(
        collection(db, 'secret_codes'),
        where('used', '==', false),
        limit(1)
      )
      const snap = await getDocs(q)

      if (snap.empty) {
        setError('Hết code rồi! Liên hệ admin để được cấp thêm.')
        setLoading(false)
        return
      }

      const codeDoc = snap.docs[0]
      const codeData = codeDoc.data()
      const code = codeData.code

      await updateDoc(doc(db, 'secret_codes', codeDoc.id), {
        used: true,
        assignedTo: nickname.trim(),
        email: email.trim(),
      })

      await addDoc(collection(db, 'checkins'), {
        nickname: nickname.trim(),
        email: email.trim(),
        code,
        confirmed: false,
        timestamp: Timestamp.now(),
      })

      const evt = settings || await getEventSettings()

      try {
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            to_email: email.trim(),
            to_name: nickname.trim(),
            secret_code: code,
            event_date: evt.date,
            event_time: evt.time,
            event_location: evt.location,
          },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        )
      } catch {}

      setResult({ code, settings: evt })
      burstConfetti()
    } catch (err) {
      setError('Có lỗi xảy ra: ' + (err as any).message)
    }
    setLoading(false)
  }

  if (result) {
    return (
      <section className="py-20" ref={formRef}>
        <div className="px-6 mx-auto text-center" style={{ maxWidth: 'var(--container-max)' }}>
          <div className="max-w-[520px] mx-auto bg-white rounded-3xl p-12 max-md:p-8 shadow-[0_12px_60px_rgba(20,136,219,.15)] border-2 border-blue fade-in visible">
            <div className="text-6xl mb-4 animate-pop-in">🎉</div>
            <h2 className="text-2xl font-black mb-4">Đăng ký thành công!</h2>
            <p className="mb-4">Mã bí mật của bạn là:</p>
            <div className="text-3xl font-black tracking-[4px] text-navy bg-gray-light p-4 rounded-xl my-4 font-mono select-all">
              {result.code}
            </div>
            <p className="text-gray-dark text-sm leading-relaxed">
              📧 Mã đã được gửi đến email của bạn.<br />
              Hãy mang mã này đến <strong>{result.settings.title}</strong> để nhận quà bất ngờ nhé! 🎁
            </p>
            <div className="mt-6 pt-6 border-t border-gray-200 font-semibold text-blue space-y-1">
              <p>📅 {result.settings.date} • ⏰ {result.settings.time}</p>
              <p>📍 {result.settings.location}</p>
              {result.settings.notes && <p className="text-sm text-gray-dark">📌 {result.settings.notes}</p>}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20" id="checkin" ref={formRef}>
      <div className="px-6 mx-auto" style={{ maxWidth: 'var(--container-max)' }}>
        <h2 className="text-[clamp(1.75rem,5vw,2.5rem)] font-black text-center text-navy mb-2 fade-up">
          🎟 Check-in
        </h2>
        <p className="text-center text-gray-dark text-lg mb-12 fade-up">
          nhận code bí mật - tới check-in để nhận quà của khoaiii!
        </p>

        {settings && (
          <div className="text-center mb-8 fade-up">
            <div className="inline-flex flex-wrap gap-4 items-center justify-center bg-gray-light rounded-2xl px-6 py-3 text-sm">
              <span>📅 {settings.date} • {settings.time}</span>
              <span className="hidden sm:inline w-px h-4 bg-gray-300" />
              <span>📍 {settings.location}</span>
            </div>
          </div>
        )}

        <form className="max-w-[480px] mx-auto bg-white rounded-2xl p-10 max-md:p-6 shadow-[0_8px_40px_rgba(0,0,0,.06)] border border-black/[0.04] fade-up" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-[#fee] text-[#c00] p-3 rounded-xl mb-4 font-medium text-sm">{error}</div>
          )}

          <div className="mb-6">
            <label className="block mb-2 font-semibold text-sm">nickname</label>
            <input
              type="text"
              placeholder="củ khoai tây khổng lồ"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-sans text-base outline-none transition-all duration-300 bg-white focus:border-blue focus:shadow-[0_0_0_4px_rgba(20,136,219,.1)]"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-semibold text-sm">email nhận code</label>
            <input
              type="email"
              placeholder="hoangphungoctuong@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-sans text-base outline-none transition-all duration-300 bg-white focus:border-blue focus:shadow-[0_0_0_4px_rgba(20,136,219,.1)]"
            />
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-semibold font-sans text-base cursor-pointer transition-all duration-300 bg-blue text-white hover:bg-navy hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(3,3,145,.3)] disabled:opacity-50"
            disabled={loading}
          >
            {loading ? '⏳ Đang xử lý...' : '🎟 Nhận code'}
          </button>

          <p className="mt-4 text-xs text-gray-dark text-center">
            🔒 Thông tin của bạn được bảo mật. Code sẽ được gửi qua email.
          </p>
        </form>
      </div>
    </section>
  )
}
