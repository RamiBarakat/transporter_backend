const request = require('supertest');
const app = require('../../app');

describe('Delivery API Endpoints', () => {
  describe('GET /api/deliveries', () => {
    it('should get all deliveries with pagination', async () => {
      const response = await request(app)
        .get('/api/deliveries?page=1&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it('should filter deliveries by date range', async () => {
      const startDate = '2025-07-01';
      const endDate = '2025-08-31';
      
      const response = await request(app)
        .get(`/api/deliveries?startDate=${startDate}&endDate=${endDate}&page=1&limit=10`)
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.data.length > 0) {
        response.body.data.data.forEach(delivery => {
          const deliveryDate = new Date(delivery.actualPickupDateTime);
          expect(deliveryDate >= new Date(startDate)).toBe(true);
          expect(deliveryDate <= new Date(endDate)).toBe(true);
        });
      }
    });
  });

  describe('GET /api/deliveries/:id', () => {
    it('should get delivery by valid ID', async () => {
      const response = await request(app)
        .get('/api/deliveries/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('requestId');
      expect(response.body.data).toHaveProperty('actualPickupDateTime');
      expect(response.body.data).toHaveProperty('invoiceAmount');
    });

    it('should return 404 for non-existent delivery', async () => {
      const response = await request(app)
        .get('/api/deliveries/999999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Delivery not found');
    });
  });

  describe('GET /api/deliveries/request/:requestId', () => {
    it('should get delivery by request ID', async () => {
      const response = await request(app)
        .get('/api/deliveries/request/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.requestId).toBe(1);
    });

    it('should return 404 for request without delivery', async () => {
      const response = await request(app)
        .get('/api/deliveries/request/999999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/deliveries/request/:requestId/edit', () => {
    it('should get delivery data for editing with driver ratings', async () => {
      const response = await request(app)
        .get('/api/deliveries/request/1/edit')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('delivery');
      expect(response.body.data).toHaveProperty('drivers');
      expect(Array.isArray(response.body.data.drivers)).toBe(true);

      const delivery = response.body.data.delivery;
      expect(delivery).toHaveProperty('id');
      expect(delivery).toHaveProperty('requestId');
      expect(delivery).toHaveProperty('actualPickupDateTime');
      expect(delivery).toHaveProperty('actualTruckCount');
      expect(delivery).toHaveProperty('invoiceAmount');

      if (response.body.data.drivers.length > 0) {
        const driver = response.body.data.drivers[0];
        expect(driver).toHaveProperty('ratingId');
        expect(driver).toHaveProperty('driver');
        expect(driver).toHaveProperty('ratings');
        
        expect(driver.driver).toHaveProperty('id');
        expect(driver.driver).toHaveProperty('name');
        expect(driver.driver).toHaveProperty('type');

        expect(driver.ratings).toHaveProperty('punctuality');
        expect(driver.ratings).toHaveProperty('professionalism');
        expect(driver.ratings).toHaveProperty('overallRating');
      }
    });

    it('should return 404 for request without delivery', async () => {
      const response = await request(app)
        .get('/api/deliveries/request/999999/edit')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/deliveries/request/:requestId', () => {
    it('should update delivery and driver ratings', async () => {
      // First get the delivery to edit
      const getResponse = await request(app).get('/api/deliveries/request/1/edit');
      
      if (getResponse.body.success && getResponse.body.data.drivers.length > 0) {
        const updateData = {
          delivery: {
            actualPickupDateTime: new Date().toISOString(),
            actualTruckCount: 3,
            invoiceAmount: 3000.00,
            deliveryNotes: 'Updated delivery notes'
          },
          drivers: [
            {
              ratingId: getResponse.body.data.drivers[0].ratingId,
              ratings: {
                punctuality: 5,
                professionalism: 5,
                deliveryQuality: 4,
                communication: 5,
                safety: 5,
                policyCompliance: 5,
                fuelEfficiency: 4,
                comments: 'Updated rating comments',
                overallRating: 5
              }
            }
          ]
        };

        const response = await request(app)
          .put('/api/deliveries/request/1')
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('updated successfully');
        expect(response.body.data).toHaveProperty('delivery');
        expect(response.body.data).toHaveProperty('drivers');
      }
    });

    it('should update only delivery data when no drivers provided', async () => {
      const updateData = {
        delivery: {
          actualPickupDateTime: new Date().toISOString(),
          actualTruckCount: 2,
          invoiceAmount: 2500.00,
          deliveryNotes: 'Updated delivery only'
        }
      };

      const response = await request(app)
        .put('/api/deliveries/request/2')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated successfully');
    });

    it('should return 404 for non-existent delivery', async () => {
      const updateData = {
        delivery: {
          actualPickupDateTime: new Date().toISOString(),
          actualTruckCount: 1,
          invoiceAmount: 1500.00,
          deliveryNotes: 'Test update'
        }
      };

      const response = await request(app)
        .put('/api/deliveries/request/999999')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should validate rating values', async () => {
      const updateData = {
        delivery: {
          actualPickupDateTime: new Date().toISOString(),
          actualTruckCount: 1,
          invoiceAmount: 1500.00,
          deliveryNotes: 'Test'
        },
        drivers: [
          {
            ratingId: 1,
            ratings: {
              punctuality: 6, // Invalid: should be 1-5
              professionalism: 3,
              deliveryQuality: 4,
              communication: 2,
              safety: 5,
              policyCompliance: 4,
              fuelEfficiency: 3,
              comments: 'Test',
              overallRating: 4
            }
          }
        ]
      };

      const response = await request(app)
        .put('/api/deliveries/request/1')
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/deliveries/stats', () => {
    it('should get delivery statistics', async () => {
      const response = await request(app)
        .get('/api/deliveries/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalDeliveries');
      expect(response.body.data).toHaveProperty('averageRating');
      expect(response.body.data).toHaveProperty('onTimePercentage');
      expect(response.body.data).toHaveProperty('totalRevenue');
    });

    it('should filter stats by date range', async () => {
      const startDate = '2025-07-01';
      const endDate = '2025-08-31';

      const response = await request(app)
        .get(`/api/deliveries/stats?startDate=${startDate}&endDate=${endDate}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.data.totalDeliveries).toBe('number');
      expect(typeof response.body.data.averageRating).toBe('number');
    });
  });
});