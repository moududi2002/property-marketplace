// 📍 /apps/web/src/providers/auth-provider.tsx
//
// Client-side auth context.
// Hydrates from /auth/me on mount (only if there might be a session
// — we attempt once, silently give up on 401).
//
// Exposes: { user, isLoading, login, register, logout, refresh }

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UserSummary } from "@property-marketplace/shared-types";
import { apiFetch } from "@/lib/api";
import { ApiError } from "@/lib/api-error";

interface AuthContextValue {
  user: UserSummary | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-fetch /auth/me — useful after updates. */
  refresh: () => Promise<void>;
}

interface RegisterInput {
  name: string;
  phone: string;
  email?: string;
  password: string;
  confirmPassword: string;
}

interface UserResponse {
  user: UserSummary;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Initial hydration ───────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { user: me } = await apiFetch<UserResponse>("/auth/me");
        if (!cancelled) setUser(me);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          if (!cancelled) setUser(null);
        } else {
          // Network or unexpected error — leave as unauthenticated
          if (!cancelled) setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Actions ─────────────────────────────────────────────
  const login = useCallback(async (identifier: string, password: string) => {
    const { user: me } = await apiFetch<UserResponse>("/auth/login", {
      method: "POST",
      body: { identifier, password },
    });
    setUser(me);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { user: me } = await apiFetch<UserResponse>("/auth/register", {
      method: "POST",
      body: input,
    });
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch<void>("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { user: me } = await apiFetch<UserResponse>("/auth/me");
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, register, logout, refresh }),
    [user, isLoading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}