const { sequelize } = require('../../../config/db');

class AnalysisQueries {
  /**
   * Analyze route efficiency with SQL query
   */
  async analyzeRouteEfficiency(startDate, endDate) {
    try {
      const routeData = await sequelize.query(`
        SELECT 
          tr.origin,
          tr.destination,
          COUNT(*) as delivery_count,
          AVG(CASE 
            WHEN d.actual_pickup_datetime <= tr.pickup_datetime 
            THEN 1 ELSE 0 
          END) * 100 as on_time_rate,
          AVG(CASE 
            WHEN tr.estimated_cost > 0 
            THEN ((d.invoice_amount - tr.estimated_cost) / tr.estimated_cost * 100) 
          END) as avg_cost_variance
        FROM deliveries d
        JOIN transportation_requests tr ON d.request_id = tr.id
        WHERE DATE(d.actual_pickup_datetime) BETWEEN :startDate AND :endDate
          AND tr.deleted_at IS NULL
        GROUP BY tr.origin, tr.destination
        HAVING COUNT(*) >= 1
        ORDER BY delivery_count DESC
        LIMIT 5
      `, {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT
      });

      return routeData;
    } catch (error) {
      console.error('Error analyzing route efficiency:', error);
      return [];
    }
  }

  /**
   * Analyze cost anomalies with SQL query
   */
  async analyzeCostAnomalies(startDate, endDate) {
    try {
      const costData = await sequelize.query(`
        SELECT 
          AVG(d.invoice_amount) as avg_invoice,
          STDDEV(d.invoice_amount) as stddev_invoice,
          COUNT(*) as delivery_count
        FROM deliveries d
        WHERE DATE(d.actual_pickup_datetime) BETWEEN :startDate AND :endDate
          AND d.invoice_amount > 0
      `, {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT
      });

      return costData[0] || { avg_invoice: 0, stddev_invoice: 0, delivery_count: 0 };
    } catch (error) {
      console.error('Error analyzing cost anomalies:', error);
      return { avg_invoice: 0, stddev_invoice: 0, delivery_count: 0 };
    }
  }

  /**
   * Analyze driver patterns with SQL query
   */
  async analyzeDriverPatterns(startDate, endDate) {
    try {
      const driverData = await sequelize.query(`
        SELECT 
          d.id,
          d.name,
          COUNT(dr.id) as rating_count,
          AVG(dr.overall_rating) as avg_rating,
          AVG(dr.punctuality) as avg_punctuality,
          MIN(dr.overall_rating) as min_rating
        FROM drivers d
        JOIN driver_ratings dr ON d.id = dr.driver_id
        JOIN deliveries del ON dr.delivery_id = del.id
        WHERE DATE(del.actual_pickup_datetime) BETWEEN :startDate AND :endDate
          AND del.deleted_at IS NULL
        GROUP BY d.id, d.name
        HAVING COUNT(dr.id) >= 2
      `, {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT
      });

      return driverData;
    } catch (error) {
      console.error('Error analyzing driver patterns:', error);
      return [];
    }
  }

  /**
   * Analyze delivery patterns with SQL query
   */
  async analyzeDeliveryPatterns(startDate, endDate) {
    try {
      const timePatterns = await sequelize.query(`
        SELECT 
          HOUR(d.actual_pickup_datetime) as delivery_hour,
          COUNT(*) as delivery_count,
          AVG(CASE 
            WHEN d.actual_pickup_datetime <= tr.pickup_datetime 
            THEN 1 ELSE 0 
          END) * 100 as on_time_rate
        FROM deliveries d
        JOIN transportation_requests tr ON d.request_id = tr.id
        WHERE DATE(d.actual_pickup_datetime) BETWEEN :startDate AND :endDate
        GROUP BY HOUR(d.actual_pickup_datetime)
        HAVING COUNT(*) >= 5
        ORDER BY on_time_rate ASC
        LIMIT 3
      `, {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT
      });

      return timePatterns;
    } catch (error) {
      console.error('Error analyzing delivery patterns:', error);
      return [];
    }
  }

  /**
   * Calculate transporter comparison data with SQL query
   */
  async calculateTransporterComparison(startDate, endDate) {
    try {
      const transporterData = await sequelize.query(`
        SELECT 
          d.id,
          d.name as company,
          d.transport_company,
          COUNT(DISTINCT del.id) as total_deliveries,
          AVG(CASE 
            WHEN del.actual_pickup_datetime <= tr.pickup_datetime 
            THEN 1 ELSE 0 
          END) * 100 as on_time_rate,
          AVG(CASE 
            WHEN tr.estimated_cost > 0 
            THEN ((del.invoice_amount - tr.estimated_cost) / tr.estimated_cost * 100) 
          END) as cost_variance,
          AVG(dr.overall_rating) as driver_rating,
          AVG((dr.punctuality + dr.professionalism + dr.delivery_quality + dr.communication) / 4) as quality_score
        FROM drivers d
        JOIN driver_ratings dr ON d.id = dr.driver_id
        JOIN deliveries del ON dr.delivery_id = del.id
        JOIN transportation_requests tr ON del.request_id = tr.id
        WHERE DATE(del.actual_pickup_datetime) BETWEEN :startDate AND :endDate
          AND tr.deleted_at IS NULL
          AND d.type = 'transporter'
        GROUP BY d.id, d.name, d.transport_company
        HAVING COUNT(DISTINCT del.id) >= 1
        ORDER BY total_deliveries DESC
      `, {
        replacements: { startDate, endDate },
        type: sequelize.QueryTypes.SELECT
      });

      return transporterData;
    } catch (error) {
      console.error('Error calculating transporter comparison:', error);
      return [];
    }
  }

  /**
   * Get previous period data for transporter trends
   */
  async getTransporterPreviousPeriodData(driverId, startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      
      const prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - daysDiff);

      const prevStartStr = prevStart.toISOString().split('T')[0];
      const prevEndStr = prevEnd.toISOString().split('T')[0];

      const result = await sequelize.query(`
        SELECT 
          AVG(CASE 
            WHEN del.actual_pickup_datetime <= tr.pickup_datetime 
            THEN 1 ELSE 0 
          END) * 100 as on_time_rate,
          AVG(CASE 
            WHEN tr.estimated_cost > 0 
            THEN ((del.invoice_amount - tr.estimated_cost) / tr.estimated_cost * 100) 
          END) as cost_variance,
          AVG(dr.overall_rating) as driver_rating
        FROM drivers d
        JOIN driver_ratings dr ON d.id = dr.driver_id
        JOIN deliveries del ON dr.delivery_id = del.id
        JOIN transportation_requests tr ON del.request_id = tr.id
        WHERE DATE(del.actual_pickup_datetime) BETWEEN :startDate AND :endDate
          AND del.deleted_at IS NULL
          AND d.id = :driverId
      `, {
        replacements: { startDate: prevStartStr, endDate: prevEndStr, driverId },
        type: sequelize.QueryTypes.SELECT
      });

      return result[0] || { on_time_rate: 0, cost_variance: 0, driver_rating: 0 };
    } catch (error) {
      console.error('Error getting transporter previous period data:', error);
      return { on_time_rate: 0, cost_variance: 0, driver_rating: 0 };
    }
  }
}

module.exports = new AnalysisQueries();