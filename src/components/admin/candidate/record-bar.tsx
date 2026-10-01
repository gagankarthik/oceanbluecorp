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
  IconBookmarkCheck, IconBookmarkPlus, IconEdit, IconJob,
  IconLocation, IconMail, IconPhone, IconUserCheck,
} from "@/components/admin/icons";
import { POOL_LABEL, POOL_META, POOL_ORDER, poolOf } from "@/lib/bench";
import { cn } from "@/lib/utils";

/* RecordBar: identity, contact and the record's actions, pinned by the
   page for the whole ~4,000px record (Fitts). It stays whole rather than
   condensing on scroll: contact and rating are what a recruiter reaches for
   while reading the resume below. Built short instead: identity and contact in
   one column, every action on one wrapping row. */

export type RecordBarProps = {
  candidate: Application & { jobDepartment?: string };
  benchSaving: boolean;
  ownerSaving: boolean;
  onRate: (n: number) => void;
  onBench: (p: BenchType | null) => void;
  onClaim: () => void;
  onEdit: () => void;
};

/** The bar sits on the cobalt record band, so its ink-token text re-points to white. */
const ON_COBALT = "[--adm-ink:#fff] [--adm-ink-mute:rgba(255,255,255,0.9)] [--adm-ink-subtle:rgba(255,255,255,0.72)]";

const MENU = "rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1 shadow-[var(--adm-shadow-pop)]";
const MENU_LABEL = "px-2 pb-1 pt-1.5 text-[12px] font-medium text-[var(--adm-ink-subtle)]";

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
  benchSaving,
  ownerSaving,
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
            <h1 className="truncate text-[21px] font-semibold leading-7 tracking-[-0.02em] text-white">
              {candidate.name || "Unnamed candidate"}
            </h1>
            {/* Chips are tinted for a white surface, so each sits on a white tab. */}
            <span className="inline-flex rounded-[8px] bg-white p-0.5"><StatusBadge status={candidate.status} size="md" /></span>
            {pool && (
              <span className="inline-flex rounded-[8px] bg-white p-0.5">
                <StatusBadge tone={pool === "internal" ? "blue" : "emerald"} label={POOL_LABEL[pool]} size="md" />
              </span>
            )}
          </div>

          <div className={cn("mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-white/90", ON_COBALT)}>
            <a
              href={`mailto:${candidate.email}`}
              className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-[6px] underline-offset-4 hover:underline"
            >
              <IconMail className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
              <span className="truncate">{candidate.email}</span>
            </a>
            {candidate.phone && (
              <a
                href={`tel:${candidate.phone}`}
                className="inline-flex items-center gap-1.5 rounded-[6px] tabular-nums underline-offset-4 hover:underline"
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
        <div className={cn("flex items-center gap-1.5 pr-1", ON_COBALT)}>
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
            className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-white px-3 text-[13px] font-medium text-[var(--adm-success-ink)]"
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

        {/* Secondary: the filled action is the stage move in StageTrack. */}
        <WorkspaceButton onClick={onEdit} aria-label="Edit profile">
          <IconEdit aria-hidden="true" />
          <span className="hidden sm:inline">Edit profile</span>
        </WorkspaceButton>
      </div>
    </div>
  );
}
