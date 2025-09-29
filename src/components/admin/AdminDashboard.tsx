import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  MapPin,
  Calendar
} from 'lucide-react'
import { getDashboardStats, getAllAttendanceLogs, getAllLeaveRequests, updateLeaveRequestStatus } from '../../lib/database'
import { AdminDashboardProps, Notification, DashboardStats } from '../../types'

interface AttendanceLogSummary {
  id: string;
  name: string;
  badge: string;
  timeIn: string;
  timeOut: string;
  location: string;
  photo: string;
  timestamp: string;
  punchType: string;
}

interface PendingLeaveRequest {
  id: string;
  name: string;
  badge: string;
  dates: string;
  reason: string;
  photo: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [notification, setNotification] = useState<Notification>({ message: '', type: 'info', show: false })
  const [stats, setStats] = useState<DashboardStats>({
    totalStaff: 0,
    presentToday: 0,
    pendingLeaves: 0,
    approvedThisMonth: 0
  })
  const [recentAttendance, setRecentAttendance] = useState<AttendanceLogSummary[]>([])
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState<PendingLeaveRequest[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async (): Promise<void> => {
    try {
      setLoading(true)
      
      // Load dashboard statistics
      const dashboardStats = await getDashboardStats()
      setStats(dashboardStats)

      // Load recent attendance logs (limit to 5 for dashboard)
      const attendanceLogs = await getAllAttendanceLogs(5)
      const formattedAttendance = attendanceLogs.map(log => ({
        id: log.id,
        name: log.profiles.name,
        badge: log.profiles.badge_number,
        timeIn: log.punch_type === 'in' ? new Date(log.timestamp).toLocaleTimeString() : '--',
        timeOut: log.punch_type === 'out' ? new Date(log.timestamp).toLocaleTimeString() : '--',
        location: log.latitude && log.longitude ? 'HQ Building' : 'Unknown',
        photo: log.profiles.name.split(' ').map(n => n[0]).join(''),
        timestamp: log.timestamp,
        punchType: log.punch_type
      }))
      setRecentAttendance(formattedAttendance)

      // Load pending leave requests
      const leaveRequests = await getAllLeaveRequests()
      const pendingRequests = leaveRequests
        .filter(request => request.status === 'pending') // Changed from 'Pending' to 'pending'
        .slice(0, 5) // Limit to 5 for dashboard
        .map(request => ({
          id: request.id,
          name: request.profiles.name,
          badge: request.profiles.badge_number,
          dates: `${new Date(request.start_date).toLocaleDateString()} - ${new Date(request.end_date).toLocaleDateString()}`,
          reason: request.reason,
          photo: request.profiles.name.split(' ').map(n => n[0]).join('')
        }))
      setPendingLeaveRequests(pendingRequests)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      showNotification('Error loading dashboard data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message: string, type: Notification['type']): void => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  const handleLeaveAction = async (action: 'approve' | 'reject', requestId: string, staffName: string): Promise<void> => {
    try {
      const status = action === 'approve' ? 'approved' : 'rejected'
      await updateLeaveRequestStatus(requestId, status, undefined, user.id)
      
      const actionText = action === 'approve' ? 'approved' : 'rejected'
      showNotification(`Leave request ${actionText} for ${staffName}!`, action === 'approve' ? 'success' : 'error')
      
      // Reload data to reflect changes
      loadDashboardData()
    } catch (error) {
      console.error('Error updating leave request:', error)
      showNotification('Error updating leave request', 'error')
    }
  }

  const statsData = [
    {
      number: stats.totalStaff.toString(),
      label: 'Total Staff',
      icon: Users,
      color: '#0a1f44',
      bgColor: '#e3f2fd',
      hasAlert: false
    },
    {
      number: stats.presentToday.toString(),
      label: 'Present Today',
      icon: CheckCircle,
      color: '#28a745',
      bgColor: '#e8f5e8',
      hasAlert: false
    },
    {
      number: stats.pendingLeaves.toString(),
      label: 'Pending Leave Requests',
      icon: Clock,
      color: '#d4af37',
      bgColor: '#fff8e1',
      hasAlert: stats.pendingLeaves > 5,
      alertText: 'High pending requests'
    },
    {
      number: stats.approvedThisMonth.toString(),
      label: 'Approved Leave This Month',
      icon: CheckCircle,
      color: '#28a745',
      bgColor: '#e8f5e8',
      hasAlert: false
    }
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: 'var(--navy-blue)', fontSize: '18px' }}>Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ color: 'var(--navy-blue)', marginBottom: '30px', fontSize: '28px', fontWeight: '700' }}>
        Admin Dashboard
      </h2>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statsData.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="stat-card" style={{ borderLeft: `5px solid ${stat.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div className="stat-number" style={{ display: 'flex', alignItems: 'center' }}>
                    {stat.number}
                    {stat.hasAlert && (
                      <div className="alert-badge">!</div>
                    )}
                  </div>
                  <div className="stat-label">
                    {stat.label}
                    {stat.hasAlert && <><br />{stat.alertText}</>}
                  </div>
                </div>
                <Icon size={48} style={{ color: stat.color, marginLeft: 'auto' }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px', marginBottom: '30px' }}>
        {/* Daily Attendance Trends */}
        <div className="card">
          <h3 className="card-title">Daily Attendance Trends</h3>
          <div className="chart-container" style={{ height: '200px', display: 'flex', alignItems: 'end', gap: '15px', padding: '20px 0' }}>
            <div className="chart-bar" style={{ flex: 1, height: '80%', background: 'var(--navy-blue)', borderRadius: '5px 5px 0 0', display: 'flex', alignItems: 'end', justifyContent: 'center', color: 'white', fontWeight: 'bold', padding: '10px 0' }}>
              Mon
            </div>
            <div className="chart-bar" style={{ flex: 1, height: '60%', background: 'var(--navy-blue)', borderRadius: '5px 5px 0 0', display: 'flex', alignItems: 'end', justifyContent: 'center', color: 'white', fontWeight: 'bold', padding: '10px 0' }}>
              Tue
            </div>
            <div className="chart-bar" style={{ flex: 1, height: '70%', background: 'var(--navy-blue)', borderRadius: '5px 5px 0 0', display: 'flex', alignItems: 'end', justifyContent: 'center', color: 'white', fontWeight: 'bold', padding: '10px 0' }}>
              Wed
            </div>
            <div className="chart-bar" style={{ flex: 1, height: '90%', background: 'var(--navy-blue)', borderRadius: '5px 5px 0 0', display: 'flex', alignItems: 'end', justifyContent: 'center', color: 'white', fontWeight: 'bold', padding: '10px 0' }}>
              Thu
            </div>
            <div className="chart-bar highlight" style={{ flex: 1, height: '100%', background: 'var(--golden)', borderRadius: '5px 5px 0 0', display: 'flex', alignItems: 'end', justifyContent: 'center', color: 'white', fontWeight: 'bold', padding: '10px 0' }}>
              Fri
            </div>
          </div>
        </div>

        {/* Leave Request Status */}
        <div className="card">
          <h3 className="card-title">Leave Request Status</h3>
          <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'conic-gradient(var(--green) 0deg 262deg, var(--golden) 262deg 298deg, var(--dark-gray) 298deg 360deg)', margin: '0 auto' }}></div>
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '15px', height: '15px', borderRadius: '3px', background: 'var(--green)' }}></div>
              <span>Approved (73%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '15px', height: '15px', borderRadius: '3px', background: 'var(--golden)' }}></div>
              <span>Pending (15%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '15px', height: '15px', borderRadius: '3px', background: 'var(--dark-gray)' }}></div>
              <span>Rejected (10%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
        {/* Recent Attendance Logs */}
        <div className="card">
          <h3 className="card-title">Recent Attendance Logs</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Officer Name</th>
                  <th>Time</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div className="profile-img">{record.photo}</div>
                    </td>
                    <td>
                      {record.name}<br />
                      <small style={{ color: 'var(--dark-gray)' }}>{record.badge}</small>
                    </td>
                    <td>
                      {record.timeIn}<br />
                      {record.timeOut}
                    </td>
                    <td>
                      <MapPin size={16} style={{ marginRight: '5px' }} />
                      {record.location}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Leave Requests */}
        <div className="card">
          <h3 className="card-title">Pending Leave Requests</h3>
          <div>
            {pendingLeaveRequests.map((request) => (
              <div key={request.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'var(--light-gray)', borderRadius: '10px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div className="profile-img">{request.photo}</div>
                  <div>
                    <strong>{request.name}</strong><br />
                    <small style={{ color: 'var(--dark-gray)' }}>{request.dates}</small><br />
                    <small style={{ color: 'var(--dark-gray)' }}>{request.reason}</small>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className="btn btn-success" 
                    onClick={() => handleLeaveAction('approve', request.id, request.name)}
                  >
                    Approve
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleLeaveAction('reject', request.id, request.name)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notification */}
      <div className={`notification ${notification.type} ${notification.show ? 'show' : ''}`}>
        {notification.message}
      </div>
    </div>
  )
}

export default AdminDashboard