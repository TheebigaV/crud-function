import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AppStore } from '../store/store';
import { clearCredentials } from '../store/slices/authSlice';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

let store: AppStore;

export const setupAxiosInterceptors = (storeInstance: AppStore) => {
  store = storeInstance;

  // Request interceptor to add auth token
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Get token from localStorage (matching your authSlice pattern)
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('token') 
        : null;

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Log request for debugging (optional, can be removed in production)
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        headers: config.headers,
      });

      return config;
    },
    (error: AxiosError) => {
      console.error('❌ Request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle errors
  api.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log successful response (optional, can be removed in production)
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });

      return response;
    },
    (error: AxiosError) => {
      console.error('❌ Response error:', {
        status: error.response?.status,
        message: error.response?.data || error.message,
        url: error.config?.url,
      });

      // Handle different error scenarios
      if (error.response) {
        const { status, data } = error.response;

        switch (status) {
          case 401:
            // Unauthorized - token expired or invalid
            console.log('🔒 Unauthorized access - logging out');
            if (typeof window !== 'undefined') {
              localStorage.removeItem('token');
              // Remove from cookies (matching your authSlice pattern)
              document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            }
            
            // Clear credentials using your existing action
            store.dispatch(clearCredentials());
            
            // Redirect to login if not already there
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
              window.location.href = '/login?error=' + encodeURIComponent('Session expired. Please login again.');
            }
            break;

          case 403:
            // Forbidden - insufficient permissions
            console.log('🚫 Forbidden access');
            break;

          case 404:
            // Not found
            console.log('🔍 Resource not found');
            break;

          case 422:
            // Validation error
            console.log('📝 Validation error:', data);
            break;

          case 429:
            // Rate limit exceeded
            console.log('⏰ Rate limit exceeded');
            break;

          case 500:
            // Server error
            console.log('🔥 Server error');
            break;

          default:
            console.log(`❓ Unhandled error status: ${status}`);
        }

        // Return a more structured error
        return Promise.reject({
          status,
          message: (data as any)?.message || error.message,
          data: data,
          originalError: error,
        });
      } else if (error.request) {
        // Network error
        console.error('🌐 Network error:', error.request);
        return Promise.reject({
          status: 0,
          message: 'Network error. Please check your connection.',
          originalError: error,
        });
      } else {
        // Something else happened
        console.error('⚠️ Unknown error:', error.message);
        return Promise.reject({
          status: -1,
          message: error.message || 'An unexpected error occurred',
          originalError: error,
        });
      }
    }
  );
};

// Export the configured axios instance (matching your existing pattern)
export default api;