import React, { useState, useEffect } from 'react'
import { Clock, Calendar, FileText, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle } from 'lucide-react'
import { getUserAttendanceSummary, getUserLeaveRequests, punchInOut } from '../../lib/database'
import { StaffDashboardProps, Notification, AttendanceSummary } from '../../types'
import { cameraService } from '../../lib/cameraService'
import { geofenceService } from '../../lib/geofenceService'
import { shiftValidationService, type Shift } from '../../lib/shiftValidation'
import { locationService } from '../../lib/locationService'

interface LeaveRequestSummary {
  id: string;
  dates: string;
  reason: string;
  status: string;
  statusColor: string;
}

interface ExtendedStaffDashboardProps extends StaffDashboardProps {
  onNavigate?: (section: string) => void;
}

const StaffDashboard: React.FC<ExtendedStaffDashboardProps> = ({ user, onNavigate }) => {
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
  const [currentShift, setCurrentShift] = useState<Shift | null>(null)
  const [isWithinGeofence, setIsWithinGeofence] = useState<boolean>(false)
  const [lastPunchInTime, setLastPunchInTime] = useState<Date | null>(null)

  useEffect(() => {
    loadStaffData()
    loadShiftData()

    locationService.startTracking(user.id, async (loc) => {
      const result = await geofenceService.validateLocation(loc.latitude, loc.longitude)
      setIsWithinGeofence(result.isValid)
    })

    return () => {
      locationService.stopTracking()
    }
  }, [user.id])

  const loadShiftData = async (): Promise<void> => {
    const shift = await shiftValidationService.getCurrentShift(user.id)
    setCurrentShift(shift)
  }

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
      const location = await locationService.getCurrentPosition()

      // GEOFENCE VALIDATION COMMENTED OUT - NOW ACCEPTS ANY LOCATION
      // if (!isWithinGeofence) {
      //   showNotification('You must be within the police station premises to punch in/out!', 'error')
      //   return
      // }

      const punchType = isPunchedIn ? 'out' : 'in'

      if (punchType === 'in' && !currentShift) {
        showNotification('No active shift assigned. Please contact your supervisor.', 'error')
        return
      }

      const hasPermission = await cameraService.requestPermission()
      if (!hasPermission) {
        showNotification('Camera permission is required for attendance!', 'error')
        return
      }

      showNotification('Please position your face in the camera...', 'info')
      const photoDataUrl = await cameraService.capturePhotoWithPreview()

      const geofenceResult = await geofenceService.validateLocation(
        location.latitude,
        location.longitude
      )

      let enhancedData: any = {
        isWithinGeofence: geofenceResult.isValid,
        geofenceId: geofenceResult.geofence?.id || null,
      }

      if (currentShift) {
        enhancedData.shiftId = currentShift.id

        if (punchType === 'in') {
          const validation = shiftValidationService.validatePunchIn(
            currentShift,
            new Date()
          )

          if (!validation.isValid) {
            showNotification(validation.message, 'error')
            return
          }

          enhancedData.complianceStatus = validation.complianceStatus
          enhancedData.gracePeriodUsed = validation.gracePeriodUsed
          enhancedData.minutesLate = validation.minutesLate
          setLastPunchInTime(new Date())

          showNotification(validation.message, 'info')
        } else if (punchType === 'out' && lastPunchInTime) {
          const validation = shiftValidationService.validatePunchOut(
            currentShift,
            new Date(),
            lastPunchInTime
          )

          enhancedData.complianceStatus = validation.complianceStatus
          enhancedData.minutesEarly = validation.minutesEarly
          enhancedData.overtimeMinutes = validation.overtimeMinutes

          showNotification(validation.message, 'info')
        }
      }

      await punchInOut(
        user.id,
        punchType,
        location.latitude,
        location.longitude,
        photoDataUrl,
        enhancedData
      )

      await locationService.updateLocationInDatabase(location, true)

      setIsPunchedIn(!isPunchedIn)
      const currentTime = new Date().toLocaleTimeString()
      setPunchTime(currentTime)

      const action = !isPunchedIn ? 'Punched In' : 'Punched Out'
      showNotification(
        `${action} successfully at ${currentTime}!`,
        'success'
      )

      loadStaffData()
      loadShiftData()
    } catch (error: any) {
      console.error('Error punching in/out:', error)
      if (error.message === 'User cancelled photo capture') {
        showNotification('Photo capture cancelled', 'info')
      } else {
        showNotification('Failed to record attendance. Please try again.', 'error')
      }
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
      <div className="quick-actions-grid">
        {/* Punch In/Out Card */}
        <div className="card punch-card">
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
        <div className="card quick-actions-card">
          <h3 className="card-title">Quick Actions</h3>
          <div className="quick-actions-buttons">
            <button
              className="btn btn-golden action-btn"
              onClick={() => onNavigate && onNavigate('leave-requests')}
            >
              <FileText size={20} />
              Submit Leave Request
            </button>
            <button
              className="btn btn-primary action-btn"
              onClick={() => onNavigate && onNavigate('attendance-history')}
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
        <div className="attendance-summary-grid">
          <div className="summary-item summary-present">
            <div className="summary-number">
              {attendanceSummary.presentDays}
            </div>
            <div className="summary-label">Present Days</div>
          </div>
          <div className="summary-item summary-absent">
            <div className="summary-number">
              {attendanceSummary.absentDays}
            </div>
            <div className="summary-label">Absent Days</div>
          </div>
          <div className="summary-item summary-late">
            <div className="summary-number">
              {attendanceSummary.lateDays}
            </div>
            <div className="summary-label">Late Days</div>
          </div>
          <div className="summary-item summary-rate">
            <div className="summary-number">
              {Math.round((attendanceSummary.presentDays / attendanceSummary.totalWorkingDays) * 100)}%
            </div>
            <div className="summary-label">Attendance Rate</div>
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