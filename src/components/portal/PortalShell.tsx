"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Logo from "@/components/site/Logo";
import { canAccess, nav, roles, type Role } from "@/lib/portal/roles";
import Icon, { type IconName } from "./icons";
import { formatTimeAgo, useNotifications } from "@/hooks/use-notifications";
import { hrPortalUrl } from "@/lib/site-content";
import { useSession } from "./session";
import PortalSearch, { type PortalSearchHandle } from "./PortalSearch";
import { ChromeProvider, navItemFor, titleFor, type PortalChrome } from "./chrome";
import { useAuth } from "@/lib/auth";
import { RECRUITING_ROLES } from "@/lib/auth/config";
import { Avatar } from "./ui";
import { useDialog } from "./kit/overlay";
import { NavProgressProvider, usePortalRouter } from "./kit/NavProgress";

const NOTE_ICON: Record<string, IconName> = {
  job_posted: "briefcase",
  application_received: "inbox",
  contact_received: "contact",
  task_assigned: "clock",
  application_deleted: "trash",
};

// Links stored before the move still say /admin.
const portalLink = (link: string) => link.replace(/^\/admin\/bench\b/, "/portal/talent-bench").replace(/^\/admin\b/, "/portal");

function useOutside<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

const THEME_KEY = "portal.theme";

/** Light by default; the top-bar switch turns on the dark palette (src/styles/portal-dark.css) and remembers it here. */
function usePortalTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    try {
      if (window.localStorage.getItem(THEME_KEY) === "dark") setTheme("dark");
    } catch {}
  }, []);
  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch {}
      return next;
    });
  }, []);
  return [theme, toggle] as const;
}

// The CRM's sidebar: no collapse, a drag handle on its right edge between these widths.
const SIDEBAR_WIDTH_KEY = "portal.sidebar-width";
const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 400;
const SIDEBAR_DEFAULT = 254;
const clampWidth = (w: number) => Math.round(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, w)));

function useSidebarWidth() {
  const [width, setWidth] = useState(SIDEBAR_DEFAULT);
  useEffect(() => {
    try {
      const w = parseInt(window.localStorage.getItem(SIDEBAR_WIDTH_KEY) ?? "", 10);
      if (w >= SIDEBAR_MIN && w <= SIDEBAR_MAX) setWidth(w);
    } catch {}
  }, []);
  const save = useCallback((w: number) => {
    try {
      window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(w));
    } catch {}
  }, []);
  return [width, setWidth, save] as const;
}

/** Drag to resize, arrow keys in 10px steps, Home/End for the limits, double-click to reset. */
function SidebarResizer({ width, onWidth, onCommit }: { width: number; onWidth: (w: number) => void; onCommit: (w: number) => void }) {
  const drag = useRef<{ x: number; w: number } | null>(null);
  const last = useRef(width);
  last.current = width;
  const set = (w: number) => onWidth(clampWidth(w));
  const end = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    delete document.documentElement.dataset.sidebarResizing;
    onCommit(last.current);
  };
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      aria-valuemin={SIDEBAR_MIN}
      aria-valuemax={SIDEBAR_MAX}
      aria-valuenow={width}
      tabIndex={0}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, w: width };
        document.documentElement.dataset.sidebarResizing = "";
      }}
      onPointerMove={(e) => drag.current && set(drag.current.w + e.clientX - drag.current.x)}
      onPointerUp={end}
      onPointerCancel={end}
      onDoubleClick={() => {
        onWidth(SIDEBAR_DEFAULT);
        onCommit(SIDEBAR_DEFAULT);
      }}
      onKeyDown={(e) => {
        const next: Record<string, number> = { ArrowLeft: width - 10, ArrowRight: width + 10, Home: SIDEBAR_MIN, End: SIDEBAR_MAX };
        if (!(e.key in next)) return;
        e.preventDefault();
        const w = clampWidth(next[e.key]);
        onWidth(w);
        onCommit(w);
      }}
      className="group absolute inset-y-0 -right-1 z-10 w-2 cursor-col-resize touch-none select-none outline-none"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors duration-150 group-hover:bg-mist-300 group-focus-visible:bg-mist-500 group-active:bg-mist-500"
      />
    </div>
  );
}

function Sidebar({
  activeHref,
  dark = false,
  onNavigate,
  onClose,
}: {
  activeHref?: string;
  /** Dark theme: the white logo */
  dark?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const { role } = useSession();
  const groups = nav.map((g) => ({ ...g, items: g.items.filter((i) => canAccess(role, i.href)) })).filter((g) => g.items.length > 0);
  const labelled = groups.length > 1;

  // One nav row, as in the CRM: 30px, 14px icon; the active row is a raised pill 32px tall.
  const row = (item: { href: string; label: string; icon: IconName }) => {
    const active = item.href === activeHref;
    return (
      <li key={item.href} className={active ? "mb-0.5" : ""}>
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={`group relative flex items-center gap-1.5 rounded-lg px-2 text-adm-base font-medium transition-colors duration-150 ${
            active ? "h-8 bg-mist-0 text-navy-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-mist-200" : "h-[30px] text-mist-600 hover:text-navy-900"
          }`}
        >
          <Icon name={item.icon} className={`size-3.5 shrink-0 transition-colors duration-150 ${active ? "text-navy-900" : "text-mist-500 group-hover:text-navy-900"}`} />
          <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
        </Link>
      </li>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-mist-200 bg-mist-50">
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-mist-200 bg-mist-0 px-4">
        <Link href="/portal" onClick={onNavigate} aria-label="Portal home" className="flex min-w-0 flex-1 items-center rounded-md">
          <Logo variant={dark ? "white" : "color"} className="h-9 w-[7.6rem] object-left!" />
        </Link>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close navigation" className="grid size-[30px] place-items-center rounded-full text-navy-900 hover:bg-mist-100">
            <Icon name="x" className="size-4" />
          </button>
        )}
      </div>

      <nav id="portal-nav" aria-label="Portal" className="scroll-thin min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {groups.map((group, gi) => (
          <div key={group.title} className={`flex flex-col gap-1 p-3 ${gi < groups.length - 1 ? "border-b border-mist-200" : ""}`}>
            {labelled && gi > 0 && (
              <span className="block px-2 pb-0.5 text-adm-xs font-medium uppercase leading-none tracking-[1px] text-mist-500">{group.title}</span>
            )}
            {labelled && gi === 0 && <span className="sr-only">{group.title}</span>}
            <ul className="flex flex-col">{group.items.map((item) => row(item))}</ul>
          </div>
        ))}
      </nav>
    </div>
  );
}

/** Off-canvas nav below lg: focus trapped, Escape and the backdrop close it. */
function MobileNav({ activeHref, dark, onClose }: { activeHref?: string; dark: boolean; onClose: () => void }) {
  const ref = useDialog<HTMLDivElement>(onClose);
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div aria-hidden className="kit-fade absolute inset-0 bg-navy-950/50" onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label="Navigation" tabIndex={-1} className="kit-drawer-left relative h-full w-[254px] max-w-[85vw] shadow-xl focus:outline-none">
        <Sidebar activeHref={activeHref} dark={dark} onNavigate={onClose} onClose={onClose} />
      </div>
    </div>
  );
}

export default function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <NavProgressProvider>
      <Shell>{children}</Shell>
    </NavProgressProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { user, role, realRole, setRole, signOut } = useSession();
  const pathname = usePathname();
  const router = usePortalRouter();
  const [sidebarWidth, setSidebarWidth, saveSidebarWidth] = useSidebarWidth();
  const [theme, toggleTheme] = usePortalTheme();
  const notes = useNotifications();
  // Search answers RECRUITING_ROLES only (requireStaff on /api/admin/search).
  const canSearch = useAuth().hasAnyRole(RECRUITING_ROLES);
  const [mobileNav, setMobileNav] = useState(false);
  const [menu, setMenu] = useState<null | "role" | "bell" | "user">(null);
  const [viewAs, setViewAs] = useState(false);
  const close = () => {
    setMenu(null);
    setViewAs(false);
  };
  const bellRef = useOutside<HTMLDivElement>(menu === "bell", close);
  const userRef = useOutside<HTMLDivElement>(menu === "user", close);
  const search = useRef<PortalSearchHandle>(null);
  const [navSection, setNavSection] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const canHr = realRole === "admin" || realRole === "hr";

  const openSearch = useCallback(() => search.current?.focus(), []);
  const sectionTitle = titleFor(pathname);
  const chrome = useMemo<PortalChrome>(() => ({ openSearch, setNavSection, sectionTitle }), [openSearch, sectionTitle]);
  const activeHref = navSection ?? navItemFor(pathname)?.href;

  useEffect(() => {
    setMobileNav(false);
    setMenu(null);
  }, [pathname]);

  const closeMobileNav = useCallback(() => setMobileNav(false), []);

  return (
    <ChromeProvider value={chrome}>
    <div data-portal-shell data-theme={theme} className="min-h-svh bg-mist-50" style={{ "--sidebar-width": `${sidebarWidth}px` } as React.CSSProperties}>
      <a
        href="#portal-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-ocean-600 focus:px-3 focus:py-2 focus:text-adm-base focus:font-medium focus:text-white"
      >
        Skip to content
      </a>

      {/* Desktop sidebar, resizable from its right edge as in the CRM */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-width)] lg:block">
        <Sidebar activeHref={activeHref} dark={theme === "dark"} />
        <SidebarResizer width={sidebarWidth} onWidth={setSidebarWidth} onCommit={saveSidebarWidth} />
      </aside>

      {mobileNav && <MobileNav activeHref={activeHref} dark={theme === "dark"} onClose={closeMobileNav} />}

      <div className="flex min-h-svh min-w-0 flex-col lg:pl-[var(--sidebar-width)]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-mist-200 bg-mist-0 px-4">
          <button
            type="button"
            onClick={() => setMobileNav(true)}
            aria-label="Open navigation"
            aria-expanded={mobileNav}
            className={`${PILL} size-8 lg:hidden`}
          >
            <Icon name="menu" className="size-4" />
          </button>
          {/* The section's name, as the CRM's header names its page; the page's own h1 carries the semantics */}
          <p className="min-w-0 truncate text-adm-md font-medium leading-none text-navy-900">{sectionTitle}</p>

          <div className="ml-auto flex items-center gap-2">
            {canSearch && <PortalSearch ref={search} />}
            {/* Only while an admin previews another role: says so, and one click returns */}
            {realRole === "admin" && role !== realRole && (
              <button
                type="button"
                onClick={() => setRole(realRole)}
                title="Back to your own view"
                className="hidden h-8 items-center gap-1.5 rounded-full bg-status-warning-soft pl-3 pr-2 text-adm-base font-medium text-status-warning ring-1 ring-inset ring-status-warning-line hover:bg-status-warning-hover sm:inline-flex"
              >
                Previewing as {roles[role].label}
                <Icon name="x" className="size-3.5" />
              </button>
            )}

            {/* Notifications */}
            <div ref={bellRef} className="relative">
              <button
                type="button"
                onClick={() => setMenu(menu === "bell" ? null : "bell")}
                aria-label={`Notifications, ${notes.unreadCount} unread`}
                aria-expanded={menu === "bell"}
                className={`${PILL} relative size-8`}
              >
                <Icon name="bell" className="size-4" />
                {notes.unreadCount > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-status-danger-mark ring-2 ring-mist-0" />}
              </button>
              {menu === "bell" && (
                <div className="absolute right-0 top-10 w-80 overflow-hidden rounded-xl bg-mist-0 shadow-[0_12px_32px_rgba(15,23,42,0.12)] ring-1 ring-mist-200">
                  <div className="flex items-center justify-between border-b border-mist-200 px-4 py-3">
                    <p className="text-adm-base font-semibold">Notifications</p>
                    {notes.unreadCount > 0 && (
                      <button type="button" onClick={() => void notes.markAllAsRead()} className="text-adm-base font-medium text-ocean-700 hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <ul className="max-h-80 overflow-y-auto py-1">
                    {notes.notifications.length === 0 && (
                      <li className="px-4 py-6 text-center text-adm-base text-mist-600">{notes.loading ? "Loading…" : "You're all caught up."}</li>
                    )}
                    {notes.notifications.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (!n.isRead) void notes.markAsRead(n.id);
                            close();
                            if (n.link) router.push(portalLink(n.link));
                          }}
                          className="flex w-full gap-3 px-4 py-3 text-left hover:bg-mist-50"
                        >
                          <Icon name={NOTE_ICON[n.type] ?? "bell"} className="mt-0.5 size-4 shrink-0 text-mist-600" />
                          <span className="flex-1">
                            <span className="block text-adm-base font-medium text-navy-900">{n.title}</span>
                            <span className="block text-adm-base text-mist-700">{n.message}</span>
                            <span className="block text-adm-xs text-mist-600">{formatTimeAgo(n.createdAt)}</span>
                          </span>
                          {!n.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-ocean-600" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <Link href="/portal/notifications" className="block border-t border-mist-200 px-4 py-3 text-center text-adm-base font-medium text-ocean-700 hover:bg-mist-50">
                    See all notifications
                  </Link>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              title={theme === "dark" ? "Light theme" : "Dark theme"}
              className={`${PILL} size-8`}
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} className="size-4" />
            </button>

            <Link href="/portal/help" aria-label="Help and team directory" title="Help and team directory" className={`${PILL} size-8`}>
              <Icon name="help" className="size-4" />
            </Link>

            {/* User menu */}
            <div ref={userRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setViewAs(false);
                  setMenu(menu === "user" ? null : "user");
                }}
                aria-expanded={menu === "user"}
                aria-label="Account menu"
                className={`${PILL} h-8 gap-2 pl-1 pr-1 text-adm-xs sm:pr-2.5 ${menu === "user" ? "bg-mist-50" : ""}`}
              >
                <UserAvatar id={user.id} name={user.name} failed={avatarFailed} onFail={() => setAvatarFailed(true)} small />
                <span className="hidden max-w-36 truncate sm:inline">{user.name}</span>
                <Icon name="chevronDown" className={`hidden size-3.5 text-mist-500 transition-transform sm:block ${menu === "user" ? "rotate-180" : ""}`} />
              </button>
              {menu === "user" && (
                <div className="absolute right-0 top-10 w-64 rounded-xl bg-mist-0 p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.12)] ring-1 ring-mist-200">
                  <div className="flex items-center gap-2.5 px-2 pb-2 pt-1.5">
                    <UserAvatar id={user.id} name={user.name} failed={avatarFailed} onFail={() => setAvatarFailed(true)} />
                    <div className="min-w-0">
                      <p className="truncate text-adm-base font-medium leading-tight text-navy-900">{user.name}</p>
                      <p className="truncate text-adm-xs text-mist-600">{roles[realRole].label} · {user.email}</p>
                    </div>
                  </div>
                  <div className="-mx-1.5 my-1 h-px bg-mist-200" />
                  <MenuItem href="/portal/settings" icon="settings" label="Account settings" onClick={close} />
                  {canHr && <MenuItem href={hrPortalUrl("portal")} icon="idBadge" label="HR portal" external onClick={close} />}

                  {/* Admins can preview another role's view; the API still answers as admin.
                      One row here; the roles open in a flyout beside the menu (below it on phones). */}
                  {realRole === "admin" && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setViewAs((v) => !v)}
                        aria-expanded={viewAs}
                        aria-haspopup="true"
                        className={`${ROW} w-full ${viewAs ? "bg-mist-100" : ""}`}
                      >
                        <Icon name="eye" className="size-4 shrink-0 text-mist-500" />
                        View portal as
                        <span className="ml-auto text-adm-xs text-mist-600">{roles[role].label}</span>
                        <Icon name="chevronRight" className={`size-3.5 text-mist-500 transition-transform max-sm:rotate-90 ${viewAs ? "sm:rotate-180" : ""}`} />
                      </button>
                      {viewAs && (
                        <div
                          role="radiogroup"
                          aria-label="View portal as"
                          className="mt-1 grid gap-0.5 rounded-lg bg-mist-50 p-1 sm:absolute sm:right-full sm:top-0 sm:mr-2 sm:mt-0 sm:max-h-[calc(100svh-8rem)] sm:w-48 sm:overflow-y-auto sm:rounded-xl sm:bg-mist-0 sm:p-1.5 sm:shadow-[0_12px_32px_rgba(15,23,42,0.12)] sm:ring-1 sm:ring-mist-200"
                        >
                          <p className="hidden px-2 pb-1 pt-1 text-adm-xs text-mist-600 sm:block">Preview the portal as</p>
                          {(Object.keys(roles) as Role[]).map((r) => (
                            <button
                              key={r}
                              type="button"
                              role="radio"
                              aria-checked={r === role}
                              onClick={() => {
                                setRole(r);
                                close();
                              }}
                              title={roles[r].description}
                              className={`${ROW} w-full text-left ${r === role ? "bg-mist-100" : ""}`}
                            >
                              <span className={`grid size-3.5 shrink-0 place-items-center rounded-full ${r === role ? "bg-ocean-600" : "ring-1 ring-inset ring-mist-400"}`}>
                                {r === role && <span className="size-1.5 rounded-full bg-white" />}
                              </span>
                              <span className="text-adm-base text-navy-900">{roles[r].label}</span>
                              {r === realRole && <span className="ml-auto text-adm-xs text-mist-600">You</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="-mx-1.5 my-1 h-px bg-mist-200" />
                  <button
                    type="button"
                    onClick={signOut}
                    className={`${ROW} w-full text-status-danger hover:bg-status-danger-soft`}
                  >
                    <Icon name="logout" className="size-4 shrink-0" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* The one gutter: pages never pad themselves (see portal README) */}
        <main id="portal-main" tabIndex={-1} data-portal className="flex min-w-0 flex-1 flex-col p-5 focus:outline-none sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
    </ChromeProvider>
  );
}

/** The uploaded photo (Settings, Profile) when there is one, initials otherwise. */
function UserAvatar({ id, name, failed, onFail, small }: { id: string; name: string; failed: boolean; onFail: () => void; small?: boolean }) {
  const size = small ? "size-6" : "size-8";
  if (failed || !id) {
    return (
      <span aria-hidden className={`grid ${size} shrink-0 place-items-center rounded-full bg-ocean-100 text-adm-xs font-semibold leading-none text-ocean-800 ring-1 ring-inset ring-ocean-200`}>
        {name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/api/users/avatar/${id}`} alt="" onError={onFail} className={`${size} shrink-0 rounded-full object-cover ring-1 ring-mist-200`} />
  );
}

// A menu row: 32px, 16px muted icon, the hover wash every portal menu uses.
const ROW = "flex h-8 items-center gap-2 rounded-lg px-2 text-adm-base text-navy-900 transition-colors hover:bg-mist-100";

// The CRM's secondary pill: white, hairline edge, soft lift; every header control uses it.
const PILL =
  "inline-flex shrink-0 items-center justify-center rounded-full bg-mist-0 font-medium text-navy-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-mist-200 transition-colors duration-150 hover:bg-mist-50";

/** Account menu row: icon, label, and an arrow when it leaves the portal */
function MenuItem({ href, icon, label, external, onClick }: { href: string; icon: IconName; label: string; external?: boolean; onClick?: () => void }) {
  const cls = ROW;
  const body = (
    <>
      <Icon name={icon} className="size-4 shrink-0 text-mist-500" />
      {label}
      {external && <Icon name="external" className="ml-auto size-3.5 text-mist-500" />}
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener" onClick={onClick} className={cls}>
      {body}
    </a>
  ) : (
    <Link href={href} onClick={onClick} className={cls}>
      {body}
    </Link>
  );
}
