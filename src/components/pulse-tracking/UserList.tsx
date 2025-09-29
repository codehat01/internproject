import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Users, Activity, Calendar, Shield, RefreshCw } from 'lucide-react';
import { usePulseUsers } from './hooks/usePulseData';
import UserCard from './UserCard';

interface UserListProps {
  onUserSelect: (badgeNumber: string) => void;
}

const UserList: React.FC<UserListProps> = ({ onUserSelect }) => {
  const { users, loading, error, refetch } = usePulseUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.badge_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    total: users.length,
    onDuty: users.filter(u => u.status === 'On Duty').length,
    onLeave: users.filter(u => u.status === 'On Leave').length,
    absent: users.filter(u => u.status === 'Absent').length
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderRadius: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid var(--golden)',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ color: 'var(--navy-blue)', fontSize: '18px', fontWeight: '600' }}>
            Loading pulse data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ color: 'var(--red)', marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
          Error loading data: {error}
        </div>
        <button 
          onClick={refetch}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}
        >
          <RefreshCw size={18} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: '40px' }}
      >
        <h1 style={{ 
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: '900',
          color: 'var(--navy-blue)',
          marginBottom: '10px',
          textShadow: '0 4px 8px rgba(10, 31, 68, 0.1)'
        }}>
          Pulse Tracking System
        </h1>
        <p style={{ 
          color: 'var(--dark-gray)', 
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          fontWeight: '500'
        }}>
          Real-time staff monitoring and attendance tracking
        </p>
      </motion.div>

      {/* Stats Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="stats-grid"
        style={{ marginBottom: '40px' }}
      >
        <div className="stat-card" style={{ borderLeft: '5px solid var(--navy-blue)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="stat-number" style={{ color: 'var(--navy-blue)' }}>
                {statusCounts.total}
              </div>
              <div className="stat-label">Total Staff</div>
            </div>
            <Users size={48} style={{ color: 'var(--navy-blue)', opacity: 0.7 }} />
          </div>
        </div>
        
        <div className="stat-card" style={{ borderLeft: '5px solid var(--green)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="stat-number" style={{ color: 'var(--green)' }}>
                {statusCounts.onDuty}
              </div>
              <div className="stat-label">On Duty</div>
            </div>
            <Shield size={48} style={{ color: 'var(--green)', opacity: 0.7 }} />
          </div>
        </div>
        
        <div className="stat-card" style={{ borderLeft: '5px solid var(--golden)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="stat-number" style={{ color: 'var(--golden)' }}>
                {statusCounts.onLeave}
              </div>
              <div className="stat-label">On Leave</div>
            </div>
            <Calendar size={48} style={{ color: 'var(--golden)', opacity: 0.7 }} />
          </div>
        </div>
        
        <div className="stat-card" style={{ borderLeft: '5px solid var(--red)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="stat-number" style={{ color: 'var(--red)' }}>
                {statusCounts.absent}
              </div>
              <div className="stat-label">Absent</div>
            </div>
            <Activity size={48} style={{ color: 'var(--red)', opacity: 0.7 }} />
          </div>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
        style={{ marginBottom: '40px' }}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
            gap: '20px'
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={20} style={{ 
                position: 'absolute', 
                left: '15px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--dark-gray)' 
              }} />
              <input
                type="text"
                placeholder="Search by name or badge number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ 
                  paddingLeft: '50px',
                  fontSize: '16px',
                  height: '50px'
                }}
              />
            </div>

            {/* Filter */}
            <div style={{ position: 'relative', minWidth: '200px' }}>
              <Filter size={20} style={{ 
                position: 'absolute', 
                left: '15px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--dark-gray)' 
              }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-control"
                style={{ 
                  paddingLeft: '50px',
                  fontSize: '16px',
                  height: '50px'
                }}
              >
                <option value="all">All Status</option>
                <option value="On Duty">On Duty</option>
                <option value="On Leave">On Leave</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>

          <div style={{ 
            color: 'var(--dark-gray)', 
            fontSize: '14px',
            fontWeight: '500',
            padding: '10px 0',
            borderTop: '1px solid #e9ecef'
          }}>
            Showing {filteredUsers.length} of {users.length} staff members
          </div>
        </div>
      </motion.div>

      {/* User Cards Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '25px',
          marginBottom: '40px'
        }}
      >
        <AnimatePresence>
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ delay: index * 0.05 }}
            >
              <UserCard
                user={user}
                onClick={() => onUserSelect(user.badge_number)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card"
          style={{ 
            textAlign: 'center', 
            padding: '60px 40px',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
          }}
        >
          <Users size={80} style={{ color: 'var(--dark-gray)', opacity: 0.5, marginBottom: '20px' }} />
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            color: 'var(--navy-blue)', 
            marginBottom: '10px' 
          }}>
            No staff found
          </h3>
          <p style={{ color: 'var(--dark-gray)', fontSize: '16px' }}>
            Try adjusting your search or filter criteria
          </p>
        </motion.div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 15px !important;
          }
        }
        
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default UserList;