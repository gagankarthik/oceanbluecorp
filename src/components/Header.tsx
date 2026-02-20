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
    gradient: "from-blue-600 to-indigo-600",
  },
  {
    name: "Cloud Services",
    href: "/services#cloud",
    icon: Cloud,
    description: "Cloud Migration & Management",
    gradient: "from-cyan-600 to-blue-600",
  },
  {
    name: "AI & Analytics",
    href: "/services#ai",
    icon: Cpu,
    description: "AI & Machine Learning",
    gradient: "from-violet-600 to-purple-600",
  },
  {
    name: "Salesforce",
    href: "/services#salesforce",
    icon: Database,
    description: "CRM Implementation",
    gradient: "from-sky-600 to-blue-600",
  },
  {
    name: "Staffing",
    href: "/services#staffing",
    icon: Users,
    description: "IT Talent Acquisition",
    gradient: "from-teal-600 to-cyan-600",
  },
  {
    name: "Training",
    href: "/services#training",
    icon: GraduationCap,
    description: "Corporate Programs",
    gradient: "from-amber-600 to-orange-600",
  },
  {
    name: "Managed Services",
    href: "/services#managed",
    icon: Settings,
    description: "IT Management & Support",
    gradient: "from-rose-600 to-pink-600",
  },
  {
    name: "Outsourcing",
    href: "/services#outsourcing",
    icon: Headphones,
    description: "Business Process Outsourcing",
    gradient: "from-indigo-600 to-blue-600",
  },
];

const resources = [
  {
    name: "Ebooks",
    href: "/resources/ebook",
    icon: BookOpen,
    description: "Free guides & whitepapers",
    gradient: "from-emerald-600 to-teal-600",
  },
  {
    name: "Blog",
    href: "/resources/blog",
    icon: FileText,
    description: "Latest insights & articles",
    gradient: "from-orange-600 to-amber-600",
  },
  {
    name: "Case Studies",
    href: "/resources/case-studies",
    icon: Briefcase,
    description: "Success stories & results",
    gradient: "from-purple-600 to-pink-600",
  },
];

const aboutItems = [
  {
    name: "About Us",
    href: "/about",
    icon: Users,
    description: "Learn about our company",
    gradient: "from-blue-600 to-cyan-600",
  },
  {
    name: "Our Process",
    href: "/about#process",
    icon: Settings,
    description: "How we deliver results",
    gradient: "from-indigo-600 to-purple-600",
  },
];

const navigation = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about", hasDropdown: true, dropdownType: "about" },
  { name: "Products", href:"/products"},
  { name: "Services", href: "/services", hasDropdown: true, dropdownType: "services" },
  { name: "Resources", href: "/resources", hasDropdown: true, dropdownType: "resources" },
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200" 
            : "bg-white shadow-sm"
        }`}
      >
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Global">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo - Always visible with proper contrast */}
            <Link href="/" className="flex items-center">
              <Image
                src="https://oceanbluecorp.com/images/logo.png"
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

                    {/* Dropdown */}
                    <AnimatePresence>
                      {activeDropdown === item.dropdownType && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-1/2 -translate-x-1/2 pt-4"
                        >
                          <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 p-3 ${
                            item.dropdownType === "services" ? "w-[600px] grid grid-cols-2 gap-1" : "w-[300px]"
                          }`}>
                            {getDropdownItems(item.dropdownType || "").map((dropItem) => (
                              <Link
                                key={dropItem.name}
                                href={dropItem.href}
                                className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group"
                              >
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${dropItem.gradient} flex items-center justify-center shadow-sm group-hover:shadow transition-shadow flex-shrink-0`}>
                                  <dropItem.icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 group-hover:text-gray-900 transition-colors text-sm">
                                    {dropItem.name}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {dropItem.description}
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                              </Link>
                            ))}
                            
                            {/* View all link - only for services and resources */}
                            {item.dropdownType !== "about" && (
                              <Link
                                href={item.dropdownType === "services" ? "/services" : "/resources"}
                                className="col-span-2 mt-1 flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all group"
                              >
                                <span className="text-sm font-medium text-gray-900">
                                  View all {item.dropdownType}
                                </span>
                                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                              </Link>
                            )}
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

                    {/* User Dropdown */}
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full right-0 pt-4"
                        >
                          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 py-2 w-64">
                            <div className="px-4 py-3 border-b border-gray-100">
                              <p className="font-medium text-gray-900 text-sm">{user?.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{user?.email}</p>
                              <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 capitalize">
                                {user?.role}
                              </span>
                            </div>
                            <Link
                              href={getDashboardLink()}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              Dashboard
                            </Link>
                            <Link
                              href="/dashboard/settings"
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Settings className="w-4 h-4" />
                              Settings
                            </Link>
                            <div className="border-t border-gray-100 mt-1 pt-1">
                              <button
                                onClick={() => {
                                  setUserMenuOpen(false);
                                  signOut();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <LogOut className="w-4 h-4" />
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
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 transition-all shadow-sm"
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
                className="lg:hidden fixed inset-0 top-16 md:top-20 bg-black/20 z-40"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setMobileDropdown(null);
                }}
              />
              {/* Menu Panel */}
              <div className="lg:hidden fixed top-16 md:top-20 right-0 bottom-0 w-full sm:w-96 bg-white z-50 overflow-y-auto shadow-xl">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setMobileDropdown(null);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                  </button>
                </div>
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
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${dropItem.gradient} flex items-center justify-center flex-shrink-0`}>
                                      <dropItem.icon className="w-5 h-5 text-white" />
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
                          className="block w-full px-4 py-3 text-center text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-colors"
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

      {/* Spacer to prevent content from hiding under fixed header */}
      <div className="h-16 md:h-20" />
    </>
  );
}