-- Phase 7: Architect Remediation - Integrity, Auditing, and Performance
-- This migration fixes critical flaws identified in the database audit.

-- 1. UNIVERSAL AUDITING TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. ADD updated_at COLUMNS TO MISSING TABLES
DO $$ 
BEGIN
    -- Students
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='updated_at') THEN
        ALTER TABLE students ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    END IF;

    -- Teachers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teachers' AND column_name='updated_at') THEN
        ALTER TABLE teachers ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    END IF;

    -- Courses
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='updated_at') THEN
        ALTER TABLE courses ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    END IF;

    -- Course Offerings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='course_offerings' AND column_name='updated_at') THEN
        ALTER TABLE course_offerings ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    END IF;

    -- Enrollments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='enrollments' AND column_name='updated_at') THEN
        ALTER TABLE enrollments ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    END IF;

    -- Schedules
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schedules' AND column_name='updated_at') THEN
        ALTER TABLE schedules ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    END IF;

    -- Assignments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='updated_at') THEN
        ALTER TABLE assignments ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    END IF;

    -- Grades
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='grades' AND column_name='updated_at') THEN
        ALTER TABLE grades ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    END IF;
END $$;

-- 3. APPLY AUDIT TRIGGERS
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_teachers_updated_at ON teachers;
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_offerings_updated_at ON course_offerings;
CREATE TRIGGER update_course_offerings_updated_at BEFORE UPDATE ON course_offerings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_enrollments_updated_at ON enrollments;
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_grades_updated_at ON grades;
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 4. FIX ENROLLMENT STATUS CONSTRAINT
-- First, drop the old constraint if it exists. Postgres names these automatically but we can check the table.
DO $$ 
BEGIN
    ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_status_check;
    ALTER TABLE enrollments ADD CONSTRAINT enrollments_status_check CHECK (status IN ('enrolled', 'dropped', 'pending'));
END $$;

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grades_enrollment_id ON grades(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_enrollment_id ON attendance_records(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON attendance_sessions(date);
CREATE INDEX IF NOT EXISTS idx_enrollments_offering_status ON enrollments(offering_id, status);

-- 6. GRADE INTEGRITY: CHANGE ASSIGNMENT FK TO RESTRICT
-- This prevents deleting an assignment if grades are linked to it (manual cleanup required).
ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_reference_id_fkey;
ALTER TABLE grades ADD CONSTRAINT grades_reference_id_fkey FOREIGN KEY (reference_id) REFERENCES assignments(id) ON DELETE RESTRICT;

-- 7. NOTIFICATION OPTIMIZATION: Partial index for active notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread_latest ON notifications(user_id, created_at DESC) WHERE is_read = false;
