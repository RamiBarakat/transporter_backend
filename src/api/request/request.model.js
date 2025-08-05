const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

/**
 * Transportation Request Model
 * Represents a transportation request created by logistics coordinators
 */
const TransportationRequest = sequelize.define('TransportationRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requestNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
    field: 'request_number'
  },
  origin: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  destination: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  estimatedDistance: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    field: 'estimated_distance'
  },
  pickUpDateTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'pickup_datetime'
  },
  truckCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'truck_count'
  },
  truckType: {
    type: DataTypes.ENUM('box', 'flatbed', 'semi', 'refrigerated'),
    allowNull: false,
    defaultValue: 'box',
    field: 'truck_type'
  },
  loadDetails: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'load_details'
  },
  specialRequirements: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'special_requirements'
  },
  estimatedCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'estimated_cost'
  },
  urgencyLevel: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium',
    field: 'urgency_level'
  },
  status: {
    type: DataTypes.ENUM('planned', 'processing', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'planned'
  },
  createdBy: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'System',
    field: 'created_by'
  }
}, {
  tableName: 'transportation_requests',
  timestamps: true,
  paranoid: true,
  deletedAt: 'deleted_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['pickup_datetime']
    }
  ]
});

TransportationRequest.prototype.getPerformanceMetrics = function() {
  if (!this.Delivery) return null;

  const delivery = this.Delivery;
  
  // Calculate delay in minutes
  const plannedDateTime = new Date(this.pickUpDateTime);
  const actualDateTime = new Date(delivery.actualPickupDateTime);
  const delayMinutes = Math.round((actualDateTime - plannedDateTime) / (1000 * 60));
  
  // Calculate truck variance
  const truckVariance = delivery.actualTruckCount - this.truckCount;
  const truckVariancePercentage = this.truckCount > 0 
    ? ((truckVariance / this.truckCount) * 100) 
    : 0;
  
  // Calculate cost variance
  const costVariance = delivery.invoiceAmount - (this.estimatedCost || 0);
  const costVariancePercentage = this.estimatedCost > 0 
    ? ((costVariance / this.estimatedCost) * 100) 
    : 0;
  
  // Determine performance grade
  let performanceGrade = 'Excellent';
  if (delayMinutes > 60 || Math.abs(truckVariancePercentage) > 50 || Math.abs(costVariancePercentage) > 25) {
    performanceGrade = 'Poor';
  } else if (delayMinutes > 30 || Math.abs(truckVariancePercentage) > 25 || Math.abs(costVariancePercentage) > 15) {
    performanceGrade = 'Fair';
  } else if (delayMinutes > 15 || Math.abs(truckVariancePercentage) > 10 || Math.abs(costVariancePercentage) > 10) {
    performanceGrade = 'Good';
  }

  return {
    delayMinutes,
    truckVariance,
    costVariance: parseFloat(costVariance.toFixed(2)),
    truckVariancePercentage: parseFloat(truckVariancePercentage.toFixed(2)),
    costVariancePercentage: parseFloat(costVariancePercentage.toFixed(2)),
    performanceGrade
  };
};

module.exports = {
  TransportationRequest
};