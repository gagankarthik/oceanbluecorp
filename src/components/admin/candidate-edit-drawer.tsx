"use client";

import * as React from "react";
import {
  Loader2, AlertTriangle, X, Briefcase, Mail, MapPin, FileText,
  Star, User2, Shield, Plus,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Application, Job } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";
import { statusMeta, WORK_AUTH_OPTIONS, SOURCE_OPTIONS, US_STATES, type AppStatus } from "./theme";

// ── Tab config ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "profile",  label: "Profile",  icon: User2    },
  { id: "skills",   label: "Skills",   icon: Briefcase },
  { id: "visa",     label: "Visa",     icon: Shield   },
  { id: "notes",    label: "Notes",    icon: FileText  },
] as const;

type TabId = typeof TABS[number]["id"];

// ── Visa status options ────────────────────────────────────────────────────────

const VISA_OPTIONS = [
  "US Citizen", "Green Card", "H1-B", "H4 EAD", "OPT", "CPT", "TN Visa", "E3 Visa",
  "L1 Visa", "O1 Visa", "Other",
];

// ── Common skill tags ──────────────────────────────────────────────────────────

const COMMON_SKILLS = [
  "React", "TypeScript", "JavaScript", "Node.js", "Python", "Java", "C#", ".NET",
  "AWS", "Azure", "GCP", "SQL", "PostgreSQL", "MongoDB", "Docker", "Kubernetes",
  "SAP", "Salesforce", "Oracle", "Excel", "Power BI", "Tableau", "Agile", "Scrum",
];

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
      <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-[580px] p-0 flex flex-col gap-0 bg-slate-50/30">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <User2 className="w-[18px] h-[18px] text-blue-600" />
            </div>
            <div>
              <SheetTitle className="text-[15px] font-bold text-slate-900">
                {mode === "create" ? "Add Applicant" : "Edit Applicant"}
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-500 mt-0.5">
                {mode === "create" ? "Enter applicant details below" : "Update applicant information"}
              </SheetDescription>
            </div>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab nav */}
        <div className="flex-shrink-0 bg-white border-b border-slate-200 px-4">
          <div className="flex gap-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-colors border-b-2",
                  activeTab === tab.id
                    ? "text-blue-600 border-blue-600"
                    : "text-slate-500 border-transparent hover:text-slate-700",
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
              <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
              </div>
            )}

            {/* ── Profile tab ── */}
            {activeTab === "profile" && (
              <>
                <Section icon={User2} title="Personal Info">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First name" required>
                      <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Jane" />
                    </Field>
                    <Field label="Last name">
                      <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Smith" />
                    </Field>
                    <Field label="Email" required>
                      <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@example.com" />
                    </Field>
                    <Field label="Phone">
                      <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 (555) 000-0000" />
                    </Field>
                  </div>
                </Section>

                <Section icon={MapPin} title="Location">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="City">
                      <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Austin" />
                    </Field>
                    <Field label="State">
                      <Select value={form.state} onChange={(e) => set("state", e.target.value)}>
                        <option value="">Select state…</option>
                        {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </Select>
                    </Field>
                  </div>
                </Section>

                <Section icon={Briefcase} title="Position & Pipeline">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Pipeline status">
                      <Select value={form.status} onChange={(e) => set("status", e.target.value as AppStatus)}>
                        {Object.entries(statusMeta)
                          .filter(([k]) => !["active", "inactive", "paused", "draft", "closed", "open", "on-hold"].includes(k))
                          .map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </Select>
                    </Field>
                    <Field label="Job posting">
                      <Select
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
                      </Select>
                    </Field>
                    <Field label="Source">
                      <Select value={form.source} onChange={(e) => set("source", e.target.value)}>
                        <option value="">Select source…</option>
                        {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </Select>
                    </Field>
                    <Field label="Add to talent bench">
                      <label className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-white cursor-pointer hover:bg-slate-50">
                        <input type="checkbox" checked={form.addToTalentBench} onChange={(e) => set("addToTalentBench", e.target.checked)} className="rounded border-slate-300 text-blue-600" />
                        <span className="text-sm text-slate-700">Add to bench</span>
                      </label>
                    </Field>
                  </div>
                </Section>
              </>
            )}

            {/* ── Skills tab ── */}
            {activeTab === "skills" && (
              <>
                <Section icon={Briefcase} title="Skills">
                  <div className="space-y-3">
                    {/* Skill chip input */}
                    <div className="flex gap-2">
                      <Input
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
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Added skills */}
                    {form.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {form.skills.map((skill) => (
                          <span key={skill} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                            {skill}
                            <button type="button" onClick={() => removeSkill(skill)} className="p-0.5 hover:bg-blue-100 rounded-full transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Common skill suggestions */}
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Common skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {COMMON_SKILLS.filter((s) => !form.skills.includes(s)).map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => addSkill(skill)}
                            className="px-2.5 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-full border border-slate-200 hover:border-blue-200 transition-colors"
                          >
                            + {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Section>

                <Section icon={FileText} title="Experience">
                  <Field label="Experience summary">
                    <Textarea rows={5} value={form.experience} onChange={(e) => set("experience", e.target.value)} placeholder="Brief summary of candidate's experience, industries, key achievements…" />
                  </Field>
                </Section>
              </>
            )}

            {/* ── Visa tab ── */}
            {activeTab === "visa" && (
              <Section icon={Shield} title="Work Authorization & Visa Status">
                <div className="space-y-4">
                  <Field label="Work Authorization / Visa Status">
                    <Select value={form.workAuthorization} onChange={(e) => set("workAuthorization", e.target.value)}>
                      <option value="">Select status…</option>
                      {VISA_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                    </Select>
                  </Field>

                  {/* Visa expiry — only for non-permanent statuses */}
                  {form.workAuthorization && !["US Citizen", "Green Card"].includes(form.workAuthorization) && (
                    <Field label="Visa / OPT Expiry Date">
                      <Input type="date" value={form.visaExpiry} onChange={(e) => set("visaExpiry", e.target.value)} />
                    </Field>
                  )}

                  <Field label="Sponsorship">
                    <label className="flex items-center gap-3 px-3 py-2.5 border border-slate-200 rounded-lg bg-white cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={form.visaSponsorshipRequired}
                        onChange={(e) => set("visaSponsorshipRequired", e.target.checked)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Requires sponsorship</p>
                        <p className="text-xs text-slate-400">Candidate will need H-1B or similar sponsorship</p>
                      </div>
                    </label>
                  </Field>

                  {/* Authorization status info box */}
                  {form.workAuthorization && (
                    <div className={cn(
                      "rounded-lg p-3 text-xs",
                      ["US Citizen", "Green Card"].includes(form.workAuthorization)
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                        : "bg-amber-50 border border-amber-200 text-amber-700",
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
              </Section>
            )}

            {/* ── Notes tab ── */}
            {activeTab === "notes" && (
              <>
                <Section icon={Star} title="Rating">
                  <Field label="Candidate rating">
                    <div className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg bg-white">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" onClick={() => set("rating", n === form.rating ? 0 : n)} className="transition-transform hover:scale-110">
                          <Star className={cn("w-5 h-5", n <= form.rating ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                        </button>
                      ))}
                      {form.rating > 0 && (
                        <span className="text-xs text-slate-500 ml-1">{form.rating}/5</span>
                      )}
                    </div>
                  </Field>
                </Section>

                <Section icon={FileText} title="Internal Notes">
                  <Field label="Notes" hint="Internal only — not visible to candidate">
                    <Textarea rows={8} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Interview impressions, concerns, next steps…" />
                  </Field>
                </Section>
              </>
            )}
          </div>

          {/* Sticky footer */}
          <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-5 py-3 flex items-center gap-3">
            <button type="button" onClick={() => onOpenChange(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "create" ? "Add Applicant" : "Save Changes"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ── Form primitives ────────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-baseline gap-1 text-xs font-semibold text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-rose-500">*</span>}
        {hint && <span className="text-[10px] text-slate-400 font-normal ml-auto">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={cn("w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors placeholder:text-slate-400", props.className)} />
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn("w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-slate-700", props.className)}>
      {children}
    </select>
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={cn("w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors placeholder:text-slate-400 resize-none", props.className)} />
  );
}
