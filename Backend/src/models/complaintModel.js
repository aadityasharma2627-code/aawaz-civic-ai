const { query } = require('../db');

const SELECT_COLUMNS = `
  public_id, category, description, original_text, language, sector, sector_key,
  latitude, longitude, photo_url, priority, priority_score, department, status,
  report_count, created_at, updated_at
`;

// Internal id is never exposed — the API always shows the AWZ-XXXX public id.
function toPublic(row) {
  if (!row) return null;
  return {
    id: row.public_id,
    category: row.category,
    description: row.description,
    original_text: row.original_text,
    language: row.language,
    sector: row.sector,
    latitude: row.latitude,
    longitude: row.longitude,
    photo_url: row.photo_url,
    priority: row.priority,
    priority_score: row.priority_score,
    department: row.department,
    status: row.status,
    report_count: row.report_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// Atomic insert + initial status_history record (single statement).
async function insertComplaint(c) {
  const { rows } = await query(
    `WITH new_complaint AS (
       INSERT INTO complaints (
         category, description, original_text, language, sector, sector_key,
         latitude, longitude, photo_url, priority, priority_score, department,
         status, report_count
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'REPORTED',1)
       RETURNING id, ${SELECT_COLUMNS}
     ), history AS (
       INSERT INTO status_history (complaint_id, status, changed_by)
       SELECT id, 'REPORTED', 'system' FROM new_complaint
       RETURNING complaint_id
     )
     SELECT * FROM new_complaint`,
    [c.category, c.description, c.original_text, c.language, c.sector, c.sector_key,
     c.latitude, c.longitude, c.photo_url, c.priority, c.priority_score, c.department]
  );
  return toPublic(rows[0]);
}

async function findOpenDuplicate(category, sectorKey) {
  const { rows } = await query(
    `SELECT ${SELECT_COLUMNS} FROM complaints
     WHERE category = $1 AND sector_key = $2 AND status <> 'RESOLVED'
     ORDER BY created_at ASC, id ASC
     LIMIT 1`,
    [category, sectorKey]
  );
  return toPublic(rows[0]);
}

// Atomic count increment + priority escalation (score only ever goes UP).
async function incrementReport(publicId, candidateScore) {
  const { rows } = await query(
    `UPDATE complaints SET
       report_count = report_count + 1,
       priority_score = GREATEST(priority_score, $2),
       priority = CASE
         WHEN GREATEST(priority_score, $2) >= 70 THEN 'HIGH'
         WHEN GREATEST(priority_score, $2) >= 45 THEN 'MEDIUM'
         ELSE 'LOW' END,
       updated_at = now()
     WHERE public_id = $1
     RETURNING ${SELECT_COLUMNS}`,
    [publicId, candidateScore]
  );
  return toPublic(rows[0]);
}

async function findByPublicId(publicId) {
  const { rows } = await query(
    `SELECT ${SELECT_COLUMNS} FROM complaints WHERE public_id = $1`,
    [publicId]
  );
  return toPublic(rows[0]);
}

// Atomic status update + history record.
async function updateStatus({ publicId, status, changedBy }) {
  const { rows } = await query(
    `WITH updated AS (
       UPDATE complaints SET status = $2, updated_at = now()
       WHERE public_id = $1
       RETURNING id, ${SELECT_COLUMNS}
     ), history AS (
       INSERT INTO status_history (complaint_id, status, changed_by)
       SELECT id, $2, $3 FROM updated
       RETURNING complaint_id
     )
     SELECT * FROM updated`,
    [publicId, status, changedBy]
  );
  return toPublic(rows[0]);
}

async function getStatusHistory(publicId) {
  const { rows } = await query(
    `SELECT sh.status, sh.changed_by, sh.created_at
     FROM status_history sh
     JOIN complaints c ON c.id = sh.complaint_id
     WHERE c.public_id = $1
     ORDER BY sh.created_at ASC, sh.id ASC`,
    [publicId]
  );
  return rows;
}

async function list(filters) {
  const conditions = [];
  const params = [];
  const add = (value, template) => {
    params.push(value);
    conditions.push(template.replace('?', `$${params.length}`));
  };
  if (filters.status) add(filters.status, 'status = ?');
  if (filters.priority) add(filters.priority, 'priority = ?');
  if (filters.category) add(filters.category, 'category = ?');
  if (filters.department) add(filters.department, 'department = ?');
  if (filters.sectorKey) add(filters.sectorKey, 'sector_key = ?');

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await query(
    `SELECT ${SELECT_COLUMNS} FROM complaints ${where}
     ORDER BY created_at DESC, id DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, filters.limit, filters.offset]
  );
  const totalResult = await query(
    `SELECT COUNT(*)::int AS total FROM complaints ${where}`,
    params
  );
  return { complaints: rows.map(toPublic), total: totalResult.rows[0].total };
}

async function getStats() {
  const { rows } = await query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status <> 'RESOLVED')::int AS open,
       COUNT(*) FILTER (WHERE status = 'RESOLVED')::int AS resolved,
       COUNT(*) FILTER (WHERE priority = 'HIGH' AND status <> 'RESOLVED')::int AS high_priority,
       COALESCE(SUM(report_count - 1), 0)::int AS merged_reports
     FROM complaints`
  );
  return rows[0];
}

async function getDistribution(column) {
  const allowed = ['category', 'department', 'status', 'priority'];
  if (!allowed.includes(column)) throw new Error(`Invalid distribution column: ${column}`);
  const { rows } = await query(
    `SELECT ${column} AS key, COUNT(*)::int AS count
     FROM complaints GROUP BY ${column} ORDER BY count DESC, key ASC`
  );
  return rows.map((r) => ({ [column]: r.key, count: r.count }));
}

async function getHotspots(limit) {
  const { rows } = await query(
    `SELECT sector, COUNT(*)::int AS open_complaints
     FROM complaints
     WHERE status <> 'RESOLVED'
     GROUP BY sector
     ORDER BY open_complaints DESC, sector ASC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

module.exports = {
  insertComplaint, findOpenDuplicate, incrementReport, findByPublicId,
  updateStatus, getStatusHistory, list, getStats, getDistribution, getHotspots, toPublic,
};