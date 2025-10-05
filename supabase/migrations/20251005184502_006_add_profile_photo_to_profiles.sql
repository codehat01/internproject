/*
  # Add Profile Photo Support

  ## Changes
  1. Add profile_photo_url column to profiles table to store user profile photos uploaded during signup
  
  ## Security
  - Column is nullable to support existing records
  - No RLS changes needed as profiles table already has RLS enabled
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_photo_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_photo_url text;
  END IF;
END $$;