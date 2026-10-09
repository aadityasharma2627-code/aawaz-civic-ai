const express = require('express');
const complaintRoutes = require('./complaintRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const {
  CATEGORIES, CATEGORY_LABELS, DEPARTMENT_BY_CATEGORY, PRIORITIES, STATUSES, LANGUAGES,
} = require('../config/constants');

const router = express.Router();

router.use('/complaints', complaintRoutes);
router.use('/dashboard', dashboardRoutes);

// Static metadata for frontend dropdowns (single source of truth).
router.get('/meta', (req, res) => {
  res.json({
    success: true,
    data: {
      categories: CATEGORIES.map((c) => ({
        value: c, label: CATEGORY_LABELS[c], department: DEPARTMENT_BY_CATEGORY[c],
      })),
      priorities: PRIORITIES,
      statuses: STATUSES,
      languages: LANGUAGES,
    },
  });
});

module.exports = router;