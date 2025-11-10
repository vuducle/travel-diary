'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  location?: string;
  username?: string;
  avatarUrl?: string;
  role?: string;
  coverImage?: string;
}

interface AuthStateWithPersist extends RootState {
  auth: {
    token: string | null;
    user: User | null;
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
        setTimeout(() => setIsChecking(false), 0);
      }
    }
  }, [_persist.rehydrated, token, router]);

  if (isChecking) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return <>{children}</>;
}
