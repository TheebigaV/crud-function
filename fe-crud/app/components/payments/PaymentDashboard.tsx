'use client';

import { useState, useEffect } from 'react';
import PaymentForm from './PaymentForm';
import PaymentHistory from './PaymentHistory';

interface PaymentDashboardProps {
  onPaymentSuccess?: () => void;
  selectedItem?: {
    id: number;
    name: string;
    description?: string;
    price?: number;
  } | null;
  onClearSelection?: () => void;
}

const PaymentDashboard = ({ onPaymentSuccess, selectedItem, onClearSelection }: PaymentDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'payment' | 'history'>('payment');

  // Helper function to safely format price
  const formatPrice = (price: any): number | undefined => {
    if (price === null || price === undefined || price === '') {
      return undefined;
    }
    
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numPrice) || numPrice <= 0) {
      return undefined;
    }
    
    return numPrice;
  };

  // Auto-switch to payment tab when an item is selected
  useEffect(() => {
    if (selectedItem) {
      setActiveTab('payment');
      console.log('PaymentDashboard: Auto-switching to payment tab for selected item:', selectedItem);
    }
  }, [selectedItem]);

  // Function to switch to payment history tab
  const handleRedirectToHistory = () => {
    setActiveTab('history');
  };

  // Handle clearing item selection
  const handleClearSelection = () => {
    if (onClearSelection) {
      onClearSelection();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center">
            <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Payment Center
          </h1>
          <p className="text-gray-600">
            {selectedItem ? `Pay for: ${selectedItem.name}` : 'Secure payments and transaction history'}
          </p>
        </div>
        
        {/* Enhanced Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200 bg-white rounded-t-lg">
            <nav className="flex space-x-8 justify-center px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('payment')}
                className={`py-4 px-6 border-b-2 font-semibold text-sm transition-all duration-200 flex items-center ${
                  activeTab === 'payment'
                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {selectedItem ? 'Pay for Item' : 'Make Payment'}
                {activeTab === 'payment' && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    Active
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-6 border-b-2 font-semibold text-sm transition-all duration-200 flex items-center ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Payment History
                {activeTab === 'history' && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    Active
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content with Smooth Transitions */}
        <div className="tab-content">
          <div className={`transition-all duration-300 ${activeTab === 'payment' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute pointer-events-none'}`}>
            {activeTab === 'payment' && (
              <div className="max-w-md mx-auto">
                <PaymentForm 
                  onPaymentSuccess={onPaymentSuccess}
                  onRedirectToHistory={handleRedirectToHistory}
                  selectedItem={selectedItem}
                  onClearSelection={handleClearSelection}
                />
              </div>
            )}
          </div>
          
          <div className={`transition-all duration-300 ${activeTab === 'history' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute pointer-events-none'}`}>
            {activeTab === 'history' && (
              <div>
                <PaymentHistory selectedItem={selectedItem} />
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Footer */}
        {activeTab === 'history' && (
          <div className="mt-8 text-center">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Need to make another payment?</h3>
              <p className="text-gray-600 mb-4">
                {selectedItem 
                  ? `Continue paying for ${selectedItem.name} or switch back to process new transactions`
                  : 'Switch back to the payment form to process new transactions'
                }
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setActiveTab('payment')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {selectedItem ? 'Pay for Item' : 'Make New Payment'}
                </button>
                {selectedItem && (
                  <button
                    onClick={handleClearSelection}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear Selection
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentDashboard;