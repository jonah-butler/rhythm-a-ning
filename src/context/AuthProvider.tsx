import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthUser } from '../services/api/types/user.types';
import { getCurrentUser } from '../services/api/user';
import { AuthContext } from './AuthContext';
import type { AuthStatus } from './AuthContext.types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('idle');

  const refresh = useCallback(async () => {
    const current = await getCurrentUser();
    setUser(current);
    setStatus(current ? 'authenticated' : 'unauthenticated');
  }, []);

  const isAuthenticated = useMemo(
    () =>
      status === 'authenticated' &&
      user?.email !== undefined &&
      user.userId !== undefined,
    [user, status],
  );

  const clearContextSession = (): void => {
    setUser(null);
    setStatus('unauthenticated');
  };

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      user,
      status,
      setUser,
      refresh,
      isAuthenticated,
      clearContextSession,
    }),
    [user, status, refresh, isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
