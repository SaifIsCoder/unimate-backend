// dashboardRoutes.js
// Exposes dashboard endpoint for UniMate backend.

const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/auth');

// GET /api/v1/dashboard
router.get('/', authenticate, getDashboard);

module.exports = router;
