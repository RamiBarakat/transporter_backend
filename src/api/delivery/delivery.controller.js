const deliveryService = require('./delivery.service');
const driverService = require('../driver/driver.service');
const { validateRequest } = require('../driver/driver.validate');
const { deliveryWithDriversSchema } = require('../driver/driver.validate');

class DeliveryController {

  /**
   * Log delivery completion with drivers and ratings
   * POST /api/deliveries/:requestId/log
   */
  async logDeliveryWithDrivers(req, res) {
    try {
      console.log('=== Controller logDeliveryWithDrivers ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const requestId = parseInt(req.params.requestId);
      console.log('Request ID:', requestId);

      if (isNaN(requestId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request ID'
        });
      }

      // Validate delivery with drivers data
      const validation = validateRequest(req.body, deliveryWithDriversSchema);
      console.log('Validation result:', validation);
      
      if (!validation.isValid) {
        console.log('Validation failed:', validation.errors);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      console.log('Calling deliveryService.logDeliveryWithDrivers...');
      // Log delivery with drivers
      const result = await deliveryService.logDeliveryWithDrivers(requestId, validation.data);

      console.log(`Delivery with drivers logged for request ID: ${requestId}`);

      return res.status(201).json({
        success: true,
        message: 'Delivery with drivers logged successfully',
        data: result
      });

    } catch (error) {
      console.error('Error logging delivery completion:', error.message);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      if (error.message.includes('Only planned or processing requests')) {
        return res.status(400).json({
          success: false,
          message: 'Only planned or processing requests can have delivery logged'
        });
      }

      if (error.message.includes('already exists')) {
        return res.status(400).json({
          success: false,
          message: 'Delivery already exists for this request'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to log delivery completion',
        error: error.message
      });
    }
  }

  /**
   * Confirm delivery completion (change status from processing to completed)
   * POST /api/deliveries/:requestId/confirm
   */
  async confirmDeliveryCompletion(req, res) {
    try {
      const requestId = parseInt(req.params.requestId);
      if (isNaN(requestId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request ID'
        });
      }

      console.log(`Confirming delivery completion for request ID: ${requestId}`);
      
      const result = await deliveryService.confirmDeliveryCompletion(requestId);

      res.json({
        success: true,
        data: result,
        message: 'Delivery completion confirmed successfully'
      });

    } catch (error) {
      console.error('Delivery confirmation error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Request not found',
          error: error.message
        });
      }

      if (error.message.includes('Only processing requests')) {
        return res.status(400).json({
          success: false,
          message: 'Request is not in processing status',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to confirm delivery completion',
        error: error.message
      });
    }
  }

  /**
   * Get delivery by request ID
   * GET /api/deliveries/request/:requestId
   */
  async getDeliveryByRequestId(req, res) {
    try {
      const requestId = parseInt(req.params.requestId);
      if (isNaN(requestId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request ID'
        });
      }

      const delivery = await deliveryService.getDeliveryByRequestId(requestId);

      res.json({
        success: true,
        data: delivery
      });

    } catch (error) {
      console.error('Get delivery error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Delivery not found for this request'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get delivery',
        error: error.message
      });
    }
  }

  /**
   * Get delivery statistics
   * GET /api/deliveries/stats?startDate=2024-01-01&endDate=2024-01-31
   */
  async getDeliveryStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const stats = await deliveryService.getDeliveryStats(startDate, endDate);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get delivery stats error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get delivery statistics',
        error: error.message
      });
    }
  }

  /**
   * Health check for delivery APIs
   * GET /api/deliveries/health
   */
  async healthCheck(req, res) {
    try {
      res.json({
        success: true,
        status: 'healthy',
        service: 'delivery-api',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Delivery Health Check Error:', error);
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        service: 'delivery-api',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }
}

module.exports = new DeliveryController();