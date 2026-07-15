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
  Briefcase,
  Wrench,
  LogOut,
  LayoutDashboard,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth";

// Flat list (still used by the mobile menu)
const solutions = [
  { name: "IT Staffing & Talent",         href: "/solutions/staffing",       icon: Users,      description: "Specialists, embedded fast"   },
  { name: "Engineering Talent & Services", href: "/solutions/engineering",            icon: Wrench,     description: "Mechanical, electrical, aerospace" },
  { name: "Cloud Engineering",            href: "/solutions/cloud",          icon: Cloud,      description: "Migrate, modernize, scale"    },
  { name: "Cybersecurity",                href: "/solutions/cybersecurity",  icon: Shield,     description: "Protect what matters"         },
  { name: "ERP Solutions",                href: "/solutions/erp",            icon: BarChart3,  description: "SAP, Oracle, Dynamics"        },
  { name: "Salesforce Services",          href: "/solutions/salesforce",     icon: Settings,   description: "CRM that fits your business"  },
  { name: "AI & Data Intelligence",       href: "/solutions/ai",             icon: Cpu,        description: "Practical AI & analytics"     },
  { name: "Digital Transformation",       href: "/solutions/transformation", icon: Lightbulb,  description: "Strategy & execution"        },
  { name: "Managed Services",             href: "/solutions/managed",        icon: Headphones, description: "24/7 operations, one SLA"     },
];

// Two tidy columns for the desktop dropdown — minimal, no icon chips or blurbs.
const solutionGroups: {
  label: string;
  items: { name: string; href: string; icon: typeof Cloud; badge?: string }[];
}[] = [
  {
    label: "Talent & Engineering",
    items: [
      { name: "IT Staffing & Talent",          href: "/solutions/staffing", icon: Users },
      { name: "Engineering Talent & Services", href: "/solutions/engineering", icon: Wrench },
      { name: "Managed Services",              href: "/solutions/managed",  icon: Headphones },
    ],
  },
  {
    label: "Technology Solutions",
    items: [
      { name: "Cloud Engineering",      href: "/solutions/cloud",          icon: Cloud },
      { name: "Cybersecurity",          href: "/solutions/cybersecurity",  icon: Shield },
      { name: "ERP Solutions",          href: "/solutions/erp",            icon: BarChart3 },
      { name: "Salesforce Services",    href: "/solutions/salesforce",     icon: Settings },
      { name: "AI & Data Intelligence", href: "/solutions/ai",             icon: Cpu },
      { name: "Digital Transformation", href: "/solutions/transformation", icon: Lightbulb },
    ],
  },
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
  { name: "About", href: "/about", hasDropdown: true, dropdownType: "about" },
  { name: "Solutions", href: "/solutions", hasDropdown: true, dropdownType: "solutions" },
  { name: "Products", href: "/products" },
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
      className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-slate-50"
    >
      <div className="flex size-9 flex-none items-center justify-center rounded-lg bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] transition-colors duration-200 group-hover:bg-[var(--hz-cobalt)] group-hover:text-white">
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

// Compact single-line link for the minimal Solutions dropdown.
function MenuLink({
  name, href, icon: Icon, badge, onClick,
}: {
  name: string;
  href: string;
  icon: typeof Cloud;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-center gap-2.5 rounded-lg px-2.5 py-[9px] transition-colors hover:bg-slate-50"
    >
      <Icon
        className="h-[17px] w-[17px] flex-none text-[var(--hz-text-subtle)] transition-colors group-hover:text-[var(--hz-cobalt)]"
        strokeWidth={1.75}
      />
      <span className="flex-1 truncate text-[13.5px] font-medium text-[var(--hz-text)] transition-colors group-hover:text-[var(--hz-cobalt)]">
        {name}
      </span>
      {badge && (
        <span className="flex-none rounded-full bg-[var(--hz-cobalt-100)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--hz-cobalt)]">
          {badge}
        </span>
      )}
      <ArrowRight className="h-3.5 w-3.5 flex-none -translate-x-1 text-[var(--hz-cobalt)] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
    </Link>
  );
}

function SolutionsMegaMenu({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="w-[560px] max-w-[92vw] overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[var(--reg-shadow-xl)]">
      <div className="grid grid-cols-2 gap-x-6 p-3.5">
        {solutionGroups.map((group) => (
          <div key={group.label}>
            <p className="px-2.5 pb-1 pt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--hz-text-subtle)]">
              {group.label}
            </p>
            <div className="mt-0.5">
              {group.items.map((it) => (
                <MenuLink key={it.name} {...it} onClick={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-[#eef2f6] bg-[#f8fafc] px-4 py-2.5">
        <div className="flex items-center gap-2 text-[12px] text-[var(--hz-text-mute)]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#10b981]" />
          <span>One accountable SLA</span>
        </div>
        <Link
          href="/solutions"
          onClick={onNavigate}
          className="group inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--hz-cobalt)] hover:opacity-80"
        >
          View all solutions
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

export default function Header({ topOffset = "top-0" }: { topOffset?: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
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

  // Get dashboard link based on role. Every signed-in user is staff, so this
  // always points into the admin area.
  const getDashboardLink = () => {
    if (hasAnyRole([UserRole.HR])) return "/admin/applications";
    return "/admin";
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
    if (type === "solutions") return solutions;
    if (type === "about") return aboutItems;
    return [];
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
            {/* Logo — shrinks slightly on scroll while the nav backdrop blurs */}
            <Link href="/" aria-label="Ocean Blue Corporation, home" className="flex items-center">
              <Image
                src="/logo.webp"
                alt="Ocean Blue Corporation"
                width={150}
                height={40}
                priority
                className="h-7 w-auto object-contain md:h-9"
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
                          className="absolute left-1/2 top-full -translate-x-1/2 pt-2.5"
                        >
                          {item.dropdownType === "solutions" ? (
                            <SolutionsMegaMenu onNavigate={() => setActiveDropdown(null)} />
                          ) : (
                            <AboutMegaMenu onNavigate={() => setActiveDropdown(null)} />
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
                      <div className="w-8 h-8 overflow-hidden rounded-full bg-[var(--hz-cobalt)] flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {user?.id && !avatarFailed ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/users/avatar/${user.id}`}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={() => setAvatarFailed(true)}
                          />
                        ) : (
                          getUserInitials()
                        )}
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
                          className="absolute top-full right-0 pt-2.5"
                        >
                          <div className="w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[var(--reg-shadow-xl)]">
                            {/* Identity */}
                            <div className="flex items-center gap-3 border-b border-slate-100 px-3.5 py-3">
                              <div className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-full bg-[var(--hz-cobalt)] text-[13px] font-semibold text-white">
                                {user?.id && !avatarFailed ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={`/api/users/avatar/${user.id}`}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    onError={() => setAvatarFailed(true)}
                                  />
                                ) : (
                                  getUserInitials()
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-semibold text-slate-900">{user?.name}</p>
                                <p className="truncate text-[12px] text-slate-500">{user?.email}</p>
                              </div>
                            </div>

                            <div className="px-3.5 pt-2.5">
                              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                {user?.role === "admin" ? "Administrator" :
                                 user?.role === "hr" ? "HR Manager" :
                                 user?.role === "recruiter" ? "Recruiter" :
                                 user?.role === "sales" ? "Sales" : "Staff"}
                              </span>
                            </div>

                            {/* Menu Items */}
                            <div className="p-1.5">
                              <Link
                                href={getDashboardLink()}
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                              >
                                <LayoutDashboard className="h-4 w-4 text-slate-400" strokeWidth={2} />
                                Dashboard
                              </Link>
                              {/* SSO hand-off: the shared Cognito cookies are
                                  already set, so this lands signed-in. */}
                              <a
                                href="https://hr.oceanbluecorp.com/"
                                rel="noopener noreferrer"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                              >
                                <Building className="h-4 w-4 text-slate-400" strokeWidth={2} />
                                HR Portal
                                <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-slate-400" />
                              </a>
                              {hasAnyRole([UserRole.ADMIN]) && (
                                <Link
                                  href="/admin/settings"
                                  onClick={() => setUserMenuOpen(false)}
                                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                >
                                  <Settings className="h-4 w-4 text-slate-400" strokeWidth={2} />
                                  Settings
                                </Link>
                              )}
                            </div>

                            {/* Sign Out */}
                            <div className="border-t border-slate-100 p-1.5">
                              <button
                                onClick={() => {
                                  setUserMenuOpen(false);
                                  signOut();
                                }}
                                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-rose-600 transition-colors hover:bg-rose-50"
                              >
                                <LogOut className="h-4 w-4" strokeWidth={2} />
                                Sign out
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    href="/auth/signin"
                    className="hz-btn-fill rounded-full bg-[var(--hz-cobalt)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile menu button - Always visible */}
            <button
              type="button"
              className="lg:hidden grid h-11 w-11 place-items-center rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
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
              <div className={`lg:hidden fixed left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white z-[9999] overflow-y-auto shadow-2xl rounded-3xl border border-gray-100 ${
                topOffset === "top-0"
                  ? "top-20 md:top-24 max-h-[calc(100dvh-6rem)]"
                  : "top-[7.5rem] md:top-[8.5rem] max-h-[calc(100dvh-9rem)]"
              }`}>
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

                                {item.dropdownType === "solutions" && (
                                  <Link
                                    href="/solutions"
                                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--hz-cobalt-100)] hover:brightness-95 transition-all mt-2"
                                    onClick={() => {
                                      setMobileMenuOpen(false);
                                      setMobileDropdown(null);
                                    }}
                                  >
                                    <span className="text-sm font-medium text-[var(--hz-cobalt)]">
                                      View all solutions
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
                        <a
                          href="https://hr.oceanbluecorp.com/"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Building className="w-5 h-5 text-gray-400" />
                          <span className="font-medium text-sm">HR Portal</span>
                          <ArrowUpRight className="ml-auto w-4 h-4 text-gray-400" />
                        </a>
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
                          className="block w-full px-4 py-3 text-center text-sm font-semibold text-white bg-[var(--hz-cobalt)] rounded-xl hover:bg-[var(--hz-cobalt-600)] transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Sign In
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
