'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { checkAuth } from '../store/slices/authSlice';
import Dashboard from '@/app/components/dashboard/Dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, user } = useAppSelector((state) => state.auth);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('Dashboard: Initializing auth check');
      
      const token = localStorage.getItem('token');
      
      if (token && !isAuthenticated) {
        console.log('Dashboard: Token found, checking auth');
        // We have a token but not authenticated in state, check auth
        try {
          await dispatch(checkAuth()).unwrap();
          console.log('Dashboard: Auth check successful');
        } catch (error) {
          console.error('Dashboard: Auth check failed:', error);
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
      } else if (!token && !isAuthenticated) {
        console.log('Dashboard: No token found, redirecting to login');
        // No token and not authenticated, redirect to login
        router.push('/login');
        return;
      } else if (isAuthenticated) {
        console.log('Dashboard: User already authenticated');
      }
      
      setInitializing(false);
    };

    initializeAuth();
  }, [dispatch, isAuthenticated, router]);

  useEffect(() => {
    // If we finish loading and we're still not authenticated, redirect
    if (!loading && !initializing && !isAuthenticated) {
      console.log('Dashboard: Not authenticated after loading, redirecting to login');
      router.push('/login');
    }
  }, [loading, initializing, isAuthenticated, router]);

  // Show loading while initializing or while auth is loading
  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // User is authenticated, show the dashboard
  console.log('Dashboard: Rendering dashboard component for user:', user.email);
  return <Dashboard />;
}