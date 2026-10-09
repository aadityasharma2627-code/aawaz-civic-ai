const dashboardService = require('../services/dashboardService');
const { ok } = require('../utils/response');
const { asyncHandler } = require('../utils/errors');
const { validateHotspotLimit } = require('../utils/validators');

const stats = asyncHandler(async (req, res) => ok(res, await dashboardService.getStats()));

const hotspots = asyncHandler(async (req, res) => {
  const limit = validateHotspotLimit(req.query || {});
  return ok(res, { hotspots: await dashboardService.getHotspots(limit) });
});

const departments = asyncHandler(async (req, res) =>
  ok(res, { departments: await dashboardService.listDepartments() })
);

module.exports = { stats, hotspots, departments };