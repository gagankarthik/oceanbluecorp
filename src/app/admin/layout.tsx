"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronRight, Search, PanelLeft, ExternalLink } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  useAuth, UserRole, routeAccess, PUBLISHING_ROLES, RECRUITING_ROLES, landingRouteFor,
} from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AdminProvider, useAdmin } from "@/components/admin/admin-provider";
import { HeaderSearch } from "@/components/admin/header-search";
import { Avatar } from "@/components/admin/avatar";
import {
  IconOverview, IconRequisition, IconApplication, IconBench, IconResume,
  IconContact, IconClient, IconVendor, IconContent, IconStaff,
  IconBell, IconHelp, IconSettings, IconDocs,
  IconHome, IconHrPortal, IconLogout, IconShield,
  IconBook, IconChart, IconQuote, IconNews,
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
  { name: "Job Postings", href: "/admin/jobs",         icon: IconRequisition,  roles: [...ALL_ROLES, UserRole.MEDIA], section: "Recruiting" },
  { name: "Applications", href: "/admin/applications", icon: IconApplication,  roles: ALL_ROLES, section: "Recruiting" },
  { name: "Talent Bench", href: "/admin/bench",        icon: IconBench,        roles: ALL_ROLES, section: "Recruiting" },
  { name: "Resumes",      href: "/admin/resumes",      icon: IconResume,       roles: ALL_ROLES, section: "Recruiting" },
  { name: "Contacts",     href: "/admin/contacts",     icon: IconContact,      roles: [UserRole.ADMIN, UserRole.HR], section: "Relationships" },
  { name: "Clients",      href: "/admin/clients",      icon: IconClient,       roles: [UserRole.ADMIN, UserRole.HR], section: "Relationships" },
  { name: "Vendors",      href: "/admin/vendors",      icon: IconVendor,       roles: [UserRole.ADMIN, UserRole.HR], section: "Relationships" },
  // PUBLISHING_ROLES is the same constant routeAccess and requirePublisher use.
  { name: "Blog",             href: "/admin/blog",             icon: IconBook,    roles: PUBLISHING_ROLES, section: "Publishing" },
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
  "inline-flex h-9 w-9 items-center justify-center rounded-[8px] text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]";

// ── Sidebar ────────────────────────────────────────────────────────────────────

function Sidebar({
  open,
  collapsed,
  onClose,
  pathname,
  hasAnyRole,
}: {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  pathname: string;
  hasAnyRole: (roles: UserRole[]) => boolean;
}) {
  // The mobile drawer always renders expanded.
  const rail = collapsed;

  return (
    <aside
      className={cn(
        "adm-nav fixed inset-y-0 left-0 z-50 flex w-[256px] flex-col border-r border-[var(--adm-nav-line)] bg-[var(--adm-nav-bg)] transition-[transform,width] duration-200 ease-[var(--adm-ease)] lg:translate-x-0",
        open ? "translate-x-0 shadow-[var(--adm-shadow-lg)] lg:shadow-none" : "-translate-x-full",
        rail ? "lg:w-[64px]" : "lg:w-[240px]",
      )}
      aria-label="Sidebar"
    >
      <div className={cn("flex h-[60px] flex-none items-center gap-2 border-b border-[var(--adm-nav-line)] px-4", rail && "lg:justify-center lg:px-0")}>
        <Link
          href="/admin"
          aria-label="Ocean Blue, dashboard"
          title="Ocean Blue"
          className="flex min-w-0 items-center rounded-[8px] p-1 transition-opacity hover:opacity-80"
        >
          {/* Full wordmark when expanded (and in the mobile drawer); the mark alone in the rail. */}
          <Image
            src="/logo.webp"
            alt="Ocean Blue"
            width={256}
            height={70}
            priority
            className={cn("h-9 w-auto max-w-full object-contain", rail && "lg:hidden")}
          />
          <Image
            src="/favicon.png"
            alt="Ocean Blue"
            width={80}
            height={76}
            className={cn("hidden h-8 w-auto object-contain", rail && "lg:block")}
          />
        </Link>
        <button onClick={onClose} aria-label="Close navigation" className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-[8px] text-[var(--adm-nav-mute)] transition-colors hover:bg-[var(--adm-nav-hover)] hover:text-white lg:hidden">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <nav className="adm-scroll-hidden flex-1 overflow-y-auto px-2.5 py-3" aria-label="Main navigation">
        {SECTION_ORDER.map((section, groupIdx) => {
          const items = NAV_ITEMS.filter((item) => item.section === section && hasAnyRole(item.roles));
          if (items.length === 0) return null;
          return (
            <div key={section} className={cn(groupIdx > 0 && "mt-4")}>
              <p className={cn("px-2.5 pb-1.5 text-[12px] font-medium text-[var(--adm-nav-subtle)]", rail && "lg:hidden")}>
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
                          "group relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14px] transition-colors",
                          rail && "lg:justify-center lg:px-0",
                          active
                            ? "bg-[var(--adm-nav-active)] font-semibold text-[var(--adm-nav-active-ink)] before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-r-full before:bg-[var(--adm-nav-active-icon)]"
                            : "font-medium text-[var(--adm-nav-mute)] hover:bg-[var(--adm-nav-hover)] hover:text-[var(--adm-nav-ink)]",
                        )}
                      >
                        <item.icon
                          aria-hidden="true"
                          className={cn(
                            "h-5 w-5 flex-none transition-colors",
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

  const item =
    "flex w-full items-center gap-2.5 rounded-[6px] px-2 py-1.5 text-[13px] text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "ml-1 flex items-center rounded-full p-0.5 transition-shadow hover:ring-2 hover:ring-[var(--adm-line)]",
          open && "ring-2 ring-[var(--adm-focus-ring)]",
        )}
      >
        {avatar("sm")}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-pop)]"
        >
          <div className="flex items-center gap-2.5 border-b border-[var(--adm-line)] px-3 py-3">
            {avatar("md")}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-[var(--adm-ink)]">{user?.name}</p>
              <p className="truncate text-[12px] text-[var(--adm-ink-subtle)]">{user?.email}</p>
            </div>
            <span className="flex-none rounded-[6px] bg-[var(--adm-accent-soft)] px-1.5 py-0.5 text-[11.5px] font-medium text-[var(--adm-accent)]">
              {role}
            </span>
          </div>
          <div className="p-1" role="none">
            <Link href="/admin/settings" role="menuitem" onClick={close} className={item}>
              <IconSettings className="h-4 w-4 text-[var(--adm-ink-subtle)]" aria-hidden="true" /> Settings
            </Link>
            {canHr && (
              <a href="https://hr.oceanbluecorp.com" target="_blank" rel="noopener noreferrer" role="menuitem" onClick={close} className={item}>
                <IconHrPortal className="h-4 w-4 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                HR Portal
                <ExternalLink className="ml-auto h-3 w-3 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
              </a>
            )}
            {user?.role === UserRole.ADMIN && (
              <Link href="/admin/docs" role="menuitem" onClick={close} className={item}>
                <IconDocs className="h-4 w-4 text-[var(--adm-ink-subtle)]" aria-hidden="true" /> Developer
              </Link>
            )}
            <a href="/" target="_blank" rel="noopener noreferrer" role="menuitem" onClick={close} className={item}>
              <IconHome className="h-4 w-4 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
              View website
              <ExternalLink className="ml-auto h-3 w-3 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
            </a>
          </div>
          <div className="border-t border-[var(--adm-line)] p-1" role="none">
            <button
              role="menuitem"
              onClick={() => signOut()}
              className="flex w-full items-center gap-2.5 rounded-[6px] px-2 py-1.5 text-[13px] text-[var(--adm-danger-ink)] transition-colors hover:bg-[var(--adm-danger-soft)]"
            >
              <IconLogout className="h-4 w-4" aria-hidden="true" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Notifications ──────────────────────────────────────────────────────────────

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
        className={cn(iconButton, "relative", open && "bg-[var(--adm-chrome-hover)] text-[var(--adm-ink)]")}
      >
        <IconBell className="h-[18px] w-[18px]" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--adm-danger)] px-1 text-[10.5px] font-semibold tabular-nums text-white ring-2 ring-[var(--adm-surface)]"
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
            "z-50 flex flex-col overflow-hidden rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-pop)]",
            // Phones: a sheet under the top bar. From sm: a popover anchored to the bell.
            "fixed inset-x-3 top-[64px] max-h-[calc(100dvh-80px)]",
            "sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-[min(30rem,calc(100dvh-6rem))] sm:w-[22rem]",
          )}
        >
          <div className="flex flex-none items-center justify-between gap-3 border-b border-[var(--adm-line-soft)] px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <h3 className="text-[13.5px] font-semibold text-[var(--adm-ink)]">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[var(--adm-accent-soft)] px-1.5 py-px text-[11.5px] font-semibold tabular-nums text-[var(--adm-accent)]">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="rounded-[6px] px-1.5 py-1 text-[12px] font-medium text-[var(--adm-accent)] transition-colors hover:bg-[var(--adm-accent-tint)]"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="space-y-3 p-3.5" aria-label="Loading notifications">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="mt-0.5 h-4 w-4 animate-pulse rounded bg-[var(--adm-surface-2)]" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--adm-surface-2)]" />
                      <div className="h-3 w-full animate-pulse rounded bg-[var(--adm-surface-2)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <IconBell className="mx-auto h-5 w-5 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                <p className="mt-2 text-[13px] font-medium text-[var(--adm-ink)]">You&apos;re up to date</p>
                <p className="mt-0.5 text-[12px] text-[var(--adm-ink-subtle)]">New jobs, applications and enquiries appear here.</p>
              </div>
            ) : (
              <ul>
                {notifications.slice(0, 6).map((n) => {
                  const Icon = NOTIFICATION_ICONS[n.type];
                  return (
                    <li key={n.id} className="border-b border-[var(--adm-line-soft)] last:border-0">
                      <button
                        onClick={() => handleClick(n)}
                        className={cn(
                          "flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-[var(--adm-row-hover)]",
                          !n.isRead && "bg-[var(--adm-accent-tint)]",
                        )}
                      >
                        <Icon
                          aria-hidden="true"
                          className={cn("mt-0.5 h-4 w-4 flex-none", n.isRead ? "text-[var(--adm-ink-subtle)]" : "text-[var(--adm-accent)]")}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className={cn("truncate text-[13px]", n.isRead ? "text-[var(--adm-ink-mute)]" : "font-semibold text-[var(--adm-ink)]")}>
                              {n.title}
                            </span>
                            <span className="flex-none text-[11.5px] tabular-nums text-[var(--adm-ink-subtle)]">{formatTimeAgo(n.createdAt)}</span>
                          </span>
                          <span className="mt-0.5 block truncate text-[12.5px] text-[var(--adm-ink-subtle)]">{n.message}</span>
                        </span>
                        {!n.isRead && <span className="sr-only">Unread</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {allNotifications.length > 0 && (
            <Link
              href="/admin/notifications"
              onClick={() => setOpen(false)}
              className="flex flex-none items-center justify-center gap-1 border-t border-[var(--adm-line-soft)] px-3.5 py-2 text-[12.5px] font-medium text-[var(--adm-accent)] transition-colors hover:bg-[var(--adm-row-hover)]"
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
        <p className="mt-3 text-[15px] font-semibold text-[var(--adm-ink)]">Access restricted</p>
        <p className="mt-1 text-[13.5px] text-[var(--adm-ink-mute)]">
          Your role ({userRole ?? "none"}) can&apos;t open this page. Ask an administrator if you need access.
        </p>
        <Link
          href={home}
          className="mt-5 inline-flex h-8 items-center rounded-[8px] bg-[var(--adm-accent)] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[var(--adm-accent-strong)]"
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
  const narrowViewport = useMediaQuery("(max-width: 1439.98px)");
  const sidebarCollapsed = storedCollapsed ?? narrowViewport;
  const { user, signOut, hasAnyRole } = useAuth();
  const { openCommandPalette, pageCrumb } = useAdmin();
  const section = currentSection(pathname);

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

  return (
    <div className="adm-scope min-h-screen bg-[var(--adm-canvas)]" data-theme="light">
      <a
        href="#adm-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-[8px] focus:bg-[var(--adm-accent)] focus:px-3 focus:py-2 focus:text-[13px] focus:font-medium focus:text-white"
      >
        Skip to content
      </a>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        pathname={pathname}
        hasAnyRole={hasAnyRole}
      />

      <div
        className={cn(
          "transition-[padding] duration-200 ease-[var(--adm-ease)]",
          sidebarCollapsed ? "lg:pl-[64px]" : "lg:pl-[240px]",
        )}
      >
        {/* Three columns so the search sits on the true centre of the pane. */}
        <header className="sticky top-0 z-30 grid h-[60px] grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-[var(--adm-line)] bg-[var(--adm-surface)] px-3 sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-1">
            <button onClick={() => setSidebarOpen(true)} aria-label="Open navigation" className={cn(iconButton, "lg:hidden")}>
              <Menu className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
            <button
              onClick={toggleSidebarCollapse}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn(iconButton, "hidden lg:inline-flex")}
            >
              <PanelLeft className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
            <h1 className="ml-1 truncate text-[14px] font-semibold text-[var(--adm-ink)] md:hidden">{title}</h1>
          </div>

          <div className="flex justify-center">
            {canSearch && <HeaderSearch />}
          </div>

          <div className="flex items-center justify-end gap-1">
            {canSearch && (
              <button type="button" onClick={openCommandPalette} aria-label="Open search" className={cn(iconButton, "md:hidden")}>
                <Search className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            )}
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
          className="flex h-[calc(100dvh-60px)] min-w-0 flex-col overflow-y-auto overflow-x-hidden bg-[var(--adm-canvas)] p-4 sm:p-5 lg:p-6"
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
