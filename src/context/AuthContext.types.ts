import type { Dispatch, SetStateAction } from 'react';
import type { AuthUser } from '../services/api/types/user.types';

export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated';

export type AuthContextType = {
  user: AuthUser | null;
  status: AuthStatus;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
  refresh: () => Promise<void>;
  isAuthenticated: boolean;
  clearContextSession: () => void;
};
