const express = require('express');
const router = express.Router();
const deliveryController = require('./delivery.controller');

// ============================================================================
// DELIVERY LOGGING ROUTES
// ============================================================================

/**
 * Log delivery completion with drivers and ratings
 * POST /api/deliveries/:requestId/log
 */
router.post('/:requestId/log', deliveryController.logDeliveryWithDrivers);

/**
 * Confirm delivery completion (processing -> completed status)
 * POST /api/deliveries/:requestId/confirm
 */
router.post('/:requestId/confirm', deliveryController.confirmDeliveryCompletion);

// ============================================================================
// DELIVERY DATA ROUTES
// ============================================================================

/**
 * Get delivery by request ID
 * GET /api/deliveries/request/:requestId
 */
router.get('/request/:requestId', deliveryController.getDeliveryByRequestId);

/**
 * Get delivery statistics
 * GET /api/deliveries/stats?startDate=2024-01-01&endDate=2024-01-31
 */
router.get('/stats', deliveryController.getDeliveryStats);

// ============================================================================
// UTILITY ROUTES
// ============================================================================

/**
 * Health check for delivery APIs
 * GET /api/deliveries/health
 */
router.get('/health', deliveryController.healthCheck);

// ============================================================================
// MIDDLEWARE FOR ERROR HANDLING
// ============================================================================

router.use((error, req, res, next) => {
  console.error('Delivery route error:', error);
  
  // Handle specific error types
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Database validation error',
      errors: error.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry error',
      error: 'A delivery record with this information already exists'
    });
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Reference error',
      error: 'Referenced record does not exist'
    });
  }

  // Generic error response
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

// ============================================================================
// ROUTE NOT FOUND HANDLER
// ============================================================================

router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Delivery endpoint not found',
    availableEndpoints: [
      'POST /api/deliveries/:requestId/log - Log delivery with drivers',
      'POST /api/deliveries/:requestId/confirm - Confirm delivery completion',
      'GET /api/deliveries/request/:requestId - Get delivery by request ID',
      'GET /api/deliveries/stats - Get delivery statistics',
      'GET /api/deliveries/health - Health check'
    ]
  });
});

module.exports = router;