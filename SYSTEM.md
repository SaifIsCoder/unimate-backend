# uniMate - SYSTEM
> Master reference for any coding agent working on this project.
> Read this file before making structural decisions.
> Keep this file aligned with the actual repository state.

---

## 1. What This Repo Is

**uniMate** is an academic management backend for the Department of Information Technology, University of Sargodha.

This repository contains the backend API only. There is no frontend in this repo.

Current implemented scope:

- Core Express + TypeScript backend scaffold
- Environment validation
- Redis connection
- Supabase client setup
- Shared error/response helpers
- Auth middleware
- Auth module (`login`, `refresh`, `logout`, `forgot-password`, `reset-password`)

Not implemented yet:

- SQL migrations
- seed data
- admin/student/teacher/business modules beyond auth
- background jobs
- automated tests

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript (`strict`) |
| Framework | Express |
| Database access | Supabase client (`@supabase/supabase-js`) |
| Cache / sessions | Redis via `ioredis` |
| Auth | Custom JWT with `jsonwebtoken` + `bcryptjs` |
| Validation | Zod |
| Scheduler | `node-cron` |
| File storage | Cloudinary |
| Push notifications | Firebase Admin / FCM |
| AI | Groq SDK |
| Package manager | npm |

Project constraints:

- No Python service
- No Docker requirement
- Backend only

---

## 3. Project Location

Current workspace path:

```text
S:\unimate\unimate-fyp\server\
```

---

## 4. Current Repo Structure

```text
server/
|-- database/
|   |-- migrations/
|   `-- seeds/
|-- src/
|   |-- config/
|   |   |-- env.ts
|   |   |-- redis.ts
|   |   `-- supabase.ts
|   |-- middleware/
|   |   |-- auth.ts
|   |   |-- errorHandler.ts
|   |   |-- rateLimiter.ts
|   |   `-- validate.ts
|   |-- modules/
|   |   `-- auth/
|   |       |-- auth.controller.ts
|   |       |-- auth.routes.ts
|   |       |-- auth.schema.ts
|   |       `-- auth.service.ts
|   |-- shared/
|   |   |-- errors.ts
|   |   `-- response.ts
|   |-- app.ts
|   `-- server.ts
|-- .env
|-- .gitignore
|-- package.json
|-- package-lock.json
|-- PROGRESS.md
|-- SYSTEM.md
`-- tsconfig.json
```

Notes:

- `database/migrations/` exists but is currently empty.
- `database/seeds/` exists but is currently empty.
- `.env.example` does not exist yet.

### Planned Future Modules

These are part of the planned architecture, but they are not present in the repo yet:

- `students`
- `teachers`
- `courses`
- `enrollment`
- `sessions`
- `attendance`
- `grades`
- `grading-scheme`
- `assignments`
- `announcements`
- `notifications`
- `calendar`
- `analytics`
- `ai`
- `jobs/*`

### Module File Convention

Every domain module should follow this pattern:

```text
modules/<name>/
|-- <name>.routes.ts
|-- <name>.controller.ts
|-- <name>.service.ts
`-- <name>.schema.ts
```

Rules:

- Routes define endpoints and middleware order only.
- Controllers handle `req` / `res` and delegate to services.
- Services contain business logic and data access.
- Schemas hold Zod validation.

---

## 5. Current Runtime Behavior

### Startup Flow

`src/server.ts` currently does this:

1. Load `.env` with `dotenv`
2. Validate required env vars
3. Connect to Redis
4. Start the Express server

### Middleware / App Setup

`src/app.ts` currently configures:

- `helmet()`
- `cors()`
- `express.json()`
- `express.urlencoded()`
- global rate limiter
- health route
- auth routes
- global error handler

### Live Route Prefix

The current codebase uses:

```text
/api/v1
```

This is the canonical prefix unless intentionally changed in code and docs together.

---

## 6. Implemented Endpoints

### Health

```text
GET /api/v1/health
```

Returns basic server status metadata.

### Auth

```text
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

Current auth behavior:

- `login` checks email/password against the `users` table
- access token expiry is `24h`
- refresh token expiry is `7d`
- refresh token is stored in Redis as `refresh:{userId}`
- `forgot-password` stores a 6-digit OTP in Redis for 10 minutes
- OTP delivery is not implemented yet; in development it logs to console
- `logout` deletes the stored refresh token

---

## 7. Authentication And RBAC

### JWT Payload

```ts
{
  userId: string;
  role: 'student' | 'teacher' | 'admin';
}
```

### Middleware Available

- `authenticate`
- `checkActive`
- `requireRole(...roles)`

Typical protected chain:

```text
authenticate -> checkActive -> requireRole('admin') -> controller
```

### Redis Keys In Use

```text
refresh:{userId}
otp:{email}
```

### Assumed Database Fields For Auth

The current auth service expects a `users` table with at least:

```text
id
name
email
password_hash
role
is_active
```

This is important because auth code already depends on it even though the migration file does not exist yet.

---

## 8. Database Direction

### Current State

- Supabase client is configured in `src/config/supabase.ts`
- No SQL migration files exist yet
- No seed SQL files exist yet

### Planned Tables

These tables are still the intended long-term design:

- `users`
- `students`
- `teachers`
- `admins`
- `courses`
- `grading_scheme`
- `grade_config`
- `enrollments`
- `schedules`
- `class_sessions`
- `attendance`
- `grades`
- `assignments`
- `assignment_submissions`
- `announcements`
- `notifications`
- `academic_calendar`

### Important Modeling Rules

- Do not connect `attendance` directly to `student_id`; go through `enrollment_id`
- Do not connect `grades` directly to `student_id`; go through `enrollment_id`
- Use soft delete where the project rules require it

---

## 9. Response And Error Conventions

Shared helpers live in `src/shared/response.ts`.

Response shapes:

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "error": "message" }
```

Validation middleware currently returns:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": []
}
```

Error handling rules:

- Use `AppError` for operational errors
- Do not expose raw stack traces to clients
- Let the global error handler produce the final error response

---

## 10. Environment Variables

### Currently Required At Startup

`src/config/env.ts` currently requires:

```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
REDIS_URL=
```

### Common Project Variables

Other variables already used in code or planned by the architecture:

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=
GROQ_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

---

## 11. Installed Packages

Current notable runtime dependencies from `package.json`:

- `express`
- `cors`
- `helmet`
- `dotenv`
- `express-rate-limit`
- `@supabase/supabase-js`
- `ioredis`
- `jsonwebtoken`
- `bcryptjs`
- `zod`
- `cloudinary`
- `firebase-admin`
- `groq-sdk`
- `multer`
- `node-cron`
- `pg`
- `uuid`

Current notable dev dependencies:

- `typescript`
- `ts-node`
- `nodemon`
- `@types/node`
- `@types/express`
- `@types/jsonwebtoken`
- `@types/bcryptjs`
- `@types/cors`
- `@types/multer`
- `@types/uuid`

---

## 12. Coding Rules

1. Keep TypeScript strict; avoid `any` unless truly unavoidable.
2. Keep business logic out of controllers.
3. Keep database access in the service layer.
4. Validate request bodies with Zod before controller logic.
5. Return safe client-facing errors only.
6. Prefer async/await over callback or promise-chain style.
7. Keep module concerns separated into routes, controller, service, and schema files.
8. Preserve the existing `/api/v1` route prefix unless deliberately migrating the API.

---

## 13. Build And Verification

Current commands:

```text
npm run dev
npm run build
npm start
```

Latest verified status in this repo:

- TypeScript build passes
- Server starts successfully with the current local `.env`
- Redis connection succeeds locally

Not yet verified:

- end-to-end auth requests against real seeded data
- migration execution
- automated test suite

---

## 14. Roadmap Status

### Phase 1 - Foundation

Done:

- project scaffold
- config files
- middleware
- shared helpers
- app/server bootstrap

### Phase 2 - Auth

Partially done:

- auth module is implemented in code
- route mounting is done
- migration and seed setup are still missing
- real endpoint testing is still pending

### Remaining Phases

Not started in code yet:

- admin master data
- academic workflow
- communication
- AI
- analytics / exports / jobs

---

## 15. Immediate Next Steps

1. Create `database/migrations/001_users.sql`
2. Add seed data for auth testing
3. Test all `/api/v1/auth/*` endpoints against real data
4. Add `.env.example`
5. Continue with Phase 3 after auth is proven end to end

---

## 16. Document Sync Rule

When the project state changes:

1. Update `SYSTEM.md`
2. Update `PROGRESS.md`

If external BDS/SRS documents are being maintained outside this repo, keep them in sync too, but the repository truth source is the code plus these two Markdown files.
