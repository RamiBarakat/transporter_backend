const Joi = require('joi');

/**
 * Validation schema for creating a new transportation request
 * Updated to match frontend data structure
 */
const createRequestSchema = Joi.object({
  origin: Joi.string()
    .trim()
    .min(3)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Origin is required',
      'string.min': 'Origin must be at least 3 characters long',
      'string.max': 'Origin cannot exceed 255 characters'
    }),

  destination: Joi.string()
    .trim()
    .min(3)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Destination is required',
      'string.min': 'Destination must be at least 3 characters long',
      'string.max': 'Destination cannot exceed 255 characters'
    }),

  // Frontend sends estimatedDistance instead of distanceMiles
  estimatedDistance: Joi.number()
    .positive()
    .precision(2)
    .max(9999999.99)
    .optional()
    .messages({
      'number.positive': 'Distance must be a positive number',
      'number.max': 'Distance cannot exceed 9,999,999.99 miles'
    }),

  // Frontend sends single pickUpDateTime instead of separate date/time
  pickUpDateTime: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.base': 'Pickup date/time must be a valid date',
      'date.min': 'Pickup date/time cannot be in the past',
      'any.required': 'Pickup date/time is required'
    }),

  // Frontend sends truckCount instead of requiredTrucks
  truckCount: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .required()
    .messages({
      'number.base': 'Truck count must be a number',
      'number.integer': 'Truck count must be a whole number',
      'number.min': 'At least 1 truck is required',
      'number.max': 'Cannot exceed 50 trucks',
      'any.required': 'Truck count is required'
    }),

  // Make truck type optional with default
  truckType: Joi.string()
    .valid('box', 'flatbed', 'semi', 'refrigerated')
    .default('box')
    .messages({
      'any.only': 'Truck type must be one of: box, flatbed, semi, refrigerated'
    }),

  loadDetails: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Load details cannot exceed 1000 characters'
    }),

  specialRequirements: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Special requirements cannot exceed 1000 characters'
    }),

  estimatedCost: Joi.number()
    .positive()
    .precision(2)
    .max(99999999.99)
    .optional()
    .messages({
      'number.positive': 'Estimated cost must be a positive number',
      'number.max': 'Estimated cost cannot exceed $99,999,999.99'
    }),

  urgencyLevel: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .default('medium')
    .messages({
      'any.only': 'Urgency level must be one of: low, medium, high, urgent'
    })

  // Remove createdBy requirement - backend will handle this automatically
});

/**
 * Validation schema for updating a transportation request
 */
const updateRequestSchema = Joi.object({
  origin: Joi.string()
    .trim()
    .min(3)
    .max(255)
    .optional()
    .messages({
      'string.min': 'Origin must be at least 3 characters long',
      'string.max': 'Origin cannot exceed 255 characters'
    }),

  destination: Joi.string()
    .trim()
    .min(3)
    .max(255)
    .optional()
    .messages({
      'string.min': 'Destination must be at least 3 characters long',
      'string.max': 'Destination cannot exceed 255 characters'
    }),

  // Match create schema field name
  estimatedDistance: Joi.number()
    .positive()
    .precision(2)
    .max(9999999.99)
    .optional()
    .messages({
      'number.positive': 'Distance must be a positive number',
      'number.max': 'Distance cannot exceed 9,999,999.99 miles'
    }),

  // Match create schema field name
  pickUpDateTime: Joi.date()
    .iso()
    .min('now')
    .optional()
    .messages({
      'date.base': 'Pickup date/time must be a valid date',
      'date.min': 'Pickup date/time cannot be in the past'
    }),

  // Match create schema field name
  truckCount: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'number.base': 'Truck count must be a number',
      'number.integer': 'Truck count must be a whole number',
      'number.min': 'At least 1 truck is required',
      'number.max': 'Cannot exceed 50 trucks'
    }),

  truckType: Joi.string()
    .valid('box', 'flatbed', 'semi', 'refrigerated')
    .optional()
    .messages({
      'any.only': 'Truck type must be one of: box, flatbed, semi, refrigerated'
    }),

  loadDetails: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Load details cannot exceed 1000 characters'
    }),

  specialRequirements: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Special requirements cannot exceed 1000 characters'
    }),

  estimatedCost: Joi.number()
    .positive()
    .precision(2)
    .max(99999999.99)
    .optional()
    .messages({
      'number.positive': 'Estimated cost must be a positive number',
      'number.max': 'Estimated cost cannot exceed $99,999,999.99'
    }),

  urgencyLevel: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .optional()
    .messages({
      'any.only': 'Urgency level must be one of: low, medium, high, urgent'
    }),

  status: Joi.string()
    .valid('planned', 'cancelled')
    .optional()
    .messages({
      'any.only': 'Status can only be updated to: planned, cancelled'
    })
});

/**
 * Validation schema for logging delivery completion data
 */
const createDeliverySchema = Joi.object({
  actualPickupDate: Joi.date()
    .iso()
    .max('now')
    .required()
    .messages({
      'date.base': 'Actual pickup date must be a valid date',
      'date.max': 'Actual pickup date cannot be in the future',
      'any.required': 'Actual pickup date is required'
    }),

  actualPickupTime: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'Actual pickup time must be in HH:MM format (24-hour)',
      'any.required': 'Actual pickup time is required'
    }),

  actualTrucks: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .required()
    .messages({
      'number.base': 'Actual trucks must be a number',
      'number.integer': 'Actual trucks must be a whole number',
      'number.min': 'At least 1 truck is required',
      'number.max': 'Cannot exceed 50 trucks',
      'any.required': 'Actual trucks is required'
    }),

  driverName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Driver name is required',
      'string.min': 'Driver name must be at least 2 characters long',
      'string.max': 'Driver name cannot exceed 100 characters'
    }),

  driverCompany: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Driver company is required',
      'string.min': 'Driver company must be at least 2 characters long',
      'string.max': 'Driver company cannot exceed 100 characters'
    }),

  punctualityRating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.base': 'Punctuality rating must be a number',
      'number.integer': 'Punctuality rating must be a whole number',
      'number.min': 'Punctuality rating must be between 1 and 5',
      'number.max': 'Punctuality rating must be between 1 and 5',
      'any.required': 'Punctuality rating is required'
    }),

  professionalismRating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.base': 'Professionalism rating must be a number',
      'number.integer': 'Professionalism rating must be a whole number',
      'number.min': 'Professionalism rating must be between 1 and 5',
      'number.max': 'Professionalism rating must be between 1 and 5',
      'any.required': 'Professionalism rating is required'
    }),

  overallRating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.base': 'Overall rating must be a number',
      'number.integer': 'Overall rating must be a whole number',
      'number.min': 'Overall rating must be between 1 and 5',
      'number.max': 'Overall rating must be between 1 and 5',
      'any.required': 'Overall rating is required'
    }),

  invoiceAmount: Joi.number()
    .positive()
    .precision(2)
    .max(99999999.99)
    .required()
    .messages({
      'number.base': 'Invoice amount must be a number',
      'number.positive': 'Invoice amount must be a positive number',
      'number.max': 'Invoice amount cannot exceed $99,999,999.99',
      'any.required': 'Invoice amount is required'
    }),

  invoiceNumber: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Invoice number is required',
      'string.min': 'Invoice number must be at least 3 characters long',
      'string.max': 'Invoice number cannot exceed 50 characters'
    }),

  deliveryNotes: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Delivery notes cannot exceed 1000 characters'
    }),

  loggedBy: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Logged by is required',
      'string.min': 'Logged by must be at least 2 characters long',
      'string.max': 'Logged by cannot exceed 100 characters'
    })
});

/**
 * Validation schema for updating delivery completion data
 */
const updateDeliverySchema = Joi.object({
  actualPickupDate: Joi.date()
    .iso()
    .max('now')
    .optional()
    .messages({
      'date.base': 'Actual pickup date must be a valid date',
      'date.max': 'Actual pickup date cannot be in the future'
    }),

  actualPickupTime: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
      'string.pattern.base': 'Actual pickup time must be in HH:MM format (24-hour)'
    }),

  actualTrucks: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'number.base': 'Actual trucks must be a number',
      'number.integer': 'Actual trucks must be a whole number',
      'number.min': 'At least 1 truck is required',
      'number.max': 'Cannot exceed 50 trucks'
    }),

  driverName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Driver name must be at least 2 characters long',
      'string.max': 'Driver name cannot exceed 100 characters'
    }),

  driverCompany: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Driver company must be at least 2 characters long',
      'string.max': 'Driver company cannot exceed 100 characters'
    }),

  punctualityRating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .optional()
    .messages({
      'number.base': 'Punctuality rating must be a number',
      'number.integer': 'Punctuality rating must be a whole number',
      'number.min': 'Punctuality rating must be between 1 and 5',
      'number.max': 'Punctuality rating must be between 1 and 5'
    }),

  professionalismRating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .optional()
    .messages({
      'number.base': 'Professionalism rating must be a number',
      'number.integer': 'Professionalism rating must be a whole number',
      'number.min': 'Professionalism rating must be between 1 and 5',
      'number.max': 'Professionalism rating must be between 1 and 5'
    }),

  overallRating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .optional()
    .messages({
      'number.base': 'Overall rating must be a number',
      'number.integer': 'Overall rating must be a whole number',
      'number.min': 'Overall rating must be between 1 and 5',
      'number.max': 'Overall rating must be between 1 and 5'
    }),

  invoiceAmount: Joi.number()
    .positive()
    .precision(2)
    .max(99999999.99)
    .optional()
    .messages({
      'number.base': 'Invoice amount must be a number',
      'number.positive': 'Invoice amount must be a positive number',
      'number.max': 'Invoice amount cannot exceed $99,999,999.99'
    }),

  invoiceNumber: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Invoice number must be at least 3 characters long',
      'string.max': 'Invoice number cannot exceed 50 characters'
    }),

  deliveryNotes: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Delivery notes cannot exceed 1000 characters'
    })
});

/**
 * Validation schema for query parameters (filtering, pagination)
 */
const querySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be a whole number',
      'number.min': 'Page must be at least 1'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be a whole number',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),

  status: Joi.string()
    .valid('planned', 'completed', 'cancelled')
    .optional()
    .messages({
      'any.only': 'Status must be one of: planned, completed, cancelled'
    }),

  urgencyLevel: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .optional()
    .messages({
      'any.only': 'Urgency level must be one of: low, medium, high, urgent'
    }),

  truckType: Joi.string()
    .valid('box', 'flatbed', 'semi', 'refrigerated')
    .optional()
    .messages({
      'any.only': 'Truck type must be one of: box, flatbed, semi, refrigerated'
    }),

  search: Joi.string()
    .trim()
    .max(255)
    .optional()
    .messages({
      'string.max': 'Search term cannot exceed 255 characters'
    }),

  dateFrom: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'Date from must be a valid date'
    }),

  dateTo: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'Date to must be a valid date'
    })
});

/**
 * Sanitize and validate request data
 * @param {Object} data - Data to validate
 * @param {Object} schema - Joi schema to use
 * @returns {Object} Validation result
 */
const validateRequest = (data, schema) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return {
      isValid: false,
      errors: details,
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
  createRequestSchema,
  updateRequestSchema,
  createDeliverySchema,
  updateDeliverySchema,
  querySchema,
  validateRequest
};