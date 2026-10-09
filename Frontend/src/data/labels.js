// Presentation mappings for backend enum values.
// The backend remains the source of truth for classification and routing;
// these labels are display-only.

export const CATEGORY_LABELS = {
  pothole: 'Pothole / Road Damage',
  garbage: 'Garbage',
  streetlight: 'Streetlight',
  water_leak: 'Water Leak',
  other: 'Other',
}

export const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW']
export const STATUSES = ['REPORTED', 'ASSIGNED', 'RESOLVED']

export const STATUS_LABELS = {
  REPORTED: 'Reported',
  ASSIGNED: 'Assigned',
  RESOLVED: 'Resolved',
}

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] || category || 'Other'
}
