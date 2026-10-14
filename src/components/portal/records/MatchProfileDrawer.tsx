"use client";

import { useEffect, useState } from "react";
import { Avatar, Button, Drawer, Skeleton } from "@/components/portal/kit";
import { Notice } from "@/components/portal/fields";
import Icon from "@/components/portal/icons";
import { FitScore, OriginBadge, SkillChips, VerdictBadge, type MatchOrigin, type Verdict } from "./fit";

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

function Section({ title, children, flush = false }: { title: string; children: React.ReactNode; flush?: boolean }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl bg-mist-0 ring-1 ring-mist-200">
      <h3 className="border-b border-mist-200 px-4 py-2.5 text-[13px] font-semibold text-navy-900">{title}</h3>
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  );
}

/**
 * A resume-bank match. A bank hit has no candidate record, so its profile is
 * what we know: the parsed contact card, the verdict for this job, and the
 * resume itself (PDFs inline, Word files to download).
 */
export function MatchProfileDrawer({ candidate, onClose }: { candidate: MatchProfile | null; onClose: () => void }) {
  return candidate ? <Body c={candidate} onClose={onClose} /> : null;
}

function Body({ c, onClose }: { c: MatchProfile; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Signed URLs expire, so one is fetched each time a profile opens.
  useEffect(() => {
    setUrl(null);
    setFileError(null);
    if (!c.bankId) return;
    let active = true;
    fetch(`/api/resume-bank/${c.bankId}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d.downloadUrl) throw new Error(d.error || "Couldn't open the resume file.");
        if (active) setUrl(d.downloadUrl);
      })
      .catch((e) => {
        if (active) setFileError(e instanceof Error ? e.message : "Couldn't open the resume file.");
      });
    return () => {
      active = false;
    };
  }, [c.bankId, attempt]);

  const name = c.candidate_name || "Unnamed candidate";
  const pdf = isPdf(c.fileName);

  return (
    <Drawer
      width="lg"
      title={name}
      onClose={onClose}
      footer={
        (url || c.email) && (
          <div className="flex w-full flex-wrap justify-end gap-2 max-sm:[&>*]:flex-1">
            {url && (
              <a
                href={url}
                download={c.fileName || "resume"}
                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-[14px] font-medium ${
                  c.email ? "bg-mist-0 text-navy-900 ring-1 ring-inset ring-mist-300 hover:bg-mist-50" : "bg-ocean-600 text-white hover:bg-ocean-700"
                }`}
              >
                <Icon name="download" className="size-[18px]" />
                Download resume
              </a>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-ocean-600 px-4 text-[14px] font-medium text-white hover:bg-ocean-700">
                <Icon name="mail" className="size-[18px]" />
                Email candidate
              </a>
            )}
          </div>
        )
      }
    >
      <div className="grid gap-5">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={name} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <OriginBadge origin={c.origin} />
            </div>
            <p className="mt-1 truncate text-[13px] text-mist-600">{c.fileName || "Resume bank"}</p>
          </div>
        </div>

        <Section title="Fit for this job">
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid gap-1.5">
                <VerdictBadge verdict={c.verdict} />
                <p className="text-[13px] text-mist-600">{c.qualified ? "Meets the core requirements" : "Gaps against the core requirements"}</p>
              </div>
              <FitScore score={c.fit_score} size="lg" />
            </div>
            {c.rationale && <p className="text-[14px] leading-relaxed text-mist-700">{c.rationale}</p>}
            <SkillChips matched={c.matched_skills} missing={c.missing_skills} />
          </div>
        </Section>

        <Section title="Contact">
          {c.email || c.phone ? (
            <ul className="grid gap-2 text-[14px]">
              {c.email && (
                <li className="flex min-w-0 items-center gap-2">
                  <Icon name="mail" className="size-4 shrink-0 text-mist-500" />
                  <a href={`mailto:${c.email}`} className="truncate text-ocean-700 underline-offset-4 hover:underline">
                    {c.email}
                  </a>
                </li>
              )}
              {c.phone && (
                <li className="flex items-center gap-2">
                  <Icon name="phone" className="size-4 shrink-0 text-mist-500" />
                  <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="tabular-nums text-ocean-700 underline-offset-4 hover:underline">
                    {c.phone}
                  </a>
                </li>
              )}
            </ul>
          ) : (
            <p className="text-[14px] text-mist-600">No contact details were found in the resume.</p>
          )}
        </Section>

        <Section title="Resume" flush>
          {!c.bankId ? (
            <p className="px-4 py-6 text-center text-[14px] text-mist-600">No resume file is attached to this match.</p>
          ) : fileError ? (
            <div className="p-4">
              <Notice
                tone="error"
                action={
                  <Button size="sm" variant="secondary" icon="refresh" onClick={() => setAttempt((n) => n + 1)}>
                    Retry
                  </Button>
                }
              >
                {fileError}
              </Notice>
            </div>
          ) : !url ? (
            <div role="status" aria-label="Opening the resume" className="grid gap-2.5 p-4">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-10/12" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ) : pdf ? (
            <iframe src={url} title={`${name} resume`} className="h-[65vh] w-full border-0" />
          ) : (
            <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
              <Icon name="resume" className="size-7 text-mist-500" />
              <p className="max-w-xs text-[14px] text-mist-600">Word documents can&apos;t be shown in the browser. Download the file to read it.</p>
            </div>
          )}
        </Section>
      </div>
    </Drawer>
  );
}
