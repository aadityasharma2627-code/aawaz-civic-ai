const DEPARTMENTS = {
  pothole: 'MC Roads',
  garbage: 'Sanitation',
  streetlight: 'Electrical',
  water_leak: 'Water Supply',
  other: 'General Services',
}

function routeDepartment(category) {
  return DEPARTMENTS[category] || DEPARTMENTS.other
}

module.exports = { routeDepartment, DEPARTMENTS }
/**
 * SERVER-SIDE department routing. The frontend can NEVER choose a department —
 * it is always derived here from a validated category, so only the five
 * official departments can ever exist in the system.
 */
const { DEPARTMENT_BY_CATEGORY, CATEGORIES, CATEGORY_LABELS } = require('../../config/constants');
const { AppError } = require('../../utils/errors');

function route(category) {
  const key = String(category || '').toLowerCase().trim();
  const department = DEPARTMENT_BY_CATEGORY[key];
  if (!department) {
    throw new AppError('INVALID_REQUEST', `Cannot route unknown category "${category}".`, 400);
  }
  return department;
}

function listRoutingTable() {
  return CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    department: DEPARTMENT_BY_CATEGORY[category],
  }));
}

module.exports = { route, listRoutingTable };