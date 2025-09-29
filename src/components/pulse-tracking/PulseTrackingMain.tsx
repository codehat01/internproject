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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      padding: 'clamp(15px, 4vw, 30px)'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          {selectedUser ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <UserDetailPage 
                badgeNumber={selectedUser} 
                onBack={handleBack}
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
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