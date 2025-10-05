import React, { useState, useEffect } from 'react'
import { Users, Clock, CircleCheck as CheckCircle, CircleAlert as AlertCircle, ChartBar as BarChart3, MapPin, Calendar, Image, TriangleAlert as AlertTriangle } from 'lucide-react'
import { getDashboardStats, getAllAttendanceLogs, getAllLeaveRequests, updateLeaveRequestStatus } from '../../lib/database'
import { Notification, DashboardStats } from '../../types'

interface AdminDashboardProps {
  user: {
    id: string;
    full_name: string;
    badge_number: string;
    role: string;
  };
  onNavigate?: (section: string) => void;
}

interface AttendanceLogSummary {
  id: string;
  name: string;
  badge: string;
  department?: string;
  timeIn: string;
  timeOut: string;
  location: string;
  photo: string;
  photoUrl?: string;
  timestamp: string;
  punchType: string;
  complianceStatus?: string;
  minutesLate?: number;
  gracePeriodUsed?: boolean;
  isWithinGeofence?: boolean;
  latitude?: number;
  longitude?: number;
}

interface PendingLeaveRequest {
  id: string;
  name: string;
  badge: string;
  dates: string;
  reason: string;
  photo: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onNavigate }) => {
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

      // Load recent attendance logs - show ALL attendance logs
      const allAttendanceLogs = await getAllAttendanceLogs(50)
      const formattedAttendance = allAttendanceLogs.slice(0, 10).map(log => ({
        id: log.id,
        name: log.profiles.full_name,
        badge: log.profiles.badge_number,
        department: log.profiles.department,
        timeIn: log.punch_type === 'in' ? new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--',
        timeOut: log.punch_type === 'out' ? new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--',
        location: log.latitude && log.longitude ? `${log.latitude.toFixed(4)}, ${log.longitude.toFixed(4)}` : 'Unknown',
        photo: log.profiles.full_name.split(' ').map(n => n[0]).join(''),
        photoUrl: log.photo_url || log.profiles.profile_photo_url || undefined,
        timestamp: log.timestamp,
        punchType: log.punch_type,
        complianceStatus: (log as any).compliance_status,
        minutesLate: (log as any).minutes_late,
        gracePeriodUsed: (log as any).grace_period_used,
        isWithinGeofence: (log as any).is_within_geofence,
        latitude: log.latitude,
        longitude: log.longitude
      }))
      setRecentAttendance(formattedAttendance)

      // Load pending leave requests
      const leaveRequests = await getAllLeaveRequests()
      const pendingRequests = leaveRequests
        .filter(request => request.status === 'pending') // Changed from 'Pending' to 'pending'
        .slice(0, 5) // Limit to 5 for dashboard
        .map(request => ({
          id: request.id,
          name: request.profiles.full_name,
          badge: request.profiles.badge_number,
          dates: `${new Date(request.start_date).toLocaleDateString()} - ${new Date(request.end_date).toLocaleDateString()}`,
          reason: request.reason,
          photo: request.profiles.full_name.split(' ').map(n => n[0]).join('')
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

      {/* Daily Attendance Trends - Full Width */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h3 className="card-title">Daily Attendance Trends</h3>
        <div className="chart-container" style={{ height: '250px', display: 'flex', alignItems: 'end', gap: '15px', padding: '20px 0' }}>
          <div className="chart-bar" style={{ flex: 1, height: '80%', background: 'var(--navy-blue)', borderRadius: '5px 5px 0 0', display: 'flex', alignItems: 'end', justifyContent: 'center', color: 'white', fontWeight: 'bold', padding: '10px 0', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-25px', fontSize: '14px', color: 'var(--navy-blue)', fontWeight: 'bold' }}>80%</div>
            Mon
          </div>
          <div className="chart-bar" style={{ flex: 1, height: '60%', background: 'var(--navy-blue)', borderRadius: '5px 5px 0 0', display: 'flex', alignItems: 'end', justifyContent: 'center', color: 'white', fontWeight: 'bold', padding: '10px 0', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-25px', fontSize: '14px', color: 'var(--navy-blue)', fontWeight: 'bold' }}>60%</div>
            Tue
          </div>
          <div className="chart-bar" style={{ flex: 1, height: '70%', background: 'var(--navy-blue)', borderRadius: '5px 5px 0 0', display: 'flex', alignItems: 'end', justifyContent: 'center', color: 'white', fontWeight: 'bold', padding: '10px 0', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-25px', fontSize: '14px', color: 'var(--navy-blue)', fontWeight: 'bold' }}>70%</div>
            Wed
          </div>
          <div className="chart-bar" style={{ flex: 1, height: '90%', background: 'var(--navy-blue)', borderRadius: '5px 5px 0 0', display: 'flex', alignItems: 'end', justifyContent: 'center', color: 'white', fontWeight: 'bold', padding: '10px 0', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-25px', fontSize: '14px', color: 'var(--navy-blue)', fontWeight: 'bold' }}>90%</div>
            Thu
          </div>
          <div className="chart-bar highlight" style={{ flex: 1, height: '100%', background: 'var(--golden)', borderRadius: '5px 5px 0 0', display: 'flex', alignItems: 'end', justifyContent: 'center', color: 'white', fontWeight: 'bold', padding: '10px 0', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-25px', fontSize: '14px', color: 'var(--golden)', fontWeight: 'bold' }}>100%</div>
            Fri
          </div>
          <div className="chart-bar" style={{ flex: 1, height: '85%', background: 'var(--navy-blue)', borderRadius: '5px 5px 0 0', display: 'flex', alignItems: 'end', justifyContent: 'center', color: 'white', fontWeight: 'bold', padding: '10px 0', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-25px', fontSize: '14px', color: 'var(--navy-blue)', fontWeight: 'bold' }}>85%</div>
            Sat
          </div>
          <div className="chart-bar" style={{ flex: 1, height: '45%', background: 'var(--navy-blue)', borderRadius: '5px 5px 0 0', display: 'flex', alignItems: 'end', justifyContent: 'center', color: 'white', fontWeight: 'bold', padding: '10px 0', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-25px', fontSize: '14px', color: 'var(--navy-blue)', fontWeight: 'bold' }}>45%</div>
            Sun
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px', marginBottom: '30px' }}>
        {/* Recent Attendance Logs */}
        <div className="card">
          <h3 className="card-title">Recent Attendance Logs</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Officer Details</th>
                  <th>Punch Type</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.map((record) => (
                  <tr key={record.id}>
                    <td>
                      {record.photoUrl ? (
                        <img
                          src={record.photoUrl}
                          alt={record.name}
                          style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid var(--navy-blue)'
                          }}
                        />
                      ) : (
                        <div className="profile-img" style={{ width: '50px', height: '50px', fontSize: '18px' }}>
                          {record.photo}
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{record.name}</strong><br />
                      <small style={{ color: 'var(--dark-gray)' }}>
                        {record.badge}
                        {record.department && ` • ${record.department}`}
                      </small>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: record.punchType === 'in' ? '#e8f5e9' : '#fff3e0',
                        color: record.punchType === 'in' ? '#2e7d32' : '#e65100',
                        textTransform: 'uppercase'
                      }}>
                        {record.punchType === 'in' ? 'PUNCH IN' : 'PUNCH OUT'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <strong>{record.punchType === 'in' ? record.timeIn : record.timeOut}</strong>
                        <small style={{ color: 'var(--dark-gray)', fontSize: '11px' }}>
                          {new Date(record.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {record.complianceStatus && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor:
                              record.complianceStatus === 'on_time' ? '#e8f5e9' :
                              record.complianceStatus === 'late' ? '#fff3e0' :
                              record.complianceStatus === 'early_departure' ? '#ffe0b2' :
                              record.complianceStatus === 'overtime' ? '#e3f2fd' : '#f5f5f5',
                            color:
                              record.complianceStatus === 'on_time' ? '#2e7d32' :
                              record.complianceStatus === 'late' ? '#e65100' :
                              record.complianceStatus === 'early_departure' ? '#f57c00' :
                              record.complianceStatus === 'overtime' ? '#1976d2' : '#666',
                            textTransform: 'capitalize'
                          }}>
                            {record.complianceStatus.replace('_', ' ')}
                          </span>
                        )}
                        {record.minutesLate !== undefined && record.minutesLate > 0 && (
                          <small style={{ color: '#e65100', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <AlertTriangle size={10} />
                            {record.minutesLate} min late
                          </small>
                        )}
                        {record.gracePeriodUsed && (
                          <small style={{ color: '#f57c00', fontSize: '10px' }}>
                            Grace period used
                          </small>
                        )}
                        {record.isWithinGeofence !== undefined && (
                          <small style={{
                            color: record.isWithinGeofence ? '#2e7d32' : '#d32f2f',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            <MapPin size={10} />
                            {record.isWithinGeofence ? 'Inside fence' : 'Outside fence'}
                          </small>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <small style={{ fontSize: '11px', color: 'var(--dark-gray)' }}>
                          {record.location}
                        </small>
                        {record.latitude && record.longitude && (
                          <button
                            className="btn"
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              background: 'var(--golden)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onClick={() => {
                              if (onNavigate) {
                                // Store the user_id in sessionStorage so LiveLocationView can filter
                                sessionStorage.setItem('selectedUserId', record.id)
                                onNavigate('live-location')
                              }
                            }}
                          >
                            <MapPin size={12} />
                            View
                          </button>
                        )}
                      </div>
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
            {pendingLeaveRequests.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--dark-gray)' }}>
                <CheckCircle size={48} style={{ margin: '0 auto 15px', opacity: 0.3 }} />
                <p>No pending leave requests</p>
              </div>
            ) : (
              pendingLeaveRequests.map((request) => (
                <div key={request.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'var(--light-gray)', borderRadius: '10px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                    <div className="profile-img" style={{ width: '50px', height: '50px', fontSize: '18px' }}>{request.photo}</div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: 'var(--navy-blue)', fontSize: '15px' }}>{request.name}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--dark-gray)', marginTop: '3px' }}>
                        <Calendar size={12} style={{ display: 'inline', marginRight: '5px' }} />
                        {request.dates}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--dark-gray)', marginTop: '5px', fontStyle: 'italic' }}>
                        {request.reason.length > 50 ? request.reason.substring(0, 50) + '...' : request.reason}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      className="btn btn-success"
                      onClick={() => handleLeaveAction('approve', request.id, request.name)}
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleLeaveAction('reject', request.id, request.name)}
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
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