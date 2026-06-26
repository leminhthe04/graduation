import { doc, getDoc, setDoc, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from './config'

export interface TranslatableField {
  vi: string
  en?: string
  fr?: string
}

export interface EventSettings {
  date: string       // YYYY-MM-DD
  time: string       // HH:mm
  title: TranslatableField
  location: TranslatableField
  notes: TranslatableField
}

const DEFAULT: EventSettings = {
  date: '2026-08-15',
  time: '08:00',
  title: { vi: 'Lễ Tốt Nghiệp', en: '', fr: '' },
  location: { vi: 'Nhà hát lớn Hà Nội', en: '', fr: '' },
  notes: { vi: 'Hãy mang mã code để nhận quà bất ngờ! 🎁', en: '', fr: '' },
}

const EVENT_REF = doc(db, 'settings', 'event')
const ADMIN_REF = doc(db, 'settings', 'admin')

function toTranslatable(val: unknown): TranslatableField {
  if (val && typeof val === 'object' && 'vi' in (val as any)) {
    const t = val as any
    return { vi: t.vi || '', en: t.en, fr: t.fr }
  }
  if (typeof val === 'string') {
    return { vi: val || '', en: '', fr: '' }
  }
  return { vi: '', en: '', fr: '' }
}

function parseSettings(d: any): EventSettings {
  return {
    date: d.date || DEFAULT.date,
    time: d.time || DEFAULT.time,
    title: toTranslatable(d.title),
    location: toTranslatable(d.location),
    notes: toTranslatable(d.notes),
  }
}

function normalizeNewlines(s: string): string {
  return s.replace(/\\n/g, '\n')
}

export function getField(field: TranslatableField, lang: string): string {
  const val = lang === 'vi' ? field.vi : (field as any)[lang] || field.vi || ''
  return normalizeNewlines(val)
}

export function getEventDefault(): EventSettings {
  return {
    date: DEFAULT.date,
    time: DEFAULT.time,
    title: { ...DEFAULT.title },
    location: { ...DEFAULT.location },
    notes: { ...DEFAULT.notes },
  }
}

export async function getEventSettings(): Promise<EventSettings> {
  const snap = await getDoc(EVENT_REF)
  if (!snap.exists()) return getEventDefault()
  return parseSettings(snap.data())
}

export function onEventSettings(cb: (s: EventSettings) => void) {
  try {
    return onSnapshot(EVENT_REF, snap => {
      if (!snap.exists()) { cb(getEventDefault()); return }
      cb(parseSettings(snap.data()))
    })
  } catch {
    cb(getEventDefault())
    return () => {}
  }
}

export async function saveEventSettings(s: EventSettings) {
  await setDoc(EVENT_REF, { ...s, updatedAt: Timestamp.now() })
}

export function getEventDate(s: EventSettings): Date {
  return new Date(`${s.date}T${s.time}:00+07:00`)
}

// ── Hero image (stored in admin doc) ──

export async function getHeroImage(): Promise<string> {
  const snap = await getDoc(ADMIN_REF)
  return snap.exists() ? snap.data().heroImage || '' : ''
}

export function onHeroImage(cb: (url: string) => void) {
  return onSnapshot(ADMIN_REF, snap => {
    cb(snap.exists() ? snap.data().heroImage || '' : '')
  }, () => cb(''))
}

export async function saveHeroImage(url: string) {
  await setDoc(ADMIN_REF, { heroImage: url, updatedAt: Timestamp.now() }, { merge: true })
}

export async function clearOldHeroImage() {
  await setDoc(EVENT_REF, { heroImage: '' }, { merge: true })
}
