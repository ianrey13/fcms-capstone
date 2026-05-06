// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Role constants matching backend
export const USER_ROLES = {
  SUPERADMIN: 'superadmin',
  MAYORS_OFFICE: 'mayors_office',
  HEAD_OF_OFFICE: 'head_of_office',
  GSO_STAFF: 'gso_staff',
  DEPT_OFFICE: 'dept_office',
  DRIVER: 'driver',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('fcms_token'));

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('fcms_user');
    const storedToken = localStorage.getItem('fcms_token');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        // Clear invalid data
        localStorage.removeItem('fcms_token');
        localStorage.removeItem('fcms_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password, 'web');
      
      if (response.data && response.data.success && response.data.data) {
        const { user: userData, token: accessToken, token_type } = response.data.data;
        
        // Format token with Bearer prefix if needed
        let fullToken = accessToken;
        if (token_type === 'Bearer' && !accessToken.startsWith('Bearer ')) {
          fullToken = `Bearer ${accessToken}`;
        } else if (!accessToken.startsWith('Bearer ') && !accessToken.startsWith('bearer ')) {
          fullToken = `Bearer ${accessToken}`;
        }
        
        // Store token and user
        localStorage.setItem('fcms_token', fullToken);
        localStorage.setItem('fcms_user', JSON.stringify(userData));
        
        setToken(fullToken);
        setUser(userData);
        
        return { success: true, user: userData };
      } else {
        console.error('Unexpected response structure:', response.data);
        return { 
          success: false, 
          message: response.data?.message || 'Invalid response from server' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check your credentials.'
      };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear storage regardless of API response
      localStorage.removeItem('fcms_token');
      localStorage.removeItem('fcms_user');
      setToken(null);
      setUser(null);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await authAPI.changePassword(currentPassword, newPassword);
      return { success: true, message: response.data?.message || 'Password changed successfully' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to change password'
      };
    }
  };

  // Helper to get dashboard route based on role
  const getDashboardRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case USER_ROLES.SUPERADMIN:
        return '/admin/dashboard';
      case USER_ROLES.MAYORS_OFFICE:
        return '/mo/dashboard';
      case USER_ROLES.HEAD_OF_OFFICE:
        return '/head/dashboard';
      case USER_ROLES.GSO_STAFF:
        return '/gso/dashboard';
      case USER_ROLES.DEPT_OFFICE:
        return '/department/dashboard';
      case USER_ROLES.DRIVER:
        return '/driver/dashboard';
      default:
        return '/dashboard';
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    changePassword,
    getDashboardRoute,
    isAuthenticated: !!user,  // This is what your ProtectedRoute uses
    // Role check helpers
    isSuperAdmin: user?.role === USER_ROLES.SUPERADMIN,
    isMayorsOffice: user?.role === USER_ROLES.MAYORS_OFFICE,
    isHeadOfOffice: user?.role === USER_ROLES.HEAD_OF_OFFICE,
    isGsoStaff: user?.role === USER_ROLES.GSO_STAFF,
    isDeptOffice: user?.role === USER_ROLES.DEPT_OFFICE,
    isDriver: user?.role === USER_ROLES.DRIVER,
    // Additional helper
    hasRole: (role) => user?.role === role,
    hasAnyRole: (roles) => roles.includes(user?.role),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;