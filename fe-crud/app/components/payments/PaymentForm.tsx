'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  createPaymentIntent,
  confirmPayment,
  clearError,
  clearPaymentIntent,
  fetchPaymentHistory
} from '../../store/slices/paymentSlice';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface SelectedItem {
  id: number;
  name: string;
  description?: string;
  price?: number;
}

interface PaymentFormContentProps {
  onPaymentSuccess?: () => void;
  onRedirectToHistory?: () => void;
  selectedItem?: SelectedItem | null;
  onClearSelection?: () => void;
}

const PaymentFormContent = ({ onPaymentSuccess, onRedirectToHistory, selectedItem, onClearSelection }: PaymentFormContentProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useAppDispatch();
  const { paymentIntent, loading, error } = useAppSelector((state) => state.payment);
  
  // Safe function to format price - now handles required prices
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

  const [formData, setFormData] = useState({
    amount: selectedItem?.price ? formatPrice(selectedItem.price)?.toString() || '' : '',
    currency: 'usd',
    description: selectedItem ? `Payment for ${selectedItem.name}` : '',
  });
  const [cardError, setCardError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [completedPayment, setCompletedPayment] = useState<any>(null);

  // Update form when selected item changes
  useEffect(() => {
    if (selectedItem) {
      const formattedPrice = formatPrice(selectedItem.price);
      console.log('PaymentForm: Selected item changed', selectedItem);
      console.log('PaymentForm: Formatted price', formattedPrice);
      
      setFormData(prev => ({
        ...prev,
        amount: formattedPrice ? formattedPrice.toString() : '',
        description: `Payment for ${selectedItem.name}${selectedItem.description ? ` - ${selectedItem.description}` : ''}`,
      }));
    }
  }, [selectedItem]);

  useEffect(() => {
    return () => {
      dispatch(clearPaymentIntent());
    };
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    
    if (error) {
      dispatch(clearError());
    }
  };

  const handleCardChange = (event: any) => {
    setCardError(event.error ? event.error.message : null);
    setCardComplete(event.complete);
  };

  const handleCreatePaymentIntent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountValue = parseFloat(formData.amount);
    console.log('PaymentForm: Creating payment intent with amount:', amountValue);
    
    if (!formData.amount || amountValue <= 0) {
      setCardError('Please enter a valid amount');
      return;
    }

    if (amountValue < 0.5) {
      setCardError('Minimum amount is $0.50');
      return;
    }

    const amount = Math.round(amountValue * 100); // Convert to cents
    console.log('PaymentForm: Amount in cents:', amount);
    
    try {
      // Include item information in metadata
      const metadata: any = {};
      if (selectedItem) {
        metadata.item_id = selectedItem.id.toString();
        metadata.item_name = selectedItem.name;
        if (selectedItem.description) {
          metadata.item_description = selectedItem.description;
        }
        // Store the original item price for reference
        if (selectedItem.price) {
          metadata.item_original_price = formatPrice(selectedItem.price)?.toString() || '';
        }
      }

      console.log('PaymentForm: Metadata for payment:', metadata);

      await dispatch(createPaymentIntent({
        amount,
        currency: formData.currency,
        description: formData.description || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      })).unwrap();
    } catch (error: any) {
      console.error('Failed to create payment intent:', error);
      setCardError(error.message || 'Failed to create payment. Please try again.');
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !paymentIntent) {
      return;
    }

    setProcessing(true);
    setCardError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setCardError('Card element not found');
      setProcessing(false);
      return;
    }

    console.log('PaymentForm: Confirming payment for amount:', paymentIntent.amount / 100);

    const { error: stripeError, paymentIntent: confirmedPaymentIntent } = await stripe.confirmCardPayment(
      paymentIntent.client_secret,
      {
        payment_method: {
          card: cardElement,
        },
      }
    );

    if (stripeError) {
      setCardError(stripeError.message || 'An error occurred');
      setProcessing(false);
    } else if (confirmedPaymentIntent?.status === 'succeeded') {
      try {
        // Confirm payment in backend and get the payment record
        const confirmedPayment = await dispatch(confirmPayment(confirmedPaymentIntent.id)).unwrap();
        console.log('PaymentForm: Payment confirmed:', confirmedPayment);
        
        setSucceeded(true);
        setCompletedPayment(confirmedPayment);
        
        // Refresh payment history to include the new payment
        const historyParams: any = { page: 1, per_page: 10 };
        if (selectedItem) {
          historyParams.item_id = selectedItem.id;
        }
        dispatch(fetchPaymentHistory(historyParams));
        
        // Clear form data but keep item-specific information if item is selected
        setFormData({ 
          amount: selectedItem?.price ? formatPrice(selectedItem.price)?.toString() || '' : '', 
          currency: 'usd', 
          description: selectedItem ? `Payment for ${selectedItem.name}` : '' 
        });
        
        // Redirect to payment history after 3 seconds
        setTimeout(() => {
          setSucceeded(false);
          dispatch(clearPaymentIntent());
          
          if (onRedirectToHistory) {
            onRedirectToHistory();
          } else if (onPaymentSuccess) {
            onPaymentSuccess();
          }
        }, 3000);
      } catch (error: any) {
        setCardError(error.message || 'Payment succeeded but failed to update our records');
      }
    }

    setProcessing(false);
  };

  const handleViewHistory = () => {
    setSucceeded(false);
    dispatch(clearPaymentIntent());
    if (onRedirectToHistory) {
      onRedirectToHistory();
    }
  };

  const handleClearSelection = () => {
    if (onClearSelection) {
      onClearSelection();
    }
    // Reset form when clearing selection
    setFormData({
      amount: '',
      currency: 'usd',
      description: '',
    });
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#374151',
        fontFamily: '"Inter", "system-ui", "sans-serif"',
        fontWeight: '400',
        lineHeight: '24px',
        '::placeholder': {
          color: '#9CA3AF',
        },
        iconColor: '#6B7280',
      },
      invalid: {
        color: '#EF4444',
        iconColor: '#EF4444',
      },
      complete: {
        color: '#059669',
        iconColor: '#059669',
      },
    },
    hidePostalCode: false,
  };

  if (succeeded) {
    return (
      <div className="max-w-md mx-auto bg-white shadow-xl rounded-2xl p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
          <p className="text-gray-600 mb-6">
            {selectedItem 
              ? `Your payment for "${selectedItem.name}" has been processed successfully.`
              : 'Your payment has been processed successfully.'
            }
          </p>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="space-y-2">
              <p className="text-green-800 font-semibold text-lg">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: paymentIntent.currency.toUpperCase(),
                }).format(paymentIntent.amount / 100)}
              </p>
              {selectedItem && (
                <div className="bg-green-100 rounded-lg p-3 mb-3">
                  <p className="text-green-800 font-medium text-sm">Item: {selectedItem.name}</p>
                  {selectedItem.description && (
                    <p className="text-green-700 text-xs">{selectedItem.description}</p>
                  )}
                  {selectedItem.price && formatPrice(selectedItem.price) && (
                    <p className="text-green-700 text-xs">
                      Item Price: ${formatPrice(selectedItem.price)!.toFixed(2)}
                    </p>
                  )}
                </div>
              )}
              {completedPayment?.description && (
                <p className="text-green-700 text-sm">
                  {completedPayment.description}
                </p>
              )}
              {completedPayment?.id && (
                <p className="text-green-600 text-xs">
                  Transaction ID: #{completedPayment.id}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleViewHistory}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              View Payment History
            </button>
            <p className="text-xs text-gray-500">
              Automatically redirecting to payment history in 3 seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white shadow-xl rounded-2xl p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {selectedItem ? `Pay for ${selectedItem.name}` : 'Secure Payment'}
        </h2>
        <p className="text-gray-600 mt-2">Your payment information is encrypted and secure</p>
      </div>
      
      {(error || cardError) && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error || cardError}</p>
            </div>
          </div>
        </div>
      )}

      {!paymentIntent ? (
        <form onSubmit={handleCreatePaymentIntent} className="space-y-6">
          {/* Item Information Display */}
          {selectedItem && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    {selectedItem.name}
                  </h3>
                  {selectedItem.description && (
                    <p className="text-sm text-gray-600 mt-1">{selectedItem.description}</p>
                  )}
                  {selectedItem.price && formatPrice(selectedItem.price) && (
                    <p className="text-sm text-blue-600 font-medium mt-1">
                      Item Price: ${formatPrice(selectedItem.price)!.toFixed(2)}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    Item ID: #{selectedItem.id}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                  title="Clear item selection"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
              <input
                type="number"
                name="amount"
                step="0.01"
                min="0.50"
                value={formData.amount}
                onChange={handleChange}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                placeholder={
                  selectedItem?.price && formatPrice(selectedItem.price) 
                    ? formatPrice(selectedItem.price)!.toFixed(2)
                    : "Enter amount"
                }
                required
                autoComplete="off"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Minimum amount: $0.50</span>
              {selectedItem?.price && formatPrice(selectedItem.price) && (
                <span className="text-blue-600">
                  Item Price: ${formatPrice(selectedItem.price)!.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Currency
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
              disabled={loading}
            >
              <option value="usd">USD - US Dollar</option>
              <option value="eur">EUR - Euro</option>
              <option value="gbp">GBP - British Pound</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description {!selectedItem && '(Optional)'}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-gray-900 placeholder-gray-400 bg-white"
              rows={3}
              placeholder={selectedItem ? `Payment for ${selectedItem.name}` : "What is this payment for?"}
              disabled={loading}
              readOnly={!!selectedItem}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Payment...
              </div>
            ) : (
              `Continue to Payment`
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmitPayment} className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Payment Summary
            </h3>
            {selectedItem && (
              <div className="mb-3 p-3 bg-white rounded-lg border border-blue-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{selectedItem.name}</p>
                    {selectedItem.description && (
                      <p className="text-sm text-gray-600">{selectedItem.description}</p>
                    )}
                    {selectedItem.price && formatPrice(selectedItem.price) && (
                      <p className="text-sm text-blue-600">
                        Item Price: ${formatPrice(selectedItem.price)!.toFixed(2)}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">Item ID: #{selectedItem.id}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount to Pay:</span>
                <span className="font-semibold text-gray-900">
                  ${(paymentIntent.amount / 100).toFixed(2)} {paymentIntent.currency.toUpperCase()}
                </span>
              </div>
              {formData.description && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Description:</span>
                  <span className="text-gray-900 text-sm">{formData.description}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Card Information *
            </label>
            {!stripe || !elements ? (
              <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50 min-h-[50px] flex items-center justify-center">
                <p className="text-gray-500">Loading payment form...</p>
              </div>
            ) : (
              <div className="relative">
                <div className="border-2 border-gray-300 rounded-lg p-4 bg-white min-h-[50px] transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                  <CardElement
                    options={cardElementOptions}
                    onChange={handleCardChange}
                    onReady={() => console.log('CardElement ready - you can now type!')}
                    onFocus={() => console.log('CardElement focused')}
                    onBlur={() => console.log('CardElement blurred')}
                  />
                </div>
                {cardComplete && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Your payment information is encrypted and secure
            </p>
            {!stripe && (
              <p className="text-xs text-red-500 mt-1">
                ⚠️ Stripe not loaded. Check console for errors.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => dispatch(clearPaymentIntent())}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={processing}
            >
              Back
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!stripe || processing || !cardComplete}
            >
              {processing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                `Pay ${(paymentIntent.amount / 100).toFixed(2)}`
              )}
            </button>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                SSL Encrypted
              </div>
              <div className="flex items-center">
                <span className="font-semibold">Stripe</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                PCI Compliant
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

interface PaymentFormProps {
  onPaymentSuccess?: () => void;
  onRedirectToHistory?: () => void;
  selectedItem?: SelectedItem | null;
  onClearSelection?: () => void;
}

const PaymentForm = ({ onPaymentSuccess, onRedirectToHistory, selectedItem, onClearSelection }: PaymentFormProps) => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="max-w-md mx-auto bg-white shadow-xl rounded-2xl p-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-red-800">Stripe Configuration Error</h4>
              <p className="text-sm text-red-700">Stripe publishable key not found. Please check your .env.local file.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent 
        onPaymentSuccess={onPaymentSuccess} 
        onRedirectToHistory={onRedirectToHistory}
        selectedItem={selectedItem}
        onClearSelection={onClearSelection}
      />
    </Elements>
  );
};

export default PaymentForm;