import { STATUSES, STATUS_LABELS } from '../data/labels'
import { formatDateTime } from '../utils/format'

// Vertical timeline: Reported -> Assigned -> Resolved.
// Accepts an optional history array [{ status, at }] from the backend;
// falls back to a single current status.

export default function StatusTimeline({ status, history = [] }) {
  const currentIndex = Math.max(0, STATUSES.indexOf(status))

  const timeFor = (s) => {
    const entry = history.find((h) => h.status === s)
    return entry ? formatDateTime(entry.at || entry.createdAt) : null
  }

  return (
    <ol className="timeline" aria-label="Complaint status">
      {STATUSES.map((s, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? (s === 'RESOLVED' ? 'done' : 'current') : 'pending'
        const time = timeFor(s)
        return (
          <li key={s} className={state}>
            <span className="dot" aria-hidden="true" />
            <div className="t-label">{STATUS_LABELS[s]}</div>
            <div className="t-time">{time || (state === 'pending' ? 'Pending' : '')}</div>
          </li>
        )
      })}
    </ol>
  )
}
