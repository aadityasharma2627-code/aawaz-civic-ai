const aiService = require('./ai');
const duplicateService = require('./duplicate/duplicateService');
const languageService = require('./language/languageService');
const complaintModel = require('../models/complaintModel');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

/**
 * Full complaint pipeline:
 * validate (controller) → normalize language → AI classification → priority →
 * department routing → duplicate check → store (or merge) → status history → respond.
 */
async function createComplaint(input) {
  const started = Date.now();
  const language = languageService.normalizeLanguage(input.language, input.text);

  const analysis = await aiService.analyzeComplaint({
    text: input.text,
    language,
    sector: input.sector,
    photo: input.photo,
    categoryHint: input.categoryHint,
  });

  logger.info('complaint.analyzed', {
    category: analysis.category,
    priority: analysis.priority,
    department: analysis.department,
    classification_source: analysis._meta.classification_source,
    ai_latency_ms: analysis._meta.classification_latency_ms,
    text_length: input.text.length,
  });

  const existing = await duplicateService.findOpenDuplicate({
    category: analysis.category,
    sectorKey: input.sectorKey,
  });

  if (existing) {
    const complaint = await duplicateService.registerReport(existing);
    return { duplicate: true, complaint, meta: analysis._meta };
  }

  let complaint;
  try {
    complaint = await complaintModel.insertComplaint({
      category: analysis.category,
      description: analysis.clean_complaint,
      original_text: input.text,
      language,
      sector: input.sector,
      sector_key: input.sectorKey,
      latitude: input.latitude,
      longitude: input.longitude,
      photo_url: input.photo,
      priority: analysis.priority,
      priority_score: analysis.priority_score,
      department: analysis.department,
    });
  } catch (err) {
    // Lost a race with a concurrent duplicate insert (partial unique index).
    if (err && err.code === '23505') {
      const raceWinner = await duplicateService.findOpenDuplicate({
        category: analysis.category,
        sectorKey: input.sectorKey,
      });
      if (raceWinner) {
        const merged = await duplicateService.registerReport(raceWinner);
        return { duplicate: true, complaint: merged, meta: analysis._meta };
      }
    }
    throw err;
  }

  logger.info('complaint.created', {
    id: complaint.id,
    category: complaint.category,
    department: complaint.department,
    priority: complaint.priority,
    total_latency_ms: Date.now() - started,
  });

  return { duplicate: false, complaint, meta: analysis._meta };
}

async function getComplaint(publicId) {
  const complaint = await complaintModel.findByPublicId(publicId);
  if (!complaint) throw new AppError('NOT_FOUND', `Complaint ${publicId} not found.`, 404);
  const history = await complaintModel.getStatusHistory(publicId);
  return { complaint, status_history: history };
}

async function listComplaints(filters) {
  return complaintModel.list(filters);
}

async function updateComplaintStatus({ publicId, status, changedBy }) {
  const updated = await complaintModel.updateStatus({ publicId, status, changedBy });
  if (!updated) throw new AppError('NOT_FOUND', `Complaint ${publicId} not found.`, 404);
  logger.info('complaint.status_updated', { id: publicId, status, changed_by: changedBy });
  return updated;
}

module.exports = { createComplaint, getComplaint, listComplaints, updateComplaintStatus };