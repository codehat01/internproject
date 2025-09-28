import React from 'react'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="animate-pulse flex items-center space-x-4">
            <div className="rounded-full bg-blue-300 h-12 w-12"></div>
            <div className="space-y-2">
              <div className="h-4 bg-blue-300 rounded w-32"></div>
              <div className="h-4 bg-blue-300 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return <div>Access denied. Please log in.</div>
  }

  if (adminOnly && profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need administrator privileges to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}