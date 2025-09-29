import React from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Clock, Calendar } from 'lucide-react';
import type { PulseUser } from './hooks/usePulseData';

interface UserCardProps {
  user: PulseUser;
  onClick: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Duty':
        return 'status-present';
      case 'On Leave':
        return 'status-late';
      case 'Absent':
        return 'status-absent';
      default:
        return 'status-absent';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'On Duty':
        return <Shield size={14} />;
      case 'On Leave':
        return <Calendar size={14} />;
      case 'Absent':
        return <Clock size={14} />;
      default:
        return <User size={14} />;
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'On Duty':
        return 'var(--green)';
      case 'On Leave':
        return 'var(--golden)';
      case 'Absent':
        return 'var(--red)';
      default:
        return 'var(--dark-gray)';
    }
  };

  return (
    <motion.div
      whileHover={{ 
        scale: 1.05,
        y: -8,
        boxShadow: "0 25px 50px rgba(10, 31, 68, 0.2)"
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }}
      onClick={onClick}
      className="card"
      style={{
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        border: '2px solid transparent',
        background: 'linear-gradient(135deg, var(--white) 0%, #f8f9fa 100%)',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--golden)';
        e.currentTarget.style.transform = 'translateY(-5px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'transparent';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Profile Picture */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <div 
            className="profile-img"
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, var(--navy-blue), #0f2951)',
              fontSize: '24px',
              boxShadow: '0 10px 30px rgba(10, 31, 68, 0.3)',
              border: '4px solid var(--white)'
            }}
          >
            {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          {/* Status Indicator */}
          <div 
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '3px solid var(--white)',
              backgroundColor: getStatusDotColor(user.status),
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          />
        </div>
      </div>

      {/* User Info */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3 style={{ 
          color: 'var(--navy-blue)', 
          fontSize: '18px', 
          fontWeight: '700',
          marginBottom: '8px',
          lineHeight: '1.2'
        }}>
          {user.full_name}
        </h3>
        <p style={{ 
          color: 'var(--dark-gray)', 
          fontSize: '14px', 
          fontWeight: '600',
          marginBottom: '4px'
        }}>
          {user.badge_number}
        </p>
        {user.rank && (
          <p style={{ 
            color: 'var(--golden)', 
            fontSize: '12px',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {user.rank}
          </p>
        )}
      </div>

      {/* Status Badge */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
        <span 
          className={`status-badge ${getStatusColor(user.status)}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '25px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {getStatusIcon(user.status)}
          {user.status}
        </span>
      </div>

      {/* Last Seen */}
      {user.lastSeen && (
        <div style={{ 
          textAlign: 'center',
          padding: '10px',
          background: 'rgba(10, 31, 68, 0.05)',
          borderRadius: '8px',
          marginBottom: '10px'
        }}>
          <p style={{ 
            color: 'var(--dark-gray)', 
            fontSize: '11px',
            margin: 0
          }}>
            Last seen: {new Date(user.lastSeen).toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Department */}
      {user.department && (
        <div style={{ 
          textAlign: 'center',
          borderTop: '1px solid #e9ecef',
          paddingTop: '12px'
        }}>
          <p style={{ 
            color: 'var(--dark-gray)', 
            fontSize: '12px',
            fontWeight: '500',
            margin: 0
          }}>
            {user.department}
          </p>
        </div>
      )}

      {/* Hover Effect Overlay */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(10, 31, 68, 0.05) 100%)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
          borderRadius: '15px'
        }}
        className="hover-overlay"
      />

      <style jsx>{`
        .card:hover .hover-overlay {
          opacity: 1;
        }
      `}</style>
    </motion.div>
  );
};

export default UserCard;