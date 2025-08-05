const { sequelize } = require('../../../config/db');

class KPIQueries {
  /**
   * Calculate on-time delivery rate
   */
  async calculateOnTimeDeliveryRate(startDate, endDate) {
    try {
      const result = await sequelize.query(`
        SELECT 
          COUNT(*) as total_deliveries,
          COUNT(CASE 
            WHEN d.actual_pickup_datetime <= tr.pickup_datetime 
            THEN 1 
          END) as on_time_deliveries,
          (COUNT(CASE 
            WHEN d.actual_pickup_datetime <= tr.pickup_datetime 
            THEN 1 
          END) * 100.0 / COUNT(*)) as on_time_rate
        FROM deliveries d
        JOIN transportation_requests tr ON d.request_id = tr.id
        WHERE DATE(d.actual_pickup_datetime) BETWEEN :startDate AND :endDate
          AND tr.deleted_at IS NULL
      `, {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT
      });

      return {
        rate: result[0]?.on_time_rate || 0,
        total: result[0]?.total_deliveries || 0,
        onTime: result[0]?.on_time_deliveries || 0
      };
    } catch (error) {
      console.error('Error calculating on-time delivery rate:', error);
      return { rate: 0, total: 0, onTime: 0 };
    }
  }

  /**
   * Calculate cost variance
   */
  async calculateCostVariance(startDate, endDate) {
    try {
      const result = await sequelize.query(`
        SELECT 
          AVG(CASE 
            WHEN tr.estimated_cost > 0 
            THEN ((d.invoice_amount - tr.estimated_cost) / tr.estimated_cost * 100) 
          END) as avg_variance,
          COUNT(*) as total_with_costs
        FROM deliveries d
        JOIN transportation_requests tr ON d.request_id = tr.id
        WHERE DATE(d.actual_pickup_datetime) BETWEEN :startDate AND :endDate
          AND tr.deleted_at IS NULL
          AND tr.estimated_cost > 0
          AND d.invoice_amount > 0
      `, {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT
      });

      return {
        variance: result[0]?.avg_variance || 0,
        totalWithCosts: result[0]?.total_with_costs || 0
      };
    } catch (error) {
      console.error('Error calculating cost variance:', error);
      return { variance: 0, totalWithCosts: 0 };
    }
  }

  /**
   * Calculate fleet utilization
   */
  async calculateFleetUtilization(startDate, endDate) {
    try {
      // Get unique drivers used during the period
      const activeDriversResult = await sequelize.query(`
        SELECT COUNT(DISTINCT dr.driver_id) as active_drivers
        FROM driver_ratings dr
        JOIN deliveries d ON dr.delivery_id = d.id
        WHERE DATE(d.actual_pickup_datetime) BETWEEN :startDate AND :endDate
      `, {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT
      });

      // Get total available drivers
      const totalDriversResult = await sequelize.query(`
        SELECT COUNT(*) as total_drivers
        FROM drivers
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      const activeDrivers = activeDriversResult[0]?.active_drivers || 0;
      const totalDrivers = totalDriversResult[0]?.total_drivers || 1;
      const utilizationRate = (activeDrivers / totalDrivers) * 100;

      return {
        rate: utilizationRate,
        activeDrivers,
        totalDrivers
      };
    } catch (error) {
      console.error('Error calculating fleet utilization:', error);
      return { rate: 0, activeDrivers: 0, totalDrivers: 0 };
    }
  }

  /**
   * Calculate driver performance average
   */
  async calculateDriverPerformance(startDate, endDate) {
    try {
      const result = await sequelize.query(`
        SELECT 
          AVG(dr.overall_rating) as avg_rating,
          COUNT(*) as total_ratings
        FROM driver_ratings dr
        JOIN deliveries d ON dr.delivery_id = d.id
        WHERE DATE(d.actual_pickup_datetime) BETWEEN :startDate AND :endDate
          AND dr.overall_rating IS NOT NULL
      `, {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT
      });

      return {
        average: result[0]?.avg_rating || 0,
        totalRatings: result[0]?.total_ratings || 0
      };
    } catch (error) {
      console.error('Error calculating driver performance:', error);
      return { average: 0, totalRatings: 0 };
    }
  }
}

module.exports = new KPIQueries();