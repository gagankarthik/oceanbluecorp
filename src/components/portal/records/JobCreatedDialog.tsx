"use client";

import { useState } from "react";
import type { Job } from "@/lib/aws/dynamodb";
import { isPubliclyOpen } from "@/lib/job-status";
import { jobLocationLabel } from "@/lib/workplace";
import { SITE_URL } from "@/lib/seo";
import { shareTargets } from "@/app/jobs/[slug]/ShareJob";
import { Button, Modal, usePortalRouter } from "@/components/portal/kit";
import { useToast } from "@/components/portal/toast";
import Icon from "@/components/portal/icons";

const TITLE: Record<string, string> = {
  active: "Role published",
  open: "Role saved as internal",
  draft: "Role saved as a draft",
};

/** Shown once a posting is saved: what was made, where it shows, and where to go next. */
export function JobCreatedDialog({
  job,
  listHref,
  onCreateAnother,
  canMatch = false,
}: {
  job: Job | null;
  listHref: string;
  onCreateAnother: () => void;
  /** Recruiting roles may start a bench ranking from here */
  canMatch?: boolean;
}) {
  const router = usePortalRouter();
  const notify = useToast();
  const [copied, setCopied] = useState(false);
  if (!job) return null;
  const live = isPubliclyOpen(job.status);
  const where = jobLocationLabel(job);
  const url = `${SITE_URL}/jobs/${job.id}`;
  const linkedIn = shareTargets(url, job.title).targets.find((t) => t.label === "LinkedIn")!.href;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  // The ranking is saved on the job, so it runs on after we leave; the job's AI matches tab shows it.
  const findMatches = () => {
    void fetch(`/api/jobs/${job.id}/match-candidates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topK: 15 }),
      keepalive: true,
    }).catch(() => {});
    notify("Ranking your bench. Results show under AI matches in about 30 seconds.");
    router.push(`/portal/jobs/${job.id}`);
  };

  return (
    <Modal
      title={TITLE[job.status] ?? "Role saved"}
      size="sm"
      // Closing lands on the new record, the most likely next step.
      onClose={() => router.push(`/portal/jobs/${job.id}`)}
      footer={
        <>
          <Button variant="ghost" icon="plus" onClick={onCreateAnother}>
            Create another
          </Button>
          {canMatch && (
            <Button variant="secondary" icon="search" onClick={findMatches}>
              Find matches now
            </Button>
          )}
          <Button href={`/portal/jobs/${job.id}`} icon="chevronRight">
            View job
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-status-success-soft text-status-success">
            <Icon name="check" className="size-5" />
          </span>
          <p className="text-adm-base leading-normal text-mist-700">
            {live
              ? "It's live on the careers site and taking applications."
              : job.status === "open"
                ? "The team can work it now. It stays off the careers site until you publish it."
                : "It's off the careers site until you publish it from the job page or the list."}
          </p>
        </div>
        <div className="rounded-lg bg-mist-50 px-4 py-3 ring-1 ring-inset ring-mist-200">
          <p className="truncate text-adm-base font-semibold text-navy-900">{job.title}</p>
          <p className="mt-0.5 truncate text-adm-base text-mist-600">{[job.postingId, where].filter(Boolean).join(" · ")}</p>
        </div>
        {live && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" icon={copied ? "check" : "copy"} onClick={() => void copy()}>
              {copied ? "Link copied" : "Copy link"}
            </Button>
            <a
              href={linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-8 items-center gap-2 rounded-lg bg-mist-0 px-3 text-adm-base font-medium text-navy-900 ring-1 ring-inset ring-[var(--color-border-control)] hover:bg-mist-50"
            >
              <Icon name="external" className="size-4" />
              Share on LinkedIn
            </a>
            <span aria-live="polite" className="sr-only">
              {copied ? "Link copied" : ""}
            </span>
          </div>
        )}
        <a href={listHref} className="justify-self-start text-adm-base font-medium text-ocean-700 underline-offset-4 hover:underline">
          Back to all roles
        </a>
      </div>
    </Modal>
  );
}
