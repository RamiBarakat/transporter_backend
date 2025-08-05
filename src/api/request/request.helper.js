const { Op } = require('sequelize');

/**
 * Request Helper - Contains pure utility functions for request operations
 * No database operations should be performed here
 */
class RequestHelper {


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


  calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return parseFloat((sum / numbers.length).toFixed(2));
  }


  generateRequestNumber() {
    return `REQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  }


  calculatePerformanceDistribution(metrics) {
    const distribution = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0
    };

    metrics.forEach(metric => {
      const grade = metric.performanceGrade.toLowerCase();
      if (distribution.hasOwnProperty(grade)) {
        distribution[grade]++;
      }
    });

    return distribution;
  }


  calculateAverageMetrics(metrics) {
    return {
      avgDelayMinutes: this.calculateAverage(metrics.map(m => m.delayMinutes)),
      avgTruckVariance: this.calculateAverage(metrics.map(m => m.truckVariance)),
      avgCostVariance: this.calculateAverage(metrics.map(m => m.costVariance)),
      avgTruckVariancePercentage: this.calculateAverage(metrics.map(m => m.truckVariancePercentage)),
      avgCostVariancePercentage: this.calculateAverage(metrics.map(m => m.costVariancePercentage))
    };
  }


  buildDateRangeFilter(dateFrom, dateTo) {
    const dateFilter = {};
    if (dateFrom) dateFilter[Op.gte] = dateFrom;
    if (dateTo) dateFilter[Op.lte] = dateTo;
    return dateFilter;
  }
}

module.exports = RequestHelper;