import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const REFRESH_TOKEN_URL = 'https://eu2ccapdagl001.eastus2.cloudapp.azure.com/uam/auth/tokens/access/refresh';
const TOKEN_KEY = 'access_token';

interface DecodedToken {
  exp: number;
  first_name: string;
  last_name: string;
  user_id: string;
  division: string;
  department: string;
  reporting_to: string;
  'new workspace-2025-1033': {
    roles: {
      [key: string]: string[];
    };
    permissions: {
      [key: string]: {
        [key: string]: string[][];
      };
    };
  };
}

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
      
      // Log decoded token info (without sensitive data)
      const decoded = jwtDecode<DecodedToken>(newToken);
      console.log('New token info:', {
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
        user: `${decoded.first_name} ${decoded.last_name}`,
        division: decoded.division,
        department: decoded.department
      });
      
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
    this.startRefreshTimer(token);
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  getUserFromToken(): DecodedToken | null {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      return jwtDecode<DecodedToken>(token);
    } catch (error) {
      console.error('Error decoding token:', error);
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