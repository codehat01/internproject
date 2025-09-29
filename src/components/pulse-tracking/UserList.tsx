import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ListFilter as Filter, Users, Activity, Calendar, Shield } from 'lucide-react';
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
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pulse data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading data: {error}</div>
        <button 
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-gray-900 mb-2"
        >
          Pulse Tracking System
        </motion.h1>
        <p className="text-gray-600">Real-time staff monitoring and attendance tracking</p>
      </div>

      {/* Stats Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.total}</p>
              <p className="text-sm text-gray-600">Total Staff</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">{statusCounts.onDuty}</p>
              <p className="text-sm text-gray-600">On Duty</p>
            </div>
            <Shield className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-yellow-600">{statusCounts.onLeave}</p>
              <p className="text-sm text-gray-600">On Leave</p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-600">{statusCounts.absent}</p>
              <p className="text-sm text-gray-600">Absent</p>
            </div>
            <Activity className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or badge number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white min-w-40"
            >
              <option value="all">All Status</option>
              <option value="On Duty">On Duty</option>
              <option value="On Leave">On Leave</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredUsers.length} of {users.length} staff members
        </div>
      </motion.div>

      {/* User Cards Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
      >
        <AnimatePresence>
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
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
          className="text-center py-12"
        >
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No staff found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </motion.div>
      )}
    </div>
  );
};

export default UserList;