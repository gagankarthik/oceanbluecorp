"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { UserManager, User, WebStorageStateStore } from "oidc-client-ts";
import type { UserProfile } from "oidc-client-ts";
import { UserRole, roleHierarchy } from "./config";
import { writeHrPortalSession, clearHrPortalSession } from "./hrPortalSession";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  // null when the account is authenticated but belongs to no staff group.
  role: UserRole | null;
  groups: string[];
  accessToken: string;
  idToken: string;
}

// signInWithCredentials either establishes a session or, for an invited user
// signing in for the first time, surfaces the Cognito NEW_PASSWORD_REQUIRED
// challenge so the UI can collect a permanent password (plus name/phone).
type SignInResult =
  | { status: "AUTHENTICATED"; user: AuthUser }
  | { status: "NEW_PASSWORD_REQUIRED"; session: string };

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signInWithCredentials: (email: string, password: string) => Promise<SignInResult>;
  completeNewPassword: (params: {
    email: string;
    session: string;
    name: string;
    phone: string;
    password: string;
  }) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasMinimumRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create UserManager configuration
const createUserManagerConfig = () => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return {
    authority: `https://cognito-idp.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID}`,
    client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "",
    redirect_uri: `${origin}/auth/callback`,
    post_logout_redirect_uri: origin,
    response_type: "code",
    scope: "openid email phone",
    userStore: typeof window !== "undefined"
      ? new WebStorageStateStore({ store: window.localStorage })
      : undefined,
    // Cognito specific metadata
    metadata: {
      issuer: `https://cognito-idp.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID}`,
      authorization_endpoint: `${process.env.NEXT_PUBLIC_COGNITO_DOMAIN}/oauth2/authorize`,
      token_endpoint: `${process.env.NEXT_PUBLIC_COGNITO_DOMAIN}/oauth2/token`,
      userinfo_endpoint: `${process.env.NEXT_PUBLIC_COGNITO_DOMAIN}/oauth2/userInfo`,
      end_session_endpoint: `${process.env.NEXT_PUBLIC_COGNITO_DOMAIN}/logout`,
      jwks_uri: `https://cognito-idp.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
    },
  };
};

// Parse Cognito user to our AuthUser format
const parseUser = (oidcUser: User): AuthUser => {
  const profile = oidcUser.profile;

  // Cognito groups are in the cognito:groups claim
  const groups: string[] = (profile as Record<string, unknown>)["cognito:groups"] as string[] || [];

  // Determine role from groups (prioritize highest role). null = no staff
  // group, which grants access to nothing.
  let role: UserRole | null = null;
  if (groups.includes("admin")) {
    role = UserRole.ADMIN;
  } else if (groups.includes("hr")) {
    role = UserRole.HR;
  } else if (groups.includes("recruiter")) {
    role = UserRole.RECRUITER;
  } else if (groups.includes("sales")) {
    role = UserRole.SALES;
  }

  return {
    id: profile.sub || "",
    email: profile.email || "",
    name: profile.name || profile.email || "User",
    phone: profile.phone_number as string | undefined,
    role,
    groups,
    accessToken: oidcUser.access_token,
    idToken: oidcUser.id_token || "",
  };
};

// Mirror the client OIDC session into an httpOnly cookie that authorizes the
// internal API (verified server-side in src/lib/auth/verify.ts). Called whenever
// a session is established or renewed; cleared on sign-out. This is what lets the
// existing admin fetch calls stay unchanged — the browser sends the cookie
// automatically.
async function syncServerSession(idToken: string | undefined, expiresIn?: number) {
  if (!idToken) return;
  try {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: idToken, expiresIn }),
    });
  } catch {
    // Non-fatal: user stays signed in client-side; API calls 401 until the next
    // successful sync, which prompts a re-auth.
  }
}

async function clearServerSession() {
  try {
    await fetch("/api/auth/session", { method: "DELETE" });
  } catch {
    // ignore
  }
}

// Singleton UserManager instance
let userManagerInstance: UserManager | null = null;

const getUserManager = (): UserManager => {
  if (!userManagerInstance && typeof window !== "undefined") {
    userManagerInstance = new UserManager(createUserManagerConfig());
  }
  return userManagerInstance!;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and check for existing session
  useEffect(() => {
    if (typeof window === "undefined") return;

    const userManager = getUserManager();

    // Check for existing session
    userManager.getUser().then(async (oidcUser) => {
      if (oidcUser && !oidcUser.expired) {
        // Set the server cookie before flagging the user as authenticated, so
        // gated admin pages never fire their first fetch without credentials.
        await syncServerSession(oidcUser.id_token, oidcUser.expires_in);
        // Mirror into the shared HR-portal session cookies so a click-through to
        // hr.oceanbluecorp.com lands already signed in.
        writeHrPortalSession({
          idToken: oidcUser.id_token || "",
          accessToken: oidcUser.access_token,
          refreshToken: oidcUser.refresh_token,
        });
        setUser(parseUser(oidcUser));
      }
      setIsLoading(false);
    }).catch((err) => {
      console.error("Error getting user:", err);
      setIsLoading(false);
    });

    // Handle token refresh events
    const handleUserLoaded = (oidcUser: User) => {
      void syncServerSession(oidcUser.id_token, oidcUser.expires_in);
      writeHrPortalSession({
        idToken: oidcUser.id_token || "",
        accessToken: oidcUser.access_token,
        refreshToken: oidcUser.refresh_token,
      });
      setUser(parseUser(oidcUser));
    };

    const handleUserUnloaded = () => {
      void clearServerSession();
      clearHrPortalSession();
      setUser(null);
    };

    const handleSilentRenewError = (err: Error) => {
      console.error("Silent renew error:", err);
      setError("Session refresh failed. Please sign in again.");
    };

    userManager.events.addUserLoaded(handleUserLoaded);
    userManager.events.addUserUnloaded(handleUserUnloaded);
    userManager.events.addSilentRenewError(handleSilentRenewError);

    return () => {
      userManager.events.removeUserLoaded(handleUserLoaded);
      userManager.events.removeUserUnloaded(handleUserUnloaded);
      userManager.events.removeSilentRenewError(handleSilentRenewError);
    };
  }, []);

  const signIn = useCallback(async () => {
    try {
      const userManager = getUserManager();
      await userManager.signinRedirect();
    } catch (err) {
      console.error("Sign in error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign in");
    }
  }, []);

  // Turn a token bundle from our auth API into a stored OIDC session and set
  // the current user. Shared by password sign-in and invite completion.
  const establishSession = useCallback(async (data: {
    accessToken: string;
    idToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }): Promise<AuthUser> => {
    // Decode the IdToken payload (base64url → JSON) to get profile claims
    const payloadB64 = data.idToken.split(".")[1];
    const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const profile = JSON.parse(payloadJson) as UserProfile;

    const userManager = getUserManager();
    const oidcUser = new User({
      access_token: data.accessToken,
      id_token: data.idToken,
      refresh_token: data.refreshToken,
      token_type: "Bearer",
      scope: "openid email phone",
      profile,
      expires_at: Math.floor(Date.now() / 1000) + (data.expiresIn ?? 3600),
    });

    await userManager.storeUser(oidcUser);
    await syncServerSession(data.idToken, data.expiresIn);
    writeHrPortalSession({
      idToken: data.idToken,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    const authUser = parseUser(oidcUser);
    setUser(authUser);
    return authUser;
  }, []);

  const signInWithCredentials = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    const response = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Sign in failed.");
    }

    // First sign-in for an invited user: Cognito asks for a permanent password.
    if (data.challenge === "NEW_PASSWORD_REQUIRED") {
      return { status: "NEW_PASSWORD_REQUIRED", session: data.session };
    }

    const user = await establishSession(data);
    return { status: "AUTHENTICATED", user };
  }, [establishSession]);

  // Answer the NEW_PASSWORD_REQUIRED challenge: set the permanent password and
  // store the user's full name + phone, then establish the session.
  const completeNewPassword = useCallback(async ({
    email, session, name, phone, password,
  }: { email: string; session: string; name: string; phone: string; password: string }): Promise<AuthUser> => {
    const response = await fetch("/api/auth/complete-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, session, name, phone, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not complete your account setup.");
    }

    return establishSession(data);
  }, [establishSession]);

  const signOut = useCallback(async () => {
    // Always clear the local session first, so the app reads as signed-out
    // regardless of what the identity provider does next. Each step is guarded
    // so one failure never blocks the sign-out (this was the "try again" bug —
    // a failed Cognito hosted-logout redirect surfaced as an error).
    try {
      const userManager = getUserManager();
      await userManager.removeUser();
    } catch (err) {
      console.error("removeUser failed (continuing sign-out):", err);
    }
    setUser(null);

    // Clear the server session cookie too (guarded; never blocks sign-out).
    await clearServerSession();
    // Tear down the shared HR-portal cookies so the user is signed out there too.
    clearHrPortalSession();

    try {
      // Clear all oidc.* entries from both storages
      [localStorage, sessionStorage].forEach((store) => {
        const keys: string[] = [];
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i);
          if (k && k.startsWith("oidc.")) keys.push(k);
        }
        keys.forEach((k) => store.removeItem(k));
      });
    } catch (err) {
      console.error("Failed clearing auth storage (continuing):", err);
    }

    // Always a clean LOCAL sign-out → go home. We deliberately do NOT redirect
    // to the Cognito hosted `/logout` endpoint: it only works if logout_uri is
    // registered as an Allowed sign-out URL, otherwise Cognito shows a "please
    // try again" error page — which is exactly what broke sign-out in
    // production. `replace` so Back doesn't return to an authed page.
    if (typeof window !== "undefined") {
      window.location.replace("/");
    }
  }, []);

  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.role === role;
  }, [user]);

  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    return user?.role ? roles.includes(user.role) : false;
  }, [user]);

  const hasMinimumRole = useCallback((minimumRole: UserRole): boolean => {
    if (!user?.role) return false;
    return roleHierarchy[user.role] >= roleHierarchy[minimumRole];
  }, [user]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    signIn,
    signInWithCredentials,
    completeNewPassword,
    signOut,
    hasRole,
    hasAnyRole,
    hasMinimumRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Export getUserManager for use in callback page
export { getUserManager };

// HOC for protecting components
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRoles?: UserRole[]
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading, hasAnyRole, signIn } = useAuth();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        signIn();
      }
    }, [isLoading, isAuthenticated, signIn]);

    if (isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    if (requiredRoles && !hasAnyRole(requiredRoles)) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="mt-2 text-gray-600">You don&apos;t have permission to access this page.</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}
