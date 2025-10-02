import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Clock, Activity, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { usePulseUserDetail } from './hooks/usePulseData';
import LocationMap from './LocationMap';

interface UserDetailPageProps {
  badgeNumber: string;
  onBack: () => void;
}

const UserDetailPage: React.FC<UserDetailPageProps> = ({ badgeNumber, onBack }) => {
  const { user, attendanceStats, leaveRequests, loading, error } = usePulseUserDetail(badgeNumber);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px' 
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
            Loading user details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ color: 'var(--red)', marginBottom: '20px', fontSize: '18px' }}>
          Error: {error || 'User not found'}
        </div>
        <button 
          onClick={onBack}
          className="btn btn-primary"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Prepare chart data
  const chartData = attendanceStats.map(stat => ({
    date: new Date(stat.date).toLocaleDateString('en-US', { weekday: 'short' }),
    hours: stat.hoursWorked,
    status: stat.status
  }));

  const statusData = [
    { name: 'Present', value: attendanceStats.filter(s => s.status === 'Present').length, color: 'var(--green)' },
    { name: 'Late', value: attendanceStats.filter(s => s.status === 'Late').length, color: 'var(--golden)' },
    { name: 'Absent', value: attendanceStats.filter(s => s.status === 'Absent').length, color: 'var(--red)' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} style={{ color: 'var(--green)' }} />;
      case 'rejected':
        return <XCircle size={16} style={{ color: 'var(--red)' }} />;
      case 'pending':
        return <AlertCircle size={16} style={{ color: 'var(--golden)' }} />;
      default:
        return <Clock size={16} style={{ color: 'var(--dark-gray)' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'status-present';
      case 'rejected':
        return 'status-absent';
      case 'pending':
        return 'status-late';
      default:
        return 'status-absent';
    }
  };

  return (
    <div>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px', 
          marginBottom: '40px' 
        }}
      >
        <button
          onClick={onBack}
          className="btn btn-primary"
          style={{ 
            padding: '12px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '900',
            color: 'var(--navy-blue)',
            marginBottom: '5px'
          }}>
            Welcome to Pulse Tracking System
          </h1>
          <p style={{ 
            color: 'var(--dark-gray)', 
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            fontWeight: '500'
          }}>
            Detailed view for {user.full_name}
          </p>
        </div>
      </motion.div>

      {/* Profile Info Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
        style={{ marginBottom: '30px' }}
      >
        <h2 className="card-title" style={{ marginBottom: '30px' }}>
          <User size={24} />
          Profile Information
        </h2>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          gap: '30px',
          alignItems: window.innerWidth < 768 ? 'center' : 'flex-start'
        }}>
          {/* Profile Picture */}
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <div style={{
              width: '120px',
              height: '120px',
              background: 'linear-gradient(135deg, var(--navy-blue), #0f2951)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--white)',
              fontSize: '36px',
              fontWeight: 'bold',
              boxShadow: '0 15px 40px rgba(10, 31, 68, 0.3)',
              border: '4px solid var(--white)',
              margin: '0 auto'
            }}>
              {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div style={{
              position: 'absolute',
              bottom: '-5px',
              right: '10px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '4px solid var(--white)',
              backgroundColor: user.status === 'On Duty' ? 'var(--green)' :
                             user.status === 'On Leave' ? 'var(--golden)' : 'var(--red)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }} />
          </div>

          {/* Profile Details */}
          <div style={{ 
            flex: 1,
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
            gap: '25px'
          }}>
            <div>
              <label style={{ 
                fontSize: '12px', 
                fontWeight: '700', 
                color: 'var(--dark-gray)', 
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '8px',
                display: 'block'
              }}>
                Full Name
              </label>
              <p style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: 'var(--navy-blue)',
                margin: 0
              }}>
                {user.full_name}
              </p>
            </div>
            
            <div>
              <label style={{ 
                fontSize: '12px', 
                fontWeight: '700', 
                color: 'var(--dark-gray)', 
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '8px',
                display: 'block'
              }}>
                Badge Number
              </label>
              <p style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: 'var(--navy-blue)',
                margin: 0
              }}>
                {user.badge_number}
              </p>
            </div>
            
            <div>
              <label style={{ 
                fontSize: '12px', 
                fontWeight: '700', 
                color: 'var(--dark-gray)', 
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '8px',
                display: 'block'
              }}>
                Rank
              </label>
              <p style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: 'var(--navy-blue)',
                margin: 0
              }}>
                {user.rank || 'Officer'}
              </p>
            </div>
            
            <div>
              <label style={{ 
                fontSize: '12px', 
                fontWeight: '700', 
                color: 'var(--dark-gray)', 
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '8px',
                display: 'block'
              }}>
                Role
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {user.role === 'admin' && <Shield size={16} style={{ color: 'var(--golden)' }} />}
                <p style={{ 
                  fontSize: '18px', 
                  fontWeight: '700', 
                  color: 'var(--navy-blue)',
                  margin: 0,
                  textTransform: 'capitalize'
                }}>
                  {user.role}
                </p>
              </div>
            </div>
            
            {user.email && (
              <div>
                <label style={{ 
                  fontSize: '12px', 
                  fontWeight: '700', 
                  color: 'var(--dark-gray)', 
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  Email
                </label>
                <p style={{ 
                  fontSize: '16px', 
                  color: 'var(--navy-blue)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Mail size={16} style={{ color: 'var(--dark-gray)' }} />
                  {user.email}
                </p>
              </div>
            )}
            
            {user.phone && (
              <div>
                <label style={{ 
                  fontSize: '12px', 
                  fontWeight: '700', 
                  color: 'var(--dark-gray)', 
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  Phone
                </label>
                <p style={{ 
                  fontSize: '16px', 
                  color: 'var(--navy-blue)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Phone size={16} style={{ color: 'var(--dark-gray)' }} />
                  {user.phone}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Attendance Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : 'repeat(2, 1fr)',
          gap: '25px',
          marginBottom: '30px'
        }}
      >
        {/* Bar Chart */}
        <div className="card">
          <h3 className="card-title">
            <Activity size={20} />
            7-Day Attendance Activity
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'var(--dark-gray)', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: 'var(--dark-gray)', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--white)',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar 
                  dataKey="hours" 
                  fill="var(--navy-blue)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h3 className="card-title">
            <Clock size={20} />
            Attendance Status Distribution
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--white)',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px', 
            marginTop: '20px',
            flexWrap: 'wrap'
          }}>
            {statusData.map((entry, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div 
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: entry.color
                  }}
                />
                <span style={{ 
                  fontSize: '14px', 
                  color: 'var(--dark-gray)',
                  fontWeight: '500'
                }}>
                  {entry.name}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Leave Requests */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
        style={{ marginBottom: '30px' }}
      >
        <h3 className="card-title">
          <Calendar size={20} />
          Leave Request History
        </h3>
        
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Dates</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <div style={{ fontWeight: '600', color: 'var(--navy-blue)' }}>
                      {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ 
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {request.reason}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ color: 'var(--dark-gray)', fontSize: '14px' }}>
                    {new Date(request.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {leaveRequests.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: 'var(--dark-gray)' 
            }}>
              No leave requests found
            </div>
          )}
        </div>
      </motion.div>

      {/* Live Location */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <h3 className="card-title">
          <MapPin size={20} />
          Live Location Tracking
        </h3>

        {user.currentLocation ? (
          <>
            <LocationMap
              latitude={user.currentLocation.latitude}
              longitude={user.currentLocation.longitude}
              accuracy={user.currentLocation.accuracy}
              userName={user.full_name}
              timestamp={user.currentLocation.timestamp}
            />

            <div style={{
              marginTop: '20px',
              padding: '20px',
              background: 'rgba(10, 31, 68, 0.05)',
              borderRadius: '12px',
              display: 'grid',
              gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
              gap: '15px'
            }}>
              <div>
                <p style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: 'var(--dark-gray)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '5px'
                }}>
                  Coordinates
                </p>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--navy-blue)',
                  fontWeight: '600',
                  margin: 0
                }}>
                  {user.currentLocation.latitude.toFixed(6)}, {user.currentLocation.longitude.toFixed(6)}
                </p>
              </div>

              {user.currentLocation.accuracy && (
                <div>
                  <p style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: 'var(--dark-gray)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '5px'
                  }}>
                    Accuracy
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--navy-blue)',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    ±{Math.round(user.currentLocation.accuracy)} meters
                  </p>
                </div>
              )}

              {user.currentLocation.timestamp && (
                <div style={{ gridColumn: window.innerWidth < 768 ? '1' : 'span 2' }}>
                  <p style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: 'var(--dark-gray)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '5px'
                  }}>
                    Last Updated
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--navy-blue)',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    {new Date(user.currentLocation.timestamp).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{
            height: '300px',
            borderRadius: '15px',
            overflow: 'hidden',
            border: '2px solid #e9ecef',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <MapPin size={48} style={{ color: 'var(--dark-gray)', marginBottom: '15px' }} />
              <p style={{ color: 'var(--dark-gray)', fontSize: '16px', fontWeight: '600' }}>
                No Location Data Available
              </p>
              <p style={{ color: 'var(--dark-gray)', fontSize: '14px' }}>
                This officer has not shared their location yet
              </p>
            </div>
          </div>
        )}
      </motion.div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UserDetailPage;