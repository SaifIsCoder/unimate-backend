-- Add schedule_id and exception_id to attendance_sessions to link attendance to the schedule
ALTER TABLE attendance_sessions 
ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS exception_id UUID REFERENCES schedule_exceptions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_schedule ON attendance_sessions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_exception ON attendance_sessions(exception_id);
