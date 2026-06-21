# UniMate Backend - Architecture & Development Checklist

This document tracks progress for building the UniMate backend system as approved in the implementation plan.

## Setup & Database Design
- [ ] Install Prisma ORM and DB packages (`prisma`, `@prisma/client`, `@supabase/supabase-js`)
- [ ] Initialize and write Prisma schema (`prisma/schema.prisma`) mapping all core, academic, scheduling, task, community, communication, AI, and system tables
- [ ] Configure `src/config/prisma.js` for executing database operations with Prisma Client
- [ ] Run Prisma generation and synchronize schema migrations

## Pending Academic & Operations Endpoints (JS & Joi)
- [x] Implement `GET /api/v1/schedules/my` (Student timetable slots from course offerings and schedule exceptions)
- [x] Implement `GET /api/v1/attendance/my/summary` (Detailed calculation of attendance, leaves, and overall eligibility)
- [x] Implement `GET /api/v1/grades/my/summary` (UOS grading criteria calculations: GPA, SGPA, CGPA)
- [x] Implement `GET /api/v1/assignments/my?status=pending` (Lists pending assignments for the student)
- [x] Implement `GET /api/v1/assignments/:id` (Returns detailed assignment and dynamic completion/progress status)
- [x] Implement `POST /api/v1/assignments/:id/submit` (Allows student submission with files/links to Supabase storage)
- [x] Implement `GET /api/v1/events/upcoming?limit=1` (Upcoming events display)
- [x] Implement `GET /api/v1/grades/my/course/:courseId` (Course grading component details)

## AI System & Gemini Integration (JS)
- [x] Implement `POST /api/v1/ai/gpa-goal` (GPA Goal Tracker - prompt generation, prediction, UOS target calculation)
- [x] Implement `GET /api/v1/ai/attendance-guardian` (Attendance skip predictions, margin warning, rules)
- [x] Implement `GET /api/v1/ai/smart-schedule` (Congestion detection, study blocks suggestions)
- [x] Implement `GET /api/v1/ai/skill-trends` (NLP analysis of community forum topics and recommendations)
- [x] Implement `POST /api/v1/ai/prioritize-tasks` (Eisenhower priority scoring engine)

## File Storage (Supabase Storage integration)
- [x] Configure Supabase client in `src/config/supabase.js`
- [x] Implement file upload verification, MIME-type and size validation (max 5MB/20MB)

## Verification & Launch
- [ ] Run validation tests on new endpoints using Postman / local shell curls
- [ ] Produce final walkthrough.md reporting implementation details and results
