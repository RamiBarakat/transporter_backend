const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const { validateDateRange } = require('./dashboard.validate');

// Dashboard KPI Metrics
router.get('/kpi', validateDateRange, dashboardController.getKPIData);

// Performance Trends
router.get('/trends', validateDateRange, dashboardController.getPerformanceTrends);

// AI Insights
router.get('/ai-insights', validateDateRange, dashboardController.getAIInsights);

// Transporter Comparison
router.get('/transporter-comparison', validateDateRange, dashboardController.getTransporterComparison);

// Health check for dashboard APIs
router.get('/health', dashboardController.healthCheck);

module.exports = router;