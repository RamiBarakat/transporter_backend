const { sequelize, DBconnect } = require("../config/db");
const { TransportationRequest } = require("../api/request/request.model");
const { Driver } = require("../api/driver/driver.model");
const { Delivery, DriverRating } = require("../api/delivery/delivery.model");

/**
 * Define model associations
 * Sets up relationships between models
 */
const defineAssociations = () => {
    // TransportationRequest has one Delivery
    TransportationRequest.hasOne(Delivery, {
        foreignKey: 'requestId',
        as: 'Delivery',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    Delivery.belongsTo(TransportationRequest, {
        foreignKey: 'requestId',
        as: 'TransportationRequest',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    // Delivery has many DriverRatings
    Delivery.hasMany(DriverRating, {
        foreignKey: 'deliveryId',
        as: 'DriverRatings',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    DriverRating.belongsTo(Delivery, {
        foreignKey: 'deliveryId',
        as: 'Delivery',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    // Driver has many DriverRatings
    Driver.hasMany(DriverRating, {
        foreignKey: 'driverId',
        as: 'Ratings',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    DriverRating.belongsTo(Driver, {
        foreignKey: 'driverId',
        as: 'Driver',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    console.log('Model associations defined successfully.');
};

/**
 * Initialize all models and database connection
 */
const initModels = async () => {
    try {
        await DBconnect();
        console.log('Database connected successfully.');

        // Define associations before syncing
        defineAssociations();

        // Sync database with models
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully.');

        // Log available models
        console.log('Available models:', Object.keys(sequelize.models));

    } catch (err) {
        console.error('Error initializing database:', err);
        throw err;
    }
};

module.exports = {
    sequelize,
    TransportationRequest,
    Driver,
    Delivery,
    DriverRating,
    initModels,
    defineAssociations
};
