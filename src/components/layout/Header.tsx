"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Cloud,
  Users,
  Cpu,
  Shield,
  Lightbulb,
  Building,
  BarChart3,
  Settings,
  Headphones,
  BookOpen,
  FileText,
  Briefcase,
  LogOut,
  LayoutDashboard,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth";

// Flat list (still used by mobile menu)
const services = [
  { name: "IT Staffing & Talent", href: "/services#staffing",      icon: Users,      description: "Specialists, embedded fast"   },
  { name: "Cloud Engineering",    href: "/services#cloud",         icon: Cloud,      description: "Migrate, modernize, scale"    },
  { name: "Cybersecurity",        href: "/services#cybersecurity", icon: Shield,     description: "Protect what matters"         },
  { name: "ERP Solutions",        href: "/services#erp",           icon: BarChart3,  description: "SAP, Oracle, Dynamics"        },
  { name: "Salesforce",           href: "/services#salesforce",    icon: Settings,   description: "CRM that fits your business"  },
  { name: "AI & Data Intelligence", href: "/services#ai",          icon: Cpu,        description: "Practical AI & analytics"     },
  { name: "Managed Services",     href: "/services#managed",       icon: Headphones, description: "24/7 operations, one SLA"     },
  { name: "Digital Transformation", href: "/services#transformation", icon: Lightbulb, description: "Strategy & execution"       },
];

const servicesFeature = {
  eyebrow: "One partner",
  title: "Talent, technology, and operations",
  body:  "Bring us a roster gap, a platform to modernize, or a system to keep running — we cover it end to end, on one SLA.",
  href:  "/services",
  cta:   "Explore all services",
};

const resources = [
  { name: "Ebooks",       href: "/resources/ebook",        icon: BookOpen,  description: "Free guides & whitepapers"   },
  { name: "Blog",         href: "/resources/blog",         icon: FileText,  description: "Latest insights & articles"  },
  { name: "Case Studies", href: "/resources/case-studies", icon: Briefcase, description: "Success stories & results"   },
];

const aboutItems = [
  { name: "About Us",  href: "/about",      icon: Building,   description: "Our story, principles, and how we work." },
  { name: "Our Team",  href: "/team",       icon: Users,      description: "Meet the leadership behind the practice." },
  { name: "Careers",   href: "/careers",    icon: Briefcase,  description: "Open roles and life at Ocean Blue." },
];

const aboutFeature = {
  eyebrow: "Our approach",
  title: "How we partner with enterprises",
  body:  "A single accountable team, a consolidated SLA, and quarterly business reviews against the outcomes you set.",
  href:  "/about",
  cta:   "Read our approach",
};

const navigation = [
  { name: "Services", href: "/services", hasDropdown: true, dropdownType: "services" },
  { name: "Products", href: "/products" },
  { name: "About", href: "/about", hasDropdown: true, dropdownType: "about" },
  { name: "Careers", href: "/careers" },
  { name: "Contact", href: "/contact" },
];

/* ============================================================
   MEGA-MENU COMPONENTS — large enterprise dropdowns
   ============================================================ */

function MenuTile({
  name, href, description, icon: Icon, onClick,
}: {
  name: string;
  href: string;
  description: string;
  icon: typeof Cloud;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-[#f1f5f9]"
    >
      <div className="flex size-9 flex-none items-center justify-center rounded-lg border border-[var(--hz-cobalt-100)] bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--hz-text)] transition-colors group-hover:text-[var(--hz-cobalt)]">
          {name}
          <ArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
        </p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--hz-text-subtle)]">{description}</p>
      </div>
    </Link>
  );
}

function FeaturePanel({
  eyebrow, title, body, href, cta, onClick,
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-gradient-to-br from-[var(--hz-cobalt)] to-[var(--hz-cobalt-600)] p-5 text-white"
    >
      <div className="relative">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/85">
          {eyebrow}
        </span>
        <h4 className="mt-3 text-[18px] font-semibold leading-tight tracking-tight">{title}</h4>
        <p className="mt-2 text-[12.5px] leading-relaxed text-white/75">{body}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-semibold transition-all group-hover:gap-1.5">
          {cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

function ServicesMegaMenu({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="w-[720px] max-w-[92vw] overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[var(--reg-shadow-xl)]">
      <div className="grid grid-cols-12">
        {/* All services — balanced two-column tile grid */}
        <div className="col-span-12 p-4 md:col-span-8">
          <p className="px-2.5 pb-2 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--hz-text-subtle)]">
            All services
          </p>
          <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
            {services.map((it) => (
              <MenuTile key={it.name} {...it} onClick={onNavigate} />
            ))}
          </div>
        </div>
        {/* Feature */}
        <div className="col-span-12 bg-[#f8fafc] p-4 md:col-span-4">
          <FeaturePanel {...servicesFeature} onClick={onNavigate} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#e2e8f0] bg-[#f8fafc] px-5 py-2.5">
        <div className="flex items-center gap-2 text-[12px] text-[var(--hz-text-mute)]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#10b981]" />
          <span>Single accountable SLA · quarterly reviews</span>
        </div>
        <Link
          href="/services"
          onClick={onNavigate}
          className="group inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--hz-cobalt)] hover:opacity-80"
        >
          View all services
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

function AboutMegaMenu({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="w-[680px] max-w-[92vw] overflow-hidden rounded-2xl border border-[#e2e8f0] bg-[#ffffff] shadow-[var(--reg-shadow-xl)]">
      <div className="grid grid-cols-12 gap-0">
        <div className="col-span-12 p-6 md:col-span-7">
          <p className="mb-2.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--hz-text-subtle)]">
            The firm
          </p>
          <div className="space-y-0.5">
            {aboutItems.map((it) => (
              <MenuTile key={it.name} {...it} onClick={onNavigate} />
            ))}
          </div>

        </div>
        <div className="col-span-12 bg-[#f8fafc] p-6 md:col-span-5">
          <FeaturePanel {...aboutFeature} onClick={onNavigate} />
        </div>
      </div>
    </div>
  );
}

function ResourcesMegaMenu({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="w-[560px] max-w-[92vw] overflow-hidden rounded-2xl border border-[#e2e8f0] bg-[#ffffff] shadow-[var(--reg-shadow-xl)]">
      <div className="p-6">
        <p className="mb-2.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--hz-text-subtle)]">
          Insights &amp; research
        </p>
        <div className="space-y-0.5">
          {resources.map((it) => (
            <MenuTile key={it.name} {...it} onClick={onNavigate} />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-[#e2e8f0] bg-[#f8fafc] px-6 py-3">
        <span className="text-[12px] text-[var(--hz-text-mute)]">New brief every fortnight</span>
        <Link
          href="/resources"
          onClick={onNavigate}
          className="group inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--hz-text)] hover:text-[var(--hz-cobalt)]"
        >
          Browse all
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function Header({ topOffset = "top-0" }: { topOffset?: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, isLoading, signOut, hasAnyRole } = useAuth();

  // Mega-menu open/close with a small delay so the cursor can travel to the
  // (full-width) panel without it closing.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openMenu = (type: string | null) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveDropdown(type);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 140);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close the account menu on outside click / Escape
  useEffect(() => {
    if (!userMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setUserMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [userMenuOpen]);

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
        className={`fixed left-0 right-0 ${topOffset} z-[9999] transition-all duration-300 ease-out ${
          scrolled
            ? "border-b border-gray-200 bg-white/95 backdrop-blur-md shadow-[0_1px_0_rgba(15,23,42,0.04)]"
            : "border-b border-gray-100 bg-white"
        }`}
      >
        <nav
          className="relative mx-auto w-full max-w-7xl px-6 lg:px-8"
          aria-label="Global"
        >
          <div className="flex items-center justify-between h-16 md:h-[72px]">
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
                    onMouseEnter={() => openMenu(item.dropdownType || null)}
                    onMouseLeave={scheduleClose}
                  >
                    <button
                      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[14px] font-medium transition-colors ${
                        activeDropdown === item.dropdownType
                          ? "text-[var(--hz-cobalt)]"
                          : "text-gray-700 hover:text-[var(--hz-cobalt)]"
                      }`}
                    >
                      {item.name}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        activeDropdown === item.dropdownType ? "rotate-180 text-[var(--hz-cobalt)]" : "text-gray-400"
                      }`} />
                    </button>

                    {/* Mega-menu — wide enterprise dropdown */}
                    <AnimatePresence>
                      {activeDropdown === item.dropdownType && (
                        <motion.div
                          onMouseEnter={() => openMenu(item.dropdownType || null)}
                          onMouseLeave={scheduleClose}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                          className={
                            item.dropdownType === "services"
                              ? "absolute left-0 top-full pt-5"
                              : "absolute left-1/2 top-full -translate-x-1/2 pt-5"
                          }
                        >
                          {item.dropdownType === "services" ? (
                            <ServicesMegaMenu onNavigate={() => setActiveDropdown(null)} />
                          ) : item.dropdownType === "about" ? (
                            <AboutMegaMenu onNavigate={() => setActiveDropdown(null)} />
                          ) : (
                            <ResourcesMegaMenu onNavigate={() => setActiveDropdown(null)} />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="rounded-lg px-3.5 py-2 text-[14px] font-medium text-gray-700 transition-colors hover:text-[var(--hz-cobalt)]"
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
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-2.5 transition-colors hover:border-gray-300 hover:bg-gray-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-[var(--hz-cobalt)] flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {getUserInitials()}
                      </div>
                      <span className="hidden xl:block max-w-[120px] truncate text-[13px] font-semibold text-gray-700">
                        {user?.name?.split(" ")[0] || "Account"}
                      </span>
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
                          <div className="w-72 overflow-hidden rounded-2xl bg-white text-sm shadow-xl ring-1 ring-black/5">
                            {/* User Info */}
                            <div className="bg-gradient-to-br from-[var(--hz-cobalt)] to-[var(--hz-cobalt-600)] p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                                  {getUserInitials()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-white truncate">{user?.name}</p>
                                  <p className="text-xs text-white/70 mt-0.5 truncate">{user?.email}</p>
                                </div>
                              </div>
                              <span className={`inline-block mt-3 px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                                user?.role === "admin" ? "bg-rose-100 text-rose-700" :
                                user?.role === "hr" ? "bg-violet-100 text-violet-700" :
                                user?.role === "recruiter" ? "bg-teal-100 text-teal-700" :
                                user?.role === "sales" ? "bg-amber-100 text-amber-700" :
                                "bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]"
                              }`}>
                                {user?.role === "admin" ? "Administrator" :
                                 user?.role === "hr" ? "HR Manager" :
                                 user?.role === "recruiter" ? "Recruiter" :
                                 user?.role === "sales" ? "Sales" : "User"}
                              </span>
                            </div>

                            {/* Menu Items */}
                            <div className="p-2 space-y-1">
                              <Link
                                href={getDashboardLink()}
                                className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-[var(--hz-cobalt-100)] transition-colors"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--hz-cobalt)] shadow-sm">
                                  <LayoutDashboard className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900">Dashboard</span>
                                  <p className="text-xs text-gray-400">View your overview</p>
                                </div>
                              </Link>
                              {user?.role === "user" ? (
                                <Link
                                  href="/careers"
                                  className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-[var(--hz-cobalt-100)] transition-colors"
                                  onClick={() => setUserMenuOpen(false)}
                                >
                                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 shadow-sm">
                                    <Briefcase className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-900">Browse Jobs</span>
                                    <p className="text-xs text-gray-400">Find your next role</p>
                                  </div>
                                </Link>
                              ) : (
                                <Link
                                  href="/admin/settings"
                                  className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-[var(--hz-cobalt-100)] transition-colors"
                                  onClick={() => setUserMenuOpen(false)}
                                >
                                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 shadow-sm">
                                    <Settings className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-900">Settings</span>
                                    <p className="text-xs text-gray-400">Manage preferences</p>
                                  </div>
                                </Link>
                              )}
                            </div>

                            {/* Sign Out */}
                            <div className="p-2 border-t border-gray-100">
                              <button
                                onClick={() => {
                                  setUserMenuOpen(false);
                                  signOut();
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors"
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
                      className="px-4 py-2 rounded-full text-sm font-semibold bg-[var(--hz-cobalt)] text-white hover:bg-[var(--hz-cobalt-600)] transition-all shadow-sm hover:shadow-md"
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
                              className="w-full flex items-center justify-between py-4 text-gray-900 hover:text-[var(--hz-cobalt)] transition-colors"
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
                                    <div className="w-10 h-10 rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] flex items-center justify-center flex-shrink-0">
                                      <dropItem.icon className="w-5 h-5" strokeWidth={1.75} />
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
                                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--hz-cobalt-100)] hover:brightness-95 transition-all mt-2"
                                    onClick={() => {
                                      setMobileMenuOpen(false);
                                      setMobileDropdown(null);
                                    }}
                                  >
                                    <span className="text-sm font-medium text-[var(--hz-cobalt)]">
                                      View all {item.dropdownType}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-[var(--hz-cobalt)]" />
                                  </Link>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Link
                            href={item.href}
                            className="flex items-center justify-between py-4 text-gray-900 hover:text-[var(--hz-cobalt)] transition-colors"
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
                          <div className="w-12 h-12 rounded-full bg-[var(--hz-cobalt)] flex items-center justify-center text-white font-semibold text-base shadow-sm">
                            {getUserInitials()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] capitalize">
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
                          className="block w-full px-4 py-3 text-center text-sm font-semibold text-white bg-[var(--hz-cobalt)] rounded-xl hover:bg-[var(--hz-cobalt-600)] transition-colors"
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
