import React, { useState } from 'react'
import { FileBarChart, Download, Calendar, Users, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import toast from 'react-hot-toast'

export function ExportData() {
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('No data to export')
      return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value || ''
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportAttendance = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          punch_type,
          timestamp,
          latitude,
          longitude,
          status,
          profiles (
            name,
            badge_number,
            station_id
          )
        `)
        .gte('timestamp', new Date(dateRange.start).toISOString())
        .lte('timestamp', new Date(dateRange.end + 'T23:59:59').toISOString())
        .order('timestamp', { ascending: false })

      if (error) throw error

      const formattedData = data.map(record => ({
        'Officer Name': record.profiles?.name || 'N/A',
        'Badge Number': record.profiles?.badge_number || 'N/A',
        'Station ID': record.profiles?.station_id || 'N/A',
        'Punch Type': record.punch_type.toUpperCase(),
        'Date': format(new Date(record.timestamp), 'yyyy-MM-dd'),
        'Time': format(new Date(record.timestamp), 'HH:mm:ss'),
        'Latitude': record.latitude || 'N/A',
        'Longitude': record.longitude || 'N/A',
        'Status': record.status
      }))

      const filename = `attendance_${dateRange.start}_to_${dateRange.end}.csv`
      downloadCSV(formattedData, filename)
      toast.success('Attendance data exported successfully!')
    } catch (error: any) {
      toast.error('Failed to export attendance data')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportLeaveRequests = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          id,
          start_date,
          end_date,
          reason,
          status,
          admin_reason,
          created_at,
          updated_at,
          profiles (
            name,
            badge_number,
            station_id
          )
        `)
        .gte('created_at', new Date(dateRange.start).toISOString())
        .lte('created_at', new Date(dateRange.end + 'T23:59:59').toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedData = data.map(record => ({
        'Officer Name': record.profiles?.name || 'N/A',
        'Badge Number': record.profiles?.badge_number || 'N/A',
        'Station ID': record.profiles?.station_id || 'N/A',
        'Start Date': record.start_date,
        'End Date': record.end_date,
        'Reason': record.reason,
        'Status': record.status.toUpperCase(),
        'Admin Reason': record.admin_reason || 'N/A',
        'Submitted Date': format(new Date(record.created_at), 'yyyy-MM-dd HH:mm:ss'),
        'Updated Date': format(new Date(record.updated_at), 'yyyy-MM-dd HH:mm:ss')
      }))

      const filename = `leave_requests_${dateRange.start}_to_${dateRange.end}.csv`
      downloadCSV(formattedData, filename)
      toast.success('Leave requests data exported successfully!')
    } catch (error: any) {
      toast.error('Failed to export leave requests data')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const setQuickRange = (type: 'thisMonth' | 'lastMonth' | 'thisYear') => {
    const now = new Date()
    switch (type) {
      case 'thisMonth':
        setDateRange({
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd')
        })
        break
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        setDateRange({
          start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          end: format(endOfMonth(lastMonth), 'yyyy-MM-dd')
        })
        break
      case 'thisYear':
        setDateRange({
          start: format(startOfYear(now), 'yyyy-MM-dd'),
          end: format(endOfYear(now), 'yyyy-MM-dd')
        })
        break
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <FileBarChart className="h-8 w-8 text-blue-600 mr-3" />
          Export Data
        </h1>
        <p className="text-gray-600">Download attendance and leave request reports</p>
      </div>

      {/* Date Range Selection */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Select Date Range</h2>
        
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Quick Range Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setQuickRange('thisMonth')}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
          >
            This Month
          </button>
          <button
            onClick={() => setQuickRange('lastMonth')}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
          >
            Last Month
          </button>
          <button
            onClick={() => setQuickRange('thisYear')}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
          >
            This Year
          </button>
        </div>

        <p className="text-sm text-gray-600">
          Selected range: {format(new Date(dateRange.start), 'MMM dd, yyyy')} - {format(new Date(dateRange.end), 'MMM dd, yyyy')}
        </p>
      </div>

      {/* Export Options */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Attendance Export */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Attendance Records</h3>
            <p className="text-gray-600">Export all punch in/out records with location data</p>
          </div>

          <div className="space-y-3 text-sm text-gray-600 mb-6">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Officer details (name, badge, station)
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Punch in/out times and dates
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              GPS coordinates for verification
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Status and record details
            </div>
          </div>

          <button
            onClick={exportAttendance}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Exporting...
              </div>
            ) : (
              <>
                <Download className="h-6 w-6 mr-2" />
                Export Attendance
              </>
            )}
          </button>
        </div>

        {/* Leave Requests Export */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Leave Requests</h3>
            <p className="text-gray-600">Export all leave applications and their status</p>
          </div>

          <div className="space-y-3 text-sm text-gray-600 mb-6">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
              Officer details and leave dates
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
              Leave reasons and justifications
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
              Approval status and admin notes
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
              Submission and processing dates
            </div>
          </div>

          <button
            onClick={exportLeaveRequests}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Exporting...
              </div>
            ) : (
              <>
                <Download className="h-6 w-6 mr-2" />
                Export Leave Requests
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <Users className="h-6 w-6 mr-2" />
          Export Instructions
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-blue-100">
          <div>
            <h4 className="font-medium text-white mb-2">File Format:</h4>
            <ul className="space-y-1 text-sm">
              <li>• CSV format for easy import into Excel</li>
              <li>• UTF-8 encoding for special characters</li>
              <li>• Headers included for easy identification</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">Data Privacy:</h4>
            <ul className="space-y-1 text-sm">
              <li>• All exports are logged for audit purposes</li>
              <li>• Handle exported data according to policy</li>
              <li>• Secure storage and transmission required</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}