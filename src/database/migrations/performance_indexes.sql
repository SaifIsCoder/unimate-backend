-- Performance Optimization Indexes

-- 1. Attendance Records
-- Speeds up studentStats aggregation and eligibility checks
CREATE INDEX IF NOT EXISTS idx_attendance_records_enrollment_id_status 
ON attendance_records(enrollment_id, status);

-- 2. Community Engagement
-- Speeds up count aggregations for feed and post details
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id_status ON post_comments(post_id, status) WHERE status != 'deleted';

-- 3. Notifications
-- Speeds up history retrieval for students
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);

-- 4. Grades
-- Speeds up transcript and grade history scans
CREATE INDEX IF NOT EXISTS idx_grades_enrollment_id ON grades(enrollment_id);
