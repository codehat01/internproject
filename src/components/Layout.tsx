import React from 'react'
import { Shield, LogOut, Home, Clock, Calendar, FileBarChart } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Link, useLocation, Outlet } from 'react-router-dom'

export function Layout() {
  const { profile, signOut } = useAuth()
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const userNavItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/attendance', icon: Clock, label: 'Attendance' },
    { path: '/leave', icon: Calendar, label: 'Leave Request' },
  ]

  const adminNavItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/attendance-logs', icon: Clock, label: 'Attendance Logs' },
    { path: '/leave-requests', icon: Calendar, label: 'Leave Requests' },
    { path: '/export', icon: FileBarChart, label: 'Export Data' },
  ]

  const navItems = profile?.role === 'admin' ? adminNavItems : userNavItems

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div 
          className="w-full h-full bg-repeat opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='5'/%3E%3Ccircle cx='53' cy='7' r='5'/%3E%3Ccircle cx='7' cy='53' r='5'/%3E%3Ccircle cx='53' cy='53' r='5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 shadow-lg border-b-4 border-yellow-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-500 p-2 rounded-full">
                <Shield className="h-8 w-8 text-blue-900" />
              </div>
              <div>
                <h1 className="text-white text-xl font-bold">Police Attendance System</h1>
                <p className="text-blue-200 text-sm">Station Management Portal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right text-white">
                <p className="font-medium">{profile?.name}</p>
                <p className="text-sm text-blue-200">Badge: {profile?.badge_number}</p>
              </div>
              <button
                onClick={signOut}
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-white shadow-lg relative z-10">
          <nav className="mt-8 px-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-lg font-medium transition-all duration-200 ${
                        isActive(item.path)
                          ? 'bg-blue-900 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-900'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 relative z-10">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-blue-900 text-white text-center py-4 relative z-10">
        <p>Powered by Supabase | Built for Police Station Attendance</p>
      </footer>
    </div>
  )
}