"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { X } from "lucide-react";
import type { BenchType, Job } from "@/lib/aws/dynamodb";
import {
  PIPELINE_STAGES, SOURCE_OPTIONS, US_STATES, COMMON_SKILLS, WORK_AUTH_OPTIONS, WORK_AUTH_GROUPS,
  HIRE_TYPE_OPTIONS, statusMeta, workAuthExpires, workAuthNeedsSponsorship, type AppStatus,
} from "@/components/admin/theme";
import { POOL_META, POOL_ORDER } from "@/lib/bench";
import { isPubliclyOpen } from "@/lib/job-status";
import { pastDateWarning } from "@/lib/form-validation";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { Field, FormInput, FormSelect, FormTextarea } from "@/components/admin/forms/primitives";
import { FieldWarning } from "@/components/admin/forms/form-alert";
import { TagInput } from "@/components/admin/forms/tag-input";
import { StarRating } from "@/components/admin/star-rating";
import { Checkbox } from "@/components/ui/checkbox";
import { IconDownload, IconFile, IconTrash, IconUpload, IconWarning } from "@/components/admin/icons";
import {
  CANDIDATE_FIELD_IDS as IDS, RESUME_ACCEPT, type CandidateFormState,
} from "@/hooks/use-candidate-form";
import { useUserDirectory } from "@/hooks/use-console-data";
import { cn } from "@/lib/utils";

const wellCls = "rounded-[12px] border px-4 py-3";
const inlineErrorCls = "flex items-center gap-1.5 rounded-[10px] bg-[var(--adm-danger-soft)] px-3 py-2 text-[12.5px] font-medium text-[var(--adm-danger-ink)]";
const iconBtnCls = "grid h-9 w-9 flex-none place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]";
const iconBtnDangerCls = "grid h-9 w-9 flex-none place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]";
const dropzoneCls = "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-[var(--adm-line-strong)] bg-[var(--adm-surface-sunken)] p-5 transition-colors hover:border-[var(--adm-accent)] hover:bg-[var(--adm-accent-tint)] focus-within:border-[var(--adm-accent)] focus-within:ring-2 focus-within:ring-[var(--adm-focus-ring)]";
const checkWellCls = "flex cursor-pointer items-start gap-2.5 rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-3.5 py-3 transition-colors hover:border-[var(--adm-line-strong)]";
const checkboxCls = "border-[var(--adm-line-strong)] data-[state=checked]:border-[var(--adm-accent)] data-[state=checked]:bg-[var(--adm-accent)]";

const BENCH_ONLY_STAGES: AppStatus[] = ["active", "inactive"];

/** Pipeline stages, the bench's own two when on the bench, and any legacy value so it isn't blanked. */
function stageOptions(current: AppStatus, bench: boolean): AppStatus[] {
  const keys: AppStatus[] = [...PIPELINE_STAGES.map((s) => s.key), "rejected"];
  if (bench) keys.unshift(...BENCH_ONLY_STAGES);
  if (!keys.includes(current)) keys.unshift(current);
  return keys;
}

/** A `?return=` target, accepted only as an in-console path. */
export function returnPath(raw: string | null): string | null {
  return raw && raw.startsWith("/admin") && !raw.startsWith("//") && !raw.includes("://") ? raw : null;
}

interface StaffUser { id: string; email: string; name: string; role: string }

const OWNER_ROLES = new Set(["admin", "hr", "recruiter", "sales"]);

function useOwners(): StaffUser[] {
  const { users } = useUserDirectory();
  // Falls back to the current owner only until (or unless) the list arrives.
  return React.useMemo(
    () => (users || []).filter((u): u is StaffUser => !!u.role && OWNER_ROLES.has(u.role)),
    [users],
  );
}

export interface CandidateFormProps {
  form: CandidateFormState;
  jobs: Job[];
  id: string;
  onSubmit: (e: React.FormEvent) => void;
  /** "page" lays cards out in two columns; "drawer" stacks them. */
  layout?: "page" | "drawer";
  hidden?: boolean;
  autoFocus?: boolean;
  /** Extra controls beside a newly picked resume (e.g. "Fill form from resume"). */
  resumeFileActions?: React.ReactNode;
  onResumeFileChange?: (file: File | null) => void;
}

export function CandidateForm({
  form, jobs, id, onSubmit, layout = "page", hidden, autoFocus, resumeFileActions, onResumeFileChange,
}: CandidateFormProps) {
  const { values: v, set, errors, invalidProps } = form;
  const owners = useOwners();

  const isPermanent = !workAuthNeedsSponsorship(v.workAuthorization);
  const showExpiry = workAuthExpires(v.workAuthorization);
  const jobOptions = jobs.filter((j) => isPubliclyOpen(j.status) || j.id === v.jobId);
  const ownerOptions = v.ownership && !owners.some((o) => o.id === v.ownership)
    ? [{ id: v.ownership, name: v.ownershipName, email: "", role: "" }, ...owners]
    : owners;

  const pickResume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (file && !form.selectResume(file)) onResumeFileChange?.(file);
  };

  const clearResumeFile = () => {
    form.selectResume(null);
    onResumeFileChange?.(null);
  };

  const downloadResume = async (resumeId: string) => {
    try {
      const res = await fetch(`/api/resume/${resumeId}`);
      const data = await res.json();
      if (!res.ok) throw new Error();
      window.open(data.downloadUrl, "_blank");
    } catch { toast.error("Couldn't download the resume. Try again."); }
  };

  const details = (
    <AdminCard key="details">
      <AdminCardHeader title="Candidate details" />
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
        <Field label="First name" required htmlFor={IDS.firstName} error={errors.firstName}>
          <FormInput id={IDS.firstName} {...invalidProps("firstName")} value={v.firstName} onChange={(e) => set("firstName", e.target.value)} onBlur={() => void form.checkDuplicate()} placeholder="Jane" autoFocus={autoFocus} />
        </Field>
        <Field label="Last name" htmlFor={IDS.lastName} error={errors.lastName}>
          <FormInput id={IDS.lastName} {...invalidProps("lastName")} value={v.lastName} onChange={(e) => set("lastName", e.target.value)} onBlur={() => void form.checkDuplicate()} placeholder="Smith" />
        </Field>
        <Field label="Email" required htmlFor={IDS.email} error={errors.email}>
          <FormInput
            id={IDS.email}
            type="email"
            {...invalidProps("email")}
            value={v.email}
            onChange={(e) => set("email", e.target.value)}
            onBlur={() => void form.checkDuplicate()}
            placeholder="jane@example.com"
          />
        </Field>
        <Field label="Phone" htmlFor={IDS.phone} error={errors.phone}>
          <FormInput id={IDS.phone} type="tel" className="tabular-nums" {...invalidProps("phone")} value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 (555) 000-0000" />
        </Field>
        {form.duplicates.length > 0 && (
          <div role="status" className={cn(wellCls, "col-span-full space-y-1.5 border-[var(--adm-warning-soft)] bg-[var(--adm-warning-soft)] py-2.5")}>
            <p className="flex items-center gap-2 text-[13px] font-medium text-[var(--adm-warning-ink)]">
              <IconWarning className="h-4 w-4 flex-none" aria-hidden="true" />
              {form.duplicates.some((d) => d.matchedOn.includes("email"))
                ? "This candidate already exists."
                : "A candidate with the same name already exists. Check it isn't the same person."}
            </p>
            <ul className="space-y-1 pl-6">
              {form.duplicates.map((d) => (
                <li key={d.id} className="flex flex-wrap items-baseline gap-x-2 text-[13px] text-[var(--adm-ink)]">
                  <Link href={`/admin/candidates/${d.id}`} className="font-medium text-[var(--adm-accent)] hover:underline">
                    {d.name || d.email}
                  </Link>
                  <span className="text-[var(--adm-ink-mute)]">
                    {[d.email, d.jobTitle].filter(Boolean).join(" · ")}
                    {" · matched on "}{d.matchedOn.join(" and ")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Field label="LinkedIn profile" htmlFor={IDS.linkedinUrl} error={errors.linkedinUrl} fullWidth>
          <FormInput id={IDS.linkedinUrl} inputMode="url" {...invalidProps("linkedinUrl")} value={v.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} placeholder="linkedin.com/in/jane-smith" />
        </Field>
      </div>
    </AdminCard>
  );

  const location = (
    <AdminCard key="location">
      <AdminCardHeader title="Location" />
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-6">
        <Field label="Street address" htmlFor={IDS.address} error={errors.address} className="sm:col-span-6">
          <FormInput id={IDS.address} {...invalidProps("address")} value={v.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Main Street" />
        </Field>
        <Field label="City" htmlFor={IDS.city} error={errors.city} className="sm:col-span-3">
          <FormInput id={IDS.city} {...invalidProps("city")} value={v.city} onChange={(e) => set("city", e.target.value)} placeholder="Austin" />
        </Field>
        <Field label="State" htmlFor="cand-state" className="sm:col-span-2">
          <FormSelect id="cand-state" value={v.state} onChange={(e) => set("state", e.target.value)}>
            <option value="">Select state…</option>
            {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            {v.state && !US_STATES.some((s) => s.code === v.state) && <option value={v.state}>{v.state}</option>}
          </FormSelect>
        </Field>
        <Field label="ZIP code" htmlFor={IDS.zipCode} error={errors.zipCode} className="sm:col-span-1">
          <FormInput id={IDS.zipCode} className="tabular-nums" {...invalidProps("zipCode")} value={v.zipCode} onChange={(e) => set("zipCode", e.target.value)} placeholder="78701" />
        </Field>
      </div>
    </AdminCard>
  );

  const skills = (
    <AdminCard key="skills">
      <AdminCardHeader title="Skills and experience" count={v.skills.length} />
      <div className="space-y-4 p-4">
        <Field label="Skills" htmlFor="cand-skills" helper="Press Enter or comma to add">
          <TagInput
            id="cand-skills"
            value={v.skills}
            onChange={(next) => set("skills", next)}
            suggestions={COMMON_SKILLS}
            max={60}
            placeholder="Type a skill and press Enter…"
          />
        </Field>
        <Field label="Experience summary" htmlFor={IDS.experience} error={errors.experience}>
          <FormTextarea id={IDS.experience} {...invalidProps("experience")} rows={4} value={v.experience} onChange={(e) => set("experience", e.target.value)} placeholder="Brief summary of experience, industries, key achievements…" />
        </Field>
      </div>
    </AdminCard>
  );

  const existing = form.existingResume;
  const documents = (
    <AdminCard key="documents">
      <AdminCardHeader title="Resume" />
      <div className="space-y-3 p-4">
        {form.resumeFile ? (
          <div className={cn(wellCls, "flex flex-wrap items-center gap-3 border-[var(--adm-line)] bg-[var(--adm-surface-sunken)]")}>
            <IconFile className="h-[18px] w-[18px] flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-[var(--adm-ink)]">{form.resumeFile.name}</p>
              <p className="text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]">
                {(form.resumeFile.size / 1024).toFixed(0)} KB · {existing ? "replaces the current resume on save" : "attached on save"}
              </p>
            </div>
            <div className="flex flex-none items-center gap-1">
              {resumeFileActions}
              <button type="button" aria-label="Remove selected resume" onClick={clearResumeFile} className={iconBtnDangerCls}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : existing ? (
          <div className={cn(wellCls, "flex items-center gap-3 border-[var(--adm-line)] bg-[var(--adm-surface-sunken)]")}>
            <IconFile className="h-[18px] w-[18px] flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-[var(--adm-ink)]">{existing.fileName}</p>
              <p className="text-[12.5px] text-[var(--adm-ink-subtle)]">
                {existing.origin === "bench" ? "From the bench profile" : "Current resume on file"}
              </p>
            </div>
            <div className="flex flex-none items-center gap-1">
              {existing.origin === "record" && (
                <button type="button" aria-label="Download resume" onClick={() => void downloadResume(existing.id)} className={iconBtnCls}>
                  <IconDownload className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              <button type="button" aria-label="Remove resume" onClick={() => form.setExistingResume(null)} className={iconBtnDangerCls}>
                <IconTrash className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}

        {!form.resumeFile && (
          <label className={dropzoneCls}>
            <input type="file" accept={RESUME_ACCEPT} onChange={pickResume} className="sr-only" />
            <IconUpload className="h-5 w-5 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
            <span className="text-center">
              <span className="block text-[14px] font-medium text-[var(--adm-ink)]">{existing ? "Upload a replacement" : "Upload resume"}</span>
              <span className="mt-0.5 block text-[12.5px] text-[var(--adm-ink-subtle)]">PDF or Word, up to 5 MB. Parsed automatically once saved.</span>
            </span>
          </label>
        )}

        {form.resumeError && (
          <p role="alert" className={inlineErrorCls}>
            <IconWarning className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
            {form.resumeError}
          </p>
        )}
      </div>
    </AdminCard>
  );

  const position = (
    <AdminCard key="position">
      <AdminCardHeader title="Position and pipeline" />
      <div className="space-y-4 p-4">
        <Field label="Job posting" htmlFor="cand-job">
          <FormSelect
            id="cand-job"
            value={v.jobId}
            onChange={(e) => {
              const j = jobs.find((x) => x.id === e.target.value);
              form.setValues((p) => ({ ...p, jobId: e.target.value, jobTitle: j?.title || "" }));
            }}
          >
            <option value="">Unassigned</option>
            {jobOptions.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
            {v.jobId && !jobOptions.some((j) => j.id === v.jobId) && (
              <option value={v.jobId}>{v.jobTitle || "Current posting"}</option>
            )}
          </FormSelect>
        </Field>

        <Field label="Stage" htmlFor="cand-stage">
          <FormSelect id="cand-stage" value={v.status} onChange={(e) => set("status", e.target.value as AppStatus)}>
            {stageOptions(v.status, v.addToTalentBench).map((k) => (
              <option key={k} value={k}>{statusMeta[k]?.label ?? k}</option>
            ))}
          </FormSelect>
        </Field>

        <Field label="Source" htmlFor="cand-source">
          <FormSelect id="cand-source" value={v.source} onChange={(e) => set("source", e.target.value)}>
            <option value="">Select…</option>
            {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            {v.source && !(SOURCE_OPTIONS as readonly string[]).includes(v.source) && <option value={v.source}>{v.source}</option>}
          </FormSelect>
        </Field>

        <Field label="Type of hire" htmlFor="cand-hire" helper={HIRE_TYPE_OPTIONS.find((o) => o.value === v.hireType)?.hint}>
          <FormSelect id="cand-hire" value={v.hireType} onChange={(e) => set("hireType", e.target.value)}>
            <option value="">Select…</option>
            {HIRE_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </FormSelect>
        </Field>

        <Field label="Assigned to" htmlFor="cand-owner">
          <FormSelect
            id="cand-owner"
            value={v.ownership}
            onChange={(e) => {
              const u = ownerOptions.find((o) => o.id === e.target.value);
              form.setValues((p) => ({ ...p, ownership: e.target.value, ownershipName: u ? u.name || u.email : "" }));
            }}
          >
            <option value="">Unassigned</option>
            {ownerOptions.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </FormSelect>
        </Field>

        <label htmlFor="cand-bench" className={checkWellCls}>
          <Checkbox
            id="cand-bench"
            checked={v.addToTalentBench}
            onCheckedChange={(c) => set("addToTalentBench", c === true)}
            className={cn("mt-0.5", checkboxCls)}
          />
          <span className="min-w-0">
            <span className="block text-[14px] font-medium text-[var(--adm-ink)]">Add to talent bench</span>
            <span className="mt-0.5 block text-[12.5px] text-[var(--adm-ink-subtle)]">Keep this candidate available for future requisitions.</span>
          </span>
        </label>

        {v.addToTalentBench && (
          <Field label="Talent pool" htmlFor="cand-pool" helper={POOL_META[v.benchType].hint}>
            <FormSelect id="cand-pool" value={v.benchType} onChange={(e) => set("benchType", e.target.value as BenchType)}>
              {POOL_ORDER.map((p) => (
                <option key={p} value={p}>{POOL_META[p].label} · {POOL_META[p].badge.toLowerCase()}</option>
              ))}
            </FormSelect>
          </Field>
        )}
      </div>
    </AdminCard>
  );

  const workAuth = (
    <AdminCard key="work-auth">
      <AdminCardHeader title="Work authorization" />
      <div className="space-y-4 p-4">
        <Field label="Visa or authorization" htmlFor="cand-work-auth">
          <FormSelect id="cand-work-auth" value={v.workAuthorization} onChange={(e) => set("workAuthorization", e.target.value)}>
            <option value="">Select…</option>
            {WORK_AUTH_GROUPS.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </optgroup>
            ))}
            {v.workAuthorization && !WORK_AUTH_OPTIONS.includes(v.workAuthorization) && (
              <option value={v.workAuthorization}>{v.workAuthorization}</option>
            )}
          </FormSelect>
        </Field>

        {showExpiry && (
          <Field label="Expiry date" htmlFor="cand-visa-expiry">
            <FormInput id="cand-visa-expiry" type="date" className="tabular-nums" value={v.visaExpiry} onChange={(e) => set("visaExpiry", e.target.value)} />
            <FieldWarning>{pastDateWarning(v.visaExpiry, "This authorization has already expired. Confirm the current status with the candidate.")}</FieldWarning>
          </Field>
        )}

        <label htmlFor="cand-sponsorship" className="flex cursor-pointer items-center gap-2.5">
          <Checkbox
            id="cand-sponsorship"
            checked={v.visaSponsorshipRequired}
            onCheckedChange={(c) => set("visaSponsorshipRequired", c === true)}
            className={checkboxCls}
          />
          <span className="text-[14px] text-[var(--adm-ink-mute)]">Requires sponsorship</span>
        </label>

        {v.workAuthorization && (
          <p className={cn(
            wellCls,
            "py-2.5 text-[13px] leading-relaxed",
            isPermanent
              ? "border-[var(--adm-success-soft)] bg-[var(--adm-success-soft)] text-[var(--adm-success-ink)]"
              : "border-[var(--adm-warning-soft)] bg-[var(--adm-warning-soft)] text-[var(--adm-warning-ink)]",
          )}>
            {isPermanent
              ? "Permanent US work authorization."
              : v.workAuthorization === "H1-B"
                ? "H-1B requires employer sponsorship."
                : ["OPT", "CPT"].includes(v.workAuthorization)
                  ? "OPT/CPT is time-limited, verify expiry before extending an offer."
                  : "Verify authorization docs before extending an offer."}
          </p>
        )}
      </div>
    </AdminCard>
  );

  const notes = (
    <AdminCard key="notes">
      <AdminCardHeader title="Rating and notes" />
      <div className="space-y-4 p-4">
        <Field label="Rating">
          <div className="flex items-center gap-2 py-1">
            <StarRating rating={v.rating} onRate={(n) => set("rating", n === v.rating ? 0 : n)} size="lg" />
            <span className="text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]">{v.rating > 0 ? `${v.rating}/5` : "–"}</span>
          </div>
        </Field>
        <Field label="Notes" htmlFor={IDS.notes} helper="Visible to staff only" error={errors.notes}>
          <FormTextarea id={IDS.notes} {...invalidProps("notes")} rows={5} value={v.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Interview impressions, concerns, next steps…" />
        </Field>
      </div>
    </AdminCard>
  );

  return (
    <form
      id={id}
      onSubmit={onSubmit}
      onBlur={form.revalidate}
      noValidate
      className={cn(
        layout === "page" ? "grid grid-cols-1 items-start gap-4 lg:grid-cols-3" : "space-y-4",
        hidden && "hidden",
      )}
    >
      {layout === "page" ? (
        <>
          <div className="min-w-0 space-y-4 lg:col-span-2">{details}{location}{skills}{documents}</div>
          <div className="min-w-0 space-y-4">{position}{workAuth}{notes}</div>
        </>
      ) : (
        <>{details}{position}{location}{skills}{workAuth}{documents}{notes}</>
      )}
    </form>
  );
}
