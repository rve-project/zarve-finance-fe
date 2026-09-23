"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api, clearToken, getToken, setToken } from "./api";
import { signInWithGoogle } from "./firebase";
import { User } from "./types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Dev-only: skips the login screen entirely (see rve-finance-be's DISABLE_AUTH_FOR_DEV,
// which is what actually makes /auth/me succeed without a real session). A token still
// has to exist for the `getToken()` guard below to fire the check at all, so this
// writes a placeholder one -- its value is never validated while the backend flag is on.
const DISABLE_AUTH = process.env.NEXT_PUBLIC_DISABLE_AUTH === "true";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => DISABLE_AUTH || Boolean(getToken()));

  useEffect(() => {
    if (DISABLE_AUTH && !getToken()) setToken("dev-bypass");
    if (!getToken()) return;
    api
      .me()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { token, user: loggedInUser } = await api.login(email, password);
    setToken(token);
    setUser(loggedInUser);
  }

  async function loginWithGoogle() {
    const idToken = await signInWithGoogle();
    const { token, user: loggedInUser } = await api.googleLogin(idToken);
    setToken(token);
    setUser(loggedInUser);
  }

  async function logout() {
    try {
      await api.logout();
    } finally {
      clearToken();
      setUser(null);
    }
  }

  return <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
