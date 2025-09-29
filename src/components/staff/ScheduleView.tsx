import React from 'react';
import { User as UserType } from '../../types';

interface ScheduleViewProps {
  user: UserType;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ user }) => {
  return (
    <div>
      <h2 style={{ color: 'var(--navy-blue)', marginBottom: '30px' }}>Work Schedule</h2>
      <div className="card">
        <h3 className="card-title">Your Weekly Schedule</h3>
        <p style={{ color: 'var(--dark-gray)', marginBottom: '20px' }}>Your upcoming shifts and schedule</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '15px' }}>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'var(--navy-blue)', color: 'white', borderRadius: '10px' }}>
            <h4>Mon</h4>
            <p>09:00-17:00</p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'var(--navy-blue)', color: 'white', borderRadius: '10px' }}>
            <h4>Tue</h4>
            <p>09:00-17:00</p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'var(--navy-blue)', color: 'white', borderRadius: '10px' }}>
            <h4>Wed</h4>
            <p>09:00-17:00</p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'var(--navy-blue)', color: 'white', borderRadius: '10px' }}>
            <h4>Thu</h4>
            <p>09:00-17:00</p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'var(--navy-blue)', color: 'white', borderRadius: '10px' }}>
            <h4>Fri</h4>
            <p>09:00-17:00</p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'var(--dark-gray)', color: 'white', borderRadius: '10px' }}>
            <h4>Sat</h4>
            <p>Off</p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'var(--dark-gray)', color: 'white', borderRadius: '10px' }}>
            <h4>Sun</h4>
            <p>Off</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleView;