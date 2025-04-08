import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { User, DecodedToken } from '../types/auth';

// Staging
const REFRESH_TOKEN_URL = 'https://eu2ccapsal001.eastus2.cloudapp.azure.com/uam/auth/tokens/access/refresh';

//Dev
// const REFRESH_TOKEN_URL = 'https://eu2ccapdagl001.eastus2.cloudapp.azure.com/uam/auth/tokens/access/refresh';

const TOKEN_KEY = 'access_token';
const USER_KEY = 'current_user';

class AuthService {
  private refreshTokenTimeout?: NodeJS.Timeout;

  async refreshToken(): Promise<string> {
    try {
      console.log('Attempting to refresh token...');

      const response = await axios.post(REFRESH_TOKEN_URL, '', {
        withCredentials: true, // This ensures cookies are sent with the request
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });

      console.log('Refresh token response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });

      const newToken = response.data;
      localStorage.setItem(TOKEN_KEY, newToken);

      // Update the user data based on the new token
      this.updateUserFromToken(newToken);

      // Start the refresh timer
      this.startRefreshTimer(newToken);

      return newToken;
    } catch (error) {
      // Enhanced error logging
      console.error('Token refresh failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        response: axios.isAxiosError(error) ? {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        } : undefined,
        request: axios.isAxiosError(error) ? {
          method: error.config?.method,
          url: error.config?.url,
          headers: error.config?.headers
        } : undefined
      });

      this.logout();
      throw error;
    }
  }

  startRefreshTimer(token: string) {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const expiresIn = decoded.exp * 1000 - Date.now();

      console.log('Setting up refresh timer:', {
        expiresIn: `${Math.round(expiresIn / 1000)}s`,
        refreshIn: `${Math.round((expiresIn - 60000) / 1000)}s`,
        currentTime: new Date().toISOString(),
        expiresAt: new Date(decoded.exp * 1000).toISOString()
      });

      // Clear any existing timer
      if (this.refreshTokenTimeout) {
        clearTimeout(this.refreshTokenTimeout);
      }

      // Set timer to refresh 1 minute before expiry
      this.refreshTokenTimeout = setTimeout(() => {
        console.log('Refresh timer triggered');
        this.refreshToken();
      }, expiresIn - 60000); // Refresh 1 minute before expiry

    } catch (error) {
      console.error('Failed to start refresh timer:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        token: token ? 'Present' : 'Missing'
      });
    }
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    this.updateUserFromToken(token);
    this.startRefreshTimer(token);
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  updateUserFromToken(token: string) {
    try {
      // Decode the token and log the full structure for debugging
      const decodedToken = jwtDecode<DecodedToken>(token);
      console.log('FULL DECODED TOKEN:', decodedToken);

      // Find all workspace keys by looking for keys that contain roles and permissions
      const workspaceKeys = Object.keys(decodedToken).filter(key => 
        decodedToken[key] && 
        typeof decodedToken[key] === 'object' && 
        decodedToken[key]?.roles
      );

      console.log('Found workspace keys:', workspaceKeys);

      if (workspaceKeys.length === 0) {
        console.error('No workspace found in token');
        return null;
      }

      // Initialize variables to store the workspace with simulator permissions
      let selectedWorkspace = null;
      let selectedWorkspaceKey = '';
      let selectedRole = 'Unknown';

      // Check each workspace for simulator permissions
      for (const key of workspaceKeys) {
        const workspace = decodedToken[key];
        console.log(`Checking workspace: ${key}`, workspace);

        // Check if this workspace has simulator roles
        if (workspace.roles?.simulator) {
          console.log(`Found simulator roles in workspace ${key}:`, workspace.roles.simulator);

          // Check if this workspace has simulator permissions
          if (workspace.permissions?.simulator) {
            console.log(`Found simulator permissions in workspace ${key}`);
            selectedWorkspace = workspace;
            selectedWorkspaceKey = key;
            selectedRole = workspace.roles.simulator[0] || 'Unknown';
            break; // Found a workspace with simulator permissions, stop searching
          }
        }
      }

      // If no workspace with simulator permissions was found, try to use any workspace
      if (!selectedWorkspace && workspaceKeys.length > 0) {
        const fallbackKey = workspaceKeys[0];
        selectedWorkspace = decodedToken[fallbackKey];
        selectedWorkspaceKey = fallbackKey;

        // Try to find any role
        const allRoles = Object.values(selectedWorkspace.roles || {}).flat();
        selectedRole = allRoles.length > 0 ? allRoles[0] : 'Unknown';

        console.log('No workspace with simulator permissions found, using fallback:', selectedWorkspaceKey);
      }

      if (!selectedWorkspace) {
        console.error('No valid workspace found in token');
        return null;
      }

      console.log('Selected workspace:', selectedWorkspaceKey);
      console.log('Selected role:', selectedRole);

      // Process permissions
      const permissions: { [key: string]: boolean } = {};

      // Process simulator permissions if they exist
      if (selectedWorkspace.permissions?.simulator) {
        console.log('Processing simulator permissions:', selectedWorkspace.permissions.simulator);

        Object.entries(selectedWorkspace.permissions.simulator).forEach(([permKey, permValues]) => {
          console.log(`Processing permission: ${permKey}`, permValues);

          // Check if the permission has ACCESS and READ
          const hasAccess = permValues.some(perm => 
            Array.isArray(perm) && perm.includes('ACCESS')
          );

          const hasRead = permValues.some(perm => 
            Array.isArray(perm) && perm.includes('READ')
          );

          const hasWrite = permValues.some(perm => 
            Array.isArray(perm) && perm.includes('CREATE') || 
            Array.isArray(perm) && perm.includes('UPDATE') || 
            Array.isArray(perm) && perm.includes('DELETE')
          );

          console.log(`Permission ${permKey}: Access=${hasAccess}, Read=${hasRead}, Write=${hasWrite}`);

          // Only add permission if it has both ACCESS and READ
          if (hasAccess && hasRead) {
            permissions[permKey] = true;
          }

          // Add write permission if applicable
          if (hasWrite) {
            permissions[`${permKey}_write`] = true;
          }
        });
      } else {
        console.warn('No simulator permissions found in selected workspace');
      }

      console.log('Final permissions object:', permissions);

      // Create user object
      const user: User = {
        id: decodedToken.user_id,
        email: decodedToken.sub,
        name: `${decodedToken.first_name} ${decodedToken.last_name}`,
        role: selectedRole,
        permissions: permissions
      };

      console.log('Created user object:', user);

      // Store user in localStorage
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      return user;
    } catch (error) {
      console.error('Error updating user from token:', error);
      return null;
    }
  }

  getCurrentUser(): User | null {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson) as User;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();

// Set up axios interceptor to handle token refresh
axios.interceptors.request.use(
  async (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const token = await authService.refreshToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);