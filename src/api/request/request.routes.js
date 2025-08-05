const express = require('express');
const router = express.Router();
const requestController = require('./request.controller');


router.post('/', requestController.createRequest);

router.get('/', requestController.getAllRequests);

router.get('/:id', requestController.getRequestById);

router.put('/:id', requestController.updateRequest);

router.delete('/:id', requestController.deleteRequest);

router.get('/health', requestController.healthCheck);

router.use((error, req, res, next) => {
  console.error('Request route error:', error);
  
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
      error: 'A record with this information already exists'
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
    message: 'Endpoint not found',
    availableEndpoints: [
      'GET /api/requests - Get all requests',
      'POST /api/requests - Create new request',
      'GET /api/requests/:id - Get request by ID',
      'PUT /api/requests/:id - Update request',
      'DELETE /api/requests/:id - Delete request',
      'POST /api/requests/:id/delivery - Log delivery completion',
      'POST /api/requests/:id/delivery/confirm - Confirm delivery completion',
      'PUT /api/requests/:id/delivery - Update delivery completion',
      'GET /api/requests/:id/performance - Get request performance',
      'GET /api/requests/dashboard/stats - Get dashboard statistics',
      'GET /api/requests/performance/summary - Get performance summary',
      'GET /api/requests/health - Health check'
    ]
  });
});

module.exports = router;