# Database Setup Instructions

## 1. Supabase Dashboard Setup

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `schema.sql` into the SQL Editor
4. Run the SQL script to create all tables, policies, and functions

## 2. Enable Required Extensions

Make sure these extensions are enabled in your Supabase project:
- `uuid-ossp` (for UUID generation)
- `postgis` (for location data)

## 3. Authentication Setup

### Enable Email Authentication:
1. Go to Authentication > Settings
2. Enable "Email" provider
3. Disable "Confirm email" for testing (optional)

### Create Test Users:

You can create test users in two ways:

#### Option A: Through Supabase Dashboard
1. Go to Authentication > Users
2. Click "Add user"
3. Create users with these details:

**Admin User:**
- Email: `admin@police.gov`
- Password: `admin123`
- User Metadata:
  ```json
  {
    "badge_number": "ADMIN001",
    "full_name": "Admin User",
    "rank": "Inspector",
    "role": "admin"
  }
  ```

**Staff User:**
- Email: `staff@police.gov`
- Password: `staff123`
- User Metadata:
  ```json
  {
    "badge_number": "STAFF001",
    "full_name": "Officer John Doe",
    "rank": "Constable",
    "role": "staff"
  }
  ```

#### Option B: Through Application
Users will be automatically created when they first sign up, and the `handle_new_user()` function will create their profile.

## 4. Row Level Security (RLS)

The schema includes RLS policies that ensure:
- Staff can only see their own data
- Admins can see all data
- Proper access control for all operations

## 5. Test the Setup

After running the schema:
1. Check that all tables are created in the Table Editor
2. Verify that RLS policies are active
3. Test user creation and profile generation

## 6. Storage Setup (for photos and files)

1. Go to Storage in your Supabase dashboard
2. Create buckets:
   - `attendance-photos` (for punch-in/out photos)
   - `leave-documents` (for leave request attachments)
3. Set up storage policies for proper access control

## Tables Created:

- `profiles` - User profiles with badge numbers and roles
- `attendance` - Punch in/out records with location and photos
- `leave_requests` - Leave applications and approvals
- `audit_logs` - Track admin actions for compliance

## Next Steps:

After setting up the database, update the React app to use real Supabase authentication instead of the mock login system.