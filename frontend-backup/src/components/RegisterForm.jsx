import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const RegisterForm = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    const result = await register(
      formData.email,
      formData.password,
      formData.firstName,
      formData.lastName
    );
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0c10 0%, #1a1d29 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#0d1117',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'rgba(99, 102, 241, 0.15)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#a5b4fc',
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            L
          </div>
          <h1 style={{
            color: '#e5e7eb',
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: '0 0 8px 0'
          }}>
            Join LogiCore
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            margin: 0
          }}>
            Create your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            color: '#fca5a5',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#161b22',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#e5e7eb',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                placeholder="First name"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                color: '#e5e7eb',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#161b22',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#e5e7eb',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                placeholder="Last name"
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#e5e7eb',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                background: '#161b22',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#e5e7eb',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#e5e7eb',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                background: '#161b22',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#e5e7eb',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              placeholder="Create a password"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: '#e5e7eb',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                background: '#161b22',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#e5e7eb',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#4b5563' : '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              marginBottom: '20px'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.background = '#5856eb';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.background = '#6366f1';
            }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        {/* Switch to Login */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Already have an account?{' '}
          </span>
          <button
            onClick={onSwitchToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: '#6366f1',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;