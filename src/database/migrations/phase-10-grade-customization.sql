-- Migration: Update Grade Types and Add Custom Weights

-- 1. Update the assessment_type check constraint in grades table
-- First, drop the existing check constraint
ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_assessment_type_check;

-- Add the updated constraint including quiz and presentation
ALTER TABLE grades ADD CONSTRAINT grades_assessment_type_check 
CHECK (assessment_type IN ('assignment', 'sessional', 'midterm', 'final', 'practical', 'quiz', 'presentation', 'project'));


-- 2. Add custom grade weight columns to course_offerings table
ALTER TABLE course_offerings 
ADD COLUMN IF NOT EXISTS mid_weight NUMERIC NOT NULL DEFAULT 30,
ADD COLUMN IF NOT EXISTS sessional_weight NUMERIC NOT NULL DEFAULT 20,
ADD COLUMN IF NOT EXISTS final_weight NUMERIC NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS practical_weight NUMERIC NOT NULL DEFAULT 0;
