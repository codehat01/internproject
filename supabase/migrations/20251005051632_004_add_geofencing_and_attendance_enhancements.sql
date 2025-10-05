/*
  # Enhanced Geofencing and Attendance Status System

  ## Overview
  This migration adds comprehensive geofencing capabilities and enhanced attendance status tracking
  to support shift-based validation, grace periods, and boundary compliance monitoring.

  ## 1. New Tables
    
  ### `geofences`
    - `id` (uuid, primary key) - Unique identifier
    - `station_id` (text) - Police station identifier
    - `station_name` (text) - Name of the police station
    - `boundary_coordinates` (jsonb) - Array of lat/lng coordinates defining the polygon boundary
    - `center_latitude` (numeric) - Center point latitude for map display
    - `center_longitude` (numeric) - Center point longitude for map display
    - `radius_meters` (numeric) - Optional circular geofence radius
    - `is_active` (boolean) - Whether this geofence is currently active
    - `created_by` (uuid) - Admin who created the geofence
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### `boundary_violations`
    - `id` (uuid, primary key) - Unique identifier
    - `user_id` (uuid) - User who violated the boundary
    - `geofence_id` (uuid) - The geofence that was violated
    - `violation_time` (timestamptz) - When the violation occurred
    - `latitude` (numeric) - Location of violation
    - `longitude` (numeric) - Location of violation
    - `distance_from_boundary` (numeric) - How far outside the boundary
    - `shift_id` (uuid) - Shift during which violation occurred
    - `acknowledged` (boolean) - Whether admin has acknowledged
    - `acknowledged_by` (uuid) - Admin who acknowledged
    - `acknowledged_at` (timestamptz)
    - `created_at` (timestamptz)

  ## 2. Enhanced Attendance Table
  
  ### New Columns Added to `attendance`
    - `shift_id` (uuid) - Reference to the shift during which punch occurred
    - `compliance_status` (text) - Status: 'on_time', 'late', 'early_departure', 'overtime', 'absent'
    - `grace_period_used` (boolean) - Whether grace period was used
    - `minutes_late` (integer) - Minutes late if applicable
    - `minutes_early` (integer) - Minutes early departure if applicable
    - `overtime_minutes` (integer) - Overtime minutes if applicable
    - `is_within_geofence` (boolean) - Whether punch was within designated area
    - `geofence_id` (uuid) - Geofence where punch occurred

  ## 3. Security
    - Enable RLS on all new tables
    - Staff can view their own violations and geofences for their station
    - Admins can view and manage all geofences and violations
    - Only admins can create/update/delete geofences
    - Only admins can acknowledge violations

  ## 4. Indexes
    - Index on `geofences.station_id` for fast station lookups
    - Index on `boundary_violations.user_id` for user violation queries
    - Index on `boundary_violations.shift_id` for shift violation queries
    - Index on `attendance.shift_id` for shift attendance queries
    - Index on `attendance.compliance_status` for status filtering

  ## 5. Important Notes
    - Geofence boundaries use GeoJSON-style coordinate arrays
    - Point-in-polygon validation happens in application layer
    - Boundary violations are logged continuously during shifts
    - Grace period is 20 minutes after shift start
    - All timestamps use timestamptz for timezone support
*/

-- Create geofences table
CREATE TABLE IF NOT EXISTS geofences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  station_id TEXT NOT NULL,
  station_name TEXT NOT NULL,
  boundary_coordinates JSONB NOT NULL,
  center_latitude NUMERIC NOT NULL,
  center_longitude NUMERIC NOT NULL,
  radius_meters NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create boundary violations table
CREATE TABLE IF NOT EXISTS boundary_violations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  geofence_id UUID REFERENCES geofences(id),
  violation_time TIMESTAMPTZ DEFAULT NOW(),
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  distance_from_boundary NUMERIC,
  shift_id UUID REFERENCES shifts(id),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns to attendance table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance' AND column_name = 'shift_id'
  ) THEN
    ALTER TABLE attendance ADD COLUMN shift_id UUID REFERENCES shifts(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance' AND column_name = 'compliance_status'
  ) THEN
    ALTER TABLE attendance ADD COLUMN compliance_status TEXT CHECK (compliance_status IN ('on_time', 'late', 'early_departure', 'overtime', 'absent'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance' AND column_name = 'grace_period_used'
  ) THEN
    ALTER TABLE attendance ADD COLUMN grace_period_used BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance' AND column_name = 'minutes_late'
  ) THEN
    ALTER TABLE attendance ADD COLUMN minutes_late INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance' AND column_name = 'minutes_early'
  ) THEN
    ALTER TABLE attendance ADD COLUMN minutes_early INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance' AND column_name = 'overtime_minutes'
  ) THEN
    ALTER TABLE attendance ADD COLUMN overtime_minutes INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance' AND column_name = 'is_within_geofence'
  ) THEN
    ALTER TABLE attendance ADD COLUMN is_within_geofence BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance' AND column_name = 'geofence_id'
  ) THEN
    ALTER TABLE attendance ADD COLUMN geofence_id UUID REFERENCES geofences(id);
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE boundary_violations ENABLE ROW LEVEL SECURITY;

-- Geofences policies
CREATE POLICY "Staff can view geofences for their station"
  ON geofences
  FOR SELECT
  TO authenticated
  USING (
    is_active = true AND (
      station_id IN (
        SELECT department FROM profiles WHERE id = auth.uid()
      )
      OR is_admin(auth.uid())
    )
  );

CREATE POLICY "Admins can view all geofences"
  ON geofences
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert geofences"
  ON geofences
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update geofences"
  ON geofences
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete geofences"
  ON geofences
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Boundary violations policies
CREATE POLICY "Users can view their own violations"
  ON boundary_violations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all violations"
  ON boundary_violations
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "System can insert violations"
  ON boundary_violations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update violations"
  ON boundary_violations
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_geofences_station_id ON geofences(station_id);
CREATE INDEX IF NOT EXISTS idx_geofences_is_active ON geofences(is_active);
CREATE INDEX IF NOT EXISTS idx_boundary_violations_user_id ON boundary_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_boundary_violations_shift_id ON boundary_violations(shift_id);
CREATE INDEX IF NOT EXISTS idx_boundary_violations_geofence_id ON boundary_violations(geofence_id);
CREATE INDEX IF NOT EXISTS idx_attendance_shift_id ON attendance(shift_id);
CREATE INDEX IF NOT EXISTS idx_attendance_compliance_status ON attendance(compliance_status);
CREATE INDEX IF NOT EXISTS idx_attendance_geofence_id ON attendance(geofence_id);

-- Triggers for updated_at
CREATE TRIGGER update_geofences_updated_at
  BEFORE UPDATE ON geofences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get current shift for a user at a given time
CREATE OR REPLACE FUNCTION get_user_current_shift(p_user_id UUID, p_timestamp TIMESTAMPTZ DEFAULT NOW())
RETURNS TABLE (
  shift_id UUID,
  shift_name TEXT,
  shift_start TIMESTAMPTZ,
  shift_end TIMESTAMPTZ,
  station_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.shift_name,
    s.shift_start,
    s.shift_end,
    s.station_id
  FROM shifts s
  WHERE p_user_id = ANY(s.assigned_users)
    AND p_timestamp >= s.shift_start
    AND p_timestamp <= s.shift_end
  ORDER BY s.shift_start DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if location is within geofence (simplified circular check)
-- Note: Complex polygon checks should be done in application layer
CREATE OR REPLACE FUNCTION is_within_circular_geofence(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_center_lat NUMERIC,
  p_center_lng NUMERIC,
  p_radius_meters NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
  distance_meters NUMERIC;
BEGIN
  -- Haversine formula simplified for small distances
  distance_meters := 6371000 * ACOS(
    COS(RADIANS(p_center_lat)) * 
    COS(RADIANS(p_lat)) * 
    COS(RADIANS(p_lng) - RADIANS(p_center_lng)) + 
    SIN(RADIANS(p_center_lat)) * 
    SIN(RADIANS(p_lat))
  );
  
  RETURN distance_meters <= p_radius_meters;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_current_shift(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION is_within_circular_geofence(NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC) TO authenticated;

-- Insert default geofence for testing (adjust coordinates as needed)
INSERT INTO geofences (station_id, station_name, boundary_coordinates, center_latitude, center_longitude, radius_meters)
VALUES (
  'HQ001',
  'Police Headquarters',
  '{"type": "Polygon", "coordinates": [[[77.5946, 12.9716], [77.5950, 12.9716], [77.5950, 12.9720], [77.5946, 12.9720], [77.5946, 12.9716]]]}'::jsonb,
  12.9718,
  77.5948,
  500
) ON CONFLICT DO NOTHING;