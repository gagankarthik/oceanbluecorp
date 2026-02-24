"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Home,
  UserCog,
  HelpCircle,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
  UserCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth, UserRole } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.HR] },
  { name: "Users", href: "/admin/users", icon: UserCog, roles: [UserRole.ADMIN] },
  { name: "Content", href: "/admin/content", icon: FileText, roles: [UserRole.ADMIN] },
  { name: "Job Postings", href: "/admin/jobs", icon: Briefcase, roles: [UserRole.ADMIN, UserRole.HR] },
  { name: "Candidates", href: "/admin/candidates", icon: UserCheck, roles: [UserRole.ADMIN, UserRole.HR] },
  { name: "Applications", href: "/admin/applications", icon: Users, roles: [UserRole.ADMIN, UserRole.HR] },
  { name: "Contacts", href: "/admin/contacts", icon: MessageSquare, roles: [UserRole.ADMIN, UserRole.HR] },
  { name: "Settings", href: "/admin/settings", icon: Settings, roles: [UserRole.ADMIN] },
];

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, signOut, hasAnyRole } = useAuth();

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
        return "bg-red-100 text-red-700";
      case UserRole.HR:
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  // Get current page title
  const getCurrentPageTitle = () => {
    const currentNav = navigation.find((item) => item.href === pathname);
    return currentNav?.name || "Dashboard";
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-white border-r border-slate-200 shadow-sm transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarCollapsed ? "lg:w-[72px]" : "lg:w-64"} w-64`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center h-16 border-b border-slate-200 ${sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"}`}>
            <Link href="/admin" className="flex items-center gap-3">
              {sidebarCollapsed ? (
                <div className="w-10 h-10 bg-transparent flex items-center justify-center">
                  <img src="/logo.ico"></img>
                </div>
              ) : (
                <Image
                  src="https://www.oceanbluecorp.com/images/logo.png"
                  alt="Ocean Blue Corporation"
                  width={140}
                  height={40}
                  className="h-9 w-auto"
                  priority
                />
              )}
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 py-4 overflow-y-auto ${sidebarCollapsed ? "px-2" : "px-3"}`}>
            {!sidebarCollapsed && (
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
                Main Menu
              </p>
            )}
            <div className="space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={sidebarCollapsed ? item.name : undefined}
                    className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      sidebarCollapsed ? "justify-center p-3" : "px-3 py-2.5"
                    } ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <item.icon className={`flex-shrink-0 ${sidebarCollapsed ? "w-5 h-5" : "w-[18px] h-[18px]"}`} />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className={`my-4 border-t border-slate-200 ${sidebarCollapsed ? "mx-1" : "mx-2"}`} />

            {/* Quick Links */}
            {!sidebarCollapsed && (
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
                Quick Links
              </p>
            )}
            <div className="space-y-1">
              <Link
                href="/"
                target="_blank"
                title={sidebarCollapsed ? "View Website" : undefined}
                className={`flex items-center gap-3 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all ${
                  sidebarCollapsed ? "justify-center p-3" : "px-3 py-2.5"
                }`}
              >
                <Home className={sidebarCollapsed ? "w-5 h-5" : "w-[18px] h-[18px]"} />
                {!sidebarCollapsed && <span>View Website</span>}
              </Link>
              <Link
                href="/admin/help"
                title={sidebarCollapsed ? "Help & Support" : undefined}
                className={`flex items-center gap-3 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all ${
                  sidebarCollapsed ? "justify-center p-3" : "px-3 py-2.5"
                }`}
              >
                <HelpCircle className={sidebarCollapsed ? "w-5 h-5" : "w-[18px] h-[18px]"} />
                {!sidebarCollapsed && <span>Help & Support</span>}
              </Link>
            </div>
          </nav>

          {/* Collapse Toggle - Desktop Only */}
          <div className="hidden lg:block px-3 py-2 border-t border-slate-200">
            <button
              onClick={toggleSidebarCollapse}
              className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all ${
                sidebarCollapsed ? "justify-center p-3" : "px-3 py-2.5"
              }`}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="w-5 h-5" />
              ) : (
                <>
                  <PanelLeftClose className="w-[18px] h-[18px]" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>

          {/* User section */}
          <div className={`border-t border-slate-200 ${sidebarCollapsed ? "p-2" : "p-3"}`}>
            <div
              className={`flex items-center gap-3 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors ${
                sidebarCollapsed ? "justify-center p-2" : "px-3 py-2.5"
              }`}
              onClick={() => !sidebarCollapsed && setUserMenuOpen(!userMenuOpen)}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {getUserInitials()}
              </div>
              {!sidebarCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{user?.name || "User"}</p>
                    <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${getRoleBadgeColor()}`}>
                      {user?.role}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </>
              )}
            </div>

            {/* User dropdown menu */}
            {userMenuOpen && !sidebarCollapsed && (
              <div className="mt-2 py-1 rounded-xl bg-white border border-slate-200 shadow-lg">
                <p className="px-3 py-1.5 text-xs text-slate-500 truncate">{user?.email}</p>
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64"}`}>
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb - Desktop */}
            <nav className="hidden sm:flex items-center gap-1.5 text-sm">
              <Link href="/admin" className="text-slate-500 hover:text-blue-600 transition-colors">
                Admin
              </Link>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <span className="font-semibold text-slate-900">{getCurrentPageTitle()}</span>
            </nav>

            {/* Mobile Title */}
            <h1 className="sm:hidden font-semibold text-slate-900">{getCurrentPageTitle()}</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search - Desktop */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-48 lg:w-64 pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              />
            </div>

            {/* Search - Mobile */}
            <button className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            {/* Divider */}
            <div className="hidden sm:block h-6 w-px bg-slate-200" />

            {/* User Info - Desktop */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {getUserInitials()}
              </div>
            </div>

            {/* User Avatar - Mobile */}
            <div className="sm:hidden w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
              {getUserInitials()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 min-h-[calc(100vh-4rem)]">{children}</main>
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
