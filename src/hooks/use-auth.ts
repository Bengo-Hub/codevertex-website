'use client';
import { useAuthStore } from '@/lib/store/auth-store';

export function useAuth() {
  const store = useAuthStore();
  return {
    user: store.user,
    isAuthenticated: store.status === 'authenticated',
    // Not ready = stored session not restored yet; treat as loading so UI never flashes "signed out".
    isLoading: store.status === 'loading' || !store.ready,
    login: store.login,
    logout: store.logout,
    handleCallback: store.handleCallback,
  };
}
