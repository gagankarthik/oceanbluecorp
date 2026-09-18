"use client";

import { IconBuilding, IconLocation } from "./icons";
import type {
  ResumeAnalysis, ResumeWorkExperience, ResumeEducation, ResumeSkills,
} from "@/lib/aws/dynamodb";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { cn } from "@/lib/utils";

// ── small helpers ────────────────────────────────────────────────────────────

function dateRange(start?: string | null, end?: string | null, isCurrent?: boolean | null): string {
  const s = (start || "").trim();
  const e = isCurrent ? "Present" : (end || "").trim();
  if (s && e) return `${s} – ${e}`;
  return s || e || "";
}

function Chips({ items, tone = "cobalt" }: { items?: string[]; tone?: "cobalt" | "slate" }) {
  const list = (items || []).filter(Boolean);
  if (!list.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((it, i) => (
        <span
          key={`${it}-${i}`}
          className={cn(
            "inline-flex items-center rounded-[6px] px-2 py-0.5 text-[12.5px] font-medium",
            tone === "cobalt"
              ? "bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]"
              : "bg-[var(--adm-surface-2)] text-[var(--adm-ink-mute)]",
          )}
        >
          {it}
        </span>
      ))}
    </div>
  );
}

/** One figure in the profile summary. Empty values are not rendered as data. */
function Stat({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="min-w-0">
      <dt className="text-[13px] text-[var(--adm-ink-mute)]">{label}</dt>
      <dd className="mt-1 truncate text-[15px] font-semibold tabular-nums text-[var(--adm-ink)]">{value}</dd>
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[13px] font-medium text-[var(--adm-ink-mute)]">{children}</p>;
}

const bullet =
  "relative pl-3.5 before:absolute before:left-0 before:top-[8px] before:h-1 before:w-1 before:rounded-full";

// ── skills grouping ──────────────────────────────────────────────────────────

const SKILL_GROUPS: Array<{ key: keyof ResumeSkills; label: string }> = [
  { key: "programming_languages", label: "Languages" },
  { key: "frameworks_and_libraries", label: "Frameworks & libraries" },
  { key: "databases", label: "Databases" },
  { key: "cloud_platforms", label: "Cloud" },
  { key: "tools_and_platforms", label: "Tools & platforms" },
  { key: "methodologies", label: "Methodologies" },
  { key: "domain_skills", label: "Domain" },
  { key: "soft_skills", label: "Soft skills" },
  { key: "operating_systems", label: "Operating systems" },
  { key: "design_skills", label: "Design" },
  { key: "other_skills", label: "Other" },
];

function hasAnySkills(s?: ResumeSkills): boolean {
  if (!s) return false;
  if (s.categories?.some((c) => (c.skills || []).length)) return true;
  if (SKILL_GROUPS.some((g) => ((s[g.key] as string[]) || []).length)) return true;
  return (s.all_skills_raw || []).length > 0;
}

// ── work experience entry ────────────────────────────────────────────────────

function WorkEntry({ w }: { w: ResumeWorkExperience }) {
  const range = dateRange(w.start_date, w.end_date, w.is_current);
  return (
    <li className="relative border-l border-[var(--adm-line-soft)] pb-5 pl-5 last:border-transparent last:pb-0">
      <span aria-hidden className="absolute -left-[4.5px] top-[7px] h-2 w-2 rounded-full bg-[var(--adm-accent)]" />
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-[var(--adm-ink)]">{w.job_title || "Role"}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--adm-ink-mute)]">
            {w.company_name && (
              <span className="inline-flex items-center gap-1.5">
                <IconBuilding className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />
                {w.company_name}
              </span>
            )}
            {w.location && (
              <span className="inline-flex items-center gap-1.5 text-[var(--adm-ink-subtle)]">
                <IconLocation className="h-3.5 w-3.5 flex-none" />
                {w.location}
              </span>
            )}
          </p>
        </div>
        {range && <span className="flex-none text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]">{range}</span>}
      </div>
      {!!(w.responsibilities && w.responsibilities.length) && (
        <ul className="mt-2.5 space-y-1">
          {w.responsibilities.map((r, i) => (
            <li key={i} className={cn(bullet, "text-[13px] leading-relaxed text-[var(--adm-ink-mute)] before:bg-[var(--adm-line-strong)]")}>
              {r}
            </li>
          ))}
        </ul>
      )}
      {!!(w.achievements && w.achievements.length) && (
        <ul className="mt-2.5 space-y-1">
          {w.achievements.map((a, i) => (
            <li key={i} className={cn(bullet, "text-[13px] leading-relaxed text-[var(--adm-ink)] before:bg-[var(--adm-success)]")}>
              {a}
            </li>
          ))}
        </ul>
      )}
      {!!(w.technologies_used && w.technologies_used.length) && (
        <div className="mt-3"><Chips items={w.technologies_used} tone="slate" /></div>
      )}
    </li>
  );
}

function EduEntry({ e }: { e: ResumeEducation }) {
  const range = dateRange(e.start_date, e.end_date, e.is_current);
  const degree = [e.degree_type || e.degree, e.field_of_study || e.major].filter(Boolean).join(", ");
  return (
    <li className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[var(--adm-ink)]">{e.institution_name || "Institution"}</p>
        {degree && <p className="mt-0.5 text-[13px] text-[var(--adm-ink-mute)]">{degree}</p>}
        {(e.gpa || e.grade || e.percentage) && (
          <p className="mt-0.5 text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]">
            {e.gpa ? `GPA ${e.gpa}` : e.percentage ? `${e.percentage}%` : e.grade}
          </p>
        )}
      </div>
      {range && <span className="flex-none text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]">{range}</span>}
    </li>
  );
}

// ── main panel ───────────────────────────────────────────────────────────────

export function ResumeAnalysisPanel({ analysis }: { analysis: ResumeAnalysis }) {
  const a = analysis.analytics;
  const work = analysis.work_experience || [];
  const edu = analysis.education || [];
  const skills = analysis.skills;
  const certs = analysis.certifications || [];
  const projects = analysis.projects || [];
  const awards = analysis.awards_and_honors || [];
  const langs = analysis.languages || [];

  return (
    <div className="space-y-4">
      {a && (
        <AdminCard>
          <AdminCardHeader title="Profile summary" />
          <div className="space-y-4 p-4">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 xl:grid-cols-4">
              <Stat label="Experience" value={a.total_years_of_experience != null ? `${a.total_years_of_experience} yrs` : null} />
              <Stat label="Career level" value={a.career_level} />
              <Stat label="Primary industry" value={a.primary_industry} />
              <Stat label="Highest education" value={a.highest_education_level} />
              <Stat label="Companies" value={a.number_of_companies} />
              <Stat label="Roles" value={a.number_of_roles} />
              <Stat label="Avg tenure" value={a.average_tenure_months != null ? `${a.average_tenure_months} mo` : null} />
              <Stat label="Location" value={a.primary_location} />
            </dl>
            {!!(a.job_functions && a.job_functions.length) && (
              <div className="border-t border-[var(--adm-line-soft)] pt-4">
                <GroupLabel>Job functions</GroupLabel>
                <Chips items={a.job_functions} tone="slate" />
              </div>
            )}
          </div>
        </AdminCard>
      )}

      {(analysis.professional_summary || analysis.objective) && (
        <AdminCard>
          <AdminCardHeader title="Professional summary" />
          <div className="space-y-3 p-4">
            {analysis.professional_summary && (
              <p className="whitespace-pre-line text-[14px] leading-relaxed text-[var(--adm-ink-mute)]">{analysis.professional_summary}</p>
            )}
            {analysis.objective && (
              <p className="whitespace-pre-line text-[13px] italic leading-relaxed text-[var(--adm-ink-subtle)]">{analysis.objective}</p>
            )}
          </div>
        </AdminCard>
      )}

      {work.length > 0 && (
        <AdminCard>
          <AdminCardHeader title="Work experience" count={work.length} />
          <div className="p-4">
            <ol className="ml-1">{work.map((w, i) => <WorkEntry key={i} w={w} />)}</ol>
          </div>
        </AdminCard>
      )}

      {hasAnySkills(skills) && (
        <AdminCard>
          <AdminCardHeader title="Skills" />
          <div className="space-y-4 p-4">
            {/* Verbatim categories from the resume win over the parser's groups. */}
            {skills?.categories && skills.categories.length > 0 ? (
              skills.categories.map((c, i) => (
                <div key={i}>
                  {c.name && <GroupLabel>{c.name}</GroupLabel>}
                  <Chips items={c.skills} />
                </div>
              ))
            ) : (
              SKILL_GROUPS.map((g) => {
                const items = (skills?.[g.key] as string[]) || [];
                if (!items.length) return null;
                return (
                  <div key={g.key}>
                    <GroupLabel>{g.label}</GroupLabel>
                    <Chips items={items} />
                  </div>
                );
              })
            )}
            {!skills?.categories?.length && !SKILL_GROUPS.some((g) => ((skills?.[g.key] as string[]) || []).length) && (
              <Chips items={skills?.all_skills_raw} />
            )}
          </div>
        </AdminCard>
      )}

      {edu.length > 0 && (
        <AdminCard>
          <AdminCardHeader title="Education" count={edu.length} />
          <ul className="divide-y divide-[var(--adm-line-soft)] p-4">
            {edu.map((e, i) => <EduEntry key={i} e={e} />)}
          </ul>
        </AdminCard>
      )}

      {certs.length > 0 && (
        <AdminCard>
          <AdminCardHeader title="Certifications" count={certs.length} />
          <ul className="divide-y divide-[var(--adm-line-soft)] p-4">
            {certs.map((c, i) => (
              <li key={i} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[var(--adm-ink)]">{c.name}</p>
                  {c.issuing_organization && <p className="mt-0.5 text-[13px] text-[var(--adm-ink-mute)]">{c.issuing_organization}</p>}
                </div>
                {(c.issue_date || c.expiry_date) && (
                  <span className="flex-none text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]">
                    {dateRange(c.issue_date, c.expiry_date)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </AdminCard>
      )}

      {projects.length > 0 && (
        <AdminCard>
          <AdminCardHeader title="Projects" count={projects.length} />
          <div className="divide-y divide-[var(--adm-line-soft)] p-4">
            {projects.map((p, i) => {
              const range = dateRange(p.start_date, p.end_date, p.is_current);
              return (
                <div key={i} className="space-y-2 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <p className="text-[14px] font-semibold text-[var(--adm-ink)]">{p.name}</p>
                    {range && <span className="text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]">{range}</span>}
                  </div>
                  {p.description && <p className="text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">{p.description}</p>}
                  {!!(p.highlights && p.highlights.length) && (
                    <ul className="space-y-1">
                      {p.highlights.map((h, j) => (
                        <li key={j} className={cn(bullet, "text-[13px] leading-relaxed text-[var(--adm-ink-mute)] before:bg-[var(--adm-line-strong)]")}>{h}</li>
                      ))}
                    </ul>
                  )}
                  {!!(p.technologies && p.technologies.length) && <Chips items={p.technologies} tone="slate" />}
                </div>
              );
            })}
          </div>
        </AdminCard>
      )}

      {(awards.length > 0 || langs.length > 0) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {awards.length > 0 && (
            <AdminCard>
              <AdminCardHeader title="Awards" count={awards.length} />
              <ul className="divide-y divide-[var(--adm-line-soft)] p-4">
                {awards.map((aw, i) => (
                  <li key={i} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-[14px] font-semibold text-[var(--adm-ink)]">{aw.title}</p>
                    {(aw.issuer || aw.date) && (
                      <p className="mt-0.5 text-[13px] text-[var(--adm-ink-mute)]">{[aw.issuer, aw.date].filter(Boolean).join(" · ")}</p>
                    )}
                  </li>
                ))}
              </ul>
            </AdminCard>
          )}
          {langs.length > 0 && (
            <AdminCard>
              <AdminCardHeader title="Languages" count={langs.length} />
              <div className="flex flex-wrap gap-2 p-4">
                {langs.map((l, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-2.5 py-1 text-[13px]"
                  >
                    <span className="font-medium text-[var(--adm-ink)]">{l.language}</span>
                    {l.proficiency && <span className="text-[var(--adm-ink-subtle)]">{l.proficiency}</span>}
                  </span>
                ))}
              </div>
            </AdminCard>
          )}
        </div>
      )}

      {!!(analysis.interests_and_hobbies && analysis.interests_and_hobbies.length) && (
        <AdminCard>
          <AdminCardHeader title="Interests" />
          <div className="p-4"><Chips items={analysis.interests_and_hobbies} tone="slate" /></div>
        </AdminCard>
      )}
    </div>
  );
}
