import React, { useState, useEffect } from 'react'
import { Clock, MapPin, Camera, Search, Filter, Users } from 'lucide-react'
import { supabase, Attendance } from '../../lib/supabase'
import { format, startOfDay, endOfDay } from 'date-fns'
import toast from 'react-hot-toast'

export function AttendanceLogs() {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all')

  useEffect(() => {
    fetchAttendance()
  }, [selectedDate, filterType])

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const startDate = startOfDay(new Date(selectedDate))
      const endDate = endOfDay(new Date(selectedDate))

      let query = supabase
        .from('attendance')
        .select(`
          *,
          profiles (
            name,
            badge_number,
            station_id
          )
        `)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp', { ascending: false })

      if (filterType !== 'all') {
        query = query.eq('punch_type', filterType)
      }

      const { data, error } = await query

      if (error) throw error
      setAttendance(data || [])
    } catch (error: any) {
      toast.error('Failed to fetch attendance logs')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAttendance = attendance.filter(record =>
    record.profiles?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.profiles?.badge_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openLocationMap = (lat: number, lon: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lon}&z=15`
    window.open(url, '_blank')
  }

  const stats = {
    total: filteredAttendance.length,
    punchIns: filteredAttendance.filter(a => a.punch_type === 'in').length,
    punchOuts: filteredAttendance.filter(a => a.punch_type === 'out').length,
    uniqueOfficers: new Set(filteredAttendance.map(a => a.user_id)).size
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Clock className="h-8 w-8 text-blue-600 mr-3" />
          Attendance Logs
        </h1>
        <p className="text-gray-600">Monitor and review staff attendance records</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Records</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <Clock className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Punch Ins</p>
              <p className="text-3xl font-bold">{stats.punchIns}</p>
            </div>
            <div className="h-12 w-12 bg-green-400 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">→</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Punch Outs</p>
              <p className="text-3xl font-bold">{stats.punchOuts}</p>
            </div>
            <div className="h-12 w-12 bg-red-400 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">←</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Active Officers</p>
              <p className="text-3xl font-bold">{stats.uniqueOfficers}</p>
            </div>
            <Users className="h-12 w-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Officer
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Name or badge number..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Punch Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'in' | 'out')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="in">Punch In</option>
              <option value="out">Punch Out</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchAttendance}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
            >
              <Filter className="h-5 w-5 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Records Found</h3>
            <p className="text-gray-600">No attendance records match your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Officer</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Time</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Location</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Photo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAttendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {record.profiles?.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          Badge: {record.profiles?.badge_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          Station: {record.profiles?.station_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          record.punch_type === 'in'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {record.punch_type === 'in' ? '→ IN' : '← OUT'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {format(new Date(record.timestamp), 'hh:mm a')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(record.timestamp), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {record.latitude && record.longitude ? (
                        <button
                          onClick={() => openLocationMap(record.latitude!, record.longitude!)}
                          className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          View Map
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">No location</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {record.photo_url ? (
                        <div className="flex items-center space-x-2">
                          <img
                            src={record.photo_url}
                            alt="Attendance photo"
                            className="w-10 h-10 rounded-full object-cover cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => window.open(record.photo_url, '_blank')}
                          />
                          <button
                            onClick={() => window.open(record.photo_url, '_blank')}
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                          >
                            <Camera className="h-4 w-4 mr-1" />
                            View
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No photo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}