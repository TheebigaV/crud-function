import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Types
interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  provider?: string;
  provider_id?: string;
  email_verified_at: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  message: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface SocialCallbackData {
  provider: string;
  code: string;
  state?: string;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  message: null,
};

// Helper function to set auth data in localStorage
const setAuthData = (token: string, user: User) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// Helper function to clear auth data from localStorage
const clearAuthData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      console.log('Attempting login...', { email: credentials.email });
      
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      console.log('Login response:', { success: response.ok, data });

      if (!response.ok) {
        return rejectWithValue(data.message || 'Login failed');
      }

      // Store auth data
      setAuthData(data.token, data.user);

      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      console.log('Attempting registration...', { name: userData.name, email: userData.email });
      
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log('Registration response:', { success: response.ok, data });

      if (!response.ok) {
        return rejectWithValue(data.message || 'Registration failed');
      }

      // Store auth data
      setAuthData(data.token, data.user);

      return data;
    } catch (error: any) {
      console.error('Registration error:', error);
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const getSocialAuthUrl = createAsyncThunk(
  'auth/getSocialAuthUrl',
  async (provider: string, { rejectWithValue }) => {
    try {
      console.log(`Getting ${provider} auth URL...`);
      
      const response = await fetch(`${API_URL}/auth/${provider}/url`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log(`${provider} auth URL response:`, { success: response.ok, data });

      if (!response.ok) {
        return rejectWithValue(data.error || data.message || `Failed to get ${provider} auth URL`);
      }

      return data;
    } catch (error: any) {
      console.error(`${provider} auth URL error:`, error);
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const handleSocialCallback = createAsyncThunk(
  'auth/handleSocialCallback',
  async (callbackData: SocialCallbackData, { rejectWithValue }) => {
    try {
      console.log('Handling social callback...', {
        provider: callbackData.provider,
        hasCode: !!callbackData.code,
        state: callbackData.state
      });
      
      const response = await fetch(`${API_URL}/auth/${callbackData.provider}/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: callbackData.code,
          state: callbackData.state,
          provider: callbackData.provider,
        }),
      });

      const data = await response.json();
      console.log('Social callback response:', { success: response.ok, data });

      if (!response.ok) {
        return rejectWithValue(data.error || data.message || 'Social authentication failed');
      }

      // Store auth data
      setAuthData(data.token, data.user);

      return data;
    } catch (error: any) {
      console.error('Social callback error:', error);
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      console.log('Sending password reset request...', { email });
      
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log('Forgot password response:', { success: response.ok, data });

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to send reset link');
      }

      return data;
    } catch (error: any) {
      console.error('Forgot password error:', error);
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (resetData: { email: string; token: string; password: string; password_confirmation: string }, { rejectWithValue }) => {
    try {
      console.log('Resetting password...', { email: resetData.email });
      
      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resetData),
      });

      const data = await response.json();
      console.log('Reset password response:', { success: response.ok, data });

      if (!response.ok) {
        return rejectWithValue(data.message || 'Password reset failed');
      }

      return data;
    } catch (error: any) {
      console.error('Reset password error:', error);
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const loadAuthFromStorage = createAsyncThunk(
  'auth/loadAuthFromStorage',
  async (_, { rejectWithValue }) => {
    try {
      if (typeof window === 'undefined') {
        return rejectWithValue('Not in browser environment');
      }

      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (!token || !userStr) {
        return rejectWithValue('No auth data found');
      }

      const user = JSON.parse(userStr);

      // Verify token with server
      const response = await fetch(`${API_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        clearAuthData();
        return rejectWithValue('Token invalid');
      }

      const data = await response.json();
      console.log('Auth loaded from storage:', { user: data.user });

      return { token, user: data.user };
    } catch (error: any) {
      console.error('Load auth from storage error:', error);
      clearAuthData();
      return rejectWithValue('Failed to load auth');
    }
  }
);

// Slice
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
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.message = null;
      clearAuthData();
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        state.message = action.payload.message;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })

      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        state.message = action.payload.message;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
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
        state.message = null;
      })
      .addCase(handleSocialCallback.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        state.message = action.payload.message;
      })
      .addCase(handleSocialCallback.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })

      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.message = action.payload.message;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.message = action.payload.message;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Load Auth from Storage
      .addCase(loadAuthFromStorage.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(loadAuthFromStorage.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
      });
  },
});

export const { clearError, clearMessage, logout, setError } = authSlice.actions;
export default authSlice.reducer;