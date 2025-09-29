import React, { useState, useEffect } from 'react'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { loginWithBadge, validateBadgeNumber, validatePassword } from '../lib/auth'
import { sanitizeInput, rateLimiter, logSecurityEvent, SECURITY_CONFIG } from '../lib/security'
import { LoginFormData, LoginProps, Notification, User } from '../types'

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState<LoginFormData>({
    badgeId: '',
    password: ''
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [notification, setNotification] = useState<Notification>({ message: '', type: 'info', show: false })
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [loginAttempts, setLoginAttempts] = useState<number>(0)
  const [isBlocked, setIsBlocked] = useState<boolean>(false)
  const [blockTimeRemaining, setBlockTimeRemaining] = useState<number>(0)

  // Check for rate limiting on component mount
  useEffect(() => {
    const clientId = 'login_attempt';
    const isAllowed = rateLimiter.isAllowed(clientId, SECURITY_CONFIG.maxLoginAttempts, 5 * 60 * 1000); // 5 minutes
    
    if (!isAllowed) {
      setIsBlocked(true);
      setBlockTimeRemaining(300); // 5 minutes in seconds
      
      const timer = setInterval(() => {
        setBlockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            rateLimiter.reset(clientId);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }

    // Return empty cleanup function when rate limit is allowed
    return () => {};
  }, []);

  const showNotification = (message: string, type: Notification['type']): void => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    
    // Check if user is blocked due to too many attempts
    if (isBlocked) {
      const minutes = Math.ceil(blockTimeRemaining / 60);
      showNotification(`Too many login attempts. Please try again in ${minutes} minute(s).`, 'error');
      return;
    }

    setLoading(true)

    try {
      // Sanitize inputs
      const sanitizedBadgeId = sanitizeInput(formData.badgeId.trim());
      const sanitizedPassword = sanitizeInput(formData.password);

      // Validate inputs
      if (!sanitizedBadgeId || !sanitizedPassword) {
        showNotification('Please enter Badge ID and Password!', 'error')
        setLoading(false)
        return
      }

      // Validate badge number format
      const validatedBadge = validateBadgeNumber(sanitizedBadgeId);
      if (!validatedBadge) {
        showNotification('Invalid badge number format. Badge must be 3-20 alphanumeric characters.', 'error');
        setLoading(false);
        return;
      }

      // Check rate limiting
      const clientId = 'login_attempt';
      if (!rateLimiter.isAllowed(clientId, SECURITY_CONFIG.maxLoginAttempts, 5 * 60 * 1000)) {
        setIsBlocked(true);
        setBlockTimeRemaining(300);
        showNotification('Too many login attempts. Please try again later.', 'error');
        setLoading(false);
        return;
      }

      // Log login attempt
      logSecurityEvent('login_attempt', 'authentication', undefined, {
        badgeNumber: sanitizedBadgeId,
        timestamp: new Date().toISOString()
      });

      // Real Supabase authentication with badge number
      const { user, profile } = await loginWithBadge(sanitizedBadgeId, sanitizedPassword)

      if (!profile) {
        setLoginAttempts(prev => prev + 1);
        showNotification('Profile not found!', 'error')
        setLoading(false)
        return
      }

      // Transform profile data to match expected format
      const userData: User = {
        id: profile.id,
        badge_number: profile.badge_number,
        full_name: profile.name,
        role: profile.role === 'admin' ? 'admin' : 'staff',
        rank: profile.rank || 'Officer',
        station_id: profile.station_id,
        phone: profile.phone,
        email: user.email
      }

      // Log successful login
      logSecurityEvent('login_success', 'authentication', userData.id, {
        badgeNumber: userData.badge_number,
        role: userData.role
      });

      // Reset login attempts on success
      setLoginAttempts(0);
      rateLimiter.reset(clientId);

      showNotification('Login successful!', 'success')
      setTimeout(() => {
        onLogin(userData)
      }, 1000)

    } catch (error: any) {
      console.error('Login error:', error)
      
      // Increment login attempts
      setLoginAttempts(prev => {
        const newAttempts = prev + 1;
        if (newAttempts >= SECURITY_CONFIG.maxLoginAttempts) {
          setIsBlocked(true);
          setBlockTimeRemaining(300); // 5 minutes
        }
        return newAttempts;
      });

      // Log failed login attempt
      logSecurityEvent('login_failed', 'authentication', undefined, {
        badgeNumber: formData.badgeId,
        error: error.message,
        attempts: loginAttempts + 1
      });
      
      // Handle specific error messages
      let errorMessage = 'Login failed. Please try again.'
      
      if (error.message === 'Invalid badge number') {
        errorMessage = 'Invalid badge number. Please check and try again.'
      } else if (error.message === 'Invalid login credentials') {
        errorMessage = 'Invalid password. Please check and try again.'
      } else if (error.message === 'Profile not found') {
        errorMessage = 'User profile not found. Please contact administrator.'
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Too many attempts. Please wait before trying again.'
      }
      
      showNotification(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    
    // Sanitize input as user types
    const sanitizedValue = sanitizeInput(value);
    
    setFormData({
      ...formData,
      [name]: sanitizedValue
    })
  }

  const togglePasswordVisibility = (): void => {
    setShowPassword(!showPassword);
  }

  return (
    <div className="login-container">
      <div className="emblem-bg" />
      <div className="login-card transform transition duration-500 ease-out animate-fade-in">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-b from-navy to-[#0f2951] flex items-center justify-center mb-3">
              <Shield className="text-white" size={40} />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-navy uppercase">Police Attendance System</h2>
            <p className="text-sm text-gray-500 mt-1">Secure government attendance and reporting</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            <label className="block text-xs text-gray-500 mb-2">Username</label>
            <input name="badgeId" value={formData.badgeId} onChange={handleChange} required
              className="w-full px-3 py-2 rounded-lg border-2 border-golden focus:border-navy outline-none mb-3 text-sm" placeholder="Enter badge id" />

            <label className="block text-xs text-gray-500 mb-2">Password</label>
            <div className="relative">
              <input name="password" value={formData.password} onChange={handleChange} required type={showPassword ? 'text' : 'password'}
                className="w-full px-3 py-2 rounded-lg border-2 border-golden focus:border-navy outline-none text-sm" placeholder="Password" />
              <button type="button" onClick={togglePasswordVisibility} className="absolute right-3 top-2 text-gray-600">
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            <button type="submit" disabled={loading || isBlocked}
              className="mt-5 w-full bg-navy text-white py-2.5 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition text-sm">
              {isBlocked ? `Blocked (${Math.ceil(blockTimeRemaining/60)}m)` : loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="flex justify-between mt-3 text-sm">
              <a href="#" onClick={(e) => { e.preventDefault(); showNotification('Feature coming soon!', 'info') }} className="text-golden">Forgot Username?</a>
              <a href="#" onClick={(e) => { e.preventDefault(); showNotification('Feature coming soon!', 'info') }} className="text-gray-500">Forgot Password?</a>
            </div>
          </form>

          <div className="text-center text-xs text-gray-400 mt-6">GOVERNMENT OF [REPUBLIC OF NAME] • © 2024</div>

          <div className={`notification ${notification.type} ${notification.show ? 'show' : ''}`}>
            {notification.message}
          </div>
        </div>
    </div>
  )
}

export default Login