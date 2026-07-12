import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { apiClient } from '../services/api-client';
import type { AuthUser } from '../types/auth';

const TOKEN_STORAGE_KEY = 'transitops.auth.token';
const USER_STORAGE_KEY = 'transitops.auth.user';

type LoginInput = { email: string; password: string };

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    async function restoreSession() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { user: currentUser } = await apiClient<{ user: AuthUser }>('/auth/me', { method: 'GET' }, token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
        setUser(currentUser);
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    }

    void restoreSession();
  }, [clearSession, token]);

  const login = useCallback(async ({ email, password }: LoginInput) => {
    const session = await apiClient<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(session.user));
    setToken(session.token);
    setUser(session.user);
  }, []);

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout: clearSession }),
    [clearSession, isLoading, login, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function readStoredUser(): AuthUser | null {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

export { AuthContext };
