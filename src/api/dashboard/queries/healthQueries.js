const { sequelize } = require('../../../config/db');
const { TransportationRequest, Driver, Delivery, DriverRating } = require('../../../models');

class HealthQueries {
  /**
   * Check database connection health
   */
  async checkDatabaseHealth() {
    try {
      await sequelize.authenticate();
      return { status: 'healthy', message: 'Database connection OK' };
    } catch (error) {
      return { status: 'unhealthy', message: `Database error: ${error.message}` };
    }
  }

  /**
   * Check data availability across all models
   */
  async checkDataAvailability() {
    try {
      const counts = await Promise.all([
        TransportationRequest.count(),
        Delivery.count(),
        Driver.count(),
        DriverRating.count()
      ]);

      return { 
        status: 'healthy', 
        message: 'Data available',
        counts: {
          requests: counts[0],
          deliveries: counts[1],
          drivers: counts[2],
          ratings: counts[3]
        }
      };
    } catch (error) {
      return { status: 'unhealthy', message: `Data check error: ${error.message}` };
    }
  }
}

module.exports = new HealthQueries();