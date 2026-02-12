import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px',
          background: colors.bgSurfaceHover,
          border: `1px solid ${colors.borderSubtle}`,
          borderRadius: 8,
          color: colors.textPrimary,
          fontSize: '0.8125rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = colors.bgSurface;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = colors.bgSurfaceHover;
        }}
      >
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: colors.accentSubtle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.accentText,
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          {user.firstName?.[0]?.toUpperCase() || 'U'}
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontWeight: 500 }}>
            {user.firstName} {user.lastName}
          </div>
          <div style={{ 
            fontSize: '0.6875rem', 
            color: colors.textTertiary,
            textTransform: 'capitalize'
          }}>
            {user.role}
          </div>
        </div>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{
            transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        >
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            marginBottom: 8,
            background: colors.bgSurfaceElevated,
            border: `1px solid ${colors.borderDefault}`,
            borderRadius: 8,
            boxShadow: colors.shadowMd,
            zIndex: 1000,
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${colors.borderSubtle}`
            }}>
              <div style={{ 
                color: colors.textPrimary, 
                fontSize: '0.8125rem', 
                fontWeight: 500 
              }}>
                {user.firstName} {user.lastName}
              </div>
              <div style={{ 
                color: colors.textTertiary, 
                fontSize: '0.75rem',
                marginTop: 2
              }}>
                {user.email}
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                color: colors.dangerText,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.dangerBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16,17 21,12 16,7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;