// Offline submission queue backed by IndexedDB.
// Used ONLY for complaints that could not reach the server yet.

import { db } from './db'

const EVENT = 'awaaz:pending-changed'

function notify() {
  window.dispatchEvent(new Event(EVENT))
}

export async function savePendingComplaint(payload) {
  const item = {
    localId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    payload,
    createdAt: Date.now(),
  }
  await db.put(item)
  notify()
  return item.localId
}

export async function getPendingComplaints() {
  try {
    return await db.all()
  } catch {
    return []
  }
}

export async function getPendingCount() {
  const items = await getPendingComplaints()
  return items.length
}

export async function removePendingComplaint(localId) {
  await db.delete(localId)
  notify()
}

export function onPendingChanged(callback) {
  window.addEventListener(EVENT, callback)
  return () => window.removeEventListener(EVENT, callback)
}
