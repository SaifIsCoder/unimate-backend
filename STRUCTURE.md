# Server — Features & Files

This document lists each feature folder and every file present under the `server/` folder of the repository as of Jan 30, 2026.

## Top-level

- `package.json` — project dependencies and scripts.
- `README.md` — server README and high-level info.

## src/

- `app.js` — application setup (middleware registration, routes mounting).
- `server.js` — server bootstrap and startup (HTTP listener).

### config/

- `swagger.js` — OpenAPI/Swagger configuration.

### controllers/

- `academicCycleController.js` — CRUD and endpoints for academic cycles.
- `auditLogController.js` — endpoints for retrieving/creating audit logs.
- `authController.js` — login, logout, token issuance, auth flows.
- `classController.js` — class-related endpoints and operations.
- `departmentController.js` — department CRUD and helpers.
- `enrollmentController.js` — enrollment actions and endpoints.
- `programController.js` — program-level endpoints.
- `userController.js` — user CRUD, profile, and user-specific actions.

### middlewares/

- `auditLogger.js` — logs requests/actions to the audit system.
- `auth.js` — authentication check middleware (JWT, sessions).
- `enrollment.js` — middleware for validating enrollment constraints.
- `errorHandler.js` — central error-handling middleware.
- `rateLimiter.js` — request rate limiting.
- `requestId.js` — attaches unique request IDs for tracing.
- `requestLogger.js` — request logging middleware.
- `role.js` — role-based access control middleware.

### models/

- `AcademicCycle.js`
- `AIRequestLog.js`
- `Announcement.js`
- `Assignment.js`
- `Attendance.js`
- `AuditLog.js`
- `Class.js`
- `Department.js`
- `Enrollment.js`
- `Event.js`
- `Fee.js`
- `Fine.js`
- `Grade.js`
- `Program.js`
- `Subject.js`
- `Submission.js`
- `Tenant.js`
- `User.js`

Each model implements the schema and data access patterns for its domain entity.

### routes/

- `academicCycleRoutes.js` — routes for academic cycle operations.
- `auditLogRoutes.js` — audit log routes.
- `authRoutes.js` — authentication routes (login, refresh, etc.).
- `classRoutes.js` — class-related routes.
- `departmentRoutes.js` — department routes.
- `enrollmentRoutes.js` — enrollment routes.
- `programRoutes.js` — program-related routes.
- `userRoutes.js` — user routes (CRUD, profile endpoints).

### scripts/

- `seed.js` — database seeding script (creates initial/default data).

### services/

- `aiService.js` — integrations with AI services (logging, calls).
- `authorizationService.js` — central authorization logic and helpers.
- `departmentService.js` — business logic around departments.

There may be additional service modules for other domain logic; services encapsulate business rules and external integrations.

### utils/

- `auditLogger.js` — utility for writing audit logs programmatically.
- `errors.js` — custom error classes and helpers.
- `jwt.js` — JWT helpers for signing/verifying tokens.
- `pagination.js` — pagination helpers for endpoints.
- `password.js` — password hashing and verification utilities.
- `softDelete.js` — helpers for soft-deletion patterns.

## Notes & Next Steps

- If you want file-level descriptions expanded (parameters, exported functions), I can parse each file and add brief summaries.
- To keep this in sync, consider adding this generation as a script that reads the filesystem and emits an updated markdown.
