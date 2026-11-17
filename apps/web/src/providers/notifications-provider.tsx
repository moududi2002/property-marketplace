// 📍 /apps/web/src/providers/notifications-provider.tsx
//
// Client-side notifications context + socket listener.
//   • Loads initial list + unread count on mount (when logged in)
//   • Connects to Socket.IO with cookie credentials
//   • Merges incoming `notification:new` events into local state
//   • Exposes markAsRead / markAllAsRead / refresh

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import type { NotificationItem } from "@property-marketplace/shared-types";
import { apiFetch } from "@/lib/api";
import { useAuth } from "./auth-provider";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ??
  "http://localhost:4035";

interface NotificationsContextValue {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  // ─── Load on mount / user change ─────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setItems([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [list, count] = await Promise.all([
          apiFetch<{ items: NotificationItem[]; meta: unknown }>(
            "/notifications?limit=20",
          ),
          apiFetch<{ count: number }>("/notifications/unread-count"),
        ]);
        if (cancelled) return;
        setItems(list.items);
        setUnreadCount(count.count);
      } catch {
        // ignore — user can retry with refresh()
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // ─── Socket connection ───────────────────────────────
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      // Connected — trigger a refresh so any offline events are re-synced
      void refreshList();
    });

    socket.on("notification:new", (notification: NotificationItem) => {
      setItems((prev) => {
        // Avoid duplicates
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev].slice(0, 50);
      });
      setUnreadCount((c) => c + 1);
    });

    socket.on("notification:unread-count", (count: number) => {
      setUnreadCount(count);
    });

    socket.on("auth-error", () => {
      // Session expired — disconnect and let the next request trigger re-login
      socket.disconnect();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ─── Actions ─────────────────────────────────────────
  const refreshList = useCallback(async () => {
    if (!user) return;
    try {
      const [list, count] = await Promise.all([
        apiFetch<{ items: NotificationItem[] }>("/notifications?limit=20"),
        apiFetch<{ count: number }>("/notifications/unread-count"),
      ]);
      setItems(list.items);
      setUnreadCount(count.count);
    } catch {
      // ignore
    }
  }, [user]);

  const refresh = useCallback(async () => {
    await refreshList();
  }, [refreshList]);

  const markAsRead = useCallback(
    async (id: string) => {
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await apiFetch<void>(`/notifications/${id}/read`, { method: "PATCH" });
      } catch {
        // rollback on failure
        await refreshList();
      }
    },
    [refreshList],
  );

  const markAllAsRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await apiFetch<void>("/notifications/read-all", { method: "PATCH" });
    } catch {
      await refreshList();
    }
  }, [refreshList]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      items,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead,
      refresh,
    }),
    [items, unreadCount, loading, markAsRead, markAllAsRead, refresh],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error("useNotifications must be used inside <NotificationsProvider>");
  return ctx;
}