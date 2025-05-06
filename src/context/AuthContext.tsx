import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '../types/auth';
import { authService } from '../services/authService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useLocation, useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  login: (token: string, workspaceId?: string, timeZone?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  currentWorkspaceId: string | null;
  currentTimeZone: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [currentTimeZone, setCurrentTimeZone] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Extract workspace ID and timeZone from query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const workspaceId = params.get('workspace_id');
    const timeZone = params.get('timeZone');

    if (workspaceId) {
      // Store the workspace ID exactly as received, without any manipulation
      setCurrentWorkspaceId(workspaceId);
    }

    if (timeZone) {
      // Store the timeZone exactly as received
      setCurrentTimeZone(timeZone);
    }

    // If the current route doesn't have workspace_id or timeZone and we just got one, add it to the URL
    if ((workspaceId && !location.search.includes('workspace_id')) || 
        (timeZone && !location.search.includes('timeZone'))) {

      // Build the new search params
      const newParams = new URLSearchParams(location.search);

      if (workspaceId && !location.search.includes('workspace_id')) {
        newParams.set('workspace_id', workspaceId);
      }

      if (timeZone && !location.search.includes('timeZone')) {
        newParams.set('timeZone', timeZone);
      }

      navigate({
        pathname: location.pathname,
        search: newParams.toString()
      }, { replace: true });
    }
  }, [location.search, navigate, location.pathname]);

  const updateUserState = useCallback(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsInitialized(true);
  }, []);

  // Initialize auth state and refresh token if needed
  useEffect(() => {
    // Skip if already refreshing or if we're on the unauthorized page
    if (isRefreshing || location.pathname === '/unauthorized') {
      return;
    }

    // Only attempt token refresh once during initialization
    if (!isInitialized) {
      setIsRefreshing(true);

      // Initial token refresh when component mounts or workspace changes
      authService.refreshToken(currentWorkspaceId)
        .then(() => {
          updateUserState();
          setIsRefreshing(false);
          setIsInitialized(true);
        })
        .catch((error) => {
          console.error('Token refresh failed:', error);
          setIsInitialized(true);
          setIsRefreshing(false);

          // Only redirect to unauthorized page if we're not already there
          if (location.pathname !== '/unauthorized') {
            // Include both workspace_id and timeZone in the redirect
            const params = new URLSearchParams();
            if (currentWorkspaceId) {
              params.set('workspace_id', currentWorkspaceId);
            }
            if (currentTimeZone) {
              params.set('timeZone', currentTimeZone);
            }

            const queryString = params.toString();
            const redirectPath = `/unauthorized${queryString ? `?${queryString}` : ''}`;

            navigate(redirectPath);
          }
        });
    }
  }, [updateUserState, currentWorkspaceId, navigate, location.pathname, isInitialized, isRefreshing, currentTimeZone]);

  const login = (token: string, workspaceId?: string, timeZone?: string) => {
    authService.setToken(token, workspaceId || currentWorkspaceId);

    // Update timeZone if provided
    if (timeZone) {
      setCurrentTimeZone(timeZone);
    }

    updateUserState();
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);

    // Include both workspace_id and timeZone in the redirect
    const params = new URLSearchParams();
    if (currentWorkspaceId) {
      params.set('workspace_id', currentWorkspaceId);
    }
    if (currentTimeZone) {
      params.set('timeZone', currentTimeZone);
    }

    const queryString = params.toString();
    const redirectPath = `/unauthorized${queryString ? `?${queryString}` : ''}`;

    navigate(redirectPath);
  };

  if (!isInitialized) {
    return <LoadingSpinner />;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated, 
      currentWorkspaceId,
      currentTimeZone
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
