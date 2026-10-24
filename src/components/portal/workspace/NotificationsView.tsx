"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { fmtDateTime, fmtRelative } from "@/lib/format";
import { notificationActions, useNotificationFeed } from "@/hooks/use-notifications";
import { useAuth } from "@/lib/auth/AuthContext";
import { UserRole, staffRolesOf } from "@/lib/auth/config";
import { canSeeNotificationType, type NotificationType, type NotificationView } from "@/lib/notifications";
import Icon, { type IconName } from "@/components/portal/icons";
import Select from "@/components/portal/Select";
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, Page, PageHeader, Segmented, Skeleton, type Tone } from "@/components/portal/kit";

type Notification = NotificationView;

const TYPES: Record<NotificationType, { label: string; icon: IconName; tone: Tone }> = {
  job_posted: { label: "Job posted", icon: "briefcase", tone: "blue" },
  application_received: { label: "New application", icon: "inbox", tone: "cyan" },
  contact_received: { label: "Contact enquiry", icon: "contact", tone: "green" },
  task_assigned: { label: "Task assigned", icon: "clock", tone: "amber" },
  application_deleted: { label: "Application deleted", icon: "trash", tone: "grey" },
};
const OTHER = { label: "Other", icon: "bell" as IconName, tone: "grey" as Tone };
const metaFor = (type: string) => TYPES[type as NotificationType] ?? OTHER;

// Links stored before the move still say /admin.
const portalLink = (link: string) => link.replace(/^\/admin\/bench\b/, "/portal/talent-bench").replace(/^\/admin\b/, "/portal");

function linkFor(n: Notification) {
  if (n.link) return portalLink(n.link);
  switch (n.type) {
    case "job_posted":
      return "/portal/state-roles";
    case "application_received":
    case "application_deleted":
      return "/portal/applications";
    case "contact_received":
      return n.relatedId ? `/portal/contacts/${n.relatedId}` : "/portal/contacts";
    case "task_assigned":
      return n.relatedId ? `/portal/candidates/${n.relatedId}` : "/portal/applications";
    default:
      return "/portal";
  }
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(new Date()) - start(d)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", ...(diff > 300 ? { year: "numeric" } : {}) });
}

const iconBtn = "grid size-10 shrink-0 place-items-center rounded-lg text-mist-500 transition-colors duration-150 hover:bg-mist-100 hover:text-navy-900";

function Row({ n, isAdmin, onDelete }: { n: Notification; isAdmin: boolean; onDelete: () => void }) {
  const m = metaFor(n.type);
  return (
    <li className={`group flex items-start gap-1 px-2 py-1 sm:px-3 ${n.isRead ? "" : "bg-ocean-50/40"}`}>
      <Link
        href={linkFor(n)}
        onClick={() => !n.isRead && void notificationActions.markRead(n.id)}
        className="flex min-w-0 flex-1 items-start gap-3 rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-mist-50"
      >
        <span aria-hidden className={`mt-2 size-2 shrink-0 rounded-full ${n.isRead ? "" : "bg-ocean-600"}`} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className={`min-w-0 truncate text-adm-base ${n.isRead ? "text-mist-700" : "font-semibold text-navy-900"}`}>
              {n.title}
              {!n.isRead && <span className="sr-only"> (unread)</span>}
            </span>
            <span className="text-adm-xs text-mist-600">{m.label}</span>
          </span>
          {n.message && <span className="mt-0.5 block truncate text-adm-base text-mist-600">{n.message}</span>}
        </span>
        <time dateTime={n.createdAt} title={fmtDateTime(n.createdAt)} className="shrink-0 pt-0.5 text-adm-xs tabular-nums text-mist-600">
          {fmtRelative(n.createdAt)}
        </time>
      </Link>
      <div className="flex shrink-0 items-center pt-1 md:opacity-0 md:transition-opacity md:group-focus-within:opacity-100 md:group-hover:opacity-100">
        {!n.isRead && (
          <button type="button" onClick={() => void notificationActions.markRead(n.id)} title="Mark as read" aria-label={`Mark "${n.title}" as read`} className={iconBtn}>
            <Icon name="check" className="size-4" />
          </button>
        )}
        <button type="button" onClick={() => void notificationActions.dismiss(n.id)} title="Dismiss for me" aria-label={`Dismiss "${n.title}" for me`} className={iconBtn}>
          <Icon name="x" className="size-4" />
        </button>
        {isAdmin && (
          <>
            <span aria-hidden className="mx-1 h-5 w-px bg-mist-200" />
            <button
              type="button"
              onClick={onDelete}
              title="Delete for everyone"
              aria-label={`Delete "${n.title}" for everyone`}
              className="grid size-10 shrink-0 place-items-center rounded-lg text-status-danger transition-colors duration-150 hover:bg-status-danger-soft"
            >
              <Icon name="trash" className="size-4" />
            </button>
          </>
        )}
      </div>
    </li>
  );
}

function FeedSkeleton() {
  return (
    <div role="status" aria-label="Loading notifications" className="grid gap-6">
      {[4, 3].map((rows, g) => (
        <div key={g} className="grid gap-3">
          <Skeleton className="h-3.5 w-24" />
          <div className="divide-y divide-mist-100 rounded-lg bg-mist-0 ring-1 ring-mist-200">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="size-9 rounded-lg" />
                <div className="grid flex-1 gap-2">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const PAGE = 50;

export default function NotificationsView() {
  // Shared with the top-bar bell: read and dismiss land in both at once.
  const feed = useNotificationFeed();
  const notifications: Notification[] = useMemo(() => feed.data?.notifications ?? [], [feed.data]);
  const [view, setView] = useState<"all" | "unread">("all");
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [markingAll, setMarkingAll] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Notification | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { user } = useAuth();
  const viewerRoles = useMemo(() => staffRolesOf(user?.groups), [user?.groups]);
  const isAdmin = viewerRoles.includes(UserRole.ADMIN);

  const unread = notifications.filter((n) => !n.isRead).length;
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const n of notifications) c[n.type] = (c[n.type] ?? 0) + 1;
    return c;
  }, [notifications]);
  // Offer only the kinds this viewer can receive; the API already filters the rows.
  const typeOptions = (Object.keys(TYPES) as NotificationType[]).filter((t) => canSeeNotificationType(t, viewerRoles) || (counts[t] ?? 0) > 0);

  const q = query.trim().toLowerCase();
  const filtered = notifications
    .filter((n) => (view === "all" || !n.isRead) && (type === "all" || n.type === type) && (!q || `${n.title} ${n.message}`.toLowerCase().includes(q)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const shown = filtered.slice(0, limit);
  const groups = shown.reduce<{ day: string; items: Notification[] }[]>((acc, n) => {
    const day = dayLabel(n.createdAt);
    const last = acc[acc.length - 1];
    if (last?.day === day) last.items.push(n);
    else acc.push({ day, items: [n] });
    return acc;
  }, []);
  const filtering = view !== "all" || type !== "all" || !!q;
  const clear = () => {
    setView("all");
    setType("all");
    setQuery("");
  };

  const markAll = async () => {
    setMarkingAll(true);
    await notificationActions.markAllRead();
    setMarkingAll(false);
  };

  const deleteForEveryone = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const ok = await notificationActions.remove(pendingDelete.id);
    setDeleting(false);
    if (ok) setPendingDelete(null);
  };

  return (
    <Page>
      <PageHeader
        title="Notifications"
        icon="bell"
        section="workspace"

        meta={unread > 0 ? <Badge tone="blue">{unread} unread</Badge> : undefined}
        actions={
          unread > 0 ? (
            <Button icon="check" loading={markingAll} onClick={() => void markAll()}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {feed.isLoading ? (
        <FeedSkeleton />
      ) : feed.error && !feed.data ? (
        <ErrorState title="Couldn't load notifications" message={feed.error.message} onRetry={() => void feed.reload()} retrying={feed.isValidating} />
      ) : notifications.length === 0 ? (
        <EmptyState framed icon="bell" title="No notifications" body="New applications, enquiries, postings and tasks for your role appear here." />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              label="Show"
              value={view}
              onChange={setView}
              options={[
                { value: "all", label: `All ${notifications.length}` },
                { value: "unread", label: `Unread ${unread}` },
              ]}
            />
            <Select
              label="Type"
              value={type}
              onChange={setType}
              options={[{ value: "all", label: "All types", count: notifications.length }, ...typeOptions.map((t) => ({ value: t, label: TYPES[t].label, icon: TYPES[t].icon, count: counts[t] ?? 0 }))]}
            />
            <label className="relative min-w-0 flex-1 basis-56">
              <span className="sr-only">Search notifications</span>
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notifications"
                className="h-8 w-full rounded-md border border-mist-200 bg-mist-0 pl-9 pr-3 text-adm-base text-navy-900 placeholder:text-placeholder focus:border-mist-400 focus:outline-none"
              />
            </label>
          </div>

          {filtered.length === 0 ? (
            view === "unread" && type === "all" && !q ? (
              <EmptyState framed icon="check" title="You're all caught up" body="No unread notifications." secondary={{ label: "Show all", onClick: () => setView("all") }} />
            ) : (
              <EmptyState framed variant="no-results" title="Nothing matches these filters" body="Try another type, or clear the search." onClearFilters={clear} />
            )
          ) : (
            <div className="grid gap-6">
              {groups.map((g, gi) => (
                <section key={g.day} aria-labelledby={`day-${gi}`} className="grid gap-2">
                  <h2 id={`day-${gi}`} className="px-1 text-adm-base font-semibold text-mist-600">
                    {g.day}
                  </h2>
                  <ul className="divide-y divide-mist-100 overflow-hidden rounded-lg bg-mist-0 ring-1 ring-mist-200">
                    {g.items.map((n) => (
                      <Row key={n.id} n={n} isAdmin={isAdmin} onDelete={() => setPendingDelete(n)} />
                    ))}
                  </ul>
                </section>
              ))}
              {filtered.length > shown.length && (
                <div className="flex justify-center">
                  <Button variant="secondary" icon="chevronDown" onClick={() => setLimit((l) => l + PAGE)}>
                    Show {Math.min(PAGE, filtered.length - shown.length)} more
                  </Button>
                </div>
              )}
              {filtering && <p className="text-center text-adm-base text-mist-600">{filtered.length} of {notifications.length} shown</p>}
            </div>
          )}
        </>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete for everyone?"
          body={
            <>
              &ldquo;{pendingDelete.title}&rdquo; will be removed from every teammate&apos;s notifications. This can&apos;t be undone. To hide it only for you, dismiss it instead.
            </>
          }
          confirmLabel="Delete for everyone"
          busy={deleting}
          onConfirm={() => void deleteForEveryone()}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </Page>
  );
}
