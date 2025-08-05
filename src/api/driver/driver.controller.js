const driverService = require('./driver.service');
const {
  validateRequest,
  createDriverSchema,
  updateDriverSchema,
  searchDriversSchema,
  deliveryWithDriversSchema
} = require('./driver.validate');

class DriverController {

  async createDriver(req, res) {
    try {
      const validation = validateRequest(req.body, createDriverSchema);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors
        });
      }

      const driver = await driverService.createDriver(validation.data);

      res.status(201).json({
        success: true,
        data: driver,
        message: 'Driver created successfully'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async searchDrivers(req, res) {
    try {
      const validation = validateRequest(req.query, searchDriversSchema);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: validation.errors
        });
      }
      
      console.log(validation.data);
      const result = await driverService.searchDrivers(validation.data);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getRecentDrivers(req, res) {
    try {
      // Parse query parameters for pagination
      const queryParams = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      // Validate pagination bounds
      if (queryParams.limit > 100) queryParams.limit = 100;
      if (queryParams.limit < 1) queryParams.limit = 20;
      if (queryParams.page < 1) queryParams.page = 1;

      const result = await driverService.getRecentDrivers(queryParams);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getDriverById(req, res) {
    try {
      const driverId = parseInt(req.params.id);
      if (isNaN(driverId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid driver ID'
        });
      }

      const driver = await driverService.getDriverById(driverId);

      res.status(200).json({
        success: true,
        data: driver
      });

    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Driver not found'
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async logDeliveryWithDrivers(req, res) {
    try {
      const requestId = parseInt(req.params.requestId);
      if (isNaN(requestId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request ID'
        });
      }

      const validation = validateRequest(req.body, deliveryWithDriversSchema);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors
        });
      }

      const result = await driverService.logDeliveryWithDrivers(requestId, validation.data);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Delivery logged successfully'
      });

    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Only planned or processing requests')) {
        return res.status(400).json({
          success: false,
          error: 'Only planned or processing requests can have delivery logged'
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async confirmDeliveryCompletion(req, res) {
    try {
      const requestId = parseInt(req.params.requestId);
      if (isNaN(requestId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request ID'
        });
      }

      const result = await driverService.confirmDeliveryCompletion(requestId);

      res.json({
        success: true,
        data: result,
        message: 'Delivery completion confirmed successfully'
      });

    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Only processing requests')) {
        return res.status(400).json({
          success: false,
          error: 'Request is not in processing status'
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getDriverRatings(req, res) {
    try {
      const driverId = parseInt(req.params.id);

      if (isNaN(driverId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid driver ID'
        });
      }

      const ratings = await driverService.getDriverRatings(driverId);

      res.status(200).json({
        success: true,
        message: 'Driver ratings retrieved successfully',
        data: ratings
      });

    } catch (error) {
      console.error('Error retrieving driver ratings:', error.message);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve driver ratings',
        error: error.message
      });
    }
  }

  async getDriverInsights(req, res) {
    try {
      const driverId = parseInt(req.params.id);

      if (isNaN(driverId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid driver ID'
        });
      }

      const insights = await driverService.getDriverInsights(driverId);

      res.status(200).json({
        success: true,
        message: 'Driver insights retrieved successfully',
        data: insights
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve driver insights',
        error: error.message
      });
    }
  } 

  async updateDriver(req, res) {
    try {
      const driverId = parseInt(req.params.id);
      
      if (isNaN(driverId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid driver ID'
        });
      }

      const validation = validateRequest(req.body, updateDriverSchema);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors
        });
      }

      const driver = await driverService.updateDriver(driverId, validation.data);

      res.status(200).json({
        success: true,
        data: driver,
        message: 'Driver updated successfully'
      });

    } catch (error) {
      console.error('Update driver error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Driver not found'
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteDriver(req, res) {
    try {
      const driverId = parseInt(req.params.id);
      
      // Validate driver ID
      if (isNaN(driverId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid driver ID'
        });
      }

      const result = await driverService.deleteDriver(driverId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: { driverId: result.driverId }
      });
      
    } catch (error) {
      console.error('Delete driver error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Driver not found'
        });
      }

      if (error.message.includes('Cannot delete driver with existing')) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete driver with existing delivery ratings',
          message: 'Driver has associated delivery records. Consider archiving instead of deleting.'
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}


module.exports = new DriverController();