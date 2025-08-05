const requestService = require('./request.service');
const {
  validateRequest,
  createRequestSchema,
  updateRequestSchema,
  querySchema
} = require('./request.validate');


class RequestController {

  async createRequest(req, res) {
    try {

      const validation = validateRequest(req.body, createRequestSchema);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const request = await requestService.createRequest(validation.data);
      console.log(`Request created: ${request.requestNumber} by ${request.createdBy}`);

      res.status(201).json({
        success: true,
        message: 'Transportation request created successfully',
        data: request
      });

    } catch (error) {
      console.error('Error creating request:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to create transportation request',
        error: error.message
      });
    }
  }


  async getAllRequests(req, res) {
    try {
      // Validate query parameters
      const validation = validateRequest(req.query, querySchema);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: validation.errors
        });
      }

      // Get requests
      const result = await requestService.getAllRequests(validation.data);

      res.status(200).json({
        success: true,
        message: 'Requests retrieved successfully',
        data: result.requests,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error retrieving requests:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve requests',
        error: error.message
      });
    }
  }

 
  async getRequestById(req, res) {
    try {
      const requestId = parseInt(req.params.id);

      if (isNaN(requestId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request ID'
        });
      }

      const request = await requestService.getRequestById(requestId);

      res.status(200).json({
        success: true,
        message: 'Request retrieved successfully',
        data: request
      });

    } catch (error) {
      console.error('Error retrieving request:', error.message);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve request',
        error: error.message
      });
    }
  }

  async updateRequest(req, res) {
    try {
      const requestId = parseInt(req.params.id);

      if (isNaN(requestId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request ID'
        });
      }

      const validation = validateRequest(req.body, updateRequestSchema);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      console.log(validation.data, "here1");
      console.log(req.body, "here2");

      // Update request
      const request = await requestService.updateRequest(requestId, validation.data);
      
      // Log request update
      console.log(`Request updated: ${request.requestNumber}`);

      res.status(200).json({
        success: true,
        message: 'Request updated successfully',
        data: request
      });

    } catch (error) {
      console.error('Error updating request:', error.message);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      if (error.message.includes('Cannot update completed')) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update completed requests'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update request',
        error: error.message
      });
    }
  }


  async deleteRequest(req, res) {
    try {
      const requestId = parseInt(req.params.id);

      if (isNaN(requestId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request ID'
        });
      }

      await requestService.deleteRequest(requestId);

      // Log request deletion
      console.log(`Request deleted: ID ${requestId}`);

      res.status(200).json({
        success: true,
        message: 'Request deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting request:', error.message);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      if (error.message.includes('Cannot delete completed')) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete completed requests'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete request',
        error: error.message
      });
    }
  }


  async getRequestPerformance(req, res) {
    try {
      const requestId = parseInt(req.params.id);

      if (isNaN(requestId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request ID'
        });
      }

      const performance = await requestService.getRequestPerformance(requestId);

      res.status(200).json({
        success: true,
        message: 'Performance metrics retrieved successfully',
        data: performance
      });

    } catch (error) {
      console.error('Error retrieving performance metrics:', error.message);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Request not found or delivery not completed'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve performance metrics',
        error: error.message
      });
    }
  }


  async getDashboardStats(req, res) {
    try {
      const stats = await requestService.getDashboardStats();

      res.status(200).json({
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      console.error('Error retrieving dashboard statistics:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard statistics',
        error: error.message
      });
    }
  }

 
  async getPerformanceSummary(req, res) {
    try {
      // Validate date range if provided
      const dateRange = {};
      if (req.query.dateFrom) {
        dateRange.dateFrom = req.query.dateFrom;
      }
      if (req.query.dateTo) {
        dateRange.dateTo = req.query.dateTo;
      }

      const summary = await requestService.getPerformanceSummary(dateRange);

      res.status(200).json({
        success: true,
        message: 'Performance summary retrieved successfully',
        data: summary
      });

    } catch (error) {
      console.error('Error retrieving performance summary:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve performance summary',
        error: error.message
      });
    }
  }


  async healthCheck(req, res) {
    try {
      res.status(200).json({
        success: true,
        message: 'Transportation Request API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Health check failed',
        error: error.message
      });
    }
  }
}

module.exports = new RequestController();