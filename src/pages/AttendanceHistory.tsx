import React, { useState, useEffect } from 'react'
import { Clock, MapPin, Camera, Calendar } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase, Attendance } from '../lib/supabase'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import toast from 'react-hot-toast'

export function AttendanceHistory() {
  const { profile } = useAuth()
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAttendance()
  }, [profile])

  const fetchAttendance = async () => {
    if (!profile) return

    try {
      const weekStart = startOfWeek(new Date())
      const weekEnd = endOfWeek(new Date())

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', profile.id)
        .gte('timestamp', weekStart.toISOString())
        .lte('timestamp', weekEnd.toISOString())
        .order('timestamp', { ascending: false })

      if (error) throw error
      setAttendance(data || [])
    } catch (error: any) {
      toast.error('Failed to fetch attendance history')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const openLocationMap = (lat: number, lon: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lon}&z=15`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Calendar className="h-8 w-8 text-blue-600 mr-3" />
          Attendance History
        </h1>
        <p className="text-gray-600">Your attendance records for the current week</p>
      </div>

      {/* Attendance Records */}
      {attendance.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Attendance Records</h3>
          <p className="text-gray-600">You haven't recorded any attendance this week yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {attendance.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200"
            >
              <div className="flex items-center space-x-6">
                {/* Punch Type Badge */}
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    record.punch_type === 'in'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  <Clock className="h-8 w-8" />
                </div>

                {/* Main Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      Punched {record.punch_type.toUpperCase()}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        record.punch_type === 'in'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {record.punch_type === 'in' ? 'Start Duty' : 'End Duty'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {format(new Date(record.timestamp), 'PPp')}
                    </div>

                    {record.latitude && record.longitude && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <button
                          onClick={() => openLocationMap(record.latitude!, record.longitude!)}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          View Location
                        </button>
                      </div>
                    )}

                    {record.photo_url && (
                      <div className="flex items-center">
                        <Camera className="h-4 w-4 mr-2" />
                        <button
                          onClick={() => window.open(record.photo_url, '_blank')}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          View Photo
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Photo Thumbnail */}
                {record.photo_url && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={record.photo_url}
                      alt="Attendance photo"
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                      onClick={() => window.open(record.photo_url, '_blank')}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Card */}
      {attendance.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-4">Week Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {attendance.filter(a => a.punch_type === 'in').length}
              </div>
              <div className="text-blue-200">Punch Ins</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {attendance.filter(a => a.punch_type === 'out').length}
              </div>
              <div className="text-blue-200">Punch Outs</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}