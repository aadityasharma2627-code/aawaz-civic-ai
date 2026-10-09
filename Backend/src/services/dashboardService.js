function createDashboardService(model) {
  return {
    getStats: () => model.stats(),
    getHotspots: () => model.hotspots(),
  }
}

module.exports = { createDashboardService }
const complaintModel = require('../models/complaintModel');
const departmentModel = require('../models/departmentModel');
const departmentRouter = require('./routing/departmentRouter');
const { CATEGORY_LABELS } = require('../config/constants');
const logger = require('../utils/logger');

async function getStats() {
  const [stats, byCategory, byDepartment, byStatus, byPriority] = await Promise.all([
    complaintModel.getStats(),
    complaintModel.getDistribution('category'),
    complaintModel.getDistribution('department'),
    complaintModel.getDistribution('status'),
    complaintModel.getDistribution('priority'),
  ]);
  return {
    total: stats.total,
    open: stats.open,
    resolved: stats.resolved,
    high_priority: stats.high_priority,
    merged_reports: stats.merged_reports,
    category_distribution: byCategory,
    department_distribution: byDepartment,
    status_distribution: byStatus,
    priority_distribution: byPriority,
  };
}

async function getHotspots(limit) {
  return complaintModel.getHotspots(limit);
}

// Reads the departments table; falls back to the static config so this
// endpoint never fails even if the DB read has an issue.
async function listDepartments() {
  try {
    const rows = await departmentModel.listDepartments();
    if (rows.length) {
      return rows.map((r) => ({
        name: r.name,
        category: r.category,
        label: CATEGORY_LABELS[r.category] || 'Other',
      }));
    }
  } catch (err) {
    logger.warn('departments.db_read_failed_using_config', { error: err.message });
  }
  return departmentRouter.listRoutingTable().map((r) => ({
    name: r.department, category: r.category, label: r.label,
  }));
}

module.exports = { getStats, getHotspots, listDepartments };