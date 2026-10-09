import { apiRequest } from './client'

// POST /api/complaints
// payload: { text, language, sector, latitude, longitude, photo }
export function createComplaint(payload) {
  return apiRequest('/api/complaints', { method: 'POST', body: payload })
}

// GET /api/complaints/:id
export function getComplaint(id) {
  return apiRequest(`/api/complaints/${encodeURIComponent(id)}`)
}

// GET /api/complaints?department=&priority=&status=&category=&sector=
export function getComplaints(filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })
  const qs = params.toString()
  return apiRequest(`/api/complaints${qs ? `?${qs}` : ''}`)
}

// PATCH /api/complaints/:id/status  { status: "ASSIGNED" }
export function updateComplaintStatus(id, status) {
  return apiRequest(`/api/complaints/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { status },
  })
}
