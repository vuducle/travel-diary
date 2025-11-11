import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from '@/lib/redux/store';
import { clearToken, setToken } from '@/lib/redux/authSlice';
import { triggerExpiry } from '@/lib/redux/sessionSlice';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3598',
  withCredentials: false,
});

// Refresh helpers
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

const notifySubscribers = (token: string | null) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const baseURL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3598';
    const resp = await axios.post(
      baseURL + '/auth/refresh',
      {},
      { withCredentials: true }
    );
    const newToken: string | undefined = resp.data?.accessToken;
    if (newToken) {
      store.dispatch(setToken(newToken));
      return newToken;
    }
    return null;
  } catch {
    return null;
  }
};

// Attach token from Redux store to every request
api.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth?.token;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto refresh on 401 once, then logout if refresh fails
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error?.response?.status;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue until refresh finishes
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((token) => {
            if (token) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      notifySubscribers(newToken);

      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } else {
        store.dispatch(clearToken());
        store.dispatch(triggerExpiry({ reason: 'expired' }));
      }
    }

    // 403 or subsequent 401
    if (status === 401 || status === 403) {
      store.dispatch(clearToken());
      store.dispatch(triggerExpiry({ reason: 'expired' }));
    }

    return Promise.reject(error);
  }
);

export default api;
