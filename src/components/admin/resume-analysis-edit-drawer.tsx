"use client";

import * as React from "react";
import {
  Loader2, AlertTriangle, X, Briefcase, GraduationCap, Tag,
  Sparkles, TrendingUp, BadgeCheck, Plus, Trash2,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import type {
  Application, ResumeAnalysis, ResumeWorkExperience, ResumeEducation, ResumeCertification,
} from "@/lib/aws/dynamodb";
import { cn } from "@/lib/utils";
import { FormSection, Field, FormInput, FormTextarea } from "./forms/primitives";

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
      <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-[640px] p-0 flex flex-col gap-0 bg-slate-50/30">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--hz-cobalt-100)] flex items-center justify-center">
              <Sparkles className="w-[18px] h-[18px] text-[var(--hz-cobalt)]" />
            </div>
            <div>
              <SheetTitle className="text-[15px] font-bold text-slate-900">Edit resume analysis</SheetTitle>
              <SheetDescription className="text-xs text-slate-500 mt-0.5">
                Correct anything the parser got wrong. Personal contact details are not changed here.
              </SheetDescription>
            </div>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Summary */}
          <FormSection icon={Sparkles} title="Professional summary">
            <div className="space-y-3">
              <Field label="Summary">
                <FormTextarea rows={4} value={draft.professional_summary || ""} onChange={(e) => setDraft((d) => ({ ...d, professional_summary: e.target.value }))} placeholder="Headline summary of the candidate…" />
              </Field>
              <Field label="Objective">
                <FormTextarea rows={2} value={draft.objective || ""} onChange={(e) => setDraft((d) => ({ ...d, objective: e.target.value }))} placeholder="Career objective (optional)…" />
              </Field>
            </div>
          </FormSection>

          {/* Analytics */}
          <FormSection icon={TrendingUp} title="Profile metrics">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Career level">
                <select
                  value={draft.analytics?.career_level || ""}
                  onChange={(e) => setAnalytics("career_level", e.target.value || null)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:border-[var(--hz-cobalt)] focus:ring-2 focus:ring-[rgba(29,78,216,0.2)]"
                >
                  <option value="">—</option>
                  {CAREER_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Years of experience">
                <FormInput type="number" step="0.1" min="0" value={draft.analytics?.total_years_of_experience ?? ""} onChange={(e) => setAnalytics("total_years_of_experience", e.target.value === "" ? null : Number(e.target.value))} />
              </Field>
              <Field label="Primary industry">
                <FormInput value={draft.analytics?.primary_industry || ""} onChange={(e) => setAnalytics("primary_industry", e.target.value || null)} placeholder="Information Technology" />
              </Field>
              <Field label="Highest education">
                <FormInput value={draft.analytics?.highest_education_level || ""} onChange={(e) => setAnalytics("highest_education_level", e.target.value || null)} placeholder="Bachelor's Degree" />
              </Field>
            </div>
          </FormSection>

          {/* Skills */}
          <FormSection icon={Tag} title="Skills" description="Comma- or newline-separated.">
            <div className="space-y-3">
              <Field label="Technical skills">
                <FormTextarea rows={2} value={skillsText.technical} onChange={(e) => setSkillsText((s) => ({ ...s, technical: e.target.value }))} placeholder="React, Node.js, AWS…" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Programming languages">
                  <FormTextarea rows={2} value={skillsText.programming} onChange={(e) => setSkillsText((s) => ({ ...s, programming: e.target.value }))} placeholder="Python, Java…" />
                </Field>
                <Field label="Tools & platforms">
                  <FormTextarea rows={2} value={skillsText.tools} onChange={(e) => setSkillsText((s) => ({ ...s, tools: e.target.value }))} placeholder="Docker, Jira…" />
                </Field>
              </div>
              <Field label="Soft skills">
                <FormTextarea rows={2} value={skillsText.soft} onChange={(e) => setSkillsText((s) => ({ ...s, soft: e.target.value }))} placeholder="Leadership, Communication…" />
              </Field>
            </div>
          </FormSection>

          {/* Work experience */}
          <FormSection
            icon={Briefcase}
            title="Work experience"
            action={
              <button type="button" onClick={addWork} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[var(--hz-cobalt)] hover:bg-[var(--hz-cobalt-100)] rounded-md transition-colors">
                <Plus className="w-3 h-3" /> Add
              </button>
            }
          >
            <div className="space-y-4">
              {work.length === 0 && <p className="text-xs text-slate-400 italic">No entries. Click Add to create one.</p>}
              {work.map((w, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-3 space-y-2.5 relative">
                  <button type="button" onClick={() => removeWork(i)} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 transition-colors" aria-label="Remove">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="grid grid-cols-2 gap-2.5 pr-6">
                    <Field label="Company"><FormInput value={w.company_name || ""} onChange={(e) => setWork(i, "company_name", e.target.value)} /></Field>
                    <Field label="Title"><FormInput value={w.job_title || ""} onChange={(e) => setWork(i, "job_title", e.target.value)} /></Field>
                    <Field label="Start"><FormInput value={w.start_date || ""} onChange={(e) => setWork(i, "start_date", e.target.value)} placeholder="Jan 2020" /></Field>
                    <Field label="End"><FormInput value={w.end_date || ""} onChange={(e) => setWork(i, "end_date", e.target.value)} placeholder="Present" /></Field>
                    <Field label="Location" className="col-span-2"><FormInput value={w.location || ""} onChange={(e) => setWork(i, "location", e.target.value)} /></Field>
                  </div>
                  <Field label="Responsibilities" hint="one per line">
                    <FormTextarea rows={3} value={arrToLines(w.responsibilities)} onChange={(e) => setWork(i, "responsibilities", linesToArr(e.target.value))} />
                  </Field>
                  <Field label="Technologies" hint="comma-separated">
                    <FormInput value={arrToCommas(w.technologies_used)} onChange={(e) => setWork(i, "technologies_used", commasToArr(e.target.value))} />
                  </Field>
                </div>
              ))}
            </div>
          </FormSection>

          {/* Education */}
          <FormSection
            icon={GraduationCap}
            title="Education"
            action={
              <button type="button" onClick={addEdu} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[var(--hz-cobalt)] hover:bg-[var(--hz-cobalt-100)] rounded-md transition-colors">
                <Plus className="w-3 h-3" /> Add
              </button>
            }
          >
            <div className="space-y-4">
              {edu.length === 0 && <p className="text-xs text-slate-400 italic">No entries.</p>}
              {edu.map((e, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-3 space-y-2.5 relative">
                  <button type="button" onClick={() => removeEdu(i)} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 transition-colors" aria-label="Remove">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="grid grid-cols-2 gap-2.5 pr-6">
                    <Field label="Institution" className="col-span-2"><FormInput value={e.institution_name || ""} onChange={(ev) => setEdu(i, "institution_name", ev.target.value)} /></Field>
                    <Field label="Degree"><FormInput value={e.degree_type || ""} onChange={(ev) => setEdu(i, "degree_type", ev.target.value)} placeholder="B.S." /></Field>
                    <Field label="Field of study"><FormInput value={e.field_of_study || ""} onChange={(ev) => setEdu(i, "field_of_study", ev.target.value)} placeholder="Computer Science" /></Field>
                    <Field label="Start"><FormInput value={e.start_date || ""} onChange={(ev) => setEdu(i, "start_date", ev.target.value)} /></Field>
                    <Field label="End"><FormInput value={e.end_date || ""} onChange={(ev) => setEdu(i, "end_date", ev.target.value)} placeholder="2020" /></Field>
                  </div>
                </div>
              ))}
            </div>
          </FormSection>

          {/* Certifications */}
          <FormSection
            icon={BadgeCheck}
            title="Certifications"
            tone="emerald"
            action={
              <button type="button" onClick={addCert} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[var(--hz-cobalt)] hover:bg-[var(--hz-cobalt-100)] rounded-md transition-colors">
                <Plus className="w-3 h-3" /> Add
              </button>
            }
          >
            <div className="space-y-4">
              {certs.length === 0 && <p className="text-xs text-slate-400 italic">No entries.</p>}
              {certs.map((c, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-3 space-y-2.5 relative">
                  <button type="button" onClick={() => removeCert(i)} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 transition-colors" aria-label="Remove">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="grid grid-cols-2 gap-2.5 pr-6">
                    <Field label="Name" className="col-span-2"><FormInput value={c.name || ""} onChange={(e) => setCert(i, "name", e.target.value)} /></Field>
                    <Field label="Issuer"><FormInput value={c.issuing_organization || ""} onChange={(e) => setCert(i, "issuing_organization", e.target.value)} /></Field>
                    <Field label="Issued"><FormInput value={c.issue_date || ""} onChange={(e) => setCert(i, "issue_date", e.target.value)} /></Field>
                  </div>
                </div>
              ))}
            </div>
          </FormSection>
        </div>

        {/* Sticky footer */}
        <div className="flex-shrink-0 bg-white border-t border-slate-200 px-5 py-3 flex items-center gap-3">
          <button type="button" onClick={() => onOpenChange(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={cn("flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[var(--hz-cobalt)] text-white rounded-lg hover:bg-[var(--hz-cobalt-600)] active:scale-[0.99] disabled:opacity-60 transition shadow-sm shadow-[rgba(29,78,216,0.2)]")}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
