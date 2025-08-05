const dashboardService = require('./dashboard.service');

class DashboardController {
  /**
   * Get KPI metrics data for dashboard
   * GET /api/dashboard/kpi?startDate=2024-07-16&endDate=2024-08-15
   */
  static async getKPIData(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      console.log(`Dashboard KPI request: ${startDate} to ${endDate}`);
      
      const kpiData = await dashboardService.calculateKPIMetrics(startDate, endDate);
      
      res.json({
        success: true,
        data: kpiData
      });
    } catch (error) {
      console.error('Dashboard KPI Error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'KPI_CALCULATION_ERROR',
          message: 'Failed to calculate KPI metrics',
          details: error.message
        }
      });
    }
  }

  /**
   * Get performance trends data for charts
   * GET /api/dashboard/trends?startDate=2024-07-16&endDate=2024-08-15
   */
  static async getPerformanceTrends(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      console.log(`Dashboard Trends request: ${startDate} to ${endDate}`);
      
      const trendsData = await dashboardService.calculatePerformanceTrends(startDate, endDate);
      
      res.json({
        success: true,
        data: trendsData
      });
    } catch (error) {
      console.error('Dashboard Trends Error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TRENDS_CALCULATION_ERROR',
          message: 'Failed to calculate performance trends',
          details: error.message
        }
      });
    }
  }

  /**
   * Get AI-powered insights and recommendations
   * GET /api/dashboard/ai-insights?startDate=2024-07-16&endDate=2024-08-15
   */
  static async getAIInsights(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      console.log(`Dashboard AI Insights request: ${startDate} to ${endDate}`);
      
      const aiInsights = await dashboardService.generateAIInsights(startDate, endDate);
      
      res.json({
        success: true,
        data: aiInsights
      });
    } catch (error) {
      console.error('Dashboard AI Insights Error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'AI_INSIGHTS_ERROR',
          message: 'Failed to generate AI insights',
          details: error.message
        }
      });
    }
  }

  /**
   * Get transporter comparison and ranking
   * GET /api/dashboard/transporter-comparison?startDate=2024-07-16&endDate=2024-08-15
   */
  static async getTransporterComparison(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      console.log(`Dashboard Transporter Comparison request: ${startDate} to ${endDate}`);
      
      const comparisonData = await dashboardService.calculateTransporterComparison(startDate, endDate);
      
      res.json({
        success: true,
        data: comparisonData
      });
    } catch (error) {
      console.error('Dashboard Transporter Comparison Error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TRANSPORTER_COMPARISON_ERROR',
          message: 'Failed to calculate transporter comparison',
          details: error.message
        }
      });
    }
  }

  /**
   * Health check for dashboard APIs
   * GET /api/dashboard/health
   */
  static async healthCheck(req, res) {
    try {
      const healthStatus = await dashboardService.getHealthStatus();
      
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        ...healthStatus
      });
    } catch (error) {
      console.error('Dashboard Health Check Error:', error);
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }
}

module.exports = DashboardController;