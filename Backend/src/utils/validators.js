const {
  CATEGORIES, STATUSES, PRIORITIES, DEPARTMENT_BY_CATEGORY,
} = require('../config/constants');
const { AppError } = require('./errors');
const { sanitizeText, normalizeSector } = require('./sanitize');
const photoService = require('../services/photo/photoService');
const languageService = require('../services/language/languageService');

const PUBLIC_ID_RE = /^AWZ-\d{1,10}$/;

function invalid(message) {
  throw new AppError('INVALID_REQUEST', message, 400);
}

function validateCreateComplaint(body = {}) {
  const errors = [];

  const text = sanitizeText(body.text);
  if (!text) errors.push('Complaint text is required.');
  else if (text.length < 3) errors.push('Complaint text must be at least 3 characters long.');

  const sectorInfo = normalizeSector(body.sector);
  if (!sectorInfo) errors.push('A valid sector is required (for example "Sector 22").');

  let categoryHint = null;
  if (body.category !== undefined && body.category !== null && body.category !== '') {
    const c = String(body.category).toLowerCase().trim();
    if (!CATEGORIES.includes(c)) {
      errors.push(`Invalid category "${body.category}". Allowed: ${CATEGORIES.join(', ')}.`);
    } else {
      categoryHint = c;
    }
  }

  let language = null;
  if (body.language !== undefined && body.language !== null && body.language !== '') {
    const l = String(body.language).toLowerCase().trim();
    if (languageService.isSupported(l)) language = l;
    // Unknown codes are ignored — language is auto-detected instead (lenient by design).
  }

  let latitude = null;
  if (body.latitude !== undefined && body.latitude !== null) {
    const n = Number(body.latitude);
    if (!Number.isFinite(n) || n < -90 || n > 90) errors.push('Invalid latitude. Must be a number between -90 and 90.');
    else latitude = n;
  }

  let longitude = null;
  if (body.longitude !== undefined && body.longitude !== null) {
    const n = Number(body.longitude);
    if (!Number.isFinite(n) || n < -180 || n > 180) errors.push('Invalid longitude. Must be a number between -180 and 180.');
    else longitude = n;
  }

  let photo = null;
  if (body.photo !== undefined && body.photo !== null && body.photo !== '') {
    photo = photoService.validatePhoto(body.photo);
    if (!photo) errors.push('Photo must be a valid http(s) image URL or a data:image URL.');
  }

  if (errors.length) {
    throw new AppError('INVALID_REQUEST', errors[0], 400);
  }

  return {
    text, language, categoryHint,
    sector: sectorInfo.sector,
    sectorKey: sectorInfo.sectorKey,
    latitude, longitude, photo,
  };
}

function validatePublicId(id) {
  const v = typeof id === 'string' ? id.trim().toUpperCase() : '';
  if (!PUBLIC_ID_RE.test(v)) invalid('Invalid complaint id format. Expected "AWZ-0001".');
  return v;
}

function validateStatusUpdate(body = {}) {
  const status = body.status;
  if (!status || typeof status !== 'string' || !STATUSES.includes(status.toUpperCase())) {
    invalid(`Invalid status. Allowed values: ${STATUSES.join(', ')}.`);
  }
  let changedBy = 'admin';
  if (body.changed_by !== undefined && body.changed_by !== null && body.changed_by !== '') {
    changedBy = sanitizeText(body.changed_by, 60);
    if (!changedBy || !/^[\p{L}\p{N} _.-]+$/u.test(changedBy)) invalid('Invalid changed_by.');
  }
  return { status: status.toUpperCase(), changedBy };
}

function validateListFilters(query = {}) {
  const filters = { limit: 100, offset: 0 };
  const errors = [];

  if (query.status) {
    const v = String(query.status).toUpperCase();
    if (!STATUSES.includes(v)) errors.push(`Invalid status filter. Allowed: ${STATUSES.join(', ')}.`);
    else filters.status = v;
  }
  if (query.priority) {
    const v = String(query.priority).toUpperCase();
    if (!PRIORITIES.includes(v)) errors.push(`Invalid priority filter. Allowed: ${PRIORITIES.join(', ')}.`);
    else filters.priority = v;
  }
  if (query.category) {
    const v = String(query.category).toLowerCase();
    if (!CATEGORIES.includes(v)) errors.push(`Invalid category filter. Allowed: ${CATEGORIES.join(', ')}.`);
    else filters.category = v;
  }
  if (query.department) {
    const v = String(query.department).toLowerCase().trim();
    const match = Object.values(DEPARTMENT_BY_CATEGORY).find((d) => d.toLowerCase() === v);
    if (!match) errors.push(`Invalid department filter. Allowed: ${Object.values(DEPARTMENT_BY_CATEGORY).join(', ')}.`);
    else filters.department = match;
  }
  if (query.sector) {
    const n = normalizeSector(String(query.sector));
    if (!n) errors.push('Invalid sector filter.');
    else filters.sectorKey = n.sectorKey;
  }
  if (query.limit !== undefined) {
    const n = parseInt(query.limit, 10);
    if (!Number.isInteger(n) || n < 1 || n > 200) errors.push('Invalid limit. Must be 1-200.');
    else filters.limit = n;
  }
  if (query.offset !== undefined) {
    const n = parseInt(query.offset, 10);
    if (!Number.isInteger(n) || n < 0) errors.push('Invalid offset.');
    else filters.offset = n;
  }

  if (errors.length) throw new AppError('INVALID_REQUEST', errors[0], 400);
  return filters;
}

function validateHotspotLimit(query = {}) {
  if (query.limit === undefined) return 10;
  const n = parseInt(query.limit, 10);
  if (!Number.isInteger(n) || n < 1 || n > 50) invalid('Invalid limit. Must be 1-50.');
  return n;
}

module.exports = {
  validateCreateComplaint, validatePublicId, validateStatusUpdate, validateListFilters, validateHotspotLimit,
};