'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPaymentHistory, clearError } from '../../store/slices/paymentSlice';

interface SelectedItem {
  id: number;
  name: string;
  description?: string;
  price?: number;
}

interface PaymentHistoryProps {
  selectedItem?: SelectedItem | null;
}

const PaymentHistory = ({ selectedItem }: PaymentHistoryProps) => {
  const dispatch = useAppDispatch();
  const { payments, loading, error, pagination } = useAppSelector((state) => state.payment);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllPayments, setShowAllPayments] = useState(!selectedItem);

  useEffect(() => {
    const params: any = { page: currentPage, per_page: 10 };
    
    // If we have a selected item and we're not showing all payments, filter by item
    if (selectedItem && !showAllPayments) {
      params.item_id = selectedItem.id;
    }
    
    dispatch(fetchPaymentHistory(params));
  }, [dispatch, currentPage, selectedItem, showAllPayments]);

  const handleRetry = () => {
    dispatch(clearError());
    const params: any = { page: currentPage, per_page: 10 };
    
    if (selectedItem && !showAllPayments) {
      params.item_id = selectedItem.id;
    }
    
    dispatch(fetchPaymentHistory(params));
  };

  const togglePaymentView = () => {
    setShowAllPayments(!showAllPayments);
    setCurrentPage(1); // Reset to first page when toggling
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
      case 'canceled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const isItemPayment = (payment: any) => {
    return payment.metadata && payment.metadata.item_id;
  };

  const getPaymentItemInfo = (payment: any) => {
    if (!payment.metadata) return null;
    
    return {
      id: payment.metadata.item_id,
      name: payment.metadata.item_name,
      description: payment.metadata.item_description
    };
  };

  if (loading && payments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-red-500 mb-6">
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-bold text-lg">Error Loading Payment History</h3>
          </div>
          <p className="mb-4">{error}</p>
          <p className="text-sm text-gray-600">
            Please check your connection and try again.
          </p>
        </div>
        <button
          onClick={handleRetry}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Payment History
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedItem && !showAllPayments 
                ? `Payments for: ${selectedItem.name}`
                : 'View all your completed transactions'
              }
            </p>
          </div>
          
          {/* Filter Toggle */}
          {selectedItem && (
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePaymentView}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  showAllPayments
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {showAllPayments ? 'Show Item Payments Only' : 'Show All Payments'}
              </button>
            </div>
          )}

          {pagination && (
            <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full ml-3">
              {pagination.total} total payments
            </div>
          )}
        </div>

        {/* Item Info Banner when filtering */}
        {selectedItem && !showAllPayments && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-1 mr-3">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Filtering by: {selectedItem.name}</p>
                {selectedItem.description && (
                  <p className="text-xs text-gray-600">{selectedItem.description}</p>
                )}
                <p className="text-xs text-gray-500">Item ID: #{selectedItem.id}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-300 mb-6">
            {selectedItem && !showAllPayments ? (
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            ) : (
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {selectedItem && !showAllPayments ? 'No payments for this item yet' : 'No payments yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {selectedItem && !showAllPayments 
              ? `You haven't made any payments for "${selectedItem.name}" yet.`
              : 'Your payment history will appear here once you make your first payment.'
            }
          </p>
          {selectedItem && !showAllPayments && (
            <button
              onClick={togglePaymentView}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View all payments instead
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {payments.map((payment, index) => {
            const itemInfo = getPaymentItemInfo(payment);
            const isLatest = index === 0;
            const isForSelectedItem = selectedItem && itemInfo && itemInfo.id === selectedItem.id.toString();
            
            return (
              <div
                key={payment.id}
                className={`p-6 hover:bg-gray-50 transition-colors duration-200 ${
                  isLatest ? 'bg-blue-50/30' : ''
                } ${isForSelectedItem ? 'border-l-4 border-blue-500 bg-blue-50/20' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      payment.status === 'succeeded' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {payment.status === 'succeeded' ? (
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatAmount(payment.amount, payment.currency)}
                        </p>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(payment.status)}`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                        {isLatest && payment.status === 'succeeded' && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                            Latest
                          </span>
                        )}
                        {itemInfo && (
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                            Item Payment
                          </span>
                        )}
                      </div>

                      {/* Item Information */}
                      {itemInfo && (
                        <div className="mb-2 p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center text-sm">
                            <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <div>
                              <p className="font-medium text-gray-900">{itemInfo.name}</p>
                              {itemInfo.description && (
                                <p className="text-xs text-gray-600">{itemInfo.description}</p>
                              )}
                              <p className="text-xs text-gray-500">Item ID: #{itemInfo.id}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-sm text-gray-600 mt-1">
                        {payment.description || (itemInfo ? `Payment for ${itemInfo.name}` : 'Payment transaction')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Transaction ID: #{payment.id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {formatDate(payment.created_at)}
                    </p>
                    {payment.stripe_payment_intent_id && (
                      <p className="text-xs text-gray-400 mt-1">
                        Stripe: {payment.stripe_payment_intent_id.slice(-8)}
                      </p>
                    )}
                  </div>
                </div>
                {payment.metadata && Object.keys(payment.metadata).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <details className="cursor-pointer">
                      <summary className="text-xs text-gray-500 hover:text-gray-700">
                        View details
                      </summary>
                      <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-3 rounded">
                        <pre>{JSON.stringify(payment.metadata, null, 2)}</pre>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {pagination.from} to {pagination.to} of {pagination.total} payments
              {selectedItem && !showAllPayments && ` for ${selectedItem.name}`}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pagination.last_page || loading}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;