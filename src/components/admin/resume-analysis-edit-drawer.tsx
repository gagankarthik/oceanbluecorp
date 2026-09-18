"use client";

import * as React from "react";
import { Loader2, X, Plus } from "lucide-react";
import { IconTrash, IconWarning } from "./icons";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import type {
  Application, ResumeAnalysis, ResumeWorkExperience, ResumeEducation, ResumeCertification,
} from "@/lib/aws/dynamodb";
import { AdminCard, AdminCardHeader } from "./admin-card";
import { WorkspaceButton } from "./workspace";
import { Field, FormInput, FormSelect, FormTextarea } from "./forms/primitives";

// ── array <-> text helpers ───────────────────────────────────────────────────

const arrToLines = (a?: string[]) => (a || []).join("\n");
const linesToArr = (t: string) => t.split("\n").map((s) => s.trim()).filter(Boolean);
const arrToCommas = (a?: string[]) => (a || []).join(", ");
const commasToArr = (t: string) => t.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);

const CAREER_LEVELS = ["Entry-Level", "Mid-Level", "Senior", "Director", "Executive"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application;
  onSaved?: (app: Application) => void;
}

// ── layout atoms ─────────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  onAdd,
  addLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <AdminCard>
      <AdminCardHeader
        title={title}
        subtitle={subtitle}
        action={onAdd && (
          <WorkspaceButton variant="ghost" onClick={onAdd} aria-label={addLabel}>
            <Plus aria-hidden="true" />
            Add
          </WorkspaceButton>
        )}
      />
      <div className="p-4">{children}</div>
    </AdminCard>
  );
}

/** One repeatable entry (a role, a degree, a certificate) inside a section. */
function Entry({ label, onRemove, children }: { label: string; onRemove: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] p-3.5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-[var(--adm-ink-mute)]">{label}</p>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label.toLowerCase()}`}
          className="-my-1 grid h-8 w-8 place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]"
        >
          <IconTrash className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {children}
    </div>
  );
}

function NoEntries({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] text-[var(--adm-ink-subtle)]">{children}</p>;
}

// ── drawer ───────────────────────────────────────────────────────────────────

export function ResumeAnalysisEditDrawer({ open, onOpenChange, application, onSaved }: Props) {
  const [draft, setDraft] = React.useState<ResumeAnalysis>({});
  // Skill groups edited as free text; parsed back to arrays on save.
  const [skillsText, setSkillsText] = React.useState({
    technical: "", soft: "", programming: "", tools: "", raw: "",
  });
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    const a = application.resumeAnalysis || {};
    setDraft(JSON.parse(JSON.stringify(a)) as ResumeAnalysis);
    setSkillsText({
      technical: arrToCommas(a.skills?.technical_skills),
      soft: arrToCommas(a.skills?.soft_skills),
      programming: arrToCommas(a.skills?.programming_languages),
      tools: arrToCommas(a.skills?.tools_and_platforms),
      raw: arrToCommas(a.skills?.all_skills_raw),
    });
  }, [open, application]);

  // ── generic nested setters ──
  const setAnalytics = (k: string, v: unknown) =>
    setDraft((d) => ({ ...d, analytics: { ...(d.analytics || {}), [k]: v } as ResumeAnalysis["analytics"] }));

  const setWork = (i: number, k: keyof ResumeWorkExperience, v: unknown) =>
    setDraft((d) => {
      const work = [...(d.work_experience || [])];
      work[i] = { ...work[i], [k]: v } as ResumeWorkExperience;
      return { ...d, work_experience: work };
    });
  const addWork = () =>
    setDraft((d) => ({ ...d, work_experience: [...(d.work_experience || []), { company_name: "", job_title: "" }] }));
  const removeWork = (i: number) =>
    setDraft((d) => ({ ...d, work_experience: (d.work_experience || []).filter((_, j) => j !== i) }));

  const setEdu = (i: number, k: keyof ResumeEducation, v: unknown) =>
    setDraft((d) => {
      const edu = [...(d.education || [])];
      edu[i] = { ...edu[i], [k]: v } as ResumeEducation;
      return { ...d, education: edu };
    });
  const addEdu = () =>
    setDraft((d) => ({ ...d, education: [...(d.education || []), { institution_name: "" }] }));
  const removeEdu = (i: number) =>
    setDraft((d) => ({ ...d, education: (d.education || []).filter((_, j) => j !== i) }));

  const setCert = (i: number, k: keyof ResumeCertification, v: unknown) =>
    setDraft((d) => {
      const certs = [...(d.certifications || [])];
      certs[i] = { ...certs[i], [k]: v } as ResumeCertification;
      return { ...d, certifications: certs };
    });
  const addCert = () =>
    setDraft((d) => ({ ...d, certifications: [...(d.certifications || []), { name: "" }] }));
  const removeCert = (i: number) =>
    setDraft((d) => ({ ...d, certifications: (d.certifications || []).filter((_, j) => j !== i) }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Merge edited skill groups back into the skills object, preserving any
      // categories/other fields the parser produced that we don't edit here.
      const merged: ResumeAnalysis = {
        ...draft,
        skills: {
          ...(draft.skills || {}),
          technical_skills: commasToArr(skillsText.technical),
          soft_skills: commasToArr(skillsText.soft),
          programming_languages: commasToArr(skillsText.programming),
          tools_and_platforms: commasToArr(skillsText.tools),
          all_skills_raw: commasToArr(skillsText.raw),
        },
      };

      const res = await fetch(`/api/applications/${application.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeAnalysis: merged, resumeAnalyzedAt: new Date().toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      onSaved?.(data.application);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const work = draft.work_experience || [];
  const edu = draft.education || [];
  const certs = draft.certifications || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        overlayClassName="bg-[var(--adm-scrim)]"
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 bg-[var(--adm-canvas)] p-0 sm:max-w-[640px]"
      >
        <div className="flex flex-none items-start justify-between gap-3 border-b border-[var(--adm-line)] bg-[var(--adm-surface)] px-4 py-3.5">
          <div className="min-w-0">
            <SheetTitle className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--adm-ink)]">
              Edit resume analysis
            </SheetTitle>
            <SheetDescription className="mt-0.5 text-[13px] leading-snug text-[var(--adm-ink-mute)]">
              Correct anything the parser got wrong. Contact details are not changed here.
            </SheetDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="-mr-1 grid h-8 w-8 flex-none place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {error && (
            <div role="alert" className="flex items-start gap-2.5 rounded-[12px] border border-[var(--adm-danger-soft)] bg-[var(--adm-danger-soft)] px-4 py-3">
              <IconWarning className="mt-0.5 h-4 w-4 flex-none text-[var(--adm-danger-ink)]" aria-hidden="true" />
              <p className="text-[13px] leading-relaxed text-[var(--adm-danger-ink)]">{error}</p>
            </div>
          )}

          <Section title="Professional summary">
            <div className="space-y-4">
              <Field label="Summary">
                <FormTextarea rows={4} value={draft.professional_summary || ""} onChange={(e) => setDraft((d) => ({ ...d, professional_summary: e.target.value }))} placeholder="Headline summary of the candidate…" />
              </Field>
              <Field label="Objective" hint="Optional">
                <FormTextarea rows={2} value={draft.objective || ""} onChange={(e) => setDraft((d) => ({ ...d, objective: e.target.value }))} placeholder="Career objective…" />
              </Field>
            </div>
          </Section>

          <Section title="Profile metrics">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Career level">
                <FormSelect
                  value={draft.analytics?.career_level || ""}
                  onChange={(e) => setAnalytics("career_level", e.target.value || null)}
                >
                  <option value="">Not set</option>
                  {CAREER_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
                </FormSelect>
              </Field>
              <Field label="Years of experience">
                <FormInput type="number" step="0.1" min="0" className="tabular-nums" value={draft.analytics?.total_years_of_experience ?? ""} onChange={(e) => setAnalytics("total_years_of_experience", e.target.value === "" ? null : Number(e.target.value))} />
              </Field>
              <Field label="Primary industry">
                <FormInput value={draft.analytics?.primary_industry || ""} onChange={(e) => setAnalytics("primary_industry", e.target.value || null)} placeholder="Information Technology" />
              </Field>
              <Field label="Highest education">
                <FormInput value={draft.analytics?.highest_education_level || ""} onChange={(e) => setAnalytics("highest_education_level", e.target.value || null)} placeholder="Bachelor's Degree" />
              </Field>
            </div>
          </Section>

          <Section title="Skills" subtitle="Separate with commas or new lines">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Technical skills" fullWidth>
                <FormTextarea rows={2} value={skillsText.technical} onChange={(e) => setSkillsText((s) => ({ ...s, technical: e.target.value }))} placeholder="React, Node.js, AWS…" />
              </Field>
              <Field label="Programming languages">
                <FormTextarea rows={2} value={skillsText.programming} onChange={(e) => setSkillsText((s) => ({ ...s, programming: e.target.value }))} placeholder="Python, Java…" />
              </Field>
              <Field label="Tools & platforms">
                <FormTextarea rows={2} value={skillsText.tools} onChange={(e) => setSkillsText((s) => ({ ...s, tools: e.target.value }))} placeholder="Docker, Jira…" />
              </Field>
              <Field label="Soft skills" fullWidth>
                <FormTextarea rows={2} value={skillsText.soft} onChange={(e) => setSkillsText((s) => ({ ...s, soft: e.target.value }))} placeholder="Leadership, Communication…" />
              </Field>
            </div>
          </Section>

          <Section title="Work experience" onAdd={addWork} addLabel="Add a role">
            <div className="space-y-3">
              {work.length === 0 && <NoEntries>No roles recorded. Add one to start.</NoEntries>}
              {work.map((w, i) => (
                <Entry key={i} label={`Role ${i + 1}`} onRemove={() => removeWork(i)}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Company"><FormInput value={w.company_name || ""} onChange={(e) => setWork(i, "company_name", e.target.value)} /></Field>
                    <Field label="Title"><FormInput value={w.job_title || ""} onChange={(e) => setWork(i, "job_title", e.target.value)} /></Field>
                    <Field label="Start"><FormInput value={w.start_date || ""} onChange={(e) => setWork(i, "start_date", e.target.value)} placeholder="Jan 2020" /></Field>
                    <Field label="End"><FormInput value={w.end_date || ""} onChange={(e) => setWork(i, "end_date", e.target.value)} placeholder="Present" /></Field>
                    <Field label="Location" fullWidth><FormInput value={w.location || ""} onChange={(e) => setWork(i, "location", e.target.value)} /></Field>
                    <Field label="Responsibilities" hint="One per line" fullWidth>
                      <FormTextarea rows={3} value={arrToLines(w.responsibilities)} onChange={(e) => setWork(i, "responsibilities", linesToArr(e.target.value))} />
                    </Field>
                    <Field label="Technologies" hint="Comma-separated" fullWidth>
                      <FormInput value={arrToCommas(w.technologies_used)} onChange={(e) => setWork(i, "technologies_used", commasToArr(e.target.value))} />
                    </Field>
                  </div>
                </Entry>
              ))}
            </div>
          </Section>

          <Section title="Education" onAdd={addEdu} addLabel="Add education">
            <div className="space-y-3">
              {edu.length === 0 && <NoEntries>No education recorded.</NoEntries>}
              {edu.map((e, i) => (
                <Entry key={i} label={`Education ${i + 1}`} onRemove={() => removeEdu(i)}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Institution" fullWidth><FormInput value={e.institution_name || ""} onChange={(ev) => setEdu(i, "institution_name", ev.target.value)} /></Field>
                    <Field label="Degree"><FormInput value={e.degree_type || ""} onChange={(ev) => setEdu(i, "degree_type", ev.target.value)} placeholder="B.S." /></Field>
                    <Field label="Field of study"><FormInput value={e.field_of_study || ""} onChange={(ev) => setEdu(i, "field_of_study", ev.target.value)} placeholder="Computer Science" /></Field>
                    <Field label="Start"><FormInput value={e.start_date || ""} onChange={(ev) => setEdu(i, "start_date", ev.target.value)} /></Field>
                    <Field label="End"><FormInput value={e.end_date || ""} onChange={(ev) => setEdu(i, "end_date", ev.target.value)} placeholder="2020" /></Field>
                  </div>
                </Entry>
              ))}
            </div>
          </Section>

          <Section title="Certifications" onAdd={addCert} addLabel="Add a certification">
            <div className="space-y-3">
              {certs.length === 0 && <NoEntries>No certifications recorded.</NoEntries>}
              {certs.map((c, i) => (
                <Entry key={i} label={`Certification ${i + 1}`} onRemove={() => removeCert(i)}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Name" fullWidth><FormInput value={c.name || ""} onChange={(e) => setCert(i, "name", e.target.value)} /></Field>
                    <Field label="Issuer"><FormInput value={c.issuing_organization || ""} onChange={(e) => setCert(i, "issuing_organization", e.target.value)} /></Field>
                    <Field label="Issued"><FormInput value={c.issue_date || ""} onChange={(e) => setCert(i, "issue_date", e.target.value)} /></Field>
                  </div>
                </Entry>
              ))}
            </div>
          </Section>
        </div>

        <div className="flex flex-none flex-wrap items-center justify-end gap-2 border-t border-[var(--adm-line)] bg-[var(--adm-surface)] px-4 py-3">
          <WorkspaceButton onClick={() => onOpenChange(false)}>Cancel</WorkspaceButton>
          <WorkspaceButton variant="primary" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
            Save changes
          </WorkspaceButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}
