require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const programRoutes = require('./routes/programRoutes');
const academicCycleRoutes = require('./routes/academicCycleRoutes');
const classRoutes = require('./routes/classRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const feeRoutes = require('./routes/feeRoutes');
const eventRoutes = require('./routes/eventRoutes');
const announcementRoutes = require('./routes/announcementRoutes');

// Import middleware
const errorHandler = require('./middlewares/errorHandler');
const requestLogger = require('./middlewares/requestLogger');
const requestId = require('./middlewares/requestId');
const { globalLimiter, authLimiter } = require('./middlewares/rateLimiter');

// Import Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

/**
 * Express App Configuration
 * 
 * WHY: Centralized app setup with security, CORS, rate limiting.
 * All routes are versioned under /api/v1 for API versioning.
 */

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Request ID injection (must be early)
app.use(requestId);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Rate limiting (tenant-aware)
app.use('/api/', globalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'UniMate API is running',
    timestamp: new Date().toISOString()
  });
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'UniMate API Documentation'
}));

// API routes (versioned)
// Auth routes with stricter rate limiting
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/programs', programRoutes);
app.use('/api/v1/academic-cycles', academicCycleRoutes);
app.use('/api/v1/classes', classRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/grades', gradeRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/announcements', announcementRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
