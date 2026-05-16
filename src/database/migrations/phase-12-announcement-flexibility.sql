-- Migration: Support Multiple Offerings and Semester Targeting in Announcements
-- 1. Create many-to-many table for announcement targets
CREATE TABLE IF NOT EXISTS announcement_offerings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    offering_id UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(announcement_id, offering_id)
);

-- 2. Add semester column and update constraint on announcements
-- We drop the old constraint and add a more flexible one
ALTER TABLE announcements DROP CONSTRAINT IF EXISTS chk_announcement_target;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS semester TEXT;

-- Remove the old offering_id column as we move to the join table
-- (Optional: Keep for backward compatibility if needed, but here we'll move to the array approach)
-- For now, we'll keep it but make it nullable and allow the many-to-many table to be used instead.
-- A better constraint: exactly one of (department, semester, or many-to-many)
-- Since it's hard to check a many-to-many table in a CHECK constraint, we'll enforce this in the service layer.
