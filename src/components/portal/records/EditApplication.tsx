"use client";

import React, { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import type { Job } from "@/lib/aws/dynamodb";
import { CandidateForm, returnLabel, returnPath } from "@/components/portal/records/CandidateForm";
import { useCandidateForm } from "@/hooks/use-candidate-form";
import { useJobSummaries } from "@/hooks/use-console-data";
import { Button, EmptyState, ErrorState, FormSkeleton, Page, PageHeader } from "@/components/portal/kit";
import { FormBanner, StickyActions } from "@/components/portal/fields";

/** Ties the action-bar submit button to the form it sits outside of. */
const FORM_ID = "applicant-edit-form";

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

  // Read once into the form; a shared-cache refresh must not reset edits.
  const fetchRecord = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    fetch(`/api/applications/${id}`)
      .then((r) => {
        if (r.status === 404) return null;
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((appData) => {
        const app = appData?.application;
        if (!app) {
          setMissing(true);
          return;
        }
        load(app);
      })
      .catch(() => setLoadError("Check your connection and try again."))
      .finally(() => setLoading(false));
  }, [id, load]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const saved = await form.submit({ jobs });
    if (saved) router.push(returnTo ?? `/portal/candidates/${id}`);
  };

  const { values } = form;
  const recordName = `${values.firstName} ${values.lastName}`.trim();
  const back = returnTo ? { href: returnTo, label: returnLabel(returnTo) } : { href: `/portal/candidates/${id}`, label: "Candidate" };
  const errorCount = Object.keys(form.errors).length;

  if (loading) return <FormSkeleton label="Loading applicant" sections={3} />;

  return (
    <Page width="narrow">
      <PageHeader
        back={back}
        title={missing || loadError ? "Edit applicant" : recordName || "Edit applicant"}
        description={missing || loadError ? undefined : values.email || "Update the candidate record and pipeline stage."}
      />

      {missing ? (
        <EmptyState
          framed
          icon="search"
          title="This applicant doesn't exist"
          body="The record may have been removed, or the link is out of date."
          primary={{ label: "Go to applications", href: "/portal/applications" }}
        />
      ) : loadError ? (
        <ErrorState title="Couldn't load this applicant" message={loadError} onRetry={fetchRecord} />
      ) : (
        <>
          <FormBanner message={form.error} onDismiss={() => form.setError(null)} />
          <CandidateForm form={form} jobs={jobs} id={FORM_ID} onSubmit={handleSubmit} autoFocus />
          <StickyActions
            status={
              errorCount > 0 ? (
                <span className="font-medium text-status-danger">Fix the highlighted fields to save.</span>
              ) : form.dirty ? (
                "Unsaved changes"
              ) : (
                "No changes yet"
              )
            }
          >
            <Button variant="secondary" onClick={() => router.push(returnTo ?? `/portal/candidates/${id}`)}>
              Cancel
            </Button>
            <Button icon="check" loading={form.busy} onClick={() => (document.getElementById(FORM_ID) as HTMLFormElement | null)?.requestSubmit()}>
              {form.uploading ? "Uploading resume…" : "Save changes"}
            </Button>
          </StickyActions>
        </>
      )}
    </Page>
  );
}

export function EditApplication() {
  return (
    <Suspense fallback={<FormSkeleton label="Loading applicant" sections={3} />}>
      <EditApplicationInner />
    </Suspense>
  );
}
