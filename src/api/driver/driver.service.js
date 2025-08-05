const { Driver } = require('./driver.model');
const { Delivery, DriverRating } = require('../delivery/delivery.model');
const { TransportationRequest } = require('../request/request.model');
const { Op, Transaction } = require('sequelize');
const { sequelize } = require('../../config/db');
const DriverHelper = require('./driver.helper');

class DriverService {

  constructor() {
    this.driverHelper = new DriverHelper();
  }

  async updateDriver(driverId, driverData) {
    try {
      const driver = await Driver.findByPk(driverId);
      if (!driver) {
        throw new Error('Driver not found');
      }

      // Update driver with provided data
      const updatedDriver = await driver.update(driverData);
      
      return this.driverHelper.formatDriverResponse(updatedDriver);
    } catch (error) {
      throw new Error(`Failed to update driver: ${error.message}`);
    }
  }

  async deleteDriver(driverId) {
    const transaction = await sequelize.transaction();
    
    try {
      const driver = await Driver.findByPk(driverId, { transaction });
      if (!driver) {
        throw new Error('Driver not found');
      }

      const deliveryCount = await DriverRating.count({
        where: { driverId },
        transaction
      });

      //will not delete the driver if it has any associated deliveries or ratings ()
      if (deliveryCount > 0) {
        throw new Error('Cannot delete driver with existing delivery ratings. Please archive the driver instead.');
      }

      await driver.destroy({ transaction });
      
      await transaction.commit();
      
      return {
        success: true,
        message: 'Driver deleted successfully',
        driverId: driverId
      };
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Failed to delete driver: ${error.message}`);
    }
  }

  
  async createDriver(driverData) {
    try {
      const driver = await Driver.create(driverData);
      return this.driverHelper.formatDriverResponse(driver);
    } catch (error) {
      throw new Error(`Failed to create driver: ${error.message}`);
    }
  }




  async searchDrivers(queryParams = {}) {
    try {
      const { search, type, page = 1, limit = 20 } = queryParams;
      const whereClause = {};

      const offset = (parseInt(page) - 1) * parseInt(limit);

      if (type && type !== 'all') {
        whereClause.type = type;
      }

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { transportCompany: { [Op.like]: `%${search}%` } },
          { employeeId: { [Op.like]: `%${search}%` } }
        ];
      }

      const result = await Driver.findAndCountAll({
        where: whereClause,
        order: [['name', 'ASC']],
        limit: parseInt(limit),
        offset: offset
      });

      console.log(`Found ${result.count} drivers, returning ${result.rows.length} for page ${page}`);

      // Calculate pagination metadata
      const totalPages = Math.ceil(result.count / limit);
      const currentPage = parseInt(page);
      const hasNextPage = currentPage < totalPages;
      const hasPreviousPage = currentPage > 1;

      return {
        data: result.rows,
        pagination: {
          total: result.count,
          totalPages,
          currentPage,
          limit: parseInt(limit),
          hasNextPage,
          hasPreviousPage
        }
      };
    } catch (error) {
      throw new Error(`Failed to search drivers: ${error.message}`);
    }
  }

  async getRecentDrivers(queryParams = {}) {
    try {
      const { page = 1, limit = 20 } = queryParams;
      
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const result = await Driver.findAndCountAll({
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      console.log(`Found ${result.count} recent drivers, returning ${result.rows.length} for page ${page}`);

      // Calculate pagination metadata
      const totalPages = Math.ceil(result.count / limit);
      const currentPage = parseInt(page);
      const hasNextPage = currentPage < totalPages;
      const hasPreviousPage = currentPage > 1;

      return {
        data: result.rows,
        pagination: {
          total: result.count,
          totalPages,
          currentPage,
          limit: parseInt(limit),
          hasNextPage,
          hasPreviousPage
        }
      };
    } catch (error) {
      throw new Error(`Failed to get recent drivers: ${error.message}`);
    }
  }

  async getDriverById(driverId) {
    try {
      const driver = await Driver.findByPk(driverId);
      if (!driver) {
        throw new Error('Driver not found');
      }
      return this.driverHelper.formatDriverResponse(driver);
    } catch (error) {
      throw new Error(`Failed to get driver: ${error.message}`);
    }
  }

  async getDriverInsights(driverId) {
    try {
      const driver = await Driver.findByPk(driverId);
      if (!driver) {
        throw new Error('Driver not found');
      }

      const ratingsData = await this.getDriverRatings(driverId);
      const recentDeliveries = await this.getRecentDeliveries(driverId);

      const aiInputData = {
        driver: ratingsData.driver,
        summary: ratingsData.summary,
        ratings: ratingsData.ratings,
        recentDeliveries: recentDeliveries
      };

      const aiService = require('../AI/aiService');
      let aiInsights = null;
      let aiError = null;

      try {
        aiInsights = await aiService.generateDriverInsights(aiInputData);
      } catch (error) {
        console.warn('AI insights generation failed:', error.message);
        aiError = error.message;
      }

      return {
        driver: ratingsData.driver,
        summary: ratingsData.summary,
        recentPerformance: this.driverHelper.analyzeRecentPerformance(ratingsData.ratings),
        trends: this.driverHelper.calculatePerformanceTrends(ratingsData.ratings),
        aiInsights: aiInsights,
        aiError: aiError,
        recommendations: this.driverHelper.generateBasicRecommendations(ratingsData.summary),
        riskAssessment: this.driverHelper.assessDriverRisk(ratingsData.summary, ratingsData.ratings),
        totalRatings: ratingsData.totalRatings,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get driver insights: ${error.message}`);
    }
  }

  async getRecentDeliveries(driverId, limit = 5) {
    try {
      const ratings = await DriverRating.findAll({
        where: { driverId },
        include: [{
          model: Delivery,
          as: 'Delivery',
          include: [{
            model: TransportationRequest,
            as: 'TransportationRequest'
          }]
        }],
        order: [[{ model: Delivery, as: 'Delivery' }, 'created_at', 'DESC']],
        limit: limit
      });

      return ratings.map(rating => ({
        id: rating.Delivery.id,
        actualPickupDateTime: rating.Delivery.actualPickupDateTime,
        actualTruckCount: rating.Delivery.actualTruckCount,
        invoiceAmount: rating.Delivery.invoiceAmount,
        deliveryNotes: rating.Delivery.deliveryNotes,
        loggedAt: rating.Delivery.loggedAt,
        rating: {
          overall: rating.overallRating,
          punctuality: rating.punctuality,
          professionalism: rating.professionalism,
          deliveryQuality: rating.deliveryQuality,
          communication: rating.communication
        },
        request: {
          id: rating.Delivery.TransportationRequest.id,
          requestNumber: rating.Delivery.TransportationRequest.requestNumber,
          origin: rating.Delivery.TransportationRequest.origin,
          destination: rating.Delivery.TransportationRequest.destination,
          pickUpDateTime: rating.Delivery.TransportationRequest.pickUpDateTime,
          truckCount: rating.Delivery.TransportationRequest.truckCount,
          truckType: rating.Delivery.TransportationRequest.truckType
        }
      }));
    } catch (error) {
      console.warn('Failed to get recent deliveries:', error.message);
      return [];
    }
  }

  async getDriverRatings(driverId) {
    try {
      const driver = await Driver.findByPk(driverId);
      if (!driver) {
        throw new Error('Driver not found');
      }

      const ratings = await DriverRating.findAll({
        where: { driverId },
        include: [{
          model: Delivery,
          as: 'Delivery',
          include: [{
            model: TransportationRequest,
            as: 'TransportationRequest'
          }]
        }],
        order: [[{ model: Delivery, as: 'Delivery' }, 'created_at', 'DESC']]
      });

      // Calculate statistics using helper
      const summary = this.driverHelper.calculateRatingSummary(ratings);

      return {
        driver: this.driverHelper.formatDriverResponse(driver),
        summary,
        ratings: ratings.map(rating => this.driverHelper.formatRatingWithContext(rating)),
        totalRatings: ratings.length
      };
    } catch (error) {
      throw new Error(`Failed to retrieve driver ratings: ${error.message}`);
    }
  }

  async calculateDriverOverallRating(driverId, transaction = null) {
    try {
      const result = await DriverRating.findOne({
        where: { driverId },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('overallRating')), 'avgRating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalRatings']
        ],
        transaction,
        raw: true
      });

      if (!result || !result.totalRatings || result.totalRatings === 0) {
        return 0;
      }

      const avgRating = parseFloat(result.avgRating) || 0;
      return Math.round(avgRating * 10) / 10;
    } catch (error) {
      console.warn(`Failed to calculate driver ${driverId} rating:`, error.message);
      return 0;
    }
  }

}

module.exports = new DriverService();