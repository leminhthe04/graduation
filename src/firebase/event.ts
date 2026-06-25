import { doc, getDoc, setDoc, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from './config'

export interface EventSettings {
  date: string       // YYYY-MM-DD
  time: string       // HH:mm
  location: string
  notes: string
  title: string
}

const DEFAULT: EventSettings = {
  date: '2026-08-15',
  time: '08:00',
  location: 'Nhà hát lớn Hà Nội',
  notes: 'Hãy mang mã code để nhận quà bất ngờ! 🎁',
  title: 'Lễ Tốt Nghiệp',
}

const REF = doc(db, 'settings', 'event')

export function getEventDefault(): EventSettings {
  return { ...DEFAULT }
}

export async function getEventSettings(): Promise<EventSettings> {
  const snap = await getDoc(REF)
  if (!snap.exists()) return { ...DEFAULT }
  const d = snap.data()
  return {
    date: d.date || DEFAULT.date,
    time: d.time || DEFAULT.time,
    location: d.location || DEFAULT.location,
    notes: d.notes || DEFAULT.notes,
    title: d.title || DEFAULT.title,
  }
}

export function onEventSettings(cb: (s: EventSettings) => void) {
  try {
    return onSnapshot(REF, snap => {
      if (!snap.exists()) { cb({ ...DEFAULT }); return }
      const d = snap.data()
      cb({
        date: d.date || DEFAULT.date,
        time: d.time || DEFAULT.time,
        location: d.location || DEFAULT.location,
        notes: d.notes || DEFAULT.notes,
        title: d.title || DEFAULT.title,
      })
    })
  } catch {
    cb({ ...DEFAULT })
    return () => {}
  }
}

export async function saveEventSettings(s: EventSettings) {
  await setDoc(REF, { ...s, updatedAt: Timestamp.now() })
}

export function getEventDate(s: EventSettings): Date {
  return new Date(`${s.date}T${s.time}:00+07:00`)
}
