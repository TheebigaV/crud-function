'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from '../store/store';
import { setupAxiosInterceptors } from '../utils/api';

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore>();
  
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore();
    
    // Setup axios interceptors with the store
    setupAxiosInterceptors(storeRef.current);
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}