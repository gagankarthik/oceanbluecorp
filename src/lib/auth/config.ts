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
  "/admin/settings": [UserRole.ADMIN],
  "/admin/docs": ALL_STAFF,
  "/admin/help": ALL_STAFF,
  "/admin/notifications": ALL_STAFF,
  "/hr": [UserRole.ADMIN, UserRole.HR],
};
