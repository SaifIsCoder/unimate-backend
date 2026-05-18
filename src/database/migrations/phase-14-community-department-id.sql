-- Phase 14 Migration: Align students, teachers, courses, admins, and community_posts to use integer department_id

-- 1. Align students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE students DROP COLUMN IF EXISTS department;

-- 2. Align teachers table
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE teachers DROP COLUMN IF EXISTS department;

-- 3. Align courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE courses DROP COLUMN IF EXISTS department;

-- 4. Align admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE admins DROP COLUMN IF EXISTS department;

-- 5. Align community_posts table
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE;
ALTER TABLE community_posts DROP COLUMN IF EXISTS department;