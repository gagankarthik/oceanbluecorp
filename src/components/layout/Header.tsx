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
  Settings,
  Headphones,
  Wrench,
  LogOut,
  LayoutDashboard,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import {
  IllDocs, IllBlog, IllNews, IllStories, IllCases,
  IllBuilding, IllTeam, IllCareers, IllContact, IllPositions, IllProducts, IllBrandKit,
} from "@/components/landing/motifs/Motifs";
import { useAuth, UserRole } from "@/lib/auth";
import { IconHrPortal } from "@/components/admin/icons";

// Four core practices, used by both the desktop dropdown and the mobile menu.
const solutions = [
  { name: "IT Staffing & Talent",          href: "/solutions/staffing",    icon: Users,      description: "Specialists, embedded fast" },
  { name: "Engineering Talent & Services", href: "/solutions/engineering", icon: Wrench,     description: "Mechanical, electrical, aerospace" },
  { name: "IT Solutions",                  href: "/solutions/cloud",       icon: Cpu,        description: "Cloud, AI, security & ERP" },
  { name: "Managed Services",              href: "/solutions/managed",     icon: Headphones, description: "24/7 operations, one SLA" },
];

const navigation = [
  { name: "About", href: "/about", hasDropdown: true, dropdownType: "about" },
  { name: "Solutions", href: "/solutions", hasDropdown: true, dropdownType: "solutions" },
  { name: "Resources", href: "/developers", hasDropdown: true, dropdownType: "resources" },
  { name: "Careers", href: "/careers" },
  // Contact is deliberately absent, it renders as an action at the right end
  // of the bar, not as a centred nav item. The mobile menu adds it back, since
  // there is no separate action row there.
];

/* ============================================================
   MEGA-MENU COMPONENTS, large enterprise dropdowns
   ============================================================ */

/* Built to the reference site's own menu anatomy, which is a specific and
   deliberate shape rather than a generic dropdown:

     · The panel is FULL BLEED. It spans the viewport and drops from the
       header's bottom edge as one sheet, instead of a narrow rounded card
       floating under whichever word you hovered. That is why theirs reads
       as part of the chrome and a card reads as a popup.
     · Columns, split by vertical hairlines, each under a plain heading.
       The heading is the taxonomy; the grouping is the information.
     · Rows are a NAME and nothing else, with a right arrow parked at the
       column's right edge. No descriptions, no icons, no chips. A menu is
       for choosing a destination, not for explaining it, the description
       belongs on the page you land on.
     · Square corners and a hairline base. No radius, no drop shadow. */

type MenuItem = {
  name: string;
  href: string;
  /** Drawn from the shared motif set. Optional, and carried only by the CELL
   *  menus (About, Resources), whose entries are different kinds of thing. The
   *  Solutions columns stay bare: those entries are all one kind of thing, and
   *  a wrench beside "Engineering Talent" would tell you nothing the words do
   *  not, decoration standing in for a distinction. */
  Icon?: (p: { className?: string }) => React.ReactElement;
  /** The icon's hue. Two tones of one colour, see the note in Motifs. */
  tint?: string;
  /** Cell layouts only. Column layouts stay a name and an arrow. */
  description?: string;
};

type MenuColumn = { heading: string; items: MenuItem[] };

const SOLUTIONS_COLUMNS: MenuColumn[] = [
  {
    heading: "Practices",
    items: [
      { name: "IT Staffing & Talent", href: "/solutions/staffing" },
      { name: "Engineering Talent", href: "/solutions/engineering" },
      { name: "Managed Services", href: "/solutions/managed" },
    ],
  },
  {
    heading: "Platform & cloud",
    items: [
      { name: "Cloud Engineering", href: "/solutions/cloud" },
      { name: "Cybersecurity", href: "/solutions/cybersecurity" },
      { name: "ERP Solutions", href: "/solutions/erp" },
      { name: "Salesforce Services", href: "/solutions/salesforce" },
    ],
  },
  {
    heading: "Data & change",
    items: [
      { name: "AI & Data Intelligence", href: "/solutions/ai" },
      { name: "Digital Transformation", href: "/solutions/transformation" },
    ],
  },
];

/* About moves to cells for the same reason Resources did: these six are six
   different kinds of thing, a company page, a roster, a job board, a form, and a bare list of names makes a reader work out which is which. The two
   headings that used to group them ("The firm" / "Working with us") were
   doing that job with words; the drawings do it faster. */
const ABOUT_CELLS: MenuItem[] = [
  { name: "About Us", href: "/about", description: "Who we are, and how we actually work", Icon: IllBuilding, tint: "#1d4ed8" },
  { name: "Our Team", href: "/team", description: "The people who lead the engagements", Icon: IllTeam, tint: "#0EA5E9" },
  { name: "Careers", href: "/careers", description: "What the work is like, and how we hire", Icon: IllCareers, tint: "#0D9488" },
  { name: "Open positions", href: "/careers/search", description: "Every role open right now", Icon: IllPositions, tint: "#6366F1" },
  { name: "Contact", href: "/contact", description: "Tell us what you are trying to fix", Icon: IllContact, tint: "#0CACCF" },
];

/* Resources is laid out as CELLS, not a link column, because the reference
   site does exactly this: menus whose entries are all the same kind of thing
   (its Solutions, our practices) get bordered columns of plain links, while
   menus whose entries are different kinds of thing (its Platform, our
   resources) get a grid of cells carrying a line of description and a
   coloured glyph in the corner. A menu should be shaped by what is in it.

   One narrow card holding five links also sat marooned in the middle of a
   full-width sheet. Two columns of cells fill the measure the way theirs do.

   The five hues are all cool blues and teals, so the grid reads as coloured
   without importing an accent the rest of the site does not use. */
const RESOURCES_CELLS: MenuItem[] = [
  { name: "Developer documentation", href: "/developers", description: "The Job Feed API: auth, endpoints, schemas", Icon: IllDocs, tint: "#1d4ed8" },
  { name: "Blog", href: "/blog", description: "Notes from the people doing the work", Icon: IllBlog, tint: "#0CACCF" },
  { name: "News", href: "/news", description: "Announcements, certifications, milestones", Icon: IllNews, tint: "#6366F1" },
  { name: "Customer stories", href: "/customer-stories", description: "What it is like to work with us, in their words", Icon: IllStories, tint: "#0EA5E9" },
  { name: "Case studies", href: "/case-studies", description: "The problem, the team, what changed", Icon: IllCases, tint: "#0D9488" },
  { name: "Products", href: "/products", description: "Software we own end to end", Icon: IllProducts, tint: "#0975C1" },
  { name: "Brand kit", href: "/brand-kit", description: "Logos, colours, and how to use them", Icon: IllBrandKit, tint: "#7C3AED" },
];

/* One table, so adding a menu is adding a row rather than extending a chain
   of ternaries in the render. */
type Menu =
  | { layout: "columns"; columns: MenuColumn[] }
  | { layout: "cells"; cells: MenuItem[] };

const MENUS: Record<string, Menu> = {
  solutions: { layout: "columns", columns: SOLUTIONS_COLUMNS },
  about: { layout: "cells", cells: ABOUT_CELLS },
  resources: { layout: "cells", cells: RESOURCES_CELLS },
};

function MenuLink({ name, href, Icon, tint, onClick }: MenuItem & { onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-center justify-between gap-6 py-2.5 text-[14.5px] text-[var(--hz-text)] transition-colors hover:text-[var(--hz-cobalt)]"
    >
      <span className="flex min-w-0 items-center gap-3">
        {/* A bare glyph, not a tinted rounded chip behind one. The chip is the
            pattern this site keeps removing; the drawing can carry its own
            colour without a box around it. */}
        {Icon && (
          <span style={{ color: tint }} className="flex-none">
            <Icon className="h-[26px] w-[26px]" />
          </span>
        )}
        <span className="truncate">{name}</span>
      </span>
      {/* Parked at the column's right edge and always present, so the rows
          line up as a column of destinations rather than shifting on hover. */}
      <ArrowRight
        className="h-3.5 w-3.5 flex-none text-[var(--hz-text-subtle)] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--hz-cobalt)]"
        strokeWidth={1.75}
      />
    </Link>
  );
}

/** A cell: the glyph in the corner, the name, one line saying what it is.
 *  Used where the entries are different KINDS of thing and the name alone
 *  does not separate them. */
function MenuCell({ name, href, description, Icon, tint, onClick }: MenuItem & { onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-start justify-between gap-4 rounded-lg border border-[var(--hz-paper-line)] bg-white p-4 transition-colors hover:border-[var(--hz-cobalt)]/40"
    >
      <span className="min-w-0">
        <span className="block text-[14.5px] font-semibold text-[var(--hz-text)] transition-colors group-hover:text-[var(--hz-cobalt)]">
          {name}
        </span>
        {description && (
          <span className="mt-1 block text-[12.5px] leading-snug text-[var(--hz-text-mute)]">
            {description}
          </span>
        )}
      </span>
      {/* Corner glyph, as the reference places it, top-right of the cell,
          where it labels the cell without displacing the sentence. */}
      {Icon && (
        <span style={{ color: tint }} className="flex-none">
          <Icon className="h-7 w-7" />
        </span>
      )}
    </Link>
  );
}

function MegaPanel({ menu, onNavigate }: { menu: Menu; onNavigate?: () => void }) {
  return (
    // Sized to its contents, not stretched across the viewport. A full-bleed
    // sheet meant a two-column menu still painted a white band the whole width
    // of the screen, most of it empty, the panel announced far more than it
    // contained. Shrinking it to the cards puts the weight where the links are.
    //
    // Still white, matching the bar it hangs from, and it keeps the square-ish
    // radius and hairline of the cards inside rather than becoming a popup with
    // its own personality.
    <div className="inline-block rounded-2xl border border-[var(--hz-paper-line)] bg-white px-7 py-6 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.28)]">
      {menu.layout === "cells" ? (
        <div className="grid w-[min(92vw,680px)] gap-3 sm:grid-cols-2">
          {menu.cells.map((it) => (
            <MenuCell key={it.name} {...it} onClick={onNavigate} />
          ))}
        </div>
      ) : (
        <MegaColumns columns={menu.columns} onNavigate={onNavigate} />
      )}
    </div>
  );
}

/* Each column is its OWN bordered card, not a track separated from its
   neighbour by a shared rule. The difference matters: a divided grid reads as
   one table you scan across, whereas separate boxes read as separate lists you
   pick between, which is what these are.

   `items-stretch` squares the bottoms off, with four links in one card and
   two in another, ragged heights would make the shortest look unfinished
   rather than simply shorter. */
function MegaColumns({ columns, onNavigate }: { columns: MenuColumn[]; onNavigate?: () => void }) {
  return (
    <div className="flex flex-wrap items-stretch justify-center gap-3">
      {columns.map((col) => (
        <div
          key={col.heading}
          className="w-full overflow-hidden rounded-lg border border-[var(--hz-paper-line)] bg-white sm:w-[290px]"
        >
          {/* Header band: the taxonomy, and a small dot at the right edge that
              closes the row the arrows below open. */}
          <div className="flex items-center justify-between gap-3 border-b border-[var(--hz-paper-line)] px-4 py-3">
            <span className="text-[14.5px] font-semibold text-[var(--hz-text)]">{col.heading}</span>
            <span aria-hidden className="h-2.5 w-2.5 flex-none rounded-full bg-[var(--hz-paper-line)]" />
          </div>
          <div className="px-4 py-2">
            {col.items.map((it) => (
              // Spread, not a hand-listed set of props, the previous form
              // silently dropped Icon and tint when they were added.
              <MenuLink key={it.name} {...it} onClick={onNavigate} />
            ))}
          </div>
        </div>
      ))}
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

  // One shape for the mobile sheet, whichever menu it came from. The two
  // legacy lists carry a lucide `icon` and a `description`; Resources carries
  // a drawn `Icon` and a `tint`. Normalising here keeps the render from having
  // to know which list it is walking.
  type MobileItem = {
    name: string;
    href: string;
    description?: string;
    Icon?: (p: { className?: string }) => React.ReactElement;
    tint?: string;
  };
  const getDropdownItems = (type: string): MobileItem[] => {
    if (type === "solutions") return solutions.map(({ name, href, description }) => ({ name, href, description }));
    if (type === "about") return ABOUT_CELLS;
    if (type === "resources") return RESOURCES_CELLS;
    return [];
  };

  const toggleMobileDropdown = (type: string) => {
    setMobileDropdown(mobileDropdown === type ? null : type);
  };

  return (
    <>
      <header
        // Duration and curve are deliberately identical to the announcement
        // bar's in LayoutWrapper. The header slides `top` while the bar slides
        // `transform`; on different easings the two separate mid-flight and a
        // sliver of bar shows below the header. Same timing, and they move as
        // one piece.
        // Solid white in both states. Scrolled, this used to go to bg-white/60
        // with a backdrop blur, which meant the bar took on whatever was
        // passing beneath it, over the hero film that is a moving, changing
        // tint, so the nav never settled on one colour and the dropdown sheet
        // (opaque white) no longer matched the bar it hangs from. Scrolling now
        // changes only the shadow, which is the part that actually says "there
        // is content underneath".
        className={`fixed left-0 right-0 ${topOffset} z-[9999] bg-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          scrolled
            ? "border-b border-[var(--hz-paper-line)] shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)]"
            : "border-b border-gray-100"
        }`}
      >
        <nav
          className="relative mx-auto w-full max-w-7xl px-6 sm:px-8 2xl:max-w-[96rem]"
          aria-label="Global"
        >
          <div className="flex items-center justify-between h-16 md:h-[72px]">
            {/* Logo, shrinks slightly on scroll while the nav backdrop blurs */}
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

            {/* Desktop navigation, centred on the header rather than sitting
                in the flex flow. Centred by `justify-between` it would only
                look centred while the logo and the right-hand actions happened
                to be the same width, sign in/out changes that width, and the
                nav would drift. Taking it out of the flow pins it to the true
                centre and holds it there. */}
            <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:flex lg:items-center lg:gap-1">
              {navigation.map((item) =>
                item.hasDropdown ? (
                  <div
                    key={item.name}
                    className="relative"
                    onMouseEnter={() => openMenu(item.dropdownType || null)}
                    onMouseLeave={scheduleClose}
                  >
                    {/* The open item is marked by a rule at the header's own
                        bottom edge, which is what ties the panel below to the
                        word that opened it. */}
                    <button
                      className={`relative flex items-center gap-1.5 px-3.5 py-2 text-[14.5px] font-medium transition-colors ${
                        activeDropdown === item.dropdownType
                          ? "text-[var(--hz-text)]"
                          : "text-gray-700 hover:text-[var(--hz-text)]"
                      }`}
                    >
                      {item.name}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        activeDropdown === item.dropdownType ? "rotate-180 text-[var(--hz-text)]" : "text-gray-400"
                      }`} />
                      {activeDropdown === item.dropdownType && (
                        <motion.span
                          layoutId="nav-underline"
                          // 18px is the measured gap between the button's box
                          // and the header's bottom edge at both nav heights
                          // (h-16 and md:h-[72px] each leave the same slack
                          // around a py-2 button), so the rule lands exactly on
                          // the edge the panel drops from.
                          className="absolute inset-x-3 -bottom-[18px] h-[2px] bg-[var(--hz-text)]"
                        />
                      )}
                    </button>
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
            </div>

            {/* Right-hand actions. Contact lives here rather than in the
                centred nav: it is the conversion, not a section of the site,
                and the reference site groups its actions the same way, plain
                links in the middle, the things you want people to press at the
                end of the bar. */}
            <div className="hidden lg:flex lg:items-center lg:gap-4">
              {/* Auth Section, signing in is a utility, not the thing we want
                  people to do, so it is a plain link. The single filled pill on
                  the bar belongs to the one action we are actually asking for. */}
              <div className="flex items-center gap-2">
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
                                <IconHrPortal className="h-4 w-4 text-slate-400" strokeWidth={2} />
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
                    className="text-[14.5px] font-medium text-gray-700 transition-colors hover:text-[var(--hz-text)]"
                  >
                    Sign in
                  </Link>
                )}
              </div>

              {/* The one filled control on the bar. */}
              <Link
                href="/contact"
                className="rounded-full bg-[var(--hz-cobalt)] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[var(--hz-cobalt-600)]"
              >
                Contact
              </Link>
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
                    {/* Contact is appended here. On desktop it is an action at
                        the right end of the bar; the mobile sheet has no such
                        row, so without this it would drop off the menu. */}
                    {[...navigation, { name: "Contact", href: "/contact" }].map((item) => (
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
                                    {/* Resources rows carry a drawn icon in its
                                        own hue; Solutions and About do not, and
                                        the tinted rounded chip that used to sit
                                        here is the pattern the desktop menu
                                        dropped. */}
                                    {dropItem.Icon && (
                                      <span style={{ color: dropItem.tint }} className="flex-shrink-0">
                                        <dropItem.Icon className="h-7 w-7" />
                                      </span>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 text-sm">
                                        {dropItem.name}
                                      </p>
                                      {dropItem.description && (
                                        <p className="text-xs text-gray-500">
                                          {dropItem.description}
                                        </p>
                                      )}
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
                          <IconHrPortal className="w-5 h-5 text-gray-400" />
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

        {/* The mega panel lives HERE, a sibling of the nav, not a child of
            the hovered item. Inside the nav it would be trapped in the
            max-w-7xl measure and anchored to one word; out here it spans the
            fixed header's full width and drops from its bottom edge as one
            sheet, which is the whole difference between a menu and a popup.

            Hover handlers are repeated on the panel so moving the pointer
            down into it does not count as leaving the trigger. */}
        <AnimatePresence>
          {activeDropdown && MENUS[activeDropdown] && (
            <motion.div
              // A CONSTANT key, deliberately. Keyed on the menu name, moving
              // from Solutions to Resources unmounted one panel and mounted
              // another, so AnimatePresence rendered both at once, two sheets
              // stacked at the same top-full position, overlapping. With one
              // key the panel stays put and only its contents swap, which is
              // also how the reference behaves: the sheet opens once and
              // changes under you as you move along the bar.
              key="mega-panel"
              onMouseEnter={() => openMenu(activeDropdown)}
              onMouseLeave={scheduleClose}
              // Wiped down from the header edge, not faded in. Opacity on the
              // wrapper makes the whole panel translucent for the length of the
              // transition, and over a dark, busy hero a half-opaque white
              // sheet with the headline showing through it reads as a bug. A
              // clip reveal keeps the panel fully opaque at every frame.
              initial={{ clipPath: "inset(0 0 100% 0)" }}
              animate={{ clipPath: "inset(0 0 0% 0)" }}
              exit={{ clipPath: "inset(0 0 100% 0)" }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              // Centred on the header rather than pinned to both edges, now
              // that the panel is only as wide as its contents. The small top
              // padding is inside the hover area, so the pointer can cross the
              // gap from the trigger without the menu closing under it.
              className="absolute left-1/2 top-full hidden -translate-x-1/2 pt-1.5 lg:block"
            >
              <MegaPanel menu={MENUS[activeDropdown]} onNavigate={() => setActiveDropdown(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
