import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UserList from './UserList';
import UserDetailPage from './UserDetailPage';

const PulseTrackingMain: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const handleUserSelect = (badgeNumber: string) => {
    setSelectedUser(badgeNumber);
  };

  const handleBack = () => {
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {selectedUser ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <UserDetailPage 
                badgeNumber={selectedUser} 
                onBack={handleBack}
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <UserList onUserSelect={handleUserSelect} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PulseTrackingMain;