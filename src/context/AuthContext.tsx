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
  const location = useLocation();
  const navigate = useNavigate();

  // Extract workspace ID from query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const workspaceId = params.get('workspace_id');

    if (workspaceId) {
      console.log('Workspace ID from URL:', workspaceId);
      setCurrentWorkspaceId(workspaceId);
    }
  }, [location.search]);

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
    // Initial token refresh when component mounts or workspace changes
    authService.refreshToken(currentWorkspaceId)
      .then(() => {
        updateUserState();
      })
      .catch(() => {
        setIsInitialized(true);
        // Redirect to unauthorized page instead of login
        const workspaceParam = currentWorkspaceId ? `?workspace_id=${currentWorkspaceId}` : '';
        navigate(`/unauthorized${workspaceParam}`);
      });
  }, [updateUserState, currentWorkspaceId, navigate]);

  const login = (token: string, workspaceId?: string) => {
    authService.setToken(token, workspaceId || currentWorkspaceId);
    updateUserState();
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    // Redirect to unauthorized page instead of login
    const workspaceParam = currentWorkspaceId ? `?workspace_id=${currentWorkspaceId}` : '';
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