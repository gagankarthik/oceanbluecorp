"use client";

import { useRouter } from "next/navigation";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import type { Application, BenchType } from "@/lib/aws/dynamodb";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
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

/* ============================================================
   RecordBar, identity, status, stage control and the record's
   primary actions, pinned to the top of the scroll container.

   ── Why it is sticky ────────────────────────────────────────
   This record scrolls ~4,100px. Previously the header was
   ordinary content at the top of it, so from roughly the second
   screen onward there was nothing on the page saying whose
   record you were reading, what stage they were at, or offering
   any way to act on them, you had to scroll back up to do
   anything, then scroll down again to find your place. Pinning
   identity, status and the stage control puts the most-used
   controls a pointer-move away instead of a round trip (Fitts),
   and keeps the answer to "who am I looking at" permanently on
   screen rather than in short-term memory.

   ── One density, not two ────────────────────────────────────
   A first pass condensed this to a single line once scrolled,
   reasoning that a full header pinned would cost too much of
   every screen. It cost something worse: the contact details and
   the rating, the two things a recruiter reaches for while
   reading a resume, vanished at exactly the moment they were
   being read. The header now stays whole and stays put, the tab
   bar rides with it, and everything below scrolls beneath the
   pair.

   The layout is therefore built to be SHORT rather than to
   collapse: identity and contact share one column, the actions
   sit on one row beside it, and the rating sits with the actions
   because it is one.
   ============================================================ */

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

/** Compact stage control. The full stepper lives in the Pipeline tab; this is
 *  the same action reduced to what fits on one pinned line. */
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
        {/* Tinted by the stage it is showing, so the pipeline position is
            legible without reading the word, the same colour the stage carries
            in the rail, the badge and every list on the site. Inline, because
            the value is resolved at runtime and Tailwind cannot compile a class
            for it. `color-mix` gives the soft fill from the one colour rather
            than needing a second token per stage. */}
        <WorkspaceButton
          disabled={saving}
          style={{
            color: c,
            borderColor: c,
            background: `color-mix(in srgb, ${c} 10%, transparent)`,
          }}
          className="hover:brightness-[0.97]"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <span aria-hidden className="h-2 w-2 flex-none rounded-full" style={{ background: c }} />
          )}
          <span className="hidden sm:inline opacity-70">Stage:</span>
          <span className="font-semibold">
            {isRejected ? "Rejected" : current?.label ?? "–"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </WorkspaceButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={4}
        className="min-w-[220px] rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1 shadow-lg"
      >
        {PIPELINE_STAGES.map((stage, i) => {
          const selected = !isRejected && stage.key === candidate.status;
          return (
            <DropdownMenuItem
              key={stage.key}
              onClick={() => onStage(stage.key)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-[4px] px-2 py-1.5 text-[13px] font-medium",
                selected && "text-[var(--adm-accent)]",
              )}
            >
              <Check className={cn("h-3.5 w-3.5 flex-none", selected ? "opacity-100" : "opacity-0")} />
              <span
                aria-hidden
                className="h-2 w-2 flex-none rounded-full"
                style={{ background: statusColor(stage.key) }}
              />
              <span className={cn(!selected && "text-[var(--adm-ink)]")}>{stage.label}</span>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator className="my-1 bg-[var(--adm-line-soft)]" />
        {/* Rejection is terminal and off the ordered flow, so it is an action
            here rather than a seventh stage pretending to be one. */}
        <DropdownMenuItem
          onClick={() => onStage("rejected")}
          className="flex cursor-pointer items-center gap-2 rounded-[4px] px-2 py-1.5 text-[13px] font-semibold text-[var(--adm-danger-ink)]"
        >
          <IconError className="h-3.5 w-3.5 flex-none" />
          {isRejected ? "Rejected" : "Reject candidate"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* Talent-bench control. Extracted so the pinned and expanded bars share one
   implementation, the pool list, its hints and the remove action were about to
   be a second copy, and two copies of a menu is how the two drift. */
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <WorkspaceButton disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : candidate.addToTalentBench ? (
            <IconBookmarkCheck className="h-4 w-4 text-[var(--adm-success-ink)]" />
          ) : (
            <IconBookmarkPlus className="h-4 w-4" />
          )}
          {/* Compact keeps the icon as the affordance and drops the words, the pinned bar has to hold five controls on one line. */}
          <span className={cn(compact && "hidden xl:inline")}>
            {candidate.addToTalentBench ? `In ${POOL_LABEL[poolOf(candidate)]}` : "Add to bench"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </WorkspaceButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={4}
        className="min-w-[240px] rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1 shadow-lg"
      >
        {POOL_ORDER.map((pool) => {
          const selected = candidate.addToTalentBench && poolOf(candidate) === pool;
          return (
            <DropdownMenuItem
              key={pool}
              onClick={() => onBench(pool)}
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-[4px] px-2 py-2",
                selected && "text-[var(--adm-accent)]",
              )}
            >
              <Check className={cn("mt-0.5 h-3.5 w-3.5 flex-none", selected ? "opacity-100" : "opacity-0")} />
              <span className="min-w-0 flex-1">
                <span className={cn("block text-[13px] font-semibold", !selected && "text-[var(--adm-ink)]")}>
                  {POOL_LABEL[pool]}
                </span>
                <span className="mt-0.5 block text-[11.5px] font-normal text-[var(--adm-ink-subtle)]">
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
              className="flex cursor-pointer items-center gap-2 rounded-[4px] px-2 py-1.5 text-[13px] font-medium text-[var(--adm-danger-ink)]"
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

  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
      {/* ── Identity + contact ── */}
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={candidate.name} email={candidate.email} size="md" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-[18px] font-bold leading-tight tracking-[-0.015em] text-[var(--adm-ink)]">
              {candidate.name || "Unnamed candidate"}
            </h1>
            <StatusBadge status={candidate.status} withIcon size="sm" />
            {candidate.addToTalentBench && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.03em]",
                  poolOf(candidate) === "internal"
                    ? "border-[var(--adm-accent-soft)] bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]"
                    : "border-emerald-200 bg-[var(--adm-success-soft)] text-[var(--adm-success-ink)]",
                )}
              >
                <IconBookmarkCheck className="h-3 w-3" /> {POOL_LABEL[poolOf(candidate)]}
              </span>
            )}
          </div>

          {/* Contact and position on one wrapping row directly under the name.
              These were spread over three separate lines before, which is most
              of why the old header was tall enough to be worth collapsing. */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px]">
            <a
              href={`mailto:${candidate.email}`}
              className="inline-flex min-w-0 items-center gap-1.5 text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]"
            >
              <IconMail className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />
              <span className="truncate">{candidate.email}</span>
            </a>
            {candidate.phone && (
              <a
                href={`tel:${candidate.phone}`}
                className="inline-flex items-center gap-1.5 text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]"
              >
                <IconPhone className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />
                {candidate.phone}
              </a>
            )}
            {location && (
              <span className="inline-flex items-center gap-1.5 text-[var(--adm-ink-subtle)]">
                <IconLocation className="h-3.5 w-3.5 flex-none" />
                {location}
              </span>
            )}
            {candidate.jobTitle && (
              <span className="inline-flex min-w-0 items-center gap-1.5 text-[var(--adm-ink-subtle)]">
                <IconJob className="h-3.5 w-3.5 flex-none" />
                <span className="truncate">
                  {candidate.jobTitle}
                  {candidate.jobDepartment && ` · ${candidate.jobDepartment}`}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Actions ──
          One row. Rating leads it because it is a control like the rest, not a
          figure, it used to sit on its own line below the buttons, which cost
          a whole row of header height to display five stars. */}
      <div className="flex flex-none flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 pr-1">
          <StarRating rating={candidate.rating || 0} onRate={onRate} size="sm" />
          <span className="hidden text-[12px] tabular-nums text-[var(--adm-ink-subtle)] 2xl:inline">
            {candidate.rating ? `${candidate.rating}/5` : "Not rated"}
          </span>
        </div>

        {candidate.jobId && (
          <WorkspaceButton onClick={() => router.push(`/admin/jobs/${candidate.jobId}`)}>
            <IconJob className="h-4 w-4" />
            <span className="hidden 2xl:inline">View job</span>
          </WorkspaceButton>
        )}

        {/* ── Ownership ──
            Unowned is a problem, so it looks like one: an outlined danger
            button that reads as unfinished next to the neutral controls beside
            it. An unclaimed candidate is nobody's job, which is how records go
            stale, the state should be visible from the pinned bar without
            anyone going looking for it.

            Claimed is a green CHIP, not a green button. Once someone owns the
            record the action is no longer "claim", and putting Release, which
            takes a candidate off a colleague's desk, behind a green control
            styled as success would invite exactly the click nobody means to
            make. Release stays in the sidebar, where it is labelled. */}
        {candidate.ownership ? (
          <span
            className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-emerald-200 bg-[var(--adm-success-soft)] px-2.5 text-[13.5px] font-semibold text-[var(--adm-success-ink)]"
            title={`Claimed by ${candidate.ownershipName || "a teammate"}`}
          >
            <IconUserCheck className="h-4 w-4 flex-none" />
            <span className="hidden max-w-[10rem] truncate 2xl:inline">
              {candidate.ownershipName || "Claimed"}
            </span>
          </span>
        ) : (
          <WorkspaceButton
            onClick={onClaim}
            disabled={ownerSaving}
            className="border-[var(--adm-danger)] bg-transparent text-[var(--adm-danger-ink)] shadow-none hover:border-[var(--adm-danger)] hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]"
          >
            {ownerSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconUserCheck className="h-4 w-4" />}
            <span className="hidden 2xl:inline">Unclaimed</span>
          </WorkspaceButton>
        )}

        <BenchMenu candidate={candidate} saving={benchSaving} onBench={onBench} compact />

        <StageSelect candidate={candidate} saving={statusSaving} onStage={onStage} />

        <WorkspaceButton variant="primary" onClick={onEdit}>
          <IconEdit className="h-4 w-4" />
          <span className="hidden sm:inline">Edit profile</span>
        </WorkspaceButton>
      </div>
    </div>
  );
}
