import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import axios from 'axios';

const UserProfileSettings = ({ apiBase }) => {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.put(`${apiBase}/auth/profile`, {
        firstName: profileData.firstName,
        lastName: profileData.lastName
      });

      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await axios.put(`${apiBase}/auth/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setMessage('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div style={{ color: colors.textPrimary }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '1.875rem', 
          fontWeight: 600, 
          margin: 0, 
          marginBottom: '8px',
          color: colors.textPrimary 
        }}>
          Profile & Account Settings
        </h1>
        <p style={{ 
          color: colors.textSecondary, 
          margin: 0,
          fontSize: '0.875rem' 
        }}>
          Manage your personal information and account security
        </p>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          background: '#dcfce7',
          color: '#166534',
          borderRadius: '6px',
          marginBottom: '24px',
          fontSize: '0.875rem'
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px 16px',
          background: '#fef2f2',
          color: '#dc2626',
          borderRadius: '6px',
          marginBottom: '24px',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gap: '32px', maxWidth: '600px' }}>
        {/* Profile Information */}
        <div style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.borderSubtle}`,
          borderRadius: '8px',
          padding: '24px'
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600, 
            margin: '0 0 20px 0',
            color: colors.textPrimary 
          }}>
            Profile Information
          </h2>

          <form onSubmit={handleProfileUpdate}>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: colors.textSecondary,
                  marginBottom: '6px'
                }}>
                  First Name
                </label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${colors.borderSubtle}`,
                    borderRadius: '6px',
                    background: colors.bgApp,
                    color: colors.textPrimary,
                    fontSize: '0.875rem'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: colors.textSecondary,
                  marginBottom: '6px'
                }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${colors.borderSubtle}`,
                    borderRadius: '6px',
                    background: colors.bgApp,
                    color: colors.textPrimary,
                    fontSize: '0.875rem'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: colors.textSecondary,
                  marginBottom: '6px'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${colors.borderSubtle}`,
                    borderRadius: '6px',
                    background: colors.bgApp,
                    color: colors.textSecondary,
                    fontSize: '0.875rem',
                    opacity: 0.6
                  }}
                />
                <p style={{
                  fontSize: '0.75rem',
                  color: colors.textSecondary,
                  margin: '4px 0 0 0'
                }}>
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: colors.accent,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.borderSubtle}`,
          borderRadius: '8px',
          padding: '24px'
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600, 
            margin: '0 0 20px 0',
            color: colors.textPrimary 
          }}>
            Change Password
          </h2>

          <form onSubmit={handlePasswordChange}>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: colors.textSecondary,
                  marginBottom: '6px'
                }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${colors.borderSubtle}`,
                    borderRadius: '6px',
                    background: colors.bgApp,
                    color: colors.textPrimary,
                    fontSize: '0.875rem'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: colors.textSecondary,
                  marginBottom: '6px'
                }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${colors.borderSubtle}`,
                    borderRadius: '6px',
                    background: colors.bgApp,
                    color: colors.textPrimary,
                    fontSize: '0.875rem'
                  }}
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: colors.textSecondary,
                  marginBottom: '6px'
                }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${colors.borderSubtle}`,
                    borderRadius: '6px',
                    background: colors.bgApp,
                    color: colors.textPrimary,
                    fontSize: '0.875rem'
                  }}
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: colors.accent,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Account Actions */}
        <div style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.borderSubtle}`,
          borderRadius: '8px',
          padding: '24px'
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600, 
            margin: '0 0 20px 0',
            color: colors.textPrimary 
          }}>
            Account Actions
          </h2>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileSettings;