"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  useAuth, UserRole, routeAccess, PUBLISHING_ROLES, RECRUITING_ROLES, landingRouteFor,
} from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AdminProvider, useAdmin } from "@/components/admin/admin-provider";
import { HeaderSearch } from "@/components/admin/header-search";
import { ListTabs } from "@/components/admin/list-shell";
import { Avatar } from "@/components/admin/avatar";
import {
  IconOverview, IconRequisition, IconApplication, IconBench, IconResume,
  IconContact, IconClient, IconVendor, IconContent, IconStaff,
  IconBell, IconHelp, IconSettings, IconDocs, IconMenu,
  IconHrPortal, IconLogout, IconShield, IconClock, IconTrash,
  IconBlog, IconChart, IconQuote, IconNews, IconJob, IconStateRole,
} from "@/components/admin/icons";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useNotifications, formatTimeAgo } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  section: Section;
};

// Recruiting roles. Media is absent on purpose; its items name the role explicitly.
const ALL_ROLES = [UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES];

const SECTION_ORDER = ["Recruiting", "Relationships", "Publishing", "Workspace"] as const;
type Section = (typeof SECTION_ORDER)[number];

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard",    href: "/admin",              icon: IconOverview,     roles: ALL_ROLES, section: "Recruiting" },
  { name: "State Roles",  href: "/admin/state-roles", icon: IconStateRole,    roles: [...ALL_ROLES, UserRole.MEDIA], section: "Recruiting" },
  { name: "Open Roles",   href: "/admin/open-roles",   icon: IconJob,          roles: [...ALL_ROLES, UserRole.MEDIA], section: "Recruiting" },
  { name: "Applications", href: "/admin/applications", icon: IconApplication,  roles: ALL_ROLES, section: "Recruiting" },
  { name: "Talent Bench", href: "/admin/bench",        icon: IconBench,        roles: ALL_ROLES, section: "Recruiting" },
  { name: "Resumes",      href: "/admin/resumes",      icon: IconResume,       roles: ALL_ROLES, section: "Recruiting" },
  { name: "Contacts",     href: "/admin/contacts",     icon: IconContact,      roles: [UserRole.ADMIN, UserRole.HR], section: "Relationships" },
  { name: "Clients",      href: "/admin/clients",      icon: IconClient,       roles: [UserRole.ADMIN, UserRole.HR], section: "Relationships" },
  { name: "Vendors",      href: "/admin/vendors",      icon: IconVendor,       roles: [UserRole.ADMIN, UserRole.HR], section: "Relationships" },
  // PUBLISHING_ROLES is the same constant routeAccess and requirePublisher use.
  { name: "Blog",             href: "/admin/blog",             icon: IconBlog,    roles: PUBLISHING_ROLES, section: "Publishing" },
  { name: "Case Studies",     href: "/admin/case-studies",     icon: IconChart,   roles: PUBLISHING_ROLES, section: "Publishing" },
  { name: "Customer Stories", href: "/admin/customer-stories", icon: IconQuote, roles: PUBLISHING_ROLES, section: "Publishing" },
  { name: "News",             href: "/admin/news",             icon: IconNews,  roles: PUBLISHING_ROLES, section: "Publishing" },
  { name: "Content",      href: "/admin/content",      icon: IconContent,      roles: [UserRole.ADMIN], section: "Workspace" },
  { name: "Users",        href: "/admin/users",        icon: IconStaff,        roles: [UserRole.ADMIN], section: "Workspace" },
  { name: "Developer",    href: "/admin/docs",         icon: IconDocs,         roles: [UserRole.ADMIN], section: "Workspace" },
];

const NOTIFICATION_ICONS = {
  job_posted: IconRequisition,
  application_received: IconApplication,
  contact_received: IconContact,
  task_assigned: IconClock,
  application_deleted: IconTrash,
};

const ROLE_LABEL: Record<string, string> = {
  [UserRole.ADMIN]: "Administrator",
  [UserRole.HR]: "HR",
  [UserRole.RECRUITER]: "Recruiter",
  [UserRole.SALES]: "Sales",
  [UserRole.MEDIA]: "Media",
};

// Path prefixes with no nav entry, mapped to what the breadcrumb should say.
const SECTION_ALIASES: Record<string, { name: string; href: string; section?: Section }> = {
  "/admin/candidates":    { name: "Applications",  href: "/admin/applications", section: "Recruiting" },
  "/admin/lead-sourcing": { name: "Talent Bench",  href: "/admin/bench", section: "Recruiting" },
  "/admin/roles":         { name: "Roles",         href: "/admin/roles", section: "Workspace" },
  "/admin/settings":      { name: "Settings",      href: "/admin/settings" },
  "/admin/api-keys":      { name: "API Keys",      href: "/admin/api-keys", section: "Workspace" },
  "/admin/help":          { name: "Help",          href: "/admin/help" },
  "/admin/notifications": { name: "Notifications", href: "/admin/notifications" },
};

function currentSection(pathname: string): { name: string; href: string; section?: Section } {
  for (const [prefix, info] of Object.entries(SECTION_ALIASES)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return info;
  }
  const match = NAV_ITEMS
    .filter((item) => item.href !== "/admin" && (pathname === item.href || pathname.startsWith(item.href + "/")))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match
    ? { name: match.name, href: match.href, section: match.section }
    : { name: "Dashboard", href: "/admin", section: "Recruiting" };
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));
}

/** Close a popover on outside click and Escape. */
function useDismiss(open: boolean, ref: React.RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, ref, close]);
}

const iconButton =
  "inline-flex h-9 w-9 items-center justify-center rounded-[var(--adm-radius-control)] text-[var(--adm-ink)] transition-colors hover:bg-[var(--adm-surface-2)] [&_svg]:stroke-2";

// ── Sidebar ────────────────────────────────────────────────────────────────────

function Sidebar({
  open,
  collapsed,
  onClose,
  onToggleCollapse,
  pathname,
  hasAnyRole,
}: {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  pathname: string;
  hasAnyRole: (roles: UserRole[]) => boolean;
}) {
  // The mobile drawer always renders expanded.
  const rail = collapsed;

  // Below lg the drawer is off-canvas: closed, it leaves the tab order; open,
  // focus moves in and Escape closes it.
  const desktop = useMediaQuery("(min-width: 1024px)");
  const asideRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open || desktop) return;
    asideRef.current?.querySelector<HTMLElement>("a[href], button")?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, desktop]);

  return (
    <aside
      ref={asideRef}
      inert={!open && !desktop}
      className={cn(
        "adm-nav fixed inset-y-0 left-0 z-50 flex w-[256px] flex-col border-r border-[var(--adm-nav-line)] bg-[var(--adm-nav-bg)] transition-[transform,width] duration-200 ease-[var(--adm-ease)] lg:translate-x-0",
        open ? "translate-x-0 shadow-[var(--adm-shadow-lg)] lg:shadow-none" : "-translate-x-full",
        // 240px expanded, the 64px rail below 1280px (enterprise spec).
        rail ? "lg:w-[64px]" : "lg:w-[240px]",
      )}
      aria-label="Sidebar"
    >
      {/* On the sidebar edge, level with the logo. */}
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={rail ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!rail}
        title={rail ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-[28px] z-10 hidden h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-[var(--adm-line-control)] bg-[var(--adm-surface)] text-[var(--adm-ink-mute)] shadow-[var(--adm-shadow-sm)] transition-colors hover:border-[var(--adm-ink-mute)] hover:text-[var(--adm-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--adm-focus-ring)] lg:grid"
      >
        {rail ? <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>

      <div className={cn("flex h-[56px] flex-none items-center gap-2 border-b border-[var(--adm-line)] px-4", rail && "lg:justify-center lg:px-0")}>
        <Link
          href="/admin"
          aria-label="Oceanblue, dashboard"
          title="Oceanblue"
          className="flex min-w-0 items-center rounded-[var(--adm-radius-control)] p-1 transition-opacity hover:opacity-80"
        >
          {/* Full wordmark when expanded (and in the mobile drawer); the mark alone in the rail. */}
          <Image
            src="/logo.webp"
            alt="Oceanblue"
            width={256}
            height={70}
            priority
            className={cn("h-9 w-auto max-w-full object-contain", rail && "lg:hidden")}
          />
          <Image
            src="/favicon.png"
            alt="Oceanblue"
            width={80}
            height={76}
            className={cn("hidden h-8 w-auto object-contain", rail && "lg:block")}
          />
        </Link>
        <button onClick={onClose} aria-label="Close navigation" className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-[var(--adm-radius-control)] text-[var(--adm-nav-mute)] transition-colors hover:bg-[var(--adm-nav-hover)] hover:text-[var(--adm-nav-ink)] lg:hidden">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <nav className="adm-scroll-hidden flex-1 overflow-y-auto px-2.5 py-3" aria-label="Main navigation">
        {SECTION_ORDER.map((section, groupIdx) => {
          const items = NAV_ITEMS.filter((item) => item.section === section && hasAnyRole(item.roles));
          if (items.length === 0) return null;
          return (
            <div key={section} className={cn(groupIdx > 0 && "mt-5")}>
              <p className={cn("px-3 pb-1.5 text-adm-xs font-medium text-[var(--adm-nav-subtle)]", rail && "lg:hidden")}>
                {section}
              </p>
              {rail && groupIdx > 0 && <div className="mx-3 mb-3 hidden border-t border-[var(--adm-nav-line)] lg:block" />}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={rail ? item.name : undefined}
                        aria-label={rail ? item.name : undefined}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex h-9 items-center gap-2.5 rounded-[var(--adm-radius-control)] px-3 text-adm-base transition-colors",
                          rail && "lg:justify-center lg:px-0",
                          active
                            ? "bg-[var(--adm-nav-active)] font-semibold text-[var(--adm-nav-active-ink)] before:absolute before:inset-y-1.5 before:-left-2.5 before:w-[3px] before:rounded-r-full before:bg-[var(--adm-nav-active-icon)]"
                            : "font-medium text-[var(--adm-nav-mute)] hover:bg-[var(--adm-nav-hover)] hover:text-[var(--adm-nav-ink)]",
                        )}
                      >
                        <item.icon
                          aria-hidden="true"
                          className={cn(
                            "h-[18px] w-[18px] flex-none transition-colors",
                            active ? "text-[var(--adm-nav-active-icon)]" : "text-[var(--adm-nav-mute)] group-hover:text-[var(--adm-nav-ink)]",
                          )}
                        />
                        <span className={cn("truncate", rail && "lg:hidden")}>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

// ── Account menu ───────────────────────────────────────────────────────────────

function UserMenu({
  user,
  signOut,
}: {
  user: ReturnType<typeof useAuth>["user"];
  signOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, ref, close);

  const photoSrc = user?.id && !avatarFailed ? `/api/users/avatar/${user.id}` : null;
  const role = user?.role ? ROLE_LABEL[user.role] ?? user.role : "No role";
  const canHr = user?.role === UserRole.ADMIN || user?.role === UserRole.HR;

  const avatar = (size: "sm" | "md") => (
    <Avatar name={user?.name} email={user?.email} size={size} src={photoSrc} onError={() => setAvatarFailed(true)} />
  );

  // Rows share the top bar's 36px height and 18px icons.
  const row = "flex h-9 w-full items-center gap-3 rounded-[var(--adm-radius-control)] px-2.5 text-adm-base transition-colors";
  const item = cn(row, "text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]");
  const icon = "h-[18px] w-[18px] flex-none text-[var(--adm-ink-subtle)]";
  const external = "ml-auto h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full transition-shadow hover:ring-2 hover:ring-[var(--adm-line)]",
          open && "ring-2 ring-[var(--adm-focus-ring)]",
        )}
      >
        {avatar("sm")}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-[var(--adm-radius-card)] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-pop)]"
        >
          <div className="flex items-center gap-3 border-b border-[var(--adm-line)] px-3.5 py-3">
            {avatar("md")}
            <div className="min-w-0 flex-1">
              <p className="truncate text-adm-xs font-semibold text-[var(--adm-ink)]">{user?.name}</p>
              <p className="truncate text-adm-xs text-[var(--adm-ink-subtle)]">{user?.email}</p>
            </div>
            <span className="flex-none rounded-[var(--adm-radius-chip)] bg-[var(--adm-accent-soft)] px-1.5 py-0.5 text-adm-micro font-medium text-[var(--adm-accent)]">
              {role}
            </span>
          </div>
          <div className="p-1.5" role="none">
            <Link href="/admin/settings" role="menuitem" onClick={close} className={item}>
              <IconSettings className={icon} aria-hidden="true" /> Settings
            </Link>
            {canHr && (
              <a href="https://hr.oceanbluecorp.com" target="_blank" rel="noopener noreferrer" role="menuitem" onClick={close} className={item}>
                <IconHrPortal className={icon} aria-hidden="true" />
                HR Portal
                <ExternalLink className={external} aria-hidden="true" />
              </a>
            )}
            {user?.role === UserRole.ADMIN && (
              <Link href="/admin/docs" role="menuitem" onClick={close} className={item}>
                <IconDocs className={icon} aria-hidden="true" /> Developer
              </Link>
            )}
          </div>
          <div className="border-t border-[var(--adm-line)] p-1.5" role="none">
            <button
              role="menuitem"
              onClick={() => signOut()}
              className={cn(row, "text-[var(--adm-danger-ink)] hover:bg-[var(--adm-danger-soft)]")}
            >
              <IconLogout className="h-[18px] w-[18px] flex-none" aria-hidden="true" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Notifications ──────────────────────────────────────────────────────────────

/** "Today" / "Yesterday" / "Earlier", for grouping the feed by day. */
function dayGroup(iso: string): "Today" | "Yesterday" | "Earlier" {
  const d = new Date(iso);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  if (d.getTime() >= start) return "Today";
  if (d.getTime() >= start - 86_400_000) return "Yesterday";
  return "Earlier";
}

function NotificationsPanel() {
  const {
    allNotifications, unreadCount, loading, open, setOpen,
    panelRef, markAllAsRead, handleClick,
  } = useNotifications();
  const [view, setView] = useState<"all" | "unread">("all");
  const bellRef = useRef<HTMLButtonElement>(null);

  // Escape closes and hands focus back to the bell.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); bellRef.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const list = (view === "unread" && unreadCount > 0 ? allNotifications.filter((n) => !n.isRead) : allNotifications).slice(0, 8);
  const groups = (["Today", "Yesterday", "Earlier"] as const)
    .map((g) => ({ g, items: list.filter((n) => dayGroup(n.createdAt) === g) }))
    .filter((x) => x.items.length > 0);

  return (
    <div ref={panelRef} className="relative">
      <button
        ref={bellRef}
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(iconButton, "relative", open && "bg-[var(--adm-surface-2)]")}
      >
        <IconBell className="h-[18px] w-[18px]" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--adm-danger)] px-1 text-adm-micro font-semibold tabular-nums text-white ring-2 ring-[var(--adm-surface)]"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className={cn(
            "z-50 flex flex-col overflow-hidden rounded-[var(--adm-radius-card)] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-pop)]",
            // Phones: a sheet under the top bar. From sm: a popover anchored to the bell.
            "fixed inset-x-3 top-[60px] max-h-[calc(100dvh-76px)]",
            "sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-[min(34rem,calc(100dvh-6rem))] sm:w-[24rem]",
          )}
        >
          <div className="flex-none border-b border-[var(--adm-line)] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-adm-md font-semibold text-[var(--adm-ink)]">Notifications</h2>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="h-8 rounded-[var(--adm-radius-control)] px-2 text-adm-xs font-medium text-[var(--adm-accent)] transition-colors hover:bg-[var(--adm-accent-tint)]"
                >
                  Mark all read
                </button>
              )}
            </div>
            {unreadCount > 0 && (
            <div className="mt-2.5">
              <ListTabs
                label="Show"
                value={view}
                onChange={setView}
                tabs={[
                  { key: "all", label: "All", count: allNotifications.length },
                  { key: "unread", label: "Unread", count: unreadCount },
                ]}
              />
            </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading && allNotifications.length === 0 ? (
              <div className="space-y-4 p-4" aria-busy="true" aria-label="Loading notifications">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="skel mt-0.5 h-4 w-4" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skel h-3 w-2/3" />
                      <div className="skel h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <IconBell className="mx-auto h-6 w-6 text-[var(--adm-ink-mute)]" aria-hidden="true" />
                <p className="mt-3 text-adm-base font-medium text-[var(--adm-ink)]">
                  {view === "unread" ? "Nothing unread" : "You\u2019re up to date"}
                </p>
                <p className="mt-1 text-adm-xs text-[var(--adm-ink-mute)]">New jobs, applications and enquiries appear here.</p>
              </div>
            ) : (
              groups.map(({ g, items }) => (
                <section key={g} aria-labelledby={`notif-${g}`}>
                  <h3 id={`notif-${g}`} className="sticky top-0 z-[1] bg-[var(--adm-surface-sunken)] px-4 py-1.5 text-adm-micro font-semibold uppercase tracking-[0.05em] text-[var(--adm-ink-mute)]">
                    {g}
                  </h3>
                  <ul>
                    {items.map((n) => {
                      const Icon = NOTIFICATION_ICONS[n.type];
                      return (
                        <li key={n.id} className="border-b border-[var(--adm-line-soft)] last:border-0">
                          <button
                            type="button"
                            onClick={() => handleClick(n)}
                            className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--adm-row-hover)]"
                          >
                            <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 flex-none text-[var(--adm-ink-mute)]" />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-baseline justify-between gap-3">
                                <span className={cn("min-w-0 truncate text-adm-base", n.isRead ? "text-[var(--adm-ink-mute)]" : "font-semibold text-[var(--adm-ink)]")}>
                                  {n.title}
                                </span>
                                <span className="flex-none text-adm-xs tabular-nums text-[var(--adm-ink-mute)]">{formatTimeAgo(n.createdAt)}</span>
                              </span>
                              <span className="mt-0.5 line-clamp-2 text-adm-xs leading-relaxed text-[var(--adm-ink-mute)]">{n.message}</span>
                            </span>
                            {/* Unread: a dot, the bold title and the text below, never colour alone. */}
                            {!n.isRead && (
                              <>
                                <span aria-hidden="true" className="mt-1.5 h-2 w-2 flex-none rounded-full bg-[var(--adm-accent)]" />
                                <span className="sr-only">Unread</span>
                              </>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </div>

          {allNotifications.length > 0 && (
            <Link
              href="/admin/notifications"
              onClick={() => setOpen(false)}
              className="flex h-11 flex-none items-center justify-center gap-1 border-t border-[var(--adm-line)] text-adm-xs font-medium text-[var(--adm-accent)] transition-colors hover:bg-[var(--adm-row-hover)]"
            >
              View all notifications
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function AccessDenied({ userRole }: { userRole: string | null | undefined }) {
  // Media cannot reach /admin, so send each role to its own landing page.
  const home = landingRouteFor(userRole as UserRole | null);
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-sm text-center">
        <IconShield className="mx-auto h-6 w-6 text-[var(--adm-danger-ink)]" aria-hidden="true" />
        <p className="mt-3 text-adm-md font-semibold text-[var(--adm-ink)]">Access restricted</p>
        <p className="mt-1 text-adm-base text-[var(--adm-ink-mute)]">
          Your role ({userRole ?? "none"}) can&apos;t open this page. Ask an administrator if you need access.
        </p>
        <Link
          href={home}
          className="mt-5 inline-flex h-8 items-center rounded-[var(--adm-radius-control)] bg-[var(--adm-accent)] px-3 text-adm-xs font-medium text-white transition-colors hover:bg-[var(--adm-accent-strong)]"
        >
          {home === "/admin" ? "Back to dashboard" : "Go to your workspace"}
        </Link>
      </div>
    </div>
  );
}

// ── Shell ──────────────────────────────────────────────────────────────────────

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // null = never chosen, so it follows the viewport; an explicit toggle sticks.
  const [storedCollapsed, setStoredCollapsed] = useLocalStorage<boolean | null>("adminSidebarCollapsed", null);
  const narrowViewport = useMediaQuery("(max-width: 1279.98px)");
  const sidebarCollapsed = storedCollapsed ?? narrowViewport;
  const { user, signOut, hasAnyRole } = useAuth();

  // Portalled menus and drawers mount in <body>; this class lets them keep the console's styles.
  useEffect(() => {
    document.body.classList.add("adm-portals");
    return () => document.body.classList.remove("adm-portals");
  }, []);
  const { pageCrumb, navSection } = useAdmin();
  const section = currentSection(navSection ?? pathname);

  // Media has no dashboard; bounce only the bare /admin landing.
  const home = landingRouteFor(user?.role);
  useEffect(() => {
    if (pathname === "/admin" && home !== "/admin") router.replace(home);
  }, [pathname, home, router]);

  // Close the mobile drawer on navigation.
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  const canSearch = hasAnyRole(RECRUITING_ROLES);

  const toggleSidebarCollapse = useCallback(() => {
    setStoredCollapsed(!sidebarCollapsed);
  }, [sidebarCollapsed, setStoredCollapsed]);

  const routeAllowed = (() => {
    if (!user?.role) return false;
    const match = Object.keys(routeAccess)
      .filter((p) => pathname === p || pathname.startsWith(p + "/"))
      .sort((a, b) => b.length - a.length)[0];
    return match ? routeAccess[match].includes(user.role) : true;
  })();

  const title = pageCrumb ?? section.name;

  // The layout is a client component, so route metadata can't title the tab; name it here.
  useEffect(() => {
    document.title = `${title} | Oceanblue Console`;
  }, [title]);

  return (
    <div className="adm-scope min-h-screen bg-[var(--adm-canvas)]">
      <a
        href="#adm-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-[var(--adm-radius-control)] focus:bg-[var(--adm-accent)] focus:px-3 focus:py-2 focus:text-adm-xs focus:font-medium focus:text-white"
      >
        Skip to content
      </a>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[var(--adm-scrim)] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={toggleSidebarCollapse}
        pathname={navSection ?? pathname}
        hasAnyRole={hasAnyRole}
      />

      <div
        className={cn(
          "transition-[padding] duration-200 ease-[var(--adm-ease)]",
          sidebarCollapsed ? "lg:pl-[64px]" : "lg:pl-[240px]",
        )}
      >
        <header className="sticky top-0 z-30 flex h-[56px] items-center justify-between gap-3 border-b border-[var(--adm-line)] bg-[var(--adm-surface)] px-3 sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-1">
            <button onClick={() => setSidebarOpen(true)} aria-label="Open navigation" className={cn(iconButton, "lg:hidden")}>
              <IconMenu className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
            <h1 className="ml-1 truncate text-adm-base font-semibold text-[var(--adm-ink)] md:hidden">{title}</h1>
          </div>

          <div className="flex items-center justify-end gap-1.5">
            {canSearch && <HeaderSearch />}
            <NotificationsPanel />
            <Link href="/admin/help" title="Help and team" aria-label="Help and team directory" className={iconButton}>
              <IconHelp className="h-[18px] w-[18px]" aria-hidden="true" />
            </Link>
            <UserMenu user={user} signOut={signOut} />
          </div>
        </header>

        {/* Fixed height so list screens scroll their grid, not the page. Padding
            matches the -mx/-mb bleed of the sticky form bars. */}
        <main
          id="adm-main"
          // `relative`: sr-only labels inside are position:absolute. Without a
          // positioned scroller they anchor to <body>, escape this overflow and
          // stretch the document, which shows as blank space under the page.
          className="relative flex h-[calc(100dvh-56px)] min-w-0 flex-col overflow-y-auto overflow-x-hidden bg-[var(--adm-canvas)] p-4 sm:p-5 lg:p-6"
        >
          {routeAllowed ? children : <AccessDenied userRole={user?.role} />}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES, UserRole.MEDIA]}>
      <AdminProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </AdminProvider>
    </ProtectedRoute>
  );
}
