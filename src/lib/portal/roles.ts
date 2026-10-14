/**
 * Portal roles and navigation. Access is decided by routeAccess in
 * lib/auth/config; the API routes enforce the same sets server-side.
 */
import type { IconName } from "@/components/portal/icons";
import { UserRole, routeAccess } from "@/lib/auth/config";

export type Role = "admin" | "hr" | "recruiter" | "sales" | "marketing";

export const roles: Record<Role, { label: string; description: string }> = {
  admin: { label: "Admin", description: "Full access to every section, setting and account." },
  hr: { label: "HR", description: "Recruiting, contacts, clients, vendors, publishing and staff accounts." },
  recruiter: { label: "Recruiter", description: "Applications, the bench and resumes. Reads job postings without editing them." },
  sales: { label: "Sales", description: "Applications, the bench and resumes. Creates and edits job postings." },
  marketing: { label: "Media", description: "Blog, case studies, news, customer stories and job posting copy. No candidate, client or rate data." },
};

/** Who sees an item is canAccess(routeAccess), never a list kept here. */
export type NavItem = { href: string; label: string; icon: IconName };
export type NavGroup = { title: string; items: NavItem[] };

export const nav: NavGroup[] = [
  {
    title: "Recruiting",
    items: [
      { href: "/portal", label: "Dashboard", icon: "dashboard" },
      { href: "/portal/state-roles", label: "State Roles", icon: "capitol" },
      { href: "/portal/open-roles", label: "Open Roles", icon: "briefcase" },
      { href: "/portal/applications", label: "Applications", icon: "inbox" },
      { href: "/portal/talent-bench", label: "Talent Bench", icon: "bench" },
      { href: "/portal/resumes", label: "Resumes", icon: "resume" },
    ],
  },
  {
    title: "Relationships",
    items: [
      { href: "/portal/contacts", label: "Contacts", icon: "contact" },
      { href: "/portal/clients", label: "Clients", icon: "building" },
      { href: "/portal/vendors", label: "Vendors", icon: "handshake" },
    ],
  },
  {
    title: "Publishing",
    items: [
      { href: "/portal/blog", label: "Blog", icon: "pen" },
      { href: "/portal/case-studies", label: "Case Studies", icon: "chart" },
      { href: "/portal/customer-stories", label: "Customer Stories", icon: "quote" },
      { href: "/portal/news", label: "News", icon: "megaphone" },
    ],
  },
  {
    title: "Workspace",
    items: [
      { href: "/portal/content", label: "Content", icon: "layers" },
      { href: "/portal/users", label: "Users", icon: "shield" },
      { href: "/portal/developer", label: "Developer", icon: "code" },
    ],
  },
];

export const navItems = nav.flatMap((g) => g.items);

const TO_USER_ROLE: Record<Role, UserRole> = {
  admin: UserRole.ADMIN,
  hr: UserRole.HR,
  recruiter: UserRole.RECRUITER,
  sales: UserRole.SALES,
  marketing: UserRole.MEDIA,
};

export const toUserRole = (r: Role) => TO_USER_ROLE[r];

/** Same longest-prefix rule the API guards mirror; a path with no entry is open to every staff role. */
export function canAccess(role: Role, href: string) {
  const match = Object.keys(routeAccess)
    .filter((p) => href === p || href.startsWith(p + "/"))
    .sort((a, b) => b.length - a.length)[0];
  return match ? routeAccess[match].includes(TO_USER_ROLE[role]) : true;
}

export type PortalUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  status: "Active" | "Invited" | "Suspended";
  lastActive: string;
};
