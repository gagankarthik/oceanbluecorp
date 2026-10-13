"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { WorkspaceButton } from "@/components/admin/workspace";
import { StatusBadge } from "@/components/admin/status-badge";
import { IconEdit } from "@/components/admin/icons";
import { PIPELINE_STAGES } from "@/components/admin/theme";
import type { Job } from "@/lib/aws/dynamodb";
import { jobLocationLabel, workplaceOf, WORKPLACE_LABEL } from "@/lib/workplace";
import { formatSalary } from "@/lib/salary";
import { renderRichText } from "@/lib/rich-text";
import { fmtDate } from "@/lib/format";

const TYPE_LABEL: Record<string, string> = {
  "full-time": "Full-time", "part-time": "Part-time", contract: "Contract",
  "contract-to-hire": "Contract-to-hire", "direct-hire": "Direct hire", "managed-teams": "Managed teams", remote: "Remote",
};

/**
 * A requisition at a glance, without leaving the list: the facts a recruiter
 * scans for, where its applicants stand, and the description. The full page
 * is one click away.
 */
export function JobPreviewDrawer({
  job,
  query = "",
  canEdit,
  onClose,
}: {
  job: Job | null;
  /** Carries the list's category (?category=open) into the job page. */
  query?: string;
  canEdit: boolean;
  onClose: () => void;
}) {
  const [description, setDescription] = useState<string | null>(null);
  const [loadingDesc, setLoadingDesc] = useState(false);

  // List rows are summaries without the description; fetch it on open.
  useEffect(() => {
    setDescription(null);
    if (!job) return;
    if (job.description) { setDescription(job.description); return; }
    let active = true;
    setLoadingDesc(true);
    fetch(`/api/jobs/${job.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (active) setDescription(d?.job?.description ?? ""); })
      .catch(() => { if (active) setDescription(""); })
      .finally(() => { if (active) setLoadingDesc(false); });
    return () => { active = false; };
  }, [job]);

  const wp = job ? workplaceOf(job) : undefined;
  const pay = job?.salary ? formatSalary(job.salary) : null;
  const facts: { k: string; v: React.ReactNode }[] = job
    ? [
        { k: "Client", v: job.clientName },
        { k: "Location", v: jobLocationLabel(job) || (wp ? WORKPLACE_LABEL[wp] : null) },
        { k: "Type", v: [TYPE_LABEL[job.type] ?? job.type, wp && WORKPLACE_LABEL[wp]].filter(Boolean).join(" · ") },
        { k: "Pay", v: pay },
        { k: "Department", v: job.department },
        { k: "Deadline", v: job.submissionDueDate ? fmtDate(job.submissionDueDate) : null },
        { k: "Posted", v: fmtDate(job.publishedAt ?? job.createdAt) },
      ].filter((f) => f.v)
    : [];
  const pipeline = job?.pipeline ?? {};
  const total = job?.applicationsCount ?? 0;

  return (
    <Sheet open={!!job} onOpenChange={(next) => { if (!next) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 bg-[var(--adm-surface)] p-0 sm:max-w-[480px]"
      >
        {job && (
          <>
            <div className="flex flex-shrink-0 items-start gap-3 border-b border-[var(--adm-line)] px-5 py-4">
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-adm-md font-semibold leading-6 text-[var(--adm-ink)]">{job.title}</SheetTitle>
                <SheetDescription asChild>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-adm-xs text-[var(--adm-ink-mute)]">
                    <StatusBadge status={job.status} />
                    {job.postingId && <span className="font-mono">{job.postingId}</span>}
                  </div>
                </SheetDescription>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close preview"
                className="adm-hit grid h-8 w-8 flex-none place-items-center rounded-[var(--adm-radius-control)] text-[var(--adm-ink-mute)] hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                {facts.map((f) => (
                  <div key={f.k} className="min-w-0">
                    <dt className="text-adm-xs text-[var(--adm-ink-mute)]">{f.k}</dt>
                    <dd className="mt-0.5 truncate text-adm-base text-[var(--adm-ink)]">{f.v}</dd>
                  </div>
                ))}
              </dl>

              <section>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-adm-base font-semibold text-[var(--adm-ink)]">Applicants</h3>
                  <span className="text-adm-xs tabular-nums text-[var(--adm-ink-mute)]">{total} total</span>
                </div>
                {total > 0 ? (
                  <ul className="mt-2 divide-y divide-[var(--adm-line-soft)] rounded-[var(--adm-radius-card)] border border-[var(--adm-line)]">
                    {PIPELINE_STAGES.filter((s) => (pipeline[s.key] ?? 0) > 0).map((s) => (
                      <li key={s.key} className="flex items-center justify-between px-3 py-2 text-adm-xs">
                        <StatusBadge status={s.key} />
                        <span className="font-semibold tabular-nums text-[var(--adm-ink)]">{pipeline[s.key]}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1.5 text-adm-xs text-[var(--adm-ink-mute)]">No applicants yet.</p>
                )}
              </section>

              <section>
                <h3 className="text-adm-base font-semibold text-[var(--adm-ink)]">Description</h3>
                {loadingDesc ? (
                  <p className="mt-2 flex items-center gap-2 text-adm-xs text-[var(--adm-ink-mute)]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />Loading description…
                  </p>
                ) : description ? (
                  <div
                    className="mt-2 max-w-[65ch] text-adm-base leading-relaxed text-[var(--adm-ink-mute)] [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={renderRichText(description)}
                  />
                ) : (
                  <p className="mt-1.5 text-adm-xs text-[var(--adm-ink-mute)]">No description.</p>
                )}
              </section>
            </div>

            <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-[var(--adm-line)] px-5 py-3">
              {canEdit && (
                <WorkspaceButton asChild>
                  <Link href={`/admin/jobs/${job.id}/edit${query}`}><IconEdit aria-hidden="true" />Edit</Link>
                </WorkspaceButton>
              )}
              <WorkspaceButton asChild variant="primary">
                <Link href={`/admin/jobs/${job.id}${query}`}>Open job</Link>
              </WorkspaceButton>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
