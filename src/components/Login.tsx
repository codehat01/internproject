import React, { useState, useEffect } from 'react'
import { Shield, Eye, EyeOff, User, Lock, Mail } from 'lucide-react'
import { validateBadgeNumber, validatePassword } from '../lib/auth'
import { sanitizeInput, rateLimiter, logSecurityEvent, SECURITY_CONFIG } from '../lib/security'
import { LoginFormData, LoginProps, Notification, User as UserType } from '../types'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { signInWithBadge } = useAuth() as any
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
  const [isGmailSignup, setIsGmailSignup] = useState<boolean>(false)
  const [gmailEmail, setGmailEmail] = useState<string>('')
  const [gmailPassword, setGmailPassword] = useState<string>('')
  const [gmailConfirmPassword, setGmailConfirmPassword] = useState<string>('')

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

  // Real Supabase authentication with badge number via hook wrapper
  const result = await signInWithBadge(sanitizedBadgeId, sanitizedPassword)

      if (!result || result.error) {
        setLoginAttempts(prev => prev + 1);
        showNotification(result?.error?.message || 'Login failed', 'error')
        setLoading(false)
        return
      }

      const userData: UserType = result.user as UserType

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

  const handleGmailSignup = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()

    if (isBlocked) {
      const minutes = Math.ceil(blockTimeRemaining / 60);
      showNotification(`Too many attempts. Please try again in ${minutes} minute(s).`, 'error');
      return;
    }

    setLoading(true)

    try {
      const sanitizedEmail = sanitizeInput(gmailEmail.trim().toLowerCase());
      const sanitizedPassword = sanitizeInput(gmailPassword);
      const sanitizedConfirmPassword = sanitizeInput(gmailConfirmPassword);

      if (!sanitizedEmail || !sanitizedPassword || !sanitizedConfirmPassword) {
        showNotification('Please fill all fields!', 'error')
        setLoading(false)
        return
      }

      if (!sanitizedEmail.endsWith('@gmail.com')) {
        showNotification('Only Gmail addresses are allowed!', 'error')
        setLoading(false)
        return
      }

      if (sanitizedPassword !== sanitizedConfirmPassword) {
        showNotification('Passwords do not match!', 'error')
        setLoading(false)
        return
      }

      if (sanitizedPassword.length < 8) {
        showNotification('Password must be at least 8 characters long!', 'error')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: sanitizedPassword,
      })

      if (error) {
        showNotification(error.message, 'error')
        setLoading(false)
        return
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            email: sanitizedEmail,
            full_name: sanitizedEmail.split('@')[0],
            role: 'staff',
            badge_number: `GMAIL-${Date.now()}`,
            department: 'General',
            rank: 'Officer'
          }])

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }

        showNotification('Account created successfully! Please login.', 'success')
        setTimeout(() => {
          setIsGmailSignup(false)
          setGmailEmail('')
          setGmailPassword('')
          setGmailConfirmPassword('')
        }, 1500)
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      showNotification('Failed to create account. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (): void => {
    setShowPassword(!showPassword);
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-emblem">
            <Shield size={32} />
          </div>
          <h2 className="login-title">POLICE ATTENDANCE SYSTEM</h2>
          <p className="login-subtitle">Secure government attendance and reporting</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Badge ID</label>
            <div className="input-wrapper">
              <User size={20} className="input-icon" />
              <input 
                name="badgeId" 
                value={formData.badgeId} 
                onChange={handleChange} 
                required
                className="form-input" 
                placeholder="Enter your badge ID" 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                required 
                type={showPassword ? 'text' : 'password'}
                className="form-input" 
                placeholder="Enter your password" 
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility} 
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || isBlocked}
            className="login-btn"
          >
            {isBlocked ? `Blocked (${Math.ceil(blockTimeRemaining/60)}m)` : loading ? 'Logging in...' : 'LOGIN'}
          </button>
        </form>

        {!isGmailSignup && (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--dark-gray)' }}></div>
              <span style={{ padding: '0 10px', color: 'var(--dark-gray)', fontSize: '14px' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--dark-gray)' }}></div>
            </div>
            <button
              type="button"
              onClick={() => setIsGmailSignup(true)}
              className="btn btn-secondary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              <Mail size={20} />
              Sign up with Gmail
            </button>
          </div>
        )}

        {isGmailSignup && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ color: 'var(--navy-blue)', marginBottom: '20px', fontSize: '18px', fontWeight: '600', textAlign: 'center' }}>Create Gmail Account</h3>
            <form onSubmit={handleGmailSignup}>
              <div className="form-group">
                <label className="form-label">Gmail Address</label>
                <div className="input-wrapper">
                  <Mail size={20} className="input-icon" />
                  <input
                    type="email"
                    value={gmailEmail}
                    onChange={(e) => setGmailEmail(e.target.value)}
                    required
                    className="form-input"
                    placeholder="yourname@gmail.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrapper">
                  <Lock size={20} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={gmailPassword}
                    onChange={(e) => setGmailPassword(e.target.value)}
                    required
                    className="form-input"
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="password-toggle"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <Lock size={20} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={gmailConfirmPassword}
                    onChange={(e) => setGmailConfirmPassword(e.target.value)}
                    required
                    className="form-input"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || isBlocked}
                className="login-btn"
              >
                {loading ? 'Creating Account...' : 'SIGN UP'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsGmailSignup(false)
                  setGmailEmail('')
                  setGmailPassword('')
                  setGmailConfirmPassword('')
                }}
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '10px' }}
              >
                Back to Login
              </button>
            </form>
          </div>
        )}

        <div className="login-footer">
          @carapace 2025
        </div>

        <div className={`notification ${notification.type} ${notification.show ? 'show' : ''}`}>
          {notification.message}
        </div>
      </div>
    </div>
  )
}

export default Login