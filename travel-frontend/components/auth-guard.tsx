'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api/client';
import { useDispatch } from 'react-redux';
import { setToken, clearToken, setUser } from '@/lib/redux/authSlice';
import { triggerExpiry } from '@/lib/redux/sessionSlice';
import { useEffect, useState, useRef } from 'react';

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

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { token, user, _persist } = useSelector(
    (state: AuthStateWithPersist) => state.auth
  );
  const [isChecking, setIsChecking] = useState(true);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Decode exp field from JWT (if present)
  const getTokenExp = (jwt?: string): number | null => {
    if (!jwt) return null;
    try {
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      if (payload && typeof payload.exp === 'number') {
        return payload.exp * 1000; // convert to ms
      }
      return null;
    } catch (e) {
      console.warn('Unable to parse token exp', e);
      return null;
    }
  };

  // Try to refresh token immediately if expired; otherwise schedule a refresh slightly before expiry
  useEffect(() => {
    // Clear previous timer
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current as NodeJS.Timeout);
    }
    const expMs = getTokenExp(token || undefined);
    if (expMs) {
      const now = Date.now();
      const remaining = expMs - now;
      if (remaining <= 0) {
        // Attempt silent refresh
        (async () => {
          try {
            const resp = await api.post(
              '/auth/refresh',
              {},
              { withCredentials: true }
            );
            const newToken = resp.data?.accessToken as
              | string
              | undefined;
            if (newToken) {
              dispatch(setToken(newToken));
            } else {
              dispatch(clearToken());
              dispatch(triggerExpiry({ reason: 'expired' }));
            }
          } catch {
            dispatch(clearToken());
            dispatch(triggerExpiry({ reason: 'expired' }));
          }
        })();
      } else {
        // Refresh 30 seconds before expiry to reduce chances of 401
        const refreshIn = Math.max(remaining - 30_000, 0);
        logoutTimerRef.current = setTimeout(async () => {
          try {
            const resp = await api.post(
              '/auth/refresh',
              {},
              { withCredentials: true }
            );
            const newToken = resp.data?.accessToken as
              | string
              | undefined;
            if (newToken) {
              dispatch(setToken(newToken));
            } else {
              dispatch(clearToken());
              dispatch(triggerExpiry({ reason: 'expired' }));
            }
          } catch {
            dispatch(clearToken());
            dispatch(triggerExpiry({ reason: 'expired' }));
          }
        }, refreshIn);
      }
    }
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current as NodeJS.Timeout);
      }
    };
  }, [token, router, dispatch]);

  useEffect(() => {
    if (_persist.rehydrated) {
      if (!token) {
        dispatch(triggerExpiry({ reason: 'expired' }));
      } else {
        setTimeout(() => setIsChecking(false), 0);
      }
    }
  }, [_persist.rehydrated, token, router, dispatch]);

  // Hydrate full user profile if minimal user from JWT lacks fields (e.g., username/coverImage)
  useEffect(() => {
    const needsHydration =
      !!token && (!user || (!user.username && !user.coverImage));
    if (needsHydration) {
      (async () => {
        try {
          const me = await api.get('/users/profile');
          if (me?.data) {
            dispatch(setUser(me.data));
          }
        } catch {
          // ignore; UI can still function with minimal user
        }
      })();
    }
  }, [token, user, dispatch]);

  if (isChecking) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return <>{children}</>;
}
