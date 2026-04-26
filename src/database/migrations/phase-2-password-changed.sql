-- Add password_changed flag to users table
-- false = user has never set their own password (first-time login)
-- true  = user has already set their own password (one-time reset used)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed BOOLEAN NOT NULL DEFAULT false;
