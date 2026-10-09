import { useEffect, useMemo, useState } from 'react'
import { getComplaints, updateComplaintStatus } from '../../api/complaints'
import { categoryLabel, STATUSES } from '../../data/labels'
import { formatDateTime } from '../../utils/format'
import PriorityBadge from '../../components/PriorityBadge'
import StatusBadge from '../../components/StatusBadge'
import FilterBar from '../../components/FilterBar'
import Loading from '../../components/Loading'
import { friendlyError } from '../../utils/friendlyError'

export default function AdminQueuePage() {
  const [filters, setFilters] = useState({})
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const load = async (activeFilters = filters) => {
    setError('')
    try {
      const data = await getComplaints(activeFilters)
      setRows(data?.complaints || data || [])
    } catch {
      setRows([])
      setError('Could not load complaints. Please check that the backend is running and try again.')
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const departments = useMemo(
    () => [...new Set((rows || []).map((r) => r.department).filter(Boolean))].sort(),
    [rows]
  )

  const changeStatus = async (complaint, status) => {
    if (complaint.status === status) return
    const previous = rows
    // Optimistic UI update, rolled back on failure.
    setRows((current) => current.map((r) => (r.id === complaint.id ? { ...r, status } : r)))
    setUpdatingId(complaint.id)
    try {
      await updateComplaintStatus(complaint.id, status)
    } catch {
      setRows(previous)
      setError('Status could not be updated. Please try again.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      <h1 className="page-title">Complaint Queue</h1>
      <p className="page-sub">Review, filter and update complaints.</p>

      <FilterBar filters={filters} departments={departments} onChange={(f) => { setFilters(f); load(f) }} />

      {error && <div className="error-box" role="alert">{error}</div>}
      {!rows && <Loading label="Loading complaints…" />}

      {rows && rows.length === 0 && (
        <div className="info-box">No complaints match these filters.</div>
      )}

      {rows && rows.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Issue</th>
                <th>Sector</th>
                <th>Priority</th>
                <th>Department</th>
                <th>Reports</th>
                <th>Status</th>
                <th>Reported</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="complaint-id">{c.id}</td>
                  <td>{categoryLabel(c.category)}</td>
                  <td>{c.sector}</td>
                  <td><PriorityBadge priority={c.priority} /></td>
                  <td>{c.department || '—'}</td>
                  <td>{c.report_count ?? 1}</td>
                  <td>
                    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                      <StatusBadge status={c.status} />
                      <select
                        aria-label={`Update status for ${c.id}`}
                        value={c.status}
                        disabled={updatingId === c.id}
                        onChange={(e) => changeStatus(c, e.target.value)}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </span>
                  </td>
                  <td className="muted">{formatDateTime(c.created_at || c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
