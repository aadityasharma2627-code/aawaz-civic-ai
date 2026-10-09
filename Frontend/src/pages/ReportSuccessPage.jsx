import { Link, Navigate, useLocation } from 'react-router-dom'
import ComplaintDetails from '../components/ComplaintDetails'
import StatusTimeline from '../components/StatusTimeline'

export default function ReportSuccessPage() {
  const { state } = useLocation()
  const result = state?.result

  // Direct visits have no analysis result — send them to the form.
  if (!result?.complaint) return <Navigate to="/report" replace />

  const { complaint } = result
  const isDuplicate = Boolean(result.duplicate)

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="card">
        <h1 className="page-title">Complaint understood</h1>
        <p className="page-sub">
          Your report has been {isDuplicate ? 'added to an existing complaint' : 'submitted'}.
        </p>

        {isDuplicate && (
          <div className="info-box">
            <strong>Similar complaint already exists.</strong> Your report has been added to the
            existing complaint. Total reports: {complaint.report_count ?? 1}.
          </div>
        )}

        <ComplaintDetails complaint={complaint} />
        <StatusTimeline status={complaint.status || 'REPORTED'} history={complaint.status_history} />

        <div className="stack-row" style={{ marginTop: 16 }}>
          <Link to="/track" className="btn btn-primary">Track Complaint</Link>
          <Link to="/" className="btn btn-outline">Back home</Link>
        </div>
      </div>
    </div>
  )
}
