'use client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/lib/redux/store';
import ToastProvider from '@/components/ui/toast';
import SessionExpiredModal from '@/components/session-expired-modal';
import React from 'react';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
        <ToastProvider />
        <SessionExpiredModal />
      </PersistGate>
    </Provider>
  );
}
