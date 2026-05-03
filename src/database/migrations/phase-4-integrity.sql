-- Phase 4 Migration: Data Integrity Enforcement

-- 1. Extend Schema: Add enrollment_id columns
ALTER TABLE grades ADD COLUMN enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE;
ALTER TABLE attendance_records ADD COLUMN enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE;

-- 2. Migrate existing data (if any)
UPDATE grades g 
SET enrollment_id = e.id 
FROM enrollments e 
WHERE e.student_id = g.student_id AND e.offering_id = g.offering_id;

UPDATE attendance_records ar 
SET enrollment_id = e.id 
FROM attendance_sessions s 
JOIN enrollments e ON e.offering_id = s.offering_id 
WHERE s.id = ar.session_id AND e.student_id = ar.student_id;

-- Ensure enrollment_id is now NOT NULL for both tables to enforce integrity
-- NOTE: If you have orphaned records in your DB that couldn't be matched above, 
-- they will cause the following lines to fail. You must delete orphaned records manually first.
ALTER TABLE grades ALTER COLUMN enrollment_id SET NOT NULL;
ALTER TABLE attendance_records ALTER COLUMN enrollment_id SET NOT NULL;

-- 3. Update Unique Constraints in 'grades' to use enrollment_id
DROP INDEX IF EXISTS idx_grades_unique_assessment;
DROP INDEX IF EXISTS idx_grades_unique_assignment;

CREATE UNIQUE INDEX idx_grades_unique_assessment 
ON grades (enrollment_id, assessment_type) 
WHERE reference_id IS NULL AND assessment_type != 'assignment';

CREATE UNIQUE INDEX idx_grades_unique_assignment 
ON grades (enrollment_id, reference_id) 
WHERE reference_id IS NOT NULL;

-- 4. Update Unique Constraints in 'attendance_records'
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_session_id_student_id_key;
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_session_id_enrollment_id_key UNIQUE (session_id, enrollment_id);

-- 5. Drop old redundant columns (Switch paths)
ALTER TABLE grades DROP COLUMN student_id;
ALTER TABLE grades DROP COLUMN offering_id;
ALTER TABLE attendance_records DROP COLUMN student_id;
