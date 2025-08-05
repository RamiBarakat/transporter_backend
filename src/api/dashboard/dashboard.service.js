const dashboardAiService = require('../../services/dashboardAiService');

// Import query modules
const kpiQueries = require('./queries/kpiQueries');
const analysisQueries = require('./queries/analysisQueries');
const healthQueries = require('./queries/healthQueries');

// Import helper modules
const kpiHelpers = require('./helpers/kpiHelpers');
const analysisHelpers = require('./helpers/analysisHelpers');
const transporterHelpers = require('./helpers/transporterHelpers');

class DashboardService {
  /**
   * Calculate KPI metrics for the dashboard
   */
  async calculateKPIMetrics(startDate, endDate) {
    try {
      const cacheKey = `kpi:${startDate}:${endDate}`;
      
      // Calculate all KPIs in parallel for better performance
      const [
        onTimeDeliveryData,
        costVarianceData,
        fleetUtilizationData,
        driverPerformanceData,
        previousPeriodData
      ] = await Promise.all([
        kpiQueries.calculateOnTimeDeliveryRate(startDate, endDate),
        kpiQueries.calculateCostVariance(startDate, endDate),
        kpiQueries.calculateFleetUtilization(startDate, endDate),
        kpiQueries.calculateDriverPerformance(startDate, endDate),
        this.getPreviousPeriodData(startDate, endDate)
      ]);

      //add line break between them
      //console.log(onTimeDeliveryData, costVarianceData, fleetUtilizationData, driverPerformanceData, previousPeriodData);
      // Calculate trends (comparison with previous period)
      const trends = kpiHelpers.calculateTrends(
        {
          onTimeDelivery: onTimeDeliveryData.rate,
          costVariance: costVarianceData.variance,
          fleetUtilization: fleetUtilizationData.rate,
          driverPerformance: driverPerformanceData.average
        },
        previousPeriodData
      );

      const aiInsights = kpiHelpers.generateKPIInsights({
        onTimeDelivery: onTimeDeliveryData,
        costVariance: costVarianceData,
        fleetUtilization: fleetUtilizationData,
        driverPerformance: driverPerformanceData
      });

      return [
        {
          id: "on-time-delivery",
          title: "On-Time Delivery Rate",
          value: parseFloat(onTimeDeliveryData.rate?.toFixed(1) || 0),
          unit: "%",
          trend: trends.onTimeDelivery,
          comparison: { 
            change: trends.onTimeDelivery, 
            period: "last month" 
          },
          aiInsight: aiInsights.onTimeDelivery
        },
        {
          id: "cost-variance",
          title: "Cost Variance",
          value: parseFloat(costVarianceData.variance?.toFixed(1) || 0),
          unit: "%",
          trend: trends.costVariance,
          comparison: { 
            change: trends.costVariance, 
            period: "last month" 
          },
          aiInsight: aiInsights.costVariance
        },
        {
          id: "fleet-utilization",
          title: "Fleet Utilization",
          value: parseFloat(fleetUtilizationData.rate?.toFixed(1) || 0),
          unit: "%",
          trend: trends.fleetUtilization,
          comparison: { 
            change: trends.fleetUtilization, 
            period: "last month" 
          },
          aiInsight: aiInsights.fleetUtilization
        },
        {
          id: "driver-performance",
          title: "Driver Performance",
          value: parseFloat(driverPerformanceData.average?.toFixed(1) || 0),
          unit: "/5",
          trend: trends.driverPerformance,
          comparison: { 
            change: trends.driverPerformance, 
            period: "last month" 
          },
          aiInsight: aiInsights.driverPerformance
        }
      ];
    } catch (error) {
      console.error('Error calculating KPI metrics:', error);
      throw new Error(`KPI calculation failed: ${error.message}`);
    }
  }



  /**
   * Get previous period data for trend calculation
   */
  async getPreviousPeriodData(startDate, endDate) {
    try {
      const dateRange = kpiHelpers.getPreviousPeriodDateRange(startDate, endDate);

      const [
        prevOnTimeDelivery,
        prevCostVariance,
        prevFleetUtilization,
        prevDriverPerformance
      ] = await Promise.all([
        kpiQueries.calculateOnTimeDeliveryRate(dateRange.startDate, dateRange.endDate),
        kpiQueries.calculateCostVariance(dateRange.startDate, dateRange.endDate),
        kpiQueries.calculateFleetUtilization(dateRange.startDate, dateRange.endDate),
        kpiQueries.calculateDriverPerformance(dateRange.startDate, dateRange.endDate)
      ]);

      return {
        onTimeDelivery: prevOnTimeDelivery.rate,
        costVariance: prevCostVariance.variance,
        fleetUtilization: prevFleetUtilization.rate,
        driverPerformance: prevDriverPerformance.average
      };
    } catch (error) {
      console.error('Error getting previous period data:', error);
      return {
        onTimeDelivery: 0,
        costVariance: 0,
        fleetUtilization: 0,
        driverPerformance: 0
      };
    }
  }





  //===============================================
  //===============================================
  /**
   * Calculate daily performance trends for charts
   */
  async calculatePerformanceTrends(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const trends = [];

      // Generate daily data points
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        
        const [
          onTimeData,
          costData,
          utilizationData,
          performanceData
        ] = await Promise.all([
          kpiQueries.calculateOnTimeDeliveryRate(dateStr, dateStr),
          kpiQueries.calculateCostVariance(dateStr, dateStr),
          kpiQueries.calculateFleetUtilization(dateStr, dateStr),
          kpiQueries.calculateDriverPerformance(dateStr, dateStr)
        ]);

        trends.push({
          date: dateStr,
          dateFormatted: date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          onTimeDelivery: parseFloat(onTimeData.rate?.toFixed(1) || 0),
          costVariance: parseFloat(costData.variance?.toFixed(1) || 0),
          fleetUtilization: parseFloat(utilizationData.rate?.toFixed(1) || 0),
          driverPerformance: parseFloat(performanceData.average?.toFixed(1) || 0)
        });
      }

      return trends;
    } catch (error) {
      console.error('Error calculating performance trends:', error);
      throw new Error(`Trends calculation failed: ${error.message}`);
    }
  }

  /**
   * Generate AI insights with smart recommendations
   */
  async generateAIInsights(startDate, endDate) {
    try {
      const insights = [];

      const routeData = await analysisQueries.analyzeRouteEfficiency(startDate, endDate);
      const routeInsights = analysisHelpers.processRouteInsights(routeData);
      insights.push(...routeInsights);

      const costData = await analysisQueries.analyzeCostAnomalies(startDate, endDate);
      const costInsights = analysisHelpers.processCostInsights(costData);
      insights.push(...costInsights);

      const driverData = await analysisQueries.analyzeDriverPatterns(startDate, endDate);
      const driverInsights = analysisHelpers.processDriverInsights(driverData);
      insights.push(...driverInsights);

      const timePatterns = await analysisQueries.analyzeDeliveryPatterns(startDate, endDate);
      const deliveryInsights = analysisHelpers.processDeliveryInsights(timePatterns);
      insights.push(...deliveryInsights);

      //console.log(insights, "here is insights");
      // Generate AI-enhanced insights using the collected data
      const enhancedInsights = await dashboardAiService.generateEnhancedAIInsights(
        insights,
        startDate,
        endDate
      );
      //console.log(enhancedInsights, "here is enhanced insights");

      return enhancedInsights;
    } catch (error) {
      console.error('Error generating AI insights:', error);
      throw new Error(`AI insights generation failed: ${error.message}`);
    }
  }



  /**
   * Calculate transporter comparison and ranking
   */
  async calculateTransporterComparison(startDate, endDate) {
    try {
      // Get transporters and their performance metrics
      const transporterData = await analysisQueries.calculateTransporterComparison(startDate, endDate);

      // Calculate AI scores and trends for each transporter
      const transportersWithScores = await Promise.all(
        transporterData.map(async (transporter) => {
          const score = transporterHelpers.calculateTransporterScore({
            onTimeRate: transporter.on_time_rate || 0,
            costVariance: transporter.cost_variance || 0,
            driverRating: transporter.driver_rating || 0,
            qualityScore: transporter.quality_score || 0
          });

          // Get previous period data for trends
          const previousData = await analysisQueries.getTransporterPreviousPeriodData(
            transporter.id, startDate, endDate
          );

          const trends = transporterHelpers.calculateTransporterTrends(transporter, previousData);

          return transporterHelpers.formatTransporterData(transporter, score, trends);
        })
      );

      // Sort by AI score descending
      return transporterHelpers.sortTransporters(transportersWithScores, 'score');
    } catch (error) {
      console.error('Error calculating transporter comparison:', error);
      throw new Error(`Transporter comparison failed: ${error.message}`);
    }
  }



  /**
   * Get health status of dashboard system
   */
  async getHealthStatus() {
    try {
      const checks = await Promise.all([
        healthQueries.checkDatabaseHealth(),
        healthQueries.checkDataAvailability()
      ]);

      return {
        database: checks[0],
        dataAvailability: checks[1]
      };
    } catch (error) {
      console.error('Health check error:', error);
      throw new Error('Health check failed');
    }
  }
}

module.exports = new DashboardService();