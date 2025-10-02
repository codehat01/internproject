import React, { useState, useEffect } from 'react'
import { Camera, MapPin, Clock, Calendar } from 'lucide-react'
import { getUserAttendance, punchInOut } from '../../lib/database'
import { AttendanceViewProps, Notification, LocationCoords } from '../../types'
import { cameraService } from '../../lib/cameraService'
import { locationService } from '../../lib/locationService'

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    checkPermissions()
    loadAttendanceHistory()

    locationService.startTracking(user.id, (loc) => {
      setLocation({
        latitude: loc.latitude,
        longitude: loc.longitude
      })
    })

    return () => {
      clearInterval(timer)
      locationService.stopTracking()
    }
  }, [user.id])

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
          groupedAttendance[date] = { date, timeIn: null, timeOut: null, location: null }
        }
        
        if (record.punch_type === 'in') {
          groupedAttendance[date].timeIn = new Date(record.timestamp).toLocaleTimeString()
          groupedAttendance[date].location = record.latitude && record.longitude ? 'HQ Building' : 'Unknown'
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
          
          // Check if late (after 9:00 AM)
          const nineAM = new Date(`${day.date} 09:00:00`)
          status = timeInDate > nineAM ? 'Late' : 'Present'
        } else if (day.timeIn) {
          status = 'Present'
        }

        return {
          date: new Date(day.date).toLocaleDateString(),
          timeIn: day.timeIn || '--',
          timeOut: day.timeOut || '--',
          hours,
          status,
          location: day.location || '--'
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

      const punchType = isPunchedIn ? 'out' : 'in'

      await punchInOut(user.id, punchType, location.latitude, location.longitude, photoDataUrl)

      await locationService.updateLocationInDatabase(location, true)

      setIsPunchedIn(!isPunchedIn)
      const action = !isPunchedIn ? 'Punched In' : 'Punched Out'
      showNotification(`${action} successfully at ${currentTime.toLocaleTimeString()}!`, 'success')

      loadAttendanceHistory()
    } catch (error: any) {
      console.error('Error punching in/out:', error)
      if (error.message === 'User cancelled photo capture') {
        showNotification('Photo capture cancelled', 'info')
      } else {
        showNotification('Failed to record attendance. Please try again.', 'error')
      }
    }
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
                <div>Punch Out</div>
                <div style={{ fontSize: '14px', marginTop: '5px' }}>
                  In since: {currentTime.toLocaleTimeString()}
                </div>
              </>
            ) : (
              <>
                <Camera size={24} style={{ marginBottom: '10px' }} />
                <div>Punch In</div>
              </>
            )}
          </div>
        </div>

        {/* Location Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
          <MapPin size={16} style={{ color: location ? 'var(--green)' : 'var(--red)' }} />
          <span style={{ color: location ? 'var(--green)' : 'var(--red)', fontSize: '14px' }}>
            {location ? 'Location detected - Inside geofence' : 'Location not available'}
          </span>
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
            onClick={() => showNotification('Generating attendance report...', 'info')}
          >
            <Clock size={16} style={{ marginRight: '5px' }} />
            Generate Report
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
          <li>You must be inside the police station premises to punch in/out</li>
          <li>Photo verification is required for each punch</li>
          <li>Ensure your location services are enabled</li>
          <li>Punch in before 9:00 AM to avoid late marking</li>
          <li>Don't forget to punch out when leaving</li>
        </ul>
      </div>

      {/* Notification */}
      <div className={`notification ${notification.type} ${notification.show ? 'show' : ''}`}>
        {notification.message}
      </div>
    </div>
  )
}

export default AttendanceView