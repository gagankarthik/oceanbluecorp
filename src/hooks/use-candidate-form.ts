"use client";

import * as React from "react";
import type { Application, BenchType, Job } from "@/lib/aws/dynamodb";
import type { DuplicateMatch } from "@/lib/application-input";
import { normalizeState, type AppStatus } from "@/components/admin/theme";
import { poolOf } from "@/lib/bench";
import { useFormErrors } from "@/hooks/use-form-errors";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { refreshApplications } from "@/hooks/use-console-data";
import {
  LIMITS, check, collectErrors, email as emailRule, maxLen, normalizeWebsite, phone as phoneRule,
  required, website,
} from "@/lib/form-validation";

export interface CandidateFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  jobId: string;
  jobTitle: string;
  status: AppStatus;
  source: string;
  hireType: string;
  ownership: string;
  ownershipName: string;
  addToTalentBench: boolean;
  benchType: BenchType;
  skills: string[];
  experience: string;
  workAuthorization: string;
  visaExpiry: string;
  visaSponsorshipRequired: boolean;
  rating: number;
  notes: string;
}

export const EMPTY_CANDIDATE: CandidateFormValues = {
  firstName: "", lastName: "", email: "", phone: "", linkedinUrl: "",
  address: "", city: "", state: "", zipCode: "",
  jobId: "", jobTitle: "", status: "pending", source: "", hireType: "",
  ownership: "", ownershipName: "",
  addToTalentBench: false, benchType: "external",
  skills: [], experience: "",
  workAuthorization: "", visaExpiry: "", visaSponsorshipRequired: false,
  rating: 0, notes: "",
};

/** A resume already stored: the record's own, or one carried over from a bench profile. */
export interface AttachedResume {
  id: string;
  fileName: string;
  fileKey?: string;
  analysis?: unknown;
  origin: "record" | "bench";
}

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
export const RESUME_ACCEPT = ".pdf,.doc,.docx";

/** Extension, not MIME type: browsers report .doc/.docx inconsistently. */
export function resumeFileError(file: File): string | null {
  const name = file.name.toLowerCase();
  if (![".pdf", ".doc", ".docx"].some((ext) => name.endsWith(ext))) {
    return "Choose a PDF or Word document (.pdf, .doc or .docx).";
  }
  if (file.size > RESUME_MAX_BYTES) return "This file is larger than 5 MB. Choose a smaller copy of the resume.";
  return null;
}

export function candidateToValues(app: Application): CandidateFormValues {
  const [first, ...rest] = (app.name || "").split(" ");
  return {
    firstName: app.firstName || first || "",
    lastName: app.lastName || rest.join(" "),
    email: app.email || "",
    phone: app.phone || "",
    linkedinUrl: app.linkedinUrl || "",
    address: app.address || "",
    city: app.city || "",
    // Legacy rows hold a full state name; the picker submits codes.
    state: normalizeState(app.state) || app.state || "",
    zipCode: app.zipCode || "",
    jobId: app.jobId || "",
    jobTitle: app.jobTitle || "",
    status: (app.status as AppStatus) || "pending",
    source: app.source || "",
    hireType: app.hireType || "",
    ownership: app.ownership || "",
    ownershipName: app.ownershipName || "",
    addToTalentBench: !!app.addToTalentBench,
    benchType: poolOf(app),
    skills: app.skills || [],
    experience: app.experience || "",
    workAuthorization: app.workAuthorization || "",
    visaExpiry: app.visaExpiry || "",
    visaSponsorshipRequired: !!app.visaSponsorshipRequired,
    rating: app.rating || 0,
    notes: app.notes || "",
  };
}

export type CandidateField =
  | "firstName" | "lastName" | "email" | "phone" | "linkedinUrl"
  | "address" | "city" | "zipCode" | "experience" | "notes";

export const CANDIDATE_FIELD_IDS: Record<CandidateField, string> = {
  firstName: "cand-first-name", lastName: "cand-last-name", email: "cand-email", phone: "cand-phone",
  linkedinUrl: "cand-linkedin", address: "cand-address", city: "cand-city", zipCode: "cand-zip",
  experience: "cand-experience", notes: "cand-notes",
};

function validateCandidate(v: CandidateFormValues) {
  return collectErrors<CandidateField>({
    firstName: check(v.firstName, required("Enter the candidate's first name."), maxLen(LIMITS.name)),
    lastName: check(v.lastName, maxLen(LIMITS.name)),
    email: check(
      v.email,
      required("Enter the candidate's email, like name@company.com."),
      emailRule("That email doesn't look complete. Use the form name@company.com."),
      maxLen(LIMITS.email),
    ),
    phone: check(v.phone, phoneRule()),
    linkedinUrl: check(v.linkedinUrl, website("Enter a LinkedIn address, like linkedin.com/in/jane-smith."), maxLen(LIMITS.url)),
    address: check(v.address, maxLen(LIMITS.short)),
    city: check(v.city, maxLen(LIMITS.name)),
    zipCode: check(v.zipCode, maxLen(10, "Enter a 5-digit ZIP code, or ZIP+4 like 10001-1234.")),
    experience: check(v.experience, maxLen(LIMITS.notes)),
    notes: check(v.notes, maxLen(LIMITS.notes)),
  });
}

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface UseCandidateFormOptions {
  mode: "create" | "edit";
  initial?: Partial<CandidateFormValues>;
}

export interface SubmitOptions {
  jobs: Job[];
  /** Extraction already run on `resumeFile`, stored instead of re-parsing. */
  resumeAnalysis?: unknown;
}

export function useCandidateForm({ mode, initial }: UseCandidateFormOptions) {
  const seed = React.useMemo(() => ({ ...EMPTY_CANDIDATE, ...initial }), [initial]);
  const [values, setValues] = React.useState<CandidateFormValues>(seed);
  const [baseline, setBaseline] = React.useState(() => JSON.stringify(seed));
  const [record, setRecord] = React.useState<Application | null>(null);

  const [resumeFile, setResumeFile] = React.useState<File | null>(null);
  const [resumeError, setResumeError] = React.useState<string | null>(null);
  const [existingResume, setExistingResume] = React.useState<AttachedResume | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const [duplicates, setDuplicates] = React.useState<DuplicateMatch[]>([]);
  const [ignoreDuplicateId, setIgnoreDuplicateId] = React.useState<string | null>(null);
  const lastChecked = React.useRef("");

  const fieldErrors = useFormErrors<CandidateField>(() => validateCandidate(values), CANDIDATE_FIELD_IDS);
  const resetErrors = fieldErrors.reset;

  const set = React.useCallback(<K extends keyof CandidateFormValues>(k: K, v: CandidateFormValues[K]) => {
    setValues((p) => ({ ...p, [k]: v }));
  }, []);

  /** Re-seed from a record (edit) or from defaults (create). */
  const load = React.useCallback((app: Application | null, overrides?: Partial<CandidateFormValues>) => {
    const next = { ...(app ? candidateToValues(app) : seed), ...overrides };
    setValues(next);
    setBaseline(JSON.stringify(next));
    setRecord(app);
    setExistingResume(app?.resumeId
      ? { id: app.resumeId, fileName: app.resumeFileName || "Resume on file", fileKey: app.resumeFileKey, origin: "record" }
      : null);
    setResumeFile(null);
    setResumeError(null);
    setError(null);
    setSaved(false);
    setDuplicates([]);
    lastChecked.current = "";
    resetErrors();
  }, [seed, resetErrors]);

  /** Returns the rejection message, or null once the file is taken. */
  const selectResume = React.useCallback((file: File | null): string | null => {
    setResumeError(null);
    if (!file) { setResumeFile(null); return null; }
    const invalid = resumeFileError(file);
    if (invalid) { setResumeError(invalid); return invalid; }
    setResumeFile(file);
    return null;
  }, []);

  // Run on blur of the name and email fields; same person by email or by full name.
  const checkDuplicate = React.useCallback(async () => {
    if (mode !== "create") return;
    const addr = values.email.trim().toLowerCase();
    const email = EMAIL_SHAPE.test(addr) ? addr : "";
    const name = values.lastName.trim() ? `${values.firstName.trim()} ${values.lastName.trim()}` : "";
    const query = new URLSearchParams({
      ...(email && { email }),
      ...(name && { name }),
      ...(ignoreDuplicateId && { exclude: ignoreDuplicateId }),
    }).toString();
    if (query === lastChecked.current) return;
    lastChecked.current = query;
    if (!email && !name) { setDuplicates([]); return; }
    try {
      const res = await fetch(`/api/applications/duplicates?${query}`);
      if (!res.ok || lastChecked.current !== query) return;
      const data = await res.json();
      setDuplicates((data.matches || []) as DuplicateMatch[]);
    } catch { /* advisory only; saving is never blocked on it */ }
  }, [mode, values.email, values.firstName, values.lastName, ignoreDuplicateId]);

  const uploadResume = async (file: File, ownerId: string) => {
    setUploading(true);
    try {
      // Server-side S3 upload (multipart) avoids browser→S3 CORS.
      const fd = new FormData();
      fd.append("file", file);
      fd.append("userId", ownerId);
      const res = await fetch("/api/resume/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "The resume didn't upload. Try again, or remove it and save without one.");
      return { resumeId: data.resumeId as string, resumeFileName: file.name, resumeFileKey: data.fileKey as string };
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : "The resume didn't upload. Try again, or remove it and save without one.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  /** Validates, uploads any new resume, then POSTs or PUTs. Resolves to the saved record, or null. */
  const submit = async ({ jobs, resumeAnalysis }: SubmitOptions): Promise<Application | null> => {
    if (submitting || uploading) return null;
    if (!fieldErrors.validateAll()) return null;
    setSubmitting(true);
    setError(null);
    try {
      let resume: Record<string, unknown> = {};
      if (resumeFile) {
        const uploaded = await uploadResume(resumeFile, record?.id || `new-${Date.now()}`);
        if (!uploaded) return null;
        resume = { ...uploaded, ...(resumeAnalysis ? { resumeAnalysis } : {}) };
      } else if (existingResume && existingResume.id !== record?.resumeId) {
        resume = {
          resumeId: existingResume.id,
          resumeFileName: existingResume.fileName,
          resumeFileKey: existingResume.fileKey,
          ...(existingResume.analysis ? { resumeAnalysis: existingResume.analysis } : {}),
        };
      } else if (!existingResume && record?.resumeId) {
        resume = { resumeId: "", resumeFileName: "", resumeFileKey: "" };
      }

      const v = values;
      const job = jobs.find((j) => j.id === v.jobId);
      const ownerChanged = v.ownership !== (record?.ownership || "");
      const payload = {
        firstName: v.firstName.trim(),
        lastName: v.lastName.trim(),
        name: `${v.firstName.trim()} ${v.lastName.trim()}`.trim(),
        email: v.email.trim(),
        phone: v.phone.trim(),
        linkedinUrl: normalizeWebsite(v.linkedinUrl),
        address: v.address.trim(),
        city: v.city.trim(),
        state: v.state,
        zipCode: v.zipCode.trim(),
        status: v.status,
        jobId: v.jobId || undefined,
        jobTitle: v.jobTitle || job?.title || undefined,
        source: v.source || undefined,
        hireType: v.hireType || undefined,
        workAuthorization: v.workAuthorization || undefined,
        visaSponsorshipRequired: v.visaSponsorshipRequired,
        skills: v.skills,
        experience: v.experience,
        notes: v.notes,
        addToTalentBench: v.addToTalentBench,
        ...(v.addToTalentBench && { benchType: v.benchType }),
        // Re-sending an unchanged owner would restamp ownershipClaimedAt.
        ...(ownerChanged && { ownership: v.ownership, ownershipName: v.ownershipName }),
        ...resume,
      };

      const res = mode === "create"
        ? await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            ...(v.visaExpiry && { visaExpiry: v.visaExpiry }),
            rating: v.rating || undefined,
            userId: "anonymous",
            appliedAt: new Date().toISOString(),
          }),
        })
        : await fetch(`/api/applications/${record!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          // Empty strings are sent on edit so a cleared field actually clears.
          body: JSON.stringify({ ...payload, visaExpiry: v.visaExpiry, rating: v.rating }),
        });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save the candidate. Try again.");
      setSaved(true);
      void refreshApplications();
      return data.application as Application;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the candidate. Check your connection and try again.");
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const resumeChanged = !!resumeFile || (existingResume?.id ?? "") !== (record?.resumeId ?? "");
  const dirty = !saved && (JSON.stringify(values) !== baseline || resumeChanged);
  useUnsavedChanges(dirty);

  return {
    mode, values, setValues, set, load, record,
    errors: fieldErrors.errors,
    revalidate: fieldErrors.revalidate,
    invalidProps: fieldErrors.invalidProps,
    resumeFile, selectResume, resumeError, setResumeError,
    existingResume, setExistingResume,
    uploading, submitting, busy: submitting || uploading,
    error, setError,
    duplicates, checkDuplicate, setIgnoreDuplicateId,
    dirty, submit,
  };
}

export type CandidateFormState = ReturnType<typeof useCandidateForm>;
