import React, { useState, useEffect } from 'react'
import { Calendar, CheckCircle, XCircle, FileText, Download, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase, LeaveRequest } from '../../lib/supabase'
import { format, differenceInDays } from 'date-fns'
import toast from 'react-hot-toast'

export function LeaveRequests() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaveRequests()
  }, [])

  const fetchLeaveRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          profiles (
            name,
            badge_number,
            station_id
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error: any) {
      toast.error('Failed to fetch leave requests')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    if (!profile) return

    setProcessingId(requestId)
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: 'approved',
          approved_by: profile.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error

      await fetchLeaveRequests()
      toast.success(
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          Leave request approved ✅
        </div>
      )
    } catch (error: any) {
      toast.error('Failed to approve request')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId: string) => {
    if (!profile || !rejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setProcessingId(requestId)
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: 'rejected',
          admin_reason: rejectReason,
          approved_by: profile.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error

      await fetchLeaveRequests()
      setShowRejectModal(null)
      setRejectReason('')
      toast.success(
        <div className="flex items-center">
          <XCircle className="h-5 w-5 text-red-500 mr-2" />
          Leave request rejected ❌
        </div>
      )
    } catch (error: any) {
      toast.error('Failed to reject request')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const processedRequests = requests.filter(r => r.status !== 'pending')

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
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
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Calendar className="h-8 w-8 text-blue-600 mr-3" />
          Leave Requests Management
        </h1>
        <p className="text-gray-600">Review and manage staff leave applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">Pending</p>
              <p className="text-3xl font-bold">{pendingRequests.length}</p>
            </div>
            <Calendar className="h-12 w-12 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Approved</p>
              <p className="text-3xl font-bold">
                {requests.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Rejected</p>
              <p className="text-3xl font-bold">
                {requests.filter(r => r.status === 'rejected').length}
              </p>
            </div>
            <XCircle className="h-12 w-12 text-red-200" />
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Requests</h2>
          <div className="grid gap-6">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {request.profiles?.name}
                        </h3>
                        <p className="text-gray-600">Badge: {request.profiles?.badge_number}</p>
                        <p className="text-sm text-gray-500">Station: {request.profiles?.station_id}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Leave Period</p>
                        <p className="text-lg text-gray-900">
                          {format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm text-gray-600">
                          ({differenceInDays(new Date(request.end_date), new Date(request.start_date)) + 1} days)
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Submitted</p>
                        <p className="text-gray-900">{format(new Date(request.created_at), 'PPp')}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Reason</p>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{request.reason}</p>
                    </div>

                    {request.attachment_url && (
                      <div className="mb-4">
                        <button
                          onClick={() => window.open(request.attachment_url, '_blank')}
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          View Attachment
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-3 ml-6">
                    <button
                      onClick={() => handleApprove(request.id)}
                      disabled={processingId === request.id}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 flex items-center"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => setShowRejectModal(request.id)}
                      disabled={processingId === request.id}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 flex items-center"
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Processed Requests</h2>
          <div className="space-y-4">
            {processedRequests.map((request) => (
              <div
                key={request.id}
                className={`bg-white rounded-xl shadow-lg p-4 border-l-4 ${
                  request.status === 'approved' ? 'border-green-500' : 'border-red-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{request.profiles?.name}</h4>
                      <p className="text-sm text-gray-600">
                        {format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
                      {request.status.toUpperCase()}
                    </span>
                    <p className="text-sm text-gray-500">
                      {format(new Date(request.updated_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                {request.admin_reason && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Rejection Reason:</strong> {request.admin_reason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Leave Request</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejecting this request:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={4}
              placeholder="Enter rejection reason..."
            />
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={!rejectReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
              >
                Reject Request
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(null)
                  setRejectReason('')
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {requests.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Leave Requests</h3>
          <p className="text-gray-600">No leave requests have been submitted yet.</p>
        </div>
      )}
    </div>
  )
}