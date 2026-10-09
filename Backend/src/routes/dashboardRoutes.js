const express = require('express')
const { asyncRoute } = require('./index')

function createDashboardRoutes(controller) {
  const router = express.Router()
  router.get('/stats', asyncRoute(controller.stats))
  router.get('/hotspots', asyncRoute(controller.hotspots))
  return router
}

module.exports = { createDashboardRoutes }
const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.get('/stats', dashboardController.stats);
router.get('/hotspots', dashboardController.hotspots);
router.get('/departments', dashboardController.departments);

module.exports = router;