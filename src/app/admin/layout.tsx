"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Bell,
  Search,
  Home,
  UserCog,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
  Loader2,
  UsersRound,
  Building,
  Boxes,
  Shield,
  FolderOpen,
  BookOpen,
  Activity,
  KeyRound,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth, UserRole } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AdminProvider, useAdmin } from "@/components/admin/admin-provider";
import { Toaster } from "sonner";

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

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
};

const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [
      { name: "Dashboard",    href: "/admin",              icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES] },
    ],
  },
  {
    label: "Recruitment",
    items: [
      { name: "Job Postings", href: "/admin/jobs",         icon: Briefcase,  roles: [UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES] },
      { name: "Applications", href: "/admin/applications", icon: Users,      roles: [UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES] },
      { name: "Talent Bench", href: "/admin/bench",        icon: Boxes,      roles: [UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES] },
      { name: "Resumes",      href: "/admin/resumes",      icon: FolderOpen, roles: [UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES] },
    ],
  },
  {
    label: "CRM",
    items: [
      { name: "Contacts", href: "/admin/contacts", icon: MessageSquare, roles: [UserRole.ADMIN, UserRole.HR] },
      { name: "Clients",  href: "/admin/clients",  icon: Building,      roles: [UserRole.ADMIN, UserRole.HR] },
      { name: "Vendors",  href: "/admin/vendors",  icon: UsersRound,    roles: [UserRole.ADMIN, UserRole.HR] },
    ],
  },
  {
    label: "Administration",
    items: [
      { name: "Users",    href: "/admin/users",     icon: UserCog,  roles: [UserRole.ADMIN] },
      { name: "Roles",    href: "/admin/roles",     icon: Shield,   roles: [UserRole.ADMIN] },
      { name: "API Keys", href: "/admin/api-keys",  icon: KeyRound, roles: [UserRole.ADMIN] },
      { name: "Content",  href: "/admin/content",   icon: FileText, roles: [UserRole.ADMIN] },
      { name: "Settings", href: "/admin/settings",  icon: Settings, roles: [UserRole.ADMIN] },
    ],
  },
  {
    label: "Resources",
    items: [
      { name: "Docs",   href: "/admin/docs",   icon: BookOpen,  roles: [UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES] },
      { name: "Status", href: "/status",        icon: Activity,  roles: [UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES] },
    ],
  },
];

// Flat list still needed for page-title lookup
const navigation = NAV_GROUPS.flatMap((g) => g.items);

const notificationIcons = {
  job_posted: Briefcase,
  application_received: Users,
  contact_received: MessageSquare,
};

const notificationColors = {
  job_posted: "bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]",
  application_received: "bg-emerald-50 text-emerald-600",
  contact_received: "bg-violet-50 text-violet-600",
};

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, signOut, hasAnyRole } = useAuth();
  const { openCommandPalette, openCandidateEditor, pageCrumb } = useAdmin();

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      const response = await fetch("/api/notifications?limit=20");
      const data = await response.json();
      if (response.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  // Initial fetch and polling for notifications
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
    setNotificationsOpen(false);
  };

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("adminSidebarCollapsed");
    if (saved) {
      setSidebarCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save sidebar state to localStorage
  const toggleSidebarCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("adminSidebarCollapsed", JSON.stringify(newState));
  };

  // Get role badge color
  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return "bg-rose-50 text-rose-600";
      case UserRole.HR:
        return "bg-violet-50 text-violet-600";
      case UserRole.RECRUITER:
        return "bg-teal-50 text-teal-600";
      case UserRole.SALES:
        return "bg-amber-50 text-amber-600";
      default:
        return "bg-sky-50 text-sky-600";
    }
  };

  // Resolve the breadcrumb section from the URL. Detail pages (e.g.
  // /admin/jobs/123 or /admin/candidates/APP-2026-0103) have no exact nav entry,
  // so we match by longest nav href prefix and alias sections that share a parent.
  const getCurrentSection = (): { name: string; href: string } => {
    // Sections with pages but no nav item of their own map to their parent.
    const aliases: Record<string, { name: string; href: string }> = {
      "/admin/candidates": { name: "Applications", href: "/admin/applications" },
    };
    for (const [prefix, info] of Object.entries(aliases)) {
      if (pathname === prefix || pathname.startsWith(prefix + "/")) return info;
    }
    const match = navigation
      .filter((item) => item.href !== "/admin" && (pathname === item.href || pathname.startsWith(item.href + "/")))
      .sort((a, b) => b.href.length - a.href.length)[0];
    return match ? { name: match.name, href: match.href } : { name: "Dashboard", href: "/admin" };
  };
  const section = getCurrentSection();

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-white border-r border-slate-200/80 transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarCollapsed ? "lg:w-[68px]" : "lg:w-60"} w-60`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center h-14 border-b border-slate-100 ${sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"}`}>
            <Link href="/admin" className="flex items-center gap-2">
              {sidebarCollapsed ? (
                <div className="w-8 h-8 flex items-center justify-center">
                  <Image src="/logo.ico" alt="Logo" width={32} height={32} className="w-8 h-8" />
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
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-2 overflow-y-auto px-2 space-y-1">
            {NAV_GROUPS.map((group) => {
              const visibleItems = group.items.filter((item) => hasAnyRole(item.roles));
              if (visibleItems.length === 0) return null;
              return (
                <div key={group.label ?? "top"}>
                  {/* Group label */}
                  {group.label && !sidebarCollapsed && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-3 pb-1">
                      {group.label}
                    </p>
                  )}
                  {group.label && sidebarCollapsed && (
                    <div className="my-1 border-t border-slate-100 mx-1" />
                  )}
                  <div className="space-y-px">
                    {visibleItems.map((item) => {
                      const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          title={sidebarCollapsed ? item.name : undefined}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                            sidebarCollapsed ? "justify-center p-2.5" : "px-3 py-[7px]"
                          } ${
                            isActive
                              ? "bg-[var(--hz-cobalt)] text-white shadow-sm"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          }`}
                        >
                          <item.icon className={`flex-shrink-0 ${sidebarCollapsed ? "w-[18px] h-[18px]" : "w-[15px] h-[15px]"}`} />
                          {!sidebarCollapsed && <span>{item.name}</span>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Website link */}
            <div>
              {!sidebarCollapsed && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-3 pb-1">
                  External
                </p>
              )}
              {sidebarCollapsed && <div className="my-1 border-t border-slate-100 mx-1" />}
              <Link
                href="/"
                target="_blank"
                title={sidebarCollapsed ? "View Website" : undefined}
                className={`flex items-center gap-2.5 rounded-lg text-[13px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all ${
                  sidebarCollapsed ? "justify-center p-2.5" : "px-3 py-[7px]"
                }`}
              >
                <Home className={`flex-shrink-0 ${sidebarCollapsed ? "w-[18px] h-[18px]" : "w-[15px] h-[15px]"}`} />
                {!sidebarCollapsed && <span>View Website</span>}
              </Link>
            </div>
          </nav>

          {/* Collapse Toggle */}
          <div className="hidden lg:block px-2 py-2 border-t border-slate-100">
            <button
              onClick={toggleSidebarCollapse}
              className={`w-full flex items-center gap-2.5 rounded-lg text-[13px] font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all ${
                sidebarCollapsed ? "justify-center p-2.5" : "px-3 py-2"
              }`}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="w-[18px] h-[18px]" />
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>

        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? "lg:pl-[68px]" : "lg:pl-60"}`}>
        {/* Top header */}
        <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 flex items-center justify-between px-4 lg:px-5">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <nav className="hidden sm:flex items-center gap-1 text-sm">
              <Link href="/admin" className="text-slate-400 hover:text-[var(--hz-cobalt)] transition-colors">
                Admin
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              {pageCrumb ? (
                <>
                  <Link href={section.href} className="text-slate-400 hover:text-[var(--hz-cobalt)] transition-colors">
                    {section.name}
                  </Link>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  <span className="font-medium text-slate-800">{pageCrumb}</span>
                </>
              ) : (
                <span className="font-medium text-slate-800">{section.name}</span>
              )}
            </nav>

            {/* Mobile Title */}
            <h1 className="sm:hidden font-semibold text-slate-800">{pageCrumb || section.name}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Command palette trigger — replaces inline search */}
            <button
              type="button"
              onClick={openCommandPalette}
              className="hidden md:inline-flex items-center gap-2 w-56 lg:w-72 pl-2.5 pr-1.5 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg hover:bg-white hover:border-slate-300 transition-colors group"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400 flex-1 text-left">Search or jump to…</span>
              <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                ⌘K
              </kbd>
            </button>

            {/* Mobile search */}
            <button
              type="button"
              onClick={openCommandPalette}
              className="md:hidden p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <div ref={notificationsRef} className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute top-full right-0 mt-1.5 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200/80 shadow-xl ring-1 ring-black/5 overflow-hidden z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <p className="text-xs text-slate-500 mt-0.5">{unreadCount} unread</p>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-[var(--hz-cobalt)] hover:text-[var(--hz-cobalt)] font-medium px-2 py-1 rounded-md hover:bg-[var(--hz-cobalt-100)] transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-96 overflow-y-auto bg-white">
                    {loadingNotifications && notifications.length === 0 ? (
                      <div className="flex items-center justify-center py-12 bg-white">
                        <Loader2 className="w-6 h-6 text-[var(--hz-cobalt)] animate-spin" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-12 text-center bg-white">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                          <Bell className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">No notifications</p>
                        <p className="text-xs text-slate-400 mt-1">You&apos;re all caught up!</p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notification) => {
                        const Icon = notificationIcons[notification.type];
                        const colorClass = notificationColors[notification.type];
                        return (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0 ${
                              !notification.isRead ? "bg-[#eef3fe]" : "bg-white"
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${colorClass}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm leading-tight ${!notification.isRead ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-[var(--hz-cobalt)] flex-shrink-0 mt-1 ring-2 ring-[rgba(29,78,216,0.2)]" />
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notification.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{formatTimeAgo(notification.createdAt)}</p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
                      <Link
                        href="/admin/notifications"
                        className="text-xs text-[var(--hz-cobalt)] hover:text-[var(--hz-cobalt)] font-medium flex items-center justify-center gap-1"
                      >
                        View all notifications
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-5 bg-slate-200 mx-0.5" />

            {/* User Menu */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg border border-transparent py-1 pl-1 pr-1.5 transition-colors hover:border-slate-200 hover:bg-slate-50"
              >
                <img
                  src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user?.email || "user")}&backgroundColor=b6e3f4`}
                  alt={user?.name || "User"}
                  className="w-7 h-7 rounded-full bg-[var(--hz-cobalt-100)] ring-2 ring-white shadow-sm"
                />
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[110px]">{user?.name || "User"}</p>
                  <span className={`text-[10px] px-1.5 py-px rounded font-medium capitalize ${getRoleBadgeColor()}`}>
                    {user?.role}
                  </span>
                </div>
                <ChevronDown className={`hidden md:block w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 z-50">
                  <div className="flex items-center gap-3 bg-gradient-to-br from-[var(--hz-cobalt)] to-[var(--hz-cobalt-600)] px-4 py-3.5">
                    <img
                      src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user?.email || "user")}&backgroundColor=b6e3f4`}
                      alt={user?.name || "User"}
                      className="w-10 h-10 rounded-full bg-white/20 flex-shrink-0 ring-2 ring-white/40 shadow-sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                      <p className="text-[11px] text-white/75 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="px-3 pt-2.5 pb-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${getRoleBadgeColor()}`}>
                      {user?.role}
                    </span>
                  </div>
                  <div className="py-1">
                    <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-[#eef3fe] transition-colors">
                      <LayoutDashboard className="w-4 h-4 text-slate-400" /> Dashboard
                    </Link>
                    <Link href="/admin/settings" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-[#eef3fe] transition-colors">
                      <Settings className="w-4 h-4 text-slate-400" /> Settings
                    </Link>
                    <Link href="/" target="_blank" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-[#eef3fe] transition-colors">
                      <Home className="w-4 h-4 text-slate-400" /> View website
                    </Link>
                  </div>
                  <div className="border-t border-slate-100 py-1">
                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-5 min-h-[calc(100vh-3.5rem)]">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES]}>
      <AdminProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{ style: { fontFamily: "var(--font-geist-sans)" } }}
        />
      </AdminProvider>
    </ProtectedRoute>
  );
}
