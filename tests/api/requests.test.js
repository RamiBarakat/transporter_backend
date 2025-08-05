const request = require('supertest');
const app = require('../../app');

describe('Transportation Request API Endpoints', () => {
  describe('GET /api/requests', () => {
    it('should get all requests with pagination', async () => {
      const response = await request(app)
        .get('/api/requests?page=1&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.pagination).toHaveProperty('totalItems');
      expect(response.body.data.pagination).toHaveProperty('currentPage');
    });

    it('should filter requests by status', async () => {
      const response = await request(app)
        .get('/api/requests?status=completed&page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.data.length > 0) {
        response.body.data.data.forEach(req => {
          expect(req.status).toBe('completed');
        });
      }
    });

    it('should filter requests by urgency level', async () => {
      const response = await request(app)
        .get('/api/requests?urgencyLevel=high&page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.data.length > 0) {
        response.body.data.data.forEach(req => {
          expect(req.urgencyLevel).toBe('high');
        });
      }
    });

    it('should search requests by origin or destination', async () => {
      const response = await request(app)
        .get('/api/requests?search=Houston&page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.data.length > 0) {
        response.body.data.data.forEach(req => {
          const hasHouston = req.origin.toLowerCase().includes('houston') || 
                           req.destination.toLowerCase().includes('houston');
          expect(hasHouston).toBe(true);
        });
      }
    });
  });

  describe('GET /api/requests/:id', () => {
    it('should get request by valid ID', async () => {
      const response = await request(app)
        .get('/api/requests/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('requestNumber');
      expect(response.body.data).toHaveProperty('origin');
      expect(response.body.data).toHaveProperty('destination');
      expect(response.body.data).toHaveProperty('status');
    });

    it('should include delivery data for completed requests', async () => {
      const response = await request(app)
        .get('/api/requests/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.status === 'completed') {
        expect(response.body.data).toHaveProperty('delivery');
        expect(response.body.data).toHaveProperty('performance');
      }
    });

    it('should return 404 for non-existent request', async () => {
      const response = await request(app)
        .get('/api/requests/999999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Request not found');
    });
  });

  describe('POST /api/requests', () => {
    it('should create a new transportation request', async () => {
      const newRequest = {
        origin: 'Test Origin',
        destination: 'Test Destination',
        estimatedDistance: 100.5,
        pickUpDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        truckCount: 2,
        truckType: 'box',
        loadDetails: 'Test cargo',
        estimatedCost: 1500.00,
        urgencyLevel: 'medium',
        createdBy: 'Test User'
      };

      const response = await request(app)
        .post('/api/requests')
        .send(newRequest)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('requestNumber');
      expect(response.body.data.origin).toBe(newRequest.origin);
      expect(response.body.data.destination).toBe(newRequest.destination);
      expect(response.body.data.status).toBe('planned');
    });

    it('should validate required fields', async () => {
      const invalidRequest = {
        origin: 'Test Origin'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/requests')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('validation');
    });

    it('should validate truck type enum', async () => {
      const invalidRequest = {
        origin: 'Test Origin',
        destination: 'Test Destination',
        pickUpDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        truckCount: 1,
        truckType: 'invalid_type', // Invalid enum value
        loadDetails: 'Test cargo',
        estimatedCost: 1000,
        urgencyLevel: 'medium',
        createdBy: 'Test User'
      };

      const response = await request(app)
        .post('/api/requests')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/requests/:id', () => {
    it('should update an existing request', async () => {
      const updateData = {
        estimatedCost: 2000.00,
        urgencyLevel: 'high'
      };

      const response = await request(app)
        .put('/api/requests/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.estimatedCost).toBe(updateData.estimatedCost);
      expect(response.body.data.urgencyLevel).toBe(updateData.urgencyLevel);
    });

    it('should return 404 for non-existent request', async () => {
      const updateData = {
        estimatedCost: 1500.00
      };

      const response = await request(app)
        .put('/api/requests/999999')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should prevent updating completed requests', async () => {
      // Find a completed request first
      const getResponse = await request(app).get('/api/requests/1');
      
      if (getResponse.body.data.status === 'completed') {
        const updateData = {
          estimatedCost: 3000.00
        };

        const response = await request(app)
          .put('/api/requests/1')
          .send(updateData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('Cannot update completed');
      }
    });
  });

  describe('DELETE /api/requests/:id', () => {
    it('should prevent deletion of completed requests', async () => {
      const response = await request(app)
        .delete('/api/requests/1')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Cannot delete completed');
    });

    it('should return 404 for non-existent request', async () => {
      const response = await request(app)
        .delete('/api/requests/999999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/requests/:id/delivery', () => {
    it('should prevent logging delivery for non-planned requests', async () => {
      const deliveryData = {
        actualPickupDateTime: new Date().toISOString(),
        actualTruckCount: 2,
        invoiceAmount: 2500.00,
        deliveryNotes: 'Test delivery',
        drivers: [
          {
            driverId: 1,
            punctuality: 4,
            professionalism: 5,
            deliveryQuality: 4,
            communication: 5,
            safety: 5,
            policyCompliance: 4,
            fuelEfficiency: 4,
            overallRating: 4,
            comments: 'Good performance'
          }
        ]
      };

      // Try to log delivery for already completed request
      const response = await request(app)
        .post('/api/requests/1/delivery')
        .send(deliveryData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already completed');
    });

    it('should return 404 for non-existent request', async () => {
      const deliveryData = {
        actualPickupDateTime: new Date().toISOString(),
        actualTruckCount: 1,
        invoiceAmount: 1500.00,
        deliveryNotes: 'Test delivery',
        drivers: []
      };

      const response = await request(app)
        .post('/api/requests/999999/delivery')
        .send(deliveryData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/requests/:id/delivery/confirm', () => {
    it('should return 404 for non-existent request', async () => {
      const response = await request(app)
        .post('/api/requests/999999/delivery/confirm')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});