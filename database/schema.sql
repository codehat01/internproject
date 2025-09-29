-- Police Attendance System Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    badge_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    rank TEXT NOT NULL, -- Constable / SI / Inspector
    role TEXT NOT NULL DEFAULT 'staff', -- staff / admin
    phone TEXT,
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    email TEXT, -- Add email column
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance table
CREATE TABLE attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    punch_type TEXT NOT NULL CHECK (punch_type IN ('IN', 'OUT')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    location GEOMETRY(POINT, 4326), -- lat, long
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave requests table
CREATE TABLE leave_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    file_url TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    approver_id UUID REFERENCES profiles(id),
    reject_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table (for tracking admin actions)
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can view all attendance" ON attendance;
DROP POLICY IF EXISTS "Users can insert their own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can view their own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Admins can view all leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Users can insert their own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Admins can update leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can insert audit logs" ON audit_logs;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT p.role INTO user_role
    FROM profiles p
    WHERE p.id = check_user_id;
    
    RETURN COALESCE(user_role = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        auth.uid() = id OR
        is_admin(auth.uid())
    );

CREATE POLICY "Admins can update profiles" ON profiles
    FOR UPDATE USING (
        is_admin(auth.uid())
    );

CREATE POLICY "Admins can insert profiles" ON profiles
    FOR INSERT WITH CHECK (
        is_admin(auth.uid())
    );

-- Attendance policies
CREATE POLICY "Users can view their own attendance" ON attendance
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attendance" ON attendance
    FOR SELECT USING (
        is_admin(auth.uid())
    );

CREATE POLICY "Users can insert their own attendance" ON attendance
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Leave requests policies
CREATE POLICY "Users can view their own leave requests" ON leave_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all leave requests" ON leave_requests
    FOR SELECT USING (
        is_admin(auth.uid())
    );

CREATE POLICY "Users can insert their own leave requests" ON leave_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update leave requests" ON leave_requests
    FOR UPDATE USING (
        is_admin(auth.uid())
    );

-- Audit logs policies
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        is_admin(auth.uid())
    );

CREATE POLICY "Users can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions and triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at 
    BEFORE UPDATE ON leave_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, badge_number, full_name, rank, role, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'badge_number', 'TEMP' || substr(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        COALESCE(NEW.raw_user_meta_data->>'rank', 'Constable'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data (for testing)
-- Note: You'll need to create actual auth users first, then update these with real UUIDs

-- Sample admin user (replace with actual UUID after creating auth user)
-- INSERT INTO profiles (id, badge_number, full_name, rank, role, phone, email) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'ADMIN001', 'Admin User', 'Inspector', 'admin', '+1234567890', 'admin@example.com');

-- Sample staff users (replace with actual UUIDs after creating auth users)
-- INSERT INTO profiles (id, badge_number, full_name, rank, role, phone, email) VALUES
-- ('00000000-0000-0000-0000-000000000002', 'STAFF001', 'Officer John Doe', 'Constable', 'staff', '+1234567891', 'john.doe@example.com'),
-- ('00000000-0000-0000-0000-000000000003', 'STAFF002', 'Officer Jane Smith', 'SI', 'staff', '+1234567892', 'jane.smith@example.com');