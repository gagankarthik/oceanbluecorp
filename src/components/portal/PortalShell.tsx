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
import { ChromeProvider, navItemFor, type PortalChrome } from "./chrome";
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

const SIDEBAR_KEY = "portal.sidebar";
const WIDE = "(min-width: 1280px)";

/**
 * Desktop sidebar state. A stored choice wins; with none, it follows the
 * viewport: expanded from 1280px, an icon rail from 1024 to 1279px.
 */
function useSidebarCollapsed() {
  const read = () => {
    try {
      const v = window.localStorage.getItem(SIDEBAR_KEY);
      if (v === "collapsed" || v === "expanded") return v === "collapsed";
    } catch {}
    return null;
  };
  const [stored, setStored] = useState<boolean | null>(() => (typeof window === "undefined" ? null : read()));
  const [wide, setWide] = useState(() => (typeof window === "undefined" ? true : window.matchMedia(WIDE).matches));

  useEffect(() => {
    const mq = window.matchMedia(WIDE);
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const collapsed = stored ?? !wide;
  const toggle = useCallback(() => {
    const next = !collapsed;
    setStored(next);
    try {
      window.localStorage.setItem(SIDEBAR_KEY, next ? "collapsed" : "expanded");
    } catch {}
  }, [collapsed]);
  return [collapsed, toggle] as const;
}

type Tip = { label: string; top: number } | null;

function Sidebar({
  activeHref,
  collapsed = false,
  onNavigate,
  onClose,
}: {
  activeHref?: string;
  /** Icon rail: labels become tooltips, group titles become dividers */
  collapsed?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const { role } = useSession();
  const [tip, setTip] = useState<Tip>(null);
  const groups = nav.map((g) => ({ ...g, items: g.items.filter((i) => canAccess(role, i.href)) })).filter((g) => g.items.length > 0);
  const labelled = groups.length > 1;

  // Rail tooltips are fixed-position: the nav scrolls, so an absolute one would be clipped.
  const tipProps = (label: string) =>
    collapsed
      ? {
          onMouseEnter: (e: React.MouseEvent<HTMLElement>) => showTip(e.currentTarget, label),
          onFocus: (e: React.FocusEvent<HTMLElement>) => showTip(e.currentTarget, label),
          onMouseLeave: () => setTip(null),
          onBlur: () => setTip(null),
        }
      : {};
  const showTip = (el: HTMLElement, label: string) => {
    const r = el.getBoundingClientRect();
    setTip({ label, top: r.top + r.height / 2 });
  };

  return (
    <div className="flex h-full flex-col border-r border-mist-200 bg-mist-0">
      {/* Logo centred in its box; the phone drawer keeps it left of the close button */}
      <div className={`flex h-16 shrink-0 items-center border-b border-mist-200 ${onClose ? "justify-between px-5" : "justify-center"}`}>
        <Link href="/portal" onClick={onNavigate} aria-label="Portal home" className="rounded-md">
          {collapsed ? <Logo mark className="size-9 object-center!" /> : <Logo className={`h-9 w-[7.6rem] ${onClose ? "" : "object-center!"}`} />}
        </Link>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close navigation" className="-mr-2 grid size-10 place-items-center rounded-lg text-navy-900 hover:bg-mist-100">
            <Icon name="x" />
          </button>
        )}
      </div>

      <nav id="portal-nav" aria-label="Portal" className="scroll-thin flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3" onScroll={() => setTip(null)}>
        {groups.map((group, gi) => (
          <div key={group.title} className={gi === 0 ? "" : collapsed ? "mt-2 border-t border-mist-200 pt-2" : "mt-3"}>
            {labelled && !collapsed && <p className="px-2.5 pb-1 text-[12px] font-medium text-mist-500">{group.title}</p>}
            {labelled && collapsed && <span className="sr-only">{group.title}</span>}
            <ul className="grid gap-0.5">
              {group.items.map((item) => {
                const active = item.href === activeHref;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      {...tipProps(item.label)}
                      className={`group relative flex min-h-8 items-center rounded-lg text-[14px] font-medium transition-colors ${
                        collapsed ? "mx-auto w-10 justify-center" : "gap-2.5 px-2.5"
                      } ${active ? "bg-ocean-50 text-ocean-700" : "text-mist-700 hover:bg-mist-100 hover:text-navy-900"}`}
                    >
                      {active && <span aria-hidden className="absolute -left-2.5 top-1 bottom-1 w-1 rounded-r bg-ocean-600" />}
                      <Icon name={item.icon} className={`size-4 shrink-0 ${active ? "text-ocean-600" : "text-mist-500 group-hover:text-navy-900"}`} />
                      <span className={collapsed ? "sr-only" : "truncate whitespace-nowrap"}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>


      {collapsed && tip && (
        <span
          aria-hidden
          className="pointer-events-none fixed left-[72px] z-40 -translate-y-1/2 whitespace-nowrap rounded-md bg-navy-900 px-2.5 py-1.5 text-[13px] font-medium text-white shadow-lg"
          style={{ top: tip.top }}
        >
          {tip.label}
        </span>
      )}
    </div>
  );
}

/** Off-canvas nav below lg: focus trapped, Escape and the backdrop close it. */
function MobileNav({ activeHref, onClose }: { activeHref?: string; onClose: () => void }) {
  const ref = useDialog<HTMLDivElement>(onClose);
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div aria-hidden className="kit-fade absolute inset-0 bg-navy-950/50" onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label="Navigation" tabIndex={-1} className="kit-drawer-left relative h-full w-72 max-w-[85vw] shadow-xl focus:outline-none">
        <Sidebar activeHref={activeHref} onNavigate={onClose} onClose={onClose} />
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
  const [collapsed, toggleSidebar] = useSidebarCollapsed();
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
  const chrome = useMemo<PortalChrome>(() => ({ openSearch, setNavSection }), [openSearch]);
  const activeHref = navSection ?? navItemFor(pathname)?.href;

  useEffect(() => {
    setMobileNav(false);
    setMenu(null);
  }, [pathname]);

  const closeMobileNav = useCallback(() => setMobileNav(false), []);

  return (
    <ChromeProvider value={chrome}>
    <div className="min-h-svh bg-mist-50">
      <a
        href="#portal-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-ocean-600 focus:px-3 focus:py-2 focus:text-[13px] focus:font-medium focus:text-white"
      >
        Skip to content
      </a>

      {/* Desktop sidebar: full width or an icon rail */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden overflow-hidden transition-[width] duration-200 ease-[var(--ease-standard)] motion-reduce:transition-none lg:block ${
          collapsed ? "w-16" : "w-54 2xl:w-60"
        }`}
      >
        <Sidebar activeHref={activeHref} collapsed={collapsed} />
      </aside>
      {/* On the sidebar's edge, level with the logo, as on the old console. Outside the
          aside because the aside clips its overflow; it rides the edge as the width animates. */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-controls="portal-nav"
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={`fixed top-8 z-40 hidden size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-mist-0 text-mist-600 shadow-sm ring-1 ring-mist-300 transition-[left,color] duration-200 ease-[var(--ease-standard)] hover:text-navy-900 hover:ring-mist-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean-600 motion-reduce:transition-none lg:grid ${
          collapsed ? "left-16" : "left-54 2xl:left-60"
        }`}
      >
        <Icon name={collapsed ? "chevronRight" : "chevronLeft"} className="size-3.5" />
      </button>

      {mobileNav && <MobileNav activeHref={activeHref} onClose={closeMobileNav} />}

      <div
        className={`flex min-h-svh min-w-0 flex-col transition-[padding] duration-200 ease-[var(--ease-standard)] motion-reduce:transition-none ${
          collapsed ? "lg:pl-16" : "lg:pl-54 2xl:pl-60"
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-mist-200 bg-mist-0 px-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileNav(true)}
            aria-label="Open navigation"
            aria-expanded={mobileNav}
            className="grid size-10 place-items-center rounded-lg text-navy-900 hover:bg-mist-100 lg:hidden"
          >
            <Icon name="menu" />
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            {canSearch && <PortalSearch ref={search} />}
            {/* Only while an admin previews another role: says so, and one click returns */}
            {realRole === "admin" && role !== realRole && (
              <button
                type="button"
                onClick={() => setRole(realRole)}
                title="Back to your own view"
                className="hidden h-8 items-center gap-1.5 rounded-full bg-[#fffaeb] pl-3 pr-2 text-[13px] font-medium text-[#b54708] ring-1 ring-inset ring-[#fedf89] hover:bg-[#fef0c7] sm:inline-flex"
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
                className="relative grid size-10 place-items-center rounded-lg text-navy-900 hover:bg-mist-100"
              >
                <Icon name="bell" />
                {notes.unreadCount > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-[#f04438] ring-2 ring-mist-0" />}
              </button>
              {menu === "bell" && (
                <div className="absolute right-0 top-12 w-80 rounded-xl bg-mist-0 shadow-xl ring-1 ring-mist-200">
                  <div className="flex items-center justify-between border-b border-mist-200 px-4 py-3">
                    <p className="text-[14px] font-semibold">Notifications</p>
                    {notes.unreadCount > 0 && (
                      <button type="button" onClick={() => void notes.markAllAsRead()} className="text-[13px] font-medium text-ocean-700 hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <ul className="max-h-80 overflow-y-auto py-1">
                    {notes.notifications.length === 0 && (
                      <li className="px-4 py-6 text-center text-[13px] text-mist-600">{notes.loading ? "Loading…" : "You're all caught up."}</li>
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
                          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ocean-50 text-ocean-700">
                            <Icon name={NOTE_ICON[n.type] ?? "bell"} className="size-4" />
                          </span>
                          <span className="flex-1">
                            <span className="block text-[13px] font-medium text-navy-900">{n.title}</span>
                            <span className="block text-[13px] text-mist-700">{n.message}</span>
                            <span className="block text-[12px] text-mist-500">{formatTimeAgo(n.createdAt)}</span>
                          </span>
                          {!n.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-ocean-600" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <Link href="/portal/notifications" className="block border-t border-mist-200 px-4 py-3 text-center text-[13px] font-medium text-ocean-700 hover:bg-mist-50">
                    See all notifications
                  </Link>
                </div>
              )}
            </div>

            <Link href="/portal/help" aria-label="Help and team directory" className="grid size-10 place-items-center rounded-lg text-navy-900 hover:bg-mist-100">
              <Icon name="help" />
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
                className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-mist-100"
              >
                <UserAvatar id={user.id} name={user.name} failed={avatarFailed} onFail={() => setAvatarFailed(true)} />
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-[13px] font-semibold text-navy-900">{user.name}</span>
                  <span className="block text-[12px] text-mist-600">{roles[role].label}</span>
                </span>
                <Icon name="chevronDown" className="hidden size-4 text-mist-500 sm:block" />
              </button>
              {menu === "user" && (
                <div className="absolute right-0 top-12 w-72 rounded-xl bg-mist-0 p-1.5 shadow-xl ring-1 ring-mist-200">
                  <div className="flex items-center gap-3 px-2.5 py-2.5">
                    <UserAvatar id={user.id} name={user.name} failed={avatarFailed} onFail={() => setAvatarFailed(true)} />
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-navy-900">{user.name}</p>
                      <p className="truncate text-[12px] text-mist-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="my-1 h-px bg-mist-200" />
                  <MenuItem href="/portal/settings" icon="settings" label="Account settings" onClick={close} />
                  <MenuItem href="/" icon="globe" label="View website" onClick={close} />
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
                        className={`flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-[14px] text-navy-900 hover:bg-mist-50 ${viewAs ? "bg-mist-50" : ""}`}
                      >
                        <span className="grid size-7 place-items-center rounded-md bg-mist-100 text-navy-800">
                          <Icon name="eye" className="size-4" />
                        </span>
                        View portal as
                        <span className="ml-auto text-[13px] text-mist-600">{roles[role].label}</span>
                        <Icon name="chevronRight" className={`size-4 text-mist-500 transition-transform max-sm:rotate-90 ${viewAs ? "sm:rotate-180" : ""}`} />
                      </button>
                      {viewAs && (
                        <div
                          role="radiogroup"
                          aria-label="View portal as"
                          className="mt-1 grid gap-0.5 rounded-lg bg-mist-50 p-1 sm:absolute sm:right-full sm:top-0 sm:mr-3 sm:mt-0 sm:max-h-[calc(100svh-8rem)] sm:w-52 sm:overflow-y-auto sm:bg-mist-0 sm:p-1.5 sm:shadow-xl sm:ring-1 sm:ring-mist-200"
                        >
                          <p className="hidden px-2.5 pb-1 pt-1.5 text-[12px] font-medium text-mist-500 sm:block">Preview the portal as</p>
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
                              className={`flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-left ${r === role ? "bg-ocean-50" : "hover:bg-mist-50"}`}
                            >
                              <span className={`grid size-4 shrink-0 place-items-center rounded-full ${r === role ? "bg-ocean-600" : "ring-1 ring-inset ring-mist-400"}`}>
                                {r === role && <span className="size-1.5 rounded-full bg-white" />}
                              </span>
                              <span className="text-[14px] font-medium text-navy-900">{roles[r].label}</span>
                              {r === realRole && <span className="ml-auto text-[12px] text-mist-500">You</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="my-1 h-px bg-mist-200" />
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-[14px] text-[#b42318] hover:bg-[#fef3f2]"
                  >
                    <span className="grid size-7 place-items-center rounded-md bg-[#fef3f2]">
                      <Icon name="logout" className="size-4" />
                    </span>
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
function UserAvatar({ id, name, failed, onFail }: { id: string; name: string; failed: boolean; onFail: () => void }) {
  if (failed || !id) return <Avatar name={name} size="sm" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/api/users/avatar/${id}`} alt="" onError={onFail} className="size-7 shrink-0 rounded-full object-cover" />
  );
}

/** Account menu row: icon tile, label, and an arrow when it leaves the portal */
function MenuItem({ href, icon, label, external, onClick }: { href: string; icon: IconName; label: string; external?: boolean; onClick?: () => void }) {
  const cls = "flex h-10 items-center gap-3 rounded-lg px-2.5 text-[14px] text-navy-900 hover:bg-mist-50";
  const body = (
    <>
      <span className="grid size-7 place-items-center rounded-md bg-mist-100 text-navy-800">
        <Icon name={icon} className="size-4" />
      </span>
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
