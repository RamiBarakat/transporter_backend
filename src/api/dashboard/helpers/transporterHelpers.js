class TransporterHelpers {
  /**
   * Calculate transporter AI score based on multiple metrics
   */
  calculateTransporterScore(metrics) {
    const weights = {
      onTimeRate: 0.30,      // 30% weight
      costEfficiency: 0.25,  // 25% weight (cost savings)
      driverRating: 0.20,    // 20% weight
      qualityScore: 0.25     // 25% weight
    };

    // Normalize the cost efficiency (invert cost variance to efficiency)
    const costEfficiency = Math.max(0, 100 + (metrics.costVariance * -1));
    
    // Convert driver rating to percentage (4.5/5 = 90%)
    const driverPercentage = (metrics.driverRating / 5) * 100;
    
    const score = (
      metrics.onTimeRate * weights.onTimeRate +
      costEfficiency * weights.costEfficiency +
      driverPercentage * weights.driverRating +
      metrics.qualityScore * weights.qualityScore
    );

    return Math.min(100, Math.max(0, score)); // Clamp between 0-100
  }

  /**
   * Calculate trends for transporter metrics
   */
  calculateTransporterTrends(current, previous) {
    const currentScore = this.calculateTransporterScore({
      onTimeRate: current.on_time_rate || 0,
      costVariance: current.cost_variance || 0,
      driverRating: current.driver_rating || 0,
      qualityScore: current.quality_score || 0
    });

    const previousScore = this.calculateTransporterScore({
      onTimeRate: previous.on_time_rate || 0,
      costVariance: previous.cost_variance || 0,
      driverRating: previous.driver_rating || 0,
      qualityScore: previous.quality_score || 0
    });

    return {
      score: this.calculatePercentageChange(currentScore, previousScore),
      onTimeRate: this.calculatePercentageChange(
        current.on_time_rate, 
        previous.on_time_rate
      ),
      costVariance: this.calculatePercentageChange(
        current.cost_variance, 
        previous.cost_variance
      )
    };
  }

  /**
   * Format transporter data for response
   */
  formatTransporterData(transporter, score, trends) {
    return {
      id: transporter.company.toLowerCase().replace(/\s+/g, '-'),
      company: transporter.transport_company || transporter.company,
      totalDeliveries: parseInt(transporter.total_deliveries) || 0,
      score: parseFloat(score.toFixed(1)),
      scoreTrend: trends.score,
      onTimeRate: parseFloat((transporter.on_time_rate || 0).toFixed(1)),
      onTimeTrend: trends.onTimeRate,
      costVariance: parseFloat((transporter.cost_variance || 0).toFixed(1)),
      costTrend: trends.costVariance,
      driverRating: parseFloat((transporter.driver_rating || 0).toFixed(1)),
      qualityScore: parseFloat((transporter.quality_score || 0).toFixed(1))
    };
  }

  /**
   * Calculate percentage change between two values (reused from KPI helpers)
   */
  calculatePercentageChange(current, previous) {
    if (!previous || previous === 0) return 0;
    return parseFloat(((current - previous) / Math.abs(previous) * 100).toFixed(1));
  }

  /**
   * Sort transporters by specified criteria
   */
  sortTransporters(transporters, sortBy = 'score') {
    const sortFunctions = {
      score: (a, b) => b.score - a.score,
      onTimeRate: (a, b) => b.onTimeRate - a.onTimeRate,
      totalDeliveries: (a, b) => b.totalDeliveries - a.totalDeliveries,
      driverRating: (a, b) => b.driverRating - a.driverRating,
      costVariance: (a, b) => a.costVariance - b.costVariance // Lower is better
    };

    return transporters.sort(sortFunctions[sortBy] || sortFunctions.score);
  }

  /**
   * Filter transporters by minimum deliveries
   */
  filterByMinDeliveries(transporters, minDeliveries = 1) {
    return transporters.filter(t => t.totalDeliveries >= minDeliveries);
  }
}

module.exports = new TransporterHelpers();