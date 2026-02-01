// dashboardController.js
// Handles dashboard data aggregation and delivery for the UniMate backend.
// All dashboard queries are tenant-scoped and permission-based.

const dashboardService = require('../services/dashboardService');

const getDashboard = async (req, res, next) => {
  try {
    // Only authorized users (admins, teachers, department admins) can access dashboard
    const dashboardData = await dashboardService.getDashboardData(req.tenantId, req.user);
    res.json({ success: true, data: dashboardData });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard
};
