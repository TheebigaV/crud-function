import axios from 'axios';
import type { AppStore } from '../store/store';
import { logout } from '../store/slices/authSlice';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create main axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Helper function to get auth token
export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Setup interceptors with store reference
export const setupAxiosInterceptors = (store: AppStore) => {
  // Request interceptor to add auth token
  api.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling and auto-logout
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle network errors
      if (error.code === 'ERR_NETWORK') {
        return Promise.reject(new Error(`Network Error: Cannot connect to ${API_BASE_URL}. Please ensure your Laravel server is running and CORS is configured.`));
      }
      
      // Handle timeout errors
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(new Error('Request timeout. Please check your connection and try again.'));
      }

      // Handle authorization errors (401, 403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Authorization error detected, logging out user...');
        
        // Dispatch logout action to clear state
        store.dispatch(logout());
        
        // Redirect to login page after a brief delay
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/login?error=' + encodeURIComponent('Your session has expired. Please log in again.');
          }
        }, 100);
        
        return Promise.reject(new Error('Your session has expired. Please log in again.'));
      }

      // Handle other errors
      return Promise.reject(error);
    }
  );
};

export default api;