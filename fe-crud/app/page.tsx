'use client';

import AuthStatus from './components/Auth/AuthStatus';
import ItemForm from './components/ItemForm';
import ItemList from './components/ItemList';
import { useAppSelector } from './store/hooks';

export default function Home() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">CRUD App</h1>
          <AuthStatus />
        </div>
      </header>

      <main className="container mx-auto py-8">
        {isAuthenticated ? (
          <>
            <ItemForm />
            <ItemList />
          </>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Welcome to CRUD App
            </h2>
            <p className="text-gray-600 mb-8">
              Please login or register to manage your items.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}