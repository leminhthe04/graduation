import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase/config'
import { onEventSettings, saveEventSettings, getEventDefault } from '../firebase/event'
import type { EventSettings } from '../firebase/event'

interface Checkin {
  id: string
  nickname: string
  email: string
  code: string
  confirmed: boolean
}

interface Photo {
  id: string
  url: string
  caption: string
}

interface Code {
  id: string
  code: string
  used: boolean
  assignedTo: string | null
  email: string | null
}

type Tab = 'checkins' | 'photos' | 'codes' | 'event'

const btn = 'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold font-sans text-sm cursor-pointer transition-all duration-300'
const btnPrimary = `${btn} bg-blue text-white hover:bg-navy`
const btnOutline = `${btn} bg-transparent text-blue border-2 border-blue hover:bg-blue hover:text-white`
const btnDanger = `${btn} bg-[#e74c3c] text-white hover:bg-[#c0392b]`
const inputCls = 'px-4 py-2.5 border-2 border-gray-200 rounded-xl font-sans text-sm outline-none transition-all duration-300 focus:border-blue focus:shadow-[0_0_0_4px_rgba(20,136,219,.1)] bg-white'

export default function AdminModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [authed, setAuthed] = useState(false)
  const [pass, setPass] = useState('')
  const [tab, setTab] = useState<Tab>('checkins')
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [codes, setCodes] = useState<Code[]>([])
  const [caption, setCaption] = useState('')
  const [bulkCount, setBulkCount] = useState(5)
  const [eventSettings, setEventSettings] = useState<EventSettings>(getEventDefault())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!authed) return
    const unsub1 = onSnapshot(
      query(collection(db, 'checkins'), orderBy('timestamp', 'desc')),
      snap => setCheckins(snap.docs.map(d => ({ id: d.id, ...d.data() } as Checkin)))
    )
    const unsub2 = onSnapshot(
      query(collection(db, 'photos'), orderBy('uploadedAt', 'desc')),
      snap => setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Photo)))
    )
    const unsub3 = onSnapshot(
      query(collection(db, 'secret_codes'), orderBy('code')),
      snap => setCodes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Code)))
    )
    const unsub4 = onEventSettings(s => setEventSettings(s))
    return () => { unsub1(); unsub2(); unsub3(); unsub4() }
  }, [authed])

  useEffect(() => {
    if (!open) { setAuthed(false); setPass('') }
  }, [open])

  const handleLogin = () => {
    if (pass === 'grad2026admin') setAuthed(true)
    else alert('Sai mật khẩu!')
  }

  const handleConfirm = async (id: string, current: boolean) => {
    await updateDoc(doc(db, 'checkins', id), { confirmed: !current })
  }

  const handleUpload = async () => {
    const input = document.getElementById('admin-photo-input') as HTMLInputElement
    const file = input?.files?.[0]
    if (!file || !caption.trim()) return
    const storageRef = ref(storage, `photos/${Date.now()}_${file.name}`)
    await uploadBytes(storageRef, file)
    const url = await getDownloadURL(storageRef)
    await addDoc(collection(db, 'photos'), { url, caption: caption.trim(), uploadedAt: new Date() })
    setCaption('')
    input.value = ''
  }

  const handleDeletePhoto = async (id: string, url: string) => {
    await deleteDoc(doc(db, 'photos', id))
    try {
      const storageRef = ref(storage, url)
      await deleteObject(storageRef)
    } catch {}
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = 'GRAD-'
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
    return code
  }

  const handleGenerateCodes = async () => {
    for (let i = 0; i < bulkCount; i++) {
      await addDoc(collection(db, 'secret_codes'), {
        code: generateCode(),
        used: false,
        assignedTo: null,
        email: null,
        createdAt: Timestamp.now(),
      })
    }
    alert(`Đã tạo ${bulkCount} mã code mới!`)
  }

  const handleSaveEvent = async () => {
    setSaving(true)
    await saveEventSettings(eventSettings)
    setSaving(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-[900px] max-h-[85vh] overflow-y-auto animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 pb-0">
          <h2 className="text-xl font-black text-navy">⚙️ Admin</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors border-none cursor-pointer text-lg">
            ✕
          </button>
        </div>

        {!authed ? (
          <div className="p-6 text-center">
            <div className="mt-4">
              <input
                type="password"
                placeholder="Mật khẩu admin"
                value={pass}
                onChange={e => setPass(e.target.value)}
                className={`${inputCls} max-w-[280px] mb-4`}
              />
              <br />
              <button className={btnPrimary} onClick={handleLogin}>Đăng nhập</button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex gap-2 justify-center mb-6 flex-wrap">
              <button className={`${tab === 'event' ? btnPrimary : btnOutline}`} onClick={() => setTab('event')}>
                📋 Sự kiện
              </button>
              <button className={`${tab === 'checkins' ? btnPrimary : btnOutline}`} onClick={() => setTab('checkins')}>
                ✅ Check-ins ({checkins.length})
              </button>
              <button className={`${tab === 'photos' ? btnPrimary : btnOutline}`} onClick={() => setTab('photos')}>
                📸 Ảnh ({photos.length})
              </button>
              <button className={`${tab === 'codes' ? btnPrimary : btnOutline}`} onClick={() => setTab('codes')}>
                🔑 Codes ({codes.length})
              </button>
            </div>

            {tab === 'event' && (
              <div className="max-w-lg mx-auto space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Tên sự kiện</label>
                  <input value={eventSettings.title} onChange={e => setEventSettings(p => ({ ...p, title: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Ngày</label>
                  <input type="date" value={eventSettings.date} onChange={e => setEventSettings(p => ({ ...p, date: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Giờ</label>
                  <input type="time" value={eventSettings.time} onChange={e => setEventSettings(p => ({ ...p, time: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Địa điểm</label>
                  <input value={eventSettings.location} onChange={e => setEventSettings(p => ({ ...p, location: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Ghi chú / Lưu ý</label>
                  <textarea value={eventSettings.notes} onChange={e => setEventSettings(p => ({ ...p, notes: e.target.value }))} className={`${inputCls} w-full resize-none`} rows={3} />
                </div>
                <div className="text-center pt-2">
                  <button className={btnPrimary} onClick={handleSaveEvent} disabled={saving}>
                    {saving ? '💾 Đang lưu...' : '💾 Lưu thông tin'}
                  </button>
                </div>
              </div>
            )}

            {tab === 'checkins' && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-light">
                      <th className="p-3 text-left font-bold text-navy border-b border-gray-200">Nickname</th>
                      <th className="p-3 text-left font-bold text-navy border-b border-gray-200">Email</th>
                      <th className="p-3 text-left font-bold text-navy border-b border-gray-200">Code</th>
                      <th className="p-3 text-left font-bold text-navy border-b border-gray-200">Confirmed</th>
                      <th className="p-3 text-left font-bold text-navy border-b border-gray-200">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkins.map(c => (
                      <tr key={c.id} className="hover:bg-blue/[0.04]">
                        <td className="p-3 border-b border-gray-100">{c.nickname}</td>
                        <td className="p-3 border-b border-gray-100">{c.email}</td>
                        <td className="p-3 border-b border-gray-100 font-mono font-bold tracking-[1px] text-navy">{c.code}</td>
                        <td className="p-3 border-b border-gray-100">{c.confirmed ? '✅' : '❌'}</td>
                        <td className="p-3 border-b border-gray-100">
                          <button className={btnOutline} style={{ padding: '.3rem .7rem', fontSize: '.8rem' }} onClick={() => handleConfirm(c.id, c.confirmed)}>
                            {c.confirmed ? 'Hoàn tác' : 'Xác nhận'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'photos' && (
              <div>
                <div className="text-center mb-6">
                  <input id="admin-photo-input" type="file" accept="image/*" className={`${inputCls} mr-2 mb-2`} />
                  <input type="text" placeholder="Chú thích..." value={caption} onChange={e => setCaption(e.target.value)} className={`${inputCls} mr-2 mb-2`} />
                  <button className={btnPrimary} onClick={handleUpload}>📤 Upload</button>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
                  {photos.map(p => (
                    <div key={p.id} className="relative rounded-xl overflow-hidden aspect-square shadow-md group">
                      <img src={p.url} alt={p.caption} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white text-xs font-semibold">
                        <span>{p.caption}</span>
                        <button className={btnDanger} style={{ padding: '.2rem .5rem', fontSize: '.75rem', marginTop: '.3rem' }} onClick={() => handleDeletePhoto(p.id, p.url)}>🗑 Xóa</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'codes' && (
              <div>
                <div className="text-center mb-6">
                  <label className="mr-2 text-sm">Số lượng mã: </label>
                  <input type="number" min={1} max={100} value={bulkCount} onChange={e => setBulkCount(Number(e.target.value))} className={`${inputCls} w-20 inline mx-2`} />
                  <button className={btnPrimary} onClick={handleGenerateCodes}>🎲 Tạo mã</button>
                </div>
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-light">
                        <th className="p-3 text-left font-bold text-navy border-b border-gray-200">Code</th>
                        <th className="p-3 text-left font-bold text-navy border-b border-gray-200">Status</th>
                        <th className="p-3 text-left font-bold text-navy border-b border-gray-200">Assigned To</th>
                        <th className="p-3 text-left font-bold text-navy border-b border-gray-200">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map(c => (
                        <tr key={c.id} className={`hover:bg-blue/[0.04] ${c.used ? 'opacity-50' : ''}`}>
                          <td className="p-3 border-b border-gray-100 font-mono font-bold tracking-[1px] text-navy">{c.code}</td>
                          <td className="p-3 border-b border-gray-100">{c.used ? '🔴 Used' : '🟢 Available'}</td>
                          <td className="p-3 border-b border-gray-100">{c.assignedTo || '-'}</td>
                          <td className="p-3 border-b border-gray-100">{c.email || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
