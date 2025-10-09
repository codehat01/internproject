import React, { useState, useEffect } from 'react'
import { Clock, Calendar, FileText, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle , Camera, MapPin, TriangleAlert as AlertTriangle,  RefreshCw } from 'lucide-react'
import { getUserAttendanceSummary, getUserLeaveRequests, punchInOut } from '../../lib/database'
import { StaffDashboardProps, Notification, AttendanceSummary } from '../../types'
import { cameraService } from '../../lib/cameraService'
import { geofenceService } from '../../lib/geofenceService'
// import { shiftValidationService, type Shift } from '../../lib/shiftValidation' // SHIFT MANAGEMENT DISABLED
import { locationService } from '../../lib/locationService'
import { punchStateService } from '../../lib/punchStateService'

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
  // const [currentShift, setCurrentShift] = useState<Shift | null>(null) // SHIFT MANAGEMENT DISABLED
  const [isWithinGeofence, setIsWithinGeofence] = useState<boolean>(false)
  const [lastPunchInTime, setLastPunchInTime] = useState<Date | null>(null)

  
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [location, setLocation] = useState<LocationCoords | null>(null)
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistoryRecord[]>([])
  
  const [cameraPermission, setCameraPermission] = useState<boolean>(false)
  const [locationPermission, setLocationPermission] = useState<boolean>(false)
  const [currentShift, setCurrentShift] = useState<Shift | null>(null)
  const [upcomingShift, setUpcomingShift] = useState<Shift | null>(null)
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState<number>(0)
  const [currentGeofenceStatus, setCurrentGeofenceStatus] = useState<string>('Outside Station')
  
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false)
  const [pendingPunchType, setPendingPunchType] = useState<'in' | 'out'>('in')

 
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      updateGracePeriod()
    }, 1000)

    checkPermissions()
    loadAttendanceHistory()

    const initializePunchState = async () => {
      await punchStateService.initialize(user.id)
      const state = punchStateService.getCurrentState()
      setIsPunchedIn(state.isPunchedIn)
      setLastPunchInTime(state.lastPunchTime)
    }
    initializePunchState()

    const unsubscribe = punchStateService.subscribe((state) => {
      setIsPunchedIn(state.isPunchedIn)
      setLastPunchInTime(state.lastPunchTime)
    })

    const initializeLocation = async () => {
      try {
        const currentLocation = await locationService.getCurrentPosition()
        setLocation({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        })
        await checkGeofence(currentLocation.latitude, currentLocation.longitude)
      } catch (error) {
        console.error('Error getting initial location:', error)
      }
    }

    initializeLocation()

    locationService.startTracking(user.id, async (loc) => {
      setLocation({
        latitude: loc.latitude,
        longitude: loc.longitude
      })
      await checkGeofence(loc.latitude, loc.longitude)
    })

    return () => {
      clearInterval(timer)
      locationService.stopTracking()
      unsubscribe()
    }
  }, [user.id])


  // const loadShiftData = async (): Promise<void> => {
  //   const shift = await shiftValidationService.getCurrentShift(user.id)
  //   setCurrentShift(shift)
  // } // SHIFT MANAGEMENT DISABLED

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
  const handleRefreshLocation = async () => {
  }

    const checkGeofence = async (latitude: number, longitude: number) => {
    const result = await geofenceService.validateLocation(latitude, longitude)
    setIsWithinGeofence(result.isValid)
    setCurrentGeofenceStatus(result.isValid ? 'Inside Station' : 'Outside Station')
    return result
  }
    const handleExportPDF = (): void => {
    try {
      pdfExportService.exportAttendanceReport(
        attendanceHistory,
        {
          full_name: user.full_name,
          badge_number: user.badge_number,
          rank: user.rank,
          department: user.department
        },
        'Personal Attendance Report'
      )
      showNotification('PDF exported successfully!', 'success')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      showNotification('Failed to export PDF', 'error')
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
      if (!location) {
        showNotification('Location access required for attendance!', 'error')
        const hasPermission = await requestLocationPermission()
        if (!hasPermission) return
      }

      const punchType = isPunchedIn ? 'out' : 'in'

      if (!cameraPermission) {
        const hasPermission = await cameraService.requestPermission()
        if (!hasPermission) {
          showNotification('Camera permission is required for attendance!', 'error')
          return
        }
        setCameraPermission(true)
      }

      showNotification('Please position your face in the camera...', 'info')

      const photoDataUrl = await cameraService.capturePhotoWithPreview()

      if (!location) {
        showNotification('Location not available. Please try again.', 'error')
        return
      }

      const geofenceResult = await geofenceService.validateLocation(
        location.latitude,
        location.longitude
      )
      setCurrentGeofenceStatus(geofenceResult.isValid ? 'Inside Station' : 'Outside Station')

      setCapturedPhoto(photoDataUrl)
      setPendingPunchType(punchType)
      setShowConfirmDialog(true)

    } catch (error: any) {
      console.error('Error in handlePunch:', error)
      if (error.message === 'User cancelled photo capture') {
        showNotification('Photo capture cancelled', 'info')
      } else {
        showNotification('Failed to capture photo. Please try again.', 'error')
      }
    }
  }

  const handleConfirmPunch = async (): Promise<void> => {
    try {
      if (!capturedPhoto || !location) {
        showNotification('Missing photo or location data.', 'error')
        return
      }

      const punchType = pendingPunchType

      const geofenceResult = await geofenceService.validateLocation(
        location.latitude,
        location.longitude
      )

      let enhancedData: any = {
        isWithinGeofence: geofenceResult.isValid,
        geofenceId: geofenceResult.geofence?.id || null,
      }

      if (punchType === 'in') {
        setLastPunchInTime(new Date())
      }

      await punchInOut(
        user.id,
        punchType,
        location.latitude,
        location.longitude,
        capturedPhoto,
        enhancedData
      )

      await locationService.updateLocationInDatabase(location, true)

      await punchStateService.updatePunchState(user.id, punchType)

      const action = punchType === 'in' ? 'Punched In' : 'Punched Out'
      showNotification(
        `${action} successfully at ${currentTime.toLocaleTimeString()}!`,
        'success'
      )

      setShowConfirmDialog(false)
      setCapturedPhoto(null)
      loadAttendanceHistory()
    } catch (error: any) {
      console.error('Error confirming punch:', error)
      showNotification('Failed to record attendance. Please try again.', 'error')
    }
  }

  const handleRetakePhoto = async (): Promise<void> => {
    try {
      showNotification('Please position your face in the camera...', 'info')
      const photoDataUrl = await cameraService.capturePhotoWithPreview()
      setCapturedPhoto(photoDataUrl)
      showNotification('Photo captured! Review and confirm.', 'success')
    } catch (error: any) {
      console.error('Error retaking photo:', error)
      if (error.message === 'User cancelled photo capture') {
        showNotification('Photo capture cancelled', 'info')
      } else {
        showNotification('Failed to capture photo. Please try again.', 'error')
      }
    }
  }

  const handleCancelPunch = (): void => {
    setShowConfirmDialog(false)
    setCapturedPhoto(null)
    showNotification('Punch cancelled', 'info')
  }

  const requestLocationPermission = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
            setLocationPermission(true)
            resolve(true)
          },
          (error) => {
            console.error('Error getting location:', error)
            showNotification('Please enable location services', 'error')
            resolve(false)
          }
        )
      } else {
        showNotification('Geolocation is not supported by your browser', 'error')
        resolve(false)
      }
    })
  }

  const checkPermissions = async () => {
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

      {/* Punch In/Out Section */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h3 className="card-title">Punch In / Punch Out</h3>

        {/* Current Time Display */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--navy-blue)' }}>
            {currentTime.toLocaleTimeString()}
          </div>
          <div style={{ color: 'var(--dark-gray)' }}>
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>

        {/* Punch Button */}
        <div 
          className="punch-button" 
          onClick={handlePunch}
          style={{
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: isPunchedIn 
              ? 'linear-gradient(135deg, var(--green), #2ecc71)' 
              : 'linear-gradient(135deg, var(--navy-blue), #0f2951)',
            border: `8px solid ${isPunchedIn ? 'var(--green)' : 'var(--golden)'}`,
            color: 'var(--white)',
            fontSize: '18px',
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
                <Camera size={24} style={{ marginBottom: '10px' }} />
                <div>Punched In</div>
                <div style={{ fontSize: '14px', marginTop: '5px' }}>
                  {lastPunchInTime ? lastPunchInTime.toLocaleTimeString() : currentTime.toLocaleTimeString()}
                </div>
                <div style={{ fontSize: '12px', marginTop: '3px', opacity: 0.8 }}>Click to Punch Out</div>
              </>
            ) : (
              <>
                <Camera size={24} style={{ marginBottom: '10px' }} />
                <div>Punch In</div>
                <div style={{ fontSize: '12px', marginTop: '3px', opacity: 0.8 }}>Click to Start</div>
              </>
            )}
          </div>
        </div>

        {/* Location and Geofence Status */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPin size={16} style={{ color: location ? 'var(--green)' : 'var(--red)' }} />
            <span style={{ color: location ? 'var(--green)' : 'var(--red)', fontSize: '14px' }}>
              {location ? 'Location detected' : 'Location not available'}
            </span>
          </div>
          {location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isWithinGeofence ? (
                <CheckCircle size={16} style={{ color: 'var(--green)' }} />
              ) : (
                <AlertTriangle size={16} style={{ color: 'var(--red)' }} />
              )}
              <span style={{ color: isWithinGeofence ? 'var(--green)' : 'var(--red)', fontSize: '14px' }}>
                {isWithinGeofence ? 'Inside geofence boundary' : 'Outside geofence boundary'}
              </span>
            </div>
          )}
          <button
            className="btn btn-secondary"
            onClick={handleRefreshLocation}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', padding: '8px 16px' }}
          >
            <RefreshCw size={16} />
            Refresh Location
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
          <button 
            className="btn btn-primary"
            onClick={() => showNotification('Opening detailed attendance view...', 'info')}
          >
            <Calendar size={16} style={{ marginRight: '5px' }} />
            View All Records
          </button>
          <button
            className="btn btn-golden"
            onClick={handleExportPDF}
            disabled={attendanceHistory.length === 0}
          >
            <FileText size={16} style={{ marginRight: '5px' }} />
            Export PDF
          </button>
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
      <PunchConfirmationDialog
        isOpen={showConfirmDialog}
        punchType={pendingPunchType}
        photoDataUrl={capturedPhoto || ''}
        location={location}
        geofenceStatus={currentGeofenceStatus}
        onConfirm={handleConfirmPunch}
        onCancel={handleCancelPunch}
        onRetakePhoto={handleRetakePhoto}
      />
    </div>
  )
}

export default StaffDashboard