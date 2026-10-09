import { usePendingCount } from '../hooks/usePendingCount'
import { useOnline } from '../hooks/useOnline'
import { syncPendingComplaints } from '../services/offline/sync'

// Shows how many complaints are waiting on this device; tapping syncs now.
export default function PendingSyncBadge() {
  const count = usePendingCount()
  const online = useOnline()

  if (count === 0) return null

  const handleSync = async () => {
    if (online) await syncPendingComplaints()
  }

  return (
    <button
      type="button"
      className="pending-pill"
      onClick={handleSync}
      disabled={!online}
      title={online ? 'Tap to send saved complaints now' : 'Will send automatically when back online'}
    >
      {count} saved {count === 1 ? 'complaint' : 'complaints'}
      {online ? ' · sync' : ' · offline'}
    </button>
  )
}
