import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { clearStoredToken, getStoredToken, setStoredToken } from '@/lib/auth-storage';

type AuthContextValue = {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setToken: (token: string) => Promise<void>;
  clearToken: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getStoredToken().then((t) => {
      if (!cancelled) {
        setTokenState(t);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setToken = useCallback(async (t: string) => {
    await setStoredToken(t);
    setTokenState(t);
  }, []);

  const clearToken = useCallback(async () => {
    await clearStoredToken();
    setTokenState(null);
  }, []);

  const value: AuthContextValue = {
    token,
    isAuthenticated: !!token,
    isLoading,
    setToken,
    clearToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
