/*
  # Add User Location Tracking

  1. New Tables
    - `user_locations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `latitude` (numeric, GPS latitude)
      - `longitude` (numeric, GPS longitude)
      - `accuracy` (numeric, GPS accuracy in meters)
      - `timestamp` (timestamptz, when location was recorded)
      - `is_active` (boolean, whether this is the current location)
      - `created_at` (timestamptz)

  2. Indexes
    - Index on user_id for fast lookups
    - Index on timestamp for recent location queries
    - Index on is_active for current location queries

  3. Security
    - Enable RLS on `user_locations` table
    - Users can insert their own location data
    - Users can view their own location history
    - Admins can view all location data
    - Admins cannot modify location data (data integrity)

  4. Functions
    - Automatic function to set is_active=false for old locations when new one is inserted
    - This ensures only the most recent location per user is marked as active
*/

-- Create user_locations table
CREATE TABLE IF NOT EXISTS user_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  accuracy NUMERIC(10, 2) DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_timestamp ON user_locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_locations_is_active ON user_locations(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own location" ON user_locations;
DROP POLICY IF EXISTS "Users can view their own location history" ON user_locations;
DROP POLICY IF EXISTS "Admins can view all locations" ON user_locations;

-- RLS Policies
CREATE POLICY "Users can insert their own location"
  ON user_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own location history"
  ON user_locations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all locations"
  ON user_locations
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Function to deactivate old locations when new one is inserted
CREATE OR REPLACE FUNCTION deactivate_old_locations()
RETURNS TRIGGER AS $$
BEGIN
  -- Set all previous locations for this user to inactive
  UPDATE user_locations
  SET is_active = false
  WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND is_active = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically deactivate old locations
DROP TRIGGER IF EXISTS trigger_deactivate_old_locations ON user_locations;
CREATE TRIGGER trigger_deactivate_old_locations
  AFTER INSERT ON user_locations
  FOR EACH ROW
  EXECUTE FUNCTION deactivate_old_locations();

-- Add helpful comment
COMMENT ON TABLE user_locations IS 'Stores GPS location history for all users with automatic active location management';
