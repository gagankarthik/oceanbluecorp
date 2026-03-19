"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Cloud,
  Database,
  Users,
  GraduationCap,
  Cpu,
  BarChart3,
  Settings,
  Headphones,
  BookOpen,
  FileText,
  Briefcase,
  LogOut,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth";

const services = [
  {
    name: "ERP Solutions",
    href: "/services#erp",
    icon: BarChart3,
    description: "SAP & Oracle Implementation",
  },
  {
    name: "Cloud Services",
    href: "/services#cloud",
    icon: Cloud,
    description: "Cloud Migration & Management",
  },
  {
    name: "AI & Analytics",
    href: "/services#ai",
    icon: Cpu,
    description: "AI & Machine Learning",
  },
  {
    name: "Salesforce",
    href: "/services#salesforce",
    icon: Database,
    description: "CRM Implementation",
  },
  {
    name: "Staffing",
    href: "/services#staffing",
    icon: Users,
    description: "IT Talent Acquisition",
  },
  {
    name: "Training",
    href: "/services#training",
    icon: GraduationCap,
    description: "Corporate Programs",
  },
  {
    name: "Managed Services",
    href: "/services#managed",
    icon: Settings,
    description: "IT Management & Support",
  },
  {
    name: "Outsourcing",
    href: "/services#outsourcing",
    icon: Headphones,
    description: "Business Process Outsourcing",
  },
];

const resources = [
  {
    name: "Ebooks",
    href: "/resources/ebook",
    icon: BookOpen,
    description: "Free guides & whitepapers",
  },
  {
    name: "Blog",
    href: "/resources/blog",
    icon: FileText,
    description: "Latest insights & articles",
  },
  {
    name: "Case Studies",
    href: "/resources/case-studies",
    icon: Briefcase,
    description: "Success stories & results",
  },
];

const aboutItems = [
  {
    name: "About Us",
    href: "/about",
    icon: Users,
    description: "Learn about our company",
  },
  {
    name: "Our Process",
    href: "/about#process",
    icon: Settings,
    description: "How we deliver results",
  },
];

const navigation = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about", hasDropdown: true, dropdownType: "about" },
  { name: "Products", href:"/products"},
  { name: "Services", href: "/services", hasDropdown: true, dropdownType: "services" },
  { name: "Careers", href: "/careers" },
  { name: "Contact", href: "/contact" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated, isLoading, signOut, hasAnyRole } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Get dashboard link based on role
  const getDashboardLink = () => {
    if (hasAnyRole([UserRole.ADMIN])) return "/admin";
    if (hasAnyRole([UserRole.HR])) return "/admin/applications";
    return "/dashboard";
  };

  // Get user initials
  const getUserInitials = () => {
    if (!user?.name) return "U";
    const names = user.name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name[0].toUpperCase();
  };

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
        setMobileDropdown(null);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const getDropdownItems = (type: string) => {
    if (type === "services") return services;
    if (type === "about") return aboutItems;
    return resources;
  };

  const toggleMobileDropdown = (type: string) => {
    setMobileDropdown(mobileDropdown === type ? null : type);
  };

  return (
    <>
      <header
        className={`fixed z-[9999] transition-all duration-500 ease-out ${
          scrolled
            ? "top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl"
            : "top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl"
        }`}
      >
        <nav
          className={`relative mx-auto transition-all duration-500 ease-out ${
            scrolled
              ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-gray-900/5 border border-gray-200/50 rounded-full px-3 sm:px-4 lg:px-6"
              : "bg-white/90 backdrop-blur-md shadow-md shadow-gray-900/5 border border-gray-100 rounded-full px-4 sm:px-6 lg:px-8"
          }`}
          aria-label="Global"
        >
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo - Always visible with proper contrast */}
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Ocean Blue Corporation"
                width={140}
                height={40}
                className="h-7 md:h-8 w-auto"
                priority
              />
            </Link>

            {/* Desktop Navigation - Always visible with proper contrast */}
            <div className="hidden lg:flex lg:items-center lg:gap-1">
              {navigation.map((item) =>
                item.hasDropdown ? (
                  <div
                    key={item.name}
                    className="relative"
                    onMouseEnter={() => setActiveDropdown(item.dropdownType || null)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <button
                      className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        scrolled
                          ? "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      {item.name}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        activeDropdown === item.dropdownType ? "rotate-180" : ""
                      }`} />
                    </button>

                    {/* Dropdown - Dark Flyout Style */}
                    <AnimatePresence>
                      {activeDropdown === item.dropdownType && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute top-full left-1/2 -translate-x-1/2 pt-5"
                        >
                          <div className={`overflow-hidden rounded-3xl bg-white text-sm shadow-lg outline-1 outline-gray-900/5 ${
                            item.dropdownType === "services" ? "w-[580px]" : "w-[320px]"
                          }`}>
                            {/* Menu Items */}
                            <div className={`p-4 ${item.dropdownType === "services" ? "grid grid-cols-2 gap-1" : ""}`}>
                              {getDropdownItems(item.dropdownType || "").map((dropItem) => (
                                <Link
                                  key={dropItem.name}
                                  href={dropItem.href}
                                  className="group relative flex items-start gap-4 rounded-xl p-3"
                                >
                                  <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                                    <dropItem.icon aria-hidden="true" className="w-5 h-5 size-6 text-gray-600 group-hover:text-indigo-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900">
                                      {dropItem.name}
                                      <span className="absolute inset-0" />
                                    </p>
                                    <p className="mt-1 text-gray-600 text-xs leading-relaxed">
                                      {dropItem.description}
                                    </p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      scrolled
                        ? "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              )}

              {/* Auth Section */}
              <div className="ml-4 pl-4 border-l border-gray-200 flex items-center gap-2">
                {isLoading ? (
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                ) : isAuthenticated ? (
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {getUserInitials()}
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
                        userMenuOpen ? "rotate-180" : ""
                      }`} />
                    </button>

                    {/* User Dropdown - Dark Flyout Style */}
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute top-full right-0 pt-5"
                        >
                          <div className="overflow-hidden rounded-3xl bg-slate-900 text-sm shadow-2xl ring-1 ring-white/10 w-72">
                            {/* User Info */}
                            <div className="p-4 border-b border-white/10">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                                  {getUserInitials()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-white truncate">{user?.name}</p>
                                  <p className="text-xs text-slate-400 mt-0.5 truncate">{user?.email}</p>
                                </div>
                              </div>
                              <span className="inline-block mt-3 px-3 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 capitalize">
                                {user?.role}
                              </span>
                            </div>

                            {/* Menu Items */}
                            <div className="p-2">
                              <Link
                                href={getDashboardLink()}
                                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-white/5 transition-colors"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors">
                                  <LayoutDashboard className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                                </div>
                                <span className="font-medium">Dashboard</span>
                              </Link>
                              <Link
                                href="/dashboard/settings"
                                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-white/5 transition-colors"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors">
                                  <Settings className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                                </div>
                                <span className="font-medium">Settings</span>
                              </Link>
                            </div>

                            {/* Sign Out */}
                            <div className="border-t border-white/10">
                              <button
                                onClick={() => {
                                  setUserMenuOpen(false);
                                  signOut();
                                }}
                                className="w-full flex items-center justify-center gap-2 p-4 font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <LogOut className="w-5 h-5" />
                                Sign Out
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <>
                    <Link
                      href="/auth/signin"
                      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 transition-all shadow-sm hover:shadow-md"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile menu button - Always visible */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">{mobileMenuOpen ? "Close menu" : "Open menu"}</span>
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Mobile menu - Simple overlay without animations */}
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="lg:hidden fixed inset-0 top-0 z-[9998]"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setMobileDropdown(null);
                }}
              />
              {/* Menu Panel */}
              <div className="lg:hidden fixed top-20 md:top-24 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white z-[9999] overflow-y-auto shadow-2xl rounded-3xl border border-gray-100 max-h-[calc(100vh-6rem)]">
                <div className="px-4 sm:px-6 py-6">
                  <div className="space-y-1">
                    {navigation.map((item) => (
                      <div key={item.name} className="border-b border-gray-100 last:border-b-0">
                        {item.hasDropdown ? (
                          <div>
                            <button
                              onClick={() => toggleMobileDropdown(item.dropdownType || "")}
                              className="w-full flex items-center justify-between py-4 text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              <span className="font-medium text-base">{item.name}</span>
                              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                                mobileDropdown === item.dropdownType ? "rotate-180" : ""
                              }`} />
                            </button>

                            {mobileDropdown === item.dropdownType && (
                              <div className="pb-4 space-y-2">
                                {getDropdownItems(item.dropdownType || "").map((dropItem) => (
                                  <Link
                                    key={dropItem.name}
                                    href={dropItem.href}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
                                    onClick={() => {
                                      setMobileMenuOpen(false);
                                      setMobileDropdown(null);
                                    }}
                                  >
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0`}>
                                      <dropItem.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 text-sm">
                                        {dropItem.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {dropItem.description}
                                      </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  </Link>
                                ))}

                                {item.dropdownType !== "about" && (
                                  <Link
                                    href={item.dropdownType === "services" ? "/services" : "/resources"}
                                    className="flex items-center justify-between p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all mt-2"
                                    onClick={() => {
                                      setMobileMenuOpen(false);
                                      setMobileDropdown(null);
                                    }}
                                  >
                                    <span className="text-sm font-medium text-blue-700">
                                      View all {item.dropdownType}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-blue-600" />
                                  </Link>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Link
                            href={item.href}
                            className="flex items-center justify-between py-4 text-gray-900 hover:text-blue-600 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="font-medium text-base">{item.name}</span>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Mobile Auth Section */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    {isLoading ? (
                      <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                    ) : isAuthenticated ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-semibold text-base shadow-sm">
                            {getUserInitials()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 capitalize">
                              {user?.role}
                            </span>
                          </div>
                        </div>
                        <Link
                          href={getDashboardLink()}
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-5 h-5 text-gray-400" />
                          <span className="font-medium text-sm">Dashboard</span>
                        </Link>
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            signOut();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <LogOut className="w-5 h-5" />
                          <span className="font-medium text-sm">Sign Out</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Link
                          href="/auth/signin"
                          className="block w-full px-4 py-3 text-center text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/auth/signup"
                          className="block w-full px-4 py-3 text-center text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Create Account
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </nav>
      </header>
    </>
  );
}
