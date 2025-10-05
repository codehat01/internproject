import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, User, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AttendanceRecord {
  id: string;
  user_id: string;
  punch_type: 'in' | 'out';
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  compliance_status: string | null;
  profiles: {
    full_name: string;
    badge_number: string;
  };
}

interface AttendancePhotoViewProps {
  attendanceId?: string;
  onClose: () => void;
}

const AttendancePhotoView: React.FC<AttendancePhotoViewProps> = ({ attendanceId, onClose }) => {
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (attendanceId) {
      fetchAttendanceDetails();
    }
  }, [attendanceId]);

  const fetchAttendanceDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          profiles!inner(full_name, badge_number)
        `)
        .eq('id', attendanceId)
        .single();

      if (error) throw error;
      setAttendance(data as any);
    } catch (error) {
      console.error('Error fetching attendance details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!attendanceId) {
    return null;
  }

  if (loading) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        <div style={{ color: 'white', fontSize: '18px' }}>Loading...</div>
      </div>
    );
  }

  if (!attendance) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            zIndex: 1,
          }}
        >
          <h2 style={{ margin: 0, color: 'var(--navy-blue)', fontSize: '24px', fontWeight: 'bold' }}>
            Attendance Details
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '5px',
              color: 'var(--dark-gray)',
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '15px',
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                <User size={16} style={{ color: 'var(--navy-blue)' }} />
                <span style={{ fontSize: '12px', color: 'var(--dark-gray)' }}>Officer</span>
              </div>
              <div style={{ fontWeight: 'bold', color: 'var(--navy-blue)' }}>
                {attendance.profiles.full_name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--dark-gray)' }}>
                Badge: {attendance.profiles.badge_number}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                <Calendar size={16} style={{ color: 'var(--navy-blue)' }} />
                <span style={{ fontSize: '12px', color: 'var(--dark-gray)' }}>Date & Time</span>
              </div>
              <div style={{ fontWeight: 'bold', color: 'var(--navy-blue)' }}>
                {new Date(attendance.timestamp).toLocaleDateString()}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--dark-gray)' }}>
                {new Date(attendance.timestamp).toLocaleTimeString()}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                <Clock size={16} style={{ color: 'var(--navy-blue)' }} />
                <span style={{ fontSize: '12px', color: 'var(--dark-gray)' }}>Punch Type</span>
              </div>
              <div
                style={{
                  fontWeight: 'bold',
                  color: attendance.punch_type === 'in' ? 'var(--green)' : 'var(--red)',
                  textTransform: 'uppercase',
                }}
              >
                {attendance.punch_type === 'in' ? 'PUNCH IN' : 'PUNCH OUT'}
              </div>
              {attendance.compliance_status && (
                <div
                  style={{
                    fontSize: '12px',
                    color: attendance.compliance_status === 'on_time' ? 'var(--green)' : 'var(--red)',
                    textTransform: 'capitalize',
                  }}
                >
                  {attendance.compliance_status.replace('_', ' ')}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h3 style={{ color: 'var(--navy-blue)', marginBottom: '10px', fontSize: '18px' }}>
                Captured Photo
              </h3>
              {attendance.photo_url ? (
                <img
                  src={attendance.photo_url}
                  alt="Attendance Photo"
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    border: '2px solid var(--golden)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '300px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--dark-gray)',
                  }}
                >
                  No photo available
                </div>
              )}
            </div>

            <div>
              <h3
                style={{
                  color: 'var(--navy-blue)',
                  marginBottom: '10px',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <MapPin size={20} />
                Location Details
              </h3>
              {attendance.latitude && attendance.longitude ? (
                <div>
                  <div
                    style={{
                      backgroundColor: '#f5f5f5',
                      padding: '15px',
                      borderRadius: '8px',
                      marginBottom: '15px',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--dark-gray)' }}>Latitude</div>
                        <div style={{ fontWeight: 'bold', color: 'var(--navy-blue)' }}>
                          {attendance.latitude.toFixed(6)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--dark-gray)' }}>Longitude</div>
                        <div style={{ fontWeight: 'bold', color: 'var(--navy-blue)' }}>
                          {attendance.longitude.toFixed(6)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '300px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '2px solid var(--golden)',
                    }}
                  >
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${attendance.longitude - 0.01},${attendance.latitude - 0.01},${attendance.longitude + 0.01},${attendance.latitude + 0.01}&marker=${attendance.latitude},${attendance.longitude}`}
                      title="Location Map"
                    />
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${attendance.latitude},${attendance.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      marginTop: '10px',
                      color: 'var(--navy-blue)',
                      textDecoration: 'underline',
                    }}
                  >
                    View in Google Maps
                  </a>
                </div>
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '300px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--dark-gray)',
                  }}
                >
                  No location data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePhotoView;
