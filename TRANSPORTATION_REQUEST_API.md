# Transportation Request Management API

## Overview
Complete backend feature for transportation request management built with Node.js, Express, and Sequelize. This system allows logistics coordinators like Sarah to create transportation requests, log delivery completions, and generate performance reports.

## Features Implemented

### Phase 1 - Request Management
- ✅ Create transportation requests with auto-generated request numbers (REQ-YYYY-###)
- ✅ List all requests with filtering (status, urgency, truck type, date range, search)
- ✅ Get single request details
- ✅ Update requests (only if not completed)
- ✅ Delete requests (only if not completed)

### Phase 2 - Delivery Logging
- ✅ Log actual delivery completion data
- ✅ Update delivery completion information
- ✅ Automatic status updates when delivery is logged

### Phase 3 - Performance Reports
- ✅ Individual request performance metrics
- ✅ Dashboard statistics and overview
- ✅ Overall performance summary with date filtering
- ✅ Automatic performance calculations (delays, cost variance, truck variance)

## Project Structure
```
src/
├── api/
│   └── request/
│       ├── request.validate.js     # Joi validation schemas
│       ├── request.model.js        # Sequelize models
│       ├── request.controller.js   # Route handlers
│       ├── request.service.js      # Business logic
│       └── request.routes.js       # Express routes
├── config/
│   ├── config.js                   # Database config
│   └── db.js                       # Sequelize connection
├── models/
│   └── index.js                    # Model associations
└── routes/
    └── index.js                    # Main routes
```

## Database Schema

### Transportation Requests Table
- `id` - Primary key
- `request_number` - Auto-generated (REQ-YYYY-###)
- `origin`, `destination` - Location details
- `distance_miles` - Distance (optional)
- `planned_pickup_date`, `planned_pickup_time` - Planned schedule
- `required_trucks`, `truck_type` - Truck requirements
- `load_details`, `special_requirements` - Additional info
- `estimated_cost`, `urgency_level` - Cost and priority
- `status` - planned/completed/cancelled
- `created_by`, `created_at`, `updated_at` - Audit fields

### Delivery Completions Table
- `id` - Primary key
- `request_id` - Foreign key to transportation_requests
- `actual_pickup_date`, `actual_pickup_time` - Actual schedule
- `actual_trucks`, `driver_name`, `driver_company` - Delivery details
- `punctuality_rating`, `professionalism_rating`, `overall_rating` - Performance ratings (1-5)
- `invoice_amount`, `invoice_number` - Financial info
- `delivery_notes` - Additional notes
- `logged_by`, `logged_at` - Audit fields

## API Endpoints

### Request Management
- `POST /api/requests` - Create new request
- `GET /api/requests` - List all requests (with filtering)
- `GET /api/requests/:id` - Get request details
- `PUT /api/requests/:id` - Update request
- `DELETE /api/requests/:id` - Delete request

### Delivery Logging
- `POST /api/requests/:id/delivery` - Log delivery completion
- `PUT /api/requests/:id/delivery` - Update delivery data

### Performance Reports
- `GET /api/requests/:id/performance` - Request performance metrics
- `GET /api/requests/dashboard/stats` - Dashboard statistics
- `GET /api/requests/performance/summary` - Overall performance summary

### Utility
- `GET /api/health` - API health check
- `GET /api` - API documentation

## Sample API Responses

### Create Request Response
```json
{
  "success": true,
  "message": "Transportation request created successfully",
  "data": {
    "id": 1,
    "requestNumber": "REQ-2024-001",
    "origin": "Dallas Warehouse",
    "destination": "Houston Distribution Center",
    "status": "planned",
    "plannedPickupDate": "2024-01-15",
    "plannedPickupTime": "08:00",
    "requiredTrucks": 2,
    "truckType": "box",
    "urgencyLevel": "medium",
    "createdBy": "Sarah Johnson"
  }
}
```

### Performance Report Response
```json
{
  "success": true,
  "message": "Performance metrics retrieved successfully",
  "data": {
    "request": { /* request details */ },
    "delivery": { /* delivery details */ },
    "performance": {
      "delayMinutes": 45,
      "truckVariance": -1,
      "costVariance": 300.00,
      "truckVariancePercentage": -33.33,
      "costVariancePercentage": 12.00,
      "performanceGrade": "Poor"
    }
  }
}
```

## Performance Calculations

The system automatically calculates:
- **Time Performance**: `actual_pickup_time - planned_pickup_time = delay_minutes`
- **Truck Performance**: `actual_trucks - required_trucks = truck_variance`
- **Cost Performance**: `invoice_amount - estimated_cost = cost_variance`
- **Percentage Variances**: Calculated for reporting
- **Performance Grade**: Excellent/Good/Fair/Poor based on variance thresholds

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   - Create a MySQL database
   - Copy `.env.example` to `.env`
   - Update database credentials in `.env`

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Verify Installation**
   - Visit `http://localhost:3000/api` for API documentation
   - Visit `http://localhost:3000/api/health` for health check

## Key Features

### Auto-Generated Request Numbers
- Format: REQ-YYYY-### (e.g., REQ-2024-001)
- Automatically increments within each year

### Comprehensive Validation
- Joi schemas for all input validation
- Proper error handling and sanitization
- Input size limits and format validation

### Performance Tracking
- Automatic performance metric calculations
- Performance grading system
- Historical performance analysis

### Business Logic Protection
- Cannot update/delete completed requests
- Cannot log delivery twice for same request
- Proper status transitions

### Error Handling
- Comprehensive error handling throughout
- Proper HTTP status codes
- Detailed error messages for debugging

## Technologies Used
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Sequelize** - ORM for database operations
- **Joi** - Input validation
- **MySQL** - Database (configurable via DB_DIALECT)
- **CORS** - Cross-origin resource sharing

## Future Enhancements
- Authentication and authorization
- File upload for delivery documents
- Email notifications
- Real-time updates with WebSockets
- Advanced reporting and analytics
- Mobile API optimizations