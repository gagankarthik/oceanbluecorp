"use client";

import * as React from "react";
import { Loader2, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import type { Application, Job } from "@/lib/aws/dynamodb";
import { WorkspaceButton } from "./workspace";
import { ConfirmDialog } from "./confirm-dialog";
import { FormErrorBanner } from "./forms/form-alert";
import { CandidateForm } from "./candidate-form/candidate-form";
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

export function CandidateEditDrawer({
  open, onOpenChange, mode: modeProp, candidate, jobs = [], defaultJobId, onSaved,
}: CandidateEditDrawerProps) {
  const mode: CandidateDrawerMode = modeProp || (candidate ? "edit" : "create");
  const form = useCandidateForm({ mode });
  const { load } = form;
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);

  const requestClose = () => {
    if (form.dirty && !form.busy) setConfirmDiscard(true);
    else onOpenChange(false);
  };

  React.useEffect(() => {
    // Cleared on close so an abandoned draft doesn't keep the leave-page prompt armed.
    if (!open) { load(null); return; }
    load(candidate ?? null, candidate ? undefined : { jobId: defaultJobId || "" });
  }, [open, candidate, defaultJobId, load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await form.submit({ jobs });
    if (!saved) return;
    onSaved?.(saved);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
      <SheetContent
        side="right"
        onEscapeKeyDown={(e) => { if (confirmDiscard) e.preventDefault(); }} showCloseButton={false} overlayClassName="bg-[var(--adm-scrim)]" className="flex w-full flex-col gap-0 bg-[var(--adm-surface-sunken)] p-0 sm:max-w-[560px]">
        <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-[var(--adm-line)] bg-[var(--adm-surface)] px-4 py-4">
          <div className="min-w-0">
            <SheetTitle className="truncate text-[16px] font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">
              {mode === "create" ? "Add applicant" : "Edit applicant"}
            </SheetTitle>
            <SheetDescription className="mt-0.5 truncate text-[13px] text-[var(--adm-ink-mute)]">
              {mode === "create" ? "Enter the applicant's details below." : "Update this applicant's information."}
            </SheetDescription>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="grid h-8 w-8 flex-none place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <FormErrorBanner message={form.error} onDismiss={() => form.setError(null)} />
          <CandidateForm form={form} jobs={jobs} id={FORM_ID} onSubmit={handleSubmit} layout="drawer" />
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[var(--adm-line)] bg-[var(--adm-surface)] px-4 py-3">
          <WorkspaceButton variant="ghost" onClick={requestClose} className="flex-1 sm:flex-none">
            Cancel
          </WorkspaceButton>
          <WorkspaceButton type="submit" form={FORM_ID} variant="primary" disabled={form.busy} className="flex-1 sm:flex-none">
            {form.busy && <Loader2 className="animate-spin" aria-hidden="true" />}
            {form.uploading ? "Uploading resume…" : mode === "create" ? "Add applicant" : "Save changes"}
          </WorkspaceButton>
        </div>

        {/* Inside the sheet: a modal sheet blocks pointer events everywhere else. */}
        <ConfirmDialog
          open={confirmDiscard}
          tone="default"
          title="Discard your changes?"
          body="You have unsaved edits to this applicant. Closing now loses them."
          confirmLabel="Discard"
          cancelLabel="Keep editing"
          onConfirm={() => { setConfirmDiscard(false); onOpenChange(false); }}
          onCancel={() => setConfirmDiscard(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
