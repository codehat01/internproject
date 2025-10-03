/*
  # Create shifts table for shift management

  1. New Tables
    - `shifts`
      - `id` (uuid, primary key)
      - `station_id` (text) - Station/department identifier
      - `shift_name` (text) - Name of the shift (e.g., "Morning Shift")
      - `shift_start` (timestamptz) - Start time of the shift
      - `shift_end` (timestamptz) - End time of the shift
      - `assigned_users` (uuid[]) - Array of user IDs assigned to this shift
      - `created_by` (uuid) - Admin who created the shift
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `shifts` table
    - Add policy for staff to read their assigned shifts
    - Add policy for admins to read all shifts
    - Add policy for admins to insert shifts
    - Add policy for admins to update shifts
    - Add policy for admins to delete shifts

  3. Indexes
    - Add index on `station_id` for faster queries
    - Add index on `shift_start` for date-based queries
*/

CREATE TABLE IF NOT EXISTS shifts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  station_id TEXT NOT NULL,
  shift_name TEXT NOT NULL,
  shift_start TIMESTAMPTZ NOT NULL,
  shift_end TIMESTAMPTZ NOT NULL,
  assigned_users UUID[] DEFAULT ARRAY[]::UUID[],
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view their assigned shifts"
  ON shifts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(assigned_users));

CREATE POLICY "Admins can view all shifts"
  ON shifts
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert shifts"
  ON shifts
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update shifts"
  ON shifts
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete shifts"
  ON shifts
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_shifts_station_id ON shifts(station_id);
CREATE INDEX IF NOT EXISTS idx_shifts_shift_start ON shifts(shift_start);

CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();