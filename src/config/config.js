require('dotenv').config(); // This loads your .env variables

const env = process.env.NODE_ENV || 'development';

// console.log('process.env.DB_USER', process.env.DB_USER);

// Define the core database connection configuration for each environment
// This is the structure Sequelize CLI expects.
const databaseConfigs = {
  development: {
    user: process.env.DB_USER,      
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT || 3306,
    // You can add other Sequelize connection options here (e.g., logging)
  },
  test: {
    // Define your test database configuration here, similar to development
    user: process.env.TEST_DB_USER || process.env.DB_USER,
    username: process.env.TEST_DB_USER || process.env.DB_USER,
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.TEST_DB_NAME || `${process.env.DB_NAME}_test`,
    host: process.env.TEST_DB_HOST || process.env.DB_HOST,
    dialect: process.env.TEST_DB_DIALECT || process.env.DB_DIALECT,
    port: process.env.TEST_DB_PORT || process.env.DB_PORT || 3306,
  },
  production: {
    // Define your production database configuration here
    user: process.env.PROD_DB_USER || process.env.DB_USER,
    username: process.env.PROD_DB_USER || process.env.DB_USER,
    password: process.env.PROD_DB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.PROD_DB_NAME || process.env.DB_NAME,
    host: process.env.PROD_DB_HOST || process.env.DB_HOST,
    dialect: process.env.PROD_DB_DIALECT || process.env.DB_DIALECT,
    port: process.env.PROD_DB_PORT || process.env.DB_PORT || 3306,
  }
};

// Export the main object that Sequelize CLI looks for
// and also include application-specific configurations
module.exports = {
  // This part is for Sequelize CLI (it reads these environment keys)
  development: databaseConfigs.development,
  test: databaseConfigs.test,
  production: databaseConfigs.production,

  // This part is for your application (it will access these directly)
  // Your app code can continue to use `config.jwtSecret`, `config.locale`
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  locale: process.env.LOCALE || 'en',

  // This `db` property will expose the CURRENT environment's database config
  // in the structure your application expects (e.g., `config.db.host`)
  db: databaseConfigs[env],
};