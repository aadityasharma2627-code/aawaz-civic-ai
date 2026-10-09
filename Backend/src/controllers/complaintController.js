const complaintService = require('../services/complaintService');
const config = require('../config');
const { ok } = require('../utils/response');
const { asyncHandler } = require('../utils/errors');
const {
  validateCreateComplaint, validatePublicId, validateStatusUpdate, validateListFilters,
} = require('../utils/validators');

const create = asyncHandler(async (req, res) => {
  const input = validateCreateComplaint(req.body || {});
  const result = await complaintService.createComplaint(input);

  const body = {
    success: true,
    duplicate: result.duplicate,
    complaint: result.complaint,
  };
  // Optional demo/debug metadata (off by default — citizens never see internals).
  if (config.includeAiMeta) body.meta = result.meta;

  return res.status(result.duplicate ? 200 : 201).json(body);
});

const getOne = asyncHandler(async (req, res) => {
  const id = validatePublicId(req.params.id);
  const data = await complaintService.getComplaint(id);
  return ok(res, data);
});

const list = asyncHandler(async (req, res) => {
  const filters = validateListFilters(req.query || {});
  const { complaints, total } = await complaintService.listComplaints(filters);
  return ok(res, { complaints, count: complaints.length, total });
});

const updateStatus = asyncHandler(async (req, res) => {
  const id = validatePublicId(req.params.id);
  const { status, changedBy } = validateStatusUpdate(req.body || {});
  const complaint = await complaintService.updateComplaintStatus({
    publicId: id, status, changedBy: changedBy,
  });
  return ok(res, { complaint });
});

module.exports = { create, getOne, list, updateStatus };