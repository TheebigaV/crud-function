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

// Create Payment Intent
export const createPaymentIntent = createAsyncThunk(
  'payment/createPaymentIntent',
  async (paymentData: CreatePaymentData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      
      console.log('Creating payment intent...');
      console.log('API URL:', API_URL);
      console.log('Payment data:', paymentData);
      
      if (!API_URL) {
        throw new Error('API URL not configured. Please check your .env.local file.');
      }

      const response = await fetch(`${API_URL}/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        let errorMessage = 'Failed to create payment intent';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
      console.log('Parsed result:', result);
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
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      
      console.log('Confirming payment...');
      console.log('Payment Intent ID:', paymentIntentId);
      
      if (!API_URL) {
        throw new Error('API URL not configured. Please check your .env.local file.');
      }

      const response = await fetch(`${API_URL}/payments/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ payment_intent_id: paymentIntentId }),
      });

      const responseText = await response.text();
      console.log('Confirm payment response:', responseText);

      if (!response.ok) {
        let errorMessage = 'Failed to confirm payment';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
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
  async (params: { page?: number; per_page?: number } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      
      if (!API_URL) {
        throw new Error('API URL not configured. Please check your .env.local file.');
      }

      const queryParams = new URLSearchParams({
        page: (params.page || 1).toString(),
        per_page: (params.per_page || 15).toString(),
      });

      const response = await fetch(`${API_URL}/payments/history?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = 'Failed to fetch payment history';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
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
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      
      if (!API_URL) {
        throw new Error('API URL not configured. Please check your .env.local file.');
      }

      const response = await fetch(`${API_URL}/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = 'Failed to fetch payment details';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
      return result;
    } catch (error: any) {
      console.error('Payment details fetch error:', error);
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
        state.payments = action.payload.data;
        state.pagination = {
          current_page: action.payload.current_page,
          last_page: action.payload.last_page,
          per_page: action.payload.per_page,
          total: action.payload.total,
          from: action.payload.from,
          to: action.payload.to,
        };
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
      });
  },
});

export const {
  clearError,
  clearCurrentPayment,
  clearPaymentIntent,
  setCurrentPayment,
} = paymentSlice.actions;

export default paymentSlice.reducer;