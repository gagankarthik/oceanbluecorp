"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth, landingRouteFor } from "@/lib/auth";
import { LoadErrorArt } from "@/components/site/load-error-art";
import { WorkspaceButton } from "@/components/admin/workspace";

// Catches render errors below the admin layout, so the shell survives.
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { user } = useAuth();
  const home = landingRouteFor(user?.role);

  useEffect(() => {
    console.error("[admin] unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center py-8">
      <div className="flex w-full max-w-xl flex-col items-center text-center">
        <LoadErrorArt id="adm-er" className="h-auto w-full max-w-[520px]" />
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--adm-line)] bg-[var(--adm-surface)] px-3 py-1 text-[12.5px] font-medium text-[var(--adm-danger-ink)]">
          <span className="size-1.5 rounded-full bg-[var(--adm-danger)]" aria-hidden />
          Something went wrong
        </p>
        <h1 className="mt-3 text-[24px] font-semibold tracking-[-0.02em] text-[var(--adm-ink)]">
          This page didn&rsquo;t load
        </h1>
        <p className="mt-2 max-w-[46ch] text-[14px] leading-relaxed text-[var(--adm-ink-mute)]">
          It&rsquo;s a problem on our side, not something you did. Trying again usually clears it.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <WorkspaceButton variant="primary" onClick={reset}>Try again</WorkspaceButton>
          <WorkspaceButton asChild>
            <Link href={home}>{home === "/admin" ? "Back to dashboard" : "Go to your workspace"}</Link>
          </WorkspaceButton>
        </div>
        <p className="mt-4 text-[13px] text-[var(--adm-ink-mute)]">
          <Link href="/admin/help" className="font-medium text-[var(--adm-accent)] underline-offset-4 hover:underline">
            Contact support
          </Link>
          {error.digest && (
            <>
              {" "}and quote <span className="font-mono text-[12px] text-[var(--adm-ink)]">{error.digest}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
