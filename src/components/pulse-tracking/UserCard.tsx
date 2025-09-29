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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'On Leave':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Absent':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'On Duty':
        return <Shield className="w-3 h-3" />;
      case 'On Leave':
        return <Calendar className="w-3 h-3" />;
      case 'Absent':
        return <Clock className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  return (
    <motion.div
      whileHover={{ 
        scale: 1.05,
        y: -5,
        boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }}
      onClick={onClick}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:border-blue-200 transition-all duration-300"
    >
      {/* Profile Picture */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          {/* Status Indicator */}
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
            user.status === 'On Duty' ? 'bg-green-500' :
            user.status === 'On Leave' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
        </div>
      </div>

      {/* User Info */}
      <div className="text-center space-y-3">
        <div>
          <h3 className="font-bold text-gray-900 text-lg leading-tight">
            {user.full_name}
          </h3>
          <p className="text-sm text-gray-600 font-medium">
            {user.badge_number}
          </p>
          {user.rank && (
            <p className="text-xs text-gray-500 mt-1">
              {user.rank}
            </p>
          )}
        </div>

        {/* Status Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(user.status)}`}>
          {getStatusIcon(user.status)}
          {user.status}
        </div>

        {/* Last Seen */}
        {user.lastSeen && (
          <p className="text-xs text-gray-400">
            Last seen: {new Date(user.lastSeen).toLocaleTimeString()}
          </p>
        )}

        {/* Department */}
        {user.department && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {user.department}
            </p>
          </div>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-yellow-500/5 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
};

export default UserCard;