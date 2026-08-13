// AWS Cognito OIDC Configuration - Uses environment variables
export const cognitoAuthConfig = {
  authority: `https://cognito-idp.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID}`,
  client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "",
  redirect_uri: typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  post_logout_redirect_uri: typeof window !== "undefined"
    ? `${window.location.origin}/auth/signout`
    : `${process.env.NEXT_PUBLIC_APP_URL || ""}/auth/signout`,
  response_type: "code",
  scope: "phone openid email",
  automaticSilentRenew: true,
  loadUserInfo: true,
};

// Staff roles enum. These are the only assignable roles, every account is
// created by an admin via invite and belongs to one of these groups.
export enum UserRole {
  ADMIN = "admin",
  HR = "hr",
  RECRUITER = "recruiter",
  SALES = "sales",
  MEDIA = "media",
}

// Role hierarchy for permission checking
// RECRUITER and SALES are same level as HR but with limited access
export const roleHierarchy: Record<UserRole, number> = {
  [UserRole.ADMIN]: 4,
  [UserRole.HR]: 3,
  [UserRole.RECRUITER]: 2,
  [UserRole.SALES]: 2,
  // Lowest, and deliberately NOT comparable to the others: media is not a
  // junior recruiter, it is a different job. `hasMinimumRole` is a ladder and
  // media does not stand on it, which is why access below is granted by naming
  // the role, never by clearing a level.
  [UserRole.MEDIA]: 1,
};

/**
 * WHAT A ROLE IS FOR, not how senior it is.
 *
 * The hierarchy above answers "is this person more senior?", which turns out to
 * be the wrong question almost everywhere. The right one is "does this person
 * do this job?", and these three sets answer it.
 *
 * The reason this exists is the Media role. Before it, every role was a
 * recruiter of some seniority, so "is staff" and "may see candidate data" were
 * the same sentence and `requireStaff` could guard all 41 API routes. Media
 * breaks that: it is a real account on this site that must never see a
 * candidate, an application, a resume, a client or a rate.
 *
 * So the rule is deny-by-default. `requireStaff` now means RECRUITING, and a
 * role not listed in a set gets nothing from it. Adding a limited role must
 * never be one forgotten guard away from handing over the candidate database.
 */
export const RECRUITING_ROLES: UserRole[] = [
  UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES,
];

/** Who may write the public sections (blog, case studies, news, stories). */
export const PUBLISHING_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.HR, UserRole.MEDIA];

/**
 * Who may create or change a job posting.
 *
 * Recruiters and media both READ postings and cannot edit them, for different
 * reasons: a recruiter works the req rather than owning it, media only promotes
 * it. Previously spelled `user?.role !== UserRole.RECRUITER` in four job pages,
 * which is the sort of thing that silently grants a new role edit rights the
 * day it is added.
 */
export const JOB_EDIT_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.HR, UserRole.SALES];

const hasAny = (groups: ReadonlyArray<string> | null | undefined, allowed: UserRole[]): boolean =>
  staffRolesOf(groups).some((r) => allowed.includes(r));

/** Works the recruiting side: candidates, applications, resumes, CRM, rates. */
export const hasRecruitingAccess = (groups: ReadonlyArray<string> | null | undefined): boolean =>
  hasAny(groups, RECRUITING_ROLES);

/** Writes the public content sections. */
export const hasPublishingAccess = (groups: ReadonlyArray<string> | null | undefined): boolean =>
  hasAny(groups, PUBLISHING_ROLES);

/** May create or edit a job posting (as opposed to merely reading one). */
export const canEditJobs = (role: UserRole | null | undefined): boolean =>
  !!role && JOB_EDIT_ROLES.includes(role);

/**
 * Cognito groups are namespaced per application.
 *
 * This site and the HR portal (hr.oceanbluecorp.com) now run on SEPARATE user
 * pools: different accounts, different tokens, no shared session. This pool is
 * the staff pool, and it writes `web:admin`, `web:hr`, `web:recruiter`,
 * `web:sales`.
 *
 * The namespace stays for two reasons. Accounts created before the split are
 * still in this pool and some carry `hr:*` groups, which must go on granting
 * nothing here. And the prefix keeps saying which application a role is about
 * if a third one ever shares this pool.
 *
 * Reads accept both `web:<role>` and the legacy bare `<role>`, so no existing
 * staff member is locked out. A group from another namespace grants nothing.
 */
export const WEBSITE_ROLE_NAMESPACE = "web";
const NAMESPACE_SEPARATOR = ":";

const STAFF_ROLE_VALUES: string[] = [
  UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES, UserRole.MEDIA,
];

/** The Cognito group name this site writes for a role, e.g. "web:admin". */
export function groupNameForRole(role: UserRole | string): string {
  return `${WEBSITE_ROLE_NAMESPACE}${NAMESPACE_SEPARATOR}${role}`;
}

/**
 * Resolve a raw Cognito group to one of THIS site's staff roles.
 * `web:admin` and legacy `admin` both give admin; `hr:admin` and `hr:employee`
 * give null, because they belong to the HR portal.
 */
export function normalizeStaffRole(raw: string | null | undefined): UserRole | null {
  if (!raw) return null;
  const value = raw.toLowerCase().trim();
  if (!value) return null;

  const sep = value.indexOf(NAMESPACE_SEPARATOR);
  if (sep !== -1) {
    const namespace = value.slice(0, sep);
    const role = value.slice(sep + 1);
    if (namespace !== WEBSITE_ROLE_NAMESPACE) return null; // another app's role
    return STAFF_ROLE_VALUES.includes(role) ? (role as UserRole) : null;
  }

  // Legacy unprefixed group.
  return STAFF_ROLE_VALUES.includes(value) ? (value as UserRole) : null;
}

/** Every staff role in a group list that belongs to this site. */
export function staffRolesOf(groups: ReadonlyArray<string> | null | undefined): UserRole[] {
  if (!groups?.length) return [];
  const out = new Set<UserRole>();
  for (const g of groups) {
    const role = normalizeStaffRole(g);
    if (role) out.add(role);
  }
  return [...out];
}

/** The single highest-privilege role a group list grants, or null for none. */
export function highestStaffRole(groups: ReadonlyArray<string> | null | undefined): UserRole | null {
  const owned = staffRolesOf(groups);
  if (owned.length === 0) return null;
  return owned.reduce((best, r) => (roleHierarchy[r] > roleHierarchy[best] ? r : best));
}

/**
 * True when the group list grants an ACCOUNT on this site, any role at all.
 *
 * This is the sign-in gate, not an authorization check. It answers "may this
 * person log in and have their own profile?", and Media passes it. It does NOT
 * answer "may this person see a candidate" — that is `hasRecruitingAccess`.
 * Guarding a recruiting route with this would hand the whole ATS to media.
 */
export function hasStaffAccess(groups: ReadonlyArray<string> | null | undefined): boolean {
  return highestStaffRole(groups) !== null;
}

/**
 * Where a role lands after sign-in.
 *
 * Media has no access to the dashboard (it is a recruiting report), so sending
 * everyone to /admin would greet a new media account with "access denied" as
 * the first thing it ever sees.
 */
export function landingRouteFor(role: UserRole | null | undefined): string {
  return role === UserRole.MEDIA ? "/admin/blog" : "/admin";
}

// Cognito Hosted UI URLs
export const getCognitoUrls = () => {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN || "";
  const clientId = cognitoAuthConfig.client_id;
  const redirectUri = encodeURIComponent(cognitoAuthConfig.redirect_uri);
  const responseType = "code";
  const scope = encodeURIComponent(cognitoAuthConfig.scope);

  return {
    signIn: `${domain}/login?client_id=${clientId}&response_type=${responseType}&scope=${scope}&redirect_uri=${redirectUri}`,
    signOut: `${domain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(cognitoAuthConfig.post_logout_redirect_uri)}`,
  };
};

// Route access configuration, enforced in the admin layout (RBAC). Matched by
// longest path prefix, so detail routes (e.g. /admin/jobs/123) inherit their
// section's access. Every admin route should have an entry here.
//
// ALL_STAFF is the four RECRUITING roles and deliberately excludes Media, so a
// route that says ALL_STAFF keeps meaning what it meant before Media existed.
// Media appears only where it is written out by name, below.
const ALL_STAFF = RECRUITING_ROLES;
/** Every role that may reach a page, including Media. Personal + help routes. */
const EVERY_ROLE = [...RECRUITING_ROLES, UserRole.MEDIA];
export const routeAccess: Record<string, UserRole[]> = {
  // No Media: the dashboard is a recruiting report (pipeline, candidates,
  // sources). `landingRouteFor` sends them to /admin/blog instead.
  "/admin": ALL_STAFF,
  // Media reads postings so they can promote them. The API hands them the
  // public projection, no rates, client or assignees, and JOB_EDIT_ROLES keeps
  // the create/edit controls away from them.
  "/admin/jobs": [...ALL_STAFF, UserRole.MEDIA],
  "/admin/applications": ALL_STAFF,
  "/admin/candidates": ALL_STAFF,
  "/admin/bench": ALL_STAFF,
  "/admin/lead-sourcing": ALL_STAFF,
  "/admin/resumes": ALL_STAFF,
  "/admin/contacts": [UserRole.ADMIN, UserRole.HR], // RECRUITER/SALES cannot access
  "/admin/clients": [UserRole.ADMIN, UserRole.HR], // RECRUITER/SALES cannot access
  "/admin/vendors": [UserRole.ADMIN, UserRole.HR], // RECRUITER/SALES cannot access
  "/admin/content": [UserRole.ADMIN],
  // Publishing. Mirrored by requirePublisher on /api/articles, so the UI gate
  // and the API gate name the same set (PUBLISHING_ROLES) rather than drifting.
  "/admin/blog": PUBLISHING_ROLES,
  "/admin/case-studies": PUBLISHING_ROLES,
  "/admin/customer-stories": PUBLISHING_ROLES,
  "/admin/news": PUBLISHING_ROLES,
  // Account administration is shared with HR: they invite staff and manage
  // ordinary accounts. The API still reserves Admin/HR role changes for admins.
  "/admin/users": [UserRole.ADMIN, UserRole.HR],
  "/admin/roles": [UserRole.ADMIN],
  "/admin/api-keys": [UserRole.ADMIN],
  // Settings is PERSONAL for every staff member (Profile / Notifications /
  // Security); the admin-only "System" tab is gated inside the page itself
  // (visibleTabs filter + `activeTab === "site" && isAdmin`). So the route is
  // all-staff, locking it to ADMIN wrongly denied everyone else their own
  // profile.
  "/admin/settings": EVERY_ROLE,
  // Admin-only: the page itself wraps in ProtectedRoute[ADMIN] and the layout's
  // "Developer" link is admin-gated, so ALL_STAFF here was the odd one out, a
  // recruiter following a direct link got past the layout check only to hit the
  // page's own guard. Both gates now agree.
  "/admin/docs": [UserRole.ADMIN],
  "/admin/help": EVERY_ROLE,
  "/admin/notifications": EVERY_ROLE,
  "/hr": [UserRole.ADMIN, UserRole.HR],
};
