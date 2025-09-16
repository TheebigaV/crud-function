import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import StoreProvider from './components/StoreProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dashboard App - Manage Items & Payments',
  description: 'A powerful dashboard to manage your items and process payments securely.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StoreProvider>
          <div className="min-h-screen bg-gray-50">
            <main>
              {children}
            </main>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}