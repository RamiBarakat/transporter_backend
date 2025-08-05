const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Driver = sequelize.define('Driver', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('transporter', 'in_house'),
      allowNull: false
    },
    transportCompany: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'transport_company'
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    licenseNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'license_number'
    },
    employeeId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'employee_id'
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    hireDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'hire_date'
    },
    overallRating: {
      type: DataTypes.DECIMAL(2, 1),
      defaultValue: 0,
      field: 'overall_rating'
    },
    totalDeliveries: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_deliveries'
    },
    lastDelivery: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_delivery'
    }
  }, {
    tableName: 'drivers',
    timestamps: true,
    createdAt: 'created_at',
    paranoid: true,
    deletedAt: 'deleted_at',
    updatedAt: 'updated_at'
  });

module.exports = {
  Driver
};