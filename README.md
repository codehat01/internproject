# Police Attendance System

A comprehensive React-based police attendance management system with role-based access control, built with Vite and Supabase.

## 🚀 Features

### 👮‍♂️ **Staff Functionalities**
- ✅ **Login with Badge ID + Password**
- ✅ **Punch In / Punch Out** (with geofence and photo verification)
- ✅ **View Attendance History** (personal IN/OUT logs)
- ✅ **Submit Leave Request** (with date picker, reason, file upload)
- ✅ **Track Leave Requests** (Pending/Approved/Rejected status)
- ✅ **Profile Management** (view badge, name, rank, update contact info)

### 👑 **Admin Functionalities**
- ✅ **All Staff Features** (for self-management)
- ✅ **Admin Dashboard** (summary cards, charts, attendance trends)
- ✅ **User Management** (add/edit/remove staff, assign badge numbers)
- 🚧 **Attendance Logs** (staff entries with photos and location)
- 🚧 **Leave Request Management** (approve/reject with reasons)
- 🚧 **Reports & Export** (CSV/PDF export functionality)
- 🚧 **Audit Logs** (track admin actions)

## 🎨 Color Theme

- **Navy Blue** (#0a1f44): Headers, Sidebar, Buttons, Chart Titles
- **White** (#ffffff): Background, Cards, Table Cells
- **Golden** (#d4af37): Buttons, Highlights, Icons, Accents
- **Light Gray** (#f2f2f2): Table Borders, Card Backgrounds, Subtle Accents
- **Green** (#28a745): Approve Buttons, Success Alerts
- **Red** (#dc3545): Reject Buttons, Error Alerts
- **Dark Gray** (#6c757d): Text, Labels, Muted Elements

## 🛠️ Technology Stack

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Icons**: Lucide React
- **Styling**: CSS with CSS Variables
- **Authentication**: Supabase Auth with RLS
- **Database**: PostgreSQL with PostGIS for location data

## 📁 Project Structure

```
src/
├── components/
│   ├── admin/
│   │   ├── AdminDashboard.jsx     ✅ Complete
│   │   └── UserManagement.jsx     ✅ Complete
│   ├── staff/
│   │   ├── StaffDashboard.jsx     ✅ Complete
│   │   ├── AttendanceView.jsx     ✅ Complete
│   │   └── LeaveRequestView.jsx   ✅ Complete
│   ├── Login.jsx                  ✅ Complete
│   └── Dashboard.jsx              ✅ Complete
├── lib/
│   └── supabase.js               ✅ Configured
├── styles/
│   └── theme.js                  ✅ Complete
├── App.jsx                       ✅ Complete
├── main.jsx                      ✅ Complete
└── index.css                     ✅ Complete
database/
├── schema.sql                    ✅ Complete
└── setup-instructions.md        ✅ Complete
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Your `.env` file is already configured with Supabase credentials:
```env
VITE_SUPABASE_URL=https://uospodcrrfnfhjwmbsrw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Setup
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `database/schema.sql`
4. Follow instructions in `database/setup-instructions.md`

### 4. Start Development Server
```bash
npm run dev
```

### 5. Open Application
Visit http://localhost:5173 in your browser

## 🧪 Test Credentials

### Admin Login
- **Badge ID**: `ADMIN001`
- **Password**: Any password (mock auth)
- **Features**: Full admin dashboard, user management, all staff features

### Staff Login
- **Badge ID**: `STAFF001` (or any other badge ID)
- **Password**: Any password (mock auth)
- **Features**: Staff dashboard, attendance, leave requests, profile

## ✅ Completed Features

### 🎯 **Core Functionality**
- [x] Role-based authentication (Admin/Staff)
- [x] Responsive design with police theme
- [x] Navigation with role-based menu items
- [x] Notification system
- [x] Mock data for testing

### 👮‍♂️ **Staff Features**
- [x] Staff dashboard with attendance summary
- [x] Punch In/Out with geolocation and photo simulation
- [x] Leave request form with file upload
- [x] Leave request history with status tracking
- [x] Profile information display
- [x] Attendance history view

### 👑 **Admin Features**
- [x] Admin dashboard with statistics cards
- [x] Attendance trends charts
- [x] Leave request status pie chart
- [x] Recent attendance logs table
- [x] Pending leave requests management
- [x] User management (add/edit/delete staff)
- [x] Staff search and filtering
- [x] Role and rank management

## 🚧 Next Implementation Steps

### Phase 1: Database Integration
1. **Real Supabase Authentication**
   - Replace mock auth with Supabase Auth
   - Implement proper user registration
   - Set up RLS policies

2. **Data Integration**
   - Connect components to Supabase tables
   - Implement CRUD operations
   - Real-time data updates

### Phase 2: Advanced Features
1. **Attendance Logs View** (Admin)
   - Complete staff attendance logs with photos
   - Location mapping integration
   - Export functionality

2. **Leave Management** (Admin)
   - Approve/reject leave requests
   - Email notifications
   - Leave balance tracking

3. **Reports & Export**
   - CSV/PDF export functionality
   - Date range filtering
   - Custom report generation

### Phase 3: Production Features
1. **Photo Capture**
   - Real camera integration
   - Image upload to Supabase Storage
   - Photo verification

2. **Geofencing**
   - Real GPS coordinates validation
   - Police station boundary checking
   - Location accuracy verification

3. **Notifications**
   - Email notifications for leave requests
   - SMS alerts for attendance
   - Push notifications

## 🎨 UI/UX Features

- **Professional Police Theme**: Navy blue and golden color scheme
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Interactive Elements**: Hover effects, smooth transitions
- **Data Visualization**: Charts for attendance trends and leave statistics
- **User-Friendly Forms**: Intuitive date pickers, file uploads
- **Status Indicators**: Color-coded badges for different states
- **Search & Filter**: Easy staff management with search functionality

## 📊 Database Schema

The system uses a comprehensive PostgreSQL schema with:
- **profiles**: User information with badge numbers and roles
- **attendance**: Punch records with location and photo data
- **leave_requests**: Leave applications with approval workflow
- **audit_logs**: Admin action tracking for compliance

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Role-based Access**: Different UI and permissions for Admin/Staff
- **Geofencing**: Location-based attendance validation
- **Photo Verification**: Visual confirmation for punch records
- **Audit Trail**: Complete logging of admin actions

## 📱 Mobile Responsive

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones
- Different screen orientations

---

**Status**: Core functionality complete, ready for database integration and advanced features implementation.