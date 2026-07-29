import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { authApi } from '@/lib/auth';
import { STORAGE_KEYS } from '@/lib/config';
import type { User, Role } from '@/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    role?: 'CUSTOMER' | 'DRIVER';
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    if (!token) {
      setIsLoading(false);
      return;
    }

    authApi
      .getMe()
      .then((profile) => {
        const { customer, admin, deliveryAgent, ...userFields } = profile as unknown as Record<string, unknown>;
        setUser(userFields as unknown as User);
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEYS.token);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: userData } = await authApi.login(email, password);
    localStorage.setItem(STORAGE_KEYS.token, token);
    setUser(userData);
  }, []);

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      name: string;
      role?: 'CUSTOMER' | 'DRIVER';
      phone?: string;
    }) => {
      const { token, user: userData } = await authApi.register(data);
      localStorage.setItem(STORAGE_KEYS.token, token);
      setUser(userData);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.token);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const profile = await authApi.getMe();
    const { customer, admin, deliveryAgent, ...userFields } = profile as unknown as Record<string, unknown>;
    setUser(userFields as unknown as User);
  }, []);

  const hasRole = useCallback(
    (...roles: Role[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
