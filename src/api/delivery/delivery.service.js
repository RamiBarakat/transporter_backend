const { sequelize, Transaction, Op } = require('../../config/db');
const { TransportationRequest } = require('../request/request.model');
const { Driver } = require('../driver/driver.model');
const { Delivery, DriverRating } = require('./delivery.model');

class DeliveryService {

  /**
   * Get all deliveries with pagination and optional date filtering
   */
  async getAllDeliveries(options = {}) {
    try {
      const { page = 1, limit = 10, startDate, endDate } = options;
      const offset = (page - 1) * limit;

      const whereClause = {};
      
      if (startDate && endDate) {
        whereClause.actualPickupDateTime = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const result = await Delivery.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: TransportationRequest,
            as: 'TransportationRequest',
            attributes: ['id', 'requestNumber', 'origin', 'destination']
          }
        ],
        order: [['actualPickupDateTime', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(result.count / limit);

      return {
        data: result.rows,
        pagination: {
          total: result.count,
          totalPages,
          currentPage: parseInt(page),
          limit: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to get all deliveries: ${error.message}`);
    }
  }

  /**
   * Get delivery by ID
   */
  async getDeliveryById(deliveryId) {
    try {
      const delivery = await Delivery.findByPk(deliveryId, {
        include: [
          {
            model: TransportationRequest,
            as: 'TransportationRequest',
            attributes: ['id', 'requestNumber', 'origin', 'destination']
          },
          {
            model: DriverRating,
            as: 'DriverRatings',
            include: [{
              model: Driver,
              as: 'Driver',
              attributes: ['id', 'name', 'type', 'transportCompany']
            }]
          }
        ]
      });

      if (!delivery) {
        throw new Error('Delivery not found');
      }

      return delivery;
    } catch (error) {
      throw new Error(`Failed to get delivery by ID: ${error.message}`);
    }
  }
 
  async logDeliveryWithDrivers(requestId, deliveryData) {
    // Retry logic for lock timeouts
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      const transaction = await sequelize.transaction({
        isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
        timeout: 30000 // 30 second timeout
      });
      
      try {
        // Quick validation first
        const request = await TransportationRequest.findByPk(requestId, { 
          transaction,
          lock: true 
        });
        if (!request) {
          throw new Error('Request not found');
        }

        if (request.status !== 'planned' && request.status !== 'processing') {
          throw new Error('Only planned or processing requests can have delivery logged');
        }

        // Check if delivery already exists (for re-logging scenarios)
        let delivery = await Delivery.findOne({
          where: { requestId },
          transaction
        });

        if (delivery && request.status === 'processing') {
          // Re-logging scenario: delete existing delivery and create new one
          console.log(`Re-logging delivery for request ${requestId} - removing existing delivery`);
          await delivery.destroy({ transaction });
          
          // Also clean up existing driver ratings for this delivery
          await DriverRating.destroy({
            where: { deliveryId: delivery.id },
            transaction
          });
        } else if (delivery) {
          throw new Error('Delivery already exists for this request');
        }

        // Create new delivery record
        delivery = await Delivery.create({
          requestId,
          actualPickupDateTime: deliveryData.actualPickupDateTime,
          actualTruckCount: deliveryData.actualTruckCount,
          invoiceAmount: deliveryData.invoiceAmount,
          deliveryNotes: deliveryData.deliveryNotes,
          loggedBy: 'System'
        }, { transaction });

        const processedDrivers = [];
        const driverUpdates = []; // Store driver updates for batch processing

        for (const driverData of deliveryData.drivers) {
          let driver;
          
          // Handle both simplified format (driver_id) and detailed format (id or new driver creation)
          if (driverData.driver_id) {
            // Simplified format - just reference existing driver by ID
            driver = await Driver.findByPk(driverData.driver_id, { 
              transaction,
              lock: true 
            });
            if (!driver) {
              throw new Error(`Driver with ID ${driverData.driver_id} not found`);
            }
          } else if (driverData.id) {
            // Detailed format with existing driver ID
            driver = await Driver.findByPk(driverData.id, { 
              transaction,
              lock: true 
            });
            if (!driver) {
              throw new Error(`Driver with ID ${driverData.id} not found`);
            }
          } else {
            // Create new driver (detailed format)
            driver = await Driver.create({
              name: driverData.name,
              type: driverData.type,
              transportCompany: driverData.transportCompany,
              phone: driverData.phone,
              licenseNumber: driverData.licenseNumber,
              employeeId: driverData.employeeId,
              department: driverData.department,
              hireDate: driverData.hireDate
            }, { transaction });
          }

          // Handle rating data - support both nested and flat formats
          let ratingData;
          if (driverData.rating) {
            // Nested format (existing)
            ratingData = driverData.rating;
          } else {
            // Flat format (simplified) - ratings are directly on the driver object
            ratingData = {
              punctuality: driverData.punctuality,
              professionalism: driverData.professionalism,
              deliveryQuality: driverData.deliveryQuality,
              communication: driverData.communication,
              safety: driverData.safety,
              policyCompliance: driverData.policyCompliance,
              fuelEfficiency: driverData.fuelEfficiency,
              overall: driverData.overall,
              comments: driverData.comments
            };
          }

          // Create rating record
          await DriverRating.create({
            deliveryId: delivery.id,
            driverId: driver.id,
            punctuality: ratingData.punctuality,
            professionalism: ratingData.professionalism,
            deliveryQuality: ratingData.deliveryQuality,
            communication: ratingData.communication,
            safety: ratingData.safety,
            policyCompliance: ratingData.policyCompliance,
            fuelEfficiency: ratingData.fuelEfficiency,
            overallRating: ratingData.overall,
            comments: ratingData.comments
          }, { transaction });

          // Store driver update info for later batch processing
          driverUpdates.push({
            id: driver.id,
            totalDeliveries: driver.totalDeliveries + 1,
            lastDelivery: new Date()
          });

          processedDrivers.push(this.formatDriverResponse(driver));
        }

        // Update request status to processing (intermediate state)
        await request.update({ status: 'processing' }, { transaction });
        
        // Commit main transaction first
        await transaction.commit();
        
        // Update driver statistics outside the main transaction to avoid long locks
        // This is less critical and can be done separately
        const driverService = require('../driver/driver.service');
        for (const driverUpdate of driverUpdates) {
          try {
            const overallRating = await driverService.calculateDriverOverallRating(driverUpdate.id);
            await Driver.update({
              totalDeliveries: driverUpdate.totalDeliveries,
              lastDelivery: driverUpdate.lastDelivery,
              overallRating: overallRating
            }, {
              where: { id: driverUpdate.id }
            });
          } catch (updateError) {
            console.warn(`Failed to update driver ${driverUpdate.id} statistics:`, updateError.message);
            // Continue with other drivers - this is not critical to fail the whole operation
          }
        }

        return {
          delivery: this.formatDeliveryResponse(delivery),
          drivers: processedDrivers
        };

      } catch (error) {
        console.error('=== Error in logDeliveryWithDrivers ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        await transaction.rollback();
        
        // Check if it's a lock timeout error and retry
        if (error.message.includes('Lock wait timeout') || error.message.includes('Deadlock')) {
          retryCount++;
          console.warn(`Lock timeout on attempt ${retryCount}/${maxRetries}, retrying...`);
          
          if (retryCount < maxRetries) {
            // Wait a bit before retrying with exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            continue;
          }
        }
        
        throw new Error(`Failed to log delivery: ${error.message}`);
      }
    }
    
    throw new Error('Failed to log delivery: Maximum retry attempts exceeded due to database locks');
  }

  
  async confirmDeliveryCompletion(requestId) {
    const transaction = await sequelize.transaction();
    
    try {
      const request = await TransportationRequest.findByPk(requestId, { 
        transaction,
        lock: true 
      });
      
      if (!request) {
        throw new Error('Request not found');
      }

      if (request.status !== 'processing') {
        throw new Error('Only processing requests can be confirmed as completed');
      }

      // Update status to completed
      await request.update({ status: 'completed' }, { transaction });
      
      await transaction.commit();
      
      return {
        success: true,
        message: 'Delivery confirmed as completed',
        requestId: requestId,
        status: 'completed'
      };
      
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Failed to confirm delivery completion: ${error.message}`);
    }
  }


  formatDeliveryResponse(delivery) {
    return {
      id: delivery.id,
      requestId: delivery.requestId,
      actualPickupDateTime: delivery.actualPickupDateTime,
      actualTruckCount: delivery.actualTruckCount,
      invoiceAmount: delivery.invoiceAmount,
      deliveryNotes: delivery.deliveryNotes,
      loggedBy: delivery.loggedBy,
      loggedAt: delivery.loggedAt
    };
  }

  formatDriverResponse(driver) {
    const driverService = require('../driver/driver.service');
    return driverService.formatDriverResponse(driver);
  }


  async getDeliveryByRequestId(requestId) {
    try {
      const delivery = await Delivery.findOne({
        where: { requestId },
        include: [{
          model: DriverRating,
          as: 'DriverRatings',
          include: [{
            model: Driver,
            as: 'Driver'
          }]
        }]
      });

      if (!delivery) {
        throw new Error('Delivery not found for this request');
      }

      return this.formatDeliveryResponse(delivery);
    } catch (error) {
      throw new Error(`Failed to get delivery: ${error.message}`);
    }
  }

  // Get delivery with driver ratings for editing
  async getDeliveryForEdit(requestId) {
    try {
      const delivery = await Delivery.findOne({
        where: { requestId },
        include: [{
          model: DriverRating,
          as: 'DriverRatings',
          include: [{
            model: Driver,
            as: 'Driver',
            attributes: ['id', 'name', 'type', 'transportCompany']
          }]
        }]
      });

      if (!delivery) {
        throw new Error('Delivery not found for this request');
      }

      // Format for easy editing
      return {
        delivery: {
          id: delivery.id,
          requestId: delivery.requestId,
          actualPickupDateTime: delivery.actualPickupDateTime,
          actualTruckCount: delivery.actualTruckCount,
          invoiceAmount: delivery.invoiceAmount,
          deliveryNotes: delivery.deliveryNotes,
          loggedAt: delivery.loggedAt
        },
        drivers: delivery.DriverRatings.map(rating => ({
          ratingId: rating.id,
          driver: {
            id: rating.Driver.id,
            name: rating.Driver.name,
            type: rating.Driver.type,
            transportCompany: rating.Driver.transportCompany
          },
          ratings: {
            punctuality: rating.punctuality,
            professionalism: rating.professionalism,
            deliveryQuality: rating.deliveryQuality,
            communication: rating.communication,
            safety: rating.safety,
            policyCompliance: rating.policyCompliance,
            fuelEfficiency: rating.fuelEfficiency,
            comments: rating.comments,
            overallRating: rating.overallRating
          }
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get delivery for editing: ${error.message}`);
    }
  }

  // Update delivery and driver ratings with delete functionality
  async updateDelivery(requestId, updateData) {
    const transaction = await sequelize.transaction();
    
    try {
      const delivery = await Delivery.findOne({
        where: { requestId },
        transaction
      });

      if (!delivery) {
        throw new Error('Delivery not found for this request');
      }

      // Update delivery data
      if (updateData.delivery) {
        await delivery.update({
          actualPickupDateTime: updateData.delivery.actualPickupDateTime,
          actualTruckCount: updateData.delivery.actualTruckCount,
          invoiceAmount: updateData.delivery.invoiceAmount,
          deliveryNotes: updateData.delivery.deliveryNotes
        }, { transaction });
      }

      // Handle driver ratings with delete/update/create functionality
      if (updateData.drivers !== undefined) {
        // Get all existing ratings for this delivery
        const existingRatings = await DriverRating.findAll({
          where: { deliveryId: delivery.id },
          transaction
        });

        // Get submitted rating IDs (filter out null/undefined)
        const submittedRatingIds = updateData.drivers
          .map(d => d.ratingId)
          .filter(Boolean);

        // Find ratings to delete (existing ratings not in submitted data)
        const ratingsToDelete = existingRatings.filter(rating => 
          !submittedRatingIds.includes(rating.id)
        );

        // Delete removed drivers' ratings
        if (ratingsToDelete.length > 0) {
          await DriverRating.destroy({
            where: {
              id: ratingsToDelete.map(r => r.id)
            },
            transaction
          });
        }

        // Update existing ratings and create new ones
        for (const driverData of updateData.drivers) {
          if (driverData.ratingId) {
            // Update existing rating
            const driverRating = await DriverRating.findByPk(driverData.ratingId, {
              transaction
            });

            if (driverRating) {
              await driverRating.update({
                punctuality: driverData.ratings.punctuality,
                professionalism: driverData.ratings.professionalism,
                deliveryQuality: driverData.ratings.deliveryQuality,
                communication: driverData.ratings.communication,
                safety: driverData.ratings.safety,
                policyCompliance: driverData.ratings.policyCompliance,
                fuelEfficiency: driverData.ratings.fuelEfficiency,
                comments: driverData.ratings.comments,
                overallRating: driverData.ratings.overallRating
              }, { transaction });
            }
          } else if (driverData.driver_id) {
            // Create new rating for driver
            await DriverRating.create({
              deliveryId: delivery.id,
              driverId: driverData.driver_id,
              punctuality: driverData.ratings.punctuality,
              professionalism: driverData.ratings.professionalism,
              deliveryQuality: driverData.ratings.deliveryQuality,
              communication: driverData.ratings.communication,
              safety: driverData.ratings.safety,
              policyCompliance: driverData.ratings.policyCompliance,
              fuelEfficiency: driverData.ratings.fuelEfficiency,
              comments: driverData.ratings.comments,
              overallRating: driverData.ratings.overallRating
            }, { transaction });
          }
        }
      }

      await transaction.commit();
      
      return {
        success: true,
        message: 'Delivery and driver ratings updated successfully',
        data: await this.getDeliveryForEdit(requestId)
      };
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Failed to update delivery: ${error.message}`);
    }
  }


  async getDeliveryStats(startDate, endDate) {
    try {
      // Basic delivery stats
      const basicStats = await Delivery.findAll({
        where: {
          actual_pickup_datetime: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalDeliveries'],
          [sequelize.fn('AVG', sequelize.col('actual_truck_count')), 'avgTruckCount'],
          [sequelize.fn('SUM', sequelize.col('invoice_amount')), 'totalRevenue'],
          [sequelize.fn('AVG', sequelize.col('invoice_amount')), 'avgInvoiceAmount']
        ],
        raw: true
      });

      // Get average rating from driver ratings (simplified query)
      const ratingStats = await sequelize.query(`
        SELECT AVG(dr.overall_rating) as averageRating
        FROM driver_ratings dr
        INNER JOIN deliveries d ON dr.delivery_id = d.id
        WHERE d.actual_pickup_datetime BETWEEN :startDate AND :endDate
      `, {
        type: sequelize.QueryTypes.SELECT,
        replacements: { startDate, endDate }
      });

      // Calculate on-time percentage (simplified - assumes deliveries are on time if they exist)
      const totalDeliveries = basicStats[0]?.totalDeliveries || 0;
      const onTimePercentage = totalDeliveries > 0 ? 
        Math.round((totalDeliveries * 0.8) * 100) / 100 : 0; 

      const result = {
        totalDeliveries: parseInt(basicStats[0]?.totalDeliveries || 0),
        avgTruckCount: parseFloat(basicStats[0]?.avgTruckCount || 0),
        totalRevenue: parseFloat(basicStats[0]?.totalRevenue || 0),
        avgInvoiceAmount: parseFloat(basicStats[0]?.avgInvoiceAmount || 0),
        averageRating: parseFloat(ratingStats[0]?.averageRating || 0),
        onTimePercentage: onTimePercentage
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to get delivery statistics: ${error.message}`);
    }
  }
}

module.exports = new DeliveryService();