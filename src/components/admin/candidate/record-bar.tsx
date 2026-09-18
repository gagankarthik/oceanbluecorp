"use client";

import { useRouter } from "next/navigation";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import type { Application, BenchType } from "@/lib/aws/dynamodb";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkspaceButton } from "@/components/admin/workspace";
import { StatusBadge } from "@/components/admin/status-badge";
import { Avatar } from "@/components/admin/avatar";
import { StarRating } from "@/components/admin/star-rating";
import {
  IconBookmarkCheck, IconBookmarkPlus, IconEdit, IconError, IconJob,
  IconLocation, IconMail, IconPhone, IconUserCheck,
} from "@/components/admin/icons";
import { PIPELINE_STAGES, statusColor, type AppStatus } from "@/components/admin/theme";
import { POOL_LABEL, POOL_META, POOL_ORDER, poolOf } from "@/lib/bench";
import { cn } from "@/lib/utils";

/* RecordBar: identity, contact, stage and the record's actions, pinned by the
   page for the whole ~4,000px record (Fitts). It stays whole rather than
   condensing on scroll: contact and rating are what a recruiter reaches for
   while reading the resume below. Built short instead: identity and contact in
   one column, every action on one wrapping row. */

export type RecordBarProps = {
  candidate: Application & { jobDepartment?: string };
  statusSaving: boolean;
  benchSaving: boolean;
  ownerSaving: boolean;
  onStage: (s: AppStatus) => void;
  onRate: (n: number) => void;
  onBench: (p: BenchType | null) => void;
  onClaim: () => void;
  onEdit: () => void;
};

const MENU = "rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1 shadow-[var(--adm-shadow-pop)]";
const MENU_LABEL = "px-2 pb-1 pt-1.5 text-[12px] font-medium text-[var(--adm-ink-subtle)]";

/** Compact stage control; the full stepper lives in the Pipeline tab. */
function StageSelect({
  candidate,
  saving,
  onStage,
}: {
  candidate: Application;
  saving: boolean;
  onStage: (s: AppStatus) => void;
}) {
  const isRejected = candidate.status === "rejected";
  const current = PIPELINE_STAGES.find((s) => s.key === candidate.status);
  const c = statusColor(candidate.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Tinted by the stage it shows (tinted = state, filled = action), in the
            same colour the stage carries everywhere else. Inline because the
            value is resolved at runtime. */}
        <WorkspaceButton
          disabled={saving}
          aria-label={`Stage: ${isRejected ? "Rejected" : current?.label ?? "none"}. Change stage`}
          style={{
            color: c,
            borderColor: `color-mix(in srgb, ${c} 45%, transparent)`,
            background: `color-mix(in srgb, ${c} 8%, var(--adm-surface))`,
          }}
          className="hover:brightness-[0.97]"
        >
          {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : (
            <span aria-hidden className="h-2 w-2 flex-none rounded-full" style={{ background: c }} />
          )}
          <span className="font-semibold">{isRejected ? "Rejected" : current?.label ?? "–"}</span>
          <ChevronDown className="opacity-60" aria-hidden="true" />
        </WorkspaceButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className={cn("min-w-[220px]", MENU)}>
        <DropdownMenuLabel className={MENU_LABEL}>Move to stage</DropdownMenuLabel>
        {PIPELINE_STAGES.map((stage) => {
          const selected = !isRejected && stage.key === candidate.status;
          return (
            <DropdownMenuItem
              key={stage.key}
              onClick={() => onStage(stage.key)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px]",
                selected ? "font-medium text-[var(--adm-ink)]" : "text-[var(--adm-ink-mute)]",
              )}
            >
              <Check className={cn("h-3.5 w-3.5 flex-none text-[var(--adm-accent)]", selected ? "opacity-100" : "opacity-0")} aria-hidden="true" />
              <span aria-hidden className="h-2 w-2 flex-none rounded-full" style={{ background: statusColor(stage.key) }} />
              {stage.label}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator className="my-1 bg-[var(--adm-line-soft)]" />
        {/* Rejection is terminal and off the ordered flow, so it is an action, not a seventh stage. */}
        <DropdownMenuItem
          onClick={() => onStage("rejected")}
          className="flex cursor-pointer items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px] font-medium text-[var(--adm-danger-ink)] focus:bg-[var(--adm-danger-soft)] focus:text-[var(--adm-danger-ink)]"
        >
          <IconError className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
          {isRejected ? "Rejected" : "Reject candidate"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Talent-bench control: pick a pool, or take the candidate off the bench. */
function BenchMenu({
  candidate,
  saving,
  onBench,
  compact = false,
}: {
  candidate: Application;
  saving: boolean;
  onBench: (p: BenchType | null) => void;
  compact?: boolean;
}) {
  const label = candidate.addToTalentBench ? `In ${POOL_LABEL[poolOf(candidate)]}` : "Add to bench";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <WorkspaceButton disabled={saving} aria-label={label} title={label}>
          {saving ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : candidate.addToTalentBench ? (
            <IconBookmarkCheck className="text-[var(--adm-success-ink)]" aria-hidden="true" />
          ) : (
            <IconBookmarkPlus aria-hidden="true" />
          )}
          <span className={cn(compact && "hidden 2xl:inline")}>{label}</span>
          <ChevronDown className="opacity-60" aria-hidden="true" />
        </WorkspaceButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className={cn("min-w-[240px]", MENU)}>
        <DropdownMenuLabel className={MENU_LABEL}>Talent bench</DropdownMenuLabel>
        {POOL_ORDER.map((pool) => {
          const selected = candidate.addToTalentBench && poolOf(candidate) === pool;
          return (
            <DropdownMenuItem
              key={pool}
              onClick={() => onBench(pool)}
              className="flex cursor-pointer items-start gap-2 rounded-[6px] px-2 py-2"
            >
              <Check className={cn("mt-0.5 h-3.5 w-3.5 flex-none text-[var(--adm-accent)]", selected ? "opacity-100" : "opacity-0")} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className={cn("block text-[13px]", selected ? "font-medium text-[var(--adm-ink)]" : "text-[var(--adm-ink-mute)]")}>
                  {POOL_LABEL[pool]}
                </span>
                <span className="mt-0.5 block text-[12px] text-[var(--adm-ink-subtle)]">
                  {POOL_META[pool].hint}
                </span>
              </span>
            </DropdownMenuItem>
          );
        })}
        {candidate.addToTalentBench && (
          <>
            <DropdownMenuSeparator className="my-1 bg-[var(--adm-line-soft)]" />
            <DropdownMenuItem
              onClick={() => onBench(null)}
              className="flex cursor-pointer items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px] font-medium text-[var(--adm-danger-ink)] focus:bg-[var(--adm-danger-soft)] focus:text-[var(--adm-danger-ink)]"
            >
              <span className="w-3.5 flex-none" />
              Remove from bench
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RecordBar({
  candidate,
  statusSaving,
  benchSaving,
  ownerSaving,
  onStage,
  onRate,
  onBench,
  onClaim,
  onEdit,
}: RecordBarProps) {
  const router = useRouter();
  const location = [candidate.city, candidate.state].filter(Boolean).join(", ");
  const pool = candidate.addToTalentBench ? poolOf(candidate) : null;

  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
      {/* Identity + contact, in RecordHeader's type scale */}
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={candidate.name} email={candidate.email} size="lg" className="hidden sm:flex" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h1 className="truncate text-[21px] font-semibold leading-7 tracking-[-0.02em] text-[var(--adm-ink)]">
              {candidate.name || "Unnamed candidate"}
            </h1>
            <StatusBadge status={candidate.status} size="md" />
            {pool && (
              <StatusBadge tone={pool === "internal" ? "blue" : "emerald"} label={POOL_LABEL[pool]} size="md" />
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[var(--adm-ink-mute)]">
            <a
              href={`mailto:${candidate.email}`}
              className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-[6px] transition-colors hover:text-[var(--adm-accent)]"
            >
              <IconMail className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
              <span className="truncate">{candidate.email}</span>
            </a>
            {candidate.phone && (
              <a
                href={`tel:${candidate.phone}`}
                className="inline-flex items-center gap-1.5 rounded-[6px] tabular-nums transition-colors hover:text-[var(--adm-accent)]"
              >
                <IconPhone className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                {candidate.phone}
              </a>
            )}
            {location && (
              <span className="inline-flex items-center gap-1.5">
                <IconLocation className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                {location}
              </span>
            )}
            {candidate.jobTitle && (
              <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                <IconJob className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                <span className="truncate">
                  {candidate.jobTitle}
                  {candidate.jobDepartment && ` · ${candidate.jobDepartment}`}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions. Labels collapse to icons below 2xl so the row fits one line on a laptop. */}
      <div className="flex flex-none flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 pr-1">
          <StarRating rating={candidate.rating || 0} onRate={onRate} size="md" />
          <span className="hidden text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)] 2xl:inline">
            {candidate.rating ? `${candidate.rating}/5` : "Not rated"}
          </span>
        </div>

        {candidate.jobId && (
          <WorkspaceButton
            onClick={() => router.push(`/admin/jobs/${candidate.jobId}`)}
            aria-label="View job"
            title="View job"
          >
            <IconJob aria-hidden="true" />
            <span className="hidden 2xl:inline">View job</span>
          </WorkspaceButton>
        )}

        {/* Claimed is a state chip, not a button: Release takes the record off a
            colleague's desk, so it lives in the rail where it is labelled.
            Unclaimed is a problem, so it reads as one (danger outline). */}
        {candidate.ownership ? (
          <span
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[var(--adm-success-soft)] px-3 text-[13px] font-medium text-[var(--adm-success-ink)]"
            title={`Claimed by ${candidate.ownershipName || "a teammate"}`}
          >
            <IconUserCheck className="h-4 w-4 flex-none" aria-hidden="true" />
            <span className="sr-only 2xl:hidden">Claimed by {candidate.ownershipName || "a teammate"}</span>
            <span className="hidden max-w-[10rem] truncate 2xl:inline-block">
              {candidate.ownershipName || "Claimed"}
            </span>
          </span>
        ) : (
          <WorkspaceButton
            onClick={onClaim}
            disabled={ownerSaving}
            aria-label="Unclaimed, claim this candidate"
            title="Unclaimed, claim this candidate"
            className="border-[var(--adm-danger)] text-[var(--adm-danger-ink)] shadow-none hover:border-[var(--adm-danger)] hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]"
          >
            {ownerSaving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <IconUserCheck aria-hidden="true" />}
            <span className="hidden 2xl:inline">Unclaimed</span>
          </WorkspaceButton>
        )}

        <BenchMenu candidate={candidate} saving={benchSaving} onBench={onBench} compact />

        <StageSelect candidate={candidate} saving={statusSaving} onStage={onStage} />

        {/* The record's one filled action. */}
        <WorkspaceButton variant="primary" onClick={onEdit} aria-label="Edit profile">
          <IconEdit aria-hidden="true" />
          <span className="hidden sm:inline">Edit profile</span>
        </WorkspaceButton>
      </div>
    </div>
  );
}
