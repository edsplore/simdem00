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
const sampleToken = {
    "sub": "user123@weareverise.com",
    "first_name": "Akshat",
    "last_name": "Girdhar",
    "division": "EverAI Product",
    "department": "Product Design dev",
    "reporting_to": "charlie.white@weareverise.com",
    "user_id": "user123@weareverise.com",
    "WS-1": {
        "roles": {
            "simulator": ["manager", "trainer","WORKSPACE_ADMIN"],
            "qa_coaching": ["coach", "admin"],
            "knowledge_miner": ["analyst", "manager"]
        },
        "permissions": {
            "simulator": {
                "training": ["read", "write"],
                "playback": ["read"],
                "dashboard_admin": ["read", "write"],
                "dashboard_trainee": ["read"]
            },
            "qa_coaching": {
                "training": ["read", "write"]
            },
            "knowledge_miner": {
                "miner_module": ["read", "write"]
            }
        }
    },
    "WS-2025-1002": {
        "roles": {
            "simulator": ["manager", "trainer"],
            "qa_coaching": ["coach", "admin"],
            "knowledge_miner": ["analyst", "manager"]
        },
        "permissions": {
            "simulator": {
                "training": ["read", "write"],
                "playback": ["read"],
                "dashboard_admin": ["read", "write"],
                "dashboard_trainee": ["read"]
            },
            "qa_coaching": {
                "training": ["read", "write"]
            },
            "knowledge_miner": {
                "miner_module": ["read", "write"]
            }
        }
    },
    "iat": 1612435154,  
    "exp": 1612445154  
  };
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const updateUserFromToken = useCallback(() => {
    //Uncomment before deploying
    // const decodedToken = authService.getUserFromToken();

    // Comment before deploying
    const decodedToken = sampleToken;
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