import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

export interface Item {
  id?: number;
  name: string;
  description: string;
}

interface PaginationData {
  data: Item[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
  has_more_pages: boolean;
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

interface CrudState {
  items: Item[];
  pagination: Omit<PaginationData, 'data'> | null;
  loading: boolean;
  error: string | null;
  currentItem: Item | null;
}

const initialState: CrudState = {
  items: [],
  pagination: null,
  loading: false,
  error: null,
  currentItem: null,
};

// Async thunks
export const fetchItems = createAsyncThunk(
  'crud/fetchItems',
  async (params: { page?: number; per_page?: number } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      
      const response = await api.get(`/api/items?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || 
        error.response?.data?.message || 
        'Failed to fetch items'
      );
    }
  }
);

export const createItem = createAsyncThunk(
  'crud/createItem',
  async (itemData: Omit<Item, 'id'>, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/items', itemData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || 
        error.response?.data?.message || 
        'Failed to create item'
      );
    }
  }
);

export const updateItem = createAsyncThunk(
  'crud/updateItem',
  async ({ id, ...itemData }: Item, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/items/${id}`, itemData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || 
        error.response?.data?.message || 
        'Failed to update item'
      );
    }
  }
);

export const deleteItem = createAsyncThunk(
  'crud/deleteItem',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/api/items/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.message || 
        error.response?.data?.message || 
        'Failed to delete item'
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
    // Add reducer to reset CRUD state on logout
    resetCrudState: (state) => {
      state.items = [];
      state.pagination = null;
      state.currentItem = null;
      state.error = null;
      state.loading = false;
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
        const paginationData = action.payload as PaginationData;
        state.items = paginationData.data;
        state.pagination = {
          current_page: paginationData.current_page,
          per_page: paginationData.per_page,
          total: paginationData.total,
          last_page: paginationData.last_page,
          from: paginationData.from,
          to: paginationData.to,
          has_more_pages: paginationData.has_more_pages,
          links: paginationData.links,
        };
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
        state.items.unshift(action.payload); // Add to beginning for latest first
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
        // Update pagination total if available
        if (state.pagination) {
          state.pagination.total = Math.max(0, state.pagination.total - 1);
        }
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentItem, clearCurrentItem, clearError, resetCrudState } = crudSlice.actions;
export default crudSlice.reducer;