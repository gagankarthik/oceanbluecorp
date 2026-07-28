"use client";

import * as React from "react";
import {
  Loader2, AlertTriangle, X, Briefcase, MapPin, FileText,
  Star, User2, Shield, Plus,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import type { Application, Job } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";
import { statusMeta, SOURCE_OPTIONS, US_STATES, COMMON_SKILLS, type AppStatus , WORK_AUTH_GROUPS } from "./theme";
import { FormSection, Field, FormInput, FormSelect, FormTextarea } from "./forms/primitives";
import { StarRating } from "./star-rating";

// ── Tab config ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "profile",  label: "Profile",  icon: User2    },
  { id: "skills",   label: "Skills",   icon: Briefcase },
  { id: "visa",     label: "Visa",     icon: Shield   },
  { id: "notes",    label: "Notes",    icon: FileText  },
] as const;

type TabId = typeof TABS[number]["id"];

// ── Visa status options ────────────────────────────────────────────────────────

// ── Default form ───────────────────────────────────────────────────────────────

const defaultForm = {
  firstName: "", lastName: "", email: "", phone: "",
  status: "pending" as AppStatus,
  jobId: "", jobTitle: "",
  source: "",
  city: "", state: "",
  // Skills tab
  skills: [] as string[],
  skillInput: "",
  experience: "",
  // Visa tab
  workAuthorization: "",
  visaExpiry: "",
  visaSponsorshipRequired: false,
  // Notes tab
  notes: "",
  rating: 0,
  addToTalentBench: false,
};

type FormState = typeof defaultForm;

export type CandidateDrawerMode = "create" | "edit";

interface CandidateEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: CandidateDrawerMode;
  candidate?: Application | null;
  jobs?: Job[];
  defaultJobId?: string;
  onSaved?: (app: Application) => void;
}

export function CandidateEditDrawer({
  open, onOpenChange, mode: modeProp, candidate, jobs = [], defaultJobId, onSaved,
}: CandidateEditDrawerProps) {
  const { user } = useAuth();
  const mode: CandidateDrawerMode = modeProp || (candidate ? "edit" : "create");
  const [form, setForm] = React.useState<FormState>(defaultForm);
  const [activeTab, setActiveTab] = React.useState<TabId>("profile");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setActiveTab("profile");
    if (candidate) {
      const rawSkills = candidate.skills || [];
      setForm({
        firstName: candidate.firstName || (candidate.name?.split(" ")[0] ?? ""),
        lastName: candidate.lastName || (candidate.name?.split(" ").slice(1).join(" ") ?? ""),
        email: candidate.email || "",
        phone: candidate.phone || "",
        status: (candidate.status as AppStatus) || "pending",
        jobId: candidate.jobId || "",
        jobTitle: candidate.jobTitle || "",
        source: candidate.source || "",
        city: candidate.city || "",
        state: candidate.state || "",
        skills: rawSkills,
        skillInput: "",
        experience: candidate.experience || "",
        workAuthorization: candidate.workAuthorization || "",
        visaExpiry: "",
        visaSponsorshipRequired: false,
        notes: candidate.notes || "",
        rating: candidate.rating || 0,
        addToTalentBench: !!candidate.addToTalentBench,
      });
    } else {
      setForm({ ...defaultForm, jobId: defaultJobId || "" });
    }
  }, [open, candidate, defaultJobId]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  // Skill chip helpers
  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (!s || form.skills.includes(s)) return;
    set("skills", [...form.skills, s]);
    set("skillInput", "");
  };

  const removeSkill = (skill: string) =>
    set("skills", form.skills.filter((s) => s !== skill));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.email.trim()) {
      setError("First name and email are required.");
      setActiveTab("profile");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const job = jobs.find((j) => j.id === form.jobId);
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        status: form.status,
        jobId: form.jobId || undefined,
        jobTitle: form.jobTitle || job?.title || undefined,
        source: form.source || undefined,
        workAuthorization: form.workAuthorization || undefined,
        city: form.city,
        state: form.state,
        skills: form.skills,
        experience: form.experience,
        notes: form.notes,
        rating: form.rating || undefined,
        addToTalentBench: form.addToTalentBench,
        createdBy: user?.email || "admin",
        createdByName: user?.name || "Admin",
      };
      let res: Response;
      if (mode === "create") {
        res = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, userId: "anonymous", appliedAt: new Date().toISOString() }),
        });
      } else {
        res = await fetch(`/api/applications/${candidate!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save candidate");
      onSaved?.(data.application);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-[580px] p-0 flex flex-col gap-0 bg-[var(--adm-surface-sunken)]">
        {/* Header */}
        <div className="flex-shrink-0 bg-[var(--adm-surface)] border-b border-[var(--adm-line)] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[6px] bg-[var(--adm-accent-soft)] flex items-center justify-center">
              <User2 className="w-[18px] h-[18px] text-[var(--adm-accent)]" />
            </div>
            <div>
              <SheetTitle className="text-[15px] font-bold text-[var(--adm-ink)]">
                {mode === "create" ? "Add Applicant" : "Edit Applicant"}
              </SheetTitle>
              <SheetDescription className="text-xs text-[var(--adm-ink-subtle)] mt-0.5">
                {mode === "create" ? "Enter applicant details below" : "Update applicant information"}
              </SheetDescription>
            </div>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} aria-label="Close" className="p-1.5 text-[var(--adm-ink-subtle)] hover:text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] rounded-[6px] transition-colors">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Tab nav */}
        <div className="flex-shrink-0 bg-[var(--adm-surface)] border-b border-[var(--adm-line)] px-4">
          <div className="flex gap-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-colors border-b-2",
                  activeTab === tab.id
                    ? "text-[var(--adm-accent)] border-[var(--adm-accent)]"
                    : "text-[var(--adm-ink-subtle)] border-transparent hover:text-[var(--adm-ink-mute)]",
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 p-3 bg-[var(--adm-danger-soft)] border border-[var(--adm-danger)] rounded-[6px]">
                <AlertTriangle className="w-4 h-4 text-[var(--adm-danger)] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--adm-danger)] leading-relaxed">{error}</p>
              </div>
            )}

            {/* ── Profile tab ── */}
            {activeTab === "profile" && (
              <>
                <FormSection icon={User2} title="Personal Info">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="First name" required>
                      <FormInput value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Jane" />
                    </Field>
                    <Field label="Last name">
                      <FormInput value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Smith" />
                    </Field>
                    <Field label="Email" required>
                      <FormInput type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@example.com" />
                    </Field>
                    <Field label="Phone">
                      <FormInput type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 (555) 000-0000" />
                    </Field>
                  </div>
                </FormSection>

                <FormSection icon={MapPin} title="Location">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="City">
                      <FormInput value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Austin" />
                    </Field>
                    <Field label="State">
                      <FormSelect value={form.state} onChange={(e) => set("state", e.target.value)}>
                        <option value="">Select state…</option>
                        {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                      </FormSelect>
                    </Field>
                  </div>
                </FormSection>

                <FormSection icon={Briefcase} title="Position & Pipeline">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Pipeline status">
                      <FormSelect value={form.status} onChange={(e) => set("status", e.target.value as AppStatus)}>
                        {Object.entries(statusMeta)
                          .filter(([k]) => !["active", "inactive", "paused", "draft", "closed", "open", "on-hold"].includes(k))
                          .map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </FormSelect>
                    </Field>
                    <Field label="Job posting">
                      <FormSelect
                        value={form.jobId}
                        onChange={(e) => {
                          const job = jobs.find((j) => j.id === e.target.value);
                          set("jobId", e.target.value);
                          set("jobTitle", job?.title || "");
                        }}
                      >
                        <option value="">Unassigned</option>
                        {jobs.filter((j) => j.status === "open" || j.status === "active").map((j) => (
                          <option key={j.id} value={j.id}>{j.title}</option>
                        ))}
                      </FormSelect>
                    </Field>
                    <Field label="Source">
                      <FormSelect value={form.source} onChange={(e) => set("source", e.target.value)}>
                        <option value="">Select source…</option>
                        {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </FormSelect>
                    </Field>
                    <Field label="Add to talent bench">
                      <label className="flex items-center gap-2 px-3 py-2 border border-[var(--adm-line)] rounded-[8px] bg-[var(--adm-surface)] cursor-pointer hover:bg-[var(--adm-row-hover)] transition-colors">
                        <input type="checkbox" autoComplete="off" checked={form.addToTalentBench} onChange={(e) => set("addToTalentBench", e.target.checked)} className="rounded border-[var(--adm-line)] text-[var(--adm-accent)]" />
                        <span className="text-sm text-[var(--adm-ink-mute)]">Add to bench</span>
                      </label>
                    </Field>
                  </div>
                </FormSection>
              </>
            )}

            {/* ── Skills tab ── */}
            {activeTab === "skills" && (
              <>
                <FormSection icon={Briefcase} title="Skills">
                  <div className="space-y-3">
                    {/* Skill chip input */}
                    <div className="flex gap-2">
                      <FormInput
                        value={form.skillInput}
                        onChange={(e) => set("skillInput", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); addSkill(form.skillInput); }
                          if (e.key === ",") { e.preventDefault(); addSkill(form.skillInput); }
                        }}
                        placeholder="Type a skill and press Enter…"
                      />
                      <button
                        type="button"
                        onClick={() => addSkill(form.skillInput)}
                        aria-label="Add skill"
                        className="px-3 py-2 bg-[var(--adm-accent)] text-white rounded-[8px] hover:bg-[var(--adm-accent-strong)] active:scale-[0.99] transition flex-shrink-0"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Added skills */}
                    {form.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {form.skills.map((skill) => (
                          <span key={skill} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-[var(--adm-accent-soft)] text-[var(--adm-accent)] text-xs font-medium rounded-[4px]">
                            {skill}
                            <button type="button" onClick={() => removeSkill(skill)} aria-label="Remove skill" className="p-0.5 hover:bg-white/60 rounded-[4px] transition-colors">
                              <X className="w-3 h-3" aria-hidden="true" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Common skill suggestions */}
                    <div>
                      <p className="text-[11px] font-semibold text-[var(--adm-ink-subtle)] uppercase tracking-wider mb-2">Common skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {COMMON_SKILLS.filter((s) => !form.skills.includes(s)).map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => addSkill(skill)}
                            className="px-2.5 py-1 text-xs text-[var(--adm-ink-mute)] bg-[var(--adm-surface-2)] hover:bg-[var(--adm-accent-soft)] hover:text-[var(--adm-accent)] rounded-[4px] border border-[var(--adm-line)] hover:border-[var(--adm-accent-soft)] transition-colors"
                          >
                            + {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </FormSection>

                <FormSection icon={FileText} title="Experience">
                  <Field label="Experience summary">
                    <FormTextarea rows={5} value={form.experience} onChange={(e) => set("experience", e.target.value)} placeholder="Brief summary of candidate's experience, industries, key achievements…" />
                  </Field>
                </FormSection>
              </>
            )}

            {/* ── Visa tab ── */}
            {activeTab === "visa" && (
              <FormSection icon={Shield} title="Work Authorization & Visa Status">
                <div className="space-y-4">
                  <Field label="Work Authorization / Visa Status">
                    <FormSelect value={form.workAuthorization} onChange={(e) => set("workAuthorization", e.target.value)}>
                      <option value="">Select status…</option>
                      {WORK_AUTH_GROUPS.map((g) => (
                        <optgroup key={g.label} label={g.label}>
                          {g.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </optgroup>
                      ))}
                    </FormSelect>
                  </Field>

                  {/* Visa expiry — only for non-permanent statuses */}
                  {form.workAuthorization && !["US Citizen", "Green Card"].includes(form.workAuthorization) && (
                    <Field label="Visa / OPT Expiry Date">
                      <FormInput type="date" value={form.visaExpiry} onChange={(e) => set("visaExpiry", e.target.value)} />
                    </Field>
                  )}

                  <Field label="Sponsorship">
                    <label className="flex items-center gap-3 px-3 py-2.5 border border-[var(--adm-line)] rounded-[8px] bg-[var(--adm-surface)] cursor-pointer hover:bg-[var(--adm-row-hover)] transition-colors">
                      <input
                        type="checkbox"
                        autoComplete="off"
                        checked={form.visaSponsorshipRequired}
                        onChange={(e) => set("visaSponsorshipRequired", e.target.checked)}
                        className="rounded border-[var(--adm-line)] text-[var(--adm-accent)]"
                      />
                      <div>
                        <p className="text-sm font-medium text-[var(--adm-ink-mute)]">Requires sponsorship</p>
                        <p className="text-xs text-[var(--adm-ink-subtle)]">Candidate will need H-1B or similar sponsorship</p>
                      </div>
                    </label>
                  </Field>

                  {/* Authorization status info box */}
                  {form.workAuthorization && (
                    <div className={cn(
                      "rounded-[6px] p-3 text-xs",
                      ["US Citizen", "Green Card"].includes(form.workAuthorization)
                        ? "bg-[var(--adm-success-soft)] border border-[var(--adm-success)] text-[var(--adm-success)]"
                        : "bg-[var(--adm-warning-soft)] border border-[var(--adm-warning)] text-[var(--adm-warning)]",
                    )}>
                      {["US Citizen", "Green Card"].includes(form.workAuthorization)
                        ? "✓ This candidate has permanent work authorization in the US."
                        : form.workAuthorization === "H1-B"
                          ? "H-1B holders require employer sponsorship to maintain status."
                          : ["OPT", "CPT"].includes(form.workAuthorization)
                            ? "OPT/CPT is time-limited — verify expiry date before extending an offer."
                            : "Verify work authorization documents before extending an offer."}
                    </div>
                  )}
                </div>
              </FormSection>
            )}

            {/* ── Notes tab ── */}
            {activeTab === "notes" && (
              <>
                <FormSection icon={Star} title="Rating">
                  <Field label="Candidate rating">
                    <div className="flex items-center gap-2 px-3 py-2.5 border border-[var(--adm-line)] rounded-[8px] bg-[var(--adm-surface)]">
                      <StarRating rating={form.rating} onRate={(n) => set("rating", n === form.rating ? 0 : n)} size="md" />
                      {form.rating > 0 && (
                        <span className="text-xs text-[var(--adm-ink-subtle)] ml-1 tabular-nums">{form.rating}/5</span>
                      )}
                    </div>
                  </Field>
                </FormSection>

                <FormSection icon={FileText} title="Internal Notes">
                  <Field label="Notes" hint="Internal only — not visible to candidate">
                    <FormTextarea rows={8} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Interview impressions, concerns, next steps…" />
                  </Field>
                </FormSection>
              </>
            )}
          </div>

          {/* Sticky footer */}
          <div className="sticky bottom-0 left-0 right-0 bg-[var(--adm-surface)] border-t border-[var(--adm-line)] px-5 py-3 flex items-center gap-3">
            <button type="button" onClick={() => onOpenChange(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold border border-[var(--adm-line)] text-[var(--adm-ink-mute)] rounded-[8px] hover:bg-[var(--adm-row-hover)] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[var(--adm-accent)] text-white rounded-[8px] hover:bg-[var(--adm-accent-strong)] active:scale-[0.99] disabled:opacity-60 transition">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "create" ? "Add Applicant" : "Save Changes"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
