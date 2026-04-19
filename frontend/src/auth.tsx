import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, type User } from "./api";

const STORAGE_KEY = "tastetape_token";

type AuthState = {
  token: string | null;
  user: User | null;
  setSession: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(`${STORAGE_KEY}_user`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  });

  const setSession = useCallback((t: string, u: User) => {
    localStorage.setItem(STORAGE_KEY, t);
    localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}_user`);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) return;
    api
      .me(token)
      .then((u) => {
        setUser(u);
        localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(u));
      })
      .catch(() => logout());
  }, [token, logout]);

  const value = useMemo(
    () => ({ token, user, setSession, logout }),
    [token, user, setSession, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
