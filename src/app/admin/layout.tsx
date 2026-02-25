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
  Bell,
  Search,
  Home,
  UserCog,
  HelpCircle,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
  Loader2,
  UsersRound,
  Building,
  UserStar,
  Boxes,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth, UserRole } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

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

interface SearchResult {
  type: "job" | "application" | "contact";
  id: string;
  title: string;
  subtitle: string;
  link: string;
  status?: string;
}

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.HR] },
  { name: "Users", href: "/admin/users", icon: UserCog, roles: [UserRole.ADMIN] },
  { name: "Content", href: "/admin/content", icon: FileText, roles: [UserRole.ADMIN] },
  { name: "Job Postings", href: "/admin/jobs", icon: Briefcase, roles: [UserRole.ADMIN, UserRole.HR] },
  { name: "Candidates", href: "/admin/candidates", icon: UserStar, roles: [UserRole.ADMIN, UserRole.HR] },
  { name: "Applications", href: "/admin/applications", icon: Users, roles: [UserRole.ADMIN, UserRole.HR] },
  { name: "Talent Bench", href: "/admin/bench", icon: Boxes, roles: [UserRole.ADMIN, UserRole.HR] },
  { name: "Contacts", href: "/admin/contacts", icon: MessageSquare, roles: [UserRole.ADMIN, UserRole.HR] },
  { name: "Clients", href: "/admin/clients", icon: Building, roles: [UserRole.ADMIN, UserRole.HR] },
  { name: "Vendors", href: "/admin/vendors", icon: UsersRound, roles: [UserRole.ADMIN, UserRole.HR] },
  { name: "Settings", href: "/admin/settings", icon: Settings, roles: [UserRole.ADMIN] },
];

const notificationIcons = {
  job_posted: Briefcase,
  application_received: Users,
  contact_received: MessageSquare,
};

const notificationColors = {
  job_posted: "bg-blue-50 text-blue-600",
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

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout>(null);
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

  // Search functionality
  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (response.ok) {
        setSearchResults(data.results || []);
        setSearchOpen(true);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounced search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
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

  // Handle search result click
  const handleSearchResultClick = (result: SearchResult) => {
    router.push(result.link);
    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(false);
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

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter((item) => hasAnyRole(item.roles));

  // Get user initials
  const getUserInitials = () => {
    if (!user?.name) return "U";
    const names = user.name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name[0].toUpperCase();
  };

  // Get role badge color
  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return "bg-rose-50 text-rose-600";
      case UserRole.HR:
        return "bg-violet-50 text-violet-600";
      default:
        return "bg-sky-50 text-sky-600";
    }
  };

  // Get current page title
  const getCurrentPageTitle = () => {
    const currentNav = navigation.find((item) => item.href === pathname);
    return currentNav?.name || "Dashboard";
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200/80 transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarCollapsed ? "lg:w-[68px]" : "lg:w-60"} w-60`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center h-14 border-b border-gray-100 ${sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"}`}>
            <Link href="/admin" className="flex items-center gap-2">
              {sidebarCollapsed ? (
                <div className="w-8 h-8 flex items-center justify-center">
                  <img src="/logo.ico" alt="Logo" className="w-8 h-8" />
                </div>
              ) : (
                <Image
                  src="https://www.oceanbluecorp.com/images/logo.png"
                  alt="Ocean Blue Corporation"
                  width={130}
                  height={36}
                  className="h-8 w-auto"
                  priority
                />
              )}
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 py-3 overflow-y-auto ${sidebarCollapsed ? "px-2" : "px-2"}`}>
            <div className="space-y-0.5">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={sidebarCollapsed ? item.name : undefined}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                      sidebarCollapsed ? "justify-center p-2.5" : "px-3 py-2"
                    } ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className={`flex-shrink-0 ${sidebarCollapsed ? "w-[18px] h-[18px]" : "w-4 h-4"}`} />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className={`my-3 border-t border-gray-100 ${sidebarCollapsed ? "mx-1" : "mx-2"}`} />

            {/* Quick Links */}
            <div className="space-y-0.5">
              <Link
                href="/"
                target="_blank"
                title={sidebarCollapsed ? "View Website" : undefined}
                className={`flex items-center gap-2.5 rounded-lg text-[13px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all ${
                  sidebarCollapsed ? "justify-center p-2.5" : "px-3 py-2"
                }`}
              >
                <Home className={sidebarCollapsed ? "w-[18px] h-[18px]" : "w-4 h-4"} />
                {!sidebarCollapsed && <span>View Website</span>}
              </Link>
              <Link
                href="/admin/help"
                title={sidebarCollapsed ? "Help & Support" : undefined}
                className={`flex items-center gap-2.5 rounded-lg text-[13px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all ${
                  sidebarCollapsed ? "justify-center p-2.5" : "px-3 py-2"
                }`}
              >
                <HelpCircle className={sidebarCollapsed ? "w-[18px] h-[18px]" : "w-4 h-4"} />
                {!sidebarCollapsed && <span>Help</span>}
              </Link>
            </div>
          </nav>

          {/* Collapse Toggle */}
          <div className="hidden lg:block px-2 py-2 border-t border-gray-100">
            <button
              onClick={toggleSidebarCollapse}
              className={`w-full flex items-center gap-2.5 rounded-lg text-[13px] font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all ${
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

          {/* User section */}
          <div className={`border-t border-gray-100 ${sidebarCollapsed ? "p-2" : "p-2"}`} ref={userMenuRef}>
            <div
              className={`flex items-center gap-2.5 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                sidebarCollapsed ? "justify-center p-2" : "px-2.5 py-2"
              }`}
              onClick={() => !sidebarCollapsed && setUserMenuOpen(!userMenuOpen)}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                {getUserInitials()}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{user?.name || "User"}</p>
                  <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${getRoleBadgeColor()}`}>
                    {user?.role}
                  </span>
                </div>
              )}
            </div>

            {/* User dropdown menu */}
            {userMenuOpen && !sidebarCollapsed && (
              <div className="mt-1.5 py-1 rounded-lg bg-white border border-gray-200 shadow-lg">
                <p className="px-3 py-1.5 text-xs text-gray-500 truncate">{user?.email}</p>
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? "lg:pl-[68px]" : "lg:pl-60"}`}>
        {/* Top header */}
        <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-sm border-b border-gray-200/80 flex items-center justify-between px-4 lg:px-5">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <nav className="hidden sm:flex items-center gap-1 text-sm">
              <Link href="/admin" className="text-gray-400 hover:text-blue-600 transition-colors">
                Admin
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              <span className="font-medium text-gray-800">{getCurrentPageTitle()}</span>
            </nav>

            {/* Mobile Title */}
            <h1 className="sm:hidden font-semibold text-gray-800">{getCurrentPageTitle()}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Search - Desktop */}
            <div ref={searchRef} className="relative hidden md:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.length >= 2 && setSearchOpen(true)}
                className="w-44 lg:w-56 pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 focus:outline-none transition-all"
              />
              {searchLoading && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />
              )}

              {/* Search Results Dropdown */}
              {searchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50">
                  <div className="max-h-72 overflow-y-auto">
                    {searchResults.map((result) => {
                      const Icon = result.type === "job" ? Briefcase : result.type === "application" ? Users : MessageSquare;
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleSearchResultClick(result)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
                            result.type === "job" ? "bg-blue-50 text-blue-600" :
                            result.type === "application" ? "bg-emerald-50 text-emerald-600" :
                            "bg-violet-50 text-violet-600"
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{result.title}</p>
                            <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No results */}
              {searchOpen && searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-lg border border-gray-200 shadow-lg p-3 z-50">
                  <p className="text-sm text-gray-500 text-center">No results found</p>
                </div>
              )}
            </div>

            {/* Search - Mobile */}
            <button className="md:hidden p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <div ref={notificationsRef} className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
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
                <div className="absolute top-full right-0 mt-1.5 w-72 sm:w-80 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-80 overflow-y-auto">
                    {loadingNotifications && notifications.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No notifications</p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notification) => {
                        const Icon = notificationIcons[notification.type];
                        const colorClass = notificationColors[notification.type];
                        return (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 ${
                              !notification.isRead ? "bg-blue-50/40" : ""
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm truncate ${!notification.isRead ? "font-semibold text-gray-800" : "text-gray-700"}`}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{notification.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{formatTimeAgo(notification.createdAt)}</p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="hidden sm:block h-5 w-px bg-gray-200" />

            {/* User Info - Desktop */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                <p className="text-[11px] text-gray-500 capitalize">{user?.role}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                {getUserInitials()}
              </div>
            </div>

            {/* User Avatar - Mobile */}
            <div className="sm:hidden w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
              {getUserInitials()}
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
    <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.HR]}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </ProtectedRoute>
  );
}
