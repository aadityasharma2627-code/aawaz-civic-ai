const CATEGORIES = ['pothole', 'garbage', 'streetlight', 'water_leak', 'other'];

const CATEGORY_LABELS = {
  pothole: 'Pothole / Road Damage',
  garbage: 'Garbage',
  streetlight: 'Streetlight',
  water_leak: 'Water Leak',
  other: 'Other',
};

// The ONLY departments that exist. Routing is derived server-side from category —
// the frontend can never inject an arbitrary department name.
const DEPARTMENT_BY_CATEGORY = {
  pothole: 'MC Roads',
  garbage: 'MC Sanitation',
  streetlight: 'Electricity Dept',
  water_leak: 'Water Supply',
  other: 'General Grievance Cell',
};

const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'];
const STATUSES = ['REPORTED', 'ASSIGNED', 'RESOLVED'];
const LANGUAGES = ['en', 'hi', 'pa', 'hinglish', 'mixed', 'other'];

module.exports = {
  CATEGORIES, CATEGORY_LABELS, DEPARTMENT_BY_CATEGORY, PRIORITIES, STATUSES, LANGUAGES,
};