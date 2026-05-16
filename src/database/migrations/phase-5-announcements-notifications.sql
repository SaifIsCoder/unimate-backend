-- Phase 5 Migration: Announcements and Notifications

-- ADMINS TABLE (Departmental scope only)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  admin_id TEXT NOT NULL UNIQUE, -- Employee ID equivalent
  department TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- FCM TOKENS TABLE (To store device tokens for Firebase Push Notifications)
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);

-- ANNOUNCEMENTS TABLE (Uses TEXT department)
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  offering_id UUID REFERENCES course_offerings(id) ON DELETE CASCADE,
  department TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_announcement_target CHECK (
    (offering_id IS NOT NULL AND department IS NULL) OR 
    (offering_id IS NULL AND department IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_announcements_offering ON announcements(offering_id);
CREATE INDEX IF NOT EXISTS idx_announcements_department ON announcements(department);

-- NOTIFICATIONS TABLE (In-app history)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('announcement', 'grade', 'enrollment')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;
