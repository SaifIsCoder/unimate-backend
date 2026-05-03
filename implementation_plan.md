# Phase 3 Backend Implementation Plan

This document outlines the detailed design and implementation strategy for the Phase 3 modules (`schedule`, `attendance`, `assignment`, and `grades`) in the uniMate backend system.

> [!IMPORTANT]
> **User Review Required**
> Please review the updated database schema and answer the **Open Questions** below. I will not proceed with writing the code until these details are clarified.

## Open Questions for the User

1. **Assignments**: You mentioned students don't submit, teachers just mark them as "done". Does "marking as done" simply mean assigning a score in the Grades module, or is there a separate checkbox/status for "Completed" regardless of the grade? 
2. **Attendance Rules**: You mentioned you have several rules for converting classes to percentages. Please share those rules so I can implement the attendance percentage calculation logic correctly!
3. **Grades Calculation**: You mentioned grade calculation is a major thing. How are the final grades calculated? Do different assessments have different weights (e.g., Midterm = 30%, Final = 50%, Assignments = 20%)? If so, should I add a `weightage` field to the assessments? Please share the exact calculation rules.

---

## 1. Project Structure & Pattern Analysis
Strictly maintaining the existing `Controller -> Service -> Repository` pattern with pure SQL and the `withTransaction` utility.

## 2. Proposed Database Schema (Phase 3)

```sql
-- SCHEDULE (Weekly recurring schedule)
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offering_id UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT end_time_after_start_time CHECK (end_time > start_time)
);
CREATE INDEX IF NOT EXISTS idx_schedules_offering_id ON schedules(offering_id);

-- SCHEDULE EXCEPTIONS (For cancelled, postponed, or rescheduled classes)
CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offering_id UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE, -- Null if it's an extra makeup class
  date DATE NOT NULL,
  exception_type TEXT NOT NULL CHECK (exception_type IN ('cancelled', 'rescheduled', 'extra')),
  new_start_time TIME, -- Used if rescheduled or extra
  new_end_time TIME,   -- Used if rescheduled or extra
  new_room TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ATTENDANCE
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offering_id UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (offering_id, date)
);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_offering_id ON attendance_sessions(offering_id);

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, student_id)
);

-- ASSIGNMENT
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offering_id UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP NOT NULL,
  total_points NUMERIC NOT NULL CHECK (total_points > 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assignments_offering_id ON assignments(offering_id);

-- Note: assignment_submissions table removed as per your feedback. Teachers will directly manage assignments.

-- GRADES
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offering_id UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('assignment', 'quiz', 'midterm', 'final', 'project')),
  reference_id UUID, -- Links to assignments.id if assessment_type is 'assignment'
  title TEXT NOT NULL, 
  score NUMERIC NOT NULL CHECK (score >= 0),
  max_score NUMERIC NOT NULL CHECK (max_score > 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (offering_id, student_id, assessment_type, title)
);
CREATE INDEX IF NOT EXISTS idx_grades_offering_student ON grades(offering_id, student_id);
```

---

## 3. Module Designs

### A. Schedule Module
**Endpoints:**
*   `POST /api/schedules` - Create a weekly schedule. *Note: Since `offering_id` is provided, the teacher and course are automatically linked via the `course_offerings` table. No need to pass teacher manually.*
*   `GET /api/schedules/offering/:offeringId` - Get schedules for offering.
*   `POST /api/schedules/exceptions` - Mark a specific date as 'cancelled', 'rescheduled', or add an 'extra' class.
*   `GET /api/schedules/offering/:offeringId/exceptions` - Get all exceptions for an offering.

### B. Attendance Module
**Endpoints:**
*   `POST /api/attendance` - Record attendance. By default, the service will assume enrolled students are "present" unless explicitly passed as "absent" or "late" in the payload.
*   `GET /api/attendance/session/:sessionId` - Get records for a session.
*   `GET /api/attendance/offering/:offeringId` - Get overall attendance stats.
*   *Pending: Percentage calculation endpoint based on the rules you will provide.*

### C. Assignment Module
**Endpoints:**
*   `POST /api/assignments` - Create assignment (Teacher).
*   `GET /api/assignments/offering/:offeringId` - Get assignments for offering.
*   `PUT /api/assignments/:id/mark-done` - Teacher marks the assignment as done/graded for a student.

### D. Grades Module
**Endpoints:**
*   `POST /api/grades` - Submit a grade (Teacher).
*   `GET /api/grades/offering/:offeringId` - Get all grades for an offering (Teacher view).
*   `GET /api/grades/student/:studentId/all` - **NEW**: Get all grades across all 5 (or however many) courses a student is enrolled in.
*   *Pending: Grade calculation endpoint based on the formulas you will provide.*
