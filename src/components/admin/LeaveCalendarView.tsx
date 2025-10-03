import React, { useState, useEffect } from 'react'
import { useLeaveRequests } from '../../hooks/useLeaveRequests'
import { Calendar, ChevronLeft, ChevronRight, List } from 'lucide-react'

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  leaves: Array<{
    id: string
    user_name: string
    badge_number: string
    status: string
    isStart: boolean
    isEnd: boolean
    isContinuing: boolean
  }>
}

const LeaveCalendarView: React.FC<{ adminUserId: string }> = ({ adminUserId }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const { leaveRequests, loading, error, approveLeaveRequest, rejectLeaveRequest } = useLeaveRequests({ isAdmin: true })
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error'; show: boolean }>({
    message: '',
    type: 'success',
    show: false
  })

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  const handleApprove = async (requestId: string) => {
    const result = await approveLeaveRequest(requestId, adminUserId)
    if (result.success) {
      showNotification('Leave request approved successfully', 'success')
    } else {
      showNotification(`Failed to approve: ${result.error}`, 'error')
    }
  }

  const handleReject = async (requestId: string) => {
    if (!rejectReason.trim()) {
      showNotification('Please provide a reason for rejection', 'error')
      return
    }
    const result = await rejectLeaveRequest(requestId, adminUserId, rejectReason)
    if (result.success) {
      showNotification('Leave request rejected', 'success')
      setSelectedRequest(null)
      setRejectReason('')
    } else {
      showNotification(`Failed to reject: ${result.error}`, 'error')
    }
  }

  const getDaysInMonth = (date: Date): CalendarDay[] => {
    const year = date.getFullYear()
    const month = date.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()

    const startingDayOfWeek = firstDay.getDay()

    const days: CalendarDay[] = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDate = new Date(year, month, -startingDayOfWeek + i + 1)
      days.push({
        date: prevMonthDate,
        isCurrentMonth: false,
        leaves: []
      })
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day)
      const dateStr = currentDate.toISOString().split('T')[0]

      const leavesForDay = leaveRequests
        .filter(request => {
          const startDate = new Date(request.start_date).toISOString().split('T')[0]
          const endDate = new Date(request.end_date).toISOString().split('T')[0]
          return dateStr >= startDate && dateStr <= endDate && request.status === 'approved'
        })
        .map(request => ({
          id: request.id,
          user_name: request.profiles?.full_name || 'Unknown',
          badge_number: request.profiles?.badge_number || '--',
          status: request.status,
          isStart: new Date(request.start_date).toISOString().split('T')[0] === dateStr,
          isEnd: new Date(request.end_date).toISOString().split('T')[0] === dateStr,
          isContinuing: new Date(request.start_date).toISOString().split('T')[0] !== dateStr &&
                       new Date(request.end_date).toISOString().split('T')[0] !== dateStr
        }))

      days.push({
        date: currentDate,
        isCurrentMonth: true,
        leaves: leavesForDay
      })
    }

    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDate = new Date(year, month + 1, i)
      days.push({
        date: nextMonthDate,
        isCurrentMonth: false,
        leaves: []
      })
    }

    return days
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const getOverlappingLeaves = (date: Date): any[] => {
    const dateStr = date.toISOString().split('T')[0]
    return leaveRequests.filter(request => {
      const startDate = new Date(request.start_date).toISOString().split('T')[0]
      const endDate = new Date(request.end_date).toISOString().split('T')[0]
      return dateStr >= startDate && dateStr <= endDate && request.status === 'approved'
    })
  }

  const days = getDaysInMonth(currentDate)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: string } = {
      approved: 'status-present',
      pending: 'status-late',
      rejected: 'status-absent'
    }
    return statusMap[status] || 'status-badge'
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: 'var(--navy-blue)', fontSize: '18px' }}>Loading leave requests...</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: 'var(--navy-blue)', fontSize: '28px', fontWeight: '700', margin: 0 }}>
          Leave Management
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn"
            style={{
              background: viewMode === 'calendar' ? 'var(--navy-blue)' : '#6c757d',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={() => setViewMode('calendar')}
          >
            <Calendar size={20} />
            Calendar
          </button>
          <button
            className="btn"
            style={{
              background: viewMode === 'list' ? 'var(--navy-blue)' : '#6c757d',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={() => setViewMode('list')}
          >
            <List size={20} />
            List
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button
              className="btn"
              style={{ background: 'var(--navy-blue)', color: 'white' }}
              onClick={previousMonth}
            >
              <ChevronLeft size={20} />
            </button>
            <h3 style={{ margin: 0, color: 'var(--navy-blue)', fontSize: '24px' }}>
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              className="btn"
              style={{ background: 'var(--navy-blue)', color: 'white' }}
              onClick={nextMonth}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: '#ddd', border: '1px solid #ddd' }}>
            {weekDays.map(day => (
              <div
                key={day}
                style={{
                  background: 'var(--navy-blue)',
                  color: 'white',
                  padding: '10px',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}
              >
                {day}
              </div>
            ))}
            {days.map((day, index) => {
              const overlappingLeaves = getOverlappingLeaves(day.date)
              const hasOverlap = overlappingLeaves.length > 1

              return (
                <div
                  key={index}
                  style={{
                    background: day.isCurrentMonth ? 'white' : '#f5f5f5',
                    minHeight: '100px',
                    padding: '8px',
                    opacity: day.isCurrentMonth ? 1 : 0.5,
                    position: 'relative',
                    borderLeft: hasOverlap ? '4px solid #dc3545' : 'none'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', color: day.isCurrentMonth ? '#000' : '#999' }}>
                    {day.date.getDate()}
                  </div>
                  {day.leaves.slice(0, 3).map((leave, idx) => (
                    <div
                      key={leave.id + idx}
                      style={{
                        background: 'var(--golden)',
                        color: 'white',
                        padding: '3px 6px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        marginBottom: '3px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={`${leave.user_name} (${leave.badge_number})`}
                    >
                      {leave.user_name}
                    </div>
                  ))}
                  {day.leaves.length > 3 && (
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '3px' }}>
                      +{day.leaves.length - 3} more
                    </div>
                  )}
                  {hasOverlap && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        background: '#dc3545',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                      title={`${overlappingLeaves.length} overlapping leaves`}
                    >
                      !
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: '20px', padding: '15px', background: 'var(--light-gray)', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--navy-blue)' }}>Legend</h4>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px', height: '20px', background: 'var(--golden)', borderRadius: '3px' }}></div>
                <span>Approved Leave</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px', height: '20px', borderLeft: '4px solid #dc3545', background: 'white' }}></div>
                <span>Overlapping Leaves</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <h3 className="card-title">All Leave Requests</h3>
          {leaveRequests.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No leave requests found
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Officer</th>
                    <th>Badge Number</th>
                    <th>Department</th>
                    <th>Dates</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="profile-img">
                            {request.profiles?.full_name?.split(' ').map(n => n[0]).join('') || '??'}
                          </div>
                          <div>{request.profiles?.full_name || 'Unknown'}</div>
                        </div>
                      </td>
                      <td>{request.profiles?.badge_number || '--'}</td>
                      <td>{request.profiles?.department || '--'}</td>
                      <td>
                        {formatDate(request.start_date)} - {formatDate(request.end_date)}
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {request.reason}
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadge(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        {request.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              className="btn btn-success"
                              onClick={() => handleApprove(request.id)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => setSelectedRequest(request.id)}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#666', fontStyle: 'italic' }}>
                            {request.status === 'approved' ? 'Approved' : 'Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedRequest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '20px' }}>Reject Leave Request</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Reason for rejection:
              </label>
              <textarea
                className="form-control"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="Enter reason for rejection..."
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="btn"
                style={{ background: '#6c757d', color: 'white' }}
                onClick={() => {
                  setSelectedRequest(null)
                  setRejectReason('')
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleReject(selectedRequest)}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`notification ${notification.type} ${notification.show ? 'show' : ''}`}>
        {notification.message}
      </div>
    </div>
  )
}

export default LeaveCalendarView
