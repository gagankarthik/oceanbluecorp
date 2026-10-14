"use client";

import type { Job } from "@/lib/aws/dynamodb";
import { isPubliclyOpen } from "@/lib/job-status";
import { jobLocationLabel } from "@/lib/workplace";
import { Button, Modal, usePortalRouter } from "@/components/portal/kit";
import Icon from "@/components/portal/icons";

/** Shown once a posting is saved: what was made, where it shows, and where to go next. */
export function JobCreatedDialog({
  job,
  listHref,
  onCreateAnother,
}: {
  job: Job | null;
  listHref: string;
  onCreateAnother: () => void;
}) {
  const router = usePortalRouter();
  if (!job) return null;
  const live = isPubliclyOpen(job.status);
  const where = jobLocationLabel(job);
  return (
    <Modal
      title={live ? "Role published" : "Role saved as a draft"}
      size="sm"
      // Closing lands on the new record, the most likely next step.
      onClose={() => router.push(`/portal/jobs/${job.id}`)}
      footer={
        <>
          <Button variant="ghost" href={listHref}>
            Back to all roles
          </Button>
          <Button variant="secondary" icon="plus" onClick={onCreateAnother}>
            Create another
          </Button>
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
              : "It's off the careers site until you publish it from the job page or the list."}
          </p>
        </div>
        <div className="rounded-lg bg-mist-50 px-4 py-3 ring-1 ring-inset ring-mist-200">
          <p className="truncate text-adm-base font-semibold text-navy-900">{job.title}</p>
          <p className="mt-0.5 truncate text-adm-base text-mist-600">{[job.postingId, where].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
    </Modal>
  );
}
