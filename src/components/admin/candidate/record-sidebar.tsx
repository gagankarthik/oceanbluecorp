"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import type { Application } from "@/lib/aws/dynamodb";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { Avatar } from "@/components/admin/avatar";
import { WorkspaceButton } from "@/components/admin/workspace";
import {
  IconBuilding, IconClock, IconDownload, IconFile, IconJob,
  IconLocation, IconUserCheck, IconUserX,
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

function MetaRow({ label, value }: { label: string; value?: React.ReactNode }) {
  const empty = value === undefined || value === null || value === "";
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 py-2.5">
      <dt className="flex-none text-[13px] text-[var(--adm-ink-mute)]">{label}</dt>
      <dd className="min-w-0 break-words text-right text-[13.5px] text-[var(--adm-ink)]">
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
  return (
    /* Offset by the pinned header's measured height (`--rec-head`, set by the
       page) so the rail parks below it; the fallback covers first paint. */
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:sticky lg:top-[calc(var(--rec-head,7rem)+1rem)] lg:grid-cols-1">
      <AdminCard className="overflow-hidden">
        <AdminCardHeader icon={IconUserCheck} title="Assigned recruiter" />
        <div className="p-4">
          {candidate.ownership && candidate.ownershipName ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar name={candidate.ownershipName} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-[var(--adm-ink)]">
                    {candidate.ownershipName}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-[var(--adm-ink-subtle)]">
                    {candidate.ownershipClaimedAt ? (
                      <span className="tabular-nums">Owner since {fmtDate(candidate.ownershipClaimedAt)}</span>
                    ) : "Owner"}
                  </p>
                </div>
              </div>
              {isOwner && (
                <WorkspaceButton
                  variant="ghost"
                  onClick={onRelease}
                  disabled={ownerSaving}
                  className="h-8 px-2.5 text-[13px] text-[var(--adm-ink-mute)] hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]"
                >
                  {ownerSaving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <IconUserX aria-hidden="true" />}
                  Release
                </WorkspaceButton>
              )}
            </div>
          ) : (
            /* Same danger outline as the pinned bar, so the two cannot disagree about urgency. */
            <WorkspaceButton
              onClick={onClaim}
              disabled={ownerSaving}
              className="w-full border-[var(--adm-danger)] text-[var(--adm-danger-ink)] shadow-none hover:border-[var(--adm-danger)] hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]"
            >
              {ownerSaving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <IconUserCheck aria-hidden="true" />}
              Unclaimed, claim this candidate
            </WorkspaceButton>
          )}
        </div>
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <AdminCardHeader icon={IconFile} title="Resume" />
        <div className="p-4">
          {candidate.resumeId ? (
            <button
              type="button"
              onClick={onViewResume}
              className="group flex w-full items-center gap-3 rounded-[10px] border border-[var(--adm-line)] px-3 py-2.5 text-left transition-colors duration-150 hover:border-[var(--adm-line-strong)] hover:bg-[var(--adm-row-hover)]"
            >
              <IconFile className="h-[18px] w-[18px] flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium text-[var(--adm-ink)]">
                  {candidate.resumeFileName || "resume.pdf"}
                </span>
                <span className="mt-0.5 block text-[12.5px] text-[var(--adm-ink-subtle)]">View or download</span>
              </span>
              <IconDownload className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)] transition-colors group-hover:text-[var(--adm-ink)]" aria-hidden="true" />
            </button>
          ) : (
            <p className="text-[13px] text-[var(--adm-ink-subtle)]">No resume on file.</p>
          )}
        </div>
      </AdminCard>

      {/* No status row: the pinned record bar always carries it. */}
      <AdminCard className="overflow-hidden">
        <AdminCardHeader icon={IconClock} title="Application" />
        <dl className="divide-y divide-[var(--adm-line-soft)] py-1">
          <MetaRow
            label="App ID"
            value={
              candidate.applicationId || candidate.id?.slice(0, 8) ? (
                <span className="rounded-[6px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--adm-ink-mute)]">
                  {candidate.applicationId || candidate.id?.slice(0, 8)}
                </span>
              ) : undefined
            }
          />
          {candidate.addToTalentBench && (
            <MetaRow
              label="Pool"
              value={`${POOL_LABEL[poolOf(candidate)]} (${POOL_META[poolOf(candidate)].badge})`}
            />
          )}
          <MetaRow label="Applied" value={<span className="tabular-nums">{fmtDate(candidate.appliedAt)}</span>} />
          {candidate.updatedAt && <MetaRow label="Updated" value={<span className="tabular-nums">{fmtDate(candidate.updatedAt)}</span>} />}
          {hasAnalysis && candidate.resumeAnalyzedAt && (
            <MetaRow label="Analyzed" value={<span className="tabular-nums">{fmtDate(candidate.resumeAnalyzedAt)}</span>} />
          )}
        </dl>
        {candidate.createdByName && (
          <div className="flex items-center gap-2 border-t border-[var(--adm-line-soft)] px-4 py-2.5">
            <Avatar name={candidate.createdByName} size="xs" />
            <p className="min-w-0 truncate text-[12.5px] text-[var(--adm-ink-subtle)]">
              Added by <span className="font-medium text-[var(--adm-ink-mute)]">{candidate.createdByName}</span>
              {candidate.createdAt && <span className="tabular-nums"> · {fmtDate(candidate.createdAt)}</span>}
            </p>
          </div>
        )}
      </AdminCard>

      {candidate.jobTitle && (
        <AdminCard hover className="overflow-hidden">
          <AdminCardHeader icon={IconJob} title="Position" />
          <Link href={candidate.jobId ? `/admin/jobs/${candidate.jobId}` : "#"} className="group block p-4">
            <p className="text-[14px] font-medium text-[var(--adm-ink)] transition-colors group-hover:text-[var(--adm-accent)]">
              {candidate.jobTitle}
            </p>
            <div className="mt-2 space-y-1 text-[13px] text-[var(--adm-ink-mute)]">
              {candidate.jobDepartment && (
                <p className="flex items-center gap-1.5">
                  <IconBuilding className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                  {candidate.jobDepartment}
                </p>
              )}
              {candidate.jobLocation && (
                <p className="flex items-center gap-1.5">
                  <IconLocation className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                  {candidate.jobLocation}
                </p>
              )}
              {candidate.jobType && (
                <p className="flex items-center gap-1.5 capitalize">
                  <IconClock className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                  {candidate.jobType.replace(/-/g, " ")}
                </p>
              )}
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-[var(--adm-accent)]">
              View job posting <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>
        </AdminCard>
      )}
    </div>
  );
}
