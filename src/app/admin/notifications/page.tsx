"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Loader2,
  ChevronRight,
  X,
} from "lucide-react";
import { IconBell, IconSuccess, IconTrash, IconAlert } from "@/components/admin/icons";
import { fmtRelative } from "@/lib/format";
import {
  Workspace, WorkspaceTitle, WorkspaceButton, WorkspaceToolbar, FilterPill, FilterIcon, ActiveFilters, ToolbarDivider, DensityMenu, KpiRow, type Density,
} from "@/components/admin/workspace";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { StatusBadge } from "@/components/admin/status-badge";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { AdminListSkeleton } from "@/components/admin/skeletons";
import type { Tone } from "@/components/admin/theme";
import { cn } from "@/lib/utils";

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

type NotificationType = Notification["type"];

/** One table for the three notification kinds — label and chip tone. */
const NOTIFICATION_TYPES: {
  key: NotificationType;
  label: string;
  short: string;
  tone: Tone;
}[] = [
  { key: "job_posted",           label: "Job Posted",       short: "Jobs",         tone: "blue"    },
  { key: "application_received", label: "New Application",  short: "Applications", tone: "emerald" },
  { key: "contact_received",     label: "Contact Received", short: "Contacts",     tone: "violet"  },
];

const metaFor = (type: NotificationType) => NOTIFICATION_TYPES.find((t) => t.key === type)!;

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

  const filteredNotifications = notifications.filter((n) => {
    const matchesReadFilter = filter === "all" || !n.isRead;
    const matchesTypeFilter = typeFilter === "all" || n.type === typeFilter;
    return matchesReadFilter && matchesTypeFilter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const typeCounts = useMemo(() => {
    const counts: Record<NotificationType, number> = {
      job_posted: 0, application_received: 0, contact_received: 0,
    };
    for (const n of notifications) counts[n.type] += 1;
    return counts;
  }, [notifications]);

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

  const hasActiveFilters = filter !== "all" || typeFilter !== "all";

  const { todayCount, weekCount } = useMemo(() => {
    const now = Date.now();
    const at = (n: Notification) => new Date(n.createdAt).getTime();
    return {
      todayCount: notifications.filter((n) => at(n) >= now - 86_400_000).length,
      weekCount:  notifications.filter((n) => at(n) >= now - 7 * 86_400_000).length,
    };
  }, [notifications]);

  const [density, setDensity] = useLocalStorage<Density>("adm.notifications.density", "default");
  const clearFilters = () => { setFilter("all"); setTypeFilter("all"); };

  // ── grid columns ──────────────────────────────────────────────────────────

  const columns: DataTableColumn<Notification>[] = [
    {
      key: "type",
      header: "Type",
      sortValue: (n) => n.type,
      cell: (n) => {
        const meta = metaFor(n.type);
        return <StatusBadge tone={meta.tone} label={meta.label} />;
      },
    },
    {
      key: "title",
      header: "Notification",
      sortValue: (n) => n.title,
      cell: (n) => (
        <div className="flex items-center gap-2">
          {/* Unread marker — the accent dot survives the zebra banding. */}
          <span
            aria-hidden
            className={cn(
              "h-1.5 w-1.5 flex-none rounded-full",
              n.isRead ? "bg-transparent" : "bg-[var(--adm-accent)]",
            )}
          />
          <span className={cn("truncate", n.isRead ? "font-medium text-[var(--adm-ink-mute)]" : "font-semibold text-[var(--adm-ink)]")}>
            {n.title}
            {!n.isRead && <span className="sr-only"> (unread)</span>}
          </span>
        </div>
      ),
    },
    {
      key: "received",
      header: "Received",
      align: "right",
      hideBelow: "sm",
      sortValue: (n) => new Date(n.createdAt).getTime(),
      cell: (n) => <span className="text-xs tabular-nums text-[var(--adm-ink-subtle)]">{fmtRelative(n.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (n) => (
        <div className="flex items-center justify-end gap-0.5">
          {!n.isRead && (
            <button
              onClick={() => handleMarkAsRead(n.id)}
              title="Mark as read"
              aria-label={`Mark "${n.title}" as read`}
              className="rounded-[6px] p-1.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-accent-soft)] hover:text-[var(--adm-accent)]"
            >
              <IconSuccess className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <button
            onClick={() => handleDeleteNotification(n.id)}
            title="Delete"
            aria-label={`Delete "${n.title}"`}
            className="rounded-[6px] p-1.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger)]"
          >
            <IconTrash className="h-4 w-4" aria-hidden="true" />
          </button>
          <Link
            href={getNotificationLink(n)}
            title="View details"
            aria-label={`View details for "${n.title}"`}
            className="rounded-[6px] p-1.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink-mute)]"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ),
    },
  ];

  if (loading) return <AdminListSkeleton stats={4} rows={6} />;

  return (
    <>
      {/* The old strip drew share bars against the feed total ("Today 3, 4%"),
          which is not a proportion anyone acts on. These are plain counts, and
          Unread doubles as the filter shortcut. */}
      <WorkspaceTitle
        title="Notifications"
        meta={`${unreadCount} unread`}
        actions={
          unreadCount > 0 ? (
            <WorkspaceButton variant="primary" onClick={handleMarkAllAsRead} disabled={markingAllRead}>
              {markingAllRead ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconSuccess className="h-4 w-4" />}
              Mark all as read
            </WorkspaceButton>
          ) : undefined
        }
      />
      <KpiRow
        items={[
          { label: "Unread", value: unreadCount, icon: IconBell,
            tone: unreadCount > 0 ? "warning" : "success",
            hint: unreadCount === 0 ? "All caught up" : undefined,
            onClick: () => setFilter("unread") },
          { label: "Arrived today", value: todayCount, icon: IconBell },
          { label: "This week", value: weekCount, icon: IconBell },
        ]}
      />

      <Workspace>
      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-[6px] border border-[var(--adm-danger-soft)] bg-[var(--adm-danger-soft)] p-3 text-sm text-[var(--adm-danger)]">
          <IconAlert className="h-4 w-4 flex-shrink-0" />
          <p>{error}</p>
          <button
            onClick={fetchNotifications}
            className="ml-auto rounded-[6px] bg-[var(--adm-danger-soft)] px-3 py-1 text-xs font-semibold text-[var(--adm-danger)] transition-colors hover:bg-[var(--adm-danger-soft)]"
          >
            Retry
          </button>
        </div>
      )}

        <WorkspaceToolbar
          trailing={<DensityMenu value={density} onChange={setDensity} />}
        >
          <FilterPill
            label="Type"
            icon={FilterIcon.type}
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "all", label: "All types", count: notifications.length },
              ...NOTIFICATION_TYPES.map((t) => ({
                value: t.key as string,
                label: t.short,
                count: typeCounts[t.key],
              })),
            ]}
          />
          <FilterPill
            label="State"
            icon={FilterIcon.status}
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all",    label: "All",    count: notifications.length },
              { value: "unread", label: "Unread", count: unreadCount },
            ]}
          />
        </WorkspaceToolbar>

        <ActiveFilters
          chips={[
            ...(typeFilter !== "all"
              ? [{ label: `Type: ${NOTIFICATION_TYPES.find((t) => t.key === typeFilter)?.short ?? typeFilter}`, onClear: () => setTypeFilter("all") }]
              : []),
            ...(filter !== "all" ? [{ label: "Unread only", onClear: () => setFilter("all") }] : []),
          ]}
          onClearAll={clearFilters}
        />

      {/* ── Feed ── */}
        <DataTable
          noun="notifications"
          storageKey="notifications"
          columns={columns}
          rows={filteredNotifications}
          rowKey={(n) => n.id}
          density={density}
          initialSort={{ key: "received", dir: "desc" }}
          empty={{
            icon: IconBell,
            title: notifications.length === 0 ? "No notifications" : "Nothing matches these filters",
            description: notifications.length === 0
              ? "Activity from jobs, applications, and contacts will appear here."
              : filter === "unread"
              ? "You're all caught up, no unread notifications."
              : "Try clearing the type filter.",
            action: hasActiveFilters ? (
              <WorkspaceButton onClick={clearFilters}>
                <X className="h-4 w-4" />Clear filters
              </WorkspaceButton>
            ) : undefined,
          }}
        />
      </Workspace>
    </>
  );
}
