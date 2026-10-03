"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { isNotificationType, type NotificationType, type NotificationView } from "@/lib/notifications";
import { mutate, peek, useResource } from "./use-resource";

export type Notification = NotificationView & { type: NotificationType };

const POLL_INTERVAL_MS = 30_000;
const MAX_DISPLAY = 10;

/** One store for the bell and the Notifications page. */
export const NOTIFICATIONS_KEY = "/api/notifications";

interface Feed {
  notifications: NotificationView[];
  unreadCount: number;
}

const patchAction = (url: string, action: string) =>
  fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });

/**
 * Apply `change` to the shared feed at once, then send `request`. On failure
 * the feed is restored and re-read from the server.
 */
async function optimistic(change: (f: Feed) => Feed, request: () => Promise<Response>, failMsg: string): Promise<boolean> {
  const before = peek<Feed>(NOTIFICATIONS_KEY);
  if (before) void mutate<Feed>(NOTIFICATIONS_KEY, change(before), { revalidate: false });
  try {
    const res = await request();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } catch {
    if (before) void mutate<Feed>(NOTIFICATIONS_KEY, before, { revalidate: false });
    void mutate(NOTIFICATIONS_KEY);
    toast.error(failMsg);
    return false;
  }
}

const without = (f: Feed, id: string): Feed => {
  const gone = f.notifications.find((n) => n.id === id);
  return {
    notifications: f.notifications.filter((n) => n.id !== id),
    unreadCount: gone && !gone.isRead ? Math.max(0, f.unreadCount - 1) : f.unreadCount,
  };
};

export const notificationActions = {
  markRead: (id: string) => optimistic(
    (f) => ({
      notifications: f.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: f.notifications.some((n) => n.id === id && !n.isRead) ? Math.max(0, f.unreadCount - 1) : f.unreadCount,
    }),
    () => patchAction(`/api/notifications/${id}`, "read"),
    "Couldn't mark that notification as read. Try again.",
  ),
  markAllRead: () => optimistic(
    (f) => ({ notifications: f.notifications.map((n) => ({ ...n, isRead: true })), unreadCount: 0 }),
    () => patchAction("/api/notifications", "read_all"),
    "Couldn't mark notifications as read. Try again.",
  ),
  dismiss: (id: string) => optimistic(
    (f) => without(f, id),
    () => patchAction(`/api/notifications/${id}`, "dismiss"),
    "Couldn't dismiss that notification. Try again.",
  ),
  /** Admin only: removes it for every teammate. */
  remove: (id: string) => optimistic(
    (f) => without(f, id),
    () => fetch(`/api/notifications/${id}`, { method: "DELETE" }),
    "Couldn't delete that notification. Try again.",
  ),
};

/**
 * The shared feed. `poll` (the bell) refreshes every 30s while the tab is
 * visible, pauses while it is hidden, and refreshes on return.
 */
export function useNotificationFeed({ poll = false } = {}) {
  const res = useResource<Feed>(NOTIFICATIONS_KEY, { freshMs: POLL_INTERVAL_MS });
  const { reload } = res;

  useEffect(() => {
    if (!poll) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => { timer ??= setInterval(() => void reload(), POLL_INTERVAL_MS); };
    const stop = () => { clearInterval(timer); timer = undefined; };
    const onVisibility = () => {
      if (document.hidden) stop();
      else { void reload(); start(); }
    };
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [poll, reload]);

  return res;
}

/** The top-bar bell: the shared feed plus its panel state. */
export function useNotifications() {
  const router = useRouter();
  const feed = useNotificationFeed({ poll: true });
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // The bell renders a per-type icon; a type this build doesn't know is left to the full page.
  const notifications = useMemo(
    () => (feed.data?.notifications ?? []).filter((n): n is Notification => isNotificationType(n.type)),
    [feed.data],
  );

  // Close panel on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markAsRead = useCallback((id: string) => notificationActions.markRead(id), []);
  const markAllAsRead = useCallback(() => notificationActions.markAllRead(), []);

  const handleClick = useCallback(
    (notification: Notification) => {
      if (!notification.isRead) void notificationActions.markRead(notification.id);
      if (notification.link) router.push(notification.link);
      setOpen(false);
    },
    [router],
  );

  return {
    notifications: notifications.slice(0, MAX_DISPLAY),
    allNotifications: notifications,
    unreadCount: feed.data?.unreadCount ?? 0,
    loading: feed.isLoading,
    open,
    setOpen,
    panelRef,
    markAsRead,
    markAllAsRead,
    handleClick,
    refetch: feed.reload,
  };
}

/** Format a UTC date string to a relative "X ago" label. */
export function formatTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diffMs / 60_000);
  const h = Math.floor(diffMs / 3_600_000);
  const d = Math.floor(diffMs / 86_400_000);

  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
