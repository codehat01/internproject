import React, { useState } from 'react'
import { Shield, ArrowRight, Building2 } from 'lucide-react'

interface Props {
  onEnter: () => void;
}

const Landing: React.FC<Props> = ({ onEnter }) => {
  const [exiting, setExiting] = useState(false)

  const handleEnter = () => {
    setExiting(true)
    // wait for animation
    setTimeout(() => onEnter(), 500)
  }

  const landingStyle = {
    position: 'fixed' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    background: 'linear-gradient(135deg, #0a1f44 0%, #1e40af 50%, #0f2951 100%)',
    opacity: exiting ? 0 : 1,
    transition: 'opacity 500ms ease',
    pointerEvents: exiting ? 'none' as const : 'auto' as const
  }

  const backgroundStyle = {
    position: 'absolute' as const,
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 600'%3E%3Crect width='1200' height='600' fill='none'/%3E%3Cg fill='%23ffffff' opacity='0.1'%3E%3Crect x='50' y='200' width='300' height='250' rx='8'/%3E%3Crect x='400' y='150' width='250' height='300' rx='8'/%3E%3Crect x='700' y='180' width='200' height='270' rx='8'/%3E%3Crect x='950' y='220' width='180' height='230' rx='8'/%3E%3Cpath d='M400 150 L450 100 L500 150 Z'/%3E%3Cpath d='M700 180 L750 130 L800 180 Z'/%3E%3Ccircle cx='175' cy='180' r='15'/%3E%3Ccircle cx='525' cy='130' r='12'/%3E%3Ccircle cx='825' cy='160' r='10'/%3E%3C/g%3E%3C/svg%3E")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }

  const headerStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    background: 'rgba(10, 31, 68, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '4px solid #d4af37',
    zIndex: 10
  }

  const cardStyle = {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '900px',
    width: '90%',
    margin: '80px auto 40px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
    position: 'relative' as const,
    zIndex: 5,
    marginBottom: '120px'
  }

  const headerCardStyle = {
    background: 'linear-gradient(135deg, #0a1f44 0%, #0f2951 100%)',
    color: '#ffffff',
    padding: '30px',
    borderRadius: '16px 16px 0 0',
    margin: '-40px -40px 30px -40px',
    textAlign: 'center' as const
  }

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 60px',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ffffff',
    background: 'linear-gradient(135deg, #0a1f44 0%, #0f2951 100%)',
    border: '3px solid #d4af37',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    gap: '12px',
    boxShadow: '0 8px 25px rgba(10, 31, 68, 0.4)',
    minHeight: '64px',
    position: 'relative' as const,
    zIndex: 10
  }

  const footerStyle = {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(55, 65, 81, 0.95)',
    backdropFilter: 'blur(10px)',
    textAlign: 'center' as const,
    padding: '12px',
    color: '#d1d5db',
    fontSize: '14px'
  }

  return (
    <div style={landingStyle}>
      {/* Background */}
      <div style={backgroundStyle} />
      
      {/* Government Header */}
      <div style={headerStyle}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                background: '#ffffff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Shield style={{ color: '#0a1f44' }} size={24} />
              </div>
              <div style={{ color: '#ffffff' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>GOVERNMENT OF INDIA</div>
                <div style={{ fontSize: '14px', color: '#bfdbfe' }}>Ministry of Home Affairs</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
              <Building2 size={20} />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Police Department Portal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ width: '100%', maxWidth: '1200px', padding: '0 24px', marginTop: '60px', overflowY: 'auto', height: 'calc(100vh - 140px)' }}>
        <div style={cardStyle}>
          {/* Header Section */}
          <div style={headerCardStyle}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'rgba(255,255,255,0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 20px',
              backdropFilter: 'blur(10px)'
            }}>
              <Shield style={{ color: '#ffffff' }} size={36} />
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 8px 0', letterSpacing: '1px' }}>
              POLICE ATTENDANCE SYSTEM
            </h1>
            <p style={{ fontSize: '18px', color: '#bfdbfe', margin: 0 }}>
              Secure Digital Attendance Management Portal
            </p>
          </div>

          {/* Content Section */}
          <div style={{ textAlign: 'center' as const }}>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#0a1f44', marginBottom: '16px' }}>
                Welcome to the Official Police Department Attendance Portal
              </h2>
              <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.6', maxWidth: '700px', margin: '0 auto' }}>
                This is a secure, government-grade digital platform designed for law enforcement 
                personnel to manage attendance records with the highest standards of security and reliability.
              </p>
            </div>

            {/* Features Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '24px', 
              margin: '32px 0' 
            }}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%', 
                  background: '#dcfce7', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 16px'
                }}>
                  <Shield style={{ color: '#16a34a' }} size={28} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0a1f44', marginBottom: '8px' }}>
                  Secure Access
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  End-to-end encryption
                </p>
              </div>
              
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%', 
                  background: '#dbeafe', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 16px'
                }}>
                  <Building2 style={{ color: '#2563eb' }} size={28} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0a1f44', marginBottom: '8px' }}>
                  Department Wide
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  All stations connected
                </p>
              </div>
              
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%', 
                  background: '#f3e8ff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 16px'
                }}>
                  <ArrowRight style={{ color: '#9333ea' }} size={28} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0a1f44', marginBottom: '8px' }}>
                  Real-time
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  Instant updates
                </p>
              </div>
            </div>

            {/* Main CTA Button */}
            <div style={{ paddingTop: '40px', paddingBottom: '40px' }}>
              <button 
                onClick={handleEnter}
                style={buttonStyle}
                onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLButtonElement
                  target.style.transform = 'translateY(-3px) scale(1.05)'
                  target.style.boxShadow = '0 15px 40px rgba(10, 31, 68, 0.6)'
                  target.style.background = 'linear-gradient(135deg, #0f2951 0%, #1e3a8a 100%)'
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLButtonElement
                  target.style.transform = 'translateY(0) scale(1)'
                  target.style.boxShadow = '0 8px 25px rgba(10, 31, 68, 0.4)'
                  target.style.background = 'linear-gradient(135deg, #0a1f44 0%, #0f2951 100%)'
                }}
                onMouseDown={(e) => {
                  const target = e.currentTarget as HTMLButtonElement
                  target.style.transform = 'translateY(1px) scale(0.98)'
                }}
                onMouseUp={(e) => {
                  const target = e.currentTarget as HTMLButtonElement
                  target.style.transform = 'translateY(-3px) scale(1.05)'
                }}
              >
                <span>ACCESS SYSTEM</span>
                <ArrowRight size={24} />
              </button>
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '20px', margin: '20px 0 0 0' }}>
                Authorized personnel only • Secure login required
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <p style={{ margin: 0 }}>
          © 2024 Government of India, Ministry of Home Affairs - All Rights Reserved
        </p>
      </div>
    </div>
  )
}

export default Landing