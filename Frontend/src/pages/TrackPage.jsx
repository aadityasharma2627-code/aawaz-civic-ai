import { useState } from 'react'
import { getComplaint } from '../api/complaints'
import { ApiError } from '../api/client'
import { friendlyError } from '../utils/friendlyError'
import ComplaintDetails from '../components/ComplaintDetails'
import StatusTimeline from '../components/StatusTimeline'
import Loading from '../components/Loading'
import { usePendingCount } from '../hooks/usePendingCount'
import { usePendingComplaints } from '../hooks/usePendingComplaints'
import { syncPendingComplaints } from '../services/offline/sync'
import { useOnline } from '../hooks/useOnline'

export default function TrackPage() {
  const [complaintId, setComplaintId] = useState('')
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const pendingCount = usePendingCount()
  const pendingItems = usePendingComplaints()
  const online = useOnline()

  const track = async (e) => {
    e.preventDefault()
    const id = complaintId.trim().toUpperCase()
    if (!id) {
      setError('Please enter a complaint ID, e.g. AWZ-0001.')
      return
    }
    setError('')
    setComplaint(null)
    setLoading(true)
    try {
      const data = await getComplaint(id)
      // Backend may return { complaint: {...} } or the complaint directly.
      setComplaint(data?.complaint || data)
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        setError('You are offline, so we cannot fetch the latest status right now. Please try again when you are back online.')
      } else {
        setError(friendlyError(err))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 className="page-title">Track Complaint</h1>
      <p className="page-sub">Enter your complaint ID to see the latest status.</p>

      <form onSubmit={track} className="stack-row" noValidate>
        <input
          type="text"
          value={complaintId}
          onChange={(e) => setComplaintId(e.target.value)}
          placeholder="AWZ-0001"
          aria-label="Complaint ID"
          style={{ flex: 1, minWidth: 200 }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Checking…' : 'Track'}
        </button>
      </form>

      {error && <div className="error-box" role="alert" style={{ marginTop: 16 }}>{error}</div>}
      {loading && <Loading label="Fetching complaint…" />}

      {complaint && (
        <div className="card" style={{ marginTop: 20 }}>
          <ComplaintDetails complaint={complaint} />
          <StatusTimeline status={complaint.status} history={complaint.status_history} />
        </div>
      )}

      {pendingCount > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <h2 className="section" style={{ marginBottom: 8 }}>Saved on this device</h2>
          <p className="muted" style={{ fontSize: '0.9rem' }}>
            {pendingCount} {pendingCount === 1 ? 'complaint' : 'complaints'} waiting to be sent
            {online && (
              <> · <button className="btn btn-outline btn-sm" onClick={() => syncPendingComplaints()}>Send now</button></>
            )}
          </p>
          <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {pendingItems.map((item) => (
              <li key={item.localId} className="info-box" style={{ marginBottom: 0 }}>
                <strong>{item.payload.sector}</strong> — {item.payload.text.slice(0, 90)}
                {item.payload.text.length > 90 ? '…' : ''}
                <span className="muted" style={{ display: 'block', fontSize: '0.8rem', marginTop: 4 }}>
                  Not yet submitted to server
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
