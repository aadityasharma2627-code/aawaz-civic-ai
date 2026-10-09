// Centralized API client. All network calls go through here.
// Base URL comes exclusively from VITE_API_BASE_URL - never hardcode URLs.

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status // 0 means network failure / request never completed
  }
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export async function apiRequest(path, { method = 'GET', body, headers = {} } = {}) {
  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json', ...headers } : headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    // DNS failure, offline, CORS, etc.
    throw new ApiError('NETWORK_ERROR', 0)
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    throw new ApiError(data?.message || data?.error || `Request failed (${res.status})`, res.status)
  }
  return data
}
