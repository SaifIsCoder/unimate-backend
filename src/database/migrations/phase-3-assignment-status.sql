-- Add is_done column to assignments table
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS is_done BOOLEAN NOT NULL DEFAULT false;
