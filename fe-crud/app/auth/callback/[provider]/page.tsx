'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { handleSocialCallback } from '@/app/store/slices/authSlice';

interface PageProps {
  params: { provider: string };
}

export default function OAuthCallback({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setLoading(true);
        setError(null);

        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');
        const provider = params.provider;

        console.log('OAuth callback received:', {
          provider,
          code: code ? 'present' : 'missing',
          state,
          error: errorParam,
          currentUrl: window.location.href
        });

        // Check for OAuth errors
        if (errorParam) {
          throw new Error(`OAuth error: ${errorParam}`);
        }

        // Check for missing authorization code
        if (!code) {
          throw new Error('Authorization code not found');
        }

        // Check for valid provider
        if (!provider || !['google', 'facebook', 'github'].includes(provider)) {
          throw new Error('Invalid provider');
        }

        console.log('Processing OAuth callback for provider:', provider);

        // Handle the social callback
        const result = await dispatch(handleSocialCallback({
          provider,
          code,
          state: state || undefined
        })).unwrap();

        console.log('OAuth callback successful, result:', result);

        // Wait for state to update
        setTimeout(() => {
          console.log('Redirecting to dashboard...');
          window.location.href = '/dashboard';
        }, 1000);

      } catch (error: any) {
        console.error('OAuth callback error:', error);
        setError(error.message || 'Authentication failed');
        
        // Redirect to login with error after 3 seconds
        setTimeout(() => {
          const errorMessage = encodeURIComponent(error.message || 'Authentication failed');
          router.push(`/login?error=${errorMessage}`);
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    // Always run the callback handler if we have code or error
    if (searchParams.get('code') || searchParams.get('error')) {
      handleCallback();
    } else {
      // No params, redirect to login
      router.push('/login');
    }
  }, [dispatch, router, searchParams, params.provider]);

  // Check if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      console.log('User is authenticated, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Authenticating with {params.provider}...
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Please wait while we complete your authentication
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h3 className="font-bold text-lg mb-2">Authentication Failed</h3>
            <p className="mb-2">{error}</p>
            <p className="text-sm">
              Redirecting to login page in a few seconds...
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold text-lg">Authentication Successful!</h3>
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    </div>
  );
}