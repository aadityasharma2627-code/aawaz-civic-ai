// Sync service: flushes pending complaints to the backend in submission order.
// - Called automatically when the browser comes back online.
// - Can also be triggered manually (e.g. from the pending badge).
// - Successfully synced items are removed from the local queue.
// - Failures stop the run so nothing is skipped or lost.

import { getPendingComplaints, removePendingComplaint } from './queue'
import { createComplaint } from '../../api/complaints'

let syncing = false

export async function syncPendingComplaints() {
  if (syncing || !navigator.onLine) return { synced: 0, failed: 0 }
  syncing = true
  let synced = 0
  let failed = 0
  try {
    const pending = await getPendingComplaints()
    for (const item of pending) {
      try {
        await createComplaint(item.payload)
        await removePendingComplaint(item.localId)
        synced += 1
      } catch {
        failed += 1
        break // preserve order; retry the rest on the next pass
      }
    }
  } finally {
    syncing = false
  }
  return { synced, failed }
}

let started = false
export function startSyncListener() {
  if (started) return
  started = true
  window.addEventListener('online', () => {
    syncPendingComplaints()
  })
  // Also attempt a flush on cold start in case we are already online.
  if (navigator.onLine) syncPendingComplaints()
}
