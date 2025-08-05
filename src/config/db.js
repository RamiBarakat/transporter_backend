const { Sequelize, Op, Transaction } = require('sequelize');
const config = require('./config');

const sequelize  = new Sequelize(
    config.db.database,
    config.db.user,
    config.db.password,
    {
        host: config.db.host,
        dialect: config.db.dialect,
        port: config.db.port,
        logging: false,
        dialectOptions: {
            decimalNumbers: true
        },
        pool: {
            max: 10,
            min: 0,
            acquire: 60000,
            idle: 10000
        },
        // Add transaction configuration
        transactionOptions: {
            isolationLevel: 'READ_COMMITTED',
            autocommit: false
        },
        retry: {
            match: [
                /ETIMEDOUT/,
                /EHOSTUNREACH/,
                /ECONNRESET/,
                /ECONNREFUSED/,
                /TIMEOUT/,
                /Lock wait timeout exceeded/,
                /Deadlock found when trying to get lock/
            ],
            max: 3
        }
    }
);

const DBconnect = async () => {
    sequelize.authenticate()
        .then(() => {
            console.log('Connection has been established successfully.');
        })
        .catch(err => {
            console.error('Unable to connect to the database:', err);
        });
}



module.exports = {
    sequelize,
    DBconnect,
    Op,
    Transaction
};
