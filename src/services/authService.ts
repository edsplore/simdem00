import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { User, DecodedToken } from '../types/auth';
import apiClient from './api/interceptors';

// Environment-specific URLs
const URLS = {
  dev: {
    refreshToken: 'https://eu2ccapdagl001.eastus2.cloudapp.azure.com/uam/auth/tokens/access/refresh'
  },
  staging: {
    refreshToken: 'https://eu2ccapsal001.eastus2.cloudapp.azure.com/uam/auth/tokens/access/refresh'
  }
};

class AuthService {
  private refreshTokenTimeout?: NodeJS.Timeout;
  private currentUser: User | null = null;
  private token: string | null = null;
  private currentWorkspaceId: string | null = null;

  async refreshToken(workspaceId?: string | null): Promise<string> {
    try {
      console.log('Attempting to refresh token...');

      // Use the provided workspace ID or the stored one
      const effectiveWorkspaceId = workspaceId || this.currentWorkspaceId;
      console.log('Using workspace ID for refresh:', effectiveWorkspaceId);

      // Use dev URL for now, could be made configurable based on environment
      const refreshTokenUrl = URLS.dev.refreshToken;

      const response = await axios.post(refreshTokenUrl, '', {
        withCredentials: true, // This ensures cookies are sent with the request
        headers: {
          'Access-Control-Allow-Origin': '*',
          ...(effectiveWorkspaceId ? { 'X-WORKSPACE-ID': effectiveWorkspaceId } : {})
        }
      });

      console.log('Refresh token response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });

      const newToken = response.data;
      this.token = newToken;

      // Update the user data based on the new token
      this.updateUserFromToken(newToken, effectiveWorkspaceId);

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

      this.clearAuthData();
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
    return this.token;
  }

  setToken(token: string, workspaceId?: string | null) {
    this.token = token;
    if (workspaceId) {
      this.currentWorkspaceId = workspaceId;
    }
    this.updateUserFromToken(token, workspaceId);
    this.startRefreshTimer(token);
  }

  clearAuthData() {
    this.token = null;
    this.currentUser = null;
    this.currentWorkspaceId = null;
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  logout() {
    this.clearAuthData();
  }

  updateUserFromToken(token: string, workspaceId?: string | null) {
    try {
      // Decode the token and log the full structure for debugging
      const decodedToken = jwtDecode<DecodedToken>(token);
      console.log('FULL DECODED TOKEN:', decodedToken);

      // Store the workspace ID if provided
      if (workspaceId) {
        this.currentWorkspaceId = workspaceId;
      }

      // Find all workspace keys by looking for keys that contain roles and permissions
      const workspaceKeys = Object.keys(decodedToken).filter(key => 
        decodedToken[key] && 
        typeof decodedToken[key] === 'object' && 
        decodedToken[key]?.roles
      );

      console.log('Found workspace keys:', workspaceKeys);

      if (workspaceKeys.length === 0) {
        console.error('No workspaces found in token');
        return null;
      }

      // Determine which workspace to use
      let selectedWorkspace = null;
      let selectedWorkspaceKey = '';
      let selectedRole = 'Unknown';

      // If we have a specific workspace ID to use
      if (this.currentWorkspaceId) {
        console.log(`Looking for specific workspace: ${this.currentWorkspaceId}`);

        // Try to find the specified workspace
        if (workspaceKeys.includes(this.currentWorkspaceId)) {
          selectedWorkspaceKey = this.currentWorkspaceId;
          selectedWorkspace = decodedToken[this.currentWorkspaceId];

          // Find the first simulator role if available
          if (selectedWorkspace.roles?.simulator && selectedWorkspace.roles.simulator.length > 0) {
            selectedRole = selectedWorkspace.roles.simulator[0];
          } else {
            // Otherwise use any available role
            const allRoles = Object.values(selectedWorkspace.roles || {}).flat();
            selectedRole = allRoles.length > 0 ? allRoles[0] : 'Unknown';
          }

          console.log(`Using specified workspace: ${selectedWorkspaceKey} with role: ${selectedRole}`);
        } else {
          console.warn(`Specified workspace ${this.currentWorkspaceId} not found in token`);
        }
      }

      // If we still don't have a workspace (either no specific one was requested or it wasn't found)
      if (!selectedWorkspace) {
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
          const hasAccess = Array.isArray(permValues) && permValues.some(perm => 
            Array.isArray(perm) && perm.includes('ACCESS')
          ) || false;

          const hasRead = Array.isArray(permValues) && permValues.some(perm => 
            Array.isArray(perm) && perm.includes('READ')
          ) || false;

          const hasCreate = Array.isArray(permValues) && permValues.some(perm => 
            Array.isArray(perm) && perm.includes('CREATE')
          ) || false;

          const hasUpdate = Array.isArray(permValues) && permValues.some(perm => 
            Array.isArray(perm) && perm.includes('UPDATE')
          ) || false;

          const hasDelete = Array.isArray(permValues) && permValues.some(perm => 
            Array.isArray(perm) && perm.includes('DELETE')
          ) || false;

          const hasWrite = hasCreate || hasUpdate || hasDelete;

          console.log(`Permission ${permKey}: Access=${hasAccess}, Read=${hasRead}, Create=${hasCreate}, Update=${hasUpdate}, Delete=${hasDelete}, Write=${hasWrite}`);

          // Only add permission if it has both ACCESS and READ
          if (hasAccess && hasRead) {
            permissions[permKey] = true;
          }

          // Add write permission if applicable
          if (hasWrite) {
            permissions[`${permKey}_write`] = true;
          }

          // Add specific create permission if applicable
          if (hasCreate) {
            permissions[`${permKey}_create`] = true;
          }

          // Add specific update permission if applicable
          if (hasUpdate) {
            permissions[`${permKey}_update`] = true;
          }

          // Add specific delete permission if applicable
          if (hasDelete) {
            permissions[`${permKey}_delete`] = true;
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
        permissions: permissions,
        division: decodedToken.division || '',
        department: decodedToken.department || '',
        profileImageUrl: decodedToken.profile_img_url || '',
        workspaceId: selectedWorkspaceKey
      };

      console.log('Created user object:', user);

      // Store user in memory
      this.currentUser = user;
      this.currentWorkspaceId = selectedWorkspaceKey;

      return user;
    } catch (error) {
      console.error('Error updating user from token:', error);
      return null;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    if (!this.token) return false;

    try {
      const decoded = jwtDecode<DecodedToken>(this.token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getCurrentWorkspaceId(): string | null {
    return this.currentWorkspaceId;
  }
}

export const authService = new AuthService();