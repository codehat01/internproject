import React, { useState } from 'react'
import { Shield, ArrowRight } from 'lucide-react'

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

  return (
    <div 
      className="landing-page"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backgroundImage: `linear-gradient(rgba(10, 31, 68, 0.7), rgba(10, 31, 68, 0.8)), url('https://pragativadi.com/wp-content/uploads/2025/07/Odisha-News.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 500ms ease',
        pointerEvents: exiting ? 'none' : 'auto'
      }}
    >
      {/* Main Content */}
      <div className="landing-content">
        {/* Hollow Text Title */}
        <h1 className="landing-hollow-title">
          POLICE ATTENDANCE SYSTEM
        </h1>
        
        {/* Subtitle */}
        <p className="landing-subtitle">
          Secure Digital Attendance Management Portal
        </p>
        
        {/* Enter Button */}
        <button 
          onClick={handleEnter}
          className="landing-enter-btn"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'
            e.currentTarget.style.boxShadow = '0 15px 40px rgba(212, 175, 55, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(212, 175, 55, 0.3)'
          }}
        >
          <Shield size={24} />
          <span>ACCESS SYSTEM</span>
          <ArrowRight size={24} />
        </button>
        
        {/* Security Notice */}
        <p className="landing-notice">
          Authorized personnel only • Secure login required
        </p>
      </div>

      {/* Footer */}
      <div className="landing-footer">
        © 2025 Government of India, Ministry of Home Affairs - All Rights Reserved
      </div>
    </div>
  )
}

export default Landing