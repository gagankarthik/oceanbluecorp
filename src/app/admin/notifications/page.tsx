"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Loader2,
  ChevronRight,
  X,
} from "lucide-react";
import { IconBell, IconSuccess, IconTrash, IconAlert, IconEyeOff } from "@/components/admin/icons";
import { fmtDateTime, fmtRelative } from "@/lib/format";
import {
  Workspace, BrandBand, BAND_PRIMARY, WorkspaceButton, WorkspaceToolbar, FilterPill, FilterIcon, ActiveFilters, ToolbarDivider, DisplayMenu,
} from "@/components/admin/workspace";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { notificationActions, useNotificationFeed } from "@/hooks/use-notifications";
import { StatusBadge } from "@/components/admin/status-badge";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { AdminListSkeleton } from "@/components/admin/skeletons";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import type { Tone } from "@/components/admin/theme";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthContext";
import { UserRole, staffRolesOf } from "@/lib/auth/config";
import { canSeeNotificationType, type NotificationType, type NotificationView } from "@/lib/notifications";

type Notification = NotificationView;

/** One table for the three notification kinds, label and chip tone. */
const NOTIFICATION_TYPES: {
  key: NotificationType;
  label: string;
  short: string;
  tone: Tone;
}[] = [
  { key: "job_posted",           label: "Job posted",       short: "Jobs",         tone: "blue"    },
  { key: "application_received", label: "New application",  short: "Applications", tone: "emerald" },
  { key: "contact_received",     label: "Contact received", short: "Contacts",     tone: "violet"  },
];

const ICON_BTN =
  "grid h-8 w-8 place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors duration-150 hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]";

const OTHER_TYPE: { label: string; short: string; tone: Tone } = { label: "Other", short: "Other", tone: "slate" };

const metaFor = (type: string) => NOTIFICATION_TYPES.find((t) => t.key === type) ?? OTHER_TYPE;

export default function NotificationsPage() {
  // Shared with the top-bar bell: read and dismiss land in both at once.
  const feed = useNotificationFeed();
  const notifications: Notification[] = useMemo(() => feed.data?.notifications ?? [], [feed.data]);
  // Skeleton on first load only; later reloads keep the list on screen.
  const loading = feed.isLoading;
  const error = !feed.data && feed.error ? "Couldn't load notifications. Check your connection and try again." : null;
  const fetchNotifications = () => void feed.reload();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Notification | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { user } = useAuth();
  const viewerRoles = useMemo(() => staffRolesOf(user?.groups), [user?.groups]);
  const isAdmin = viewerRoles.includes(UserRole.ADMIN);

  const handleMarkAsRead = (id: string) => void notificationActions.markRead(id);

  const handleMarkAllAsRead = async () => {
    setMarkingAllRead(true);
    await notificationActions.markAllRead();
    setMarkingAllRead(false);
  };

  const handleDismiss = (id: string) => void notificationActions.dismiss(id);

  const handleDeleteForEveryone = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const ok = await notificationActions.remove(pendingDelete.id);
    setDeleting(false);
    if (ok) setPendingDelete(null);
  };

  const filteredNotifications = notifications.filter((n) => {
    const matchesReadFilter = filter === "all" || !n.isRead;
    const matchesTypeFilter = typeFilter === "all" || n.type === typeFilter;
    return matchesReadFilter && matchesTypeFilter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of notifications) counts[n.type] = (counts[n.type] ?? 0) + 1;
    return counts;
  }, [notifications]);

  // Offer only the kinds this viewer can receive; the API already filters the rows.
  const typeOptions = NOTIFICATION_TYPES.filter(
    (t) => canSeeNotificationType(t.key, viewerRoles) || (typeCounts[t.key] ?? 0) > 0,
  );

  const getNotificationLink = (notification: Notification) => {
    if (notification.link) return notification.link;

    switch (notification.type) {
      case "job_posted":
        return "/admin/state-roles";
      case "application_received":
        return notification.relatedId ? `/admin/applications` : "/admin/applications";
      case "contact_received":
        return notification.relatedId ? `/admin/contacts/${notification.relatedId}` : "/admin/contacts";
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

  const [rows, setRows] = useLocalStorage<number>("adm.notifications.rows", 25);
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
          {/* Unread marker, the accent dot survives the zebra banding. */}
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
      cell: (n) => (
        <time dateTime={n.createdAt} title={fmtDateTime(n.createdAt)} className="text-[13px] tabular-nums text-[var(--adm-ink-subtle)]">
          {fmtRelative(n.createdAt)}
        </time>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (n) => (
        <div className="flex items-center justify-end gap-0.5">
          {!n.isRead && (
            <button
              type="button"
              onClick={() => handleMarkAsRead(n.id)}
              title="Mark as read"
              aria-label={`Mark "${n.title}" as read`}
              className={ICON_BTN}
            >
              <IconSuccess className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => handleDismiss(n.id)}
            title="Dismiss"
            aria-label={`Dismiss "${n.title}"`}
            className={ICON_BTN}
          >
            <IconEyeOff className="h-4 w-4" aria-hidden="true" />
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setPendingDelete(n)}
              title="Delete for everyone"
              aria-label={`Delete "${n.title}" for everyone`}
              className={cn(ICON_BTN, "hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]")}
            >
              <IconTrash className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <Link
            href={getNotificationLink(n)}
            title="View details"
            aria-label={`View details for "${n.title}"`}
            className={ICON_BTN}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ),
    },
  ];

  if (loading) return <AdminListSkeleton stats={4} rows={6} label="Loading notifications" />;

  return (
    <>
      <BrandBand
        size="sm"
        className="mb-3"
        title="Notifications"
        meta={"Activity for your role, newest first"}
        stats={[
          { label: "Unread", value: unreadCount,
            hint: unreadCount === 0 ? "All caught up" : undefined,
            onClick: () => setFilter("unread"),
          selected: filter === "unread" },
          { label: "Arrived today", value: todayCount },
          { label: "This week", value: weekCount },
        ]}
        actions={
          unreadCount > 0 ? (
            <WorkspaceButton className={BAND_PRIMARY} onClick={handleMarkAllAsRead} disabled={markingAllRead}>
              {markingAllRead ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconSuccess className="h-4 w-4" />}
              Mark all as read
            </WorkspaceButton>
          ) : undefined
        }
      />

      <WorkspaceToolbar
          variant="canvas"
          trailing={<DisplayMenu rows={rows} onRowsChange={setRows} onReset={() => setRows(25)} />}
        >
          <FilterPill
            label="Type"
            icon={FilterIcon.type}
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "all", label: "All types", count: notifications.length },
              ...typeOptions.map((t) => ({
                value: t.key as string,
                label: t.short,
                count: typeCounts[t.key] ?? 0,
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
          variant="canvas"
          chips={[
            ...(typeFilter !== "all"
              ? [{ label: `Type: ${NOTIFICATION_TYPES.find((t) => t.key === typeFilter)?.short ?? typeFilter}`, onClear: () => setTypeFilter("all") }]
              : []),
            ...(filter !== "all" ? [{ label: "Unread only", onClear: () => setFilter("all") }] : []),
          ]}
          onClearAll={clearFilters}
      />

      <Workspace>
        {error && (
          <div role="alert" className="flex flex-wrap items-center gap-3 border-b border-[var(--adm-line)] bg-[var(--adm-danger-soft)] px-4 py-3 text-[13px] text-[var(--adm-danger-ink)]">
            <IconAlert className="h-4 w-4 flex-shrink-0" />
            <p className="min-w-0 flex-1">{error}</p>
            <WorkspaceButton onClick={fetchNotifications}>Try again</WorkspaceButton>
          </div>
        )}

        <DataTable
          noun="notifications"
          storageKey="notifications"
          columns={columns}
          rows={filteredNotifications}
          rowKey={(n) => n.id}
          pageSize={rows}
          onPageSizeChange={setRows}
          initialSort={{ key: "received", dir: "desc" }}
          empty={{
            icon: IconBell,
            title: notifications.length === 0 ? "No notifications" : "Nothing matches these filters",
            description: notifications.length === 0
              ? "New activity for your role will appear here."
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

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete for everyone?"
        body={pendingDelete ? `"${pendingDelete.title}" will be removed from every teammate's notifications. This can't be undone.` : undefined}
        confirmLabel="Delete for everyone"
        busy={deleting}
        onConfirm={handleDeleteForEveryone}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
