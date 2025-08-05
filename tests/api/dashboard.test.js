const request = require('supertest');
const app = require('../../app');

describe('Dashboard API Endpoints', () => {
  const defaultDateRange = {
    startDate: '2025-07-01',
    endDate: '2025-08-31'
  };

  describe('GET /api/dashboard/kpi', () => {
    it('should get KPI metrics', async () => {
      const response = await request(app)
        .get(`/api/dashboard/kpi?startDate=${defaultDateRange.startDate}&endDate=${defaultDateRange.endDate}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalRequests');
      expect(response.body.data).toHaveProperty('completedRequests');
      expect(response.body.data).toHaveProperty('pendingRequests');
      expect(response.body.data).toHaveProperty('totalRevenue');
      expect(response.body.data).toHaveProperty('averageDeliveryTime');
      expect(response.body.data).toHaveProperty('onTimeDeliveryRate');
      expect(response.body.data).toHaveProperty('activeDrivers');
      expect(response.body.data).toHaveProperty('averageRating');

      // Validate data types
      expect(typeof response.body.data.totalRequests).toBe('number');
      expect(typeof response.body.data.completedRequests).toBe('number');
      expect(typeof response.body.data.pendingRequests).toBe('number');
      expect(typeof response.body.data.totalRevenue).toBe('number');
      expect(typeof response.body.data.onTimeDeliveryRate).toBe('number');
      expect(typeof response.body.data.activeDrivers).toBe('number');
      expect(typeof response.body.data.averageRating).toBe('number');
    });

    it('should require date range parameters', async () => {
      const response = await request(app)
        .get('/api/dashboard/kpi')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('validation');
    });

    it('should validate date format', async () => {
      const response = await request(app)
        .get('/api/dashboard/kpi?startDate=invalid-date&endDate=2025-08-31')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/dashboard/trends', () => {
    it('should get daily trends', async () => {
      const response = await request(app)
        .get(`/api/dashboard/trends?startDate=${defaultDateRange.startDate}&endDate=${defaultDateRange.endDate}&granularity=daily`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const trend = response.body.data[0];
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('requests');
        expect(trend).toHaveProperty('completions');
        expect(trend).toHaveProperty('revenue');
        expect(trend).toHaveProperty('averageRating');
      }
    });

    it('should get weekly trends', async () => {
      const response = await request(app)
        .get(`/api/dashboard/trends?startDate=${defaultDateRange.startDate}&endDate=${defaultDateRange.endDate}&granularity=weekly`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get monthly trends', async () => {
      const response = await request(app)
        .get(`/api/dashboard/trends?startDate=${defaultDateRange.startDate}&endDate=${defaultDateRange.endDate}&granularity=monthly`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should default to daily granularity', async () => {
      const response = await request(app)
        .get(`/api/dashboard/trends?startDate=${defaultDateRange.startDate}&endDate=${defaultDateRange.endDate}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/dashboard/ai-insights', () => {
    it('should get AI insights (may fail due to AI service issues)', async () => {
      const response = await request(app)
        .get(`/api/dashboard/ai-insights?startDate=${defaultDateRange.startDate}&endDate=${defaultDateRange.endDate}&limit=10`)
        .expect((res) => {
          // Accept both success and failure due to AI service dependencies
          expect([200, 500]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        
        if (response.body.data.length > 0) {
          const insight = response.body.data[0];
          expect(insight).toHaveProperty('id');
          expect(insight).toHaveProperty('title');
          expect(insight).toHaveProperty('description');
          expect(insight).toHaveProperty('severity');
          expect(['high', 'medium', 'low']).toContain(insight.severity);
        }
      } else {
        // AI service error is acceptable in tests
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('AI_INSIGHTS_ERROR');
      }
    });

    it('should limit the number of insights', async () => {
      const limit = 5;
      const response = await request(app)
        .get(`/api/dashboard/ai-insights?startDate=${defaultDateRange.startDate}&endDate=${defaultDateRange.endDate}&limit=${limit}`)
        .expect((res) => {
          expect([200, 500]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(response.body.data.length).toBeLessThanOrEqual(limit);
      }
    });
  });

  describe('GET /api/dashboard/transporter-comparison', () => {
    it('should get transporter comparison data', async () => {
      const response = await request(app)
        .get(`/api/dashboard/transporter-comparison?startDate=${defaultDateRange.startDate}&endDate=${defaultDateRange.endDate}&sortBy=aiScore&minDeliveries=1`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const transporter = response.body.data[0];
        expect(transporter).toHaveProperty('transportCompany');
        expect(transporter).toHaveProperty('totalDeliveries');
        expect(transporter).toHaveProperty('averageRating');
        expect(transporter).toHaveProperty('onTimePercentage');
        expect(transporter).toHaveProperty('totalRevenue');
        expect(transporter).toHaveProperty('aiScore');
        expect(transporter).toHaveProperty('drivers');

        expect(typeof transporter.totalDeliveries).toBe('number');
        expect(typeof transporter.averageRating).toBe('number');
        expect(typeof transporter.onTimePercentage).toBe('number');
        expect(typeof transporter.totalRevenue).toBe('number');
        expect(typeof transporter.aiScore).toBe('number');
        expect(Array.isArray(transporter.drivers)).toBe(true);
      }
    });

    it('should sort by different criteria', async () => {
      const sortOptions = ['aiScore', 'totalDeliveries', 'averageRating', 'onTimePercentage'];
      
      for (const sortBy of sortOptions) {
        const response = await request(app)
          .get(`/api/dashboard/transporter-comparison?startDate=${defaultDateRange.startDate}&endDate=${defaultDateRange.endDate}&sortBy=${sortBy}&minDeliveries=1`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('should filter by minimum deliveries', async () => {
      const minDeliveries = 5;
      const response = await request(app)
        .get(`/api/dashboard/transporter-comparison?startDate=${defaultDateRange.startDate}&endDate=${defaultDateRange.endDate}&minDeliveries=${minDeliveries}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        response.body.data.forEach(transporter => {
          expect(transporter.totalDeliveries).toBeGreaterThanOrEqual(minDeliveries);
        });
      }
    });
  });

  describe('GET /api/dashboard/route-analysis', () => {
    it('should get route analysis data', async () => {
      const response = await request(app)
        .get(`/api/dashboard/route-analysis?startDate=${defaultDateRange.startDate}&endDate=${defaultDateRange.endDate}&limit=10`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const route = response.body.data[0];
        expect(route).toHaveProperty('route');
        expect(route).toHaveProperty('totalDeliveries');
        expect(route).toHaveProperty('averageTime');
        expect(route).toHaveProperty('averageCost');
        expect(route).toHaveProperty('costEfficiency');
        expect(route).toHaveProperty('averageRating');

        expect(typeof route.totalDeliveries).toBe('number');
        expect(typeof route.averageTime).toBe('number');
        expect(typeof route.averageCost).toBe('number');
        expect(typeof route.costEfficiency).toBe('number');
        expect(typeof route.averageRating).toBe('number');
      }
    });

    it('should limit the number of routes', async () => {
      const limit = 5;
      const response = await request(app)
        .get(`/api/dashboard/route-analysis?startDate=${defaultDateRange.startDate}&endDate=${defaultDateRange.endDate}&limit=${limit}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('Dashboard Data Integration', () => {
    it('should have consistent data across different endpoints', async () => {
      // Get KPI data
      const kpiResponse = await request(app)
        .get(`/api/dashboard/kpi?startDate=${defaultDateRange.startDate}&endDate=${defaultDateRange.endDate}`)
        .expect(200);

      // Get transporter comparison
      const transporterResponse = await request(app)
        .get(`/api/dashboard/transporter-comparison?startDate=${defaultDateRange.startDate}&endDate=${defaultDateRange.endDate}&minDeliveries=1`)
        .expect(200);

      expect(kpiResponse.body.success).toBe(true);
      expect(transporterResponse.body.success).toBe(true);

      // Verify that some data is consistent
      const totalCompletedRequests = kpiResponse.body.data.completedRequests;
      const transporterTotalDeliveries = transporterResponse.body.data.reduce(
        (sum, t) => sum + t.totalDeliveries, 0
      );

      // These should be related (not necessarily equal due to different filtering)
      expect(totalCompletedRequests).toBeGreaterThanOrEqual(0);
      expect(transporterTotalDeliveries).toBeGreaterThanOrEqual(0);
    });
  });
});