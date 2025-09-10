'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/app/store/hooks';
import { handleSocialCallback } from '@/app/store/slices/authSlice';

export default function OAuthCallback({ params }: { params: { provider: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          throw new Error(`OAuth error: ${errorParam}`);
        }

        if (!code) {
          throw new Error('Authorization code not found');
        }

        // Get the provider from URL params
        const provider = params.provider;

        console.log('Handling OAuth callback for provider:', provider);
        console.log('Authorization code:', code.substring(0, 20) + '...');

        // Handle the social callback
        await dispatch(handleSocialCallback({
          provider,
          code,
          state: state || undefined
        })).unwrap();

        console.log('OAuth callback successful, redirecting to dashboard');

        // Success - redirect to dashboard
        router.push('/');
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        setError(error.message || 'Authentication failed');
        
        // Redirect to login with error after 3 seconds
        setTimeout(() => {
          router.push(`/login?error=${encodeURIComponent(error.message || 'Authentication failed')}`);
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [dispatch, router, searchParams, params.provider]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Authenticating with Google...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h3 className="font-bold">Authentication Failed</h3>
            <p>{error}</p>
          </div>
          <p className="text-gray-600">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Authentication successful! Redirecting...
        </div>
      </div>
    </div>
  );
}