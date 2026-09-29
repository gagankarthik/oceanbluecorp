"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserManager } from "@/lib/auth/AuthContext";
import { UserRole, highestStaffRole, landingRouteFor } from "@/lib/auth/config";
import Link from "next/link";
import { IconArrowRight, IconCheck, IconX, IconRefresh } from "@/components/site/icons";
import { AuthShell, IconShield, StatusMark } from "../auth-shell";

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
const HR_PORTAL_URL = "https://hr.oceanbluecorp.com";

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
            router.push("/auth/signin");
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
    "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-cobalt px-6 type-label text-white transition-colors duration-150 hover:bg-cobalt-deep";
  const quietCls = "inline-flex h-11 items-center justify-center type-label font-medium text-ink-muted transition-colors duration-150 hover:text-ink";

  const panel =
    status === "no_access"
      ? { kicker: "Signed in, no staff role", title: "Wrong door.", body: "This account is valid, but it has no role on the staff site. The HR portal is a separate sign-in." }
      : status === "error"
        ? { kicker: "Sign-in", title: "That did not complete.", body: "Nothing is lost. Start the sign-in again; if it keeps failing, your administrator can check the account." }
        : { kicker: "", title: "The staff console.", body: "Checking your sign-in and preparing your session. This takes a moment." };

  return (
    <AuthShell kicker={panel.kicker} title={panel.title} body={panel.body}>
      <div key={status} className="rise text-center" role="status" aria-live="polite">
        {status === "verifying" && (
          <>
            <StatusMark tone="neutral">
              <IconShield size={28} />
            </StatusMark>
            <h1 className="mt-6 type-headline-sm text-ink">Verifying your sign-in</h1>
            <p className="mt-2 type-body text-ink-muted">Please wait while we complete authentication.</p>
            <ol className="mx-auto mt-8 max-w-[280px] space-y-3 text-left">
              {steps.map((st) => (
                <li key={st.label} className="flex items-center gap-3">
                  <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${st.completed ? "bg-success text-white" : "border border-line-strong"}`}>
                    {st.completed ? (
                      <IconCheck size={14} strokeWidth={2.5} />
                    ) : (
                      <span className="size-3 animate-spin rounded-full border-2 border-cobalt-tint border-t-cobalt" />
                    )}
                  </span>
                  <span className={`type-body-sm ${st.completed ? "text-ink" : "text-ink-subtle"}`}>{st.label}</span>
                </li>
              ))}
            </ol>
          </>
        )}

        {status === "success" && (
          <>
            <StatusMark tone="success">
              <IconCheck size={30} strokeWidth={2} />
            </StatusMark>
            <h1 className="mt-6 type-headline-sm text-ink">Welcome back</h1>
            <p className="mt-2 type-body text-ink-muted">
              Signed in
              {userRole ? (
                <>
                  {" "}
                  as <span className="font-semibold text-ink">{userRole}</span>
                </>
              ) : null}
              .
            </p>
            <p className="mt-6 inline-flex items-center gap-2 type-label text-success">
              Taking you to the console <IconArrowRight size={16} />
            </p>
          </>
        )}

        {status === "email_verified" && (
          <>
            <StatusMark tone="success">
              <IconCheck size={30} strokeWidth={2} />
            </StatusMark>
            <h1 className="mt-6 type-headline-sm text-ink">Email verified</h1>
            <p className="mt-2 type-body text-ink-muted">Your email has been verified. Please sign in to continue.</p>
            <p className="mt-6 inline-flex items-center gap-2 type-label text-success">
              Taking you to sign in <IconArrowRight size={16} />
            </p>
          </>
        )}

        {status === "no_access" && (
          <>
            <StatusMark tone="neutral">
              <IconShield size={28} />
            </StatusMark>
            <h1 className="mt-6 type-headline-sm text-ink">No access to the staff site</h1>
            <p className="mt-2 type-body text-ink-muted">
              This account has no staff role here. If you were looking for your leave, attendance, documents or the handbook, those live in the HR portal, which is a
              separate sign-in with the credentials HR issued you.
            </p>
            <div className="mt-8 grid gap-2">
              <a href={HR_PORTAL_URL} className={primaryCls}>
                Go to the HR portal <IconArrowRight size={16} />
              </a>
              <Link href="/" className={quietCls}>
                Back to the website
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <StatusMark tone="danger">
              <IconX size={28} strokeWidth={2} />
            </StatusMark>
            <h1 className="mt-6 type-headline-sm text-ink">Sign-in didn&apos;t complete</h1>
            <p className="mt-2 type-body text-ink-muted">We couldn&apos;t finish signing you in.</p>
            {error && <p className="mt-5 rounded-xl border border-danger/20 bg-danger-container px-4 py-3 text-left type-body-sm text-danger">{error}</p>}
            <div className="mt-8 grid gap-2">
              <button type="button" onClick={() => router.push("/auth/signin")} className={primaryCls}>
                <IconRefresh size={16} /> Try again
              </button>
              <Link href="/" className={quietCls}>
                Back to the website
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthShell>
  );
}
