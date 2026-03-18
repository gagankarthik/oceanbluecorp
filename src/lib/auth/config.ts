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

// User roles enum
export enum UserRole {
  ADMIN = "admin",
  HR = "hr",
  USER = "user",
}

// Role hierarchy for permission checking
export const roleHierarchy: Record<UserRole, number> = {
  [UserRole.ADMIN]: 3,
  [UserRole.HR]: 2,
  [UserRole.USER]: 1,
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
    signUp: `${domain}/signup?client_id=${clientId}&response_type=${responseType}&scope=${scope}&redirect_uri=${redirectUri}`,
    signOut: `${domain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(cognitoAuthConfig.post_logout_redirect_uri)}`,
  };
};

// Route access configuration
export const routeAccess: Record<string, UserRole[]> = {
  "/admin": [UserRole.ADMIN],
  "/admin/jobs": [UserRole.ADMIN, UserRole.HR],
  "/admin/applications": [UserRole.ADMIN, UserRole.HR],
  "/admin/content": [UserRole.ADMIN],
  "/admin/settings": [UserRole.ADMIN],
  "/hr": [UserRole.ADMIN, UserRole.HR],
  "/dashboard": [UserRole.ADMIN, UserRole.HR, UserRole.USER],
};
