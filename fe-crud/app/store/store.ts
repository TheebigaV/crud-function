import { configureStore } from '@reduxjs/toolkit';
import crudReducer from '@/app/store/slices/crudSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      crud: crudReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];