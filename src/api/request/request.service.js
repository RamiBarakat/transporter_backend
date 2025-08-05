const { TransportationRequest } = require('./request.model');
const { Delivery } = require('../delivery/delivery.model');
const { Op } = require('sequelize');
const { sequelize } = require('../../config/db');
const RequestHelper = require('./request.helper');

class RequestService {

  constructor() {
    this.requestHelper = new RequestHelper();
  }
  

  async createRequest(requestData) {
    try {
      requestData.requestNumber = this.requestHelper.generateRequestNumber();
      const request = await TransportationRequest.create(requestData);
      return this.requestHelper.formatRequestResponse(request);
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
      const whereClause = this.requestHelper.buildWhereClause({
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
        requests: rows.map(request => this.requestHelper.formatRequestResponse(request)),
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
      return this.requestHelper.formatRequestResponse(request);
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
      console.log(updatedRequest, "here");
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
        request: this.requestHelper.formatRequestResponse(request, false),
        delivery: this.requestHelper.formatDeliveryResponse(request.DeliveryCompletion),
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
        recentRequests: recentRequests.map(req => this.requestHelper.formatRequestResponse(req))
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
      const performanceDistribution = this.requestHelper.calculatePerformanceDistribution(metrics);
      const averageMetrics = this.requestHelper.calculateAverageMetrics(metrics);

      return {
        totalRequests: completedRequests.length,
        averageMetrics,
        performanceDistribution
      };
    } catch (error) {
      throw new Error(`Failed to get performance summary: ${error.message}`);
    }
  }


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
        avgDelayMinutes: this.requestHelper.calculateAverage(metrics.map(m => m.delayMinutes)),
        avgCostVariancePercentage: this.requestHelper.calculateAverage(metrics.map(m => m.costVariancePercentage)),
        avgTruckVariancePercentage: this.requestHelper.calculateAverage(metrics.map(m => m.truckVariancePercentage))
      };
    } catch (error) {
      return null;
    }
  }


}

module.exports = new RequestService();