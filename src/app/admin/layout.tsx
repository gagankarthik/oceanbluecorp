"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu, X, ChevronRight, Search,
  PanelLeftClose, PanelLeft, Loader2, ExternalLink,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth, UserRole, routeAccess } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AdminProvider, useAdmin } from "@/components/admin/admin-provider";
import { HeaderSearch } from "@/components/admin/header-search";
import { Avatar } from "@/components/admin/avatar";
import {
  IconOverview, IconRequisition, IconApplication, IconBench, IconResume,
  IconContact, IconClient, IconVendor, IconContent, IconStaff,
  IconBell, IconHelp, IconSettings, IconDocs,
  IconGroup, IconHome, IconLogout, IconShield, IconSource,
} from "@/components/admin/icons";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useNotifications, formatTimeAgo } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  section: string;
};

const ALL_ROLES = [UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES];

// Grouped under uppercase section headers, the way a data console organises its
// nav (Conduktor: CONSOLE / INSIGHTS / SELF-SERVICE). Order here is the render
// order; SECTION_ORDER drives the grouping.
const SECTION_ORDER = ["Recruiting", "Relationships", "Workspace"] as const;

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard",    href: "/admin",              icon: IconOverview,     roles: ALL_ROLES, section: "Recruiting" },
  { name: "Job Postings", href: "/admin/jobs",         icon: IconRequisition,  roles: ALL_ROLES, section: "Recruiting" },
  { name: "Applications", href: "/admin/applications", icon: IconApplication,  roles: ALL_ROLES, section: "Recruiting" },
  { name: "Talent Bench", href: "/admin/bench",        icon: IconBench,        roles: ALL_ROLES, section: "Recruiting" },
  { name: "Lead Sourcing",href: "/admin/lead-sourcing",icon: IconSource,       roles: ALL_ROLES, section: "Recruiting" },
  { name: "Resumes",      href: "/admin/resumes",      icon: IconResume,       roles: ALL_ROLES, section: "Recruiting" },
  { name: "Contacts",     href: "/admin/contacts",     icon: IconContact,      roles: [UserRole.ADMIN, UserRole.HR], section: "Relationships" },
  { name: "Clients",      href: "/admin/clients",      icon: IconClient,       roles: [UserRole.ADMIN, UserRole.HR], section: "Relationships" },
  { name: "Vendors",      href: "/admin/vendors",      icon: IconVendor,       roles: [UserRole.ADMIN, UserRole.HR], section: "Relationships" },
  { name: "Content",      href: "/admin/content",      icon: IconContent,      roles: [UserRole.ADMIN], section: "Workspace" },
  { name: "Users",        href: "/admin/users",        icon: IconStaff,        roles: [UserRole.ADMIN], section: "Workspace" },
];

const notificationIcons = {
  job_posted: IconRequisition,
  application_received: IconApplication,
  contact_received: IconContact,
};

const notificationColors = {
  job_posted: "bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]",
  application_received: "bg-emerald-500/15 text-emerald-600",
  contact_received: "bg-violet-500/15 text-violet-500",
};

// Translucent category tints (not -50 fills) so each role hue survives on the
// dark chrome as well as the light one.
const roleBadgeColor: Record<string, string> = {
  [UserRole.ADMIN]:     "bg-rose-500/15 text-rose-600",
  [UserRole.HR]:        "bg-violet-500/15 text-violet-500",
  [UserRole.RECRUITER]: "bg-teal-500/15 text-teal-600",
  [UserRole.SALES]:     "bg-amber-500/15 text-amber-600",
};

// ── Section aliases — maps path prefixes with no nav entry to their parent ────
const SECTION_ALIASES: Record<string, { name: string; href: string }> = {
  "/admin/candidates":    { name: "Applications",  href: "/admin/applications" },
  "/admin/roles":         { name: "Roles",         href: "/admin/roles" },
  "/admin/settings":      { name: "Settings",      href: "/admin/settings" },
  "/admin/api-keys":      { name: "API Keys",      href: "/admin/api-keys" },
  // These three have no sidebar entry either, so without an alias they fell
  // through to the "Dashboard" fallback and the breadcrumb lied about where
  // you were — /admin/help read "Dashboard" while showing the directory.
  "/admin/help":          { name: "Help",          href: "/admin/help" },
  "/admin/notifications": { name: "Notifications", href: "/admin/notifications" },
  "/admin/docs":          { name: "Developer",     href: "/admin/docs" },
};

function useCurrentSection(pathname: string) {
  for (const [prefix, info] of Object.entries(SECTION_ALIASES)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return info;
  }
  const match = NAV_ITEMS
    .filter((item) => item.href !== "/admin" && (pathname === item.href || pathname.startsWith(item.href + "/")))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match
    ? { name: match.name, href: match.href }
    : { name: "Dashboard", href: "/admin" };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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
  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-50 h-full bg-[var(--adm-chrome)] transform transition-all duration-300 ease-in-out lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
        collapsed ? "lg:w-[64px]" : "lg:w-56",
        "w-56",
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div
          className={cn(
            "flex items-center h-16",
            collapsed ? "justify-center px-2" : "justify-between px-4",
          )}
        >
          <Link href="/admin" className="flex items-center gap-2">
            {collapsed ? (
              <div className="w-8 h-8 flex items-center justify-center">
                <Image src="/favicon.png" alt="Logo" width={32} height={32} className="w-8 h-8" />
              </div>
            ) : (
              <Image
                src="/logo.png"
                alt="Ocean Blue Corporation"
                width={130}
                height={36}
                className="h-8 w-auto px-6"
                priority
              />
            )}
          </Link>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="lg:hidden p-1.5 text-[var(--adm-ink-subtle)] hover:text-[var(--adm-ink)] hover:bg-[var(--adm-row-hover)] rounded-md transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation — grouped under uppercase section headers. */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          {SECTION_ORDER.map((section, groupIdx) => {
            const items = NAV_ITEMS.filter((item) => item.section === section && hasAnyRole(item.roles));
            if (items.length === 0) return null;
            return (
              <div key={section} className={cn("space-y-0.5", groupIdx > 0 && "mt-6")}>
                {collapsed ? (
                  // In the rail, the label collapses to a hairline between groups
                  // (the first group needs none).
                  groupIdx > 0 && <div className="mx-1 mb-2 border-t border-[var(--adm-line)]" />
                ) : (
                  <p className="px-3 pb-1.5 pt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--adm-ink-subtle)]">
                    {section}
                  </p>
                )}
                {items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={collapsed ? item.name : undefined}
                      onClick={onClose}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-[8px] text-[14px] transition-colors duration-150",
                        collapsed ? "justify-center p-2.5" : "px-3 py-[9px]",
                        isActive
                          ? "bg-[var(--adm-accent-soft)] font-semibold text-[var(--adm-accent)]"
                          : "font-medium text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]",
                      )}
                    >
                      <item.icon
                        aria-hidden="true"
                        className={cn(
                          "flex-shrink-0 transition-colors",
                          collapsed ? "h-[21px] w-[21px]" : "h-[18px] w-[18px]",
                          isActive ? "text-[var(--adm-accent)]" : "text-[var(--adm-ink-subtle)] group-hover:text-[var(--adm-ink)]",
                        )}
                      />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* HR Portal link, visible to Admin and HR only */}
        {hasAnyRole([UserRole.ADMIN, UserRole.HR]) && (
          <div className="px-2 py-2">
            <a
              href="https://hr.oceanbluecorp.com"
              target="_blank"
              rel="noopener noreferrer"
              title={collapsed ? "HR Portal" : undefined}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-200",
                "text-violet-500 hover:bg-[var(--adm-row-hover)] hover:text-violet-400 active:scale-[0.98]",
                collapsed ? "justify-center p-2.5" : "px-3 py-[7px]",
              )}
            >
              <IconGroup
                aria-hidden="true"
                className={cn(
                  "flex-shrink-0",
                  collapsed ? "h-[21px] w-[21px]" : "h-[18px] w-[18px]",
                )}
              />
              {!collapsed && (
                <>
                  <span>HR Portal</span>
                  <ExternalLink className="ml-auto h-3 w-3 opacity-50" aria-hidden="true" />
                </>
              )}
            </a>
          </div>
        )}

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:block px-2 py-2">
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "w-full flex items-center gap-2.5 rounded-lg text-[13px] font-medium text-[var(--adm-ink-subtle)] hover:text-[var(--adm-ink)] hover:bg-[var(--adm-row-hover)] transition-all",
              collapsed ? "justify-center p-2.5" : "px-3 py-2",
            )}
          >
            {collapsed ? (
              <PanelLeft className="w-[18px] h-[18px]" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

function NotificationsPanel() {
  const {
    notifications, allNotifications, unreadCount, loading, open, setOpen,
    panelRef, markAllAsRead, handleClick,
  } = useNotifications();

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative p-2 text-[var(--adm-ink-mute)] hover:text-[var(--adm-ink)] hover:bg-[var(--adm-row-hover)] rounded-lg transition-colors"
      >
        <IconBell className="w-5 h-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full px-1"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute top-full right-0 mt-1.5 w-80 sm:w-96 bg-[var(--adm-surface)] rounded-[6px] border border-[var(--adm-line)] shadow-xl ring-1 ring-black/5 overflow-hidden z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--adm-surface-sunken)] border-b border-[var(--adm-line)]">
            <div>
              <h3 className="font-semibold text-[var(--adm-ink)] text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-[var(--adm-ink-mute)] mt-0.5">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[var(--adm-accent)] font-medium px-2 py-1 rounded-md hover:bg-[var(--adm-accent-soft)] transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto bg-[var(--adm-surface)]">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-[var(--adm-accent)] animate-spin" aria-label="Loading notifications" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--adm-surface-2)] flex items-center justify-center mx-auto mb-3">
                  <IconBell className="w-6 h-6 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-[var(--adm-ink-mute)]">No notifications</p>
                <p className="text-xs text-[var(--adm-ink-subtle)] mt-1">You&apos;re all caught up!</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = notificationIcons[notification.type];
                const colorClass = notificationColors[notification.type];
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleClick(notification)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3 hover:bg-[var(--adm-row-hover)] transition-colors text-left border-b border-[var(--adm-line)] last:border-0",
                      !notification.isRead ? "bg-[var(--adm-accent-soft)]" : "bg-[var(--adm-surface)]",
                    )}
                  >
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm", colorClass)}>
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm leading-tight", !notification.isRead ? "font-semibold text-[var(--adm-ink)]" : "font-medium text-[var(--adm-ink-mute)]")}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span aria-label="Unread" className="w-2 h-2 rounded-full bg-[var(--adm-accent)] flex-shrink-0 mt-1 ring-2 ring-[rgba(29,78,216,0.2)]" />
                        )}
                      </div>
                      <p className="text-xs text-[var(--adm-ink-mute)] mt-1 line-clamp-2">{notification.message}</p>
                      <p className="text-[10px] text-[var(--adm-ink-subtle)] mt-1.5 font-medium">{formatTimeAgo(notification.createdAt)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {allNotifications.length > 0 && (
            <div className="px-4 py-2.5 bg-[var(--adm-surface-sunken)] border-t border-[var(--adm-line)]">
              <Link
                href="/admin/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-[var(--adm-accent)] font-medium flex items-center justify-center gap-1"
              >
                View all notifications
                <ChevronRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UserMenu({ user, signOut }: { user: ReturnType<typeof useAuth>["user"]; signOut: () => void }) {
  const [open, setOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const badgeColor = roleBadgeColor[user?.role ?? ""] ?? "bg-sky-500/15 text-sky-600";

  // Uploaded photo if there is one, otherwise the initials Avatar used
  // everywhere else in admin. This used to fall back to a generated cartoon
  // face from api.dicebear.com — a third-party request on every admin page
  // load that leaked the user's email as a seed in the URL, and produced an
  // avatar that matched nothing else in the console.
  const photoSrc = user?.id && !avatarFailed ? `/api/users/avatar/${user.id}` : null;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center rounded-full border border-transparent p-0.5 transition-colors hover:border-[var(--adm-line)] hover:bg-[var(--adm-row-hover)]"
      >
        {photoSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={photoSrc}
            alt={user?.name ?? "User"}
            width={28}
            height={28}
            loading="lazy"
            decoding="async"
            onError={() => setAvatarFailed(true)}
            className="w-7 h-7 rounded-full object-cover bg-[var(--adm-accent-soft)] ring-2 ring-[var(--adm-surface)] shadow-sm"
          />
        ) : (
          <Avatar name={user?.name} email={user?.email} size="sm" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="User options"
          className="absolute top-full right-0 mt-2 w-60 overflow-hidden rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-xl ring-1 ring-black/5 z-50"
        >
          <div className="flex items-center gap-3 border-b border-[var(--adm-line)] px-3.5 py-3">
            {photoSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={photoSrc}
                alt={user?.name ?? "User"}
                width={36}
                height={36}
                loading="lazy"
                decoding="async"
                onError={() => setAvatarFailed(true)}
                className="h-9 w-9 flex-shrink-0 rounded-full object-cover bg-[var(--adm-surface-2)] ring-1 ring-[var(--adm-line)]"
              />
            ) : (
              <Avatar name={user?.name} email={user?.email} size="md" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--adm-ink)]">{user?.name}</p>
              <p className="truncate text-[11px] text-[var(--adm-ink-mute)]">{user?.email}</p>
            </div>
          </div>
          <div className="px-3 pt-2.5 pb-1.5">
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize", badgeColor)}>
              {user?.role}
            </span>
          </div>
          <div className="py-1" role="none">
            <Link
              href="/admin/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] transition-colors"
            >
              <IconSettings className="w-4 h-4 text-[var(--adm-ink-subtle)]" aria-hidden="true" /> Settings
            </Link>
            {(user?.role === UserRole.ADMIN || user?.role === UserRole.HR) && (
              <a
                href="https://hr.oceanbluecorp.com"
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] transition-colors"
              >
                <IconGroup className="w-4 h-4 text-violet-400" aria-hidden="true" />
                <span>HR Portal</span>
                <ExternalLink className="ml-auto h-3 w-3 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
              </a>
            )}
            {user?.role === UserRole.ADMIN && (
              <Link
                href="/admin/docs"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] transition-colors"
              >
                <IconDocs className="w-4 h-4 text-[var(--adm-ink-subtle)]" aria-hidden="true" /> Developer
              </Link>
            )}
            <Link
              href="/"
              target="_blank"
              role="menuitem"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] transition-colors"
            >
              <IconHome className="w-4 h-4 text-[var(--adm-ink-subtle)]" aria-hidden="true" /> View website
            </Link>
          </div>
          <div className="border-t border-[var(--adm-line)] py-1" role="none">
            <button
              role="menuitem"
              onClick={() => signOut()}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--adm-danger)] hover:bg-[var(--adm-danger-soft)] transition-colors"
            >
              <IconLogout className="w-4 h-4" aria-hidden="true" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AccessDenied({ userRole }: { userRole: string | null | undefined }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-[6px] bg-[var(--adm-danger-soft)]">
          <IconShield className="h-7 w-7 text-[var(--adm-danger)]" aria-hidden="true" />
        </div>
        <p className="text-base font-bold text-[var(--adm-ink)]">Access restricted</p>
        <p className="mt-1 text-sm text-[var(--adm-ink-mute)]">
          Your role ({userRole}) doesn&apos;t have access to this page. Contact an
          administrator if you think this is a mistake.
        </p>
        <Link
          href="/admin"
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[var(--adm-accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--adm-accent-strong)]"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

// ── Main layout content ────────────────────────────────────────────────────────

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage("adminSidebarCollapsed", false);
  const { user, signOut, hasAnyRole } = useAuth();
  const { openCommandPalette, pageCrumb } = useAdmin();
  const section = useCurrentSection(pathname);

  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, [setSidebarCollapsed]);

  const routeAllowed = (() => {
    if (!user?.role) return false;
    const match = Object.keys(routeAccess)
      .filter((p) => pathname === p || pathname.startsWith(p + "/"))
      .sort((a, b) => b.length - a.length)[0];
    return match ? routeAccess[match].includes(user.role) : true;
  })();

  return (
    <div
      className="adm-scope min-h-screen bg-[var(--adm-canvas)]"
      data-theme="light"
    >
      {/* Skip link */}
      <a
        href="#adm-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-[var(--adm-accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to content
      </a>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={toggleSidebarCollapse}
        pathname={pathname}
        hasAnyRole={hasAnyRole}
      />

      {/* Main content */}
      <div className={cn("transition-all duration-300 bg-[var(--adm-chrome)]", sidebarCollapsed ? "lg:pl-[64px]" : "lg:pl-56")}>
        {/* Top header */}
        {/* Command bar. Solid rather than translucent-blurred: a business
            system's top bar is a fixed piece of chrome, and blur over a dense
            scrolling grid smears the rows underneath it. */}
        <header className="sticky top-0 z-30 h-16 bg-[var(--adm-chrome)] flex items-center justify-between gap-3 px-5 lg:px-6 relative">
          <div className="flex min-w-0 items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden p-1.5 text-[var(--adm-ink-mute)] hover:text-[var(--adm-ink)] hover:bg-[var(--adm-row-hover)] rounded-md transition-colors"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* Mobile title */}
            <h1 className="sm:hidden truncate font-semibold text-[var(--adm-ink)]">
              {pathname === "/admin" ? "Dashboard" : (pageCrumb ?? section.name)}
            </h1>
          </div>

          {/* Centered search, Conduktor-style. */}
          <div className="absolute left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 px-14 sm:px-0">
            <HeaderSearch />
          </div>

          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-2.5">
            {/* Mobile search */}
            <button
              type="button"
              onClick={openCommandPalette}
              aria-label="Open search"
              className="md:hidden p-2 text-[var(--adm-ink-mute)] hover:text-[var(--adm-ink)] hover:bg-[var(--adm-row-hover)] rounded-lg transition-colors"
            >
              <Search className="w-5 h-5" aria-hidden="true" />
            </button>

            <NotificationsPanel />

            <Link
              href="/admin/help"
              title="Help & team"
              aria-label="Help and team directory"
              className="p-2 text-[var(--adm-ink-mute)] hover:text-[var(--adm-ink)] hover:bg-[var(--adm-row-hover)] rounded-lg transition-colors"
            >
              <IconHelp className="w-5 h-5" aria-hidden="true" />
            </Link>

            <div className="hidden md:block w-px h-6 bg-[var(--adm-line)] mx-1" aria-hidden="true" />

            <UserMenu user={user} signOut={signOut} />
          </div>
        </header>

        {/* Page content */}
        {/* Fixed height, not min-height, and the scroll container itself.
            `min-h` let the content grow past the viewport, so a Workspace
            panel's `flex-1` had nothing to bound it: the whole document
            scrolled and the grid's own footer — pager and rows-per-page — sat
            below the fold. With a real height the panel claims exactly what is
            left after any overview strip and scrolls its rows internally,
            while taller pages (dashboard, settings, docs) still scroll here. */}
        <main
          id="adm-main"
          className="flex h-[calc(100vh-4rem)] min-w-0 flex-col overflow-y-auto overflow-x-hidden rounded-tl-2xl bg-[var(--adm-canvas)] p-5 lg:p-6"
        >
          {routeAllowed ? children : <AccessDenied userRole={user?.role} />}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES]}>
      <AdminProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </AdminProvider>
    </ProtectedRoute>
  );
}
