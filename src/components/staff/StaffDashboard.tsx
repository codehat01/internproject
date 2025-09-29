import React, { useState, useEffect } from 'react'
import { 
  Clock, 
  Calendar, 
  FileText, 
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { getUserAttendanceSummary, getUserLeaveRequests, punchInOut } from '../../lib/database'
import { StaffDashboardProps, Notification, AttendanceSummary } from '../../types'

interface LeaveRequestSummary {
  id: string;
  dates: string;
  reason: string;
  status: string;
  statusColor: string;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ user }) => {
  const [isPunchedIn, setIsPunchedIn] = useState<boolean>(false)
  const [punchTime, setPunchTime] = useState<string>('')
  const [notification, setNotification] = useState<Notification>({ message: '', type: 'info', show: false })
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary>({
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    totalWorkingDays: 22
  })
  const [recentLeaveRequests, setRecentLeaveRequests] = useState<LeaveRequestSummary[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    loadStaffData()
  }, [user.id])

  const loadStaffData = async (): Promise<void> => {
    try {
      setLoading(true)
      
      // Load attendance summary
      const summary = await getUserAttendanceSummary(user.id)
      setAttendanceSummary(summary)

      // Load recent leave requests
      const leaveRequests = await getUserLeaveRequests(user.id)
      const formattedRequests = leaveRequests.slice(0, 3).map(request => ({
        id: request.id,
        dates: `${new Date(request.start_date).toLocaleDateString()} - ${new Date(request.end_date).toLocaleDateString()}`,
        reason: request.reason,
        status: request.status.charAt(0).toUpperCase() + request.status.slice(1),
        statusColor: request.status === 'approved' ? 'var(--green)' : 
                    request.status === 'rejected' ? 'var(--red)' : 'var(--golden)'
      }))
      setRecentLeaveRequests(formattedRequests)

    } catch (error) {
      console.error('Error loading staff data:', error)
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

  const handlePunch = async (): Promise<void> => {
    try {
      // Get current location
      if (!navigator.geolocation) {
        showNotification('Geolocation is not supported by this browser', 'error')
        return
      }

      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const punchType = isPunchedIn ? 'out' : 'in'
          
          // Record punch in database
          await punchInOut(user.id, punchType, latitude, longitude)
          
          const currentTime = new Date().toLocaleTimeString()
          setIsPunchedIn(!isPunchedIn)
          setPunchTime(currentTime)
          
          if (!isPunchedIn) {
            showNotification('Punched In successfully!', 'success')
          } else {
            showNotification('Punched Out successfully!', 'info')
          }

          // Reload data to reflect changes
          loadStaffData()
        } catch (error) {
          console.error('Error recording punch:', error)
          showNotification('Error recording attendance', 'error')
        }
      }, (error) => {
        console.error('Geolocation error:', error)
        showNotification('Location access required for attendance', 'error')
      })
    } catch (error) {
      console.error('Error in handlePunch:', error)
      showNotification('Error recording attendance', 'error')
    }
  }

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
        Staff Dashboard
      </h2>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', marginBottom: '30px' }}>
        {/* Punch In/Out Card */}
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 className="card-title">Attendance</h3>
          <div 
            className="punch-button" 
            onClick={handlePunch}
            style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: isPunchedIn 
                ? 'linear-gradient(135deg, var(--green), #2ecc71)' 
                : 'linear-gradient(135deg, var(--navy-blue), #0f2951)',
              border: `6px solid ${isPunchedIn ? 'var(--green)' : 'var(--golden)'}`,
              color: 'var(--white)',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              margin: '20px auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}
          >
            <div>
              {isPunchedIn ? (
                <>
                  <div>Punched In</div>
                  <div style={{ fontSize: '14px', marginTop: '5px' }}>{punchTime}</div>
                </>
              ) : (
                <div>Punch In /<br />Punch Out</div>
              )}
            </div>
          </div>
          <p style={{ color: 'var(--dark-gray)', fontSize: '14px' }}>
            Click to punch in/out. Location and photo verification required.
          </p>
        </div>

        {/* Quick Leave Request */}
        <div className="card">
          <h3 className="card-title">Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button 
              className="btn btn-golden" 
              style={{ padding: '15px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              onClick={() => showNotification('Redirecting to leave request form...', 'info')}
            >
              <FileText size={20} />
              Submit Leave Request
            </button>
            <button 
              className="btn btn-primary" 
              style={{ padding: '15px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              onClick={() => showNotification('Opening attendance history...', 'info')}
            >
              <Calendar size={20} />
              View Attendance History
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h3 className="card-title">This Month's Attendance Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center', padding: '20px', background: 'var(--light-gray)', borderRadius: '10px' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--green)', marginBottom: '10px' }}>
              {attendanceSummary.presentDays}
            </div>
            <div style={{ color: 'var(--dark-gray)', fontWeight: '600' }}>Present Days</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', background: 'var(--light-gray)', borderRadius: '10px' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--red)', marginBottom: '10px' }}>
              {attendanceSummary.absentDays}
            </div>
            <div style={{ color: 'var(--dark-gray)', fontWeight: '600' }}>Absent Days</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', background: 'var(--light-gray)', borderRadius: '10px' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--golden)', marginBottom: '10px' }}>
              {attendanceSummary.lateDays}
            </div>
            <div style={{ color: 'var(--dark-gray)', fontWeight: '600' }}>Late Days</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', background: 'var(--light-gray)', borderRadius: '10px' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--navy-blue)', marginBottom: '10px' }}>
              {Math.round((attendanceSummary.presentDays / attendanceSummary.totalWorkingDays) * 100)}%
            </div>
            <div style={{ color: 'var(--dark-gray)', fontWeight: '600' }}>Attendance Rate</div>
          </div>
        </div>
      </div>

      {/* Recent Leave Requests */}
      <div className="card">
        <h3 className="card-title">Recent Leave Requests</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Dates</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentLeaveRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.dates}</td>
                  <td>{request.reason}</td>
                  <td>
                    <span 
                      className="status-badge" 
                      style={{ 
                        background: `${request.statusColor}20`, 
                        color: request.statusColor,
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {request.status === 'pending' && <Clock size={12} style={{ marginRight: '5px' }} />}
                      {request.status === 'approved' && <CheckCircle size={12} style={{ marginRight: '5px' }} />}
                      {request.status === 'rejected' && <XCircle size={12} style={{ marginRight: '5px' }} />}
                      {request.status}
                    </span>
                  </td>
                  <td>
                    {request.status === 'pending' ? (
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                        onClick={() => showNotification('Leave request cancelled', 'info')}
                      >
                        Cancel
                      </button>
                    ) : (
                      <span style={{ color: 'var(--dark-gray)', fontSize: '12px' }}>
                        {request.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Summary */}
      <div className="card">
        <h3 className="card-title">Profile Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--navy-blue)', marginBottom: '5px', display: 'block' }}>
              Badge Number
            </label>
            <p style={{ color: 'var(--dark-gray)' }}>{user.badge_number}</p>
          </div>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--navy-blue)', marginBottom: '5px', display: 'block' }}>
              Full Name
            </label>
            <p style={{ color: 'var(--dark-gray)' }}>{user.full_name}</p>
          </div>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--navy-blue)', marginBottom: '5px', display: 'block' }}>
              Rank
            </label>
            <p style={{ color: 'var(--dark-gray)' }}>{user.rank || 'Officer'}</p>
          </div>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--navy-blue)', marginBottom: '5px', display: 'block' }}>
              Role
            </label>
            <p style={{ color: 'var(--dark-gray)', textTransform: 'capitalize' }}>{user.role}</p>
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

export default StaffDashboard