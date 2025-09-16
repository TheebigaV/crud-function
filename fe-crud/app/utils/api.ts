import axios from 'axios';
import type { AppStore } from '../store/store';
import { clearCredentials } from '../store/slices/authSlice';

// Create axios instance with correct base URL
const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Make sure /api is included
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Set to true if you need cookies
});

// Setup axios interceptors with Redux store
export const setupAxiosInterceptors = (store: AppStore) => {
  // Request interceptor to add auth token
  api.interceptors.request.use(
    (config) => {
      const state = store.getState();
      const token = state.auth.token || localStorage.getItem('token');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  api.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        // Token is invalid, clear it from store and localStorage
        store.dispatch(clearCredentials());
        localStorage.removeItem('token');
        
        // Optionally redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
};

// Initial setup for cases where store might not be available yet
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;