import React, { useState } from 'react'
import { 
  Shield, 
  User, 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  History, 
  BarChart3, 
  Settings, 
  LogOut,
  Users,
  ClipboardList,
  AlertTriangle,
  LucideIcon
} from 'lucide-react'

// Import organized components
import AdminDashboard from './admin/AdminDashboard'
import StaffDashboard from './staff/StaffDashboard'
import AttendanceView from './staff/AttendanceView'
import LeaveRequestView from './staff/LeaveRequestView'
import UserManagement from './admin/UserManagement'
import ScheduleView from './staff/ScheduleView'
import EmergencyView from './staff/EmergencyView'
import { DashboardProps, Notification, User as UserType } from '../types'

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState<string>('dashboard')
  const [notification, setNotification] = useState<Notification>({ message: '', type: 'info', show: false })
  const [profileOpen, setProfileOpen] = useState<boolean>(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)

  const showNotification = (message: string, type: Notification['type']): void => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  const handleLogout = (): void => {
    if (window.confirm('Are you sure you want to logout?')) {
      onLogout()
      showNotification('Logged out successfully!', 'info')
    }
  }

  // Base menu items for all users
  const baseMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'leave-requests', label: 'Leave Requests', icon: FileText },
    { id: 'attendance-history', label: 'Attendance History', icon: History },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'emergency', label: 'Emergency', icon: AlertTriangle },
  ]

  // Admin-only menu items
  const adminMenuItems: MenuItem[] = [
    { id: 'attendance-logs', label: 'Attendance Logs', icon: ClipboardList },
    { id: 'leave-management', label: 'Leave Management', icon: FileText },
    { id: 'user-management', label: 'User Management', icon: Users },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3 },
  ]

  // Combine menu items based on role - Admin gets more comprehensive menu
  const menuItems: MenuItem[] = user.role === 'admin' 
    ? [
        { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
        { id: 'user-management', label: 'User Management', icon: Users },
        { id: 'attendance-logs', label: 'Attendance Logs', icon: ClipboardList },
        { id: 'leave-management', label: 'Leave Management', icon: FileText },
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
        { id: 'settings', label: 'System Settings', icon: Settings }
      ]
    : [...baseMenuItems, { id: 'reports', label: 'Reports', icon: BarChart3 }, { id: 'settings', label: 'Settings', icon: Settings }]

  const renderContent = (): React.ReactElement => {
    // Role-based access control
    if (user.role === 'admin') {
      // Admin-only sections
      switch (activeSection) {
        case 'dashboard':
          return <AdminDashboard user={user} />
        case 'user-management':
          return <UserManagement />
        case 'attendance-logs':
          return <AttendanceLogsView />
        case 'leave-management':
          return <LeaveManagementView />
        case 'reports':
          return <ReportsView user={user} />
        case 'settings':
          return <SettingsView user={user} />
        default:
          return <AdminDashboard user={user} />
      }
    } else {
      // Staff-only sections
      switch (activeSection) {
        case 'dashboard':
          return <StaffDashboard user={user} />
        case 'attendance':
          return <AttendanceView user={user} />
        case 'leave-requests':
          return <LeaveRequestView user={user} />
        case 'attendance-history':
          return <AttendanceHistoryView user={user} />
        case 'schedule':
          return <ScheduleView user={user} />
        case 'emergency':
          return <EmergencyView user={user} />
        case 'reports':
          return <ReportsView user={user} />
        case 'settings':
          return <SettingsView user={user} />
        default:
          return <StaffDashboard user={user} />
      }
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
          <div className="header-emblem">
            <Shield size={24} />
          </div>
          <div className="header-title-container">
            <span className="header-title">POLICE ATTENDANCE</span>
            <span className="header-subtitle">SYSTEM</span>
          </div>
        </div>
        <div className="header-right">
          <div className="user-info">
            <div className="user-name">Welcome, {user.full_name}</div>
            <div className="user-role">
              {user.role === 'admin' ? '👑 Administrator' : '👮 Officer'} • {user.badge_number}
            </div>
          </div>
          <div className="user-avatar-container">
            <div 
              className="user-avatar"
              onClick={() => setProfileOpen(prev => !prev)}
            >
              {user.full_name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        </div>
      </header>

      <div className="main-content">
        <nav className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <Shield size={32} />
            </div>
            <button 
              className="sidebar-close"
              onClick={() => setMobileMenuOpen(false)}
            >
              ×
            </button>
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.id}
                className={`nav-item ${activeSection === item.id ? 'nav-item-active' : ''}`}
                onClick={() => {
                  setActiveSection(item.id)
                  setMobileMenuOpen(false)
                }}
              >
                <Icon size={22} />
                <span className="nav-item-text">{item.label}</span>
              </div>
            )
          })}
          <div className="nav-item nav-item-logout" onClick={handleLogout}>
            <LogOut size={22} />
            <span className="nav-item-text">Logout</span>
          </div>
        </nav>

        {mobileMenuOpen && <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />}

        <main className="content-area">
          {renderContent()}
        </main>
      </div>

      {/* Notification */}
      <div className={`notification ${notification.type} ${notification.show ? 'show' : ''}`}>
        {notification.message}
      </div>
    </div>
  )
}

// Placeholder components for views not yet implemented
interface PlaceholderViewProps {
  user: UserType;
}

const AttendanceHistoryView: React.FC<PlaceholderViewProps> = ({ user }) => (
  <div>
    <h2 style={{ color: 'var(--navy-blue)', marginBottom: '30px' }}>Attendance History</h2>
    <div className="card">
      <h3 className="card-title">Detailed Attendance History</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time In</th>
              <th>Time Out</th>
              <th>Hours Worked</th>
              <th>Status</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2024-09-28</td>
              <td>09:00 AM</td>
              <td>05:30 PM</td>
              <td>8.5</td>
              <td><span className="status-badge status-present">Present</span></td>
              <td>HQ Building</td>
            </tr>
            <tr>
              <td>2024-09-27</td>
              <td>09:15 AM</td>
              <td>05:30 PM</td>
              <td>8.25</td>
              <td><span className="status-badge status-late">Late</span></td>
              <td>HQ Building</td>
            </tr>
            <tr>
              <td>2024-09-26</td>
              <td>--</td>
              <td>--</td>
              <td>0</td>
              <td><span className="status-badge status-absent">Absent</span></td>
              <td>--</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
)

const AttendanceLogsView: React.FC = () => (
  <div>
    <h2 style={{ color: 'var(--navy-blue)', marginBottom: '30px' }}>Attendance Logs</h2>
    <div className="card">
      <h3 className="card-title">All Staff Attendance Logs</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Officer Name</th>
              <th>Punch In Time</th>
              <th>Punch Out Time</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Officer K. Singh</td>
              <td>08:58 AM</td>
              <td>05:02 PM</td>
              <td>2024-09-28</td>
              <td><span className="status-badge status-present">Present</span></td>
            </tr>
            <tr>
              <td>Officer A. Khan</td>
              <td>09:05 AM</td>
              <td>05:00 PM</td>
              <td>2024-09-28</td>
              <td><span className="status-badge status-present">Present</span></td>
            </tr>
            <tr>
              <td>Officer R. Verma</td>
              <td>09:15 AM</td>
              <td>--</td>
              <td>2024-09-28</td>
              <td><span className="status-badge status-present">Present</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
)

const LeaveManagementView: React.FC = () => (
  <div>
    <h2 style={{ color: 'var(--navy-blue)', marginBottom: '30px' }}>Leave Management</h2>
    <div className="card">
      <h3 className="card-title">Manage Leave Requests</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Officer</th>
              <th>Dates</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="profile-img">KS</div>
                  <div>Officer K. Singh</div>
                </div>
              </td>
              <td>July 15 - July 17</td>
              <td>Family event</td>
              <td><span className="status-badge status-present">Approved</span></td>
              <td>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-success">Approve</button>
                  <button className="btn btn-danger">Reject</button>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="profile-img">AK</div>
                  <div>Officer A. Khan</div>
                </div>
              </td>
              <td>July 20 - July 22</td>
              <td>Medical Appointment</td>
              <td><span className="status-badge status-late">Pending</span></td>
              <td>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-success">Approve</button>
                  <button className="btn btn-danger">Reject</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
)

const ReportsView: React.FC<PlaceholderViewProps> = ({ user }) => (
  <div>
    <h2 style={{ color: 'var(--navy-blue)', marginBottom: '30px', textAlign: 'center', fontSize: '32px' }}>REPORTS AND EXPORT</h2>
    
    <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
      <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>EXPORT AS CSV</span>
      </button>
      <button className="btn btn-warning" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>EXPORT AS EXCEL</span>
      </button>
      <button className="btn" style={{ backgroundColor: 'var(--navy-blue)', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>EXPORT AS PDF</span>
      </button>
    </div>

    <div className="card">
      <h3 className="card-title">ATTENDANCE LOGS</h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Officer Name</th>
              <th>Punch In Time</th>
              <th>Punch Out Time</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Officer K. Singh</td>
              <td>08:58 AM</td>
              <td>05:02 PM</td>
              <td>2024-09-28</td>
              <td><span className="status-badge status-present">Present</span></td>
            </tr>
            <tr>
              <td>Officer A. Khan</td>
              <td>09:05 AM</td>
              <td>05:00 PM</td>
              <td>2024-09-28</td>
              <td><span className="status-badge status-present">Present</span></td>
            </tr>
            <tr>
              <td>Officer R. Verma</td>
              <td>09:15 AM</td>
              <td>--</td>
              <td>2024-09-28</td>
              <td><span className="status-badge status-present">Present</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
)

const SettingsView: React.FC<PlaceholderViewProps> = ({ user }) => (
  <div>
    <h2 style={{ color: 'var(--navy-blue)', marginBottom: '30px' }}>Settings</h2>
    <div className="card">
      <h3 className="card-title">User Settings</h3>
      <form>
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Notification Preferences</label>
          <div style={{ display: 'flex', gap: '20px' }}>
            <label><input type="checkbox" defaultChecked /> Email Notifications</label>
            <label><input type="checkbox" defaultChecked /> SMS Alerts</label>
            <label><input type="checkbox" /> Push Notifications</label>
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Language</label>
          <select className="form-control" style={{ width: '200px' }}>
            <option>English</option>
            <option>Hindi</option>
            <option>Regional Language(tamil)</option>
          </select>
        </div>
        <div className="form-group">
          <button type="button" className="btn btn-golden">Save Changes</button>
        </div>
      </form>
    </div>
  </div>
)

export default Dashboard