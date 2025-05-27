import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [hasInitialNavigation, setHasInitialNavigation] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Extract workspace ID and timeZone from query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const workspaceId = params.get('workspace_id');
    const timeZone = params.get('timeZone');


    // Update state with new values from URL
    if (workspaceId && workspaceId !== currentWorkspaceId) {
      setCurrentWorkspaceId(workspaceId);
    }

    if (timeZone && timeZone !== currentTimeZone) {
      setCurrentTimeZone(timeZone);
    }

    // Only perform navigation on initial load to avoid infinite loops
    if (!hasInitialNavigation && (workspaceId || timeZone)) {
      setHasInitialNavigation(true);

      // Check if we need to add missing parameters to the URL
      const currentParams = new URLSearchParams(location.search);
      let needsUpdate = false;

      if (workspaceId && !currentParams.has('workspace_id')) {
        currentParams.set('workspace_id', workspaceId);
        needsUpdate = true;
      }

      if (timeZone && !currentParams.has('timeZone')) {
        currentParams.set('timeZone', timeZone);
        needsUpdate = true;
      }

      if (needsUpdate) {
        navigate({
          pathname: location.pathname,
          search: currentParams.toString()
        }, { replace: true });
      }
    }
  }, [location.search, location.pathname, navigate, currentWorkspaceId, currentTimeZone, hasInitialNavigation]);

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
