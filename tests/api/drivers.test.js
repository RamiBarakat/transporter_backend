const request = require('supertest');
const app = require('../../app');

describe('Driver API Endpoints', () => {
  describe('GET /api/drivers', () => {
    it('should get all drivers with pagination', async () => {
      const response = await request(app)
        .get('/api/drivers?page=1&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.pagination).toHaveProperty('total');
      expect(response.body.data.pagination).toHaveProperty('totalPages');
      expect(response.body.data.pagination).toHaveProperty('currentPage');
    });

    it('should return empty array for non-existent page', async () => {
      const response = await request(app)
        .get('/api/drivers?page=999&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(0);
      expect(response.body.data.pagination.currentPage).toBe(999);
    });
  });

  describe('GET /api/drivers/search', () => {
    it('should search drivers by name', async () => {
      const response = await request(app)
        .get('/api/drivers/search?search=John&page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('pagination');
      
      if (response.body.data.data.length > 0) {
        const firstDriver = response.body.data.data[0];
        expect(firstDriver.name.toLowerCase()).toContain('john');
      }
    });

    it('should search drivers by transport company', async () => {
      const response = await request(app)
        .get('/api/drivers/search?search=Swift&page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.data.length > 0) {
        const firstDriver = response.body.data.data[0];
        expect(firstDriver.transportCompany?.toLowerCase()).toContain('swift');
      }
    });

    it('should filter drivers by type', async () => {
      const response = await request(app)
        .get('/api/drivers/search?type=transporter&page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.data.length > 0) {
        response.body.data.data.forEach(driver => {
          expect(driver.type).toBe('transporter');
        });
      }
    });
  });

  describe('GET /api/drivers/:id', () => {
    it('should get driver by valid ID', async () => {
      const response = await request(app)
        .get('/api/drivers/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('type');
    });

    it('should return 404 for non-existent driver', async () => {
      const response = await request(app)
        .get('/api/drivers/999999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Driver not found');
    });

    it('should return 400 for invalid driver ID', async () => {
      const response = await request(app)
        .get('/api/drivers/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/drivers/:id/ratings', () => {
    it('should get driver ratings for valid driver', async () => {
      const response = await request(app)
        .get('/api/drivers/1/ratings')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        const rating = response.body.data[0];
        expect(rating).toHaveProperty('punctuality');
        expect(rating).toHaveProperty('professionalism');
        expect(rating).toHaveProperty('overallRating');
      }
    });

    it('should return empty array for driver with no ratings', async () => {
      // Assuming driver ID 999 doesn't exist or has no ratings
      const response = await request(app)
        .get('/api/drivers/999/ratings')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/drivers/:id/insights', () => {
    it('should generate AI insights for driver', async () => {
      const response = await request(app)
        .post('/api/drivers/1/insights')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.data).toBe('string');
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should handle non-existent driver for insights', async () => {
      const response = await request(app)
        .post('/api/drivers/999999/insights')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/drivers', () => {
    it('should create a new transporter driver', async () => {
      const newDriver = {
        name: 'Test Driver',
        type: 'transporter',
        transportCompany: 'Test Transport',
        phone: '555-0123',
        licenseNumber: 'CDL-TEST-001'
      };

      const response = await request(app)
        .post('/api/drivers')
        .send(newDriver)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(newDriver.name);
      expect(response.body.data.type).toBe(newDriver.type);
    });

    it('should create a new in-house driver', async () => {
      const newDriver = {
        name: 'Test In-House Driver',
        type: 'in_house',
        employeeId: 'EMP-TEST-001',
        department: 'Test Department',
        hireDate: '2024-01-01',
        phone: '555-0124',
        licenseNumber: 'CDL-TEST-002'
      };

      const response = await request(app)
        .post('/api/drivers')
        .send(newDriver)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('in_house');
      expect(response.body.data.employeeId).toBe(newDriver.employeeId);
    });

    it('should validate required fields', async () => {
      const invalidDriver = {
        // Missing required fields
        phone: '555-0125'
      };

      const response = await request(app)
        .post('/api/drivers')
        .send(invalidDriver)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('validation');
    });
  });

  describe('PUT /api/drivers/:id', () => {
    it('should update an existing driver', async () => {
      const updateData = {
        phone: '555-UPDATED',
        overallRating: 4.5
      };

      const response = await request(app)
        .put('/api/drivers/1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.phone).toBe(updateData.phone);
    });

    it('should return 404 for non-existent driver', async () => {
      const updateData = {
        phone: '555-NOTFOUND'
      };

      const response = await request(app)
        .put('/api/drivers/999999')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should validate update data', async () => {
      const invalidData = {
        type: 'invalid_type'
      };

      const response = await request(app)
        .put('/api/drivers/1')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/drivers/:id', () => {
    it('should prevent deletion of driver with ratings', async () => {
      // Driver 1 should have ratings from seeded data
      const response = await request(app)
        .delete('/api/drivers/1')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('existing delivery ratings');
    });

    it('should return 404 for non-existent driver', async () => {
      const response = await request(app)
        .delete('/api/drivers/999999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});