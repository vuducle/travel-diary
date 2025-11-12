'use client';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearToken } from '@/lib/redux/authSlice';

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

export default function PublicGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { token, _persist } = useSelector(
    (state: AuthStateWithPersist) => state.auth
  );
  const [isChecking, setIsChecking] = useState(true);

  const isTokenValid = (jwt: string | null): boolean => {
    if (!jwt) return false;
    try {
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      if (payload?.exp && typeof payload.exp === 'number') {
        return Date.now() < payload.exp * 1000;
      }
      return true; // if no exp, treat as valid
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (_persist.rehydrated) {
      if (token && isTokenValid(token)) {
        router.replace('/dashboard');
      } else {
        if (token && !isTokenValid(token)) {
          dispatch(clearToken());
        }
        setTimeout(() => setIsChecking(false), 0);
      }
    }
  }, [_persist.rehydrated, token, router, dispatch]);

  if (isChecking) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return <>{children}</>;
}
