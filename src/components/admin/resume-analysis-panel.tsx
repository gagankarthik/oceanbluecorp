"use client";

import {
  Briefcase, GraduationCap, Tag, Award, Languages as LanguagesIcon,
  FolderGit2, BadgeCheck, TrendingUp, Building2, MapPin, Calendar,
  Sparkles, Layers,
} from "lucide-react";
import type {
  ResumeAnalysis, ResumeWorkExperience, ResumeEducation, ResumeSkills,
} from "@/lib/aws/dynamodb";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { cn } from "@/lib/utils";

// ── small helpers ────────────────────────────────────────────────────────────

function dateRange(start?: string | null, end?: string | null, isCurrent?: boolean | null): string {
  const s = (start || "").trim();
  const e = isCurrent ? "Present" : (end || "").trim();
  if (s && e) return `${s} — ${e}`;
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
            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
            tone === "cobalt"
              ? "bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]"
              : "bg-slate-100 text-slate-600",
          )}
        >
          {it}
        </span>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-3">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

// ── skills grouping ──────────────────────────────────────────────────────────

const SKILL_GROUPS: Array<{ key: keyof ResumeSkills; label: string }> = [
  { key: "programming_languages", label: "Languages" },
  { key: "frameworks_and_libraries", label: "Frameworks & Libraries" },
  { key: "databases", label: "Databases" },
  { key: "cloud_platforms", label: "Cloud" },
  { key: "tools_and_platforms", label: "Tools & Platforms" },
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
    <li className="relative pl-6 pb-5 last:pb-0">
      <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--hz-cobalt)] ring-4 ring-[var(--hz-cobalt-100)]" />
      <span className="absolute left-[5px] top-4 bottom-0 w-px bg-slate-100 last:hidden" />
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">{w.job_title || "Role"}</p>
          <p className="text-sm text-slate-600 flex items-center gap-1.5 flex-wrap">
            {w.company_name && <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-slate-400" />{w.company_name}</span>}
            {w.location && <span className="inline-flex items-center gap-1 text-slate-400"><MapPin className="w-3 h-3" />{w.location}</span>}
          </p>
        </div>
        {range && (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 tabular-nums flex-shrink-0">
            <Calendar className="w-3 h-3" />{range}
          </span>
        )}
      </div>
      {!!(w.responsibilities && w.responsibilities.length) && (
        <ul className="mt-2 space-y-1">
          {w.responsibilities.map((r, i) => (
            <li key={i} className="text-xs text-slate-600 leading-relaxed pl-3.5 relative before:absolute before:left-0 before:top-[7px] before:h-1 before:w-1 before:rounded-full before:bg-slate-300">
              {r}
            </li>
          ))}
        </ul>
      )}
      {!!(w.achievements && w.achievements.length) && (
        <ul className="mt-2 space-y-1">
          {w.achievements.map((a, i) => (
            <li key={i} className="text-xs text-emerald-700 leading-relaxed pl-4 relative before:absolute before:left-0 before:top-0 before:content-['★'] before:text-[9px]">
              {a}
            </li>
          ))}
        </ul>
      )}
      {!!(w.technologies_used && w.technologies_used.length) && (
        <div className="mt-2"><Chips items={w.technologies_used} tone="slate" /></div>
      )}
    </li>
  );
}

function EduEntry({ e }: { e: ResumeEducation }) {
  const range = dateRange(e.start_date, e.end_date, e.is_current);
  const degree = [e.degree_type || e.degree, e.field_of_study || e.major].filter(Boolean).join(", ");
  return (
    <li className="flex items-start justify-between gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{e.institution_name || "Institution"}</p>
        {degree && <p className="text-xs text-slate-600 mt-0.5">{degree}</p>}
        {(e.gpa || e.grade || e.percentage) && (
          <p className="text-[11px] text-slate-400 mt-0.5">
            {e.gpa ? `GPA ${e.gpa}` : e.percentage ? `${e.percentage}%` : e.grade}
          </p>
        )}
      </div>
      {range && <span className="text-[11px] text-slate-400 tabular-nums flex-shrink-0">{range}</span>}
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
      {/* Analytics overview */}
      {a && (
        <AdminCard className="overflow-hidden">
          <AdminCardHeader icon={TrendingUp} title="Profile summary" tone="blue" />
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <Stat label="Experience" value={a.total_years_of_experience != null ? `${a.total_years_of_experience} yrs` : null} />
            <Stat label="Career level" value={a.career_level} />
            <Stat label="Primary industry" value={a.primary_industry} />
            <Stat label="Highest education" value={a.highest_education_level} />
            <Stat label="Companies" value={a.number_of_companies} />
            <Stat label="Roles" value={a.number_of_roles} />
            <Stat label="Avg tenure" value={a.average_tenure_months != null ? `${a.average_tenure_months} mo` : null} />
            <Stat label="Location" value={a.primary_location} />
          </div>
          {!!(a.job_functions && a.job_functions.length) && (
            <div className="px-4 pb-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Job functions</p>
              <Chips items={a.job_functions} tone="slate" />
            </div>
          )}
        </AdminCard>
      )}

      {/* Professional summary */}
      {(analysis.professional_summary || analysis.objective) && (
        <AdminCard className="overflow-hidden">
          <AdminCardHeader icon={Sparkles} title="Professional summary" tone="blue" />
          <div className="px-5 py-4 space-y-3">
            {analysis.professional_summary && (
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{analysis.professional_summary}</p>
            )}
            {analysis.objective && (
              <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-line italic">{analysis.objective}</p>
            )}
          </div>
        </AdminCard>
      )}

      {/* Work experience */}
      {work.length > 0 && (
        <AdminCard className="overflow-hidden">
          <AdminCardHeader icon={Briefcase} title="Work experience" count={work.length} />
          <div className="px-5 py-4">
            <ol>{work.map((w, i) => <WorkEntry key={i} w={w} />)}</ol>
          </div>
        </AdminCard>
      )}

      {/* Skills */}
      {hasAnySkills(skills) && (
        <AdminCard className="overflow-hidden">
          <AdminCardHeader icon={Tag} title="Skills" />
          <div className="px-5 py-4 space-y-3.5">
            {/* Prefer verbatim categories from the resume when present */}
            {skills?.categories && skills.categories.length > 0 ? (
              skills.categories.map((c, i) => (
                <div key={i}>
                  {c.name && <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{c.name}</p>}
                  <Chips items={c.skills} />
                </div>
              ))
            ) : (
              SKILL_GROUPS.map((g) => {
                const items = (skills?.[g.key] as string[]) || [];
                if (!items.length) return null;
                return (
                  <div key={g.key}>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{g.label}</p>
                    <Chips items={items} />
                  </div>
                );
              })
            )}
            {/* Fallback: raw skills if nothing categorized produced output */}
            {!skills?.categories?.length && !SKILL_GROUPS.some((g) => ((skills?.[g.key] as string[]) || []).length) && (
              <Chips items={skills?.all_skills_raw} />
            )}
          </div>
        </AdminCard>
      )}

      {/* Education */}
      {edu.length > 0 && (
        <AdminCard className="overflow-hidden">
          <AdminCardHeader icon={GraduationCap} title="Education" count={edu.length} />
          <div className="px-5 py-2">
            <ul>{edu.map((e, i) => <EduEntry key={i} e={e} />)}</ul>
          </div>
        </AdminCard>
      )}

      {/* Certifications */}
      {certs.length > 0 && (
        <AdminCard className="overflow-hidden">
          <AdminCardHeader icon={BadgeCheck} title="Certifications" count={certs.length} tone="emerald" />
          <div className="px-5 py-2">
            <ul>
              {certs.map((c, i) => (
                <li key={i} className="flex items-start justify-between gap-3 py-2.5 border-b border-slate-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                    {c.issuing_organization && <p className="text-xs text-slate-500 mt-0.5">{c.issuing_organization}</p>}
                  </div>
                  {(c.issue_date || c.expiry_date) && (
                    <span className="text-[11px] text-slate-400 tabular-nums flex-shrink-0">
                      {dateRange(c.issue_date, c.expiry_date)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </AdminCard>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <AdminCard className="overflow-hidden">
          <AdminCardHeader icon={FolderGit2} title="Projects" count={projects.length} />
          <div className="px-5 py-4 space-y-4">
            {projects.map((p, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm font-bold text-slate-900">{p.name}</p>
                  {dateRange(p.start_date, p.end_date, p.is_current) && (
                    <span className="text-[11px] text-slate-400 tabular-nums">{dateRange(p.start_date, p.end_date, p.is_current)}</span>
                  )}
                </div>
                {p.description && <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>}
                {!!(p.highlights && p.highlights.length) && (
                  <ul className="space-y-1">
                    {p.highlights.map((h, j) => (
                      <li key={j} className="text-xs text-slate-600 pl-3.5 relative before:absolute before:left-0 before:top-[7px] before:h-1 before:w-1 before:rounded-full before:bg-slate-300">{h}</li>
                    ))}
                  </ul>
                )}
                {!!(p.technologies && p.technologies.length) && <Chips items={p.technologies} tone="slate" />}
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {/* Awards + Languages (compact, side by side on wide) */}
      {(awards.length > 0 || langs.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {awards.length > 0 && (
            <AdminCard className="overflow-hidden">
              <AdminCardHeader icon={Award} title="Awards" count={awards.length} tone="amber" />
              <div className="px-5 py-2">
                <ul>
                  {awards.map((aw, i) => (
                    <li key={i} className="py-2 border-b border-slate-50 last:border-0">
                      <p className="text-sm font-semibold text-slate-900">{aw.title}</p>
                      {(aw.issuer || aw.date) && <p className="text-xs text-slate-500 mt-0.5">{[aw.issuer, aw.date].filter(Boolean).join(" · ")}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            </AdminCard>
          )}
          {langs.length > 0 && (
            <AdminCard className="overflow-hidden">
              <AdminCardHeader icon={LanguagesIcon} title="Languages" count={langs.length} />
              <div className="px-5 py-3 flex flex-wrap gap-2">
                {langs.map((l, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-semibold text-slate-800">{l.language}</span>
                    {l.proficiency && <span className="text-slate-400">{l.proficiency}</span>}
                  </span>
                ))}
              </div>
            </AdminCard>
          )}
        </div>
      )}

      {/* Interests */}
      {!!(analysis.interests_and_hobbies && analysis.interests_and_hobbies.length) && (
        <AdminCard className="overflow-hidden">
          <AdminCardHeader icon={Layers} title="Interests" />
          <div className="px-5 py-4"><Chips items={analysis.interests_and_hobbies} tone="slate" /></div>
        </AdminCard>
      )}
    </div>
  );
}
