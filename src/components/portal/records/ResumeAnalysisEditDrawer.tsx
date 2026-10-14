"use client";

import { useState } from "react";
import type { Application, ResumeAnalysis, ResumeCertification, ResumeEducation, ResumeWorkExperience } from "@/lib/aws/dynamodb";
import { Button, ConfirmDialog, Drawer } from "@/components/portal/kit";
import { Field, FormBanner, FormSection, NativeSelect, TextArea, TextInput } from "@/components/portal/fields";
import Icon from "@/components/portal/icons";

const arrToLines = (a?: string[]) => (a || []).join("\n");
const linesToArr = (t: string) => t.split("\n").map((s) => s.trim()).filter(Boolean);
const arrToCommas = (a?: string[]) => (a || []).join(", ");
const commasToArr = (t: string) => t.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);

const CAREER_LEVELS = ["Entry-Level", "Mid-Level", "Senior", "Director", "Executive"];
const FORM_ID = "resume-analysis-form";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application;
  onSaved?: (app: Application) => void;
}

/** One repeatable entry (a role, a degree, a certificate). */
function Entry({ label, onRemove, children }: { label: string; onRemove: () => void; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="min-w-0 rounded-lg bg-mist-50 p-4 ring-1 ring-inset ring-mist-200">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-navy-900">{label}</p>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label.toLowerCase()}`}
          title="Remove"
          className="-my-1 grid size-8 place-items-center rounded-lg text-mist-500 transition-colors hover:bg-[#fef3f2] hover:text-[#b42318]"
        >
          <Icon name="trash" className="size-4" />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button size="sm" variant="secondary" icon="plus" onClick={onClick}>
      {label}
    </Button>
  );
}

/** Correct what the parser got wrong. PUTs the whole analysis; contact details are untouched. */
export function ResumeAnalysisEditDrawer({ open, ...rest }: Props) {
  return open ? <Body {...rest} /> : null;
}

function Body({ onOpenChange, application, onSaved }: Omit<Props, "open">) {
  const [initial] = useState(() => {
    const a = application.resumeAnalysis || {};
    return {
      draft: JSON.parse(JSON.stringify(a)) as ResumeAnalysis,
      // Skill groups edited as free text; parsed back to arrays on save.
      skills: {
        technical: arrToCommas(a.skills?.technical_skills),
        soft: arrToCommas(a.skills?.soft_skills),
        programming: arrToCommas(a.skills?.programming_languages),
        tools: arrToCommas(a.skills?.tools_and_platforms),
        raw: arrToCommas(a.skills?.all_skills_raw),
      },
    };
  });
  const [draft, setDraft] = useState<ResumeAnalysis>(initial.draft);
  const [skillsText, setSkillsText] = useState(initial.skills);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial.draft) || JSON.stringify(skillsText) !== JSON.stringify(initial.skills);
  const close = () => onOpenChange(false);
  const requestClose = () => {
    if (saving) return;
    if (dirty) setConfirmDiscard(true);
    else close();
  };

  const setAnalytics = (k: string, v: unknown) => setDraft((d) => ({ ...d, analytics: { ...(d.analytics || {}), [k]: v } as ResumeAnalysis["analytics"] }));

  const setWork = (i: number, k: keyof ResumeWorkExperience, v: unknown) =>
    setDraft((d) => {
      const work = [...(d.work_experience || [])];
      work[i] = { ...work[i], [k]: v } as ResumeWorkExperience;
      return { ...d, work_experience: work };
    });
  const addWork = () => setDraft((d) => ({ ...d, work_experience: [...(d.work_experience || []), { company_name: "", job_title: "" }] }));
  const removeWork = (i: number) => setDraft((d) => ({ ...d, work_experience: (d.work_experience || []).filter((_, j) => j !== i) }));

  const setEdu = (i: number, k: keyof ResumeEducation, v: unknown) =>
    setDraft((d) => {
      const edu = [...(d.education || [])];
      edu[i] = { ...edu[i], [k]: v } as ResumeEducation;
      return { ...d, education: edu };
    });
  const addEdu = () => setDraft((d) => ({ ...d, education: [...(d.education || []), { institution_name: "" }] }));
  const removeEdu = (i: number) => setDraft((d) => ({ ...d, education: (d.education || []).filter((_, j) => j !== i) }));

  const setCert = (i: number, k: keyof ResumeCertification, v: unknown) =>
    setDraft((d) => {
      const certs = [...(d.certifications || [])];
      certs[i] = { ...certs[i], [k]: v } as ResumeCertification;
      return { ...d, certifications: certs };
    });
  const addCert = () => setDraft((d) => ({ ...d, certifications: [...(d.certifications || []), { name: "" }] }));
  const removeCert = (i: number) => setDraft((d) => ({ ...d, certifications: (d.certifications || []).filter((_, j) => j !== i) }));

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      // Edited groups merge back over the parser's skills, keeping categories and fields not edited here.
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
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const work = draft.work_experience || [];
  const edu = draft.education || [];
  const certs = draft.certifications || [];
  const empty = (text: string) => <p className="text-[13px] text-mist-600">{text}</p>;

  return (
    <>
      <Drawer
        width="lg"
        title="Edit resume analysis"
        onClose={requestClose}
        footer={
          <>
            <Button variant="ghost" onClick={requestClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form={FORM_ID} icon="check" loading={saving}>
              Save changes
            </Button>
          </>
        }
      >
        <form id={FORM_ID} noValidate onSubmit={handleSave} className="grid gap-6">
          <p className="-mt-1 text-[13px] text-mist-600">Correct anything the parser got wrong. Contact details are not changed here.</p>
          <FormBanner message={error} onDismiss={() => setError(null)} />

          <FormSection title="Summary">
            <Field label="Professional summary" htmlFor="ra-summary">
              <TextArea id="ra-summary" rows={4} value={draft.professional_summary || ""} onChange={(e) => setDraft((d) => ({ ...d, professional_summary: e.target.value }))} placeholder="Headline summary of the candidate…" />
            </Field>
            <Field label="Objective" htmlFor="ra-objective" optional>
              <TextArea id="ra-objective" rows={2} value={draft.objective || ""} onChange={(e) => setDraft((d) => ({ ...d, objective: e.target.value }))} placeholder="Career objective…" />
            </Field>
          </FormSection>

          <FormSection title="Signals" description="The figures shown at the top of the resume tab.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Career level" htmlFor="ra-level">
                <NativeSelect id="ra-level" value={draft.analytics?.career_level || ""} onChange={(e) => setAnalytics("career_level", e.target.value || null)}>
                  <option value="">Not set</option>
                  {CAREER_LEVELS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Years of experience" htmlFor="ra-years">
                <TextInput
                  id="ra-years"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  className="tabular-nums"
                  value={draft.analytics?.total_years_of_experience ?? ""}
                  onChange={(e) => setAnalytics("total_years_of_experience", e.target.value === "" ? null : Number(e.target.value))}
                />
              </Field>
              <Field label="Primary industry" htmlFor="ra-industry">
                <TextInput id="ra-industry" value={draft.analytics?.primary_industry || ""} onChange={(e) => setAnalytics("primary_industry", e.target.value || null)} placeholder="Information Technology" />
              </Field>
              <Field label="Highest education" htmlFor="ra-edu">
                <TextInput id="ra-edu" value={draft.analytics?.highest_education_level || ""} onChange={(e) => setAnalytics("highest_education_level", e.target.value || null)} placeholder="Bachelor's Degree" />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Skills" description="Separate with commas or new lines.">
            <Field label="Technical skills" htmlFor="ra-tech">
              <TextArea id="ra-tech" rows={2} value={skillsText.technical} onChange={(e) => setSkillsText((s) => ({ ...s, technical: e.target.value }))} placeholder="React, Node.js, AWS…" />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Programming languages" htmlFor="ra-prog">
                <TextArea id="ra-prog" rows={2} value={skillsText.programming} onChange={(e) => setSkillsText((s) => ({ ...s, programming: e.target.value }))} placeholder="Python, Java…" />
              </Field>
              <Field label="Tools & platforms" htmlFor="ra-tools">
                <TextArea id="ra-tools" rows={2} value={skillsText.tools} onChange={(e) => setSkillsText((s) => ({ ...s, tools: e.target.value }))} placeholder="Docker, Jira…" />
              </Field>
            </div>
            <Field label="Soft skills" htmlFor="ra-soft">
              <TextArea id="ra-soft" rows={2} value={skillsText.soft} onChange={(e) => setSkillsText((s) => ({ ...s, soft: e.target.value }))} placeholder="Leadership, Communication…" />
            </Field>
          </FormSection>

          <FormSection title="Experience" badge={<span className="text-[13px] tabular-nums text-mist-500">{work.length}</span>} action={<AddButton label="Add role" onClick={addWork} />}>
            {work.length === 0 && empty("No roles recorded. Add one to start.")}
            {work.map((w, i) => (
              <Entry key={i} label={`Role ${i + 1}`} onRemove={() => removeWork(i)}>
                <Field label="Company" htmlFor={`ra-w${i}-co`}>
                  <TextInput id={`ra-w${i}-co`} value={w.company_name || ""} onChange={(e) => setWork(i, "company_name", e.target.value)} />
                </Field>
                <Field label="Title" htmlFor={`ra-w${i}-title`}>
                  <TextInput id={`ra-w${i}-title`} value={w.job_title || ""} onChange={(e) => setWork(i, "job_title", e.target.value)} />
                </Field>
                <Field label="Start" htmlFor={`ra-w${i}-start`}>
                  <TextInput id={`ra-w${i}-start`} value={w.start_date || ""} onChange={(e) => setWork(i, "start_date", e.target.value)} placeholder="Jan 2020" />
                </Field>
                <Field label="End" htmlFor={`ra-w${i}-end`}>
                  <TextInput id={`ra-w${i}-end`} value={w.end_date || ""} onChange={(e) => setWork(i, "end_date", e.target.value)} placeholder="Present" />
                </Field>
                <Field label="Location" htmlFor={`ra-w${i}-loc`} className="sm:col-span-2">
                  <TextInput id={`ra-w${i}-loc`} value={w.location || ""} onChange={(e) => setWork(i, "location", e.target.value)} />
                </Field>
                <Field label="Responsibilities" htmlFor={`ra-w${i}-resp`} hint="One per line" className="sm:col-span-2">
                  <TextArea id={`ra-w${i}-resp`} rows={3} value={arrToLines(w.responsibilities)} onChange={(e) => setWork(i, "responsibilities", linesToArr(e.target.value))} />
                </Field>
                <Field label="Technologies" htmlFor={`ra-w${i}-tech`} hint="Comma separated" className="sm:col-span-2">
                  <TextInput id={`ra-w${i}-tech`} value={arrToCommas(w.technologies_used)} onChange={(e) => setWork(i, "technologies_used", commasToArr(e.target.value))} />
                </Field>
              </Entry>
            ))}
          </FormSection>

          <FormSection title="Education" badge={<span className="text-[13px] tabular-nums text-mist-500">{edu.length}</span>} action={<AddButton label="Add education" onClick={addEdu} />}>
            {edu.length === 0 && empty("No education recorded.")}
            {edu.map((e, i) => (
              <Entry key={i} label={`Education ${i + 1}`} onRemove={() => removeEdu(i)}>
                <Field label="Institution" htmlFor={`ra-e${i}-inst`} className="sm:col-span-2">
                  <TextInput id={`ra-e${i}-inst`} value={e.institution_name || ""} onChange={(ev) => setEdu(i, "institution_name", ev.target.value)} />
                </Field>
                <Field label="Degree" htmlFor={`ra-e${i}-deg`}>
                  <TextInput id={`ra-e${i}-deg`} value={e.degree_type || ""} onChange={(ev) => setEdu(i, "degree_type", ev.target.value)} placeholder="B.S." />
                </Field>
                <Field label="Field of study" htmlFor={`ra-e${i}-field`}>
                  <TextInput id={`ra-e${i}-field`} value={e.field_of_study || ""} onChange={(ev) => setEdu(i, "field_of_study", ev.target.value)} placeholder="Computer Science" />
                </Field>
                <Field label="Start" htmlFor={`ra-e${i}-start`}>
                  <TextInput id={`ra-e${i}-start`} value={e.start_date || ""} onChange={(ev) => setEdu(i, "start_date", ev.target.value)} />
                </Field>
                <Field label="End" htmlFor={`ra-e${i}-end`}>
                  <TextInput id={`ra-e${i}-end`} value={e.end_date || ""} onChange={(ev) => setEdu(i, "end_date", ev.target.value)} placeholder="2020" />
                </Field>
              </Entry>
            ))}
          </FormSection>

          <FormSection title="Certifications" badge={<span className="text-[13px] tabular-nums text-mist-500">{certs.length}</span>} action={<AddButton label="Add certification" onClick={addCert} />}>
            {certs.length === 0 && empty("No certifications recorded.")}
            {certs.map((c, i) => (
              <Entry key={i} label={`Certification ${i + 1}`} onRemove={() => removeCert(i)}>
                <Field label="Name" htmlFor={`ra-c${i}-name`} className="sm:col-span-2">
                  <TextInput id={`ra-c${i}-name`} value={c.name || ""} onChange={(e) => setCert(i, "name", e.target.value)} />
                </Field>
                <Field label="Issuer" htmlFor={`ra-c${i}-issuer`}>
                  <TextInput id={`ra-c${i}-issuer`} value={c.issuing_organization || ""} onChange={(e) => setCert(i, "issuing_organization", e.target.value)} />
                </Field>
                <Field label="Issued" htmlFor={`ra-c${i}-issued`}>
                  <TextInput id={`ra-c${i}-issued`} value={c.issue_date || ""} onChange={(e) => setCert(i, "issue_date", e.target.value)} />
                </Field>
              </Entry>
            ))}
          </FormSection>
        </form>
      </Drawer>

      {confirmDiscard && (
        <ConfirmDialog
          tone="primary"
          title="Discard your changes?"
          body="Your edits to the resume analysis haven't been saved. Closing now loses them."
          confirmLabel="Discard"
          onConfirm={() => {
            setConfirmDiscard(false);
            close();
          }}
          onCancel={() => setConfirmDiscard(false)}
        />
      )}
    </>
  );
}
