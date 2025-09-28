import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export function Login() {
  const [badgeNumber, setBadgeNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [signUpData, setSignUpData] = useState({
    name: '',
    phone: ''
  })

  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await signUp(badgeNumber, password, {
          name: signUpData.name,
          phone: signUpData.phone,
          role: 'user'
        })

        if (error) {
          toast.error(error.message)
        } else {
          toast.success('Account created successfully! Please log in.')
          setIsSignUp(false)
          setBadgeNumber('')
          setPassword('')
          setSignUpData({ name: '', phone: '' })
        }
      } else {
        const { error } = await signIn(badgeNumber, password)
        
        if (error) {
          toast.error(error.message)
        } else {
          toast.success('Welcome back!')
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full bg-repeat"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.08'%3E%3Ccircle cx='60' cy='60' r='40' fill='none' stroke='%23000' stroke-width='1'/%3E%3Cpath d='M60 30 L70 50 L50 50 Z'/%3E%3Cpath d='M60 90 L50 70 L70 70 Z'/%3E%3Cpath d='M30 60 L50 50 L50 70 Z'/%3E%3Cpath d='M90 60 L70 70 L70 50 Z'/%3E%3Ccircle cx='60' cy='60' r='8'/%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Large Background Indian Emblem */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <div className="w-80 h-80 flex items-center justify-center">
          {/* Indian State Emblem SVG */}
          <svg viewBox="0 0 200 240" className="w-full h-full text-blue-900" fill="currentColor">
            {/* Base Platform */}
            <ellipse cx="100" cy="180" rx="80" ry="12" fill="currentColor" opacity="0.3"/>
            
            {/* Abacus/Base */}
            <rect x="40" y="160" width="120" height="20" rx="10" fill="currentColor" opacity="0.4"/>
            
            {/* Dharma Chakra (Wheel) in center */}
            <circle cx="100" cy="140" r="15" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
            <g opacity="0.6">
              {Array.from({length: 8}).map((_, i) => (
                <line 
                  key={i}
                  x1="100" y1="140" 
                  x2={100 + 12 * Math.cos(i * Math.PI / 4)} 
                  y2={140 + 12 * Math.sin(i * Math.PI / 4)}
                  stroke="currentColor" strokeWidth="1"
                />
              ))}
            </g>
            
            {/* Bull (right side) */}
            <g opacity="0.5" transform="translate(130, 135)">
              <path d="M0 10 Q5 5 10 10 Q15 8 20 12 L18 15 Q10 12 5 15 Q2 13 0 15 Z" fill="currentColor"/>
              <circle cx="8" cy="8" r="1" fill="currentColor"/>
            </g>
            
            {/* Horse (left side) */}
            <g opacity="0.5" transform="translate(50, 135)">
              <path d="M20 15 Q15 8 10 10 Q5 5 0 10 L2 15 Q10 12 15 15 Q18 13 20 15 Z" fill="currentColor"/>
              <circle cx="12" cy="8" r="1" fill="currentColor"/>
            </g>
            
            {/* Three Lions */}
            {/* Center Lion */}
            <g transform="translate(85, 80)">
              <ellipse cx="15" cy="35" rx="12" ry="8" fill="currentColor" opacity="0.6"/>
              <path d="M15 20 Q20 15 25 25 Q20 30 15 35 Q10 30 5 25 Q10 15 15 20 Z" fill="currentColor" opacity="0.7"/>
              <circle cx="12" cy="22" r="1.5" fill="currentColor"/>
              <circle cx="18" cy="22" r="1.5" fill="currentColor"/>
              <path d="M15 25 Q12 27 15 28 Q18 27 15 25" fill="currentColor"/>
              {/* Mane */}
              <path d="M5 20 Q8 15 12 18 Q15 12 18 18 Q22 15 25 20" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.6"/>
            </g>
            
            {/* Left Lion */}
            <g transform="translate(55, 85) rotate(-15)">
              <ellipse cx="15" cy="30" rx="10" ry="6" fill="currentColor" opacity="0.5"/>
              <path d="M15 18 Q18 15 22 22 Q18 26 15 30 Q12 26 8 22 Q12 15 15 18 Z" fill="currentColor" opacity="0.6"/>
              <circle cx="13" cy="20" r="1" fill="currentColor"/>
              <circle cx="17" cy="20" r="1" fill="currentColor"/>
              <path d="M8 18 Q10 14 13 16 Q15 12 17 16 Q20 14 22 18" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
            </g>
            
            {/* Right Lion */}
            <g transform="translate(115, 85) rotate(15)">
              <ellipse cx="15" cy="30" rx="10" ry="6" fill="currentColor" opacity="0.5"/>
              <path d="M15 18 Q18 15 22 22 Q18 26 15 30 Q12 26 8 22 Q12 15 15 18 Z" fill="currentColor" opacity="0.6"/>
              <circle cx="13" cy="20" r="1" fill="currentColor"/>
              <circle cx="17" cy="20" r="1" fill="currentColor"/>
              <path d="M8 18 Q10 14 13 16 Q15 12 17 16 Q20 14 22 18" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
            </g>
            
            {/* Satyameva Jayate Text (stylized) */}
            <text x="100" y="210" textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.4" fontFamily="serif">
              सत्यमेव जयते
            </text>
          </svg>
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Main Login Card */}
          <div className="bg-white rounded-lg shadow-2xl p-8 border border-gray-200">
            {/* Indian State Emblem */}
            <div className="text-center mb-8">
              <div className="mx-auto w-24 h-24 flex items-center justify-center mb-4">
                {/* Indian State Emblem */}
                <svg viewBox="0 0 200 240" className="w-full h-full text-blue-900" fill="currentColor">
                  {/* Base Platform */}
                  <ellipse cx="100" cy="180" rx="60" ry="8" fill="#D97706"/>
                  
                  {/* Abacus/Base */}
                  <rect x="50" y="165" width="100" height="15" rx="7" fill="#1E3A8A"/>
                  
                  {/* Dharma Chakra (Wheel) in center */}
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
                  
                  {/* Bull (right side) */}
                  <g transform="translate(125, 140)">
                    <path d="M0 8 Q4 4 8 8 Q12 6 16 10 L14 12 Q8 10 4 12 Q2 11 0 12 Z" fill="#1E3A8A"/>
                    <circle cx="6" cy="6" r="0.8" fill="#1E3A8A"/>
                  </g>
                  
                  {/* Horse (left side) */}
                  <g transform="translate(60, 140)">
                    <path d="M16 12 Q12 6 8 8 Q4 4 0 8 L2 12 Q8 10 12 12 Q14 11 16 12 Z" fill="#1E3A8A"/>
                    <circle cx="10" cy="6" r="0.8" fill="#1E3A8A"/>
                  </g>
                  
                  {/* Three Lions */}
                  {/* Center Lion (main) */}
                  <g transform="translate(85, 90)">
                    <ellipse cx="15" cy="30" rx="10" ry="6" fill="#1E3A8A"/>
                    <path d="M15 18 Q18 15 22 22 Q18 26 15 30 Q12 26 8 22 Q12 15 15 18 Z" fill="#1E3A8A"/>
                    <circle cx="12" cy="20" r="1" fill="white"/>
                    <circle cx="18" cy="20" r="1" fill="white"/>
                    <path d="M15 23 Q13 24 15 25 Q17 24 15 23" fill="#D97706"/>
                    {/* Mane */}
                    <path d="M8 18 Q10 14 12 16 Q15 12 18 16 Q20 14 22 18" stroke="#D97706" strokeWidth="1.5" fill="none"/>
                  </g>
                  
                  {/* Left Lion */}
                  <g transform="translate(60, 95) rotate(-20)">
                    <ellipse cx="12" cy="25" rx="8" ry="5" fill="#1E3A8A"/>
                    <path d="M12 16 Q14 14 17 19 Q14 22 12 25 Q10 22 7 19 Q10 14 12 16 Z" fill="#1E3A8A"/>
                    <circle cx="10" cy="17" r="0.8" fill="white"/>
                    <circle cx="14" cy="17" r="0.8" fill="white"/>
                    <path d="M7 16 Q9 13 11 15 Q12 12 14 15 Q16 13 17 16" stroke="#D97706" strokeWidth="1" fill="none"/>
                  </g>
                  
                  {/* Right Lion */}
                  <g transform="translate(115, 95) rotate(20)">
                    <ellipse cx="12" cy="25" rx="8" ry="5" fill="#1E3A8A"/>
                    <path d="M12 16 Q14 14 17 19 Q14 22 12 25 Q10 22 7 19 Q10 14 12 16 Z" fill="#1E3A8A"/>
                    <circle cx="10" cy="17" r="0.8" fill="white"/>
                    <circle cx="14" cy="17" r="0.8" fill="white"/>
                    <path d="M7 16 Q9 13 11 15 Q12 12 14 15 Q16 13 17 16" stroke="#D97706" strokeWidth="1" fill="none"/>
                  </g>
                  
                  {/* Satyameva Jayate */}
                  <text x="100" y="200" textAnchor="middle" fontSize="10" fill="#1E3A8A" fontFamily="serif" fontWeight="bold">
                    सत्यमेव जयते
                  </text>
                </svg>
              </div>
              
              {/* Title */}
              <h1 className="text-2xl font-bold text-blue-900 mb-2 tracking-wide">
                POLICE ATTENDANCE SYSTEM
              </h1>
              <p className="text-sm text-gray-600 mb-2 font-medium">सत्यमेव जयते</p>
              <div className="w-16 h-0.5 bg-yellow-500 mx-auto"></div>
            </div>

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {isSignUp && (
                <>
                  <div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={signUpData.name}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-yellow-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-gray-50"
                      placeholder="FULL NAME"
                    />
                  </div>


                  <div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={signUpData.phone}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-yellow-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-gray-50"
                      placeholder="PHONE NUMBER"
                    />
                  </div>
                </>
              )}

              <div>
                <input
                  id="badgeNumber"
                  name="badgeNumber"
                  type="text"
                  autoComplete="username"
                  required
                  value={badgeNumber}
                  onChange={(e) => setBadgeNumber(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-yellow-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-gray-50 font-medium"
                  placeholder="BADGE NUMBER"
                />
              </div>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border-2 border-yellow-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-gray-50 font-medium"
                  placeholder="PASSWORD"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-900 hover:bg-blue-800 text-yellow-400 font-bold py-4 px-4 rounded-lg text-lg tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-400 mr-2"></div>
                    PROCESSING...
                  </div>
                ) : (
                  isSignUp ? 'CREATE ACCOUNT' : 'LOGIN'
                )}
              </button>

              {!isSignUp && (
                <div className="text-center space-y-2">
                  <button
                    type="button"
                    className="text-yellow-600 hover:text-yellow-500 font-medium text-sm"
                  >
                    Forgot Badge Number?
                  </button>
                  <br />
                  <button
                    type="button"
                    className="text-blue-900 hover:text-blue-700 font-medium text-sm"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-blue-900 hover:text-blue-700 font-medium text-sm"
                >
                  {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
                </button>
              </div>
            </form>

            {/* Demo Accounts */}
            {!isSignUp && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <p className="text-xs text-gray-600 font-medium mb-2 text-center">DEMO ACCOUNTS:</p>
                <div className="space-y-1 text-xs text-gray-500 text-center">
                  <p>Admin: ADMIN001 (password: admin123)</p>
                  <p>Officer: OFF001 (password: officer123)</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 font-medium">
              GOVERNMENT OF INDIA • © 2024
            </p>
            <p className="text-xs text-gray-500 mt-1">
              भारत सरकार • सत्यमेव जयते
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}