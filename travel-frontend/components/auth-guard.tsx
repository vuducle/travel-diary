'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuthStateWithPersist extends RootState {
  auth: {
    token: string | null;
    user: any;
    _persist: {
      version: number;
      rehydrated: boolean;
    };
  };
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, _persist } = useSelector((state: AuthStateWithPersist) => state.auth);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (_persist.rehydrated) {
      if (!token) {
        router.replace('/login');
      } else {
        setIsChecking(false);
      }
    }
  }, [_persist.rehydrated, token, router]);

  if (isChecking) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return <>{children}</>;
}
