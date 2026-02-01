const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Swagger/OpenAPI Configuration
 * 
 * WHY: Comprehensive API documentation for developers.
 * Auto-generates interactive API docs from JSDoc comments.
 */

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UniMate SaaS API',
      version: '1.0.0',
      description: 'Multi-tenant Education Management System API Documentation',
      contact: {
        name: 'UniMate API Support',
        email: 'support@unimate.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.unimate.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT access token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            data: {
              type: 'object'
            }
          }
        },
        Tenant: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'Sample University'
            },
            code: {
              type: 'string',
              example: 'SU'
            },
            country: {
              type: 'string',
              example: 'United States'
            },
            timezone: {
              type: 'string',
              example: 'America/New_York'
            },
            status: {
              type: 'string',
              enum: ['active', 'suspended', 'archived'],
              example: 'active'
            },
            settings: {
              type: 'object',
              properties: {
                gradingSystem: {
                  type: 'string',
                  enum: ['percentage', 'gpa', 'letter']
                },
                cycleNaming: {
                  type: 'string',
                  enum: ['semester', 'trimester', 'term', 'quarter']
                }
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            tenantId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            email: {
              type: 'string',
              example: 'user@university.edu'
            },
            role: {
              type: 'string',
              enum: ['student', 'teacher', 'admin'],
              example: 'student'
            },
            status: {
              type: 'string',
              enum: ['active', 'blocked', 'pending'],
              example: 'active'
            },
            profile: {
              type: 'object',
              properties: {
                fullName: {
                  type: 'string',
                  example: 'John Doe'
                },
                phone: {
                  type: 'string',
                  example: '+1234567890'
                },
                avatarUrl: {
                  type: 'string'
                }
              }
            }
          }
        },
        Department: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            tenantId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'Computer Science'
            },
            code: {
              type: 'string',
              example: 'CS'
            },
            description: {
              type: 'string',
              example: 'Department of Computer Science'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              example: 'active'
            }
          }
        },
        Program: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            tenantId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            departmentId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'Bachelor of Science in Computer Science'
            },
            description: {
              type: 'string'
            },
            durationYears: {
              type: 'number',
              example: 4
            },
            cycleType: {
              type: 'string',
              enum: ['semester', 'trimester', 'annual'],
              example: 'semester'
            },
            totalCycles: {
              type: 'number',
              example: 8
            },
            creditSystem: {
              type: 'string',
              enum: ['credits', 'hours', 'units'],
              example: 'credits'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'archived'],
              example: 'active'
            }
          }
        },
        AcademicCycle: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            tenantId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            programId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'Fall 2024'
            },
            sequenceNumber: {
              type: 'number',
              example: 1
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              example: '2024-09-01T00:00:00.000Z'
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              example: '2024-12-31T23:59:59.999Z'
            },
            status: {
              type: 'string',
              enum: ['upcoming', 'active', 'completed', 'cancelled'],
              example: 'active'
            }
          }
        },
        Class: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            tenantId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            programId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            academicCycleId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            session: {
              type: 'string',
              example: '2024-2025'
            },
            type: {
              type: 'string',
              enum: ['regular', 'self', 'evening', 'weekend'],
              example: 'regular'
            },
            shift: {
              type: 'string',
              enum: ['morning', 'evening'],
              example: 'morning'
            },
            capacity: {
              type: 'number',
              example: 30
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'completed'],
              example: 'active'
            }
          }
        },
        Enrollment: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            tenantId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            userId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            classId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            roleInClass: {
              type: 'string',
              enum: ['student', 'teacher'],
              example: 'student'
            },
            status: {
              type: 'string',
              enum: ['active', 'dropped', 'completed'],
              example: 'active'
            },
            joinedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-09-01T00:00:00.000Z'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and token management'
      },
      {
        name: 'Departments',
        description: 'Department management operations'
      },
      {
        name: 'Programs',
        description: 'Program (degree) management operations'
      },
      {
        name: 'Academic Cycles',
        description: 'Academic cycle (semester/term) management'
      },
      {
        name: 'Classes',
        description: 'Class management operations'
      },
      {
        name: 'Enrollments',
        description: 'Enrollment management (security core)'
      }
    ]
  },
  apis: ['./src/routes/*.js'] // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
