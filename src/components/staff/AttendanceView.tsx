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
  const [currentGeofenceStatus, setCurrentGeofenceStatus] = useState<string>('Outside Station')
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
    setCurrentGeofenceStatus(result.isValid ? 'Inside Station' : 'Outside Station')
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
        showNotification('Location updated: Inside station boundary', 'success')
      } else {
        showNotification('Location updated: Outside station boundary', 'error')
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
          groupedAttendance[date].geofenceStatus = record.is_within_geofence ? 'Inside Station' : 'Outside Station'
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