const express = require('express');
const router = express.Router();
const requestRoutes = require('../api/request/request.routes');
const driverRoutes = require('../api/driver/driver.routes');
const dashboardRoutes = require('../api/dashboard/dashboard.routes');
const deliveryRoutes = require('../api/delivery/delivery.routes');

/**
 * Main API Routes
 * Consolidates all API endpoint routes
 */

// Transportation Request Management Routes
router.use('/requests', requestRoutes);

// Driver Management Routes
router.use('/drivers', driverRoutes);

// Delivery Management Routes
router.use('/deliveries', deliveryRoutes);

// Executive Dashboard Routes
router.use('/dashboard', dashboardRoutes);

















router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Backend API is running successfully',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        availableModules: [
            'Transportation Request Management',
            'Driver Management',
            'Delivery Management',
            'Executive Dashboard'
        ]
    });
});



router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to the Transportation Management Backend API',
        version: '1.0.0',
        endpoints: {
            'Transportation Requests': '/api/requests',
            'Driver Management': '/api/drivers',
            'Delivery Management': '/api/deliveries',
            'Executive Dashboard': '/api/dashboard',
            'Health Check': '/api/health',
            'API Documentation': 'Available endpoints listed in each module'
        },
        modules: {
            'requests': {
                description: 'Transportation request management system',
                endpoints: [
                    'GET /api/requests - List all requests',
                    'POST /api/requests - Create new request',
                    'GET /api/requests/:id - Get request details',
                    'PUT /api/requests/:id - Update request',
                    'DELETE /api/requests/:id - Delete request',
                    'POST /api/requests/:id/delivery - Log delivery completion',
                    'PUT /api/requests/:id/delivery - Update delivery data',
                    'GET /api/requests/:id/performance - Get performance metrics',
                    'GET /api/requests/dashboard/stats - Dashboard statistics',
                    'GET /api/requests/performance/summary - Performance summary'
                ]
            },
            'drivers': {
                description: 'Driver management and performance tracking',
                endpoints: [
                    'GET /api/drivers - List all drivers',
                    'POST /api/drivers - Create new driver',
                    'GET /api/drivers/:id - Get driver details',
                    'PUT /api/drivers/:id - Update driver',
                    'DELETE /api/drivers/:id - Delete driver',
                    'GET /api/drivers/:id/ratings - Get driver ratings',
                    'GET /api/drivers/:id/insights - Get AI-powered driver insights'
                ]
            },
            'deliveries': {
                description: 'Delivery logging and management system',
                endpoints: [
                    'POST /api/deliveries/:requestId/log - Log delivery with drivers and ratings',
                    'POST /api/deliveries/:requestId/confirm - Confirm delivery completion',
                    'GET /api/deliveries/request/:requestId - Get delivery by request ID',
                    'GET /api/deliveries/stats - Get delivery statistics',
                    'GET /api/deliveries/health - Delivery service health check'
                ]
            },
            'dashboard': {
                description: 'Executive dashboard with KPIs, trends, and AI insights',
                endpoints: [
                    'GET /api/dashboard/kpi?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD - KPI metrics',
                    'GET /api/dashboard/trends?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD - Performance trends',
                    'GET /api/dashboard/ai-insights?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD - AI insights',
                    'GET /api/dashboard/transporter-comparison?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD - Transporter ranking',
                    'GET /api/dashboard/health - Dashboard health check'
                ]
            }
        }
    });
});

module.exports = router;