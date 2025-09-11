import { configureStore } from '@reduxjs/toolkit';
import crudReducer from './slices/crudSlice';
import authReducer, { logout } from './slices/authSlice';
import { setupAxiosInterceptors } from '../utils/api';

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      crud: crudReducer,
    },
  });

  // Setup axios interceptors with store reference
  setupAxiosInterceptors(store);

  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];