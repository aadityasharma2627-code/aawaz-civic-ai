import { ApiError } from '../api/client'

// Convert raw failures into citizen-friendly messages.
// Never surface technical errors to users.

export function friendlyError(err) {
  if (err instanceof ApiError) {
    if (err.status === 0) {
      return 'You appear to be offline. Your complaint will be saved on this device and sent automatically when you are back online.'
    }
    if (err.status === 400) return 'Some information was missing or invalid. Please check the form and try again.'
    if (err.status === 404) return 'We could not find that complaint. Please check the complaint ID.'
    if (err.status >= 500) return 'Our servers are having trouble right now. Please try again in a moment.'
  }
  return 'Something went wrong. Please try again.'
}
