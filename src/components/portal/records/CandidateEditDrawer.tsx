"use client";

import * as React from "react";
import type { Application, Job } from "@/lib/aws/dynamodb";
import { Button, ConfirmDialog, Drawer } from "@/components/portal/kit";
import { FormBanner } from "@/components/portal/fields";
import { CandidateForm } from "./CandidateForm";
import { useCandidateForm } from "@/hooks/use-candidate-form";

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

const FORM_ID = "candidate-drawer-form";

/** The record edit surface: the candidate form in a kit Drawer, with a discard check. */
export function CandidateEditDrawer({ open, ...rest }: CandidateEditDrawerProps) {
  // Mounted only while open, so the leave-page guard is never armed by a closed drawer.
  return open ? <DrawerBody {...rest} /> : null;
}

function DrawerBody({
  onOpenChange, mode: modeProp, candidate, jobs = [], defaultJobId, onSaved,
}: Omit<CandidateEditDrawerProps, "open">) {
  const mode: CandidateDrawerMode = modeProp || (candidate ? "edit" : "create");
  const form = useCandidateForm({ mode });
  const { load } = form;
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);

  React.useEffect(() => {
    load(candidate ?? null, candidate ? undefined : { jobId: defaultJobId || "" });
  }, [candidate, defaultJobId, load]);

  const requestClose = () => {
    if (form.busy) return;
    if (form.dirty) setConfirmDiscard(true);
    else onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await form.submit({ jobs });
    if (!saved) return;
    onSaved?.(saved);
    onOpenChange(false);
  };

  const name = candidate?.name || candidate?.email;
  return (
    <>
      <Drawer
        width="lg"
        title={mode === "create" ? "Add applicant" : name ? `Edit ${name}` : "Edit applicant"}
        onClose={requestClose}
        footer={
          <>
            {Object.keys(form.errors).length > 0 && (
              <p className="mr-auto text-adm-base font-medium text-status-danger">Fix the highlighted fields to save.</p>
            )}
            <Button variant="ghost" onClick={requestClose} disabled={form.busy}>
              Cancel
            </Button>
            <Button icon="check" loading={form.busy} onClick={() => (document.getElementById(FORM_ID) as HTMLFormElement | null)?.requestSubmit()}>
              {form.uploading ? "Uploading resume…" : mode === "create" ? "Add applicant" : "Save changes"}
            </Button>
          </>
        }
      >
        <div className="grid gap-6">
          <FormBanner message={form.error} onDismiss={() => form.setError(null)} />
          <CandidateForm form={form} jobs={jobs} id={FORM_ID} onSubmit={handleSubmit} layout="drawer" />
        </div>
      </Drawer>
      {confirmDiscard && (
        <ConfirmDialog
          tone="primary"
          title="Discard your changes?"
          body="You have unsaved edits to this applicant. Closing now loses them."
          confirmLabel="Discard"
          onConfirm={() => {
            setConfirmDiscard(false);
            onOpenChange(false);
          }}
          onCancel={() => setConfirmDiscard(false)}
        />
      )}
    </>
  );
}
