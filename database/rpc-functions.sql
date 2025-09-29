-- RPC function to get email from badge number
CREATE OR REPLACE FUNCTION get_email_from_badge(badge_num TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Get the email directly from profiles table
    SELECT p.email INTO user_email
    FROM profiles p
    WHERE p.badge_number = badge_num;
    
    RETURN user_email;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_email_from_badge(TEXT) TO authenticated;

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_badge_number ON profiles(badge_number);
CREATE INDEX IF NOT EXISTS idx_attendance_user_timestamp ON attendance(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_status ON leave_requests(user_id, status);

-- Note: RLS policies are defined in schema.sql and should not be duplicated here
-- This avoids conflicts that could cause infinite loading issues