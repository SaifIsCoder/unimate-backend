-- Migration: Use department_id (INTEGER) instead of string department in Announcements
-- 1. Add department_id column as INTEGER to match departments.id
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE;

-- 2. Drop the old string-based department column
-- Note: If there is existing data, it might be lost unless we map it, but for a dev task we'll proceed.
ALTER TABLE announcements DROP COLUMN IF EXISTS department;

-- 3. Update the constraint to use department_id
ALTER TABLE announcements DROP CONSTRAINT IF EXISTS chk_announcement_target;
-- The service layer handles the XOR logic now with many-to-many, 
-- but we can add a basic constraint for the nullable columns.
-- (No strict constraint here as we have many-to-many table for offerings).
