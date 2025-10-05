import React, { useState, useEffect } from 'react'
import { useAllAttendance } from '../../hooks/useAllAttendance'
import { useLeaveRequests } from '../../hooks/useLeaveRequests'
import { Download, FileText, Calendar, ListFilter as Filter, Camera, MapPin } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import AttendancePhotoView from './AttendancePhotoView'

interface ReportFilters {
  startDate: string
  endDate: string
  department: string
  status: string
  reportType: 'attendance' | 'leave' | 'combined'
}

const EnhancedReportsView: React.FC<{ userRole: string }> = ({ userRole }) => {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    department: '',
    status: 'all',
    reportType: 'combined'
  })
  const [departments, setDepartments] = useState<string[]>([])
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<string | null>(null)

  const { attendance, loading: attendanceLoading } = useAllAttendance({ pageSize: 1000 })
  const { leaveRequests, loading: leaveLoading } = useLeaveRequests({ isAdmin: true })

  useEffect(() => {
    const uniqueDepts = Array.from(
      new Set(
        attendance
          .map(a => a.profiles?.department)
          .filter(Boolean)
      )
    ) as string[]
    setDepartments(uniqueDepts)
  }, [attendance])

  const filterAttendanceData = () => {
    let filtered = [...attendance]

    if (filters.startDate) {
      filtered = filtered.filter(
        record => new Date(record.timestamp) >= new Date(filters.startDate)
      )
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(
        record => new Date(record.timestamp) <= endDate
      )
    }

    if (filters.department) {
      filtered = filtered.filter(
        record => record.profiles?.department === filters.department
      )
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(record => record.status === filters.status)
    }

    return filtered
  }

  const filterLeaveData = () => {
    let filtered = [...leaveRequests]

    if (filters.startDate) {
      filtered = filtered.filter(
        record => new Date(record.start_date) >= new Date(filters.startDate)
      )
    }

    if (filters.endDate) {
      filtered = filtered.filter(
        record => new Date(record.end_date) <= new Date(filters.endDate)
      )
    }

    if (filters.department) {
      filtered = filtered.filter(
        record => record.profiles?.department === filters.department
      )
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(record => record.status === filters.status)
    }

    return filtered
  }

  const exportAsCSV = () => {
    const filteredAttendance = filterAttendanceData()
    const filteredLeave = filterLeaveData()

    let csvContent = ''

    if (filters.reportType === 'attendance' || filters.reportType === 'combined') {
      csvContent += 'ATTENDANCE REPORT\n'
      csvContent += 'Officer Name,Badge Number,Department,Punch Type,Date,Time,Status\n'

      filteredAttendance.forEach(record => {
        const row = [
          record.profiles?.full_name || 'Unknown',
          record.profiles?.badge_number || '--',
          record.profiles?.department || '--',
          record.punch_type.toUpperCase(),
          new Date(record.timestamp).toLocaleDateString(),
          new Date(record.timestamp).toLocaleTimeString(),
          record.status
        ]
        csvContent += row.join(',') + '\n'
      })

      csvContent += '\n'
    }

    if (filters.reportType === 'leave' || filters.reportType === 'combined') {
      csvContent += 'LEAVE REQUESTS REPORT\n'
      csvContent += 'Officer Name,Badge Number,Department,Start Date,End Date,Reason,Status\n'

      filteredLeave.forEach(record => {
        const row = [
          record.profiles?.full_name || 'Unknown',
          record.profiles?.badge_number || '--',
          record.profiles?.department || '--',
          new Date(record.start_date).toLocaleDateString(),
          new Date(record.end_date).toLocaleDateString(),
          `"${record.reason.replace(/"/g, '""')}"`,
          record.status
        ]
        csvContent += row.join(',') + '\n'
      })
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `police_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportAsPDF = () => {
    const doc = new jsPDF()
    const filteredAttendance = filterAttendanceData()
    const filteredLeave = filterLeaveData()

    doc.setFontSize(18)
    doc.text('Police Attendance System', 14, 20)
    doc.setFontSize(12)
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 14, 28)

    if (filters.startDate || filters.endDate) {
      let dateRange = 'Date Range: '
      if (filters.startDate) dateRange += `From ${new Date(filters.startDate).toLocaleDateString()} `
      if (filters.endDate) dateRange += `To ${new Date(filters.endDate).toLocaleDateString()}`
      doc.setFontSize(10)
      doc.text(dateRange, 14, 35)
    }

    let yPosition = filters.startDate || filters.endDate ? 45 : 38

    if (filters.reportType === 'attendance' || filters.reportType === 'combined') {
      doc.setFontSize(14)
      doc.text('Attendance Report', 14, yPosition)
      yPosition += 5

      const attendanceData = filteredAttendance.map(record => [
        record.profiles?.full_name || 'Unknown',
        record.profiles?.badge_number || '--',
        record.profiles?.department || '--',
        record.punch_type.toUpperCase(),
        new Date(record.timestamp).toLocaleDateString(),
        new Date(record.timestamp).toLocaleTimeString(),
        record.status
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [['Officer', 'Badge', 'Department', 'Type', 'Date', 'Time', 'Status']],
        body: attendanceData,
        theme: 'grid',
        headStyles: { fillColor: [10, 31, 68] },
        styles: { fontSize: 8 },
        margin: { top: 10 }
      })

      yPosition = (doc as any).lastAutoTable.finalY + 10
    }

    if (filters.reportType === 'leave' || filters.reportType === 'combined') {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(14)
      doc.text('Leave Requests Report', 14, yPosition)
      yPosition += 5

      const leaveData = filteredLeave.map(record => [
        record.profiles?.full_name || 'Unknown',
        record.profiles?.badge_number || '--',
        record.profiles?.department || '--',
        new Date(record.start_date).toLocaleDateString(),
        new Date(record.end_date).toLocaleDateString(),
        record.reason.substring(0, 50) + (record.reason.length > 50 ? '...' : ''),
        record.status
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [['Officer', 'Badge', 'Department', 'Start Date', 'End Date', 'Reason', 'Status']],
        body: leaveData,
        theme: 'grid',
        headStyles: { fillColor: [10, 31, 68] },
        styles: { fontSize: 8 },
        margin: { top: 10 }
      })
    }

    doc.save(`police_report_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const filteredAttendance = filterAttendanceData()
  const filteredLeave = filterLeaveData()

  const stats = {
    totalAttendance: filteredAttendance.length,
    checkIns: filteredAttendance.filter(r => r.punch_type === 'in').length,
    checkOuts: filteredAttendance.filter(r => r.punch_type === 'out').length,
    totalLeave: filteredLeave.length,
    approvedLeave: filteredLeave.filter(r => r.status === 'approved').length,
    pendingLeave: filteredLeave.filter(r => r.status === 'pending').length,
    rejectedLeave: filteredLeave.filter(r => r.status === 'rejected').length
  }

  const loading = attendanceLoading || leaveLoading

  return (
    <div>
      <h2 style={{ color: 'var(--navy-blue)', marginBottom: '30px', fontSize: '28px', fontWeight: '700' }}>
        Enhanced Reports & Analytics
      </h2>

      <div className="card" style={{ marginBottom: '30px' }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Filter size={24} />
          Report Filters
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--navy-blue)', fontWeight: '500' }}>
              Report Type
            </label>
            <select
              className="input"
              value={filters.reportType}
              onChange={(e) => setFilters({ ...filters, reportType: e.target.value as any })}
            >
              <option value="combined">Combined (Attendance + Leave)</option>
              <option value="attendance">Attendance Only</option>
              <option value="leave">Leave Only</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--navy-blue)', fontWeight: '500' }}>
              Start Date
            </label>
            <input
              type="date"
              className="input"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--navy-blue)', fontWeight: '500' }}>
              End Date
            </label>
            <input
              type="date"
              className="input"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--navy-blue)', fontWeight: '500' }}>
              Department
            </label>
            <select
              className="input"
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--navy-blue)', fontWeight: '500' }}>
              Status
            </label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
          <button
            className="btn"
            style={{ background: 'var(--navy-blue)', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}
            onClick={exportAsCSV}
            disabled={loading}
          >
            <Download size={20} />
            Export as CSV
          </button>
          <button
            className="btn"
            style={{ background: 'var(--golden)', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}
            onClick={exportAsPDF}
            disabled={loading}
          >
            <FileText size={20} />
            Export as PDF
          </button>
          <button
            className="btn"
            style={{ background: '#6c757d', color: 'white' }}
            onClick={() => setFilters({
              startDate: '',
              endDate: '',
              department: '',
              status: 'all',
              reportType: 'combined'
            })}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ color: 'var(--navy-blue)', fontSize: '18px' }}>Loading report data...</div>
        </div>
      ) : (
        <>
          <div className="stats-grid" style={{ marginBottom: '30px' }}>
            <div className="stat-card" style={{ borderLeft: '5px solid #0a1f44' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div className="stat-number">{stats.totalAttendance}</div>
                  <div className="stat-label">Total Attendance Records</div>
                </div>
                <Calendar size={48} style={{ color: '#0a1f44', marginLeft: 'auto' }} />
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '5px solid #28a745' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div className="stat-number">{stats.checkIns}</div>
                  <div className="stat-label">Check-Ins</div>
                </div>
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '5px solid #ff9800' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div className="stat-number">{stats.checkOuts}</div>
                  <div className="stat-label">Check-Outs</div>
                </div>
              </div>
            </div>

            <div className="stat-card" style={{ borderLeft: '5px solid #2196f3' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div className="stat-number">{stats.totalLeave}</div>
                  <div className="stat-label">Leave Requests</div>
                </div>
              </div>
            </div>
          </div>

          {(filters.reportType === 'attendance' || filters.reportType === 'combined') && (
            <div className="card" style={{ marginBottom: '30px' }}>
              <h3 className="card-title">Attendance Records ({filteredAttendance.length})</h3>
              {filteredAttendance.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  No attendance records found for the selected filters
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Officer Name</th>
                        <th>Badge Number</th>
                        <th>Department</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendance.slice(0, 100).map((record) => (
                        <tr key={record.id}>
                          <td>{record.profiles?.full_name || 'Unknown'}</td>
                          <td>{record.profiles?.badge_number || '--'}</td>
                          <td>{record.profiles?.department || '--'}</td>
                          <td>
                            <button
                              onClick={() => setSelectedAttendanceId(record.id)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: 'var(--navy-blue)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '12px'
                              }}
                            >
                              <Camera size={14} />
                              <MapPin size={14} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {(filters.reportType === 'leave' || filters.reportType === 'combined') && (
            <div className="card">
              <h3 className="card-title">Leave Requests ({filteredLeave.length})</h3>
              {filteredLeave.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  No leave requests found for the selected filters
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Officer Name</th>
                        <th>Badge Number</th>
                        <th>Department</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Reason</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeave.slice(0, 100).map((record) => (
                        <tr key={record.id}>
                          <td>{record.profiles?.full_name || 'Unknown'}</td>
                          <td>{record.profiles?.badge_number || '--'}</td>
                          <td>{record.profiles?.department || '--'}</td>
                          <td>{new Date(record.start_date).toLocaleDateString()}</td>
                          <td>{new Date(record.end_date).toLocaleDateString()}</td>
                          <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {record.reason}
                          </td>
                          <td>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backgroundColor:
                                record.status === 'approved' ? '#e8f5e9' :
                                record.status === 'rejected' ? '#ffebee' :
                                '#fff3e0',
                              color:
                                record.status === 'approved' ? '#2e7d32' :
                                record.status === 'rejected' ? '#c62828' :
                                '#e65100',
                              fontWeight: '600',
                              textTransform: 'capitalize'
                            }}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <AttendancePhotoView
        attendanceId={selectedAttendanceId || undefined}
        onClose={() => setSelectedAttendanceId(null)}
      />
    </div>
  )
}

export default EnhancedReportsView
