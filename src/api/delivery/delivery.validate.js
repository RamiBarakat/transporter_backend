const Joi = require('joi');

/**
 * Validation schemas for delivery endpoints
 */

// Delivery logging validation schema
const deliveryLoggingSchema = Joi.object({
  actualPickupDateTime: Joi.date().required(),
  actualTruckCount: Joi.number().integer().min(1).required(),
  invoiceAmount: Joi.number().positive().precision(2).required(),
  deliveryNotes: Joi.string().allow('').optional(),
  drivers: Joi.array().items(
    Joi.object({
      // Support for existing driver by ID
      driver_id: Joi.number().integer().optional(),
      id: Joi.number().integer().optional(),
      
      // Support for new driver creation
      name: Joi.string().when('driver_id', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.when('id', {
          is: Joi.exist(),
          then: Joi.optional(),
          otherwise: Joi.required()
        })
      }),
      type: Joi.string().valid('transporter', 'in_house').optional(),
      transportCompany: Joi.string().optional(),
      phone: Joi.string().optional(),
      licenseNumber: Joi.string().optional(),
      employeeId: Joi.string().optional(),
      department: Joi.string().optional(),
      hireDate: Joi.date().optional(),
      
      // Rating data - support both nested and flat formats
      rating: Joi.object({
        punctuality: Joi.number().integer().min(1).max(5).required(),
        professionalism: Joi.number().integer().min(1).max(5).required(),
        deliveryQuality: Joi.number().integer().min(1).max(5).optional(),
        communication: Joi.number().integer().min(1).max(5).optional(),
        safety: Joi.number().integer().min(1).max(5).optional(),
        policyCompliance: Joi.number().integer().min(1).max(5).optional(),
        fuelEfficiency: Joi.number().integer().min(1).max(5).optional(),
        overall: Joi.number().integer().min(1).max(5).required(),
        comments: Joi.string().allow('').optional()
      }).optional(),
      
      // Flat format rating fields
      punctuality: Joi.number().integer().min(1).max(5).optional(),
      professionalism: Joi.number().integer().min(1).max(5).optional(),
      deliveryQuality: Joi.number().integer().min(1).max(5).optional(),
      communication: Joi.number().integer().min(1).max(5).optional(),
      safety: Joi.number().integer().min(1).max(5).optional(),
      policyCompliance: Joi.number().integer().min(1).max(5).optional(),
      fuelEfficiency: Joi.number().integer().min(1).max(5).optional(),
      overall: Joi.number().integer().min(1).max(5).optional(),
      comments: Joi.string().allow('').optional()
    }).custom((value, helpers) => {
      // Ensure either driver_id/id exists OR rating data exists
      const hasDriverId = value.driver_id || value.id;
      const hasRatingNested = value.rating;
      const hasRatingFlat = value.punctuality && value.professionalism && value.overall;
      
      if (!hasDriverId && !value.name) {
        return helpers.error('any.custom', {
          message: 'Either driver_id/id or name is required'
        });
      }
      
      if (!hasRatingNested && !hasRatingFlat) {
        return helpers.error('any.custom', {
          message: 'Rating data is required (either nested or flat format)'
        });
      }
      
      return value;
    })
  ).min(1).required()
});

// Date range validation schema
const dateRangeSchema = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref('startDate')).required()
});

// Request ID validation schema
const requestIdSchema = Joi.object({
  requestId: Joi.number().integer().positive().required()
});

// Update delivery validation schema
const updateDeliverySchema = Joi.object({
  delivery: Joi.object({
    actualPickupDateTime: Joi.date().optional(),
    actualTruckCount: Joi.number().integer().min(1).optional(),
    invoiceAmount: Joi.number().positive().precision(2).optional(),
    deliveryNotes: Joi.string().allow('').optional()
  }).optional(),
  
  drivers: Joi.array().items(
    Joi.object({
      // Driver ID (always required for reference)
      driver_id: Joi.number().integer().positive().required(),
      
      // Rating ID (optional - if provided, update existing rating; if not, create new)
      ratingId: Joi.number().integer().positive().optional(),
      
      // Rating data (required for all drivers)
      ratings: Joi.object({
        punctuality: Joi.number().integer().min(1).max(5).required(),
        professionalism: Joi.number().integer().min(1).max(5).required(),
        deliveryQuality: Joi.number().integer().min(1).max(5).optional(),
        communication: Joi.number().integer().min(1).max(5).optional(),
        safety: Joi.number().integer().min(1).max(5).optional(),
        policyCompliance: Joi.number().integer().min(1).max(5).optional(),
        fuelEfficiency: Joi.number().integer().min(1).max(5).optional(),
        comments: Joi.string().allow('').optional(),
        overallRating: Joi.number().integer().min(1).max(5).required()
      }).required()
    }).custom((value, helpers) => {
      // driver_id is always required
      if (!value.driver_id) {
        return helpers.error('any.custom', {
          message: 'driver_id is required for all drivers'
        });
      }
      
      return value;
    })
  ).optional()
}).custom((value, helpers) => {
  // At least one of delivery or drivers must be provided
  if (!value.delivery && !value.drivers) {
    return helpers.error('any.custom', {
      message: 'At least one of delivery data or drivers data must be provided'
    });
  }
  
  return value;
});

/**
 * Validate request data against schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Joi schema to validate against
 * @returns {Object} Validation result
 */
const validateRequest = (data, schema) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context.value
    }));

    return {
      isValid: false,
      errors,
      data: null
    };
  }

  return {
    isValid: true,
    errors: null,
    data: value
  };
};

module.exports = {
  validateRequest,
  deliveryLoggingSchema,
  updateDeliverySchema,
  dateRangeSchema,
  requestIdSchema
};