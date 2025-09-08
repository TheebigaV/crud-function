import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CRUD Application',
  description: 'Next.js CRUD frontend for Laravel API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        {children}
      </body>
    </html>
  );
}