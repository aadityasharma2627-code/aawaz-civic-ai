/**
 * v1 duplicate rule: same category + same NORMALIZED sector + status != RESOLVED.
 * The DB enforces this with a partial unique index, so even concurrent requests
 * cannot create two open complaints for the same problem.
 * Designed so image/semantic similarity can be layered in later (swap
 * findOpenDuplicate's matching strategy; the merge path stays identical).
 */
const complaintModel = require('../../models/complaintModel');
const priorityService = require('../priority/priorityService');
const logger = require('../../utils/logger');

async function findOpenDuplicate({ category, sectorKey }) {
  return complaintModel.findOpenDuplicate(category, sectorKey);
}

// A new report of the same problem: bump report_count and re-run the priority
// scorer (more reports = higher urgency). Priority only ever escalates.
async function registerReport(existing) {
  const candidate = priorityService.calculate({
    category: existing.category,
    text: existing.original_text,
    reportCount: existing.report_count + 1,
    hasPhoto: Boolean(existing.photo_url),
  });
  const updated = await complaintModel.incrementReport(existing.id, candidate.priority_score);
  logger.info('duplicate.report_merged', {
    id: existing.id,
    report_count: updated.report_count,
    priority: updated.priority,
  });
  return updated;
}

module.exports = { findOpenDuplicate, registerReport };