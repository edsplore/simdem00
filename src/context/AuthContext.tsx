import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types/auth';
import { authService } from '../services/authService';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const updateUserFromToken = useCallback(() => {
    const decodedToken = authService.getUserFromToken();
    if (decodedToken) {
      const workspaceKey = 'new workspace-2025-1033';
      const workspaceData = decodedToken[workspaceKey];
      
      // Determine role based on permissions
      let role: UserRole = 'trainee';
      if (workspaceData?.roles?.uam?.includes('WORKSPACE_ADMIN')) {
        role = 'super_admin';
      } else if (workspaceData?.roles?.simulator?.includes('manager')) {
        role = 'org_admin';
      } else if (workspaceData?.roles?.simulator?.includes('trainer')) {
        role = 'trainer';
      } else if (workspaceData?.roles?.simulator?.includes('creator')) {
        role = 'creator';
      }

      setUser({
        id: decodedToken.user_id,
        email: decodedToken.sub,
        name: `${decodedToken.first_name} ${decodedToken.last_name}`,
        role: role,
      });
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    // Initial token refresh when component mounts
    authService.refreshToken()
      .then(() => {
        updateUserFromToken();
      })
      .catch(() => {
        setIsInitialized(true);
      });
  }, [updateUserFromToken]);

  const login = (token: string) => {
    authService.setToken(token);
    updateUserFromToken();
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  if (!isInitialized) {
    return <LoadingSpinner />;
  }
  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
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