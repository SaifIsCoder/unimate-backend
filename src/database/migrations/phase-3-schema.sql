-- Phase 3 Schema: Schedule, Attendance, Assignment, Grades

-- Add has_practical flag to courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS has_practical BOOLEAN NOT NULL DEFAULT false;

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
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  exception_type TEXT NOT NULL CHECK (exception_type IN ('cancelled', 'rescheduled', 'extra')),
  new_start_time TIME,
  new_end_time TIME,
  new_room TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_offering_id ON schedule_exceptions(offering_id);

-- ATTENDANCE SESSIONS
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offering_id UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (offering_id, date)
);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_offering_id ON attendance_sessions(offering_id);

-- ATTENDANCE RECORDS
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'leave')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, student_id)
);

-- ASSIGNMENTS
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

-- GRADES
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offering_id UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('assignment', 'sessional', 'midterm', 'final', 'practical')),
  reference_id UUID, -- Links to assignments.id if assessment_type is 'assignment'
  title TEXT NOT NULL, -- Keep title for description purposes, but not in unique constraint
  score NUMERIC NOT NULL CHECK (score >= 0),
  max_score NUMERIC NOT NULL CHECK (max_score > 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_grades_offering_student ON grades(offering_id, student_id);

-- Unique constraint for grades:
-- 1. For general assessments (midterm, final, practical) a student can only have one grade per offering.
CREATE UNIQUE INDEX IF NOT EXISTS idx_grades_unique_assessment 
ON grades (offering_id, student_id, assessment_type) 
WHERE reference_id IS NULL AND assessment_type != 'assignment';

-- 2. For assignments, the combination of student and assignment (reference_id) must be unique.
CREATE UNIQUE INDEX IF NOT EXISTS idx_grades_unique_assignment 
ON grades (student_id, reference_id) 
WHERE reference_id IS NOT NULL;
