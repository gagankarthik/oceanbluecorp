"use client";
import { PageHeader, PageHeaderButton } from "@/components/admin/page-header";
import { AdminListSkeleton } from "@/components/admin/skeletons";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  Briefcase,
  Users,
  MessageSquare,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Trash2,
  Filter,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

interface Notification {
  id: string;
  type: "job_posted" | "application_received" | "contact_received";
  title: string;
  message: string;
  link?: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

const notificationIcons = {
  job_posted: Briefcase,
  application_received: Users,
  contact_received: MessageSquare,
};

const notificationColors = {
  job_posted: "bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] border-[var(--hz-cobalt-100)]",
  application_received: "bg-emerald-50 text-emerald-600 border-emerald-200",
  contact_received: "bg-violet-50 text-violet-600 border-violet-200",
};

const notificationLabels = {
  job_posted: "Job Posted",
  application_received: "New Application",
  contact_received: "Contact Received",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/notifications");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch notifications");
      }

      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllRead(true);
      const response = await fetch("/api/notifications", {
        method: "PUT",
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const filteredNotifications = notifications.filter((n) => {
    const matchesReadFilter = filter === "all" || !n.isRead;
    const matchesTypeFilter = typeFilter === "all" || n.type === typeFilter;
    return matchesReadFilter && matchesTypeFilter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationLink = (notification: Notification) => {
    if (notification.link) return notification.link;

    switch (notification.type) {
      case "job_posted":
        return notification.relatedId ? `/admin/jobs` : "/admin/jobs";
      case "application_received":
        return notification.relatedId ? `/admin/applications` : "/admin/applications";
      case "contact_received":
        return notification.relatedId ? `/admin/contacts` : "/admin/contacts";
      default:
        return "/admin";
    }
  };

  if (loading) return <AdminListSkeleton rows={6} />;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        className="mb-6"
        title="Notifications"
        subtitle="Stay updated with the latest activities"
        icon={Bell}
        meta={unreadCount > 0 ? (
          <span className="inline-flex items-center rounded-full bg-[var(--hz-cobalt-100)] px-2.5 py-0.5 text-xs font-semibold text-[var(--hz-cobalt)]">
            {unreadCount} unread
          </span>
        ) : undefined}
        actions={
          <>
            <PageHeaderButton variant="secondary" onClick={fetchNotifications} title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </PageHeaderButton>
            {unreadCount > 0 && (
              <PageHeaderButton variant="primary" onClick={handleMarkAllAsRead} disabled={markingAllRead}>
                {markingAllRead ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Mark all as read
              </PageHeaderButton>
            )}
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-slate-50 rounded-xl">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Filter:</span>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "all" | "unread")}
          className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--hz-cobalt)]"
        >
          <option value="all">All notifications</option>
          <option value="unread">Unread only</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--hz-cobalt)]"
        >
          <option value="all">All types</option>
          <option value="job_posted">Job Posted</option>
          <option value="application_received">Applications</option>
          <option value="contact_received">Contacts</option>
        </select>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchNotifications}
            className="ml-auto px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {filteredNotifications.map((notification) => {
            const Icon = notificationIcons[notification.type];
            const colorClass = notificationColors[notification.type];
            const label = notificationLabels[notification.type];
            const link = getNotificationLink(notification);

            return (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors ${
                  !notification.isRead ? "bg-[#eef3fe]" : ""
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${colorClass}`}>
                          {label}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[var(--hz-cobalt)]" />
                        )}
                      </div>
                      <h3 className={`mt-2 font-medium ${!notification.isRead ? "text-slate-900" : "text-slate-700"}`}>
                        {notification.title}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">{notification.message}</p>
                      <p className="text-xs text-slate-400 mt-2">{formatTimeAgo(notification.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1.5 text-slate-400 hover:text-[var(--hz-cobalt)] hover:bg-[var(--hz-cobalt-100)] rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link
                        href={link}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No notifications</h3>
          <p className="text-slate-500">
            {filter === "unread"
              ? "You're all caught up! No unread notifications."
              : "No notifications to display."}
          </p>
        </div>
      )}
    </div>
  );
}
