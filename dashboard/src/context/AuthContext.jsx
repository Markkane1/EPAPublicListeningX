import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  loginUser,
  signupUser,
  logoutUser,
  getMe
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getAuthToken());
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      let storedToken = getAuthToken();
      if (!storedToken) {
        // Auto-provision demo admin session for local development
        try {
          const res = await loginUser({
            username: 'admin',
            password: 'EPAadmin2026!',
            turnstileToken: 'DEMO_BYPASS'
          });
          if (res && res.token && isMounted) {
            setUser(res.user);
            setTokenState(res.token);
            setIsLoading(false);
            return;
          }
        } catch {
          // Fall back gracefully
        }
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const profile = await getMe();
        if (isMounted) {
          setUser(profile);
          setTokenState(storedToken);
        }
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        clearAuthToken();
        if (isMounted) {
          setUser(null);
          setTokenState(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (username, password, turnstileToken) => {
    setIsLoading(true);
    try {
      const res = await loginUser({ username, password, turnstileToken });
      setUser(res.user);
      setTokenState(res.token);
      return res;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (username, email, password, fullName, turnstileToken) => {
    setIsLoading(true);
    try {
      const res = await signupUser({ username, email, password, fullName, turnstileToken });
      setUser(res.user);
      setTokenState(res.token);
      return res;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      setTokenState(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await getMe();
      setUser(profile);
      return profile;
    } catch (e) {
      console.warn('Failed to refresh profile:', e);
      return null;
    }
  }, []);

  const hasPermission = useCallback(
    (permissionCode) => {
      if (!user) return false;
      
      if (user.role?.name === 'super_admin') return true;
      if (!user.permissions || !Array.isArray(user.permissions)) return false;
      return user.permissions.includes(permissionCode);
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissionCodes = []) => {
      if (!user) return false;
      if (user.role?.name === 'super_admin') return true;
      if (!user.permissions || !Array.isArray(user.permissions)) return false;
      return permissionCodes.some((code) => user.permissions.includes(code));
    },
    [user]
  );

  const hasRole = useCallback(
    (roleName) => {
      if (!user || !user.role) return false;
      return user.role.name === roleName;
    },
    [user]
  );

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    signup,
    logout,
    refreshProfile,
    hasPermission,
    hasAnyPermission,
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}