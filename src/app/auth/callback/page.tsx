"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserManager } from "@/lib/auth/AuthContext";
import { UserRole, highestStaffRole, landingRouteFor } from "@/lib/auth/config";
import AuthShell from "../AuthShell";
import { Glyph, Mark } from "../status-mark";

type AuthStatus = "verifying" | "success" | "error" | "email_verified" | "no_access";

/** Human titles for this site's staff roles. */
const ROLE_TITLES: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrator",
  [UserRole.HR]: "HR Manager",
  [UserRole.RECRUITER]: "Recruiter",
  [UserRole.SALES]: "Sales",
  [UserRole.MEDIA]: "Media",
};

/** The HR portal, which is a separate sign-in with its own accounts. */
const HR_PORTAL_URL = "https://hr.oceanbluecorp.com/?ref=sign-in";

export default function CallbackPage() {
  const [status, setStatus] = useState<AuthStatus>("verifying");
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if we have the required OAuth parameters in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");

        // If no code or state, this might be an email verification redirect
        // or direct navigation - redirect to sign in
        if (!code || !state) {
          console.log("No OAuth parameters found, redirecting to sign in...");
          // Show a friendly message for email verification
          setStatus("email_verified");
          setError(null);
          // Redirect to sign in after showing success message
          setTimeout(() => {
            router.push("/auth/sign-in");
          }, 3000);
          return;
        }

        const userManager = getUserManager();

        // Process the callback - this will exchange the code for tokens
        const user = await userManager.signinRedirectCallback();

        if (user) {
          // Groups are namespaced per application, so only this site's roles
          // count here (see lib/auth/config.ts).
          const groups = (user.profile as Record<string, unknown>)["cognito:groups"] as string[] || [];
          const role = highestStaffRole(groups);

          // The user pool is shared with the HR portal, so a placed-workforce
          // account can authenticate against it and still have no business on
          // this site. End the session instead of leaving them signed in with
          // nowhere to go.
          if (!role) {
            await userManager.removeUser().catch(() => {});
            setStatus("no_access");
            return;
          }

          setUserRole(ROLE_TITLES[role]);
          setStatus("success");

          // Redirect after a brief delay to show success state
          // Where this role lands: media has no dashboard, so it goes to its first section.
          setTimeout(() => router.push(landingRouteFor(role)), 2000);
        } else {
          router.push("/");
        }
      } catch (err) {
        console.error("Callback error:", err);
        const errorMessage = err instanceof Error ? err.message : "Authentication failed";

        // Handle specific errors gracefully
        if (errorMessage.includes("No state in response") || errorMessage.includes("state")) {
          // This usually means the user came from email verification
          // Redirect them to sign in
          setStatus("error");
          setError("Please sign in to continue after verifying your email.");
        } else {
          setStatus("error");
          setError(errorMessage);
        }
      }
    };

    handleCallback();
  }, [router]);

  const steps = [
    { label: "Verifying credentials", completed: status !== "verifying" },
    { label: "Exchanging tokens", completed: status === "success" || status === "error" },
    { label: "Setting up session", completed: status === "success" },
  ];

  const primaryCls =
    "flex min-h-12 w-full items-center justify-center gap-2 bg-ocean-600 font-medium text-white transition-colors hover:bg-ocean-700 active:scale-[0.99]";
  const title = "display text-head-md";

  return (
    <AuthShell>
      <div key={status} role="status" aria-live="polite">
        {status === "verifying" && (
          <>
            <Mark tone="neutral">
              <Glyph name="shield" />
            </Mark>
            <h1 className={`mt-6 ${title}`}>Verifying your sign-in</h1>
            <p className="mt-2 text-mist-600">Please wait while we complete authentication.</p>
            <ol className="mt-8 grid gap-3">
              {steps.map((st) => (
                <li key={st.label} className="flex items-center gap-3">
                  <span className={`grid size-7 shrink-0 place-items-center ${st.completed ? "bg-ocean-600 text-white" : "bg-mist-0 ring-1 ring-inset ring-mist-300"}`}>
                    {st.completed ? (
                      <Glyph name="check" className="size-3.5" />
                    ) : (
                      <span className="size-3 animate-spin rounded-full border-2 border-mist-200 border-t-ocean-600" />
                    )}
                  </span>
                  <span className={`text-small ${st.completed ? "text-navy-900" : "text-mist-600"}`}>{st.label}</span>
                </li>
              ))}
            </ol>
          </>
        )}

        {status === "success" && (
          <>
            <Mark tone="success">
              <Glyph name="check" />
            </Mark>
            <h1 className={`mt-6 ${title}`}>Welcome back</h1>
            <p className="mt-2 text-mist-600">
              Signed in
              {userRole ? (
                <>
                  {" "}
                  as <span className="font-medium text-navy-900">{userRole}</span>
                </>
              ) : null}
              .
            </p>
            <p className="mt-6 inline-flex items-center gap-2 text-small font-medium text-ocean-700">
              Taking you to the console <Glyph name="arrow" className="size-4" />
            </p>
          </>
        )}

        {status === "email_verified" && (
          <>
            <Mark tone="success">
              <Glyph name="check" />
            </Mark>
            <h1 className={`mt-6 ${title}`}>Email verified</h1>
            <p className="mt-2 text-mist-600">Your email has been verified. Please sign in to continue.</p>
            <p className="mt-6 inline-flex items-center gap-2 text-small font-medium text-ocean-700">
              Taking you to sign in <Glyph name="arrow" className="size-4" />
            </p>
          </>
        )}

        {status === "no_access" && (
          <>
            <Mark tone="neutral">
              <Glyph name="shield" />
            </Mark>
            <h1 className={`mt-6 ${title}`}>No access to the staff site</h1>
            <p className="mt-2 text-mist-600">
              This account has no staff role here. If you were looking for your leave, attendance, documents or the handbook, those live in the HR portal, which is a
              separate sign-in with the credentials HR issued you.
            </p>
            <div className="mt-8 grid gap-2">
              <a href={HR_PORTAL_URL} className={primaryCls}>
                Go to the HR portal <Glyph name="arrow" className="size-4" />
              </a>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <Mark tone="danger">
              <Glyph name="x" />
            </Mark>
            <h1 className={`mt-6 ${title}`}>Sign-in didn&apos;t complete</h1>
            <p className="mt-2 text-mist-600">
              We couldn&apos;t finish signing you in. Nothing is lost; if it keeps failing, your administrator can check the account.
            </p>
            {error && <p className="mt-5 bg-buoy-300/30 px-4 py-3 text-small text-navy-900">{error}</p>}
            <div className="mt-8 grid gap-2">
              <button type="button" onClick={() => router.push("/auth/sign-in")} className={primaryCls}>
                <Glyph name="refresh" className="size-4" /> Try again
              </button>
            </div>
          </>
        )}
      </div>
    </AuthShell>
  );
}
