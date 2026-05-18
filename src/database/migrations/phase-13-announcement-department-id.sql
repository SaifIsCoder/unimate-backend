-- Migration: Use department_id (INTEGER) instead of string department in Announcements

-- 1. CREATE departments TABLE FIRST
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed default departments
INSERT INTO departments (name, code) VALUES 
  ('Computer Science', 'CS'),
  ('Information Technology', 'IT'),
  ('Software Engineering', 'SE')
ON CONFLICT (code) DO NOTHING;

-- 2. Add department_id column as INTEGER to match departments.id in Announcements
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE;

-- 3. Drop the old string-based department column
ALTER TABLE announcements DROP COLUMN IF EXISTS department;
