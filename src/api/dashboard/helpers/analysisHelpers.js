class AnalysisHelpers {
  /**
   * Process route data and generate insights
   */
  processRouteInsights(routeData) {
    const insights = [];

    routeData.forEach((route, index) => {
      if (route.on_time_rate < 80) {
        insights.push({
          id: `route-optimization-${index + 1}`,
          title: "Route Optimization Opportunity",
          description: `${route.origin}-${route.destination} route shows ${(100 - route.on_time_rate).toFixed(1)}% late delivery rate`,
          severity: route.on_time_rate < 60 ? "high" : "medium",
          recommendation: `Review pickup time scheduling for this route`
        });
      }

      if (route.avg_cost_variance > 10) {
        insights.push({
          id: `cost-route-${index + 1}`,
          title: "Route Cost Variance Alert",
          description: `${route.origin}-${route.destination} route costs are ${route.avg_cost_variance.toFixed(1)}% over estimate`,
          severity: route.avg_cost_variance > 20 ? "high" : "medium",
          recommendation: `Review route efficiency and consider alternative routing options`
        });
      }
    });

    return insights;
  }

  /**
   * Process cost data and generate insights
   */
  processCostInsights(costData) {
    const insights = [];
    const avgCost = costData.avg_invoice || 0;
    const stdDev = costData.stddev_invoice || 0;

    if (stdDev > avgCost * 0.3) { // High variance in costs
      insights.push({
        id: "cost-variance-high",
        title: "High Cost Variance Detected",
        description: `Cost variability is ${(stdDev / avgCost * 100).toFixed(1)}% of average cost`,
        severity: "medium",
        recommendation: "Review pricing strategy and standardize cost estimation methods"
      });
    }

    return insights;
  }

  /**
   * Process driver data and generate insights
   */
  processDriverInsights(driverData) {
    const insights = [];

    driverData.forEach((driver) => {
      if (driver.avg_rating < 3.5) {
        insights.push({
          id: `driver-performance-${driver.id}`,
          title: "Driver Performance Alert",
          description: `Driver ${driver.name} has below-average rating of ${driver.avg_rating.toFixed(1)}/5`,
          severity: driver.avg_rating < 3.0 ? "high" : "medium",
          recommendation: "Consider additional training or performance review"
        });
      }

      if (driver.avg_punctuality < 3.0) {
        insights.push({
          id: `driver-punctuality-${driver.id}`,
          title: "Punctuality Concern",
          description: `Driver ${driver.name} shows poor punctuality (${driver.avg_punctuality.toFixed(1)}/5)`,
          severity: "medium",
          recommendation: "Implement punctuality training and monitoring"
        });
      }
    });

    return insights;
  }

  /**
   * Process delivery time patterns and generate insights
   */
  processDeliveryInsights(timePatterns) {
    const insights = [];

    timePatterns.forEach((pattern, index) => {
      if (pattern.on_time_rate < 75) {
        insights.push({
          id: `time-pattern-${index + 1}`,
          title: "Peak Hours Performance Issue",
          description: `Deliveries at ${pattern.delivery_hour}:00 hour show ${pattern.on_time_rate.toFixed(1)}% on-time rate`,
          severity: pattern.on_time_rate < 60 ? "high" : "medium",
          recommendation: "Consider load balancing and resource allocation for peak hours"
        });
      }
    });

    return insights;
  }

  /**
   * Generate daily trends data formatting
   */
  formatDailyTrends(startDate, endDate, dailyDataCallback) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const trends = [];

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const formattedData = {
        date: dateStr,
        dateFormatted: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      };
      
      trends.push(formattedData);
    }

    return trends;
  }
}

module.exports = new AnalysisHelpers();