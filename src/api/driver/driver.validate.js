const Joi = require('joi');

const createDriverSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).required(),
  type: Joi.string().valid('transporter', 'in_house').required(),
  transportCompany: Joi.when('type', {
    is: 'transporter',
    then: Joi.string().trim().min(2).max(255).required(),
    otherwise: Joi.optional()
  }),
  phone: Joi.when('type', {
    is: 'transporter',
    then: Joi.string().trim().min(10).max(50).required(),
    otherwise: Joi.optional()
  }),
  licenseNumber: Joi.when('type', {
    is: 'transporter',
    then: Joi.string().trim().min(5).max(100).required(),
    otherwise: Joi.optional()
  }),
  employeeId: Joi.when('type', {
    is: 'in_house',
    then: Joi.string().trim().min(2).max(50).required(),
    otherwise: Joi.optional()
  }),
  department: Joi.when('type', {
    is: 'in_house',
    then: Joi.string().trim().min(2).max(100).required(),
    otherwise: Joi.optional()
  }),
  hireDate: Joi.when('type', {
    is: 'in_house',
    then: Joi.date().max('now').required(),
    otherwise: Joi.optional()
  })
});

// Update schema allows partial updates (all fields optional)
const updateDriverSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).optional(),
  type: Joi.string().valid('transporter', 'in_house').optional(),
  transportCompany: Joi.string().trim().min(2).max(255).optional().allow(null, ''),
  phone: Joi.string().trim().min(10).max(50).optional().allow(null, ''),
  licenseNumber: Joi.string().trim().min(5).max(100).optional().allow(null, ''),
  employeeId: Joi.string().trim().min(2).max(50).optional().allow(null, ''),
  department: Joi.string().trim().min(2).max(100).optional().allow(null, ''),
}).min(1);

const searchDriversSchema = Joi.object({
  search: Joi.string().trim().max(255).optional(),
  type: Joi.string().valid('transporter', 'in_house', 'all').optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional()
});

const driverRatingSchema = Joi.object({
  punctuality: Joi.number().integer().min(1).max(5).required(),
  professionalism: Joi.number().integer().min(1).max(5).required(),
  deliveryQuality: Joi.number().integer().min(1).max(5).optional(),
  communication: Joi.number().integer().min(1).max(5).optional(),
  safety: Joi.number().integer().min(1).max(5).optional(),
  policyCompliance: Joi.number().integer().min(1).max(5).optional(),
  fuelEfficiency: Joi.number().integer().min(1).max(5).optional(),
  overall: Joi.number().integer().min(1).max(5).required(),
  comments: Joi.string().trim().max(1000).optional().allow('')
});

const deliveryWithDriversSchema = Joi.object({
  actualPickupDateTime: Joi.date().required(),
  actualTruckCount: Joi.number().integer().min(1).required(),
  invoiceAmount: Joi.number().min(0).required(),
  deliveryNotes: Joi.string().trim().max(1000).optional().allow(''),
  drivers: Joi.array().min(1).items(
    Joi.object({
      driver_id: Joi.number().integer().positive().optional(),
      punctuality: Joi.number().integer().min(1).max(5).optional(),
      professionalism: Joi.number().integer().min(1).max(5).optional(),
      deliveryQuality: Joi.number().integer().min(1).max(5).optional(),
      communication: Joi.number().integer().min(1).max(5).optional(),
      safety: Joi.number().integer().min(1).max(5).optional(),
      policyCompliance: Joi.number().integer().min(1).max(5).optional(),
      fuelEfficiency: Joi.number().integer().min(1).max(5).optional(),
      overall: Joi.number().integer().min(1).max(5).optional(),
      comments: Joi.string().trim().max(1000).optional().allow(''),
      
      id: Joi.number().integer().optional(),
      name: Joi.string().trim().min(2).max(255).optional(),
      type: Joi.string().valid('transporter', 'in_house').optional(),
      transportCompany: Joi.when('type', {
        is: 'transporter',
        then: Joi.string().trim().min(2).max(255).required(),
        otherwise: Joi.optional()
      }),
      phone: Joi.when('type', {
        is: 'transporter',
        then: Joi.string().trim().min(10).max(50).required(),
        otherwise: Joi.optional()
      }),
      licenseNumber: Joi.when('type', {
        is: 'transporter',
        then: Joi.string().trim().min(5).max(100).required(),
        otherwise: Joi.optional()
      }),
      employeeId: Joi.when('type', {
        is: 'in_house',
        then: Joi.string().trim().min(2).max(50).required(),
        otherwise: Joi.optional()
      }),
      department: Joi.when('type', {
        is: 'in_house',
        then: Joi.string().trim().min(2).max(100).required(),
        otherwise: Joi.optional()
      }),
      hireDate: Joi.when('type', {
        is: 'in_house',
        then: Joi.date().max('now').required(),
        otherwise: Joi.optional()
      }),
      rating: driverRatingSchema
    }).or('driver_id', 'id', 'name') 
  ).required()
});

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
  validateRequest,
  createDriverSchema,
  updateDriverSchema,
  searchDriversSchema,
  deliveryWithDriversSchema
};