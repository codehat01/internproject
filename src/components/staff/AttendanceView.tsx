import React, { useState, useEffect } from 'react'
import { Camera, MapPin, Clock, Calendar, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, RefreshCw, FileText } from 'lucide-react'
import { getUserAttendance, punchInOut } from '../../lib/database'
import { AttendanceViewProps, Notification, LocationCoords } from '../../types'
import { cameraService } from '../../lib/cameraService'
import { locationService } from '../../lib/locationService'
import { shiftValidationService, type Shift } from '../../lib/shiftValidation'
import { supabase } from '../../lib/supabase'
import { geofenceService } from '../../lib/geofenceService'
import PunchConfirmationDialog from '../shared/PunchConfirmationDialog'
import { punchStateService } from '../../lib/punchStateService'
import { pdfExportService } from '../../lib/pdfExportService'

interface AttendanceHistoryRecord {
  date: string;
  timeIn: string;
  timeOut: string;
  hours: string;
  status: string;
  location: string;
}

const AttendanceView: React.FC<AttendanceViewProps> = ({ user }) => {
  const [isPunchedIn, setIsPunchedIn] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [location, setLocation] = useState<LocationCoords | null>(null)
  const [notification, setNotification] = useState<Notification>({ message: '', type: 'info', show: false })
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistoryRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [cameraPermission, setCameraPermission] = useState<boolean>(false)
  const [locationPermission, setLocationPermission] = useState<boolean>(false)
  const [currentShift, setCurrentShift] = useState<Shift | null>(null)
  const [upcomingShift, setUpcomingShift] = useState<Shift | null>(null)
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState<number>(0)
  const [currentGeofenceStatus, setCurrentGeofenceStatus] = useState<string>('Outside station')
  const [isWithinGeofence, setIsWithinGeofence] = useState<boolean>(false)
  const [lastPunchInTime, setLastPunchInTime] = useState<Date | null>(null)
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


  const updateGracePeriod = () => {
    if (currentShift && !isPunchedIn) {
      const shiftStart = new Date(currentShift.shift_start)
      const gracePeriodInfo = shiftValidationService.calculateGracePeriodInfo(
        shiftStart,
        new Date()
      )
      setGracePeriodMinutes(gracePeriodInfo.minutesRemaining)
    }
  }

  const checkGeofence = async (latitude: number, longitude: number) => {
    const result = await geofenceService.validateLocation(latitude, longitude)
    setIsWithinGeofence(result.isValid)
    setCurrentGeofenceStatus(result.isValid ? 'Inside station' : 'Outside station')
    return result
  }

  const handleRefreshLocation = async () => {
    try {
      showNotification('Refreshing location...', 'info')
      const currentLocation = await locationService.getCurrentPosition()
      setLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      })
      const result = await checkGeofence(currentLocation.latitude, currentLocation.longitude)
      await locationService.updateLocationInDatabase(currentLocation, true)

      if (result.isValid) {
        showNotification('Location updated: Inside geofence boundary', 'success')
      } else {
        showNotification('Location updated: Outside geofence boundary', 'error')
      }
    } catch (error) {
      console.error('Error refreshing location:', error)
      showNotification('Failed to refresh location. Please try again.', 'error')
    }
  }

  const checkPermissions = async () => {
    try {
      const camPermission = await cameraService.checkPermission()
      setCameraPermission(camPermission)

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
            setLocationPermission(true)
          },
          (error) => {
            console.error('Error getting location:', error)
            setLocationPermission(false)
          }
        )
      }
    } catch (error) {
      console.error('Error checking permissions:', error)
    }
  }

  const loadAttendanceHistory = async (): Promise<void> => {
    try {
      setLoading(true)
      const attendance = await getUserAttendance(user.id, 20)
      
      // Group attendance by date and format
      const groupedAttendance = {}
      attendance.forEach(record => {
        const date = new Date(record.timestamp).toDateString()
        if (!groupedAttendance[date]) {
          groupedAttendance[date] = { date, timeIn: null, timeOut: null, location: null, geofenceStatus: null }
        }

        if (record.punch_type === 'in') {
          groupedAttendance[date].timeIn = new Date(record.timestamp).toLocaleTimeString()
          groupedAttendance[date].geofenceStatus = record.is_within_geofence ? 'Inside station' : 'Outside station'
          groupedAttendance[date].location = record.latitude && record.longitude ? 'Recorded' : 'Unknown'
        } else if (record.punch_type === 'out') {
          groupedAttendance[date].timeOut = new Date(record.timestamp).toLocaleTimeString()
        }
      })

      // Convert to array and calculate hours and status
      const formattedHistory = Object.values(groupedAttendance).map(day => {
        let hours = '0'
        let status = 'Absent'

        if (day.timeIn && day.timeOut) {
          const timeInDate = new Date(`${day.date} ${day.timeIn}`)
          const timeOutDate = new Date(`${day.date} ${day.timeOut}`)
          const diffHours = (timeOutDate - timeInDate) / (1000 * 60 * 60)
          hours = diffHours.toFixed(2)
          status = 'Present'
        } else if (day.timeIn) {
          status = 'Present'
        }

        return {
          date: new Date(day.date).toLocaleDateString(),
          timeIn: day.timeIn || '--',
          timeOut: day.timeOut || '--',
          hours,
          status,
          location: day.geofenceStatus || '--'
        }
      }).sort((a, b) => new Date(b.date) - new Date(a.date))

      setAttendanceHistory(formattedHistory)
    } catch (error) {
      console.error('Error loading attendance history:', error)
      showNotification('Error loading attendance history', 'error')
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
      setCurrentGeofenceStatus(geofenceResult.isValid ? 'Inside station' : 'Outside station')

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


  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'Present':
        return 'status-present'
      case 'Late':
        return 'status-late'
      case 'Absent':
        return 'status-absent'
      default:
        return ''
    }
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

  return (
    <div>
      <h2 style={{ color: 'var(--navy-blue)', marginBottom: '30px', fontSize: '28px', fontWeight: '700' }}>
        Attendance
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

      {/* Attendance History */}
      <div className="card">
        <h3 className="card-title">Recent Attendance History</h3>
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
              {attendanceHistory.map((record, index) => (
                <tr key={index}>
                  <td>{new Date(record.date).toLocaleDateString()}</td>
                  <td>{record.timeIn}</td>
                  <td>{record.timeOut}</td>
                  <td>{record.hours}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td>
                    {record.location !== '--' && (
                      <MapPin size={14} style={{ marginRight: '5px' }} />
                    )}
                    {record.location}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div className="card" style={{ background: '#e3f2fd', border: '1px solid var(--navy-blue)' }}>
        <h3 className="card-title" style={{ color: 'var(--navy-blue)' }}>
          Attendance Instructions
        </h3>
        <ul style={{ color: 'var(--dark-gray)', lineHeight: '1.6' }}>
          <li>Photo verification is required for each punch</li>
          <li>Ensure your location services are enabled for accurate tracking</li>
          <li>Punch in at least once per day to be marked as Present</li>
          <li>If you do not punch in on a day, you will be marked as Absent</li>
          <li>Review your photo and location before confirming</li>
          <li>You can retake your photo if needed</li>
          <li>Location status (Inside/Outside station) will be recorded with each punch</li>
          <li>Toggle between Punch In and Punch Out throughout your work day</li>
        </ul>
      </div>

      {/* Notification */}
      <div className={`notification ${notification.type} ${notification.show ? 'show' : ''}`}>
        {notification.message}
      </div>

      {/* Confirmation Dialog */}
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

export default AttendanceView