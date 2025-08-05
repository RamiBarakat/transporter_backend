const deliveryService = require('./delivery.service');
const driverService = require('../driver/driver.service');
const { validateRequest, deliveryLoggingSchema, updateDeliverySchema, dateRangeSchema } = require('./delivery.validate');
const { deliveryWithDriversSchema } = require('../driver/driver.validate');

class DeliveryController {

  /**
   * Get all deliveries with pagination
   * GET /api/deliveries?page=1&limit=10&startDate=2024-01-01&endDate=2024-01-31
   */
  async getAllDeliveries(req, res) {
    try {
      const { page = 1, limit = 10, startDate, endDate } = req.query;
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      if (startDate) options.startDate = startDate;
      if (endDate) options.endDate = endDate;

      const result = await deliveryService.getAllDeliveries(options);

      return res.status(200).json({
        success: true,
        message: 'Deliveries retrieved successfully',
        data: result
      });

    } catch (error) {
      console.error('Get all deliveries error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve deliveries',
        error: error.message
      });
    }
  }

  /**
   * Get delivery by ID
   * GET /api/deliveries/:id
   */
  async getDeliveryById(req, res) {
    try {
      const deliveryId = parseInt(req.params.id);

      if (isNaN(deliveryId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid delivery ID'
        });
      }

      const delivery = await deliveryService.getDeliveryById(deliveryId);

      return res.status(200).json({
        success: true,
        message: 'Delivery retrieved successfully',
        data: delivery
      });

    } catch (error) {
      console.error('Get delivery by ID error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Delivery not found'
          }
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve delivery',
        error: error.message
      });
    }
  }

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
   * Get delivery for editing (simplified data without driver ratings)
   * GET /api/deliveries/request/:requestId/edit
   */
  async getDeliveryForEdit(req, res) {
    try {
      const requestId = parseInt(req.params.requestId);
      if (isNaN(requestId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request ID'
        });
      }

      const delivery = await deliveryService.getDeliveryForEdit(requestId);

      res.json({
        success: true,
        data: delivery,
        message: 'Delivery data for editing retrieved successfully'
      });

    } catch (error) {
      console.error('Get delivery for edit error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Delivery not found for this request'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get delivery for editing',
        error: error.message
      });
    }
  }

  /**
   * Update delivery and driver ratings with delete/update/create functionality
   * PUT /api/deliveries/request/:requestId
   */
  async updateDelivery(req, res) {
    try {
      const requestId = parseInt(req.params.requestId);
      if (isNaN(requestId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request ID'
        });
      }

      // Validate request body using schema
      const validation = validateRequest(req.body, updateDeliverySchema);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      console.log(`Updating delivery for request ID: ${requestId}`);
      
      const result = await deliveryService.updateDelivery(requestId, validation.data);

      res.json({
        success: true,
        data: result.data,
        message: result.message
      });

    } catch (error) {
      console.error('Update delivery error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Delivery not found'
        });
      }

      if (error.message.includes('Validation') || error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update delivery',
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

      // If no dates provided, use a default range (last 30 days)
      const defaultEndDate = new Date().toISOString().split('T')[0];
      const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const stats = await deliveryService.getDeliveryStats(
        startDate || defaultStartDate, 
        endDate || defaultEndDate
      );

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