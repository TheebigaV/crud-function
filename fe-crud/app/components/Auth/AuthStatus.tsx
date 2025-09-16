'use client';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import Link from 'next/link';
import React from 'react';

const AuthStatus: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="flex items-center space-x-4">
      {isAuthenticated ? (
        <>
          <div className="flex items-center space-x-2">
            {user?.avatar && (
              <img 
                src={user.avatar} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm" 
              />
            )}
            <span className="text-white">Welcome, {user?.name}</span>
          </div>
          <Link 
            href="/profile" 
            className="text-white hover:text-blue-200 transition-colors duration-200"
          >
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100 transition-colors duration-200 font-medium"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link 
            href="/login" 
            className="text-white hover:text-blue-200 transition-colors duration-200"
          >
            Login
          </Link>
          <Link 
            href="/register" 
            className="text-white hover:text-blue-200 transition-colors duration-200"
          >
            Register
          </Link>
        </>
      )}
    </div>
  );
};

export default AuthStatus;