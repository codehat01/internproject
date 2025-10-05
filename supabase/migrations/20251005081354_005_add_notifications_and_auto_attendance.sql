-- Notifications and Auto Attendance System
-- Overview: Adds support for shift notifications and automatic attendance marking

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT CHECK (notification_type IN ('shift_reminder', 'leave_approved', 'leave_rejected', 'late_warning', 'absent_marked')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create daily attendance summary table
CREATE TABLE IF NOT EXISTS daily_attendance_summary (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  attendance_date DATE NOT NULL,
  shift_id UUID REFERENCES shifts(id),
  status TEXT CHECK (status IN ('present', 'late', 'absent', 'on_leave', 'half_day')) NOT NULL,
  punch_in_time TIMESTAMPTZ,
  punch_out_time TIMESTAMPTZ,
  hours_worked NUMERIC DEFAULT 0,
  is_on_approved_leave BOOLEAN DEFAULT false,
  leave_request_id UUID REFERENCES leave_requests(id),
  auto_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, attendance_date)
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_attendance_summary ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Daily attendance summary policies
CREATE POLICY "Users can view own attendance summary"
  ON daily_attendance_summary FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attendance summaries"
  ON daily_attendance_summary FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "System can insert attendance summaries"
  ON daily_attendance_summary FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update attendance summaries"
  ON daily_attendance_summary FOR UPDATE
  TO authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_summary_user_date ON daily_attendance_summary(user_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_daily_summary_status ON daily_attendance_summary(status);
CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON daily_attendance_summary(attendance_date);

-- Function to mark absent for missed shifts
CREATE OR REPLACE FUNCTION mark_absent_for_missed_shifts()
RETURNS void AS $$
DECLARE
  shift_record RECORD;
  has_punched BOOLEAN;
  is_on_leave BOOLEAN;
  leave_req_id UUID;
BEGIN
  FOR shift_record IN 
    SELECT s.id as shift_id, s.shift_start, s.shift_end, unnest(s.assigned_users) as user_id
    FROM shifts s
    WHERE s.shift_start <= NOW() - INTERVAL '1 hour'
      AND s.shift_start >= CURRENT_DATE
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM attendance 
      WHERE user_id = shift_record.user_id 
        AND punch_type = 'in'
        AND timestamp >= shift_record.shift_start
        AND timestamp <= shift_record.shift_start + INTERVAL '1 hour'
    ) INTO has_punched;
    
    SELECT EXISTS (
      SELECT 1 FROM leave_requests lr
      WHERE lr.user_id = shift_record.user_id
        AND lr.status = 'approved'
        AND shift_record.shift_start::date >= lr.start_date::date
        AND shift_record.shift_start::date <= lr.end_date::date
    ) INTO is_on_leave;
    
    IF is_on_leave THEN
      SELECT id INTO leave_req_id FROM leave_requests
      WHERE user_id = shift_record.user_id
        AND status = 'approved'
        AND shift_record.shift_start::date >= start_date::date
        AND shift_record.shift_start::date <= end_date::date
      LIMIT 1;
    END IF;
    
    IF NOT has_punched THEN
      INSERT INTO daily_attendance_summary (
        user_id, attendance_date, shift_id, status, 
        is_on_approved_leave, leave_request_id, auto_generated
      ) VALUES (
        shift_record.user_id,
        shift_record.shift_start::date,
        shift_record.shift_id,
        CASE WHEN is_on_leave THEN 'on_leave' ELSE 'absent' END,
        is_on_leave,
        leave_req_id,
        true
      ) ON CONFLICT (user_id, attendance_date) DO UPDATE
      SET status = CASE WHEN is_on_leave THEN 'on_leave' ELSE 'absent' END,
          is_on_approved_leave = is_on_leave,
          leave_request_id = leave_req_id,
          updated_at = NOW();
      
      IF NOT is_on_leave THEN
        INSERT INTO notifications (user_id, notification_type, title, message, metadata)
        VALUES (
          shift_record.user_id,
          'absent_marked',
          'Marked Absent',
          'You have been marked absent for not punching in within 1 hour of your shift start time.',
          jsonb_build_object('shift_id', shift_record.shift_id, 'date', shift_record.shift_start::date)
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send shift reminder notifications
CREATE OR REPLACE FUNCTION send_shift_reminder_notifications()
RETURNS void AS $$
DECLARE
  shift_record RECORD;
  is_on_leave BOOLEAN;
BEGIN
  FOR shift_record IN 
    SELECT s.id as shift_id, s.shift_name, s.shift_start, unnest(s.assigned_users) as user_id
    FROM shifts s
    WHERE s.shift_start >= NOW()
      AND s.shift_start <= NOW() + INTERVAL '5 minutes'
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM leave_requests lr
      WHERE lr.user_id = shift_record.user_id
        AND lr.status = 'approved'
        AND shift_record.shift_start::date >= lr.start_date::date
        AND shift_record.shift_start::date <= lr.end_date::date
    ) INTO is_on_leave;
    
    IF NOT is_on_leave THEN
      INSERT INTO notifications (user_id, notification_type, title, message, metadata)
      VALUES (
        shift_record.user_id,
        'shift_reminder',
        'Shift Starting Soon',
        'Your shift "' || shift_record.shift_name || '" starts in 5 minutes. Please prepare to punch in.',
        jsonb_build_object('shift_id', shift_record.shift_id, 'shift_start', shift_record.shift_start)
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update daily summary from attendance records
CREATE OR REPLACE FUNCTION update_daily_summary_from_attendance()
RETURNS TRIGGER AS $$
DECLARE
  shift_rec RECORD;
  summary_status TEXT;
  leave_req_id UUID;
  is_on_leave BOOLEAN;
BEGIN
  SELECT * INTO shift_rec FROM shifts WHERE id = NEW.shift_id LIMIT 1;
  
  SELECT EXISTS (
    SELECT 1 FROM leave_requests lr
    WHERE lr.user_id = NEW.user_id
      AND lr.status = 'approved'
      AND NEW.timestamp::date >= lr.start_date::date
      AND NEW.timestamp::date <= lr.end_date::date
  ) INTO is_on_leave;
  
  IF is_on_leave THEN
    SELECT id INTO leave_req_id FROM leave_requests
    WHERE user_id = NEW.user_id
      AND status = 'approved'
      AND NEW.timestamp::date >= start_date::date
      AND NEW.timestamp::date <= end_date::date
    LIMIT 1;
    summary_status := 'on_leave';
  ELSIF NEW.compliance_status = 'late' OR NEW.minutes_late > 0 THEN
    summary_status := 'late';
  ELSE
    summary_status := 'present';
  END IF;
  
  IF NEW.punch_type = 'in' THEN
    INSERT INTO daily_attendance_summary (
      user_id, attendance_date, shift_id, status,
      punch_in_time, is_on_approved_leave, leave_request_id
    ) VALUES (
      NEW.user_id, NEW.timestamp::date, NEW.shift_id,
      summary_status, NEW.timestamp, is_on_leave, leave_req_id
    ) ON CONFLICT (user_id, attendance_date) DO UPDATE
    SET punch_in_time = NEW.timestamp,
        status = summary_status,
        is_on_approved_leave = is_on_leave,
        leave_request_id = leave_req_id,
        updated_at = NOW();
  ELSIF NEW.punch_type = 'out' THEN
    UPDATE daily_attendance_summary
    SET punch_out_time = NEW.timestamp,
        hours_worked = EXTRACT(EPOCH FROM (NEW.timestamp - punch_in_time))/3600,
        updated_at = NOW()
    WHERE user_id = NEW.user_id AND attendance_date = NEW.timestamp::date;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for attendance updates
DROP TRIGGER IF EXISTS trigger_update_daily_summary ON attendance;
CREATE TRIGGER trigger_update_daily_summary
  AFTER INSERT ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_summary_from_attendance();

-- Trigger for updated_at on daily_attendance_summary
CREATE TRIGGER update_daily_summary_updated_at
  BEFORE UPDATE ON daily_attendance_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION mark_absent_for_missed_shifts() TO authenticated;
GRANT EXECUTE ON FUNCTION send_shift_reminder_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION update_daily_summary_from_attendance() TO authenticated;
