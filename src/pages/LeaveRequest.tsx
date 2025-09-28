import React, { useState, useEffect } from 'react'
import { Calendar, FileText, Upload, Send, Clock, CheckCircle, XCircle, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase, LeaveRequest as LeaveRequestType } from '../lib/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export function LeaveRequest() {
  const { profile } = useAuth()
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: ''
  })
  const [attachment, setAttachment] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState<LeaveRequestType[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)

  useEffect(() => {
    fetchLeaveRequests()
  }, [profile])

  const fetchLeaveRequests = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error: any) {
      toast.error('Failed to fetch leave requests')
      console.error('Error:', error)
    } finally {
      setLoadingRequests(false)
    }
  }

  const uploadAttachment = async (file: File): Promise<string> => {
    try {
      const fileName = `leave-attachments/${profile?.id}/${Date.now()}-${file.name}`
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (error) {
      console.error('Upload error:', error)
      throw new Error('Failed to upload attachment')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    // Validation
    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast.error('End date must be after start date')
      return
    }

    setLoading(true)

    try {
      let attachmentUrl = ''
      
      if (attachment) {
        attachmentUrl = await uploadAttachment(attachment)
      }

      const { error } = await supabase
        .from('leave_requests')
        .insert([
          {
            user_id: profile.id,
            start_date: formData.start_date,
            end_date: formData.end_date,
            reason: formData.reason,
            attachment_url: attachmentUrl || null,
            status: 'pending'
          }
        ])

      if (error) throw error

      // Reset form
      setFormData({ start_date: '', end_date: '', reason: '' })
      setAttachment(null)
      
      // Refresh requests
      await fetchLeaveRequests()
      
      toast.success(
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          Your leave request has been submitted ✅
        </div>,
        { duration: 4000 }
      )
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit leave request')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5" />
      case 'rejected':
        return <XCircle className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Welcome */}
      <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">OFFICIAL LEAVE</h1>
          <h2 className="text-2xl font-bold text-gray-900">APPLICATION FORM</h2>
        </div>
        <div className="text-right">
          <p className="text-gray-600">Welcome, Officer</p>
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-gray-600" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Request Form - Takes 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-medium text-gray-900 mb-3">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-yellow-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-900 mb-3">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-yellow-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  min={formData.start_date || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-900 mb-3">
                Select for Leave
              </label>
              <textarea
                required
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-yellow-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                rows={6}
                placeholder="Reason"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-8 rounded-lg font-bold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
                </button>
              </div>
              
              <div className="text-center">
                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  id="attachment"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="attachment" className="cursor-pointer">
                    <FileText className="h-8 w-8 text-gray-400 mb-1" />
                    <p className="text-xs text-gray-600">Attach Documents</p>
                    <p className="text-xs text-gray-500">(Optional)</p>
                </label>
              </div>
              </div>
            </div>
          </form>
        </div>

        {/* Request History - Takes 1/3 width */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Past Leave Requests</h3>
          
          {loadingRequests ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No leave requests yet</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <img src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=32&h=32&fit=crop" 
                         alt="Officer" className="w-8 h-8 rounded-full object-cover" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">Officer K. Singh</p>
                      <p className="text-xs text-gray-600">
                        {format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 mb-1">{request.reason}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        request.status === 'approved' ? 'bg-yellow-500 text-white' :
                        request.status === 'pending' ? 'bg-blue-900 text-white' :
                        'bg-red-500 text-white'
                      }`}>
                          {request.status.toUpperCase()}
                        </span>
                    </div>
                  </div>
                  {request.admin_reason && (
                    <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">
                      Admin Note: {request.admin_reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}