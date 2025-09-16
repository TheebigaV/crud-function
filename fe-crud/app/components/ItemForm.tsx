'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createItem, updateItem, clearCurrentItem, clearError, fetchItems } from '../store/slices/crudSlice';

const ItemForm = () => {
  const dispatch = useAppDispatch();
  const { currentItem, loading, error } = useAppSelector((state) => state.crud);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (currentItem) {
      console.log('ItemForm: Editing item', currentItem);
      setFormData({
        name: currentItem.name || '',
        description: currentItem.description || '',
      });
    } else {
      console.log('ItemForm: Creating new item');
      setFormData({
        name: '',
        description: '',
      });
    }
  }, [currentItem]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    
    if (error) {
      dispatch(clearError());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (currentItem && currentItem.id) {
        console.log('ItemForm: Updating item', currentItem.id);
        await dispatch(updateItem({ ...formData, id: currentItem.id })).unwrap();
      } else {
        console.log('ItemForm: Creating new item');
        await dispatch(createItem(formData)).unwrap();
      }
      
      // Reset form after successful submission
      setFormData({ name: '', description: '' });
      
      // Refresh the items list
      dispatch(fetchItems({ page: 1, per_page: 15 }));
      
    } catch (error) {
      console.error('ItemForm: Form submission error:', error);
      // Error is already handled by the slice
    }
  };

  const handleCancel = () => {
    console.log('ItemForm: Cancelling form');
    setFormData({ name: '', description: '' });
    dispatch(clearCurrentItem());
    dispatch(clearError());
  };

  return (
    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-2xl font-bold mb-4">
        {currentItem ? 'Edit Item' : 'Create New Item'}
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
            placeholder="Enter item name"
            required
            disabled={loading}
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
            rows={3}
            placeholder="Enter item description"
            required
            disabled={loading}
          />
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 transition-colors duration-200 flex items-center"
            disabled={loading}
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {loading ? 'Processing...' : currentItem ? 'Update Item' : 'Create Item'}
          </button>
          
          {currentItem && (
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200"
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      
      {/* Helper text */}
      <div className="mt-4 text-xs text-gray-500">
        <p>* Required fields</p>
        {currentItem && (
          <p className="mt-1">You are editing: <span className="font-medium">{currentItem.name}</span></p>
        )}
      </div>
    </div>
  );
};

export default ItemForm;