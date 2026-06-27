"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export interface Notification {
  id: string;
  type: "job_posted" | "application_received" | "contact_received";
  title: string;
  message: string;
  link?: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

const POLL_INTERVAL_MS = 30_000;
const MAX_DISPLAY = 10;

/**
 * Encapsulates all notifications state and API calls. Extracted from
 * AdminLayoutContent so the layout stays focused on structure and the
 * notification panel only re-renders when its own state changes.
 */
export function useNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications?limit=20");
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      // Fail silently — notifications are non-critical.
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling.
  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetch_]);

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

  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch("/api/notifications", { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, []);

  const handleClick = useCallback(
    async (notification: Notification) => {
      if (!notification.isRead) await markAsRead(notification.id);
      if (notification.link) router.push(notification.link);
      setOpen(false);
    },
    [markAsRead, router],
  );

  const visible = notifications.slice(0, MAX_DISPLAY);

  return {
    notifications: visible,
    allNotifications: notifications,
    unreadCount,
    loading,
    open,
    setOpen,
    panelRef,
    markAsRead,
    markAllAsRead,
    handleClick,
    refetch: fetch_,
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
