import React, { useState } from 'react'
import { User, LayoutDashboard, Calendar, FileText, History, ChartBar as BarChart3, Settings, LogOut, Users, ClipboardList, TriangleAlert as AlertTriangle, Activity, Video as LucideIcon, MapPin, Clock } from 'lucide-react'
import ashokPillar from '../assets/ashok-pillar-symbol-icon-blue.webp'

import AdminDashboard from './admin/AdminDashboard'
import StaffDashboard from './staff/StaffDashboard'
import AttendanceView from './staff/AttendanceView'
import LeaveRequestView from './staff/LeaveRequestView'
import UserManagement from './admin/UserManagement'
import ScheduleView from './staff/ScheduleView'
import EmergencyView from './staff/EmergencyView'
import PulseTrackingMain from './pulse-tracking/PulseTrackingMain'
import LiveLocationView from './admin/LiveLocationView'
import ShiftManagementView from './admin/ShiftManagementView'
import LeaveCalendarView from './admin/LeaveCalendarView'
import EnhancedReportsView from './admin/EnhancedReportsView'
import { DashboardProps, Notification, User as UserType } from '../types'
import { useAttendance } from '../hooks/useAttendance'
import { useAllAttendance } from '../hooks/useAllAttendance'
import { useLeaveRequests } from '../hooks/useLeaveRequests'

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
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
    { id: 'pulse-tracking', label: 'Pulse Tracking', icon: Activity },
    { id: 'attendance-logs', label: 'Attendance Logs', icon: ClipboardList },
    { id: 'leave-management', label: 'Leave Management', icon: FileText },
    { id: 'user-management', label: 'User Management', icon: Users },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3 },
  ]

  // Combine menu items based on role - Admin gets more comprehensive menu
  const menuItems: MenuItem[] = user.role === 'admin'
    ? [
        { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
        { id: 'live-location', label: 'Live Location', icon: MapPin },
        { id: 'shift-management', label: 'Shift Management', icon: Clock },
        { id: 'pulse-tracking', label: 'Pulse Tracking', icon: Activity },
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
        case 'live-location':
          return <LiveLocationView />
        case 'shift-management':
          return <ShiftManagementView userId={user.id} />
        case 'pulse-tracking':
          return <PulseTrackingMain />
        case 'user-management':
          return <UserManagement />
        case 'attendance-logs':
          return <AttendanceLogsView />
        case 'leave-management':
          return <LeaveCalendarView adminUserId={user.id} />
        case 'reports':
          return <EnhancedReportsView userRole={user.role} />
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
            <img 
              src={ashokPillar} 
              alt="Police Emblem" 
              style={{ width: '64px', height: '64px' }}
            />
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
              <img 
                src={ashokPillar} 
                alt="Police Emblem" 
                style={{ width: '128px', height: '128px' }}
              />
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

const AttendanceHistoryView: React.FC<PlaceholderViewProps> = ({ user }) => {
  const { attendance, loading, error } = useAttendance(user.id);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: string } = {
      present: 'status-present',
      late: 'status-late',
      absent: 'status-absent'
    };
    return statusMap[status] || 'status-badge';
  };

  return (
    <div>
      <h2 style={{ color: 'var(--navy-blue)', marginBottom: '30px' }}>Attendance History</h2>
      <div className="card">
        <h3 className="card-title">Detailed Attendance History</h3>
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div className="spinner" />
            <p>Loading attendance history...</p>
          </div>
        )}
        {error && (
          <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
            Error: {error}
          </div>
        )}
        {!loading && !error && attendance.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No attendance records found
          </div>
        )}
        {!loading && !error && attendance.length > 0 && (
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
                {attendance.map((record) => (
                  <tr key={record.id}>
                    <td>{formatDate(record.timestamp)}</td>
                    <td>{record.punch_type === 'in' ? formatTime(record.timestamp) : '--'}</td>
                    <td>{record.punch_type === 'out' ? formatTime(record.timestamp) : '--'}</td>
                    <td>{record.hoursWorked ? record.hoursWorked.toFixed(2) : '0'}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadge(record.displayStatus || 'present')}`}>
                        {record.displayStatus ? record.displayStatus.charAt(0).toUpperCase() + record.displayStatus.slice(1) : 'Present'}
                      </span>
                    </td>
                    <td>{record.latitude && record.longitude ? `${record.latitude.toFixed(4)}, ${record.longitude.toFixed(4)}` : '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const AttendanceLogsView: React.FC = () => {
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { attendance, loading, error, totalPages } = useAllAttendance({
    page,
    pageSize: 20,
    dateFilter,
    statusFilter
  });

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getStatusBadge = (punchType: string) => {
    return punchType === 'in' ? 'status-present' : 'status-badge';
  };

  return (
    <div>
      <h2 style={{ color: 'var(--navy-blue)', marginBottom: '30px' }}>Attendance Logs</h2>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Filter by Date:</label>
          <input
            type="date"
            className="form-control"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: '200px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Filter by Status:</label>
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: '150px' }}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        {(dateFilter || statusFilter !== 'all') && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              setDateFilter('');
              setStatusFilter('all');
              setPage(1);
            }}
            style={{ alignSelf: 'flex-end' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">All Staff Attendance Logs</h3>
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div className="spinner" />
            <p>Loading attendance logs...</p>
          </div>
        )}
        {error && (
          <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
            Error: {error}
          </div>
        )}
        {!loading && !error && attendance.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No attendance logs found
          </div>
        )}
        {!loading && !error && attendance.length > 0 && (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Officer Name</th>
                    <th>Badge Number</th>
                    <th>Department</th>
                    <th>Punch Type</th>
                    <th>Time</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => (
                    <tr key={record.id}>
                      <td>{record.profiles?.full_name || 'Unknown'}</td>
                      <td>{record.profiles?.badge_number || '--'}</td>
                      <td>{record.profiles?.department || '--'}</td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: record.punch_type === 'in' ? '#e8f5e9' : '#fff3e0',
                          color: record.punch_type === 'in' ? '#2e7d32' : '#e65100',
                          fontWeight: '600'
                        }}>
                          {record.punch_type.toUpperCase()}
                        </span>
                      </td>
                      <td>{formatTime(record.timestamp)}</td>
                      <td>{formatDate(record.timestamp)}</td>
                      <td>
                        <span className={`status-badge ${getStatusBadge(record.punch_type)}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px', padding: '10px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span style={{ padding: '8px 16px', alignSelf: 'center' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  className="btn btn-secondary"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const LeaveManagementView: React.FC = () => {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { leaveRequests, loading, error, approveLeaveRequest, rejectLeaveRequest } = useLeaveRequests({ isAdmin: true });

  const handleApprove = async (requestId: string) => {
    const result = await approveLeaveRequest(requestId, 'admin-user-id');
    if (result.success) {
      alert('Leave request approved successfully');
    } else {
      alert(`Failed to approve: ${result.error}`);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    const result = await rejectLeaveRequest(requestId, 'admin-user-id', rejectReason);
    if (result.success) {
      alert('Leave request rejected');
      setSelectedRequest(null);
      setRejectReason('');
    } else {
      alert(`Failed to reject: ${result.error}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: string } = {
      approved: 'status-present',
      pending: 'status-late',
      rejected: 'status-absent'
    };
    return statusMap[status] || 'status-badge';
  };

  return (
    <div>
      <h2 style={{ color: 'var(--navy-blue)', marginBottom: '30px' }}>Leave Management</h2>
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div className="spinner" />
          <p>Loading leave requests...</p>
        </div>
      )}
      {error && (
        <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
          Error: {error}
        </div>
      )}
      {!loading && !error && (
        <div className="card">
          <h3 className="card-title">Manage Leave Requests</h3>
          {leaveRequests.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No leave requests found
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Officer</th>
                    <th>Badge Number</th>
                    <th>Department</th>
                    <th>Dates</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="profile-img">
                            {request.profiles?.full_name?.split(' ').map(n => n[0]).join('') || '??'}
                          </div>
                          <div>{request.profiles?.full_name || 'Unknown'}</div>
                        </div>
                      </td>
                      <td>{request.profiles?.badge_number || '--'}</td>
                      <td>{request.profiles?.department || '--'}</td>
                      <td>
                        {formatDate(request.start_date)} - {formatDate(request.end_date)}
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {request.reason}
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadge(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        {request.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              className="btn btn-success"
                              onClick={() => handleApprove(request.id)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => setSelectedRequest(request.id)}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#666', fontStyle: 'italic' }}>
                            {request.status === 'approved' ? 'Approved' : 'Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedRequest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '20px' }}>Reject Leave Request</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Reason for rejection:
              </label>
              <textarea
                className="form-control"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="Enter reason for rejection..."
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedRequest(null);
                  setRejectReason('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleReject(selectedRequest)}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ReportsView: React.FC<PlaceholderViewProps> = ({ user }) => {
  const isAdmin = user.role === 'admin';
  const { attendance: allAttendance, loading: attendanceLoading } = useAllAttendance({ pageSize: 100 });
  const { attendance: userAttendance } = useAttendance(user.id);
  const { leaveRequests, loading: leaveLoading } = useLeaveRequests({
    userId: isAdmin ? undefined : user.id,
    isAdmin
  });

  const attendanceData = isAdmin ? allAttendance : userAttendance;

  const exportAsCSV = () => {
    const headers = ['Officer Name', 'Badge Number', 'Punch Type', 'Date', 'Time', 'Status'];
    const rows = attendanceData.map(record => [
      record.profiles?.full_name || 'Unknown',
      record.profiles?.badge_number || '--',
      record.punch_type.toUpperCase(),
      new Date(record.timestamp).toLocaleDateString(),
      new Date(record.timestamp).toLocaleTimeString(),
      record.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportAsPDF = () => {
    alert('PDF export functionality coming soon');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const loading = attendanceLoading || leaveLoading;

  return (
    <div>
      <h2 style={{ color: 'var(--navy-blue)', marginBottom: '30px', textAlign: 'center', fontSize: '32px' }}>
        REPORTS AND EXPORT
      </h2>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <button
          className="btn btn-primary"
          onClick={exportAsCSV}
          disabled={loading || attendanceData.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <span>EXPORT AS CSV</span>
        </button>
        <button
          className="btn"
          onClick={exportAsPDF}
          disabled={loading || attendanceData.length === 0}
          style={{ backgroundColor: 'var(--navy-blue)', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <span>EXPORT AS PDF</span>
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div className="spinner" />
          <p>Loading report data...</p>
        </div>
      )}

      {!loading && (
        <>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 className="card-title">ATTENDANCE SUMMARY</h3>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--navy-blue)' }}>
                  {attendanceData.length}
                </div>
                <div style={{ color: '#666' }}>Total Records</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4caf50' }}>
                  {attendanceData.filter(r => r.punch_type === 'in').length}
                </div>
                <div style={{ color: '#666' }}>Check-ins</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff9800' }}>
                  {attendanceData.filter(r => r.punch_type === 'out').length}
                </div>
                <div style={{ color: '#666' }}>Check-outs</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2196f3' }}>
                  {leaveRequests.length}
                </div>
                <div style={{ color: '#666' }}>Leave Requests</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">ATTENDANCE LOGS</h3>
            {attendanceData.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No attendance records available
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Officer Name</th>
                      <th>Badge Number</th>
                      <th>Punch Type</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.slice(0, 50).map((record) => (
                      <tr key={record.id}>
                        <td>{record.profiles?.full_name || user.full_name}</td>
                        <td>{record.profiles?.badge_number || user.badge_number}</td>
                        <td>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: record.punch_type === 'in' ? '#e8f5e9' : '#fff3e0',
                            color: record.punch_type === 'in' ? '#2e7d32' : '#e65100',
                            fontWeight: '600'
                          }}>
                            {record.punch_type.toUpperCase()}
                          </span>
                        </td>
                        <td>{formatDate(record.timestamp)}</td>
                        <td>{formatTime(record.timestamp)}</td>
                        <td>
                          <span className="status-badge status-present">
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

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