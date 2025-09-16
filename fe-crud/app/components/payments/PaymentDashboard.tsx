'use client';

import { useState } from 'react';
import PaymentForm from './PaymentForm';
import PaymentHistory from './PaymentHistory';

interface PaymentDashboardProps {
  onPaymentSuccess?: () => void;
}

const PaymentDashboard = ({ onPaymentSuccess }: PaymentDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'payment' | 'history'>('payment');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Payment Center</h1>
        
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 justify-center">
            <button
              onClick={() => setActiveTab('payment')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'payment'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Make Payment
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Payment History
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'payment' && (
            <div className="max-w-md mx-auto">
              <PaymentForm onPaymentSuccess={onPaymentSuccess} />
            </div>
          )}
          
          {activeTab === 'history' && (
            <div>
              <PaymentHistory />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDashboard;