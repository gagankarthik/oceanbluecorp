"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, SearchX } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { IconSave } from "@/components/admin/icons";
import type { Job } from "@/lib/aws/dynamodb";
import { PageHeader } from "@/components/admin/page-header";
import { WorkspaceButton } from "@/components/admin/workspace";
import { AdminCard } from "@/components/admin/admin-card";
import { Skel } from "@/components/admin/skeletons";
import { FormErrorBanner } from "@/components/admin/forms/form-alert";
import { CandidateForm, returnPath } from "@/components/admin/candidate-form/candidate-form";
import { useCandidateForm } from "@/hooks/use-candidate-form";
import { useJobSummaries } from "@/hooks/use-console-data";
import { cn } from "@/lib/utils";

/** Ties the action-bar submit button to the form it sits outside of. */
const FORM_ID = "applicant-edit-form";

const backLinkCls = "-ml-1 inline-flex items-center gap-1 rounded-[6px] px-1 py-0.5 text-[13px] text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-ink)]";
/** Bleeds to the edges of main's `p-4 sm:p-5 lg:p-6` so it spans the pane. */
const actionBarCls = "sticky bottom-0 z-20 -mx-4 -mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[var(--adm-line)] bg-[var(--adm-surface)]/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:-mb-5 sm:px-5 lg:-mx-6 lg:-mb-6 lg:px-6";

function EditApplicationInner() {
  const router = useRouter();
  const params = useParams();
  const search = useSearchParams();
  const id = params.id as string;
  const returnTo = returnPath(search.get("return"));

  const form = useCandidateForm({ mode: "edit" });
  const { load } = form;
  const { jobs: jobList } = useJobSummaries();
  const jobs = useMemo<Job[]>(() => jobList ?? [], [jobList]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Read once into the form; a shared-cache refresh must not reset edits.
    fetch(`/api/applications/${id}`).then((r) => {
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }).then((appData) => {
      const app = appData?.application;
      if (!app) { setMissing(true); return; }
      load(app);
    }).catch(() => setLoadError("Couldn't load this applicant. Refresh the page to try again."))
      .finally(() => setLoading(false));
  }, [id, load]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const saved = await form.submit({ jobs });
    if (saved) router.push(returnTo ?? `/admin/candidates/${id}`);
  };

  const { values } = form;
  const recordName = `${values.firstName} ${values.lastName}`.trim();

  if (loading) return <EditSkeleton />;

  if (missing) {
    return (
      <div className="space-y-4 lg:space-y-5">
        <button type="button" onClick={() => router.back()} className={backLinkCls}>
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />Back
        </button>
        <AdminCard>
          <EmptyState
            icon={SearchX}
            title="This applicant doesn't exist"
            description="The record may have been removed, or the link is out of date."
            action={
              <WorkspaceButton onClick={() => router.push(returnTo ?? "/admin/applications")}>Go back</WorkspaceButton>
            }
          />
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      <div>
        <button type="button" onClick={() => router.back()} className={backLinkCls}>
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />Back
        </button>
        <PageHeader
          className="mb-0 mt-2"
          title={recordName || "Edit applicant"}
          subtitle={values.email || "Update the candidate record and pipeline stage"}
        />
      </div>

      <FormErrorBanner message={form.error ?? loadError} onDismiss={() => { form.setError(null); setLoadError(null); }} />

      <CandidateForm form={form} jobs={jobs} id={FORM_ID} onSubmit={handleSubmit} autoFocus />

      <div className={actionBarCls}>
        <p className="min-w-0 text-[13px] font-medium text-[var(--adm-danger-ink)]">
          {Object.keys(form.errors).length > 0 ? "Fix the highlighted fields to save." : form.error}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <WorkspaceButton onClick={() => router.push(returnTo ?? `/admin/candidates/${id}`)}>
            Cancel
          </WorkspaceButton>
          <WorkspaceButton type="submit" form={FORM_ID} variant="primary" disabled={form.busy}>
            {form.busy ? <Loader2 className="animate-spin" /> : <IconSave />}
            {form.uploading ? "Uploading resume…" : "Save changes"}
          </WorkspaceButton>
        </div>
      </div>
    </div>
  );
}

/** Mirrors the form: back link and title, then a two-thirds / one-third card grid. */
function EditSkeleton() {
  const card = (fields: number, cols: string) => (
    <div className="rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]">
      <div className="border-b border-[var(--adm-line-soft)] px-4 py-4">
        <Skel className="h-4 w-36" />
      </div>
      <div className={cn("grid gap-4 p-4", cols)}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skel className="h-3.5 w-24" />
            <Skel className="h-9 w-full rounded-[10px]" />
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div className="space-y-4 lg:space-y-5" aria-busy="true" aria-label="Loading applicant">
      <div className="space-y-2">
        <Skel className="h-3.5 w-12" />
        <Skel className="h-6 w-56" />
        <Skel className="h-3.5 w-44" />
      </div>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {card(4, "grid-cols-1 sm:grid-cols-2")}
          {card(4, "grid-cols-1 sm:grid-cols-2")}
          {card(2, "grid-cols-1")}
        </div>
        <div className="space-y-4">
          {card(5, "grid-cols-1")}
          {card(1, "grid-cols-1")}
        </div>
      </div>
    </div>
  );
}

export default function EditApplicationPage() {
  return (
    <Suspense>
      <EditApplicationInner />
    </Suspense>
  );
}
