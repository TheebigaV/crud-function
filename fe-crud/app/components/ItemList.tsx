'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchItems, deleteItem, setCurrentItem, clearError } from '../store/slices/crudSlice';
import { Item } from '../store/slices/crudSlice';
import Link from 'next/link';

interface ItemListProps {
  onPayClick?: () => void;
}

const ItemList = ({ onPayClick }: ItemListProps) => {
  const dispatch = useAppDispatch();
  const { items, pagination, loading, error } = useAppSelector((state) => state.crud);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  useEffect(() => {
    console.log('ItemList: Fetching items on mount/page change');
    dispatch(fetchItems({ page: currentPage, per_page: perPage }));
  }, [dispatch, currentPage, perPage]);

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
    dispatch(setCurrentItem(item));
  };

  const handlePayClick = (item: Item) => {
    console.log('ItemList: Pay button clicked for item', item);
    // You can store the selected item for payment if needed
    // For now, we'll just switch to the payments tab
    if (onPayClick) {
      onPayClick();
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

  // Generate pagination buttons
  const renderPaginationButtons = () => {
    if (!pagination) return null;

    const buttons = [];
    const maxButtons = 5;
    const startPage = Math.max(1, pagination.current_page - Math.floor(maxButtons / 2));
    const endPage = Math.min(pagination.last_page, startPage + maxButtons - 1);

    // Previous button
    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(pagination.current_page - 1)}
        disabled={pagination.current_page === 1}
        className="px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
    );

    // Page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 leading-tight border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
            i === pagination.current_page
              ? 'text-blue-600 bg-blue-50 border-blue-300'
              : 'text-gray-500 bg-white'
          }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    buttons.push(
      <button
        key="next"
        onClick={() => handlePageChange(pagination.current_page + 1)}
        disabled={pagination.current_page === pagination.last_page}
        className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
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
        
        {/* Items per page selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="perPage" className="text-sm text-gray-600">
            Items per page:
          </label>
          <select
            id="perPage"
            value={perPage}
            onChange={(e) => handlePerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
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
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-6 text-left">{item.id}</td>
                    <td className="py-3 px-6 text-left font-medium">{item.name}</td>
                    <td className="py-3 px-6 text-left">{item.description}</td>
                    <td className="py-3 px-6 text-center">
                      <button
                        onClick={() => handleEdit(item)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2 transition-colors duration-200"
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id!)}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2 transition-colors duration-200"
                        disabled={loading}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handlePayClick(item)}
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                        disabled={loading}
                      >
                        Pay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {pagination && pagination.last_page > 1 && (
            <div className="flex justify-center items-center mt-6 space-x-1">
              {renderPaginationButtons()}
            </div>
          )}

          {/* Pagination summary */}
          {pagination && (
            <div className="text-center text-sm text-gray-600 mt-4">
              Page {pagination.current_page} of {pagination.last_page}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ItemList;