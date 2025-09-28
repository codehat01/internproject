import React from 'react'
import { Shield, LogOut, Home, Clock, Calendar, FileBarChart, Download } from 'lucide-react'
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
    { path: '/attendance-logs', icon: Clock, label: 'Attendance' },
    { path: '/leave-requests', icon: Calendar, label: 'Leave Requests' },
    { path: '/export', icon: Download, label: 'Export' },
  ]

  const navItems = profile?.role === 'admin' ? adminNavItems : userNavItems

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-3 pointer-events-none">
        <div 
          className="w-full h-full bg-repeat opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='240' viewBox='0 0 200 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.02'%3E%3Cellipse cx='100' cy='180' rx='60' ry='8'/%3E%3Crect x='50' y='165' width='100' height='15' rx='7'/%3E%3Ccircle cx='100' cy='145' r='12' fill='none' stroke='%23000' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 flex items-center justify-center">
                {/* Indian State Emblem */}
                <svg viewBox="0 0 200 240" className="w-full h-full text-blue-900" fill="currentColor">
                  <ellipse cx="100" cy="180" rx="60" ry="8" fill="#D97706"/>
                  <rect x="50" y="165" width="100" height="15" rx="7" fill="#1E3A8A"/>
                  <circle cx="100" cy="145" r="12" fill="none" stroke="#D97706" strokeWidth="2"/>
                  <g>
                    {Array.from({length: 8}).map((_, i) => (
                      <line 
                        key={i}
                        x1="100" y1="145" 
                        x2={100 + 10 * Math.cos(i * Math.PI / 4)} 
                        y2={145 + 10 * Math.sin(i * Math.PI / 4)}
                        stroke="#D97706" strokeWidth="1"
                      />
                    ))}
                  </g>
                  <g transform="translate(85, 90)">
                    <ellipse cx="15" cy="30" rx="10" ry="6" fill="#1E3A8A"/>
                    <path d="M15 18 Q18 15 22 22 Q18 26 15 30 Q12 26 8 22 Q12 15 15 18 Z" fill="#1E3A8A"/>
                    <circle cx="12" cy="20" r="1" fill="white"/>
                    <circle cx="18" cy="20" r="1" fill="white"/>
                  </g>
                </svg>
              </div>
              <div>
                <h1 className="text-gray-900 text-xl font-bold">POLICE ATTENDANCE SYSTEM</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right text-gray-700">
                <p className="font-medium">{profile?.name}</p>
                <p className="text-sm text-gray-500">Welcome, Officer</p>
              </div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm">👤</span>
              </div>
              <button
                onClick={signOut}
                className="text-gray-600 hover:text-gray-800 p-2 transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-blue-900 shadow-lg relative z-10">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-blue-800">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg viewBox="0 0 200 240" className="w-full h-full text-white" fill="currentColor">
                <ellipse cx="100" cy="180" rx="60" ry="8" fill="currentColor" opacity="0.3"/>
                <rect x="50" y="165" width="100" height="15" rx="7" fill="currentColor" opacity="0.4"/>
                <circle cx="100" cy="145" r="12" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
                <g transform="translate(85, 90)">
                  <ellipse cx="15" cy="30" rx="10" ry="6" fill="currentColor" opacity="0.7"/>
                  <path d="M15 18 Q18 15 22 22 Q18 26 15 30 Q12 26 8 22 Q12 15 15 18 Z" fill="currentColor" opacity="0.8"/>
                  <circle cx="12" cy="20" r="1" fill="white"/>
                  <circle cx="18" cy="20" r="1" fill="white"/>
                </g>
              </svg>
            </div>
          </div>
          
          <nav className="mt-4 px-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        isActive(item.path)
                          ? 'bg-yellow-500 text-blue-900 shadow-lg border-2 border-yellow-400'
                          : 'text-white hover:bg-blue-800'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 relative z-10">
          <Outlet />
        </main>
      </div>

    </div>
  )
}