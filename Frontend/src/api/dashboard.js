import { apiRequest } from './client'

// GET /api/dashboard/stats
export function getDashboardStats() {
  return apiRequest('/api/dashboard/stats')
}

// GET /api/dashboard/hotspots
export function getDashboardHotspots() {
  return apiRequest('/api/dashboard/hotspots')
}
