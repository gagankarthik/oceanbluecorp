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
  "/admin/resumes": ALL_STAFF,
  "/admin/contacts": [UserRole.ADMIN, UserRole.HR], // RECRUITER/SALES cannot access
  "/admin/clients": [UserRole.ADMIN, UserRole.HR], // RECRUITER/SALES cannot access
  "/admin/vendors": [UserRole.ADMIN, UserRole.HR], // RECRUITER/SALES cannot access
  "/admin/content": [UserRole.ADMIN],
  "/admin/users": [UserRole.ADMIN],
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
