import React, { useState, useEffect } from 'react';
import { Settings, Bell, Globe, Lock, User as UserIcon, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SettingsViewProps {
  userId: string;
  userInfo: {
    full_name: string;
    badge_number: string;
    email?: string;
    rank?: string;
    department?: string;
  };
}

interface NotificationPreferences {
  emailNotifications: boolean;
  smsAlerts: boolean;
  pushNotifications: boolean;
}

interface UserSettings {
  language: string;
  timezone: string;
  notificationPreferences: NotificationPreferences;
}

const SettingsView: React.FC<SettingsViewProps> = ({ userId, userInfo }) => {
  const [settings, setSettings] = useState<UserSettings>({
    language: 'English',
    timezone: 'Asia/Kolkata',
    notificationPreferences: {
      emailNotifications: true,
      smsAlerts: true,
      pushNotifications: false
    }
  });

  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    show: boolean;
  }>({
    message: '',
    type: 'info',
    show: false
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data?.notification_preferences) {
        setSettings(prev => ({
          ...prev,
          notificationPreferences: data.notification_preferences
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: settings.notificationPreferences
        })
        .eq('id', userId);

      if (error) throw error;

      showNotification('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = (key: keyof NotificationPreferences) => {
    setSettings(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: !prev.notificationPreferences[key]
      }
    }));
  };

  return (
    <div>
      <h2 style={{ color: 'var(--navy-blue)', marginBottom: '30px', fontSize: '28px', fontWeight: '700' }}>
        Settings
      </h2>

      <div className="card" style={{ marginBottom: '30px' }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserIcon size={24} />
          Profile Information
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--navy-blue)', marginBottom: '5px', display: 'block' }}>
              Full Name
            </label>
            <p style={{ color: 'var(--dark-gray)', padding: '10px', background: 'var(--light-gray)', borderRadius: '5px' }}>
              {userInfo.full_name}
            </p>
          </div>
          <div>
            <label style={{ fontWeight: '600', color: 'var(--navy-blue)', marginBottom: '5px', display: 'block' }}>
              Badge Number
            </label>
            <p style={{ color: 'var(--dark-gray)', padding: '10px', background: 'var(--light-gray)', borderRadius: '5px' }}>
              {userInfo.badge_number}
            </p>
          </div>
          {userInfo.email && (
            <div>
              <label style={{ fontWeight: '600', color: 'var(--navy-blue)', marginBottom: '5px', display: 'block' }}>
                Email
              </label>
              <p style={{ color: 'var(--dark-gray)', padding: '10px', background: 'var(--light-gray)', borderRadius: '5px' }}>
                {userInfo.email}
              </p>
            </div>
          )}
          {userInfo.rank && (
            <div>
              <label style={{ fontWeight: '600', color: 'var(--navy-blue)', marginBottom: '5px', display: 'block' }}>
                Rank
              </label>
              <p style={{ color: 'var(--dark-gray)', padding: '10px', background: 'var(--light-gray)', borderRadius: '5px' }}>
                {userInfo.rank}
              </p>
            </div>
          )}
          {userInfo.department && (
            <div>
              <label style={{ fontWeight: '600', color: 'var(--navy-blue)', marginBottom: '5px', display: 'block' }}>
                Department
              </label>
              <p style={{ color: 'var(--dark-gray)', padding: '10px', background: 'var(--light-gray)', borderRadius: '5px' }}>
                {userInfo.department}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '30px' }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bell size={24} />
          Notification Preferences
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'var(--light-gray)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontWeight: '600', color: 'var(--navy-blue)', marginBottom: '5px' }}>
                Email Notifications
              </div>
              <div style={{ fontSize: '14px', color: 'var(--dark-gray)' }}>
                Receive attendance and leave status updates via email
              </div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
              <input
                type="checkbox"
                checked={settings.notificationPreferences.emailNotifications}
                onChange={() => handleNotificationToggle('emailNotifications')}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: settings.notificationPreferences.emailNotifications ? 'var(--green)' : '#ccc',
                  transition: '0.4s',
                  borderRadius: '34px'
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    content: '',
                    height: '26px',
                    width: '26px',
                    left: settings.notificationPreferences.emailNotifications ? '30px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '0.4s',
                    borderRadius: '50%'
                  }}
                />
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'var(--light-gray)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontWeight: '600', color: 'var(--navy-blue)', marginBottom: '5px' }}>
                SMS Alerts
              </div>
              <div style={{ fontSize: '14px', color: 'var(--dark-gray)' }}>
                Get important alerts and reminders via SMS
              </div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
              <input
                type="checkbox"
                checked={settings.notificationPreferences.smsAlerts}
                onChange={() => handleNotificationToggle('smsAlerts')}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: settings.notificationPreferences.smsAlerts ? 'var(--green)' : '#ccc',
                  transition: '0.4s',
                  borderRadius: '34px'
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    content: '',
                    height: '26px',
                    width: '26px',
                    left: settings.notificationPreferences.smsAlerts ? '30px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '0.4s',
                    borderRadius: '50%'
                  }}
                />
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'var(--light-gray)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontWeight: '600', color: 'var(--navy-blue)', marginBottom: '5px' }}>
                Push Notifications
              </div>
              <div style={{ fontSize: '14px', color: 'var(--dark-gray)' }}>
                Enable browser push notifications for real-time updates
              </div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
              <input
                type="checkbox"
                checked={settings.notificationPreferences.pushNotifications}
                onChange={() => handleNotificationToggle('pushNotifications')}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: settings.notificationPreferences.pushNotifications ? 'var(--green)' : '#ccc',
                  transition: '0.4s',
                  borderRadius: '34px'
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    content: '',
                    height: '26px',
                    width: '26px',
                    left: settings.notificationPreferences.pushNotifications ? '30px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '0.4s',
                    borderRadius: '50%'
                  }}
                />
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '30px' }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Globe size={24} />
          Language & Region
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--navy-blue)' }}>
              Language
            </label>
            <select
              className="input"
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Tamil">Tamil</option>
              <option value="Telugu">Telugu</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--navy-blue)' }}>
              Timezone
            </label>
            <select
              className="input"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
            >
              <option value="Asia/Kolkata">India Standard Time (IST)</option>
              <option value="Asia/Dubai">Gulf Standard Time (GST)</option>
              <option value="Europe/London">Greenwich Mean Time (GMT)</option>
              <option value="America/New_York">Eastern Standard Time (EST)</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <button
          className="btn btn-primary"
          onClick={handleSaveSettings}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Save size={20} />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className={`notification ${notification.type} ${notification.show ? 'show' : ''}`}>
        {notification.message}
      </div>
    </div>
  );
};

export default SettingsView;
