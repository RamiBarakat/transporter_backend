const { sequelize } = require('../../config/db');
const { TransportationRequest, Driver, Delivery, DriverRating } = require('../../models');
const { Op } = require('sequelize');
const dashboardAiService = require('../../services/dashboardAiService');

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
        this.calculateOnTimeDeliveryRate(startDate, endDate),
        this.calculateCostVariance(startDate, endDate),
        this.calculateFleetUtilization(startDate, endDate),
        this.calculateDriverPerformance(startDate, endDate),
        this.getPreviousPeriodData(startDate, endDate)
      ]);

      //add line break between them
      console.log("--------------------------------");
      console.log(onTimeDeliveryData);
      console.log("--------------------------------");
      //console.log(onTimeDeliveryData, costVarianceData, fleetUtilizationData, driverPerformanceData, previousPeriodData);
      // Calculate trends (comparison with previous period)
      const trends = this.calculateTrends(
        {
          onTimeDelivery: onTimeDeliveryData.rate,
          costVariance: costVarianceData.variance,
          fleetUtilization: fleetUtilizationData.rate,
          driverPerformance: driverPerformanceData.average
        },
        previousPeriodData
      );

      const aiInsights = this.generateKPIInsights({
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

  /**
   * Get previous period data for trend calculation
   */
  async getPreviousPeriodData(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      
      // Calculate previous period dates
      const prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - daysDiff);

      const prevStartStr = prevStart.toISOString().split('T')[0];
      const prevEndStr = prevEnd.toISOString().split('T')[0];

      const [
        prevOnTimeDelivery,
        prevCostVariance,
        prevFleetUtilization,
        prevDriverPerformance
      ] = await Promise.all([
        this.calculateOnTimeDeliveryRate(prevStartStr, prevEndStr),
        this.calculateCostVariance(prevStartStr, prevEndStr),
        this.calculateFleetUtilization(prevStartStr, prevEndStr),
        this.calculateDriverPerformance(prevStartStr, prevEndStr)
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
   * Calculate percentage change between two values
   */
  calculatePercentageChange(current, previous) {
    if (!previous || previous === 0) return 0;
    return parseFloat(((current - previous) / Math.abs(previous) * 100).toFixed(1));
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

  generateOnTimeInsight(data) {
    const rate = data.rate || 0;
    if (rate >= 95) return "Excellent on-time performance maintained";
    if (rate >= 85) return "Good performance with room for minor improvements";
    if (rate >= 70) return "Performance needs attention - consider route optimization";
    return "Critical performance issue - immediate action required";
  }

  generateCostInsight(data) {
    const variance = data.variance || 0;
    if (variance <= -10) return "Exceptional cost savings achieved";
    if (variance <= -5) return "Good cost management with savings realized";
    if (variance <= 5) return "Costs are within acceptable variance range";
    return "Cost overruns detected - review pricing and efficiency";
  }

  generateUtilizationInsight(data) {
    const rate = data.rate || 0;
    if (rate >= 85) return "High fleet utilization - consider expansion";
    if (rate >= 70) return "Good utilization with optimization opportunities";
    if (rate >= 50) return "Moderate utilization - improve scheduling efficiency";
    return "Low utilization - significant optimization needed";
  }

  generatePerformanceInsight(data) {
    const avg = data.average || 0;
    if (avg >= 4.5) return "Outstanding driver performance across the board";
    if (avg >= 4.0) return "Good driver performance with consistent quality";
    if (avg >= 3.5) return "Average performance - consider targeted training";
    return "Below-average performance - immediate intervention needed";
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
          this.calculateOnTimeDeliveryRate(dateStr, dateStr),
          this.calculateCostVariance(dateStr, dateStr),
          this.calculateFleetUtilization(dateStr, dateStr),
          this.calculateDriverPerformance(dateStr, dateStr)
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

      const routeInsights = await this.analyzeRouteEfficiency(startDate, endDate);
      insights.push(...routeInsights);

      const costInsights = await this.analyzeCostAnomalies(startDate, endDate);
      insights.push(...costInsights);

      const driverInsights = await this.analyzeDriverPatterns(startDate, endDate);
      insights.push(...driverInsights);

      const deliveryInsights = await this.analyzeDeliveryPatterns(startDate, endDate);
      insights.push(...deliveryInsights);

      //console.log(insights, "here is insights");
      // Generate AI-enhanced insights using the collected data
      const enhancedInsights = await dashboardAiService.generateEnhancedAIInsights(
        insights,
        startDate,
        endDate
      );
      console.log(enhancedInsights, "here is enhanced insights");

      return enhancedInsights;
    } catch (error) {
      console.error('Error generating AI insights:', error);
      throw new Error(`AI insights generation failed: ${error.message}`);
    }
  }

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
    } catch (error) {
      console.error('Error analyzing route efficiency:', error);
      return [];
    }
  }

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

      const insights = [];
      const avgCost = costData[0]?.avg_invoice || 0;
      const stdDev = costData[0]?.stddev_invoice || 0;

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
    } catch (error) {
      console.error('Error analyzing cost anomalies:', error);
      return [];
    }
  }

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

      const insights = [];

      driverData.forEach((driver, index) => {
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
    } catch (error) {
      console.error('Error analyzing driver patterns:', error);
      return [];
    }
  }

  async analyzeDeliveryPatterns(startDate, endDate) {
    try {
      const insights = [];

      // Analyze delivery time patterns
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
    } catch (error) {
      console.error('Error analyzing delivery patterns:', error);
      return [];
    }
  }

  /**
   * Calculate transporter comparison and ranking
   */
  async calculateTransporterComparison(startDate, endDate) {
    try {
      // Get transporters and their performance metrics
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

      // Calculate AI scores and trends for each transporter
      const transportersWithScores = await Promise.all(
        transporterData.map(async (transporter) => {
          const score = this.calculateTransporterScore({
            onTimeRate: transporter.on_time_rate || 0,
            costVariance: transporter.cost_variance || 0,
            driverRating: transporter.driver_rating || 0,
            qualityScore: transporter.quality_score || 0
          });

          // Get previous period data for trends
          const previousData = await this.getTransporterPreviousPeriodData(
            transporter.id, startDate, endDate
          );

          const trends = this.calculateTransporterTrends(transporter, previousData);

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
        })
      );

      // Sort by AI score descending
      return transportersWithScores.sort((a, b) => b.score - a.score);

      // const sortedTransporters = transportersWithScores.sort((a, b) => b.aiScore - a.aiScore);

      // // Generate AI analysis for the transporter data
      // const trends = transportersWithScores.reduce((acc, transporter) => {
      //   acc[transporter.id] = {
      //     aiScore: transporter.scoreTrend,
      //     onTimeRate: transporter.onTimeTrend,
      //     costVariance: transporter.costTrend
      //   };
      //   return acc;
      // }, {});

      // const aiAnalysis = await dashboardAiService.generateTransporterAIAnalysis(
      //   sortedTransporters,
      //   trends
      // );

      // return {
      //   transporters: sortedTransporters,
      //   aiAnalysis: aiAnalysis
      //};
    } catch (error) {
      console.error('Error calculating transporter comparison:', error);
      throw new Error(`Transporter comparison failed: ${error.message}`);
    }
  }

  calculateTransporterScore(metrics) {
    const weights = {
      onTimeRate: 0.30,      // 30% weight
      costEfficiency: 0.25,  // 25% weight (cost savings)
      driverRating: 0.20,    // 20% weight
      qualityScore: 0.25     // 25% weight
    };

    // Normalizizing the cost
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
   * Get health status of dashboard system
   */
  async getHealthStatus() {
    try {
      const checks = await Promise.all([
        this.checkDatabaseHealth(),
        this.checkDataAvailability()
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

  async checkDatabaseHealth() {
    try {
      await sequelize.authenticate();
      return { status: 'healthy', message: 'Database connection OK' };
    } catch (error) {
      return { status: 'unhealthy', message: `Database error: ${error.message}` };
    }
  }

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

module.exports = new DashboardService();