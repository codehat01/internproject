import React, { useState, useEffect } from 'react'
import { Calendar, FileText, Upload, Send, Clock, CheckCircle, XCircle } from 'lucide-react'
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
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Calendar className="h-8 w-8 text-blue-600 mr-3" />
          Leave Request
        </h1>
        <p className="text-gray-600">Submit your leave application for approval</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Request Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">New Leave Request</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={formData.start_date || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Leave
              </label>
              <textarea
                required
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Please provide a detailed reason for your leave request..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supporting Document (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="attachment"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="attachment" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">
                    {attachment ? attachment.name : 'Click to upload document'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                  </p>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                <>
                  <Send className="h-6 w-6 mr-2" />
                  Submit Request
                </>
              )}
            </button>
          </form>
        </div>

        {/* Request History */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Your Leave Requests</h2>
          
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
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getStatusIcon(request.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900">
                        {format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                      {request.admin_reason && (
                        <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
                          Admin Note: {request.admin_reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Submitted: {format(new Date(request.created_at), 'PPp')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}