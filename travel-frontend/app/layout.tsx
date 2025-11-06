'use client';
import type { Metadata } from 'next';
import { Karla, Merriweather, Geist_Mono } from 'next/font/google';
import './globals.css';
import Footer from '@/components/footer';
import { Provider } from 'react-redux';
import { store, persistor } from '@/lib/redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import ToastProvider from '@/components/ui/toast';
import 'react-toastify/dist/ReactToastify.css';

// Body copy
const karla = Karla({
  subsets: ['latin'],
  variable: '--font-karla',
  weight: ['300', '400', '500', '600', '700'],
});

// Headings
const merriweather = Merriweather({
  subsets: ['latin'],
  variable: '--font-merriweather',
  weight: ['300', '400', '700', '900'],
  style: ['normal', 'italic'],
});

// Optional monospace for code blocks
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${karla.variable} ${merriweather.variable} ${geistMono.variable} antialiased`}
      >
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <main>{children}</main>
            <Footer />
            <ToastProvider />
          </PersistGate>
        </Provider>
      </body>
    </html>
  );
}