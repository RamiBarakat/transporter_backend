const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

/**
 * Delivery Model
 * Represents a completed delivery with actual pickup details and invoice information
 */
const Delivery = sequelize.define('Delivery', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requestId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'request_id'
  },
  actualPickupDateTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'actual_pickup_datetime'
  },
  actualTruckCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'actual_truck_count'
  },
  invoiceAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'invoice_amount'
  },
  deliveryNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'delivery_notes'
  },
  loggedBy: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'logged_by'
  },
  loggedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'logged_at'
  }
}, {
  tableName: 'deliveries',
  timestamps: true,
  createdAt: 'created_at',
  paranoid: true,
  deletedAt: 'deleted_at',
  updatedAt: 'updated_at'
});

/**
 * Driver Rating Model
 * Represents performance ratings for drivers on specific deliveries
 */
const DriverRating = sequelize.define('DriverRating', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  deliveryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'delivery_id'
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'driver_id'
  },
  punctuality: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  professionalism: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  deliveryQuality: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 },
    field: 'delivery_quality'
  },
  communication: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 }
  },
  safety: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 }
  },
  policyCompliance: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 },
    field: 'policy_compliance'
  },
  fuelEfficiency: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 },
    field: 'fuel_efficiency'
  },
  overallRating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 },
    field: 'overall_rating'
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'driver_ratings',
  timestamps: false,
  createdAt: 'created_at',
  paranoid: true,
  deletedAt: 'deleted_at'
});

module.exports = {
  Delivery,
  DriverRating
};