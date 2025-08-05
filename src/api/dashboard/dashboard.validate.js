const Joi = require('joi');

const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso().required().messages({
    'date.base': 'Start date must be a valid date',
    'date.iso': 'Start date must be in ISO format (YYYY-MM-DD)',
    'any.required': 'Start date is required'
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
    'date.base': 'End date must be a valid date',
    'date.iso': 'End date must be in ISO format (YYYY-MM-DD)', 
    'date.min': 'End date must be after start date',
    'any.required': 'End date is required'
  }),
  // Allow cache-busting and other frontend parameters
  _t: Joi.string().optional()
}).unknown(true);

const validateDateRange = (req, res, next) => {
  const { error } = dateRangeSchema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.details[0].message,
        details: error.details
      }
    });
  }

  // Check if date range is not too large (max 90 days)
  const startDate = new Date(req.query.startDate);
  const endDate = new Date(req.query.endDate);
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  if (daysDiff > 90) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'DATE_RANGE_TOO_LARGE',
        message: 'Date range cannot exceed 90 days'
      }
    });
  }

  next();
};

module.exports = {
  validateDateRange,
  dateRangeSchema
};