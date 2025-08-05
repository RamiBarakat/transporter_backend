class KPIHelpers {
  /**
   * Calculate percentage change between two values
   */
  calculatePercentageChange(current, previous) {
    if (!previous || previous === 0) return 0;
    return parseFloat(((current - previous) / Math.abs(previous) * 100).toFixed(1));
  }

  /**
   * Calculate trends comparing current vs previous period
   */
  calculateTrends(currentData, previousData) {
    return {
      onTimeDelivery: this.calculatePercentageChange(
        currentData.onTimeDelivery, 
        previousData.onTimeDelivery
      ),
      costVariance: this.calculatePercentageChange(
        currentData.costVariance, 
        previousData.costVariance
      ),
      fleetUtilization: this.calculatePercentageChange(
        currentData.fleetUtilization, 
        previousData.fleetUtilization
      ),
      driverPerformance: this.calculatePercentageChange(
        currentData.driverPerformance, 
        previousData.driverPerformance
      )
    };
  }

  /**
   * Generate AI insights for KPIs
   */
  generateKPIInsights(data) {
    return {
      onTimeDelivery: this.generateOnTimeInsight(data.onTimeDelivery),
      costVariance: this.generateCostInsight(data.costVariance),
      fleetUtilization: this.generateUtilizationInsight(data.fleetUtilization),
      driverPerformance: this.generatePerformanceInsight(data.driverPerformance)
    };
  }

  /**
   * Generate insights for on-time delivery performance
   */
  generateOnTimeInsight(data) {
    const rate = data.rate || 0;
    if (rate >= 95) return "Excellent on-time performance maintained";
    if (rate >= 85) return "Good performance with room for minor improvements";
    if (rate >= 70) return "Performance needs attention - consider route optimization";
    return "Critical performance issue - immediate action required";
  }

  /**
   * Generate insights for cost variance
   */
  generateCostInsight(data) {
    const variance = data.variance || 0;
    if (variance <= -10) return "Exceptional cost savings achieved";
    if (variance <= -5) return "Good cost management with savings realized";
    if (variance <= 5) return "Costs are within acceptable variance range";
    return "Cost overruns detected - review pricing and efficiency";
  }

  /**
   * Generate insights for fleet utilization
   */
  generateUtilizationInsight(data) {
    const rate = data.rate || 0;
    if (rate >= 85) return "High fleet utilization - consider expansion";
    if (rate >= 70) return "Good utilization with optimization opportunities";
    if (rate >= 50) return "Moderate utilization - improve scheduling efficiency";
    return "Low utilization - significant optimization needed";
  }

  /**
   * Generate insights for driver performance
   */
  generatePerformanceInsight(data) {
    const avg = data.average || 0;
    if (avg >= 4.5) return "Outstanding driver performance across the board";
    if (avg >= 4.0) return "Good driver performance with consistent quality";
    if (avg >= 3.5) return "Average performance - consider targeted training";
    return "Below-average performance - immediate intervention needed";
  }

  /**
   * Get previous period date range
   */
  getPreviousPeriodDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    // Calculate previous period dates
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - daysDiff);

    return {
      startDate: prevStart.toISOString().split('T')[0],
      endDate: prevEnd.toISOString().split('T')[0]
    };
  }
}

module.exports = new KPIHelpers();