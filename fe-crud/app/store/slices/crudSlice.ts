import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../utils/api';

export interface Item {
  id?: number;
  name: string;
  description: string;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

interface ItemsResponse {
  data: Item[];
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

interface CrudState {
  items: Item[];
  currentItem: Item | null;
  pagination: PaginationMeta | null;
  loading: boolean;
  error: string | null;
}

const initialState: CrudState = {
  items: [],
  currentItem: null,
  pagination: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchItems = createAsyncThunk(
  'crud/fetchItems',
  async (params: { page?: number; per_page?: number } = {}, { rejectWithValue }) => {
    try {
      const { page = 1, per_page = 15 } = params;
      
      console.log('Fetching items with params:', { page, per_page });
      
      const response = await api.get('/items', {
        params: {
          page,
          per_page
        }
      });
      
      console.log('Items fetch response:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching items:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch items'
      );
    }
  }
);

export const createItem = createAsyncThunk(
  'crud/createItem',
  async (itemData: { name: string; description: string }, { rejectWithValue }) => {
    try {
      console.log('Creating item:', itemData);
      
      const response = await api.post('/items', itemData);
      
      console.log('Item created:', response.data);
      
      return response.data.data; // Laravel typically wraps response in data object
    } catch (error: any) {
      console.error('Error creating item:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create item'
      );
    }
  }
);

export const updateItem = createAsyncThunk(
  'crud/updateItem',
  async (itemData: { id: number; name: string; description: string }, { rejectWithValue }) => {
    try {
      console.log('Updating item:', itemData);
      
      const { id, ...updateData } = itemData;
      const response = await api.put(`/items/${id}`, updateData);
      
      console.log('Item updated:', response.data);
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating item:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update item'
      );
    }
  }
);

export const deleteItem = createAsyncThunk(
  'crud/deleteItem',
  async (id: number, { rejectWithValue }) => {
    try {
      console.log('Deleting item:', id);
      
      await api.delete(`/items/${id}`);
      
      console.log('Item deleted:', id);
      
      return id;
    } catch (error: any) {
      console.error('Error deleting item:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete item'
      );
    }
  }
);

const crudSlice = createSlice({
  name: 'crud',
  initialState,
  reducers: {
    setCurrentItem: (state, action: PayloadAction<Item | null>) => {
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
    // Fetch Items
    builder
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || action.payload;
        
        // Handle pagination metadata
        if (action.payload.current_page !== undefined) {
          state.pagination = {
            current_page: action.payload.current_page,
            from: action.payload.from,
            last_page: action.payload.last_page,
            per_page: action.payload.per_page,
            to: action.payload.to,
            total: action.payload.total,
          };
        }
        
        state.error = null;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Item
    builder
      .addCase(createItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload); // Add to beginning of array
        state.currentItem = null; // Clear form
        state.error = null;
      })
      .addCase(createItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Item
    builder
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
        state.currentItem = null; // Clear form
        state.error = null;
      })
      .addCase(updateItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete Item
    builder
      .addCase(deleteItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item.id !== action.payload);
        if (state.currentItem?.id === action.payload) {
          state.currentItem = null;
        }
        state.error = null;
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentItem, clearCurrentItem, clearError } = crudSlice.actions;
export default crudSlice.reducer;