"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, landingRouteFor } from "@/lib/auth";
import { BackLink, WorkspaceButton } from "@/components/admin/workspace";
import { LostIcon } from "@/components/site/StatusCard";

// Rendered inside the admin shell, so the sidebar stays as the way out.
export default function AdminNotFound() {
  const { user } = useAuth();
  const router = useRouter();
  const home = landingRouteFor(user?.role);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <BackLink label="Go back" onClick={() => router.back()} />
      <div className="flex flex-1 items-center justify-center py-8">
      <div className="flex w-full max-w-xl flex-col items-center text-center">
        <LostIcon />
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--adm-line)] bg-[var(--adm-surface)] px-3 py-1 font-mono text-adm-xs font-medium text-[var(--adm-accent)]">
          <span className="size-1.5 rounded-full bg-[var(--adm-accent)]" aria-hidden />
          Error 404
        </p>
        <h1 className="mt-3 text-adm-xl font-semibold tracking-[-0.02em] text-[var(--adm-ink)]">
          This page doesn&rsquo;t exist
        </h1>
        <p className="mt-2 max-w-[46ch] text-adm-base leading-relaxed text-[var(--adm-ink-mute)]">
          The link may be out of date, or the record it pointed to was removed.
          Go back, or use the sidebar to find what you need.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <WorkspaceButton variant="primary" asChild>
            <Link href={home}>{home === "/portal" ? "Back to dashboard" : "Go to your workspace"}</Link>
          </WorkspaceButton>
        </div>
        <Link href="/portal/help" className="mt-4 text-adm-xs font-medium text-[var(--adm-accent)] underline-offset-4 hover:underline">
          Contact support
        </Link>
      </div>
      </div>
    </div>
  );
}
