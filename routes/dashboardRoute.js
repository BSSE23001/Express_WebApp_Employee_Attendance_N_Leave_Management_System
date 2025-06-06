const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/stats', dashboardController.getDashboardStats);
router.get('/recent-leaves', dashboardController.getRecentLeaves);
router.get('/chart-data', dashboardController.getChartData);

module.exports = router;