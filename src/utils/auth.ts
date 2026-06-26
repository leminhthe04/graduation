import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

const ADMIN_REF = doc(db, 'settings', 'admin')
const FALLBACK_HASH = '0da8b18c3649f907bfe2398bc736a9d69f41e316b979c0e7c98d3a511aa76182'

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyAdmin(password: string): Promise<boolean> {
  const snap = await getDoc(ADMIN_REF)
  const storedHash = snap.exists() ? snap.data().passwordHash : null

  const inputHash = await hashPassword(password)

  if (storedHash) {
    return inputHash === storedHash
  }

  // No hash in Firestore yet — check against fallback, then seed
  if (inputHash === FALLBACK_HASH) {
    await setDoc(ADMIN_REF, { passwordHash: inputHash })
    return true
  }

  return false
}

export async function updateAdminPassword(newPassword: string): Promise<void> {
  const passwordHash = await hashPassword(newPassword)
  await setDoc(ADMIN_REF, { passwordHash })
}
