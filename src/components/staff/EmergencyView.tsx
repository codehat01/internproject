import React from 'react';
import { User as UserType } from '../../types';

interface EmergencyViewProps {
  user: UserType;
}

const EmergencyView: React.FC<EmergencyViewProps> = ({ user }) => {
  const handleEmergencyAlert = () => {
    if (window.confirm('Are you sure you want to send an emergency alert?')) {
      alert('Emergency alert sent to control room!');
    }
  };

  return (
    <div>
      <h2 style={{ color: 'var(--navy-blue)', marginBottom: '30px' }}>Emergency Contacts & Protocols</h2>
      <div className="card">
        <h3 className="card-title" style={{ color: 'var(--red)' }}>Emergency Response System</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '20px', backgroundColor: '#fadbd8', borderRadius: '10px', borderLeft: '5px solid var(--red)' }}>
            <h4 style={{ color: 'var(--red)', marginBottom: '10px' }}>Emergency Control Room</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>100</p>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#fdf2e9', borderRadius: '10px', borderLeft: '5px solid var(--golden)' }}>
            <h4 style={{ color: 'var(--golden)', marginBottom: '10px' }}>Fire Department</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>101</p>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#d5f4e6', borderRadius: '10px', borderLeft: '5px solid var(--green)' }}>
            <h4 style={{ color: 'var(--green)', marginBottom: '10px' }}>Medical Emergency</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>108</p>
          </div>
        </div>
        <div style={{ marginTop: '30px' }}>
          <button 
            className="btn" 
            style={{ backgroundColor: 'var(--red)', color: 'white', width: '100%', padding: '20px', fontSize: '18px' }}
            onClick={handleEmergencyAlert}
          >
            EMERGENCY ALERT
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyView;