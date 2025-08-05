const { Op } = require('sequelize');

/**
 * Delivery Helper - Contains pure utility functions for delivery operations
 * No database operations should be performed here
 */
class DeliveryHelper {


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

  formatDeliveryForEdit(delivery) {
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
      drivers: delivery.DriverRatings ? delivery.DriverRatings.map(rating => ({
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
      })) : []
    };
  }


  extractRatingData(driverData) {
    if (driverData.rating) {
      // Nested format (existing)
      return driverData.rating;
    } else {
      // Flat format (simplified) - ratings are directly on the driver object
      return {
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
  }


  buildDateRangeFilter(startDate, endDate) {
    const filter = {};
    if (startDate && endDate) {
      filter.actualPickupDateTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    return filter;
  }


  calculateRetryDelay(retryCount) {
    return Math.pow(2, retryCount) * 1000;
  }

 parseDeliveryStats(basicStats, ratingStats) {
    const totalDeliveries = parseInt(basicStats[0]?.totalDeliveries || 0);
    
    // Calculate on-time percentage (simplified assumption)
    const onTimePercentage = totalDeliveries > 0 ? 
      Math.round((totalDeliveries * 0.8) * 100) / 100 : 0;

    return {
      totalDeliveries,
      avgTruckCount: parseFloat(basicStats[0]?.avgTruckCount || 0),
      totalRevenue: parseFloat(basicStats[0]?.totalRevenue || 0),
      avgInvoiceAmount: parseFloat(basicStats[0]?.avgInvoiceAmount || 0),
      averageRating: parseFloat(ratingStats[0]?.averageRating || 0),
      onTimePercentage
    };
  }


  formatPaginationResponse(result, page, limit) {
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
  }


  extractSubmittedRatingIds(drivers) {
    return drivers
      .map(d => d.ratingId)
      .filter(Boolean);
  }


  findRatingsToDelete(existingRatings, submittedRatingIds) {
    return existingRatings.filter(rating => 
      !submittedRatingIds.includes(rating.id)
    );
  }


  validateDriverData(driverData) {
    const errors = [];

    if (!driverData.driver_id && !driverData.id && !driverData.name) {
      errors.push('Driver must have either driver_id, id, or name for new driver creation');
    }

    const ratingData = this.extractRatingData(driverData);
    const requiredRatingFields = ['punctuality', 'professionalism'];
    
    for (const field of requiredRatingFields) {
      if (!ratingData[field]) {
        errors.push(`Rating field '${field}' is required`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }


  formatDriverUpdateData(driver) {
    return {
      id: driver.id,
      totalDeliveries: driver.totalDeliveries + 1,
      lastDelivery: new Date()
    };
  }


  formatDeliverySuccessResponse(delivery, drivers) {
    return {
      delivery,
      drivers
    };
  }


  formatDeliveryConfirmationResponse(requestId, status) {
    return {
      success: true,
      message: 'Delivery confirmed as completed',
      requestId: requestId,
      status: status
    };
  }
}

module.exports = DeliveryHelper;