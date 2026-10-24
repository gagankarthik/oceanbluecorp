"use client";

import Link from "next/link";
import Logo from "@/components/site/Logo";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
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
    const flip = () =>
      setTheme((t) => {
        const next = t === "dark" ? "light" : "dark";
        try {
          window.localStorage.setItem(THEME_KEY, next);
        } catch {}
        return next;
      });
    // Crossfade the whole page between palettes (styles in globals.css); a plain swap otherwise.
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) doc.startViewTransition(() => flushSync(flip));
    else flip();
  }, []);
  return [theme, toggle] as const;
}

// Plane's sidebar: drag its right edge between these widths; the top-bar toggle hides it.
const SIDEBAR_WIDTH_KEY = "portal.sidebar-width";
const SIDEBAR_HIDDEN_KEY = "portal.sidebar-hidden";
const SIDEBAR_MIN = 220;
const SIDEBAR_MAX = 350;
const SIDEBAR_DEFAULT = 250;
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

function useSidebarHidden() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try {
      if (window.localStorage.getItem(SIDEBAR_HIDDEN_KEY) === "1") setHidden(true);
    } catch {}
  }, []);
  const toggle = useCallback(() => {
    setHidden((h) => {
      try {
        window.localStorage.setItem(SIDEBAR_HIDDEN_KEY, h ? "0" : "1");
      } catch {}
      return !h;
    });
  }, []);
  return [hidden, toggle] as const;
}

const GROUPS_KEY = "portal.nav-closed";

/** Sidebar sections the viewer folded, remembered per browser. */
function useClosedGroups() {
  const [closed, setClosed] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const v = JSON.parse(window.localStorage.getItem(GROUPS_KEY) ?? "[]");
      if (Array.isArray(v)) setClosed(new Set(v.filter((x) => typeof x === "string")));
    } catch {}
  }, []);
  const toggle = (title: string) =>
    setClosed((c) => {
      const n = new Set(c);
      if (n.has(title)) n.delete(title);
      else n.add(title);
      try {
        window.localStorage.setItem(GROUPS_KEY, JSON.stringify([...n]));
      } catch {}
      return n;
    });
  return [closed, toggle] as const;
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
      className="group absolute inset-y-0 -right-[3px] z-10 w-1.5 cursor-ew-resize touch-none select-none outline-none"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-transparent transition-colors duration-150 group-hover:bg-mist-300 group-focus-visible:bg-ocean-600 group-active:bg-ocean-600"
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
  /** Dark palette: the white logo */
  dark?: boolean;
  onNavigate?: () => void;
  /** Phones: the drawer's close button */
  onClose?: () => void;
}) {
  const { role } = useSession();
  const groups = nav.map((g) => ({ ...g, items: g.items.filter((i) => canAccess(role, i.href)) })).filter((g) => g.items.length > 0);
  const labelled = groups.length > 1;
  const [closed, toggleGroup] = useClosedGroups();

  // One nav row, as in Plane: 28px, 16px icon, a quiet fill on the current page.
  const row = (item: { href: string; label: string; icon: IconName }) => {
    const active = item.href === activeHref;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={`group flex h-8 items-center gap-2 rounded-md px-2 text-adm-base font-medium transition-colors duration-150 ${
            active ? "bg-mist-0 text-navy-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-mist-200" : "text-mist-700 hover:bg-mist-0/60 hover:text-navy-900"
          }`}
        >
          <Icon name={item.icon} className={`size-4 shrink-0 ${active ? "text-ocean-600" : "text-mist-500 group-hover:text-navy-900"}`} />
          <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
        </Link>
      </li>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-shell">
      {/* The canvas grey: the nav recedes, the white work area beside it carries the focus */}
      {onClose && (
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-mist-200 px-3">
          <WorkspaceMark dark={dark} onNavigate={onNavigate} />
          <button type="button" onClick={onClose} aria-label="Close navigation" className={ICON_BTN}>
            <Icon name="x" className="size-4" />
          </button>
        </div>
      )}

      <nav id="portal-nav" aria-label="Portal" className="scroll-thin flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden p-3">
        {groups.map((group) => {
          const open = !labelled || !closed.has(group.title);
          return (
            <div key={group.title}>
              {labelled && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  aria-expanded={open}
                  className="group/head flex h-7 w-full items-center gap-1 rounded-md px-2 text-left text-adm-xs font-semibold text-mist-600 hover:text-navy-900"
                >
                  {group.title}
                  <Icon
                    name="chevronDown"
                    className={`size-3.5 transition-[transform,opacity] group-hover/head:opacity-100 group-focus-visible/head:opacity-100 ${open ? "opacity-0" : "-rotate-90 opacity-100"}`}
                  />
                </button>
              )}
              <div className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <ul inert={!open} className="flex min-h-0 flex-col gap-0.5 overflow-hidden">{group.items.map((item) => row(item))}</ul>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="flex h-12 shrink-0 items-center border-t border-mist-200 px-3">
        <Link href="/portal/help" onClick={onNavigate} className="flex h-7 items-center gap-2 rounded-md px-2 text-adm-base font-medium text-mist-700 hover:bg-mist-100 hover:text-navy-900">
          <Icon name="help" className="size-4 text-mist-500" />
          Help
        </Link>
      </div>
    </div>
  );
}

/** The brand, top left as Plane places its workspace: the full logo, white on the dark palette. */
function WorkspaceMark({ dark = false, onNavigate }: { dark?: boolean; onNavigate?: () => void }) {
  return (
    <Link href="/portal" onClick={onNavigate} aria-label="Portal home" className="flex h-9 shrink-0 items-center rounded-md px-1.5 hover:bg-mist-100">
      <Logo variant={dark ? "white" : "color"} className="h-8 w-[7.2rem]" />
    </Link>
  );
}

/** Off-canvas nav below lg: focus trapped, Escape and the backdrop close it. */
function MobileNav({ activeHref, dark, onClose }: { activeHref?: string; dark: boolean; onClose: () => void }) {
  const ref = useDialog<HTMLDivElement>(onClose);
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div aria-hidden className="kit-fade absolute inset-0 bg-navy-950/50" onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label="Navigation" tabIndex={-1} className="kit-drawer-left relative h-full w-[250px] max-w-[85vw] shadow-xl focus:outline-none">
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
  const [sidebarHidden, toggleSidebar] = useSidebarHidden();
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
  const userTrigger = useRef<HTMLButtonElement>(null);
  const search = useRef<PortalSearchHandle>(null);
  const [navSection, setNavSection] = useState<string | null>(null);
  const [noteTab, setNoteTab] = useState<"all" | "unread">("all");
  const shownNotes = noteTab === "unread" ? notes.notifications.filter((n) => !n.isRead) : notes.notifications;
  const [avatarFailed, setAvatarFailed] = useState(false);
  const canHr = realRole === "admin" || realRole === "hr";

  const openSearch = useCallback(() => search.current?.focus(), []);
  const sectionTitle = titleFor(pathname);
  const chrome = useMemo<PortalChrome>(() => ({ openSearch, setNavSection, sectionTitle }), [openSearch, sectionTitle]);
  const activeHref = navSection ?? navItemFor(pathname)?.href;

  // <main> is the scroller, so a new page starts at its top (the window never scrolls).
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    setMobileNav(false);
    setMenu(null);
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  const closeMobileNav = useCallback(() => setMobileNav(false), []);

  return (
    <ChromeProvider value={chrome}>
    <div data-portal-shell data-theme={theme} className="flex h-svh flex-col overflow-hidden bg-shell" style={{ "--sidebar-width": `${sidebarWidth}px` } as React.CSSProperties}>
      <a
        href="#portal-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-ocean-600 focus:px-3 focus:py-2 focus:text-adm-base focus:font-medium focus:text-white"
      >
        Skip to content
      </a>

      {mobileNav && <MobileNav activeHref={activeHref} dark={theme === "dark"} onClose={closeMobileNav} />}

      {/* Top bar on the canvas, as in Plane: workspace left, search centred, account right */}
      <header className="relative z-30 grid h-13 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 bg-shell px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-1">
          <button type="button" onClick={() => setMobileNav(true)} aria-label="Open navigation" aria-expanded={mobileNav} className={`${ICON_BTN} lg:hidden`}>
            <Icon name="menu" className="size-4" />
          </button>
          <WorkspaceMark dark={theme === "dark"} />
          {/* The one sidebar toggle, always here on desktop; the icon says which way it goes */}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
            aria-expanded={!sidebarHidden}
            aria-controls="portal-nav"
            title={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
            className={`${ICON_BTN} hidden text-mist-600 hover:text-navy-900 lg:grid`}
          >
            <Icon name={sidebarHidden ? "sidebarOpen" : "sidebarClose"} className="size-4" />
          </button>
        </div>

        <div className="flex justify-center">{canSearch && <PortalSearch ref={search} />}</div>

        {/* Same 20px from the edge as the logo opposite, so neither end sits on the window frame */}
        <div className="flex min-w-0 items-center justify-end gap-2">
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
                className={`${ICON_BTN} relative`}
              >
                <Icon name="bell" className="size-4" />
                {notes.unreadCount > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-status-danger-mark ring-2 ring-shell" />}
              </button>
              {menu === "bell" && (
                <div role="dialog" aria-label="Notifications" className="kit-pop absolute right-0 top-10 flex max-h-[min(34rem,calc(100svh-4rem))] w-[22rem] max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-lg border border-mist-200 bg-mist-0 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
                  <div className="flex h-11 shrink-0 items-center gap-2 px-4">
                    <p className="text-adm-base font-semibold text-navy-900">Notifications</p>
                    {notes.unreadCount > 0 && (
                      <span className="rounded-full bg-ocean-50 px-1.5 py-0.5 text-adm-xs font-semibold leading-none tabular-nums text-ocean-700">{notes.unreadCount}</span>
                    )}
                    <span className="ml-auto flex items-center gap-0.5">
                      {notes.unreadCount > 0 && (
                        <button type="button" onClick={() => void notes.markAllAsRead()} aria-label="Mark all as read" title="Mark all as read" className={SMALL_ICON_BTN}>
                          <Icon name="checkAll" className="size-4" />
                        </button>
                      )}
                      <Link href="/portal/notifications" onClick={close} aria-label="Open all notifications" title="Open all notifications" className={SMALL_ICON_BTN}>
                        <Icon name="expand" className="size-3.5" />
                      </Link>
                    </span>
                  </div>
                  <div role="tablist" aria-label="Show" className="flex shrink-0 gap-4 border-b border-mist-200 px-4">
                    {(["all", "unread"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="tab"
                        aria-selected={noteTab === t}
                        onClick={() => setNoteTab(t)}
                        className={`-mb-px h-9 border-b-2 text-adm-xs font-medium transition-colors duration-150 ${noteTab === t ? "border-ocean-600 font-semibold text-navy-900" : "border-transparent text-mist-600 hover:text-navy-900"}`}
                      >
                        {t === "all" ? "All" : "Unread"}
                      </button>
                    ))}
                  </div>
                  <ul className="scroll-thin min-h-0 flex-1 divide-y divide-mist-100 overflow-y-auto">
                    {shownNotes.length === 0 && (
                      <li className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                        <span className="grid size-10 place-items-center rounded-full bg-mist-100 text-mist-600">
                          <Icon name={notes.loading ? "clock" : "bell"} className="size-5" />
                        </span>
                        <span className="text-adm-base font-medium text-navy-900">{notes.loading ? "Loading…" : "You're all caught up"}</span>
                        {!notes.loading && <span className="text-adm-xs text-mist-600">New applicants, enquiries and tasks for you land here.</span>}
                      </li>
                    )}
                    {shownNotes.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (!n.isRead) void notes.markAsRead(n.id);
                            close();
                            if (n.link) router.push(portalLink(n.link));
                          }}
                          className={`flex w-full gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-mist-50 ${n.isRead ? "" : "bg-ocean-50/40"}`}
                        >
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-mist-100 text-mist-700">
                            <Icon name={NOTE_ICON[n.type] ?? "bell"} className="size-3.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline gap-2">
                              <span className={`min-w-0 flex-1 truncate text-adm-base text-navy-900 ${n.isRead ? "font-medium" : "font-semibold"}`}>{n.title}</span>
                              <span className="shrink-0 text-adm-xs tabular-nums text-mist-600">{formatTimeAgo(n.createdAt)}</span>
                            </span>
                            <span className="mt-0.5 line-clamp-2 text-adm-xs text-mist-700">{n.message}</span>
                          </span>
                          {!n.isRead && <span aria-label="Unread" className="mt-2 size-2 shrink-0 rounded-full bg-ocean-600" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <Link href="/portal/notifications" onClick={close} className="flex h-10 shrink-0 items-center justify-center border-t border-mist-200 text-adm-xs font-medium text-ocean-700 transition-colors duration-150 hover:bg-mist-50">
                    View all notifications
                  </Link>
                </div>
              )}
            </div>

            {/* Account: who you are, how the portal looks, where else you can go, sign out */}
            <div ref={userRef} className="relative">
              <button
                ref={userTrigger}
                type="button"
                onClick={() => {
                  setViewAs(false);
                  setMenu(menu === "user" ? null : "user");
                }}
                aria-expanded={menu === "user"}
                aria-haspopup="menu"
                aria-label="Account menu"
                className={`grid size-8 place-items-center rounded-full transition-[box-shadow,background-color] duration-150 hover:ring-2 hover:ring-mist-200 ${menu === "user" ? "ring-2 ring-ocean-600/40" : ""}`}
              >
                <UserAvatar id={user.id} name={user.name} failed={avatarFailed} onFail={() => setAvatarFailed(true)} small />
              </button>
              {menu === "user" && (
                <div
                  role="menu"
                  aria-label="Account"
                  onKeyDown={(e) => {
                    if (e.key !== "Escape") return;
                    close();
                    userTrigger.current?.focus();
                  }}
                  className="kit-pop absolute right-0 top-10 flex max-h-[calc(100svh-4.5rem)] w-72 max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-lg border border-mist-200 bg-mist-0 shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
                >
                  {/* Identity: opens the account's own settings */}
                  <Link href="/portal/settings" onClick={close} role="menuitem" className="flex items-center gap-3 border-b border-mist-200 px-3 py-3 transition-colors duration-150 hover:bg-mist-50">
                    <UserAvatar id={user.id} name={user.name} failed={avatarFailed} onFail={() => setAvatarFailed(true)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-adm-base font-semibold leading-tight text-navy-900">{user.name}</span>
                      <span className="block truncate text-adm-xs text-mist-600">{user.email}</span>
                    </span>
                    <span className="shrink-0 rounded-md border border-mist-200 px-1.5 py-0.5 text-adm-xs font-medium text-mist-700">{roles[realRole].label}</span>
                  </Link>

                  <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-1">
                    {/* Theme: the one place it is set */}
                    <div className="flex h-9 items-center gap-2 px-2">
                      <Icon name={theme === "dark" ? "moon" : "sun"} className="size-4 shrink-0 text-mist-500" />
                      <span className="flex-1 text-adm-base text-navy-900">Theme</span>
                      <div role="radiogroup" aria-label="Theme" className="flex items-center gap-0.5 rounded-md bg-mist-100 p-0.5">
                        {(["light", "dark"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            role="radio"
                            aria-checked={theme === t}
                            onClick={() => theme !== t && toggleTheme()}
                            className={`flex h-6 items-center gap-1 rounded px-2 text-adm-xs font-medium transition-colors duration-150 ${theme === t ? "bg-mist-0 text-navy-900 shadow-[0_1px_2px_rgba(15,23,42,0.08)]" : "text-mist-600 hover:text-navy-900"}`}
                          >
                            <Icon name={t === "light" ? "sun" : "moon"} className="size-3.5" />
                            {t === "light" ? "Light" : "Dark"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="-mx-1 my-1 h-px bg-mist-200" />
                    <MenuItem href="/portal/settings" icon="settings" label="Account settings" onClick={close} />
                    {canHr && <MenuItem href={hrPortalUrl("portal")} icon="idBadge" label="HR portal" external onClick={close} />}

                    {/* Admins preview another role's view in place; the API still answers as admin */}
                    {realRole === "admin" && (
                      <>
                        <button type="button" role="menuitem" onClick={() => setViewAs((v) => !v)} aria-expanded={viewAs} className={`${ROW} w-full`}>
                          <Icon name="eye" className="size-4 shrink-0 text-mist-500" />
                          View portal as
                          <span className="ml-auto text-adm-xs text-mist-600">{roles[role].label}</span>
                          <Icon name="chevronDown" className={`size-3.5 text-mist-500 transition-transform duration-200 ${viewAs ? "rotate-180" : ""}`} />
                        </button>
                        <div className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${viewAs ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                          <div inert={!viewAs} role="radiogroup" aria-label="View portal as" className="min-h-0 min-w-0 overflow-hidden">
                            <div className="my-1 ml-4 grid gap-0.5 border-l border-mist-200 pl-2">
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
                                  className={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150 hover:bg-mist-100 ${r === role ? "bg-mist-100" : ""}`}
                                >
                                  <span className={`mt-1 grid size-3.5 shrink-0 place-items-center rounded-full ${r === role ? "bg-ocean-600" : "ring-1 ring-inset ring-mist-400"}`}>
                                    {r === role && <span className="size-1.5 rounded-full bg-white" />}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-2 text-adm-base text-navy-900">
                                      {roles[r].label}
                                      {r === realRole && <span className="text-adm-xs text-mist-600">You</span>}
                                    </span>
                                    <span className="line-clamp-2 text-adm-xs leading-snug text-mist-600">{roles[r].description}</span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="border-t border-mist-200 p-1">
                    <button type="button" role="menuitem" onClick={signOut} className={`${ROW} w-full text-status-danger hover:bg-status-danger-soft`}>
                      <Icon name="logout" className="size-4 shrink-0" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
      </header>

      {/* The work surface, as Plane's: inset 8px from the canvas, rounded, fixed to the window.
          Sidebar and page sit side by side and only the page (<main>) scrolls. */}
      <div className="min-h-0 flex-1 px-2 pb-2">
        <div className="flex h-full overflow-hidden rounded-lg border border-mist-200 bg-mist-0">
          {!sidebarHidden && (
            <aside className="relative z-20 hidden h-full w-[var(--sidebar-width)] shrink-0 border-r border-mist-200 lg:block">
              <Sidebar activeHref={activeHref} />
              <SidebarResizer width={sidebarWidth} onWidth={setSidebarWidth} onCommit={saveSidebarWidth} />
            </aside>
          )}
          {/* The one gutter: pages never pad themselves (see portal README) */}
          <main ref={mainRef} id="portal-main" tabIndex={-1} data-portal className="scroll-thin flex min-w-0 flex-1 flex-col overflow-y-auto p-5 focus:outline-none sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
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
const ROW = "flex h-8 items-center gap-2 rounded-md px-2 text-adm-base text-navy-900 transition-colors hover:bg-mist-100";

// Plane's ghost icon button: 32px, no edge, a fill on hover; every top-bar control uses it.
const ICON_BTN = "grid size-8 shrink-0 place-items-center rounded-md text-navy-900 transition-colors duration-150 hover:bg-mist-100";
const SMALL_ICON_BTN = "grid size-7 place-items-center rounded-md text-mist-600 transition-colors duration-150 hover:bg-mist-100 hover:text-navy-900";

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
    <a href={href} target="_blank" rel="noopener" role="menuitem" onClick={onClick} className={cls}>
      {body}
    </a>
  ) : (
    <Link href={href} role="menuitem" onClick={onClick} className={cls}>
      {body}
    </Link>
  );
}
