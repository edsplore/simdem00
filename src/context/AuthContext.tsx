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
      // Get workspace data - handle both formats
      const workspaceData = decodedToken['new workspace-2025-1033'] || decodedToken['WS-1'];

      // Default to trainee
      let role: UserRole = 'trainee';

      // Check for admin roles first
      if (workspaceData?.roles?.uam?.includes('WORKSPACE_ADMIN') || 
          workspaceData?.roles?.simulator?.includes('WORKSPACE_ADMIN')) {
        role = 'super_admin';
      } 
      // Then check for org admin
      else if (workspaceData?.roles?.simulator?.includes('manager')) {
        role = 'org_admin';
      }
      // Then trainer
      else if (workspaceData?.roles?.simulator?.includes('trainer')) {
        role = 'trainer';
      }
      // Then creator
      else if (workspaceData?.roles?.simulator?.includes('creator')) {
        role = 'creator';
      }
      // Default remains trainee if no other role matches

      // Log the role determination
      console.log('Role determination:', {
        workspaceData: workspaceData?.roles,
        assignedRole: role
      });

      const user = {
        id: decodedToken.user_id,
        email: decodedToken.sub,
        name: `${decodedToken.first_name} ${decodedToken.last_name}`,
        role: role,
      }

      console.log('Setting user:', user);

      setUser(user);
      setIsAuthenticated(true);
    } else {
      console.log('No valid token found, clearing user state');
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