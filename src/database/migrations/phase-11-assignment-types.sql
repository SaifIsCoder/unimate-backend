-- Migration: Add assessment_type to assignments table
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS assessment_type TEXT NOT NULL DEFAULT 'assignment' 
CHECK (assessment_type IN ('assignment', 'quiz', 'presentation', 'project'));
