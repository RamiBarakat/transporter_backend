const express = require('express');
const router = express.Router();
const driverController = require('./driver.controller');

router.get('/recent', driverController.getRecentDrivers);

router.get('/', driverController.searchDrivers);

router.post('/', driverController.createDriver);

router.get('/:id', driverController.getDriverById);

router.get('/:id/ratings', driverController.getDriverRatings);

router.post('/:id/insights', driverController.getDriverInsights);

router.put('/:id', driverController.updateDriver);

router.delete('/:id', driverController.deleteDriver);

module.exports = router;