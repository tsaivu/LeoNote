import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { authService } from "../../modules/auth/services/authService";
import type { AuthUser, LoginResponse } from "../../modules/auth/types/authTypes";

type AuthContextValue = {
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAuthUser: (user: AuthUser) => void;
  setAuthSession: (session: LoginResponse) => void;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  token: null,
  refreshToken: null,
  user: null,
  setAuthUser: () => undefined,
  setAuthSession: () => undefined,
  logout: async () => undefined,
});

export function useAuthContext() {
  return useContext(AuthContext);
}

const ACCESS_TOKEN_KEY = "leonote_access_token";
const REFRESH_TOKEN_KEY = "leonote_refresh_token";
const USER_KEY = "leonote_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    setToken(storedToken);
    setRefreshToken(storedRefreshToken);
    setUser(storedUser ? (JSON.parse(storedUser) as AuthUser) : null);
  }, []);

  const value: AuthContextValue = {
    isAuthenticated: Boolean(token),
    token,
    refreshToken,
    user,
    setAuthUser: (nextUser) => {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
    },
    setAuthSession: (session) => {
      localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
      localStorage.setItem(USER_KEY, JSON.stringify(session.user));
      setToken(session.access_token);
      setRefreshToken(session.refresh_token);
      setUser(session.user);
    },
    logout: async () => {
      try {
        await authService.logout(refreshToken);
      } catch {
        // Local logout must still clear client state if the server is unavailable.
      }
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setRefreshToken(null);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
