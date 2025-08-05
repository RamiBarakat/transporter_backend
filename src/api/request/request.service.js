const { TransportationRequest } = require('./request.model');
const { Delivery, DriverRating } = require('../delivery/delivery.model');
const { Driver } = require('../driver/driver.model');
const { Op } = require('sequelize');
const { sequelize } = require('../../config/db');


class RequestService {
  

  async createRequest(requestData) {
    try {
      requestData.requestNumber = `REQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      const request = await TransportationRequest.create(requestData);
      return this.formatRequestResponse(request);
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw new Error(`Failed to create request: ${error.message}`);
    }
  }


  async getAllRequests(queryParams = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        urgencyLevel,
        truckType,
        search,
        dateFrom,
        dateTo
      } = queryParams;

      const offset = (page - 1) * limit;
      const whereClause = this.buildWhereClause({
        status,
        urgencyLevel,
        truckType,
        search,
        dateFrom,
        dateTo
      });

      const { count, rows } = await TransportationRequest.findAndCountAll({
        where: whereClause,
        include: [{
          model: Delivery,
          as: 'Delivery',
          required: false
        }],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);
      const total_completed_requests = await TransportationRequest.count({ where: { status: 'completed' } });
      const total_planned_requests = await TransportationRequest.count({ where: { status: 'planned' } });
      
      return {
        requests: rows.map(request => this.formatRequestResponse(request)),
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          total_completed_requests,
          total_planned_requests
        }
        
      };
    } catch (error) {
      throw new Error(`Failed to retrieve requests: ${error.message}`);
    }
  }


  async getRequestById(requestId) {
    try {
      const request = await TransportationRequest.findByPk(requestId, {
        include: [{
          model: Delivery,
          as: 'Delivery',
          required: false
        }]
      });

      if (!request) {
        throw new Error('Request not found');
      }

      console.log(request);
      return this.formatRequestResponse(request);
    } catch (error) {
      throw new Error(`Failed to retrieve request: ${error.message}`);
    }
  }


  async updateRequest(requestId, updateData) {
    const transaction = await sequelize.transaction();
    
    try {
      const request = await TransportationRequest.findByPk(requestId, { transaction });

      if (!request) {
        throw new Error('Request not found');
      }

      if (request.status === 'completed') {
        throw new Error('Cannot update completed requests');
      }

      await request.update(updateData, { transaction });
      await transaction.commit();

      const updatedRequest = await this.getRequestById(requestId);
      return updatedRequest;
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Failed to update request: ${error.message}`);
    }
  }


  async deleteRequest(requestId) {
    const transaction = await sequelize.transaction();
    
    try {
      const request = await TransportationRequest.findByPk(requestId, { transaction });

      if (!request) {
        throw new Error('Request not found');
      }

      if (request.status === 'completed') {
        throw new Error('Cannot delete completed requests');
      }

      await request.destroy({ transaction });
      await transaction.commit();

      return true;
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Failed to delete request: ${error.message}`);
    }
  }

  // async logDeliveryCompletion(requestId, deliveryData) {
  //   const transaction = await sequelize.transaction();
    
  //   try {
  //     const request = await TransportationRequest.findByPk(requestId, { transaction });

  //     if (!request) {
  //       throw new Error('Request not found');
  //     }

  //     if (request.status !== 'planned') {
  //       throw new Error('Only planned requests can have delivery completion logged');
  //     }

  //     // Check if delivery already exists
  //     const existingDelivery = await DeliveryCompletion.findOne({
  //       where: { requestId },
  //       transaction
  //     });

  //     if (existingDelivery) {
  //       throw new Error('Delivery completion already logged for this request');
  //     }

  //     const delivery = await DeliveryCompletion.create({
  //       ...deliveryData,
  //       requestId
  //     }, { transaction });

  //     await transaction.commit();

  //     return this.formatDeliveryResponse(delivery);
  //   } catch (error) {
  //     await transaction.rollback();
  //     throw new Error(`Failed to log delivery completion: ${error.message}`);
  //   }
  // }

 
  // async updateDeliveryCompletion(requestId, updateData) {
  //   const transaction = await sequelize.transaction();
    
  //   try {
  //     const delivery = await DeliveryCompletion.findOne({
  //       where: { requestId },
  //       transaction
  //     });

  //     if (!delivery) {
  //       throw new Error('Delivery completion not found for this request');
  //     }

  //     await delivery.update(updateData, { transaction });
  //     await transaction.commit();

  //     return this.formatDeliveryResponse(delivery);
  //   } catch (error) {
  //     await transaction.rollback();
  //     throw new Error(`Failed to update delivery completion: ${error.message}`);
  //   }
  // }

  /**
   * Get performance metrics for a specific request
   * @param {number} requestId - Request ID
   * @returns {Promise<Object>} Performance metrics
   */
  async getRequestPerformance(requestId) {
    try {
      const request = await TransportationRequest.findByPk(requestId, {
        include: [{
          model: Delivery,
          as: 'Delivery',
          required: true // Only get requests with delivery data
        }]
      });

      if (!request) {
        throw new Error('Request not found or delivery not completed');
      }

      const performance = request.getPerformanceMetrics();
      
      return {
        request: this.formatRequestResponse(request, false),
        delivery: this.formatDeliveryResponse(request.DeliveryCompletion),
        performance
      };
    } catch (error) {
      throw new Error(`Failed to get performance metrics: ${error.message}`);
    }
  }

  /**
   * Get dashboard statistics
   * @returns {Promise<Object>} Dashboard stats
   */
  async getDashboardStats() {
    try {
      const [
        totalRequests,
        plannedRequests,
        completedRequests,
        cancelledRequests,
        avgPerformanceData,
        recentRequests
      ] = await Promise.all([
        TransportationRequest.count(),
        TransportationRequest.count({ where: { status: 'planned' } }),
        TransportationRequest.count({ where: { status: 'completed' } }),
        TransportationRequest.count({ where: { status: 'cancelled' } }),
        this.getAveragePerformanceMetrics(),
        TransportationRequest.findAll({
          limit: 5,
          order: [['createdAt', 'DESC']],
          include: [{ model: DeliveryCompletion, required: false }]
        })
      ]);

      return {
        totalRequests,
        requestsByStatus: {
          planned: plannedRequests,
          completed: completedRequests,
          cancelled: cancelledRequests
        },
        averagePerformance: avgPerformanceData,
        recentRequests: recentRequests.map(req => this.formatRequestResponse(req))
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard statistics: ${error.message}`);
    }
  }


  async getPerformanceSummary(dateRange = {}) {
    try {
      const { dateFrom, dateTo } = dateRange;
      const whereClause = { status: 'completed' };

      if (dateFrom || dateTo) {
        whereClause.pickUpDateTime = {};
        if (dateFrom) whereClause.pickUpDateTime[Op.gte] = dateFrom;
        if (dateTo) whereClause.pickUpDateTime[Op.lte] = dateTo;
      }

      const completedRequests = await TransportationRequest.findAll({
        where: whereClause,
        include: [{ model: Delivery, as: 'Delivery', required: true }]
      });

      if (completedRequests.length === 0) {
        return {
          totalRequests: 0,
          averageMetrics: null,
          performanceDistribution: {
            excellent: 0,
            good: 0,
            fair: 0,
            poor: 0
          }
        };
      }

      const metrics = completedRequests.map(req => req.getPerformanceMetrics());
      const performanceDistribution = {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0
      };

      metrics.forEach(metric => {
        const grade = metric.performanceGrade.toLowerCase();
        performanceDistribution[grade]++;
      });

      const averageMetrics = {
        avgDelayMinutes: this.calculateAverage(metrics.map(m => m.delayMinutes)),
        avgTruckVariance: this.calculateAverage(metrics.map(m => m.truckVariance)),
        avgCostVariance: this.calculateAverage(metrics.map(m => m.costVariance)),
        avgTruckVariancePercentage: this.calculateAverage(metrics.map(m => m.truckVariancePercentage)),
        avgCostVariancePercentage: this.calculateAverage(metrics.map(m => m.costVariancePercentage))
      };

      return {
        totalRequests: completedRequests.length,
        averageMetrics,
        performanceDistribution
      };
    } catch (error) {
      throw new Error(`Failed to get performance summary: ${error.message}`);
    }
  }


  buildWhereClause(filters) {
    const whereClause = {};

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.urgencyLevel) {
      whereClause.urgencyLevel = filters.urgencyLevel;
    }

    if (filters.truckType) {
      whereClause.truckType = filters.truckType;
    }

    if (filters.search) {
      whereClause[Op.or] = [
        { requestNumber: { [Op.like]: `%${filters.search}%` } },
        { origin: { [Op.like]: `%${filters.search}%` } },
        { destination: { [Op.like]: `%${filters.search}%` } },
        { createdBy: { [Op.like]: `%${filters.search}%` } }
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      whereClause.plannedPickupDate = {};
      if (filters.dateFrom) whereClause.plannedPickupDate[Op.gte] = filters.dateFrom;
      if (filters.dateTo) whereClause.plannedPickupDate[Op.lte] = filters.dateTo;
    }

    return whereClause;
  }


  formatRequestResponse(request, includePerformance = true) {
    const formatted = {
      id: request.id,
      requestNumber: request.requestNumber,
      origin: request.origin,
      destination: request.destination,
      estimatedDistance: request.estimatedDistance,
      pickUpDateTime: request.pickUpDateTime,
      truckCount: request.truckCount,
      truckType: request.truckType,
      loadDetails: request.loadDetails,
      specialRequirements: request.specialRequirements,
      estimatedCost: request.estimatedCost,
      urgencyLevel: request.urgencyLevel,
      status: request.status,
      createdBy: request.createdBy,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt
    };

    if (request.Delivery) {
      formatted.delivery = this.formatDeliveryResponse(request.Delivery);
      
      if (includePerformance) {
        formatted.performance = request.getPerformanceMetrics();
      }
    }

    return formatted;
  }


  formatDeliveryResponse(delivery) {
    const response = {
      id: delivery.id,
      requestId: delivery.requestId,
      actualPickupDateTime: delivery.actualPickupDateTime,
      actualTruckCount: delivery.actualTruckCount,
      invoiceAmount: delivery.invoiceAmount,
      deliveryNotes: delivery.deliveryNotes,
      loggedBy: delivery.loggedBy,
      loggedAt: delivery.loggedAt,
      drivers: []
    };

    // Include driver ratings and driver information if available
    if (delivery.DriverRatings && delivery.DriverRatings.length > 0) {
      response.drivers = delivery.DriverRatings.map(rating => ({
        driver: {
          id: rating.Driver.id,
          name: rating.Driver.name,
          type: rating.Driver.type,
          transportCompany: rating.Driver.transportCompany,
          phone: rating.Driver.phone,
          licenseNumber: rating.Driver.licenseNumber,
          employeeId: rating.Driver.employeeId,
          department: rating.Driver.department,
          hireDate: rating.Driver.hireDate,
          overallRating: rating.Driver.overallRating,
          totalDeliveries: rating.Driver.totalDeliveries
        },
        rating: {
          id: rating.id,
          punctuality: rating.punctuality,
          professionalism: rating.professionalism,
          deliveryQuality: rating.deliveryQuality,
          communication: rating.communication,
          safety: rating.safety,
          policyCompliance: rating.policyCompliance,
          fuelEfficiency: rating.fuelEfficiency,
          overall: rating.overallRating,
          comments: rating.comments
        }
      }));
    }

    return response;
  }

  /**
   * Get average performance metrics for dashboard
   * @returns {Promise<Object>} Average metrics
   */
  async getAveragePerformanceMetrics() {
    try {
      const completedRequests = await TransportationRequest.findAll({
        where: { status: 'completed' },
        include: [{ model: Delivery, as: 'Delivery', required: true }],
        limit: 100 // Limit to recent 100 for performance
      });

      if (completedRequests.length === 0) return null;

      const metrics = completedRequests.map(req => req.getPerformanceMetrics());
      
      return {
        avgDelayMinutes: this.calculateAverage(metrics.map(m => m.delayMinutes)),
        avgCostVariancePercentage: this.calculateAverage(metrics.map(m => m.costVariancePercentage)),
        avgTruckVariancePercentage: this.calculateAverage(metrics.map(m => m.truckVariancePercentage))
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Calculate average of an array of numbers
   * @param {Array<number>} numbers - Array of numbers
   * @returns {number} Average value
   */
  calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return parseFloat((sum / numbers.length).toFixed(2));
  }
}

module.exports = new RequestService();