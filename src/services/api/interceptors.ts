import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { authService } from '../authService';

// Create a custom axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig): AxiosRequestConfig => {
    // Log request details in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    // Add authorization header if token exists
    const token = authService.getToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      };
    }

    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error: AxiosError): Promise<any> => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && originalRequest && !originalRequest.headers._retry) {
      // Mark the request as retried to prevent infinite loops
      originalRequest.headers._retry = true;

      try {
        // Attempt to refresh the token
        const newToken = await authService.refreshToken();

        // Update the authorization header with the new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Retry the original request with the new token
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If token refresh fails, redirect to unauthorized page
        authService.logout();

        // We can't directly navigate here since we're outside of React Router
        // The auth state change will trigger a redirect in the components
        console.error('Token refresh failed, user will be redirected to unauthorized page');

        return Promise.reject(refreshError);
      }
    }

    // Log error details
    console.error('API Error:', {
      status: error.response?.status,
      url: originalRequest?.url,
      message: error.message,
      data: error.response?.data
    });

    return Promise.reject(error);
  }
);

export default apiClient;