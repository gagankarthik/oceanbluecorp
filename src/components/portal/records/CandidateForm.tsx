"use client";

import * as React from "react";
import Link from "next/link";
import type { BenchType, Job } from "@/lib/aws/dynamodb";
import { HIRE_TYPE_OPTIONS, SOURCE_OPTIONS } from "@/components/admin/theme";
import { POOL_META, POOL_ORDER } from "@/lib/bench";
import {
  CANDIDATE_FIELD_IDS as IDS, CANDIDATE_LIMITS, type CandidateField, type CandidateFormState,
} from "@/hooks/use-candidate-form";
import { useToast } from "@/components/portal/toast";
import {
  CheckRow, Field, FormSection, JobPicker, LocationInput, NativeSelect, Notice, RatingInput, ResumeDrop,
  SectionBadge, SkillsInput, StageSelect, StaffPicker, TextArea, TextInput, WorkAuthInput, useStaff,
} from "@/components/portal/fields";

/** A `?return=` target, accepted only as an in-console path. */
export function returnPath(raw: string | null): string | null {
  return raw && raw.startsWith("/portal") && !raw.startsWith("//") && !raw.includes("://") ? raw : null;
}

/** The back link's words for a `?return=` path. */
export function returnLabel(path: string): string {
  if (path.startsWith("/portal/talent-bench")) return "Talent bench";
  if (path.startsWith("/portal/applications")) return "Applications";
  if (path.startsWith("/portal/candidates")) return "Candidate";
  if (path.startsWith("/portal/jobs")) return "Job";
  return "Back";
}

const OWNER_ROLES = ["admin", "hr", "recruiter", "sales"] as const;
const MORE_FIELDS: CandidateField[] = ["address", "zipCode", "experience"];

export interface CandidateFormProps {
  form: CandidateFormState;
  jobs: Job[];
  id: string;
  onSubmit: (e: React.FormEvent) => void;
  /** Kept for callers; both layouts are one column of sections. */
  layout?: "page" | "drawer";
  hidden?: boolean;
  autoFocus?: boolean;
  /** Extra controls beside a newly picked resume (e.g. "Fill form from resume"). */
  resumeFileActions?: React.ReactNode;
  onResumeFileChange?: (file: File | null) => void;
}

/**
 * Essentials (the two required fields and where the candidate sits), Profile,
 * then "More details" folded away. Notes live on the record's Notes tab only.
 */
export function CandidateForm({
  form, jobs, id, onSubmit, hidden, autoFocus, resumeFileActions, onResumeFileChange,
}: CandidateFormProps) {
  const { values: v, set, setValues, errors, invalidProps } = form;
  const notify = useToast();
  const { people: owners } = useStaff({ roles: OWNER_ROLES });

  const moreFilled = [v.address, v.zipCode, v.experience, v.hireType, v.source].filter((x) => !!x?.trim()).length
    + (v.rating ? 1 : 0) + (v.addToTalentBench ? 1 : 0);
  const moreErrors = MORE_FIELDS.some((k) => errors[k]);
  const [moreChoice, setMoreChoice] = React.useState<boolean | null>(null);
  const moreOpen = moreErrors || (moreChoice ?? moreFilled > 0);

  const downloadResume = async (resumeId: string) => {
    try {
      const res = await fetch(`/api/resume/${resumeId}`);
      const data = await res.json();
      if (!res.ok) throw new Error();
      window.open(data.downloadUrl, "_blank");
    } catch {
      notify("Couldn't download the resume. Try again.", { tone: "error" });
    }
  };

  const duplicateNotice = form.duplicates.length > 0 && (
    <Notice tone="warning" role="status">
      <p className="font-medium">
        {form.duplicates.some((d) => d.matchedOn.includes("email"))
          ? "This candidate already exists."
          : "A candidate with the same name already exists. Check it isn't the same person."}
      </p>
      <ul className="mt-1.5 grid gap-1">
        {form.duplicates.map((d) => (
          <li key={d.id} className="text-[13px]">
            <Link href={`/portal/candidates/${d.id}`} className="font-medium text-ocean-700 underline-offset-4 hover:underline">
              {d.name || d.email}
            </Link>
            <span className="text-[#93370d]/80">
              {" "}
              {[d.email, d.jobTitle].filter(Boolean).join(" · ")} · matched on {d.matchedOn.join(" and ")}
            </span>
          </li>
        ))}
      </ul>
    </Notice>
  );

  const existing = form.existingResume;

  return (
    <form id={id} onSubmit={onSubmit} onBlur={form.revalidate} noValidate className={hidden ? "hidden" : "grid min-w-0 gap-6"}>
      <FormSection
        title="Essentials"
        description="First name and email are required. Everything else is optional."
        badge={<SectionBadge tone="red">2 required</SectionBadge>}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" required htmlFor={IDS.firstName} error={errors.firstName}>
            <TextInput
              id={IDS.firstName}
              {...invalidProps("firstName")}
              maxLength={CANDIDATE_LIMITS.name}
              value={v.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              onBlur={() => void form.checkDuplicate()}
              placeholder="Jane"
              autoFocus={autoFocus}
            />
          </Field>
          <Field label="Last name" htmlFor={IDS.lastName} error={errors.lastName}>
            <TextInput
              id={IDS.lastName}
              {...invalidProps("lastName")}
              maxLength={CANDIDATE_LIMITS.name}
              value={v.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              onBlur={() => void form.checkDuplicate()}
              placeholder="Smith"
            />
          </Field>
          <Field label="Email" required htmlFor={IDS.email} error={errors.email}>
            <TextInput
              id={IDS.email}
              type="email"
              inputMode="email"
              {...invalidProps("email")}
              value={v.email}
              onChange={(e) => set("email", e.target.value)}
              onBlur={() => void form.checkDuplicate()}
              placeholder="jane@example.com"
            />
          </Field>
          <Field label="Phone" htmlFor={IDS.phone} error={errors.phone}>
            <TextInput id={IDS.phone} type="tel" className="tabular-nums" {...invalidProps("phone")} value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 (555) 000-0000" />
          </Field>
        </div>
        {duplicateNotice}
        <div className="grid gap-5 border-t border-mist-200 pt-5 sm:grid-cols-2">
          <Field label="Job posting" htmlFor="cand-job" className="sm:col-span-2" helper="Active roles are on the careers site; Open roles are internal.">
            <JobPicker
              id="cand-job"
              jobs={jobs}
              value={v.jobId}
              currentTitle={v.jobTitle}
              onChange={(job, jobId) => setValues((p) => ({ ...p, jobId, jobTitle: job?.title || "" }))}
            />
          </Field>
          <Field label="Stage" htmlFor="cand-stage" helper={v.status === "hired" ? "Hired candidates join the internal bench automatically." : undefined}>
            <StageSelect id="cand-stage" value={v.status} set={v.addToTalentBench ? "both" : "pipeline"} onChange={(s) => set("status", s)} />
          </Field>
          <Field label="Assigned to">
            <StaffPicker
              label="Assigned to"
              people={owners}
              value={v.ownership}
              fallbackName={v.ownershipName}
              onChange={(key, p) => setValues((prev) => ({ ...prev, ownership: key, ownershipName: p ? p.name || p.email : "" }))}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Profile" description="Where they are, what they do, and whether they can work here.">
        <LocationInput
          value={{ city: v.city, state: v.state }}
          onChange={(p) => setValues((prev) => ({ ...prev, ...(p.city !== undefined && { city: p.city }), ...(p.state !== undefined && { state: p.state }) }))}
          ids={{ city: IDS.city, state: "cand-state" }}
          errors={{ city: errors.city }}
          invalidProps={(k) => (k === "city" ? invalidProps("city") : {})}
          limits={{ city: CANDIDATE_LIMITS.city }}
        />
        <Field label="Skills" htmlFor="cand-skills" hint={v.skills.length ? `${v.skills.length} added` : undefined} helper="Press Enter or a comma to add each skill.">
          <SkillsInput id="cand-skills" value={v.skills} onChange={(next) => set("skills", next)} />
        </Field>
        <div className="border-t border-mist-200 pt-5">
          <WorkAuthInput
            idPrefix="cand-auth"
            value={{ workAuthorization: v.workAuthorization, visaExpiry: v.visaExpiry, visaSponsorshipRequired: v.visaSponsorshipRequired }}
            onChange={(p) => setValues((prev) => ({ ...prev, ...p }))}
          />
        </div>
        <Field label="LinkedIn profile" htmlFor={IDS.linkedinUrl} error={errors.linkedinUrl}>
          <TextInput
            id={IDS.linkedinUrl}
            inputMode="url"
            {...invalidProps("linkedinUrl")}
            value={v.linkedinUrl}
            onChange={(e) => set("linkedinUrl", e.target.value)}
            placeholder="linkedin.com/in/jane-smith"
          />
        </Field>
        <Field label="Resume">
          <ResumeDrop
            file={form.resumeFile}
            existing={existing}
            error={form.resumeError}
            fileActions={resumeFileActions}
            helper="Read automatically once saved."
            onPick={(file) => {
              const err = form.selectResume(file);
              if (!err) onResumeFileChange?.(file);
              return err;
            }}
            onClearFile={() => {
              form.selectResume(null);
              onResumeFileChange?.(null);
            }}
            onRemoveExisting={() => form.setExistingResume(null)}
            onDownload={existing ? () => void downloadResume(existing.id) : undefined}
          />
        </Field>
      </FormSection>

      <FormSection
        title="More details"
        description="Address, experience, how they were hired, rating and the talent bench."
        badge={moreFilled > 0 ? <SectionBadge tone="blue">{moreFilled} filled</SectionBadge> : <SectionBadge>Optional</SectionBadge>}
        collapsible
        open={moreOpen}
        onOpenChange={setMoreChoice}
      >
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <Field label="Street address" htmlFor={IDS.address} error={errors.address}>
            <TextInput id={IDS.address} {...invalidProps("address")} maxLength={CANDIDATE_LIMITS.address} value={v.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Main Street" />
          </Field>
          <Field label="ZIP code" htmlFor={IDS.zipCode} error={errors.zipCode}>
            <TextInput id={IDS.zipCode} {...invalidProps("zipCode")} maxLength={CANDIDATE_LIMITS.zip} inputMode="numeric" className="tabular-nums" value={v.zipCode} onChange={(e) => set("zipCode", e.target.value)} placeholder="78701" />
          </Field>
        </div>
        <Field
          label="Experience summary"
          htmlFor={IDS.experience}
          error={errors.experience}
          hint={v.experience.length > CANDIDATE_LIMITS.experience * 0.8 ? `${v.experience.length.toLocaleString()} / ${CANDIDATE_LIMITS.experience.toLocaleString()}` : undefined}
        >
          <TextArea
            id={IDS.experience}
            {...invalidProps("experience")}
            rows={4}
            value={v.experience}
            onChange={(e) => set("experience", e.target.value)}
            placeholder="Industries, key projects, achievements…"
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Type of hire" htmlFor="cand-hire" helper={HIRE_TYPE_OPTIONS.find((o) => o.value === v.hireType)?.hint}>
            <NativeSelect id="cand-hire" value={v.hireType} onChange={(e) => set("hireType", e.target.value)}>
              <option value="">Select…</option>
              {HIRE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
              {v.hireType && !HIRE_TYPE_OPTIONS.some((o) => o.value === v.hireType) && <option value={v.hireType}>{v.hireType}</option>}
            </NativeSelect>
          </Field>
          <Field label="Source" htmlFor="cand-source">
            <NativeSelect id="cand-source" value={v.source} onChange={(e) => set("source", e.target.value)}>
              <option value="">Select…</option>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              {v.source && !SOURCE_OPTIONS.includes(v.source) && <option value={v.source}>{v.source}</option>}
            </NativeSelect>
          </Field>
        </div>
        <Field label="Rating">
          <RatingInput value={v.rating} onChange={(n) => set("rating", n)} label="Candidate rating" showValue />
        </Field>
        <div className="grid gap-4">
          <CheckRow
            id="cand-bench"
            boxed
            checked={v.addToTalentBench}
            onChange={(c) => set("addToTalentBench", c)}
            title="Add to the talent bench"
            description="Keep this candidate available for future requisitions."
          />
          {v.addToTalentBench && (
            <Field label="Talent pool" htmlFor="cand-pool" helper={POOL_META[v.benchType].hint}>
              <NativeSelect id="cand-pool" value={v.benchType} onChange={(e) => set("benchType", e.target.value as BenchType)}>
                {POOL_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {POOL_META[p].label} · {POOL_META[p].badge.toLowerCase()}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          )}
        </div>
      </FormSection>
    </form>
  );
}
