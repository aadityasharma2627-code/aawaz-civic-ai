const CLASS = { HIGH: 'badge-high', MEDIUM: 'badge-medium', LOW: 'badge-low' }

export default function PriorityBadge({ priority }) {
  if (!priority) return <span className="badge badge-neutral">—</span>
  return <span className={`badge ${CLASS[priority] || 'badge-neutral'}`}>{priority}</span>
}
