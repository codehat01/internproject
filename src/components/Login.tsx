import React, { useState, useEffect } from 'react'
import { Shield, Eye, EyeOff, User, Lock, Mail, Phone, Building, Camera } from 'lucide-react'
import { validateBadgeNumber, validatePassword } from '../lib/auth'
import { sanitizeInput, rateLimiter, logSecurityEvent, SECURITY_CONFIG } from '../lib/security'
import { LoginFormData, LoginProps, Notification, User as UserType } from '../types'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const RANKS = ['Constable', 'Head Constable', 'Sub Inspector']
const DEPARTMENTS = ['General', 'Traffic', 'Investigation', 'Patrol', 'Administration', 'Cyber Crime', 'Special Branch']

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
  const [showSignup, setShowSignup] = useState<boolean>(false)

  const [signupData, setSignupData] = useState({
    badgeNumber: '',
    fullName: '',
    rank: 'Constable',
    email: '',
    phone: '',
    department: 'General',
    profilePhoto: null as File | null,
    profilePhotoPreview: '' as string,
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    const clientId = 'login_attempt';
    const isAllowed = rateLimiter.isAllowed(clientId, SECURITY_CONFIG.maxLoginAttempts, 5 * 60 * 1000);

    if (!isAllowed) {
      setIsBlocked(true);
      setBlockTimeRemaining(300);

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

    if (isBlocked) {
      const minutes = Math.ceil(blockTimeRemaining / 60);
      showNotification(`Too many login attempts. Please try again in ${minutes} minute(s).`, 'error');
      return;
    }

    setLoading(true)

    try {
      const sanitizedBadgeId = sanitizeInput(formData.badgeId.trim());
      const sanitizedPassword = sanitizeInput(formData.password);

      if (!sanitizedBadgeId || !sanitizedPassword) {
        showNotification('Please enter Badge ID and Password!', 'error')
        setLoading(false)
        return
      }

      const validatedBadge = validateBadgeNumber(sanitizedBadgeId);
      if (!validatedBadge) {
        showNotification('Invalid badge number format. Badge must be 3-20 alphanumeric characters.', 'error');
        setLoading(false);
        return;
      }

      const clientId = 'login_attempt';
      if (!rateLimiter.isAllowed(clientId, SECURITY_CONFIG.maxLoginAttempts, 5 * 60 * 1000)) {
        setIsBlocked(true);
        setBlockTimeRemaining(300);
        showNotification('Too many login attempts. Please try again later.', 'error');
        setLoading(false);
        return;
      }

      logSecurityEvent('login_attempt', 'authentication', undefined, {
        badgeNumber: sanitizedBadgeId,
        timestamp: new Date().toISOString()
      });

      const result = await signInWithBadge(sanitizedBadgeId, sanitizedPassword)

      if (!result || result.error) {
        setLoginAttempts(prev => prev + 1);
        showNotification(result?.error?.message || 'Login failed', 'error')
        setLoading(false)
        return
      }

      const userData: UserType = result.user as UserType

      logSecurityEvent('login_success', 'authentication', userData.id, {
        badgeNumber: userData.badge_number,
        role: userData.role
      });

      setLoginAttempts(0);
      rateLimiter.reset(clientId);

      showNotification('Login successful!', 'success')
      setTimeout(() => {
        onLogin(userData)
      }, 1000)

    } catch (error: any) {
      console.error('Login error:', error)

      setLoginAttempts(prev => {
        const newAttempts = prev + 1;
        if (newAttempts >= SECURITY_CONFIG.maxLoginAttempts) {
          setIsBlocked(true);
          setBlockTimeRemaining(300);
        }
        return newAttempts;
      });

      logSecurityEvent('login_failed', 'authentication', undefined, {
        badgeNumber: formData.badgeId,
        error: error.message,
        attempts: loginAttempts + 1
      });

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
    const sanitizedValue = sanitizeInput(value);
    setFormData({
      ...formData,
      [name]: sanitizedValue
    })
  }

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setSignupData(prev => ({
      ...prev,
      [name]: sanitizeInput(value)
    }))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Photo size must be less than 5MB', 'error')
        return
      }

      setSignupData(prev => ({
        ...prev,
        profilePhoto: file,
        profilePhotoPreview: URL.createObjectURL(file)
      }))
    }
  }

  const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()

    if (isBlocked) {
      const minutes = Math.ceil(blockTimeRemaining / 60);
      showNotification(`Too many attempts. Please try again in ${minutes} minute(s).`, 'error');
      return;
    }

    setLoading(true)

    try {
      if (!signupData.badgeNumber || !signupData.fullName || !signupData.email || !signupData.password) {
        showNotification('Please fill all required fields!', 'error')
        setLoading(false)
        return
      }

      if (!signupData.email.endsWith('@gmail.com')) {
        showNotification('Only Gmail addresses (@gmail.com) are allowed!', 'error')
        setLoading(false)
        return
      }

      if (signupData.password !== signupData.confirmPassword) {
        showNotification('Passwords do not match!', 'error')
        setLoading(false)
        return
      }

      if (signupData.password.length < 8) {
        showNotification('Password must be at least 8 characters long!', 'error')
        setLoading(false)
        return
      }

      let photoUrl = null
      if (signupData.profilePhoto) {
        const fileExt = signupData.profilePhoto.name.split('.').pop()
        const fileName = `${signupData.badgeNumber}-${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, signupData.profilePhoto)

        if (uploadError) {
          console.warn('Photo upload failed, continuing without photo:', uploadError)
        } else if (uploadData) {
          const { data: urlData } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(uploadData.path)
          photoUrl = urlData.publicUrl
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
      })

      if (error) {
        showNotification(error.message, 'error')
        setLoading(false)
        return
      }

      if (data.user) {
        const { error: profileError } =.from('profiles')
          .update({
            email: signupData.email,
            full_name: signupData.fullName,
            badge_number: signupData.badgeNumber,
            rank: signupData.rank,
            role: 'staff',
            department: signupData.department,
            phone: signupData.phone || null,
            profile_photo_url: photoUrl
          })
         .eq('id', data.user.id)

        if (profileError) {
          console.error('Profile creation error:', profileError)
          showNotification('Account created but profile setup failed. Please contact admin.', 'error')
        } else {
          showNotification('Signup successful! You can now log in.', 'success')
          setTimeout(() => {
            setShowSignup(false)
            setSignupData({
              badgeNumber: '',
              fullName: '',
              rank: 'Constable',
              email: '',
              phone: '',
              department: 'General',
              profilePhoto: null,
              profilePhotoPreview: '',
              password: '',
              confirmPassword: ''
            })
          }, 1500)
        }
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

        <div style={{ position: 'relative', overflow: 'hidden', minHeight: '500px' }}>
          <div
            style={{
              display: 'flex',
              width: '200%',
              transform: showSignup ? 'translateX(-50%)' : 'translateX(0)',
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div style={{ width: '50%', padding: '0 10px' }}>
              <h3 style={{ color: 'var(--navy-blue)', marginBottom: '20px', fontSize: '20px', fontWeight: '700', textAlign: 'center' }}>Login</h3>
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

                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--dark-gray)' }}></div>
                    <span style={{ padding: '0 10px', color: 'var(--dark-gray)', fontSize: '14px' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--dark-gray)' }}></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSignup(true)}
                    className="btn btn-secondary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  >
                    <User size={20} />
                    Sign up
                  </button>
                </div>
              </form>
            </div>

            <div style={{ width: '50%', padding: '0 10px' }}>
              <h3 style={{ color: 'var(--navy-blue)', marginBottom: '20px', fontSize: '20px', fontWeight: '700', textAlign: 'center' }}>Create Account</h3>
              <form onSubmit={handleSignupSubmit} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label className="form-label">Badge Number*</label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                      type="text"
                      name="badgeNumber"
                      value={signupData.badgeNumber}
                      onChange={handleSignupChange}
                      required
                      className="form-input"
                      placeholder="Your badge number"
                      style={{ fontSize: '14px', padding: '10px 10px 10px 40px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label className="form-label">Full Name*</label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                      type="text"
                      name="fullName"
                      value={signupData.fullName}
                      onChange={handleSignupChange}
                      required
                      className="form-input"
                      placeholder="Your full name"
                      style={{ fontSize: '14px', padding: '10px 10px 10px 40px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label className="form-label">Rank*</label>
                  <div className="input-wrapper">
                    <Shield size={18} className="input-icon" />
                    <select
                      name="rank"
                      value={signupData.rank}
                      onChange={handleSignupChange}
                      required
                      className="form-input"
                      style={{ fontSize: '14px', padding: '10px 10px 10px 40px' }}
                    >
                      {RANKS.map(rank => (
                        <option key={rank} value={rank}>{rank}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label className="form-label">Role</label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                      type="text"
                      value="Staff"
                      disabled
                      className="form-input"
                      style={{ fontSize: '14px', padding: '10px 10px 10px 40px', background: '#f0f0f0', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label className="form-label">Email* (Gmail only)</label>
                  <div className="input-wrapper">
                    <Mail size={18} className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      value={signupData.email}
                      onChange={handleSignupChange}
                      required
                      className="form-input"
                      placeholder="yourname@gmail.com"
                      style={{ fontSize: '14px', padding: '10px 10px 10px 40px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label className="form-label">Phone</label>
                  <div className="input-wrapper">
                    <Phone size={18} className="input-icon" />
                    <input
                      type="tel"
                      name="phone"
                      value={signupData.phone}
                      onChange={handleSignupChange}
                      className="form-input"
                      placeholder="Your phone number"
                      style={{ fontSize: '14px', padding: '10px 10px 10px 40px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label className="form-label">Department*</label>
                  <div className="input-wrapper">
                    <Building size={18} className="input-icon" />
                    <select
                      name="department"
                      value={signupData.department}
                      onChange={handleSignupChange}
                      required
                      className="form-input"
                      style={{ fontSize: '14px', padding: '10px 10px 10px 40px' }}
                    >
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label className="form-label">Profile Photo</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {signupData.profilePhotoPreview && (
                      <img
                        src={signupData.profilePhotoPreview}
                        alt="Preview"
                        style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--navy-blue)' }}
                      />
                    )}
                    <label
                      htmlFor="photo-upload"
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px',
                        border: '2px dashed var(--dark-gray)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: 'var(--dark-gray)',
                        background: 'var(--light-gray)'
                      }}
                    >
                      <Camera size={20} />
                      <span>{signupData.profilePhoto ? signupData.profilePhoto.name : 'Upload photo'}</span>
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label className="form-label">Password*</label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={signupData.password}
                      onChange={handleSignupChange}
                      required
                      className="form-input"
                      placeholder="At least 8 characters"
                      style={{ fontSize: '14px', padding: '10px 40px 10px 40px' }}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="password-toggle"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Confirm Password*</label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={signupData.confirmPassword}
                      onChange={handleSignupChange}
                      required
                      className="form-input"
                      placeholder="Confirm your password"
                      style={{ fontSize: '14px', padding: '10px 10px 10px 40px' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || isBlocked}
                  className="login-btn"
                  style={{ marginBottom: '10px' }}
                >
                  {loading ? 'Creating Account...' : 'SIGN UP'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowSignup(false)}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  Back to Login
                </button>
              </form>
            </div>
          </div>
        </div>

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
