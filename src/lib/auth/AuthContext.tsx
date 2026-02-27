"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { UserManager, User, WebStorageStateStore } from "oidc-client-ts";
import { UserRole, roleHierarchy } from "./config";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  groups: string[];
  accessToken: string;
  idToken: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signUp: () => Promise<void>;
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

  // Determine role from groups (prioritize highest role)
  let role = UserRole.USER;
  if (groups.includes("admin")) {
    role = UserRole.ADMIN;
  } else if (groups.includes("hr")) {
    role = UserRole.HR;
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
    userManager.getUser().then((oidcUser) => {
      if (oidcUser && !oidcUser.expired) {
        setUser(parseUser(oidcUser));
      }
      setIsLoading(false);
    }).catch((err) => {
      console.error("Error getting user:", err);
      setIsLoading(false);
    });

    // Handle token refresh events
    const handleUserLoaded = (oidcUser: User) => {
      setUser(parseUser(oidcUser));
    };

    const handleUserUnloaded = () => {
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

  const signUp = useCallback(async () => {
    try {
      const userManager = getUserManager();
      // For Cognito, we use the same authorize endpoint but can add a signup hint
      // The Cognito Hosted UI will show signup by navigating to the signup URL directly
      const signUpUrl = `${process.env.NEXT_PUBLIC_COGNITO_DOMAIN}/signup?client_id=${process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID}&response_type=code&scope=openid+email+phone&redirect_uri=${encodeURIComponent(window.location.origin + "/auth/callback")}`;
      window.location.href = signUpUrl;
    } catch (err) {
      console.error("Sign up error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign up");
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const userManager = getUserManager();
      await userManager.removeUser();
      setUser(null);

      // Clear all oidc related items from localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("oidc.")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // For localhost, skip Cognito logout (it requires logout_uri to be registered)
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

      if (isLocalhost) {
        window.location.href = "/";
        return;
      }

      // For production, redirect to Cognito logout
      const logoutUrl = `${process.env.NEXT_PUBLIC_COGNITO_DOMAIN}/logout?client_id=${process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID}&logout_uri=${encodeURIComponent(window.location.origin)}`;
      window.location.href = logoutUrl;
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }, []);

  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.role === role;
  }, [user]);

  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  }, [user]);

  const hasMinimumRole = useCallback((minimumRole: UserRole): boolean => {
    if (!user) return false;
    return roleHierarchy[user.role] >= roleHierarchy[minimumRole];
  }, [user]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    signIn,
    signUp,
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
