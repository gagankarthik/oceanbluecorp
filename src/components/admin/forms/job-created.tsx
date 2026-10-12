"use client";

import * as React from "react";
import Link from "next/link";
import * as D from "@radix-ui/react-dialog";
import { ArrowRight, Plus } from "lucide-react";
import type { Job } from "@/lib/aws/dynamodb";
import { isPubliclyOpen } from "@/lib/job-status";
import { jobLocationLabel } from "@/lib/workplace";
import { WorkspaceButton } from "@/components/admin/workspace";

/** Drawn tick: the ring strokes in, then the check, then a single soft pulse. */
function SuccessMark() {
  return (
    <div className="relative mx-auto h-16 w-16">
      <span aria-hidden="true" className="adm-success-pulse absolute inset-0 rounded-full bg-[var(--adm-success-soft)]" />
      <svg viewBox="0 0 64 64" className="relative h-16 w-16" aria-hidden="true">
        <circle cx="32" cy="32" r="30" fill="var(--adm-success-soft)" />
        <circle
          className="adm-success-ring"
          cx="32" cy="32" r="30"
          fill="none" stroke="var(--adm-success)" strokeWidth="3" strokeLinecap="round"
          pathLength={1}
          transform="rotate(-90 32 32)"
        />
        <path
          className="adm-success-check"
          d="M20 33.5 28.5 42 45 24"
          fill="none" stroke="var(--adm-success)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
          pathLength={1}
        />
      </svg>
    </div>
  );
}

/** Shown once a posting is saved: what was made, and where to go next. */
export function JobCreatedDialog({
  job,
  listHref,
  onCreateAnother,
}: {
  job: Job | null;
  listHref: string;
  onCreateAnother: () => void;
}) {
  const live = job ? isPubliclyOpen(job.status) : false;
  const where = job ? jobLocationLabel(job) : "";

  return (
    <D.Root open={!!job}>
      <D.Portal>
        <div className="adm-scope contents">
          <D.Overlay className="adm-dialog-scrim fixed inset-0 z-[120] bg-[var(--adm-scrim)]" />
          <D.Content
            onEscapeKeyDown={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
            className="adm-dialog fixed left-1/2 top-1/2 z-[121] w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-6 text-center shadow-[var(--adm-shadow-lg)] focus:outline-none sm:p-7"
          >
            {job && (
              <>
                <SuccessMark />
                <D.Title className="adm-success-text mt-5 text-adm-lg font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">
                  Job created successfully
                </D.Title>
                <D.Description className="adm-success-text mt-1.5 text-adm-base leading-relaxed text-[var(--adm-ink-mute)]">
                  {live
                    ? "It's live on the careers page and taking applications."
                    : "It's saved as a draft. Set it to Active when it should go live."}
                </D.Description>

                <div className="adm-success-text mt-5 rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-4 py-3 text-left">
                  <p className="truncate text-adm-base font-semibold text-[var(--adm-ink)]">{job.title}</p>
                  <p className="mt-0.5 truncate text-adm-xs text-[var(--adm-ink-mute)]">
                    {[job.postingId, where].filter(Boolean).join(" · ")}
                  </p>
                </div>

                <div className="adm-success-text mt-6 flex flex-col gap-2 sm:flex-row-reverse">
                  <WorkspaceButton asChild variant="primary" className="sm:flex-1">
                    <Link href={`/admin/jobs/${job.id}`}>
                      View job<ArrowRight aria-hidden="true" />
                    </Link>
                  </WorkspaceButton>
                  <WorkspaceButton type="button" onClick={onCreateAnother} className="sm:flex-1">
                    <Plus aria-hidden="true" />Create another
                  </WorkspaceButton>
                </div>
                <Link
                  href={listHref}
                  className="adm-success-text mt-3 inline-block rounded-[4px] text-adm-xs font-medium text-[var(--adm-ink-mute)] underline-offset-2 hover:text-[var(--adm-ink)] hover:underline"
                >
                  Back to all roles
                </Link>
              </>
            )}
          </D.Content>
        </div>
      </D.Portal>
    </D.Root>
  );
}
