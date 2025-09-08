'use client';

import { useState } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from './store/store';
import ItemList from './components/ItemList';
import ItemForm from './components/ItemForm';

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const store = makeStore();

  return (
    <Provider store={store}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">CRUD Application with Laravel API</h1>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Items Management</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            {showForm ? 'Hide Form' : 'Add New Item'}
          </button>
        </div>

        {showForm && <ItemForm />}
        
        <ItemList />
      </div>
    </Provider>
  );
}