import React, { useState, useEffect } from 'react'
import { FileText, Upload, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'
import { submitLeaveRequest, getUserLeaveRequests } from '../../lib/database'
import { LeaveRequestViewProps, LeaveFormData, Notification } from '../../types'

interface LeaveHistoryRecord {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  statusColor: string;
  submittedDate: string;
  approver: string | null;
  rejectReason?: string;
}

const LeaveRequestView: React.FC<LeaveRequestViewProps> = ({ user }) => {
  const [formData, setFormData] = useState<LeaveFormData>({
    startDate: '',
    endDate: '',
    reason: '',
    file: null
  })
  const [notification, setNotification] = useState<Notification>({ message: '', type: 'info', show: false })

  const showNotification = (message: string, type: Notification['type']): void => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      showNotification('Please fill in all required fields!', 'error')
      return
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      showNotification('End date must be after start date!', 'error')
      return
    }

    try {
      // Submit to Supabase
      await submitLeaveRequest(
        user.id,
        formData.startDate,
        formData.endDate,
        formData.reason,
        formData.file ? 'file_url_placeholder' : undefined, // In real app, upload file first
      )

      showNotification('Leave request submitted successfully!', 'success')
      
      // Reset form
      setFormData({
        startDate: '',
        endDate: '',
        reason: '',
        file: null
      })
      
      // Reset file input
      const fileInput = document.getElementById('file') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
      
      // Reload leave history
      loadLeaveHistory()
      
    } catch (error) {
      console.error('Error submitting leave request:', error)
      showNotification('Failed to submit leave request. Please try again.', 'error')
    }
  }

  const [leaveHistory, setLeaveHistory] = useState<LeaveHistoryRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    loadLeaveHistory()
  }, [user.id])

  const loadLeaveHistory = async (): Promise<void> => {
    try {
      setLoading(true)
      const requests = await getUserLeaveRequests(user.id)
      
      const formattedHistory = requests.map(request => ({
        id: request.id,
        startDate: request.start_date,
        endDate: request.end_date,
        reason: request.reason,
        status: request.status.charAt(0).toUpperCase() + request.status.slice(1),
        statusColor: request.status === 'approved' ? 'var(--green)' : 
                    request.status === 'rejected' ? 'var(--red)' : 'var(--golden)',
        submittedDate: request.created_at,
        approver: request.approved_by_profile?.name || null,
        rejectReason: request.admin_reason
      }))
      
      setLeaveHistory(formattedHistory)
    } catch (error) {
      console.error('Error loading leave history:', error)
      showNotification('Error loading leave history', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string): React.ReactElement | null => {
    switch (status) {
      case 'Pending':
        return <Clock size={16} />
      case 'Approved':
        return <CheckCircle size={16} />
      case 'Rejected':
        return <XCircle size={16} />
      default:
        return null
    }
  }

  const calculateDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  return (
    <div>
      <h2 style={{ color: 'var(--navy-blue)', marginBottom: '30px', fontSize: '28px', fontWeight: '700' }}>
        Leave Requests
      </h2>

      {/* Leave Request Form */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h3 className="card-title">
          <FileText size={24} style={{ marginRight: '10px' }} />
          Submit New Leave Request
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--navy-blue)' }}>
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                className="form-control"
                value={formData.startDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--navy-blue)' }}>
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                className="form-control"
                value={formData.endDate}
                onChange={handleInputChange}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--navy-blue)' }}>
              Reason for Leave *
            </label>
            <textarea
              name="reason"
              className="form-control"
              rows={4}
              placeholder="Please provide a detailed reason for your leave request..."
              value={formData.reason}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--navy-blue)' }}>
              Supporting Documents (Optional)
            </label>
            <input
              type="file"
              id="file"
              className="form-control"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              multiple
            />
            <small style={{ color: 'var(--dark-gray)', fontSize: '12px' }}>
              Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 5MB)
            </small>
          </div>

          {formData.startDate && formData.endDate && (
            <div style={{ padding: '15px', background: 'var(--light-gray)', borderRadius: '10px', marginBottom: '20px' }}>
              <strong style={{ color: 'var(--navy-blue)' }}>
                Total Leave Days: {calculateDays(formData.startDate, formData.endDate)} days
              </strong>
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <button 
              type="submit" 
              className="btn btn-golden" 
              style={{ padding: '15px 40px', fontSize: '16px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}
            >
              <Upload size={20} />
              Submit Leave Request
            </button>
          </div>
        </form>
      </div>

      {/* Leave Request History */}
      <div className="card">
        <h3 className="card-title">
          <Calendar size={24} style={{ marginRight: '10px' }} />
          Leave Request History
        </h3>
        
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Dates</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Approver</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaveHistory.map((request) => (
                <tr key={request.id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: '600', color: 'var(--navy-blue)' }}>
                      {calculateDays(request.startDate, request.endDate)}
                    </span>
                  </td>
                  <td>
                    <div style={{ maxWidth: '200px' }}>
                      {request.reason}
                    </div>
                  </td>
                  <td>
                    <span 
                      className="status-badge" 
                      style={{ 
                        background: `${request.statusColor}20`, 
                        color: request.statusColor,
                        padding: '8px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      {getStatusIcon(request.status)}
                      {request.status}
                    </span>
                  </td>
                  <td>
                    <small style={{ color: 'var(--dark-gray)' }}>
                      {new Date(request.submittedDate).toLocaleDateString()}
                    </small>
                  </td>
                  <td>
                    <small style={{ color: 'var(--dark-gray)' }}>
                      {request.approver || '--'}
                    </small>
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
                    ) : request.status === 'rejected' && request.rejectReason ? (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                        onClick={() => showNotification(`Rejection reason: ${request.rejectReason}`, 'info')}
                      >
                        View Reason
                      </button>
                    ) : (
                      <span style={{ color: 'var(--dark-gray)', fontSize: '12px' }}>
                        --
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Policy Information */}
      <div className="card" style={{ background: '#fff8e1', border: '1px solid var(--golden)' }}>
        <h3 className="card-title" style={{ color: 'var(--golden)' }}>
          Leave Policy Guidelines
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <h4 style={{ color: 'var(--navy-blue)', marginBottom: '10px' }}>Annual Leave</h4>
            <ul style={{ color: 'var(--dark-gray)', lineHeight: '1.6' }}>
              <li>30 days per year</li>
              <li>Can be carried forward (max 10 days)</li>
              <li>Requires 7 days advance notice</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: 'var(--navy-blue)', marginBottom: '10px' }}>Sick Leave</h4>
            <ul style={{ color: 'var(--dark-gray)', lineHeight: '1.6' }}>
              <li>15 days per year</li>
              <li>Medical certificate required (3 days)</li>
              <li>Can be taken without advance notice</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: 'var(--navy-blue)', marginBottom: '10px' }}>Emergency Leave</h4>
            <ul style={{ color: 'var(--dark-gray)', lineHeight: '1.6' }}>
              <li>5 days per year</li>
              <li>For family emergencies</li>
              <li>Requires documentation</li>
            </ul>
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

export default LeaveRequestView