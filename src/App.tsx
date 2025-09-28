import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './components/Login'
import { Dashboard } from './pages/Dashboard'
import { AttendanceHistory } from './pages/AttendanceHistory'
import { LeaveRequest } from './pages/LeaveRequest'
import { AttendanceLogs } from './pages/admin/AttendanceLogs'
import { LeaveRequests } from './pages/admin/LeaveRequests'
import { ExportData } from './pages/admin/ExportData'

function AppContent() {
  const { user, loading } = useAuth()

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

  if (!user) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/attendance" element={
          <ProtectedRoute>
            <AttendanceHistory />
          </ProtectedRoute>
        } />
        <Route path="/leave" element={
          <ProtectedRoute>
            <LeaveRequest />
          </ProtectedRoute>
        } />
        <Route path="/attendance-logs" element={
          <ProtectedRoute adminOnly>
            <AttendanceLogs />
          </ProtectedRoute>
        } />
        <Route path="/leave-requests" element={
          <ProtectedRoute adminOnly>
            <LeaveRequests />
          </ProtectedRoute>
        } />
        <Route path="/export" element={
          <ProtectedRoute adminOnly>
            <ExportData />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1F2937',
              color: '#F9FAFB',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
              fontWeight: '500'
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#F9FAFB'
              }
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#F9FAFB'
              }
            }
          }}
        />
      </Router>
    </AuthProvider>
  )
}

export default App
