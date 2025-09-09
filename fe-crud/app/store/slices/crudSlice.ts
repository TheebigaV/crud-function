import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '../store';

// Use environment variable with fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Item {
  id?: number;
  name: string;
  description: string;
}

interface CrudState {
  items: Item[];
  loading: boolean;
  error: string | null;
  currentItem: Item | null;
}

const initialState: CrudState = {
  items: [],
  loading: false,
  error: null,
  currentItem: null,
};

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Async thunks
export const fetchItems = createAsyncThunk(
  'crud/fetchItems',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/api/items`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        `API Error: ${error.message} - Please check if your Laravel server is running on ${API_BASE_URL}`
      );
    }
  }
);

export const createItem = createAsyncThunk(
  'crud/createItem',
  async (itemData: Omit<Item, 'id'>, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const response = await axios.post(`${API_BASE_URL}/api/items`, itemData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        `Failed to create item: ${error.message}`
      );
    }
  }
);

export const updateItem = createAsyncThunk(
  'crud/updateItem',
  async ({ id, ...itemData }: Item, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const response = await axios.put(`${API_BASE_URL}/api/items/${id}`, itemData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        `Failed to update item: ${error.message}`
      );
    }
  }
);

export const deleteItem = createAsyncThunk(
  'crud/deleteItem',
  async (id: number, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      await axios.delete(`${API_BASE_URL}/api/items/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        `Failed to delete item: ${error.message}`
      );
    }
  }
);

const crudSlice = createSlice({
  name: 'crud',
  initialState,
  reducers: {
    setCurrentItem: (state, action: PayloadAction<Item>) => {
      state.currentItem = action.payload;
    },
    clearCurrentItem: (state) => {
      state.currentItem = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch items
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create item
      .addCase(createItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update item
      .addCase(updateItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateItem.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.currentItem = null;
      })
      .addCase(updateItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete item
      .addCase(deleteItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentItem, clearCurrentItem, clearError } = crudSlice.actions;
export default crudSlice.reducer;