import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  loginUser,
  logoutUser,
  getMe
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => {
    const stored = getAuthToken();
    if (!stored || stored === 'LOGGED_OUT') return null;
    return stored;
  });

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(() => {
    const stored = getAuthToken();
    return Boolean(stored && stored !== 'LOGGED_OUT');
  });

  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      const storedToken = getAuthToken();
      if (!storedToken || storedToken === 'LOGGED_OUT') {
        if (isMounted) {
          setUser(null);
          setTokenState(null);
          setIsLoading(false);
        }
        return;
      }

      // Verify stored session with backend
      try {
        const profile = await getMe();
        if (profile && isMounted) {
          setUser(profile);
          setTokenState(storedToken);
        } else if (isMounted) {
          clearAuthToken();
          setUser(null);
          setTokenState(null);
        }
      } catch (err) {
        if (isMounted) {
          clearAuthToken();
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

    // Listen for auth-expired event dispatched by api.js on HTTP 401
    const handleAuthExpired = () => {
      if (isMounted) {
        clearAuthToken();
        setUser(null);
        setTokenState(null);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('epa:auth-expired', handleAuthExpired);
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('epa:auth-expired', handleAuthExpired);
      }
    };
  }, []);

  const login = useCallback(async (username, password, turnstileToken, rememberMe = false) => {
    setIsLoading(true);
    try {
      const res = await loginUser({ username, password, turnstileToken, rememberMe });
      if (res && res.token) {
        setAuthToken(res.token, rememberMe);
        setUser(res.user);
        setTokenState(res.token);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    } finally {
      clearAuthToken();
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
