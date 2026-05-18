-- Phase 15: uniMate Mobile-Backend Alignment Migration
-- Run this in your Supabase SQL Editor to support the mobile frontend's interactive screens and goals.

-- 1. EXTEND students TABLE
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS father_name TEXT,
ADD COLUMN IF NOT EXISTS guardian_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_phone TEXT,
ADD COLUMN IF NOT EXISTS target_cgpa NUMERIC DEFAULT 3.0 CHECK (target_cgpa BETWEEN 0.0 AND 4.0),
ADD COLUMN IF NOT EXISTS study_intensity TEXT DEFAULT 'balanced' CHECK (study_intensity IN ('balanced', 'high', 'aggressive'));

-- 2. EXTEND assignments TABLE WITH DYNAMIC VISUAL METRICS
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Medium' CHECK (difficulty IN ('High', 'Medium', 'Low')),
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Normal' CHECK (priority IN ('Critical', 'Moderate', 'Normal'));

-- 3. CREATE unified student_assignments JOIN TABLE
-- This table tracks assignment progress, custom completion status, and optional student submissions.
CREATE TABLE IF NOT EXISTS student_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'overdue')),
    submitted_at TIMESTAMP,
    file_url TEXT,
    text_content TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, assignment_id)
);

-- Triggers for auditing updated_at
DROP TRIGGER IF EXISTS update_student_assignments_updated_at ON student_assignments;
CREATE TRIGGER update_student_assignments_updated_at BEFORE UPDATE ON student_assignments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Indexes for performance query alignment
CREATE INDEX IF NOT EXISTS idx_student_assignments_student ON student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_status ON student_assignments(student_id, status);
