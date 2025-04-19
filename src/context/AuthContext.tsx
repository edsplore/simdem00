import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '../types/auth';
import { authService } from '../services/authService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useLocation, useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  login: (token: string, workspaceId?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  currentWorkspaceId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Extract workspace ID from query parameters - now safe because we're inside Router context
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const workspaceId = params.get('workspace_id');

    if (workspaceId) {
      // Ensure we're using the complete workspace ID without truncation
      console.log('Workspace ID from URL (raw):', workspaceId);

      // Store the workspace ID exactly as received, without any manipulation
      setCurrentWorkspaceId(workspaceId);

      // If the current route doesn't have workspace_id and we just got one, add it to the URL
      if (!location.search.includes('workspace_id')) {
        const newSearch = location.search ? 
          `${location.search}&workspace_id=${encodeURIComponent(workspaceId)}` : 
          `?workspace_id=${encodeURIComponent(workspaceId)}`;

        navigate({
          pathname: location.pathname,
          search: newSearch
        }, { replace: true });
      }
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

    console.log('Starting token refresh process');
    setIsRefreshing(true);

    // Initial token refresh when component mounts or workspace changes
    authService.refreshToken(currentWorkspaceId)
      .then(() => {
        console.log('Token refresh successful');
        updateUserState();
        setIsRefreshing(false);
        setIsInitialized(true);
      })
      .catch((error) => {
        console.error('All token refresh attempts failed:', error);
        setIsInitialized(true);
        setIsRefreshing(false);

        // Only redirect to unauthorized page if we're not already there
        if (location.pathname !== '/unauthorized') {
          console.log('Redirecting to unauthorized page');
          const workspaceParam = currentWorkspaceId ? `?workspace_id=${encodeURIComponent(currentWorkspaceId)}` : '';
          navigate(`/unauthorized${workspaceParam}`);
        }
      });
  }, [updateUserState, currentWorkspaceId, navigate, location.pathname]);

  const login = (token: string, workspaceId?: string) => {
    authService.setToken(token, workspaceId || currentWorkspaceId);
    updateUserState();
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    // Redirect to unauthorized page instead of login
    const workspaceParam = currentWorkspaceId ? `?workspace_id=${encodeURIComponent(currentWorkspaceId)}` : '';
    navigate(`/unauthorized${workspaceParam}`);
  };

  if (!isInitialized) {
    return <LoadingSpinner />;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, currentWorkspaceId }}>
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