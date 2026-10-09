import { STATUS_LABELS } from '../data/labels'

const CLASS = {
  REPORTED: 'badge-neutral',
  ASSIGNED: 'badge-accent',
  RESOLVED: 'badge-low',
}

export default function StatusBadge({ status }) {
  if (!status) return <span className="badge badge-neutral">—</span>
  return <span className={`badge ${CLASS[status] || 'badge-neutral'}`}>{STATUS_LABELS[status] || status}</span>
}
