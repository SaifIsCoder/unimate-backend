## 1. Project Overview

### What It Is
**uniMate** is an AI-powered academic management system built as a Final Year Project (FYP) for the Department of Information Technology, University of Sargodha, Pakistan.

### Core Goal
Replace informal academic management (WhatsApp groups, paper registers, spreadsheets) with a unified backend API that serves students, teachers, and department admins.

### Target Users
| Role | Access | Description |
|---|---|---|
| Student | Mobile app (React Native) | Views grades, attendance, schedule, assignments, announcements |
| Teacher |  Web dashboard | Marks attendance, enters grades, posts assignments/announcements |
| Admin | Web dashboard | Manages all master data, enrollments, approvals |

### Developer
Saif ur Rehman — Solo developer, University of Sargodha, March 2026

---

## 2. Architecture

### Stack (Locked — Do Not Change)
| Layer | Technology |
|---|---|
| Runtime | Node.js v24 |
| Language | TypeScript (strict mode) |
| Framework | Express.js |
| Database | PostgreSQL via Supabase (`@supabase/supabase-js`) |
| Cache / Sessions | Redis via Memurai (Windows) using `ioredis` |
| Auth | Custom JWT — `jsonwebtoken` + `bcryptjs` |
| File Storage | Cloudinary |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| AI / Chatbot | Groq API (`groq-sdk`) — Llama 3, called from Node.js |
| Validation | Zod |
| Scheduler | `node-cron` |
| Package Manager | npm |

**No Python. No Docker. No frontend. Backend API only.**

### Project Location
```
S:\unimate\api-server\
```

### High-Level Flow
```
Client (Mobile/Web)
  → HTTPS
  → Express API (Port 3000)
  → auth middleware (JWT verify + role check)
  → validate middleware (Zod)
  → controller (req/res only)
  → service (business logic + Supabase queries)
  → PostgreSQL (Supabase)
  → Redis (cache, sessions, rate limits)
```

### Module Structure (Every module follows this — no exceptions)
```
modules/<name>/
  <name>.routes.ts      → Express Router only
  <name>.controller.ts  → req/res only, calls service
  <name>.service.ts     → all business logic + DB calls
  <name>.schema.ts      → Zod validation schemas
```

### Key Architecture Decisions
| Decision | Choice | Reason |
|---|---|---|
| Auth | Custom JWT (not Supabase Auth) | Full control over RBAC + instant token invalidation via Redis |
| DB client | Supabase JS client (not raw pg) | Simpler, less boilerplate |
| Python | Not used | Groq called directly from Node.js |
| Docker | Not used | Windows dev machine, Memurai for Redis |
| Frontend | Not in this repo | Separate project |
| Soft delete | is_active = false | Never DELETE academic records in v1 |

---

## 3. Current Progress

### ✅ Phase 1 — Foundation (COMPLETE)
- Project scaffolded at `S:\unimate\api-server\`
- All dependencies installed
- `src/config/supabase.ts` — Supabase client with service role key
- `src/config/redis.ts` — ioredis connection
- `src/config/env.ts` — fail-fast env validation
- `src/shared/errors.ts` — AppError class
- `src/shared/response.ts` — sendSuccess / sendError
- `src/middleware/errorHandler.ts` — global error handler
- `src/middleware/rateLimiter.ts` — 100/min global, 10/min auth
- `src/middleware/auth.ts` — JWT verify + RBAC + checkActive
- `src/middleware/validate.ts` — Zod middleware
- `src/app.ts` — Express setup
- `src/server.ts` — entry point
- Server boots clean, `/api/v1/health` responds ✅

### ✅ Phase 2 — Auth Module (COMPLETE)
- `modules/auth/auth.schema.ts`
- `modules/auth/auth.service.ts`
- `modules/auth/auth.controller.ts`
- `modules/auth/auth.routes.ts`
- All 5 endpoints tested and passing in Postman:
  - `POST /api/v1/auth/login` ✅
  - `POST /api/v1/auth/refresh` ✅
  - `POST /api/v1/auth/logout` ✅
  - `POST /api/v1/auth/forgot-password` ✅
  - `POST /api/v1/auth/reset-password` ✅

### ✅ Database Schema (COMPLETE — 20 tables)
All migrations run successfully on Supabase:

| Migration | Tables |
|---|---|
| 001 | users, students, teachers, admins |
| 002 | courses, grade_config, grading_scheme |
| 003 | enrollments |
| 004 | schedules, class_sessions |
| 005 | attendance |
| 006 | grades, sessional_components, sessional_marks |
| 007 | assignments, assignment_submissions |
| 008 | announcements, announcement_reads, notifications |
| 009 | academic_calendar |

### ⏳ Phase 3 — Admin Master Data (NOT STARTED)
- [ ] modules/students/
- [ ] modules/teachers/
- [ ] modules/courses/
- [ ] modules/grading-scheme/
- [ ] modules/enrollment/

### ⏳ Phase 4 — Academic Workflow (NOT STARTED)
- [ ] modules/sessions/
- [ ] modules/attendance/
- [ ] jobs/autoMarkAttendance.ts
- [ ] modules/grades/
- [ ] modules/assignments/

### ⏳ Phase 5 — Communication (NOT STARTED)
- [ ] modules/announcements/
- [ ] modules/notifications/
- [ ] modules/calendar/

### ⏳ Phase 6 — AI (NOT STARTED)
- [ ] modules/ai/ (Groq chatbot + GPA goal calculator)

### ⏳ Phase 7 — Analytics & Export (NOT STARTED)
- [ ] modules/analytics/
- [ ] CSV export endpoints
- [ ] jobs/attendanceAlerts.ts

---

## 4. Next Task (CRITICAL)

**Build Phase 3 — Students Module first.**

Exact files to create:
```
src/modules/students/students.schema.ts
src/modules/students/students.service.ts
src/modules/students/students.controller.ts
src/modules/students/students.routes.ts
```

Endpoints to build:
```
GET    /api/v1/dept/students              🔒 admin  (list + search + filter)
POST   /api/v1/dept/students              🔒 admin  (create single student)
POST   /api/v1/dept/students/import       🔒 admin  (bulk CSV import)
PUT    /api/v1/dept/students/:id          🔒 admin  (edit student)
PATCH  /api/v1/dept/students/:id/deactivate 🔒 admin (soft delete)
```

After students → teachers → courses → grading-scheme → enrollment.

---

## 5. Constraints & Rules

### Hard Rules (Never Break)
- **No Python** — Groq called directly from Node.js
- **No Docker** — Memurai for Redis on Windows
- **No hard deletes** — always `is_active = false`
- **No business logic in controllers** — controllers call services only
- **No raw errors to client** — always AppError or generic 500
- **Always validate with Zod** before controller runs
- **All DB calls in service layer** — never in controller or routes
- **All admin operations logged** — timestamp, userId, action, recordId
- **Async/await everywhere** — no callbacks, no .then()
- **TypeScript strict mode** — no `any`

### Grading Rules (UoS Official)
- Marks rounded UP (60.1 → 61)
- GP formula: `min((percentage / 80) * 4.0, 4.0)`
- F if percentage < 40
- Letter grades: A(≥80), B(≥70), C(≥50), D(≥40), F(<40)
- Semester GPA: `SUM(gp * credit_hours) / SUM(credit_hours)`
- CGPA: same formula across all semesters, best attempt only
- 75% attendance required to be eligible for final exam
- Minimum 2.50 CGPA for degree completion
- Probation if CGPA between 2.00 and 2.49

### Attendance Rules
- Window = `start_time` to `start_time + 4 hours`
- After window → read-only forever
- Unmarked students → auto-present by cron job (every 5 min)
- Formula: `present / (total - leaves) * 100`
- Alert: < 75% = warning, < 60% = critical (max 1 per subject per 7 days)

### Notification Rules
- Only 3 triggers: new announcement, class cancelled, class rescheduled
- Priority: low (in-app only), medium (FCM), high (FCM immediate)
- No grade or assignment notifications in v1

### API Rules
- All routes: `/api/v1/...`
- Success: `{ success: true, data: {...} }`
- Error: `{ success: false, error: "message" }`
- Auth header: `Authorization: Bearer {accessToken}`

---

## 6. Database Tables (Quick Reference)

| Table | Key Fields | Notes |
|---|---|---|
| `users` | id, email, password_hash, role, is_active | Central identity |
| `students` | user_id, roll_number, semester, session_type, cgpa, target_gpa | Links to users |
| `teachers` | user_id, designation, fcm_token | Links to users |
| `admins` | user_id, position | Links to users |
| `courses` | code, credit_hours, theory_credit_hours, lab_credit_hours, has_lab, theory_teacher_id, lab_teacher_id | |
| `grade_config` | min_marks, letter_grade, gpa_points | UoS scale seeded |
| `grading_scheme` | course_id, midterm_weight, final_weight, sessional_weight, theory_weight, lab_weight | Weights must sum to 100 |
| `enrollments` | student_id, course_id, status, attempt_number, withdrawn_by | Backbone of system |
| `schedules` | course_id, day_of_week, session_type, start_time, end_time, effective_from | Weekly template |
| `class_sessions` | schedule_id, course_id, session_date, attendance_window_end, status, is_attendance_generated | Actual instances |
| `attendance` | enrollment_id, session_id, status, marked_by | present/absent/leave |
| `grades` | enrollment_id, theory_midterm, theory_final, theory_sessional, lab_practical, total_marks, gp, letter_grade, attempt_number, is_best_attempt, is_eligible | |
| `sessional_components` | course_id, name, max_marks, component_type | quiz/assignment/attendance/other |
| `sessional_marks` | enrollment_id, component_id, marks_obtained | |
| `assignments` | course_id, component_id, title, due_date, total_marks | Links to sessional_components |
| `assignment_submissions` | assignment_id, enrollment_id, file_url, marks_obtained, is_late | |
| `announcements` | title, tag, scope, course_id, created_by, event fields | tag: urgent/info/exam/event |
| `announcement_reads` | announcement_id, user_id | Read tracking |
| `notifications` | user_id, type, reference_id, priority, is_read | 3 types only |
| `academic_calendar` | title, event_type, start_date, end_date | Admin only |

---

## 7. API Endpoints (Full List)

### Auth (Public)
```
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout              🔒 any
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

### Admin — Students
```
GET    /api/v1/dept/students                      🔒 admin
POST   /api/v1/dept/students                      🔒 admin
POST   /api/v1/dept/students/import               🔒 admin
PUT    /api/v1/dept/students/:id                  🔒 admin
PATCH  /api/v1/dept/students/:id/deactivate       🔒 admin
```

### Admin — Teachers
```
GET    /api/v1/dept/teachers                      🔒 admin
POST   /api/v1/dept/teachers                      🔒 admin
PUT    /api/v1/dept/teachers/:id                  🔒 admin
PATCH  /api/v1/dept/teachers/:id/deactivate       🔒 admin
```

### Admin — Courses
```
GET    /api/v1/dept/courses                       🔒 admin
POST   /api/v1/dept/courses                       🔒 admin
PUT    /api/v1/dept/courses/:id                   🔒 admin
PATCH  /api/v1/dept/courses/:id/deactivate        🔒 admin
```

### Admin — Grading Scheme
```
GET    /api/v1/dept/grading-scheme/:courseId      🔒 admin
POST   /api/v1/dept/grading-scheme                🔒 admin
PUT    /api/v1/dept/grading-scheme/:courseId      🔒 admin
```

### Admin — Grade Config
```
GET    /api/v1/dept/grade-config                  🔒 admin
PUT    /api/v1/dept/grade-config                  🔒 admin
```

### Admin — Enrollment
```
POST   /api/v1/dept/enroll                        🔒 admin (bulk)
POST   /api/v1/dept/enroll/single                 🔒 admin
```

### Admin — Sessions
```
POST   /api/v1/dept/sessions                      🔒 admin
PATCH  /api/v1/dept/sessions/:id/cancel           🔒 admin
PATCH  /api/v1/dept/sessions/:id/reschedule       🔒 admin
```

### Admin — Grades Approval
```
GET    /api/v1/dept/grades/pending                🔒 admin
POST   /api/v1/dept/grades/:gradeId/approve       🔒 admin
POST   /api/v1/dept/grades/:gradeId/reject        🔒 admin
```

### Admin — Announcements
```
POST   /api/v1/dept/announcements                 🔒 admin
PUT    /api/v1/dept/announcements/:id             🔒 admin
PATCH  /api/v1/dept/announcements/:id/archive     🔒 admin
```

### Admin — Calendar
```
GET    /api/v1/dept/calendar                      🔒 admin
POST   /api/v1/dept/calendar                      🔒 admin
PUT    /api/v1/dept/calendar/:id                  🔒 admin
DELETE /api/v1/dept/calendar/:id                  🔒 admin
```

### Admin — Analytics & Export
```
GET    /api/v1/dept/analytics                     🔒 admin
GET    /api/v1/dept/export/attendance             🔒 admin
GET    /api/v1/dept/export/grades                 🔒 admin
```

### Teacher
```
GET    /api/v1/teacher/courses                            🔒 teacher
GET    /api/v1/teacher/sessions/today                     🔒 teacher
POST   /api/v1/teacher/attendance                         🔒 teacher
PUT    /api/v1/teacher/attendance/:id                     🔒 teacher
GET    /api/v1/teacher/grades/:courseId                   🔒 teacher
PUT    /api/v1/teacher/grades/:courseId                   🔒 teacher
POST   /api/v1/teacher/assignments                        🔒 teacher
PUT    /api/v1/teacher/assignments/:id                    🔒 teacher
DELETE /api/v1/teacher/assignments/:id                    🔒 teacher
POST   /api/v1/teacher/assignment-submissions/:id/grade   🔒 teacher
POST   /api/v1/teacher/announcements                      🔒 teacher
GET    /api/v1/teacher/students/:courseId                 🔒 teacher
```

### Student
```
GET    /api/v1/student/dashboard                          🔒 student
GET    /api/v1/student/schedule                           🔒 student
GET    /api/v1/student/grades                             🔒 student
GET    /api/v1/student/grades/history                     🔒 student
GET    /api/v1/student/attendance                         🔒 student
GET    /api/v1/student/assignments                        🔒 student
GET    /api/v1/student/announcements                      🔒 student
GET    /api/v1/student/notifications                      🔒 student
PATCH  /api/v1/student/notifications/:id/read             🔒 student
PUT    /api/v1/student/profile                            🔒 student
```

### AI
```
POST   /api/v1/ai/chat                                    🔒 student
GET    /api/v1/ai/goal/:enrollmentId                      🔒 student
```

---

## 8. Environment Variables

```env
NODE_ENV=development
PORT=3000
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

---

## 9. Postman Setup

- **Collection:** uniMate API
- **Environment:** uniMate Local
- **base_url:** `http://localhost:3000/api/v1`
- **Folders:** Auth, Admin, Teacher, Student, AI
- **Auto token script** (in Login → Post-response tab):
```javascript
const res = pm.response.json();
if (res.success) {
  pm.environment.set('access_token', res.data.accessToken);
  pm.environment.set('refresh_token', res.data.refreshToken);
}
```
- All protected requests use `Authorization: Bearer {{access_token}}`

---

## 10. Document Sync Rule

**When any decision changes, update ALL of these:**
1. `PROJECT_CONTEXT.md` ← this file
2. `SYSTEM.md`
3. `PROGRESS.md`
4. `uniMate_BDS_v1.0.docx`
5. `uniMate_SRS_v1.2.docx`

---

*Last updated: March 2026 — Schema complete, Auth done, starting Phase 3*
