import { categoryLabel } from '../data/labels'
import { formatDateTime } from '../utils/format'
import PriorityBadge from './PriorityBadge'
import StatusBadge from './StatusBadge'

// Reusable read-only complaint summary used by tracking + success pages.
export default function ComplaintDetails({ complaint }) {
  if (!complaint) return null
  return (
    <div>
      <div className="detail-grid">
        <div className="detail-item">
          <div className="label">Complaint ID</div>
          <div className="value complaint-id">{complaint.id}</div>
        </div>
        <div className="detail-item">
          <div className="label">Category</div>
          <div className="value">{categoryLabel(complaint.category)}</div>
        </div>
        <div className="detail-item">
          <div className="label">Sector</div>
          <div className="value">{complaint.sector}</div>
        </div>
        <div className="detail-item">
          <div className="label">Department</div>
          <div className="value">{complaint.department || '—'}</div>
        </div>
        <div className="detail-item">
          <div className="label">Priority</div>
          <div className="value"><PriorityBadge priority={complaint.priority} /></div>
        </div>
        <div className="detail-item">
          <div className="label">Status</div>
          <div className="value"><StatusBadge status={complaint.status} /></div>
        </div>
        <div className="detail-item">
          <div className="label">Reports</div>
          <div className="value">{complaint.report_count ?? 1}</div>
        </div>
        <div className="detail-item">
          <div className="label">Reported</div>
          <div className="value">{formatDateTime(complaint.created_at || complaint.createdAt)}</div>
        </div>
      </div>

      {complaint.priority_score != null && (
        <p className="muted" style={{ fontSize: '0.88rem' }}>
          Priority score: {complaint.priority_score}/100
        </p>
      )}

      {complaint.description && (
        <div className="info-box">
          <strong>Summary: </strong>{complaint.description}
        </div>
      )}
    </div>
  )
}
