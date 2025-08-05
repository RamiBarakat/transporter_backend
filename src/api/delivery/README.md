# Delivery Management Module

## Overview

The Delivery Management Module is a dedicated service for handling delivery logging, completion tracking, and delivery-related operations. This module was extracted from the driver and request modules to provide better separation of concerns and cleaner architecture.

## Module Structure

```
src/api/delivery/
├── delivery.model.js       # Database models (Delivery, DriverRating)
├── delivery.service.js     # Business logic for delivery operations
├── delivery.controller.js  # HTTP request handlers
├── delivery.routes.js      # Route definitions
├── delivery.validate.js    # Input validation schemas
└── README.md              # This documentation
```

## Features

### 1. **Delivery Logging with Race Condition Protection**
- Two-phase delivery completion (processing → completed)
- Re-logging capability for failed UI interactions
- Automatic cleanup of previous attempts
- Retry logic with exponential backoff

### 2. **Driver Rating Management**
- Comprehensive driver performance ratings
- Support for multiple rating categories
- Automatic driver statistics updates
- Flexible rating input formats (nested/flat)

### 3. **Delivery Statistics**
- Real-time delivery metrics
- Date-range filtering
- Revenue tracking
- Performance analytics

## API Endpoints

### Delivery Logging
```http
POST /api/deliveries/:requestId/log
Content-Type: application/json

{
  "actualPickupDateTime": "2024-01-15T10:30:00Z",
  "actualTruckCount": 2,
  "invoiceAmount": 1500.00,
  "deliveryNotes": "Delivery completed successfully",
  "drivers": [
    {
      "driver_id": 123,
      "punctuality": 5,
      "professionalism": 4,
      "deliveryQuality": 5,
      "communication": 4,
      "safety": 5,
      "overall": 5,
      "comments": "Excellent service"
    }
  ]
}
```

### Delivery Confirmation
```http
POST /api/deliveries/:requestId/confirm
```

### Get Delivery Information
```http
GET /api/deliveries/request/:requestId
```

### Delivery Statistics
```http
GET /api/deliveries/stats?startDate=2024-01-01&endDate=2024-01-31
```

### Health Check
```http
GET /api/deliveries/health
```

## Models

### Delivery Model
- **Table**: `deliveries`
- **Purpose**: Stores actual delivery completion data
- **Key Fields**: 
  - `requestId` - Links to transportation request
  - `actualPickupDateTime` - When delivery actually occurred
  - `actualTruckCount` - Number of trucks actually used
  - `invoiceAmount` - Final billed amount
  - `deliveryNotes` - Additional delivery notes

### DriverRating Model
- **Table**: `driver_ratings`
- **Purpose**: Stores performance ratings for drivers on specific deliveries
- **Key Fields**:
  - `deliveryId` - Links to delivery record
  - `driverId` - Links to driver record
  - Rating categories: punctuality, professionalism, deliveryQuality, communication, safety, policyCompliance, fuelEfficiency
  - `overallRating` - Overall performance score
  - `comments` - Written feedback

## Service Methods

### DeliveryService.logDeliveryWithDrivers(requestId, deliveryData)
- Logs delivery completion with driver ratings
- Handles transaction management and rollback
- Supports driver creation and rating recording
- Implements retry logic for database locks

### DeliveryService.confirmDeliveryCompletion(requestId)
- Confirms delivery completion (processing → completed)
- Final step in two-phase delivery process
- Updates request status atomically

### DeliveryService.getDeliveryByRequestId(requestId)
- Retrieves delivery information by request ID
- Includes associated driver ratings
- Returns formatted delivery data

### DeliveryService.getDeliveryStats(startDate, endDate)
- Calculates delivery statistics for date range
- Returns aggregated metrics (count, revenue, averages)

## Integration Points

### With Request Module
- Request status management (planned → processing → completed)
- Delivery completion logging from request endpoints
- Backward compatibility maintained

### With Driver Module
- Driver statistics updates
- Driver rating management
- Driver creation during delivery logging

### With Dashboard Module
- Delivery metrics for KPI calculations
- Performance trend analysis
- AI insights generation

## Error Handling

### Race Condition Protection
- Prevents duplicate delivery logging
- Allows re-logging for failed UI operations
- Automatic cleanup of orphaned records

### Validation
- Comprehensive input validation
- Support for multiple data formats
- Clear error messages and field identification

### Transaction Safety
- Atomic operations with rollback support
- Lock timeout handling with retries
- Separate critical and non-critical operations

## Migration from Old Structure

### Before (Scattered Across Modules)
```
driver/
├── driver.model.js     # Contained Delivery + DriverRating models
├── driver.service.js   # Contained delivery logic
└── driver.controller.js

request/
├── request.controller.js # Contained delivery endpoints
└── request.routes.js     # Contained delivery routes
```

### After (Dedicated Module)
```
delivery/
├── delivery.model.js     # Delivery + DriverRating models
├── delivery.service.js   # All delivery business logic
├── delivery.controller.js # Delivery-specific endpoints
├── delivery.routes.js    # Delivery route definitions
└── delivery.validate.js  # Delivery validation schemas
```

## Benefits of Extraction

1. **Separation of Concerns**: Clear boundaries between driver, request, and delivery functionality
2. **Maintainability**: Easier to locate and modify delivery-related code
3. **Testing**: Isolated testing of delivery functionality
4. **Scalability**: Independent scaling and optimization of delivery operations
5. **API Clarity**: Dedicated delivery endpoints with clear responsibilities

## Backward Compatibility

- Existing request endpoints continue to work
- Driver service methods properly delegated
- Model associations preserved
- No breaking changes to existing API consumers

## Future Enhancements

- Delivery tracking and status updates
- Integration with shipping providers
- Advanced delivery analytics
- Automated delivery notifications
- Performance benchmarking and optimization