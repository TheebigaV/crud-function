'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createItem, updateItem, clearCurrentItem, clearError, fetchItems } from '../store/slices/crudSlice';

const ItemForm = () => {
  const dispatch = useAppDispatch();
  const { currentItem, loading, error, pagination } = useAppSelector((state) => state.crud);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Helper function to safely format price for editing
  const formatPriceForEdit = (price: any): string => {
    console.log('ItemForm: formatPriceForEdit input:', price, typeof price);
    if (price === null || price === undefined || price === '') {
      return '';
    }
    
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numPrice)) {
      return '';
    }
    
    return numPrice.toString();
  };

  useEffect(() => {
    if (currentItem) {
      console.log('ItemForm: Current item changed:', currentItem);
      console.log('ItemForm: Current item price:', currentItem.price, typeof currentItem.price);
      const formattedPrice = formatPriceForEdit(currentItem.price);
      console.log('ItemForm: Formatted price for editing:', formattedPrice);
      
      setFormData({
        name: currentItem.name || '',
        description: currentItem.description || '',
        price: formattedPrice,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
      });
    }
  }, [currentItem]);

  useEffect(() => {
    if (error) {
      setFormError(error);
    } else {
      setFormError(null);
    }
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for price field
    if (name === 'price') {
      // Allow empty string or valid decimal numbers
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear errors when user starts typing
    if (formError || error) {
      setFormError(null);
      dispatch(clearError());
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setFormError('Item name is required');
      return false;
    }
    if (!formData.description.trim()) {
      setFormError('Description is required');
      return false;
    }
    if (!formData.price.trim()) {
      setFormError('Price is required');
      return false;
    }
    const priceValue = parseFloat(formData.price);
    if (isNaN(priceValue) || priceValue <= 0) {
      setFormError('Price must be a valid number greater than 0');
      return false;
    }
    if (priceValue < 0.01) {
      setFormError('Price must be at least $0.01');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const priceValue = parseFloat(formData.price.trim());
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: priceValue,
      };

      console.log('ItemForm: Submitting data:', submitData);

      if (currentItem && currentItem.id) {
        // Update existing item
        console.log('ItemForm: Updating item with ID:', currentItem.id);
        const updateResult = await dispatch(updateItem({ 
          id: currentItem.id, 
          ...submitData 
        })).unwrap();
        console.log('ItemForm: Update result:', updateResult);
        
        // Clear current item first
        dispatch(clearCurrentItem());
        
        // Force refresh with current pagination settings
        const currentPage = pagination?.current_page || 1;
        const perPage = pagination?.per_page || 15;
        console.log('ItemForm: Refreshing with pagination:', { currentPage, perPage });
        
        await dispatch(fetchItems({ page: currentPage, per_page: perPage }));
        console.log('ItemForm: Refresh completed');
        
      } else {
        // Create new item
        console.log('ItemForm: Creating new item');
        const createResult = await dispatch(createItem(submitData)).unwrap();
        console.log('ItemForm: Create result:', createResult);
        
        // Force refresh with current pagination settings
        const currentPage = pagination?.current_page || 1;
        const perPage = pagination?.per_page || 15;
        await dispatch(fetchItems({ page: currentPage, per_page: perPage }));
      }

      // Reset form after successful submission
      setFormData({
        name: '',
        description: '',
        price: '',
      });
      setFormError(null);
      
    } catch (error: any) {
      console.error('Form submission error:', error);
      setFormError(error || 'An error occurred while saving the item');
    }
  };

  const handleCancel = () => {
    dispatch(clearCurrentItem());
    setFormData({
      name: '',
      description: '',
      price: '',
    });
    setFormError(null);
    dispatch(clearError());
  };

  const isEditing = !!currentItem;
  const isEditingItemWithoutPrice = isEditing && (
    currentItem.price === null || 
    currentItem.price === undefined || 
    currentItem.price === '' ||
    (typeof currentItem.price === 'string' && currentItem.price.trim() === '') ||
    (typeof currentItem.price === 'number' && (isNaN(currentItem.price) || currentItem.price <= 0))
  );

  return (
    <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isEditing ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            )}
          </svg>
          {isEditing ? 'Edit Item' : 'Add New Item'}
        </h2>
        {isEditing && (
          <div className="text-sm text-gray-600 mt-1">
            <p>Editing: <span className="font-medium">{currentItem.name}</span></p>
            <p className="text-xs">Item ID: {currentItem.id} | Current Price: {JSON.stringify(currentItem.price)}</p>
          </div>
        )}
        
        {/* Special notice for items without prices */}
        {isEditingItemWithoutPrice && (
          <div className="mt-3 bg-orange-50 border-l-4 border-orange-400 p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-orange-700">
                  <strong>Price Required:</strong> This item doesn't have a valid price set. Please add a price to enable payments for this item.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {(formError || error) && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{formError || error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
            Item Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
            placeholder="Enter item name"
            required
            disabled={loading}
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-gray-900 placeholder-gray-400"
            placeholder="Enter item description"
            rows={4}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">
            Price *
            {isEditingItemWithoutPrice && (
              <span className="ml-2 text-orange-600 text-xs font-normal">
                (Required for payments)
              </span>
            )}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
            <input
              type="text"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400 ${
                isEditingItemWithoutPrice 
                  ? 'border-orange-300 bg-orange-50 focus:ring-orange-500 focus:border-orange-500' 
                  : 'border-gray-300'
              }`}
              placeholder="0.00"
              required
              disabled={loading}
              autoComplete="off"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Enter the price for this item (minimum $0.01)</span>
            {formData.price && !isNaN(parseFloat(formData.price)) && parseFloat(formData.price) > 0 && (
              <span className="text-green-600 font-medium">
                Price: ${parseFloat(formData.price).toFixed(2)}
              </span>
            )}
          </div>
          {isEditingItemWithoutPrice && (
            <p className="text-xs text-orange-600 mt-1">
              This item currently has no valid price. Adding a price will enable payment functionality.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            * Required fields
          </div>
          <div className="flex space-x-3">
            {isEditing && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className={`px-6 py-3 font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] ${
                isEditingItemWithoutPrice 
                  ? 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
              }`}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isEditing ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    )}
                  </svg>
                  {isEditing ? 
                    (isEditingItemWithoutPrice ? 'Add Price & Update' : 'Update Item') : 
                    'Add Item'
                  }
                </div>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;