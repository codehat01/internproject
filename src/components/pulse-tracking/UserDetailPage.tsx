import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Clock, Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { usePulseUserDetail } from './hooks/usePulseData';
import 'leaflet/dist/leaflet.css';

interface UserDetailPageProps {
  badgeNumber: string;
  onBack: () => void;
}

const UserDetailPage: React.FC<UserDetailPageProps> = ({ badgeNumber, onBack }) => {
  const { user, attendanceStats, leaveRequests, loading, error } = usePulseUserDetail(badgeNumber);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error: {error || 'User not found'}</div>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
    { name: 'Present', value: attendanceStats.filter(s => s.status === 'Present').length, color: '#10B981' },
    { name: 'Late', value: attendanceStats.filter(s => s.status === 'Late').length, color: '#F59E0B' },
    { name: 'Absent', value: attendanceStats.filter(s => s.status === 'Absent').length, color: '#EF4444' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-8"
      >
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to Pulse Tracking System
          </h1>
          <p className="text-gray-600">Detailed view for {user.full_name}</p>
        </div>
      </motion.div>

      {/* Profile Info Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" />
          Profile Information
        </h2>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white ${
                user.status === 'On Duty' ? 'bg-green-500' :
                user.status === 'On Leave' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
            </div>
          </div>

          {/* Profile Details */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">{user.full_name}</p>
            </div>
            
            <div>
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Badge Number</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">{user.badge_number}</p>
            </div>
            
            <div>
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Rank</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">{user.rank || 'Officer'}</p>
            </div>
            
            <div>
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Role</label>
              <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">{user.role}</p>
            </div>
            
            {user.email && (
              <div>
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                <p className="text-lg text-gray-900 mt-1 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {user.email}
                </p>
              </div>
            )}
            
            {user.phone && (
              <div>
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
                <p className="text-lg text-gray-900 mt-1 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
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
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Bar Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            7-Day Attendance Activity
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hours" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Attendance Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
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
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {statusData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-600">{entry.name}: {entry.value}</span>
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
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Leave Request History
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Dates</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Reason</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((request) => (
                <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">
                      {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-gray-700 max-w-xs truncate">
                      {request.reason}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(request.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {leaveRequests.length === 0 && (
            <div className="text-center py-8 text-gray-500">
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
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Live Location
        </h3>
        
        <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
          <MapContainer
            center={[28.6139, 77.2090]} // Default to Delhi
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[28.6139, 77.2090]}>
              <Popup>
                {user.full_name}<br />
                Last known location
              </Popup>
            </Marker>
          </MapContainer>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> Location tracking is simulated for demo purposes. 
            In a real implementation, this would show the officer's actual GPS coordinates.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default UserDetailPage;