# Police Attendance System - Setup Guide

## Overview
This is a comprehensive Police Attendance System with real-time pulse tracking and live location monitoring. The system is built with React, TypeScript, Vite, and Supabase.

## Features Implemented

### 1. Pulse Tracking System
- Real-time staff monitoring dashboard
- User status tracking (On Duty, On Leave, Absent)
- Live location tracking with interactive maps
- User detail pages with attendance analytics
- Location history and GPS coordinates display

### 2. Admin Features
- Complete user management (Add, Edit, Delete users)
- Bulk user operations
- Real-time attendance monitoring
- Leave request management
- Dashboard analytics

### 3. Location Tracking
- Real-time GPS location updates
- Interactive Leaflet maps showing user positions
- Location accuracy display
- Automatic location history storage
- Location-based attendance verification

## Database Setup

### Step 1: Apply Database Migrations

You need to run the SQL migrations to set up your database:

1. **Main Schema** (`database/schema.sql`)
   - Creates profiles, attendance, leave_requests, audit_logs tables
   - Sets up Row Level Security (RLS) policies
   - Creates triggers and functions

2. **Status Migration** (`database/migrations/001_add_status_to_attendance.sql`)
   - Adds status field to attendance table

3. **Location Tracking** (`database/migrations/002_add_user_locations.sql`)
   - Creates user_locations table for GPS tracking
   - Sets up indexes for performance
   - Creates automatic location management triggers

### Step 2: Run Migrations in Supabase

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file in order:
   - First: `database/schema.sql`
   - Second: `database/migrations/001_add_status_to_attendance.sql`
   - Third: `database/migrations/002_add_user_locations.sql`

## How to Use the System

### Admin Access

1. **Login as Admin**
   - Use admin credentials to access the system
   - Admin role is required for pulse tracking and user management

2. **Pulse Tracking Page**
   - Navigate to "Pulse Tracking" from the sidebar
   - View all staff members with their current status
   - Click any user card to see detailed information
   - View live location on interactive map

3. **User Management**
   - Navigate to "User Management" from sidebar
   - Add new users with email and password
   - Edit existing user details
   - Activate/deactivate users
   - Delete users if needed

4. **View User Location**
   - On Pulse Tracking page, click any user card
   - Scroll down to see "Live Location Tracking" section
   - If user has shared location, you'll see:
     - Interactive map with user's position
     - GPS coordinates
     - Location accuracy
     - Last update timestamp

### Staff Features

Staff users can:
- Mark attendance (punch in/out)
- Request leave
- View their own attendance history
- Share location for tracking

## Location Tracking Setup

### For Staff Members

To enable location tracking for staff:

1. Staff needs to grant browser location permissions
2. Location will be automatically captured during attendance punch
3. Location updates are stored in `user_locations` table
4. Only the most recent location per user is marked as "active"

### Location Service

The `locationService` (`src/lib/locationService.ts`) provides:
- `getCurrentPosition()` - Get current GPS coordinates
- `startTracking()` - Begin continuous location tracking
- `stopTracking()` - Stop location tracking
- `getLatestLocation()` - Fetch user's latest location from database
- `updateLocationInDatabase()` - Store location in Supabase

## Database Structure

### Key Tables

1. **profiles**
   - User information (badge_number, full_name, rank, role, etc.)
   - RLS: Users see own profile, admins see all

2. **attendance**
   - Punch in/out records
   - Includes latitude/longitude for location-based attendance
   - RLS: Users see own records, admins see all

3. **leave_requests**
   - Leave application records
   - Status tracking (pending, approved, rejected)
   - RLS: Users manage own requests, admins manage all

4. **user_locations**
   - GPS tracking data
   - Automatic active location management
   - Timestamp and accuracy tracking
   - RLS: Users insert own location, admins view all

## Security Features

- Row Level Security (RLS) on all tables
- Secure authentication with Supabase Auth
- Role-based access control
- Admin-only features protected at database level
- Password requirements enforced
- Location data privacy controls

## Environment Variables

Make sure your `.env` file contains:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running the Application

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## Key Components

1. **PulseTrackingMain** - Main pulse tracking interface
2. **UserDetailPage** - Individual user details with map
3. **LocationMap** - Interactive Leaflet map component
4. **UserManagement** - Admin user CRUD operations
5. **usePulseData** - Custom hook for fetching pulse data

## Testing the System

1. Create an admin user through Supabase Auth
2. Login as admin
3. Navigate to User Management
4. Add test users
5. Navigate to Pulse Tracking
6. Click on a user to see their details
7. Location will show if user has shared it

## Notes

- Location tracking requires HTTPS in production
- Browser permissions needed for GPS access
- Map requires internet connection for tile loading
- Location updates can be configured via `updateInterval` in `locationService.ts`

## Troubleshooting

### No Users Showing
- Check database migrations are applied
- Verify RLS policies are set up correctly
- Ensure admin user has proper role in database

### Map Not Loading
- Check internet connection
- Verify Leaflet CSS is loaded
- Check browser console for errors

### Location Not Updating
- Verify browser has location permissions
- Check `user_locations` table exists
- Ensure RLS policies allow inserts

## Support

For issues or questions, check the browser console for detailed error messages.
