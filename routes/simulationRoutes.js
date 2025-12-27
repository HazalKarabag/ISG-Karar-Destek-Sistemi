const express = require('express');
const router = express.Router();
const riskController = require('../controllers/riskController');

// Stratejik Risk Projeksiyonu (6-12 ay)
router.get('/simulation', riskController.getSimulation);

module.exports = router;

