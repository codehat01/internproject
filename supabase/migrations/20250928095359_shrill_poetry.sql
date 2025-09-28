/*
  # Create RPC function to get email by badge number

  1. Security Function
    - `get_email_by_badge` function to securely get email from badge number
    - Only returns email for valid badge numbers
    - No admin privileges required

  2. Security
    - Function is accessible to authenticated users
    - Returns null for invalid badge numbers
*/

CREATE OR REPLACE FUNCTION get_email_by_badge(badge_num text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
BEGIN
  -- Get the user ID from profiles table using badge number
  SELECT auth.users.email INTO user_email
  FROM profiles
  JOIN auth.users ON profiles.id = auth.users.id
  WHERE profiles.badge_number = badge_num;
  
  RETURN user_email;
END;
$$;