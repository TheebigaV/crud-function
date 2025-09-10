'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '../../store/hooks';
import { handleSocialCallback } from '../../store/slices/authSlice';

const SocialCallbackPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const provider = searchParams.get('provider');
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      // Handle error
      router.push('/login?error=' + encodeURIComponent(error));
      return;
    }

    if (provider && code) {
      // Handle successful authentication
      dispatch(
        handleSocialCallback({
          provider: provider ?? undefined,
          code: code ?? undefined,
          state: state ?? undefined,
        })
      )
        .then(() => {
          router.push('/');
        })
        .catch(() => {
          router.push('/login?error=' + encodeURIComponent('Authentication failed'));
        });
    } else {
      // Missing required params, redirect to login
      router.push('/login');
    }
  }, [searchParams, dispatch, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing authentication...</p>
      </div>
    </div>
  );
};

export default SocialCallbackPage;