'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchItems, deleteItem, setCurrentItem, clearError, clearCurrentItem } from '../store/slices/crudSlice';
import { Item } from '../store/slices/crudSlice';
import Link from 'next/link';

interface ItemListProps {
  onPayClick?: (item: Item) => void;
}

const ItemList = ({ onPayClick }: ItemListProps) => {
  const dispatch = useAppDispatch();
  const { items, pagination, loading, error, currentItem } = useAppSelector((state) => state.crud);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  // Auto-refresh when currentItem is cleared (indicating an item was just updated)
  const [lastCurrentItem, setLastCurrentItem] = useState(currentItem);

  useEffect(() => {
    console.log('ItemList: Fetching items on mount/page change');
    dispatch(fetchItems({ page: currentPage, per_page: perPage }));
  }, [dispatch, currentPage, perPage]);

  // Watch for currentItem changes to trigger refresh
  useEffect(() => {
    // If currentItem was set and is now null, it means an item was just edited/updated
    if (lastCurrentItem && !currentItem) {
      console.log('ItemList: Item was updated, refreshing list');
      dispatch(fetchItems({ page: currentPage, per_page: perPage }));
    }
    setLastCurrentItem(currentItem);
  }, [currentItem, lastCurrentItem, dispatch, currentPage, perPage]);

  const handleRetry = () => {
    console.log('ItemList: Retry button clicked');
    dispatch(clearError());
    dispatch(fetchItems({ page: currentPage, per_page: perPage }));
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      console.log('ItemList: Deleting item', id);
      dispatch(deleteItem(id)).then(() => {
        // Refresh the list after deletion
        dispatch(fetchItems({ page: currentPage, per_page: perPage }));
      });
    }
  };

  const handleEdit = (item: Item) => {
    console.log('ItemList: Editing item', item);
    console.log('ItemList: Item price:', item.price, typeof item.price);
    dispatch(setCurrentItem(item));
  };

  const handlePayClick = (item: Item) => {
    console.log('ItemList: Pay button clicked for item', item);
    
    // Create a payment-ready item object with proper type conversion
    const paymentItem = {
      id: item.id!,
      name: item.name,
      description: item.description,
      price: item.price && typeof item.price === 'number' ? item.price : 
             item.price && typeof item.price === 'string' ? parseFloat(item.price) : 
             undefined
    };

    console.log('ItemList: Payment item created:', paymentItem);

    if (onPayClick) {
      onPayClick(paymentItem);
    }
  };

  const handlePageChange = (page: number) => {
    console.log('ItemList: Changing to page', page);
    setCurrentPage(page);
  };

  const handlePerPageChange = (newPerPage: number) => {
    console.log('ItemList: Changing per page to', newPerPage);
    setPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page when changing per page
  };

  // Enhanced helper function to safely format price for display with extensive logging
  const formatPriceDisplay = (price: any, itemId?: number) => {
    console.log(`ItemList: Formatting price for item ${itemId}:`, {
      price,
      type: typeof price,
      isNull: price === null,
      isUndefined: price === undefined,
      isEmpty: price === '',
      stringValue: String(price),
      jsonValue: JSON.stringify(price)
    });
    
    // Handle null, undefined, or empty string
    if (price === null || price === undefined || price === '') {
      console.log(`ItemList: Item ${itemId} - Price is null/undefined/empty`);
      return 'no-price';
    }
    
    let numPrice: number;
    
    if (typeof price === 'string') {
      // Handle empty strings or whitespace
      if (price.trim() === '') {
        console.log(`ItemList: Item ${itemId} - Price is empty string`);
        return 'no-price';
      }
      numPrice = parseFloat(price);
      console.log(`ItemList: Item ${itemId} - Parsed string price:`, numPrice);
    } else if (typeof price === 'number') {
      numPrice = price;
      console.log(`ItemList: Item ${itemId} - Number price:`, numPrice);
    } else {
      console.log(`ItemList: Item ${itemId} - Price is not string or number:`, typeof price);
      return 'no-price';
    }
    
    if (isNaN(numPrice)) {
      console.log(`ItemList: Item ${itemId} - Price is NaN:`, numPrice);
      return 'no-price';
    }

    if (numPrice <= 0) {
      console.log(`ItemList: Item ${itemId} - Price is <= 0:`, numPrice);
      return 'no-price';
    }
    
    console.log(`ItemList: Item ${itemId} - Valid price found:`, numPrice);
    return numPrice;
  };

  // Manual refresh button
  const handleManualRefresh = () => {
    console.log('ItemList: Manual refresh triggered');
    dispatch(fetchItems({ page: currentPage, per_page: perPage }));
  };

  // Fixed pagination with proper visibility
  const renderPaginationButtons = () => {
    if (!pagination) return null;

    const buttons = [];
    const maxButtons = 7;
    const current = pagination.current_page;
    const last = pagination.last_page;

    let startPage = Math.max(1, current - 3);
    let endPage = Math.min(last, current + 3);

    if (current <= 4) {
      endPage = Math.min(last, 7);
    }
    if (current >= last - 3) {
      startPage = Math.max(1, last - 6);
    }

    // Previous button
    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(current - 1)}
        disabled={current === 1}
        className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-blue-50 hover:text-blue-600 focus:z-20 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Prev
      </button>
    );

    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 bg-white border border-gray-300 hover:bg-blue-50 hover:text-blue-600 focus:z-20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        buttons.push(
          <span
            key="dots1"
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300"
          >
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`relative inline-flex items-center px-4 py-2 text-sm font-bold border focus:z-20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 min-w-[44px] justify-center ${
            i === current
              ? 'z-10 bg-blue-600 text-white border-blue-600 shadow-md'
              : 'text-gray-900 bg-white border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300'
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < last) {
      if (endPage < last - 1) {
        buttons.push(
          <span
            key="dots2"
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300"
          >
            ...
          </span>
        );
      }
      
      buttons.push(
        <button
          key={last}
          onClick={() => handlePageChange(last)}
          className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 bg-white border border-gray-300 hover:bg-blue-50 hover:text-blue-600 focus:z-20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        >
          {last}
        </button>
      );
    }

    buttons.push(
      <button
        key="next"
        onClick={() => handlePageChange(current + 1)}
        disabled={current === last}
        className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-blue-50 hover:text-blue-600 focus:z-20 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        Next
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    );

    return buttons;
  };

  if (loading && items.length === 0) {
    return (
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="text-red-500 mb-4">
          <h3 className="font-bold text-lg mb-2">Error Loading Items</h3>
          <p className="mb-2">{error}</p>
          <p className="text-sm mt-2 text-gray-600">
            Make sure your Laravel server is running and the API endpoints are correct.
          </p>
        </div>
        <button
          onClick={handleRetry}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Items List</h2>
        
        <div className="flex items-center space-x-4">
          {/* Manual refresh button */}
          <button
            onClick={handleManualRefresh}
            className="bg-green-500 hover:bg-green-700 text-white text-sm px-3 py-1 rounded transition-colors"
            disabled={loading}
          >
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          
          {/* Items per page selector */}
          <div className="flex items-center space-x-2">
            <label htmlFor="perPage" className="text-sm text-black">
              Items per page:
            </label>
            <select
              id="perPage"
              value={perPage}
              onChange={(e) => handlePerPageChange(Number(e.target.value))}
              className="border border-black rounded px-2 py-1 text-sm"
            >
              <option value={5} className="text-black">5</option>
              <option value={10} className="text-black">10</option>
              <option value={15} className="text-black">15</option>
              <option value={25} className="text-black">25</option>
              <option value={50} className="text-black">50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alert for items without prices */}
      {items.some(item => formatPriceDisplay(item.price, item.id) === 'no-price') && (
        <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Notice:</strong> Some items don't have valid prices set. You need to edit these items and add a price before they can be used for payments.
                <button 
                  onClick={handleManualRefresh}
                  className="ml-2 text-blue-600 underline hover:text-blue-800"
                >
                  Refresh List
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Debug info */}
      <div className="mb-4 text-xs text-gray-500 bg-gray-50 p-2 rounded">
        Debug: {items.length} items loaded. Loading: {loading ? 'Yes' : 'No'}. 
        Current item: {currentItem?.id || 'None'}
        <button 
          onClick={() => console.log('Current items:', items)}
          className="ml-2 text-blue-600 underline"
        >
          Log Items to Console
        </button>
      </div>

      {/* Pagination info */}
      {pagination && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {pagination.from} to {pagination.to} of {pagination.total} items
        </div>
      )}
      
      {items.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4 text-lg">No items found.</p>
          <p className="text-sm text-gray-600">
            Create your first item using the form on the left!
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">ID</th>
                  <th className="py-3 px-6 text-left">Name</th>
                  <th className="py-3 px-6 text-left">Description</th>
                  <th className="py-3 px-6 text-left">Price</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {items.map((item) => {
                  const displayPrice = formatPriceDisplay(item.price, item.id);
                  
                  return (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-100">
                      <td className="py-3 px-6 text-left">{item.id}</td>
                      <td className="py-3 px-6 text-left font-medium">{item.name}</td>
                      <td className="py-3 px-6 text-left">{item.description}</td>
                      <td className="py-3 px-6 text-left">
                        {displayPrice === 'no-price' ? (
                          <div className="flex items-center">
                            <span className="text-orange-600 font-medium text-sm">
                              No price set
                            </span>
                            <svg className="w-4 h-4 ml-1 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                        ) : (
                          <span className="text-green-600 font-semibold text-base">
                            ${displayPrice.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className={`font-bold py-2 px-3 rounded text-xs transition-colors duration-200 ${
                              displayPrice === 'no-price'
                                ? 'bg-orange-500 hover:bg-orange-700 text-white animate-pulse'
                                : 'bg-blue-500 hover:bg-blue-700 text-white'
                            }`}
                            disabled={loading}
                            title={displayPrice === 'no-price' ? 'Edit item to add price' : 'Edit item'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id!)}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-xs transition-colors duration-200"
                            disabled={loading}
                            title="Delete item"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handlePayClick(item)}
                            className={`font-bold py-2 px-3 rounded text-xs transition-colors duration-200 flex items-center ${
                              displayPrice !== 'no-price'
                                ? 'bg-green-500 hover:bg-green-700 text-white' 
                                : 'bg-gray-400 cursor-not-allowed text-gray-600'
                            }`}
                            disabled={loading || displayPrice === 'no-price'}
                            title={
                              displayPrice !== 'no-price' 
                                ? `Pay for ${item.name}` 
                                : 'Add a price first to enable payments'
                            }
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Pay
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Fixed pagination controls */}
          {pagination && pagination.last_page > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {renderPaginationButtons()}
                </nav>
              </div>
            </div>
          )}

          {/* Pagination summary */}
          {pagination && (
            <div className="text-center text-sm text-gray-600 mt-4 font-medium">
              Page {pagination.current_page} of {pagination.last_page}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ItemList;