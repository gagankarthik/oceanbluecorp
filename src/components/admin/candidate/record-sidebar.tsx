"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import type { Application } from "@/lib/aws/dynamodb";
import { AdminCard } from "@/components/admin/admin-card";
import { Avatar } from "@/components/admin/avatar";
import { WorkspaceButton } from "@/components/admin/workspace";
import {
  IconDownload, IconFile, IconUserCheck, IconUserX,
} from "@/components/admin/icons";
import { POOL_LABEL, POOL_META, poolOf } from "@/lib/bench";
import { fmtDate } from "@/lib/format";

/* The record's reference rail, ordered by how often a teammate needs it:
   whose desk it is on, the resume, the application's metadata, the requisition.
   Sticky from lg, where it sits beside the main column; stacked below. */

type CandidateDetail = Application & {
  jobDepartment?: string;
  jobLocation?: string;
  jobType?: string;
};

const RAIL_HEAD = "text-adm-xs font-medium text-[var(--adm-ink-mute)]";

function MetaRow({ label, value }: { label: string; value?: React.ReactNode }) {
  const empty = value === undefined || value === null || value === "";
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="flex-none text-adm-xs text-[var(--adm-ink-mute)]">{label}</dt>
      <dd className="min-w-0 break-words text-right text-adm-base text-[var(--adm-ink)]">
        {empty ? <span className="text-[var(--adm-ink-subtle)]">–</span> : value}
      </dd>
    </div>
  );
}

export function RecordSidebar({
  candidate,
  isOwner,
  ownerSaving,
  hasAnalysis,
  onClaim,
  onRelease,
  onViewResume,
}: {
  candidate: CandidateDetail;
  isOwner: boolean;
  ownerSaving: boolean;
  hasAnalysis: boolean;
  onClaim: () => void;
  onRelease: () => void;
  onViewResume: () => void;
}) {
  const appId = candidate.applicationId || candidate.id?.slice(0, 8);
  return (
    /* One panel, sections in order of use: the role, who owns it, the file,
       then the record's facts. Offset by the pinned header's measured height
       (`--rec-head`, set by the page) so the rail parks below it. */
    <AdminCard className="overflow-hidden lg:sticky lg:top-[calc(var(--rec-head,7rem)+1rem)]">
      {candidate.jobTitle && (
        <section className="border-b border-[var(--adm-line-soft)] p-4">
          <h2 className={RAIL_HEAD}>Position</h2>
          <Link
            href={candidate.jobId ? `/admin/jobs/${candidate.jobId}` : "#"}
            className="group mt-1.5 block rounded-[6px]"
          >
            <span className="text-adm-base font-semibold text-[var(--adm-ink)] transition-colors group-hover:text-[var(--adm-accent)]">
              {candidate.jobTitle}
            </span>
            <span className="mt-1 block text-adm-xs text-[var(--adm-ink-mute)]">
              {[candidate.jobDepartment, candidate.jobLocation, candidate.jobType?.replace(/-/g, " ")].filter(Boolean).join(" · ")}
            </span>
            <span className="mt-2 inline-flex items-center gap-1 text-adm-xs font-medium text-[var(--adm-accent)]">
              View job posting <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>
        </section>
      )}

      <section className="border-b border-[var(--adm-line-soft)] p-4">
        <h2 className={RAIL_HEAD}>Owner</h2>
        {candidate.ownership && candidate.ownershipName ? (
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar name={candidate.ownershipName} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-adm-base font-medium text-[var(--adm-ink)]">{candidate.ownershipName}</p>
                {candidate.ownershipClaimedAt && (
                  <p className="text-adm-xs tabular-nums text-[var(--adm-ink-mute)]">Since {fmtDate(candidate.ownershipClaimedAt)}</p>
                )}
              </div>
            </div>
            {isOwner && (
              <WorkspaceButton
                variant="ghost"
                size="sm"
                onClick={onRelease}
                disabled={ownerSaving}
                className="text-[var(--adm-ink-mute)] hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]"
              >
                {ownerSaving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <IconUserX aria-hidden="true" />}
                Release
              </WorkspaceButton>
            )}
          </div>
        ) : (
          <WorkspaceButton
            onClick={onClaim}
            disabled={ownerSaving}
            className="mt-2 w-full border-[var(--adm-danger)] text-[var(--adm-danger-ink)] shadow-none hover:border-[var(--adm-danger)] hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]"
          >
            {ownerSaving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <IconUserCheck aria-hidden="true" />}
            Unclaimed, claim this candidate
          </WorkspaceButton>
        )}
      </section>

      <section className="border-b border-[var(--adm-line-soft)] p-4">
        <h2 className={RAIL_HEAD}>Resume</h2>
        {candidate.resumeId ? (
          <button
            type="button"
            onClick={onViewResume}
            className="group mt-2 flex w-full items-center gap-3 rounded-[8px] border border-[var(--adm-line-control)] px-3 py-2.5 text-left transition-colors duration-150 hover:bg-[var(--adm-row-hover)]"
          >
            <IconFile className="h-[18px] w-[18px] flex-none text-[var(--adm-ink-mute)]" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-adm-base font-medium text-[var(--adm-ink)]">
                {candidate.resumeFileName || "resume.pdf"}
              </span>
              <span className="block text-adm-xs text-[var(--adm-ink-mute)]">View or download</span>
            </span>
            <IconDownload className="h-4 w-4 flex-none text-[var(--adm-ink-mute)] transition-colors group-hover:text-[var(--adm-ink)]" aria-hidden="true" />
          </button>
        ) : (
          <p className="mt-1.5 text-adm-xs text-[var(--adm-ink-mute)]">No resume on file.</p>
        )}
      </section>

      <section className="p-4 pb-2">
        <h2 className={RAIL_HEAD}>Application</h2>
        <dl className="mt-1 divide-y divide-[var(--adm-line-soft)]">
          {appId && (
            <MetaRow
              label="ID"
              value={<span className="font-mono text-adm-xs text-[var(--adm-ink)]">{appId}</span>}
            />
          )}
          {candidate.addToTalentBench && (
            <MetaRow label="Pool" value={`${POOL_LABEL[poolOf(candidate)]} (${POOL_META[poolOf(candidate)].badge})`} />
          )}
          <MetaRow label="Applied" value={<span className="tabular-nums">{fmtDate(candidate.appliedAt)}</span>} />
          {candidate.updatedAt && <MetaRow label="Updated" value={<span className="tabular-nums">{fmtDate(candidate.updatedAt)}</span>} />}
          {hasAnalysis && candidate.resumeAnalyzedAt && (
            <MetaRow label="Analyzed" value={<span className="tabular-nums">{fmtDate(candidate.resumeAnalyzedAt)}</span>} />
          )}
          {candidate.createdByName && (
            <MetaRow label="Added by" value={candidate.createdByName} />
          )}
        </dl>
      </section>
    </AdminCard>
  );
}
