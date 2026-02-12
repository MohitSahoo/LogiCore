import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  updateProfile: (firstName: string, lastName: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      verifyToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await apiClient.get('/auth/verify');
      const profileResponse = await apiClient.get('/auth/profile');
      setUser(profileResponse.data.user);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const response = await apiClient.post('/auth/register', {
        email,
        password,
        firstName,
        lastName,
      });
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (firstName: string, lastName: string) => {
    try {
      const response = await apiClient.put('/auth/profile', { firstName, lastName });
      setUser(response.data.user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Profile update failed');
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await apiClient.put('/auth/password', { currentPassword, newPassword });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Password change failed');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
