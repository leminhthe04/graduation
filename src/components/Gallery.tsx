import { useState, useEffect, useRef } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

interface Photo {
  id: string
  url: string
  caption: string
}

export default function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selected, setSelected] = useState<Photo | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = query(collection(db, 'photos'), orderBy('uploadedAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Photo)))
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!gridRef.current) return
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible')
      }),
      { threshold: 0.1 }
    )
    const children = gridRef.current.querySelectorAll('.fade-up')
    children.forEach(c => observer.observe(c))
    return () => observer.disconnect()
  }, [photos])

  return (
    <section className="py-20" id="gallery">
      <div className="px-6 mx-auto" style={{ maxWidth: 'var(--container-max)' }}>
        <h2 className="text-[clamp(1.75rem,5vw,2.5rem)] font-black text-center text-navy mb-2 fade-up">
          📸 Khoảnh Khắc Tốt Nghiệp
        </h2>
        <p className="text-center text-gray-dark text-lg mb-12 fade-up">Những kỷ niệm không thể nào quên</p>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5 max-md:gap-3" ref={gridRef}>
          {photos.length === 0 && (
            <p className="text-center col-span-full text-gray-dark">
              Chưa có ảnh nào.
            </p>
          )}
          {photos.map(p => (
            <div
              key={p.id}
              className="relative rounded-2xl overflow-hidden cursor-pointer aspect-square shadow-md transition-all duration-400 hover:scale-103 hover:shadow-[0_8px_32px_rgba(20,136,219,.2)] group fade-up"
              onClick={() => setSelected(p)}
            >
              <img src={p.url} alt={p.caption} loading="lazy" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110" />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span>{p.caption}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[2000] bg-black/80 flex items-center justify-center p-8 animate-fade-in" onClick={() => setSelected(null)}>
          <div className="max-w-[800px] w-full bg-white rounded-2xl overflow-hidden relative animate-scale-in" onClick={e => e.stopPropagation()}>
            <button
              className="absolute top-3 right-3 bg-black/50 text-white border-none rounded-full w-9 h-9 text-lg cursor-pointer flex items-center justify-center transition-colors hover:bg-black/80"
              onClick={() => setSelected(null)}
            >
              ✕
            </button>
            <img src={selected.url} alt={selected.caption} className="w-full max-h-[70vh] object-contain" />
            <p className="px-6 py-4 font-semibold text-center">{selected.caption}</p>
          </div>
        </div>
      )}
    </section>
  )
}
