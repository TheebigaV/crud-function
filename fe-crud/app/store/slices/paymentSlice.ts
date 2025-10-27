import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Payment {
  id: number;
  user_id: number;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  description?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CreatePaymentData {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: any;
}

export interface PaymentHistoryParams {
  page?: number;
  per_page?: number;
  item_id?: number;
}

export interface PaymentState {
  payments: Payment[];
  currentPayment: Payment | null;
  paymentIntent: PaymentIntent | null;
  loading: boolean;
  error: string | null;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  } | null;
}

const initialState: PaymentState = {
  payments: [],
  currentPayment: null,
  paymentIntent: null,
  loading: false,
  error: null,
  pagination: null,
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found. Please login again.');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  };
};

// Helper function to make authenticated API calls
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  if (!API_URL) {
    throw new Error('API URL not configured. Please check your .env.local file.');
  }

  const headers = getAuthHeaders();
  
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  const responseText = await response.text();
  
  // Handle authentication errors specifically
  if (response.status === 401) {
    localStorage.removeItem('token'); // Clear invalid token
    throw new Error('Authentication failed. Please login again.');
  }
  
  if (!response.ok) {
    let errorMessage = 'Request failed';
    try {
      const errorData = JSON.parse(responseText);
      errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
    } catch (e) {
      errorMessage = `HTTP ${response.status}: ${responseText || response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    throw new Error('Invalid JSON response from server');
  }
};

// Create Payment Intent
export const createPaymentIntent = createAsyncThunk(
  'payment/createPaymentIntent',
  async (paymentData: CreatePaymentData, { rejectWithValue }) => {
    try {
      console.log('Creating payment intent...', paymentData);
      
      const result = await makeAuthenticatedRequest('/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({
          ...paymentData,
          currency: paymentData.currency || 'usd',
        }),
      });

      console.log('Payment intent created:', result);
      return result;
    } catch (error: any) {
      console.error('Payment intent creation error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Confirm Payment
export const confirmPayment = createAsyncThunk(
  'payment/confirmPayment',
  async (paymentIntentId: string, { rejectWithValue }) => {
    try {
      console.log('Confirming payment...', paymentIntentId);
      
      const result = await makeAuthenticatedRequest('/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({ payment_intent_id: paymentIntentId }),
      });

      console.log('Payment confirmed:', result);
      return result;
    } catch (error: any) {
      console.error('Payment confirmation error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Fetch Payment History
export const fetchPaymentHistory = createAsyncThunk(
  'payment/fetchPaymentHistory',
  async (params: PaymentHistoryParams = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        page: (params.page || 1).toString(),
        per_page: (params.per_page || 15).toString(),
      });

      if (params.item_id) {
        queryParams.append('item_id', params.item_id.toString());
      }

      console.log('Fetching payment history with params:', Object.fromEntries(queryParams.entries()));

      const result = await makeAuthenticatedRequest(`/payments/history?${queryParams}`);

      console.log('Payment history result:', result);
      return result;
    } catch (error: any) {
      console.error('Payment history fetch error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Get Payment Details
export const getPaymentDetails = createAsyncThunk(
  'payment/getPaymentDetails',
  async (paymentId: number, { rejectWithValue }) => {
    try {
      const result = await makeAuthenticatedRequest(`/payments/${paymentId}`);
      return result;
    } catch (error: any) {
      console.error('Payment details fetch error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Test Stripe Connection
export const testStripeConnection = createAsyncThunk(
  'payment/testStripeConnection',
  async (_, { rejectWithValue }) => {
    try {
      const result = await makeAuthenticatedRequest('/payments/test-stripe');
      return result;
    } catch (error: any) {
      console.error('Stripe connection test error:', error);
      return rejectWithValue(error.message);
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPayment: (state) => {
      state.currentPayment = null;
    },
    clearPaymentIntent: (state) => {
      state.paymentIntent = null;
    },
    setCurrentPayment: (state, action: PayloadAction<Payment | null>) => {
      state.currentPayment = action.payload;
    },
    // Add action to handle auth errors
    handleAuthError: (state) => {
      state.loading = false;
      state.error = 'Authentication failed. Please login again.';
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Payment Intent
      .addCase(createPaymentIntent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPaymentIntent.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentIntent = action.payload.data;
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Confirm Payment
      .addCase(confirmPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPayment = action.payload.data;
        // Add to payments list if not already there
        const existingIndex = state.payments.findIndex(p => p.id === action.payload.data.id);
        if (existingIndex === -1) {
          state.payments.unshift(action.payload.data);
        } else {
          state.payments[existingIndex] = action.payload.data;
        }
      })
      .addCase(confirmPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch Payment History
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload.data || action.payload.payments || [];
        
        // Handle pagination metadata
        if (action.payload.current_page !== undefined) {
          state.pagination = {
            current_page: action.payload.current_page,
            last_page: action.payload.last_page,
            per_page: action.payload.per_page,
            total: action.payload.total,
            from: action.payload.from,
            to: action.payload.to,
          };
        } else if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get Payment Details
      .addCase(getPaymentDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPaymentDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPayment = action.payload.data;
      })
      .addCase(getPaymentDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Test Stripe Connection
      .addCase(testStripeConnection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(testStripeConnection.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(testStripeConnection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearCurrentPayment,
  clearPaymentIntent,
  setCurrentPayment,
  handleAuthError,
} = paymentSlice.actions;

export default paymentSlice.reducer;