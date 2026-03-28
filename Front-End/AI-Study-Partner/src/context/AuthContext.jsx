import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authservice';

export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => { },
  register: async () => { },
  logout: () => { },
  updateProfile: async () => { },
  changePassword: async () => { },
  handleGoogleCallback: () => { },
});

// convenience hook for consumers
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const data = await authService.getProfile();
      setUser(data.data);
      setIsAuthenticated(true);
      return data.data;
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  const register = async (username, email, password) => {
    const data = await authService.register(username, email, password);
    // Explicitly NOT setting token or user state to force manual login
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (userData) => {
    const data = await authService.updateProfile(userData);
    setUser(data.data);
    return data;
  };

  const changePassword = async (passwords) => {
    return authService.changePassword(passwords);
  };

  const handleGoogleCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (token) {
      console.log('Token received from Google callback, storing in localStorage...');
      localStorage.setItem('token', token);

      try {
        const userData = await loadProfile();
        // Doubly ensure isAuthenticated is true
        setIsAuthenticated(true);
        console.log('Profile loaded successfully, redirecting to dashboard...');
        return { success: true, user: userData };
      } catch (err) {
        console.error('Failed to load profile after Google sign-in:', err);
        return { success: false, error: 'Failed to load user profile' };
      }
    } else if (error) {
      console.error('Google Auth Error from URL:', error);
      return { success: false, error };
    }

    console.warn('No token or error found in Google callback URL');
    return { success: false, error: 'No token received' };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        handleGoogleCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};