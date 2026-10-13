"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar } from "@/components/admin/avatar";
import { WorkspaceButton } from "@/components/admin/workspace";
import { IconDownload, IconFile, IconMail, IconPhone } from "@/components/admin/icons";
import { VerdictBadge, SkillChips, OriginBadge, fitScoreColor, type Verdict, type MatchOrigin } from "@/components/admin/fit-ui";
import { cn } from "@/lib/utils";

export interface MatchProfile {
  resume_id: string;
  candidate_name: string | null;
  fit_score: number;
  qualified: boolean;
  verdict: Verdict;
  matched_skills: string[];
  missing_skills: string[];
  rationale: string | null;
  origin?: MatchOrigin;
  email?: string;
  phone?: string;
  fileName?: string;
  bankId?: string;
}

const isPdf = (name?: string) => /\.pdf$/i.test(name || "");

/**
 * The profile of a resume-bank match. A bank hit has no candidate record, so
 * its profile is what we know: the parsed contact card, the engine's verdict
 * for this job, and the resume itself (PDFs inline, Word files to download).
 */
export function MatchProfileDrawer({ candidate, onClose }: { candidate: MatchProfile | null; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Signed URLs expire, so one is fetched each time a profile opens.
  useEffect(() => {
    setUrl(null);
    setFileError(null);
    if (!candidate?.bankId) return;
    let active = true;
    fetch(`/api/resume-bank/${candidate.bankId}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d.downloadUrl) throw new Error(d.error || "Couldn't open the resume file.");
        if (active) setUrl(d.downloadUrl);
      })
      .catch((e) => { if (active) setFileError(e instanceof Error ? e.message : "Couldn't open the resume file."); });
    return () => { active = false; };
  }, [candidate?.bankId]);

  const c = candidate;
  const name = c?.candidate_name || "Unnamed candidate";
  const pdf = isPdf(c?.fileName);

  return (
    <Sheet open={!!c} onOpenChange={(next) => { if (!next) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 bg-[var(--adm-surface-sunken)] p-0 sm:max-w-[640px]"
      >
        {c && (
          <>
            <div className="flex flex-shrink-0 items-start gap-3 border-b border-[var(--adm-line)] bg-[var(--adm-surface)] px-4 py-4">
              <Avatar name={name} email={c.email} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <SheetTitle className="truncate text-adm-md font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">{name}</SheetTitle>
                  <OriginBadge origin={c.origin} className="flex-none" />
                </div>
                <SheetDescription className="mt-0.5 truncate text-adm-xs text-[var(--adm-ink-mute)]">
                  {c.fileName || "Resume bank"}
                </SheetDescription>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close profile"
                className="adm-hit grid h-8 w-8 flex-none place-items-center rounded-[8px] text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              {/* Fit for this job */}
              <section className="rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-adm-xs font-medium text-[var(--adm-ink-mute)]">Fit for this job</h3>
                    <p className="mt-1 tabular-nums">
                      <span className={cn("text-adm-xl font-semibold leading-none tracking-[-0.02em]", fitScoreColor(c.fit_score))}>{c.fit_score}</span>
                      <span className="ml-0.5 text-adm-xs font-medium text-[var(--adm-ink-mute)]">/100</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <VerdictBadge verdict={c.verdict} />
                    <span className="text-adm-xs text-[var(--adm-ink-mute)]">{c.qualified ? "Meets the core requirements" : "Gaps against the core requirements"}</span>
                  </div>
                </div>
                {c.rationale && <p className="mt-3 text-adm-base leading-relaxed text-[var(--adm-ink)]">{c.rationale}</p>}
                <div className="mt-3">
                  <SkillChips matched={c.matched_skills} missing={c.missing_skills} />
                </div>
              </section>

              {/* Contact */}
              <section className="rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
                <h3 className="text-adm-xs font-medium text-[var(--adm-ink-mute)]">Contact</h3>
                {c.email || c.phone ? (
                  <ul className="mt-2 space-y-1.5 text-adm-base">
                    {c.email && (
                      <li className="flex items-center gap-2">
                        <IconMail className="h-4 w-4 flex-none text-[var(--adm-ink-mute)]" aria-hidden="true" />
                        <a href={`mailto:${c.email}`} className="truncate text-[var(--adm-accent)] hover:underline">{c.email}</a>
                      </li>
                    )}
                    {c.phone && (
                      <li className="flex items-center gap-2">
                        <IconPhone className="h-4 w-4 flex-none text-[var(--adm-ink-mute)]" aria-hidden="true" />
                        <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="tabular-nums text-[var(--adm-accent)] hover:underline">{c.phone}</a>
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="mt-2 text-adm-base text-[var(--adm-ink-mute)]">No contact details were found in the resume.</p>
                )}
              </section>

              {/* Resume */}
              <section className="overflow-hidden rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)]">
                <h3 className="border-b border-[var(--adm-line-soft)] px-4 py-3 text-adm-xs font-medium text-[var(--adm-ink-mute)]">Resume</h3>
                {fileError ? (
                  <p role="alert" className="px-4 py-6 text-center text-adm-base text-[var(--adm-danger-ink)]">{fileError}</p>
                ) : !url ? (
                  <p className="flex items-center justify-center gap-2 px-4 py-6 text-adm-base text-[var(--adm-ink-mute)]">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Opening the resume…
                  </p>
                ) : pdf ? (
                  <iframe src={url} title={`${name} resume`} className="h-[65vh] w-full border-0" />
                ) : (
                  <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
                    <IconFile className="h-7 w-7 text-[var(--adm-ink-mute)]" aria-hidden="true" />
                    <p className="max-w-xs text-adm-base text-[var(--adm-ink-mute)]">
                      Word documents can&apos;t be shown in the browser. Download the file to read it.
                    </p>
                  </div>
                )}
              </section>
            </div>

            <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[var(--adm-line)] bg-[var(--adm-surface)] px-4 py-3">
              {url && (
                <WorkspaceButton asChild variant={c.email ? "secondary" : "primary"} className="flex-1 sm:flex-none">
                  <a href={url} download={c.fileName || "resume"}>
                    <IconDownload aria-hidden="true" />Download resume
                  </a>
                </WorkspaceButton>
              )}
              {c.email && (
                <WorkspaceButton asChild variant="primary" className="flex-1 sm:flex-none">
                  <a href={`mailto:${c.email}`}>
                    <IconMail aria-hidden="true" />Email candidate
                  </a>
                </WorkspaceButton>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
