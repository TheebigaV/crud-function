import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Helper functions for token management
const setAuthToken = (token: string) => {
  // Store in localStorage
  localStorage.setItem('token', token);
  
  // Store in cookies for middleware
  document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  
  // Set authorization header
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

const clearAuthToken = () => {
  // Remove from localStorage
  localStorage.removeItem('token');
  
  // Remove from cookies
  document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  
  // Remove authorization header
  delete api.defaults.headers.common['Authorization'];
};

const getStoredToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export interface User {
  id: number;
  name: string;
  email: string;
  provider?: string;
  avatar?: string;
  email_verified_at?: string;
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

const initialState: AuthState = {
  user: null,
  token: getStoredToken(),
  isAuthenticated: false,
  loading: false,
  error: null,
  message: null,
};

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }, { rejectWithValue }) => {
    try {
      const response = await api.post('/register', userData);
      const { user, token } = response.data;
      
      setAuthToken(token);
      
      return { user, token };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed'
      );
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/login', credentials);
      const { user, token } = response.data;
      
      setAuthToken(token);
      
      return { user, token };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed'
      );
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/logout');
      
      clearAuthToken();
      
      return null;
    } catch (error: any) {
      // Even if logout fails on server, clear local data
      clearAuthToken();
      
      return rejectWithValue(
        error.response?.data?.message || 'Logout failed'
      );
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await api.post('/forgot-password', { email });
      return response.data.message;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to send reset email'
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  }, { rejectWithValue }) => {
    try {
      const response = await api.post('/reset-password', data);
      return response.data.message;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Password reset failed'
      );
    }
  }
);

export const getSocialAuthUrl = createAsyncThunk(
  'auth/getSocialAuthUrl',
  async (provider: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/auth/${provider}/url`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to get social auth URL'
      );
    }
  }
);

export const handleSocialCallback = createAsyncThunk(
  'auth/handleSocialCallback',
  async (
    { provider, code, state }: { provider: string; code: string; state?: string },
    { rejectWithValue }
  ) => {
    try {
      console.log('Making social callback request:', { provider, code: 'present', state });
      
      const response = await api.post(`/auth/${provider}/callback`, {
        code,
        state,
      });
      
      console.log('Social callback response:', response.data);
      
      const { user, token } = response.data;
      
      if (!user || !token) {
        throw new Error('Invalid response: missing user or token');
      }
      
      setAuthToken(token);
      console.log('Token stored successfully');
      
      return { user, token };
    } catch (error: any) {
      console.error('Social callback error:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Social authentication failed'
      );
    }
  }
);

export const linkSocialAccount = createAsyncThunk(
  'auth/linkSocialAccount',
  async (provider: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/auth/${provider}/link`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to link social account'
      );
    }
  }
);

export const unlinkSocialAccount = createAsyncThunk(
  'auth/unlinkSocialAccount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/unlink');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to unlink social account'
      );
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = getStoredToken();
      if (!token) {
        throw new Error('No token found');
      }
      
      // Set authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await api.get('/user');
      return { user: response.data.user, token };
    } catch (error: any) {
      // Clear invalid token
      clearAuthToken();
      
      return rejectWithValue(
        error.response?.data?.message || 'Authentication check failed'
      );
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/refresh');
      const { user, token } = response.data;
      
      setAuthToken(token);
      
      return { user, token };
    } catch (error: any) {
      // Clear invalid token
      clearAuthToken();
      
      return rejectWithValue(
        error.response?.data?.message || 'Token refresh failed'
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
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      console.log('Setting credentials in Redux state:', action.payload);
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      
      // Ensure token is stored
      setAuthToken(action.payload.token);
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.message = null;
      
      clearAuthToken();
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
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
      });

    // Login
    builder
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
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.message = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        // Still clear credentials even if logout failed
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });

    // Forgot Password
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Reset Password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Social Authentication
    builder
      .addCase(getSocialAuthUrl.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSocialAuthUrl.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(getSocialAuthUrl.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Social Callback
    builder
      .addCase(handleSocialCallback.pending, (state) => {
        console.log('Social callback pending...');
        state.loading = true;
        state.error = null;
      })
      .addCase(handleSocialCallback.fulfilled, (state, action) => {
        console.log('Social callback fulfilled:', action.payload);
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(handleSocialCallback.rejected, (state, action) => {
        console.log('Social callback rejected:', action.payload);
        state.loading = false;
        state.error = action.payload as string;
      });

    // Link Social Account
    builder
      .addCase(linkSocialAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(linkSocialAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        state.error = null;
      })
      .addCase(linkSocialAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Unlink Social Account
    builder
      .addCase(unlinkSocialAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
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

    // Check Auth
    builder
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null; // Don't show error for failed auth check
      });

    // Refresh Token
    builder
      .addCase(refreshToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearError, clearMessage, setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;