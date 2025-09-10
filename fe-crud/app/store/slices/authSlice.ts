import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  provider?: string;
  provider_id?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  message: string | null;
}

// Create axios instance with better configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      return Promise.reject(new Error(`Network Error: Cannot connect to ${API_BASE_URL}. Please ensure your Laravel server is running and CORS is configured.`));
    }
    
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout. Please check your connection and try again.'));
    }
    
    return Promise.reject(error);
  }
);

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Get initial state from localStorage if available
const getInitialState = (): AuthState => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    return {
      user: userStr ? JSON.parse(userStr) : null,
      token: token || null,
      isAuthenticated: !!token,
      loading: false,
      error: null,
      message: null,
    };
  }
  
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    message: null,
  };
};

const initialState: AuthState = getInitialState();

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/login', credentials);
      
      // Store token and user in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || 
        error.response?.data?.message || 
        'Login failed'
      );
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: { name: string; email: string; password: string; password_confirmation: string }, { rejectWithValue }) => {
    try {
      console.log('Attempting to register with:', { ...userData, password: '[HIDDEN]', password_confirmation: '[HIDDEN]' });
      console.log('API URL:', `${API_BASE_URL}/api/register`);
      
      const response = await api.post('/api/register', userData);
      
      // Store token and user in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.errors) {
        // Laravel validation errors
        const errorMessages = Object.values(error.response.data.errors).flat();
        return rejectWithValue(errorMessages.join(', '));
      }
      
      return rejectWithValue(
        error.message || 
        error.response?.data?.message || 
        'Registration failed'
      );
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.token;
      
      if (token) {
        await api.post('/api/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      // Remove token and user from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      return;
    } catch (error: any) {
      // Even if the API call fails, we still want to clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      return rejectWithValue(
        error.message || 
        error.response?.data?.message || 
        'Logout failed'
      );
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || 
        error.response?.data?.message || 
        'Password reset request failed'
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data: { email: string; token: string; password: string; password_confirmation: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/reset-password', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.errors) {
        // Laravel validation errors
        const errorMessages = Object.values(error.response.data.errors).flat();
        return rejectWithValue(errorMessages.join(', '));
      }
      
      return rejectWithValue(
        error.message || 
        error.response?.data?.message || 
        'Password reset failed'
      );
    }
  }
);

// Social Authentication async thunks
export const getSocialAuthUrl = createAsyncThunk(
  'auth/getSocialAuthUrl',
  async (provider: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/auth/${provider}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || 
        error.response?.data?.message || 
        'Failed to get social auth URL'
      );
    }
  }
);

export const handleSocialCallback = createAsyncThunk(
  'auth/handleSocialCallback',
  async (data: { provider: string; code: string; state?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/auth/${data.provider}/callback`, {
        code: data.code,
        state: data.state,
      });
      
      // Store token and user in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || 
        error.response?.data?.message || 
        'Social authentication failed'
      );
    }
  }
);

export const linkSocialAccount = createAsyncThunk(
  'auth/linkSocialAccount',
  async (provider: string, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue('No authentication token found');
      }

      const response = await api.post(`/api/auth/${provider}/link`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update user in localStorage
      if (typeof window !== 'undefined' && response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || 
        error.response?.data?.message || 
        'Failed to link social account'
      );
    }
  }
);

export const unlinkSocialAccount = createAsyncThunk(
  'auth/unlinkSocialAccount',
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue('No authentication token found');
      }

      const response = await api.delete('/api/auth/social/unlink', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update user in localStorage
      if (typeof window !== 'undefined' && response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || 
        error.response?.data?.message || 
        'Failed to unlink social account'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || 'Password reset link sent to your email';
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.message = null;
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || 'Password reset successfully';
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.message = null;
      })
      // Get Social Auth URL
      .addCase(getSocialAuthUrl.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSocialAuthUrl.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(getSocialAuthUrl.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Handle Social Callback
      .addCase(handleSocialCallback.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(handleSocialCallback.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(handleSocialCallback.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Link Social Account
      .addCase(linkSocialAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(linkSocialAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(linkSocialAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Unlink Social Account
      .addCase(unlinkSocialAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unlinkSocialAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(unlinkSocialAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearMessage } = authSlice.actions;
export default authSlice.reducer;