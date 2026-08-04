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

// Staff roles enum. These are the only assignable roles — every account is
// created by an admin via invite and belongs to one of these groups.
export enum UserRole {
  ADMIN = "admin",
  HR = "hr",
  RECRUITER = "recruiter",
  SALES = "sales",
}

// Role hierarchy for permission checking
// RECRUITER and SALES are same level as HR but with limited access
export const roleHierarchy: Record<UserRole, number> = {
  [UserRole.ADMIN]: 4,
  [UserRole.HR]: 3,
  [UserRole.RECRUITER]: 2,
  [UserRole.SALES]: 2,
};

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

const STAFF_ROLE_VALUES: string[] = [UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES];

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

/** True when the group list grants any staff access to this site. */
export function hasStaffAccess(groups: ReadonlyArray<string> | null | undefined): boolean {
  return highestStaffRole(groups) !== null;
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

// Route access configuration — enforced in the admin layout (RBAC). Matched by
// longest path prefix, so detail routes (e.g. /admin/jobs/123) inherit their
// section's access. Every admin route should have an entry here.
const ALL_STAFF = [UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES];
export const routeAccess: Record<string, UserRole[]> = {
  "/admin": ALL_STAFF,
  "/admin/jobs": ALL_STAFF,
  "/admin/applications": ALL_STAFF,
  "/admin/candidates": ALL_STAFF,
  "/admin/bench": ALL_STAFF,
  "/admin/lead-sourcing": ALL_STAFF,
  "/admin/resumes": ALL_STAFF,
  "/admin/contacts": [UserRole.ADMIN, UserRole.HR], // RECRUITER/SALES cannot access
  "/admin/clients": [UserRole.ADMIN, UserRole.HR], // RECRUITER/SALES cannot access
  "/admin/vendors": [UserRole.ADMIN, UserRole.HR], // RECRUITER/SALES cannot access
  "/admin/content": [UserRole.ADMIN],
  // Account administration is shared with HR: they invite staff and manage
  // ordinary accounts. The API still reserves Admin/HR role changes for admins.
  "/admin/users": [UserRole.ADMIN, UserRole.HR],
  "/admin/roles": [UserRole.ADMIN],
  "/admin/api-keys": [UserRole.ADMIN],
  // Settings is PERSONAL for every staff member (Profile / Notifications /
  // Security); the admin-only "System" tab is gated inside the page itself
  // (visibleTabs filter + `activeTab === "site" && isAdmin`). So the route is
  // all-staff — locking it to ADMIN wrongly denied everyone else their own
  // profile.
  "/admin/settings": ALL_STAFF,
  // Admin-only: the page itself wraps in ProtectedRoute[ADMIN] and the layout's
  // "Developer" link is admin-gated, so ALL_STAFF here was the odd one out — a
  // recruiter following a direct link got past the layout check only to hit the
  // page's own guard. Both gates now agree.
  "/admin/docs": [UserRole.ADMIN],
  "/admin/help": ALL_STAFF,
  "/admin/notifications": ALL_STAFF,
  "/hr": [UserRole.ADMIN, UserRole.HR],
};
