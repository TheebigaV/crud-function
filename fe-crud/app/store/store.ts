import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import crudReducer from './slices/crudSlice';
import paymentReducer from './slices/paymentSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      crud: crudReducer,
      payment: paymentReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST'],
        },
      }),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];