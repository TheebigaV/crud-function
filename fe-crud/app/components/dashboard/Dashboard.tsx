'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ItemForm from '../ItemForm';
import ItemList from '../ItemList';
import PaymentDashboard from '../payments/PaymentDashboard';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<'items' | 'payments'>('items');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Pagination state management
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  
  const { user, isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for tab parameter in URL to switch tabs
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'payments') {
      setActiveTab('payments');
    }
  }, [searchParams]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Handle pagination change - ONLY changes page, no other functions
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Function to switch to payments tab
  const switchToPayments = () => {
    setActiveTab('payments');
    setCurrentPage(1); // Reset pagination when switching tabs
  };

  // Function to switch back to items tab
  const switchToItems = () => {
    setActiveTab('items');
    setCurrentPage(1); // Reset pagination when switching tabs
  };

  // Handle logout
  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Dispatch the logout action from your auth slice
      await dispatch(logout()).unwrap();
      
      // Close the modal
      setShowLogoutConfirm(false);
      
      // Redirect to login page
      router.push('/login');
      
    } catch (error: any) {
      console.error('Logout error:', error);
      
      // Even if API logout fails, clear local state and redirect
      localStorage.removeItem('token');
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      setShowLogoutConfirm(false);
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Show loading spinner if still checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Section */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {user?.name}!
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your items and payments from your dashboard
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {user?.avatar && (
                  <img 
                    src={user.avatar} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full border-2 border-gray-200 shadow-sm" 
                  />
                )}
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="ml-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                  title="Logout"
                >
                  {isLoggingOut ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      Logging out...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 bg-white">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('items')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === 'items'
                  ? 'border-blue-500 text-blue-600 bg-blue-50/30'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Items Management
              </div>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600 bg-blue-50/30'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Payments
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'items' && (
          <div className="space-y-8">
            {/* Items Management */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <ItemForm />
              </div>
              <div className="lg:col-span-2">
                <ItemList 
                  onPayClick={switchToPayments}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <PaymentDashboard onPaymentSuccess={switchToItems} />
          </div>
        )}
      </div>

      {/* Enhanced Pagination Styles for Reference */}
      <style jsx global>{`
        /* Enhanced Pagination Colors */
        .pagination-container {
          @apply bg-white rounded-lg shadow-sm border border-gray-200 p-4;
        }
        
        .pagination-button {
          @apply relative inline-flex items-center px-3 py-2 text-sm font-medium transition-all duration-200;
        }
        
        .pagination-button-active {
          @apply bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md ring-2 ring-blue-500/20 z-10;
        }
        
        .pagination-button-inactive {
          @apply text-gray-700 bg-white hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm border border-gray-300;
        }
        
        .pagination-button-disabled {
          @apply text-gray-400 bg-gray-100 cursor-not-allowed;
        }
        
        .pagination-ellipsis {
          @apply relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300;
        }
      `}</style>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 backdrop-blur-sm">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-xl rounded-xl bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Confirm Logout</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to logout? You will need to login again to access your dashboard.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-4">
                  <button
                    onClick={cancelLogout}
                    disabled={isLoggingOut}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-lg w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:bg-gray-400 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmLogout}
                    disabled={isLoggingOut}
                    className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-lg w-full shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:bg-red-400 transition-all duration-200"
                  >
                    {isLoggingOut ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                        Logging out...
                      </>
                    ) : (
                      'Logout'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;