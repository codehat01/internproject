import React from 'react';
import { X, MapPin, Camera, RotateCcw } from 'lucide-react';

interface PunchConfirmationDialogProps {
  isOpen: boolean;
  punchType: 'in' | 'out';
  photoDataUrl: string;
  location: { latitude: number; longitude: number } | null;
  geofenceStatus?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onRetakePhoto: () => void;
}

const PunchConfirmationDialog: React.FC<PunchConfirmationDialogProps> = ({
  isOpen,
  punchType,
  photoDataUrl,
  location,
  geofenceStatus,
  onConfirm,
  onCancel,
  onRetakePhoto,
}) => {
  if (!isOpen) return null;

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
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, color: 'var(--navy-blue)', fontSize: '24px', fontWeight: 'bold' }}>
            Confirm Punch {punchType === 'in' ? 'In' : 'Out'}
          </h2>
          <button
            onClick={onCancel}
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
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--navy-blue)', marginBottom: '10px', fontSize: '18px' }}>
              <Camera size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Captured Photo
            </h3>
            <div style={{ position: 'relative' }}>
              <img
                src={photoDataUrl}
                alt="Attendance Photo"
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  border: '2px solid var(--golden)',
                }}
              />
              <button
                onClick={onRetakePhoto}
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  backgroundColor: 'var(--navy-blue)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: '600',
                }}
              >
                <RotateCcw size={16} />
                Retake
              </button>
            </div>
          </div>

          {location && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--navy-blue)', marginBottom: '10px', fontSize: '18px' }}>
                <MapPin size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Location Details
              </h3>
              <div
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--dark-gray)' }}>Latitude</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--navy-blue)' }}>
                      {location.latitude.toFixed(6)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--dark-gray)' }}>Longitude</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--navy-blue)' }}>
                      {location.longitude.toFixed(6)}
                    </div>
                  </div>
                </div>
                {geofenceStatus && (
                  <div style={{ marginTop: '15px', padding: '10px', backgroundColor: geofenceStatus === 'Inside Station' ? '#d4edda' : '#fff3cd', borderRadius: '5px', border: `1px solid ${geofenceStatus === 'Inside Station' ? '#c3e6cb' : '#ffc107'}` }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: geofenceStatus === 'Inside Station' ? '#155724' : '#856404', textAlign: 'center' }}>
                      Status: {geofenceStatus}
                    </div>
                  </div>
                )}
                <div style={{ marginTop: '15px' }}>
                  <div
                    style={{
                      width: '100%',
                      height: '200px',
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
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.01},${location.latitude - 0.01},${location.longitude + 0.01},${location.latitude + 0.01}&marker=${location.latitude},${location.longitude}`}
                      title="Location Map"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              backgroundColor: '#fff3cd',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #ffc107',
              marginBottom: '20px',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#856404',
                textAlign: 'center',
              }}
            >
              Are you sure you want to punch {punchType === 'in' ? 'in' : 'out'}?
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#e0e0e0',
                color: 'var(--navy-blue)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: punchType === 'in' ? 'var(--navy-blue)' : 'var(--green)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Confirm Punch {punchType === 'in' ? 'In' : 'Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PunchConfirmationDialog;
