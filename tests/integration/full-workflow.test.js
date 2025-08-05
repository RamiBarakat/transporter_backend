const request = require('supertest');
const app = require('../../app');

describe('Full Workflow Integration Tests', () => {
  let createdDriverId;
  let createdRequestId;

  describe('Complete Transportation Request Workflow', () => {
    it('should create a new driver', async () => {
      const newDriver = {
        name: 'Integration Test Driver',
        type: 'transporter',
        transportCompany: 'Test Transport Co',
        phone: '555-TEST-01',
        licenseNumber: 'CDL-INTEG-001'
      };

      const response = await request(app)
        .post('/api/drivers')
        .send(newDriver)
        .expect(201);

      expect(response.body.success).toBe(true);
      createdDriverId = response.body.data.id;
      expect(createdDriverId).toBeDefined();
    });

    it('should create a new transportation request', async () => {
      const newRequest = {
        origin: 'Integration Test Origin',
        destination: 'Integration Test Destination',
        estimatedDistance: 150.5,
        pickUpDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        truckCount: 1,
        truckType: 'box',
        loadDetails: 'Integration test cargo',
        estimatedCost: 1800.00,
        urgencyLevel: 'medium',
        createdBy: 'Integration Test'
      };

      const response = await request(app)
        .post('/api/requests')
        .send(newRequest)
        .expect(201);

      expect(response.body.success).toBe(true);
      createdRequestId = response.body.data.id;
      expect(createdRequestId).toBeDefined();
      expect(response.body.data.status).toBe('planned');
    });

    it('should log delivery completion for the request', async () => {
      const deliveryData = {
        actualPickupDateTime: new Date().toISOString(),
        actualTruckCount: 1,
        invoiceAmount: 1750.00,
        deliveryNotes: 'Integration test delivery completed successfully',
        drivers: [
          {
            driverId: createdDriverId,
            punctuality: 5,
            professionalism: 4,
            deliveryQuality: 5,
            communication: 4,
            safety: 5,
            policyCompliance: 5,
            fuelEfficiency: 4,
            overallRating: 5,
            comments: 'Excellent performance in integration test'
          }
        ]
      };

      const response = await request(app)
        .post(`/api/requests/${createdRequestId}/delivery`)
        .send(deliveryData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('logged successfully');
    });

    it('should confirm the delivery completion', async () => {
      const response = await request(app)
        .post(`/api/requests/${createdRequestId}/delivery/confirm`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('confirmed successfully');
    });

    it('should verify request status is completed', async () => {
      const response = await request(app)
        .get(`/api/requests/${createdRequestId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data).toHaveProperty('delivery');
      expect(response.body.data).toHaveProperty('performance');
    });

    it('should verify delivery can be retrieved', async () => {
      const response = await request(app)
        .get(`/api/deliveries/request/${createdRequestId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.requestId).toBe(createdRequestId);
      expect(response.body.data.invoiceAmount).toBe(1750.00);
    });

    it('should verify driver ratings were recorded', async () => {
      const response = await request(app)
        .get(`/api/drivers/${createdDriverId}/ratings`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Find the rating from our test delivery
      const testRating = response.body.data.find(rating => 
        rating.comments && rating.comments.includes('integration test')
      );
      
      if (testRating) {
        expect(testRating.overallRating).toBe(5);
        expect(testRating.punctuality).toBe(5);
      }
    });

    it('should be able to edit the delivery', async () => {
      const updateData = {
        delivery: {
          actualPickupDateTime: new Date().toISOString(),
          actualTruckCount: 1,
          invoiceAmount: 1800.00,
          deliveryNotes: 'Updated delivery notes for integration test'
        }
      };

      const response = await request(app)
        .put(`/api/deliveries/request/${createdRequestId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated successfully');
    });

    it('should generate AI insights for the driver', async () => {
      const response = await request(app)
        .post(`/api/drivers/${createdDriverId}/insights`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.data).toBe('string');
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should include the new data in dashboard metrics', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/dashboard/kpi?startDate=${startDate}&endDate=${endDate}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalRequests).toBeGreaterThan(0);
      expect(response.body.data.completedRequests).toBeGreaterThan(0);
    });

    it('should prevent deletion of driver with ratings', async () => {
      const response = await request(app)
        .delete(`/api/drivers/${createdDriverId}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('existing delivery ratings');
    });

    it('should prevent deletion of completed request', async () => {
      const response = await request(app)
        .delete(`/api/requests/${createdRequestId}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Cannot delete completed');
    });
  });

  describe('Error Handling Workflow', () => {
    it('should handle duplicate delivery logging attempts', async () => {
      const deliveryData = {
        actualPickupDateTime: new Date().toISOString(),
        actualTruckCount: 1,
        invoiceAmount: 1500.00,
        deliveryNotes: 'Duplicate attempt',
        drivers: [
          {
            driverId: createdDriverId,
            punctuality: 4,
            professionalism: 4,
            deliveryQuality: 4,
            communication: 4,
            safety: 4,
            policyCompliance: 4,
            fuelEfficiency: 4,
            overallRating: 4,
            comments: 'Duplicate test'
          }
        ]
      };

      const response = await request(app)
        .post(`/api/requests/${createdRequestId}/delivery`)
        .send(deliveryData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already completed');
    });

    it('should handle invalid driver IDs in delivery logging', async () => {
      // First create a new request
      const newRequest = {
        origin: 'Error Test Origin',
        destination: 'Error Test Destination',
        estimatedDistance: 100,
        pickUpDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        truckCount: 1,
        truckType: 'box',
        loadDetails: 'Error test cargo',
        estimatedCost: 1000.00,
        urgencyLevel: 'low',
        createdBy: 'Error Test'
      };

      const requestResponse = await request(app)
        .post('/api/requests')
        .send(newRequest)
        .expect(201);

      const errorRequestId = requestResponse.body.data.id;

      // Try to log delivery with invalid driver ID
      const deliveryData = {
        actualPickupDateTime: new Date().toISOString(),
        actualTruckCount: 1,
        invoiceAmount: 1000.00,
        deliveryNotes: 'Error test delivery',
        drivers: [
          {
            driverId: 999999, // Non-existent driver
            punctuality: 4,
            professionalism: 4,
            deliveryQuality: 4,
            communication: 4,
            safety: 4,
            policyCompliance: 4,
            fuelEfficiency: 4,
            overallRating: 4,
            comments: 'Error test'
          }
        ]
      };

      const response = await request(app)
        .post(`/api/requests/${errorRequestId}/delivery`)
        .send(deliveryData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});