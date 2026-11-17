// 📍 /apps/web/src/components/notifications/notification-bell.tsx
"use client";

import { useState } from "react";
import { useNotifications } from "@/providers/notifications-provider";
import { NotificationPopover } from "./notification-popover";

export function NotificationBell() {
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface hover:text-ink"
      >
        {/* Bell character — no icon library needed */}
        <span className="text-lg leading-none">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && <NotificationPopover onClose={() => setOpen(false)} />}
    </div>
  );
}