"use client";

import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";
import type { Application } from "@/lib/aws/dynamodb";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { Avatar } from "@/components/admin/avatar";
import {
  IconBuilding, IconClock, IconDownload, IconFile, IconJob,
  IconLocation, IconUserCheck, IconUserX,
} from "@/components/admin/icons";
import { POOL_LABEL, POOL_META, poolOf } from "@/lib/bench";
import { fmtDate } from "@/lib/format";

/* ============================================================
   RecordSidebar, the record's reference rail.

   Sticky (it already was, and correctly so): the main column
   runs ~3,700px, and un-pinned this would orphan after the
   first fifth of the page.

   Ordered by how often a teammate opening the record needs it:
   whose desk it is on, the resume, the application's own
   metadata, then the requisition.
   ============================================================ */

type CandidateDetail = Application & {
  jobDepartment?: string;
  jobLocation?: string;
  jobType?: string;
};

function MetaRow({ label, value }: { label: string; value?: React.ReactNode }) {
  const empty = value === undefined || value === null || value === "";
  return (
    <div className="flex items-baseline justify-between gap-3 px-5 py-2.5">
      <dt className="flex-none text-[13px] font-medium text-[var(--adm-ink-subtle)]">{label}</dt>
      <dd className="min-w-0 break-words text-right text-[13.5px] text-[var(--adm-ink)]">
        {empty ? <span className="text-[var(--adm-ink-subtle)]"></span> : value}
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
       page) plus a gutter, so the rail parks just below it instead of sliding
       underneath. The fallback covers the first paint, before the
       ResizeObserver has reported. */
    <div className="space-y-4 lg:sticky lg:top-[calc(var(--rec-head,7rem)+1rem)]">
      {/* Owner, first, because whose desk this is on is the first thing a
          teammate opening the record wants to know. */}
      <AdminCard className="overflow-hidden">
        <AdminCardHeader icon={IconUserCheck} title="Assigned recruiter" />
        <div className="p-5">
          {candidate.ownership && candidate.ownershipName ? (
            <div className="flex items-center justify-between gap-2 rounded-[6px] border border-emerald-200 bg-[var(--adm-success-soft)] px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar name={candidate.ownershipName} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-[var(--adm-success-ink)]">
                    {candidate.ownershipName}
                  </p>
                  {candidate.ownershipClaimedAt && (
                    <p className="mt-0.5 text-[11.5px] text-[var(--adm-ink-subtle)]">
                      Since {fmtDate(candidate.ownershipClaimedAt)}
                    </p>
                  )}
                </div>
              </div>
              {isOwner && (
                <button
                  onClick={onRelease}
                  disabled={ownerSaving}
                  className="inline-flex flex-none items-center gap-1 rounded-[4px] border border-transparent px-2 py-1 text-[11px] font-semibold text-[var(--adm-danger-ink)] transition-colors hover:border-rose-200 hover:bg-[var(--adm-danger-soft)] disabled:opacity-60"
                >
                  {ownerSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <IconUserX className="h-3 w-3" />}
                  Release
                </button>
              )}
            </div>
          ) : (
            /* Danger outline, matching the pinned bar: a dashed grey box read as
               an optional extra, when an unowned candidate is the state most
               worth acting on. Same signal in both places so they cannot
               disagree about how urgent this is. */
            <button
              onClick={onClaim}
              disabled={ownerSaving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[6px] border border-[var(--adm-danger)] px-3 py-2.5 text-[13px] font-semibold text-[var(--adm-danger-ink)] transition-colors hover:bg-[var(--adm-danger-soft)] disabled:opacity-60"
            >
              {ownerSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconUserCheck className="h-4 w-4" />}
              Unclaimed, claim this candidate
            </button>
          )}
        </div>
      </AdminCard>

      {/* Resume file */}
      <AdminCard className="overflow-hidden">
        <AdminCardHeader icon={IconFile} title="Resume" />
        <div className="p-4">
          {candidate.resumeId ? (
            <button
              onClick={onViewResume}
              className="group flex w-full items-center gap-3 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-zebra)] p-3 text-left transition-colors hover:border-[var(--adm-accent)] hover:bg-[var(--adm-accent-tint)]"
            >
              <span className="grid h-9 w-9 flex-none place-items-center rounded-[6px] bg-[var(--adm-accent-soft)]">
                <IconFile className="h-4 w-4 text-[var(--adm-accent)]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-[var(--adm-ink)] transition-colors group-hover:text-[var(--adm-accent)]">
                  {candidate.resumeFileName || "resume.pdf"}
                </span>
                <span className="mt-0.5 block text-[12px] text-[var(--adm-ink-subtle)]">
                  View or download
                </span>
              </span>
              <IconDownload className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)] group-hover:text-[var(--adm-accent)]" />
            </button>
          ) : (
            <p className="text-[12.5px] text-[var(--adm-ink-subtle)]">No resume on file</p>
          )}
        </div>
      </AdminCard>

      {/* Application metadata. The status row was dropped: the pinned record bar
          now carries the status at all times, so repeating it here was the
          third copy on one screen. */}
      <AdminCard className="overflow-hidden">
        <AdminCardHeader icon={IconClock} title="Application" />
        <dl className="divide-y divide-[var(--adm-line-soft)]">
          <MetaRow
            label="App ID"
            value={
              candidate.applicationId || candidate.id?.slice(0, 8) ? (
                <span className="rounded-[4px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 font-mono text-[11.5px] text-[var(--adm-ink-mute)]">
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
          <MetaRow label="Applied" value={fmtDate(candidate.appliedAt)} />
          {candidate.updatedAt && <MetaRow label="Updated" value={fmtDate(candidate.updatedAt)} />}
          {hasAnalysis && candidate.resumeAnalyzedAt && (
            <MetaRow label="Analyzed" value={fmtDate(candidate.resumeAnalyzedAt)} />
          )}
        </dl>
      </AdminCard>

      {/* Position */}
      {candidate.jobTitle && (
        <AdminCard className="overflow-hidden">
          <AdminCardHeader icon={IconJob} title="Position" />
          <div className="p-5">
            <Link href={candidate.jobId ? `/admin/jobs/${candidate.jobId}` : "#"} className="group block">
              <p className="text-[13.5px] font-semibold text-[var(--adm-ink)] transition-colors group-hover:text-[var(--adm-accent)]">
                {candidate.jobTitle}
              </p>
              <div className="mt-2 space-y-1">
                {candidate.jobDepartment && (
                  <p className="flex items-center gap-1.5 text-[12.5px] text-[var(--adm-ink-subtle)]">
                    <IconBuilding className="h-3.5 w-3.5 flex-none" />
                    {candidate.jobDepartment}
                  </p>
                )}
                {candidate.jobLocation && (
                  <p className="flex items-center gap-1.5 text-[12.5px] text-[var(--adm-ink-subtle)]">
                    <IconLocation className="h-3.5 w-3.5 flex-none" />
                    {candidate.jobLocation}
                  </p>
                )}
                {candidate.jobType && (
                  <p className="flex items-center gap-1.5 text-[12.5px] capitalize text-[var(--adm-ink-subtle)]">
                    <IconClock className="h-3.5 w-3.5 flex-none" />
                    {candidate.jobType.replace(/-/g, " ")}
                  </p>
                )}
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--adm-accent)]">
                View job posting <ExternalLink className="h-3 w-3" />
              </span>
            </Link>
          </div>
        </AdminCard>
      )}

      {candidate.createdByName && (
        <div className="flex items-center gap-2 px-1">
          <Avatar name={candidate.createdByName} size="xs" />
          <p className="text-[12px] text-[var(--adm-ink-subtle)]">
            Added by{" "}
            <span className="font-semibold text-[var(--adm-ink-mute)]">{candidate.createdByName}</span>
            {candidate.createdAt && <> · {fmtDate(candidate.createdAt)}</>}
          </p>
        </div>
      )}
    </div>
  );
}
