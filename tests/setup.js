const { sequelize } = require('../src/config/db');

jest.setTimeout(30000);

beforeAll(async () => {
  console.log = jest.fn();
  
  try {
    await sequelize.authenticate();
    
    const { TransportationRequest } = require('../src/api/request/request.model');
    const { Driver } = require('../src/api/driver/driver.model');
    const { Delivery, DriverRating } = require('../src/api/delivery/delivery.model');

    TransportationRequest.hasOne(Delivery, {
      foreignKey: 'requestId',
      as: 'Delivery'
    });
    Delivery.belongsTo(TransportationRequest, {
      foreignKey: 'requestId',
      as: 'TransportationRequest'
    });
    Delivery.hasMany(DriverRating, {
      foreignKey: 'deliveryId',
      as: 'DriverRatings'
    });
    DriverRating.belongsTo(Delivery, {
      foreignKey: 'deliveryId',
      as: 'Delivery'
    });
    Driver.hasMany(DriverRating, {
      foreignKey: 'driverId',
      as: 'Ratings'
    });
    DriverRating.belongsTo(Driver, {
      foreignKey: 'driverId',
      as: 'Driver'
    });

  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
});

// Global test cleanup
afterAll(async () => {
  if (sequelize) {
    await sequelize.close();
  }
});