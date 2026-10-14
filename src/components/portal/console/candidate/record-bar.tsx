"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, MoreVertical } from "lucide-react";
import type { Application, BenchType } from "@/lib/aws/dynamodb";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkspaceButton } from "@/components/portal/console/workspace";
import { StatusBadge } from "@/components/portal/console/status-badge";
import { Avatar } from "@/components/portal/console/avatar";
import { StarRating } from "@/components/portal/console/star-rating";
import {
  IconEdit, IconJob,
  IconLocation, IconMail, IconPhone, IconUserCheck,
} from "@/components/portal/console/icons";
import { POOL_LABEL, POOL_META, POOL_ORDER, poolOf } from "@/lib/bench";
import { cn } from "@/lib/utils";

/* RecordBar: the candidate's identity card. Hierarchy, top to bottom: name and
   stage, the role they applied for, contact, then owner and rating as labelled
   facts. Three labelled actions (Email, Edit profile, More); the one filled
   action on the page is the stage move in StageTrack below. */

export type RecordBarProps = {
  candidate: Application & { jobDepartment?: string };
  benchSaving: boolean;
  ownerSaving: boolean;
  onRate: (n: number) => void;
  onBench: (p: BenchType | null) => void;
  onClaim: () => void;
  onEdit: () => void;
  onEmail: () => void;
};

const MENU = "rounded-[var(--adm-radius-card)] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1 shadow-[var(--adm-shadow-pop)]";
const MENU_LABEL = "px-2 pb-1 pt-1.5 text-adm-xs font-medium text-[var(--adm-ink-mute)]";
const ITEM = "cursor-pointer rounded-[6px] px-2 py-1.5 text-adm-base";

export function RecordBar({
  candidate,
  benchSaving,
  ownerSaving,
  onRate,
  onBench,
  onClaim,
  onEdit,
  onEmail,
}: RecordBarProps) {
  const router = useRouter();
  const location = [candidate.city, candidate.state].filter(Boolean).join(", ");
  const pool = candidate.addToTalentBench ? poolOf(candidate) : null;

  return (
    <div>
      {/* Row 1: who, and the few things you do to them. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar name={candidate.name} email={candidate.email} size="lg" className="hidden sm:flex" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="truncate text-adm-xl font-semibold leading-8 tracking-tight text-[var(--adm-ink)]">
                {candidate.name || "Unnamed candidate"}
              </h1>
              <StatusBadge status={candidate.status} size="md" />
              {pool && <StatusBadge tone={pool === "internal" ? "blue" : "emerald"} label={POOL_LABEL[pool]} size="md" />}
            </div>

            {candidate.jobTitle && (
              <p className="mt-1 text-adm-base text-[var(--adm-ink)]">
                <span className="text-[var(--adm-ink-subtle)]">Applied for </span>
                {candidate.jobId ? (
                  <Link href={`/portal/jobs/${candidate.jobId}`} className="font-medium text-[var(--adm-accent-strong)] underline-offset-4 hover:underline">
                    {candidate.jobTitle}
                  </Link>
                ) : (
                  <span className="font-medium">{candidate.jobTitle}</span>
                )}
                {candidate.jobDepartment && <span className="text-[var(--adm-ink-subtle)]"> · {candidate.jobDepartment}</span>}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-adm-xs text-[var(--adm-ink-mute)]">
              {candidate.email && (
                <a
                  href={`mailto:${candidate.email}`}
                  className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-[6px] underline-offset-4 hover:underline"
                >
                  <IconMail className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
                  <span className="truncate">{candidate.email}</span>
                </a>
              )}
              {candidate.phone && (
                <a
                  href={`tel:${candidate.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-[6px] tabular-nums underline-offset-4 hover:underline"
                >
                  <IconPhone className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
                  {candidate.phone}
                </a>
              )}
              {location && (
                <span className="inline-flex items-center gap-1.5">
                  <IconLocation className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
                  {location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Three labelled actions; the rest sit in More. The filled action is the stage move below. */}
        <div className="flex flex-none items-center gap-2 max-sm:[&>*]:flex-1">
          {candidate.email && (
            <WorkspaceButton onClick={onEmail}>
              <IconMail aria-hidden="true" />Email
            </WorkspaceButton>
          )}
          <WorkspaceButton onClick={onEdit}>
            <IconEdit aria-hidden="true" />Edit profile
          </WorkspaceButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <WorkspaceButton loading={benchSaving || ownerSaving} aria-label="More actions" title="More actions" className="max-sm:flex-none">
                <MoreVertical aria-hidden="true" />
              </WorkspaceButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6} className={cn("w-64", MENU)}>
              {candidate.jobId && (
                <DropdownMenuItem onClick={() => router.push(`/portal/jobs/${candidate.jobId}`)} className={ITEM}>
                  <IconJob className="mr-2 h-4 w-4 text-[var(--adm-ink-mute)]" aria-hidden="true" />View job posting
                </DropdownMenuItem>
              )}
              {!candidate.ownership && (
                <DropdownMenuItem onClick={onClaim} className={ITEM}>
                  <IconUserCheck className="mr-2 h-4 w-4 text-[var(--adm-ink-mute)]" aria-hidden="true" />Claim this candidate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="my-1 bg-[var(--adm-line-soft)]" />
              <DropdownMenuLabel className={MENU_LABEL}>Talent bench</DropdownMenuLabel>
              {POOL_ORDER.map((p) => {
                const selected = candidate.addToTalentBench && poolOf(candidate) === p;
                return (
                  <DropdownMenuItem key={p} onClick={() => onBench(p)} className="flex cursor-pointer items-start gap-2 rounded-[6px] px-2 py-2">
                    <Check className={cn("mt-0.5 h-3.5 w-3.5 flex-none text-[var(--adm-accent)]", selected ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-adm-xs", selected ? "font-medium text-[var(--adm-ink)]" : "text-[var(--adm-ink)]")}>
                        {selected ? `In ${POOL_LABEL[p]}` : `Add to ${POOL_LABEL[p]}`}
                      </span>
                      <span className="mt-0.5 block text-adm-xs text-[var(--adm-ink-mute)]">{POOL_META[p].hint}</span>
                    </span>
                  </DropdownMenuItem>
                );
              })}
              {candidate.addToTalentBench && (
                <DropdownMenuItem
                  onClick={() => onBench(null)}
                  className={cn(ITEM, "text-[var(--adm-danger-ink)] focus:bg-[var(--adm-danger-soft)] focus:text-[var(--adm-danger-ink)]")}
                >
                  <span className="mr-2 w-4" />Remove from bench
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Row 2: who owns it and how it rates, as labelled facts. */}
      <dl className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--adm-line-soft)] pt-3 text-adm-xs">
        <div className="flex items-center gap-2">
          <dt className="text-[var(--adm-ink-subtle)]">Owner</dt>
          <dd>
            {candidate.ownership ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-[var(--adm-ink)]">
                <IconUserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {candidate.ownershipName || "Claimed"}
              </span>
            ) : (
              <button
                type="button"
                onClick={onClaim}
                disabled={ownerSaving}
                className="inline-flex h-7 items-center gap-1.5 rounded-[6px] border border-[var(--adm-danger-line)] bg-[var(--adm-danger-soft)] px-3 font-medium text-[var(--adm-danger-ink)] hover:bg-[var(--adm-surface)]"
              >
                <IconUserCheck className="h-3.5 w-3.5" aria-hidden="true" />Unclaimed, claim
              </button>
            )}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-[var(--adm-ink-subtle)]">Rating</dt>
          <dd className="flex items-center gap-1.5">
            <StarRating rating={candidate.rating || 0} onRate={onRate} size="md" />
            <span className="tabular-nums text-[var(--adm-ink-mute)]">{candidate.rating ? `${candidate.rating}/5` : "Not rated"}</span>
          </dd>
        </div>
      </dl>
    </div>
  );
}
