"use client";

import { useState } from "react";
import type { Application } from "@/lib/aws/dynamodb";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { WorkspaceButton } from "@/components/admin/workspace";
import { IconEdit, IconFile } from "@/components/admin/icons";
import { hireTypeLabel } from "@/components/admin/theme";
import { fmtDate } from "@/lib/format";

/* The application's own fields. Blanks are not rendered as data: they collapse
   behind one line that says how many are missing (DESIGN_SYSTEM §8, Selective
   Attention / Zeigarnik), and one click shows them so "unrecorded" stays
   distinguishable from "absent". */

type Field = { label: string; value?: React.ReactNode };

function Cell({ label, value }: Field) {
  return (
    <div className="min-w-0">
      <dt className="text-[12.5px] text-[var(--adm-ink-subtle)]">{label}</dt>
      <dd className="mt-1 break-words text-[14px] text-[var(--adm-ink)]">
        {value ?? <span className="text-[var(--adm-ink-subtle)]">Not recorded</span>}
      </dd>
    </div>
  );
}

export function ApplicantDetails({
  candidate,
  onEdit,
}: {
  candidate: Application;
  onEdit: () => void;
}) {
  const [showEmpty, setShowEmpty] = useState(false);

  const fields: Field[] = [
    { label: "Work authorization", value: candidate.workAuthorization },
    { label: "Type of hire", value: hireTypeLabel(candidate.hireType) },
    { label: "Source", value: candidate.source },
    { label: "Visa expiry", value: candidate.visaExpiry ? fmtDate(candidate.visaExpiry) : undefined },
    { label: "Sponsorship", value: candidate.visaSponsorshipRequired ? "Required" : undefined },
    { label: "Street address", value: candidate.address },
    { label: "ZIP code", value: candidate.zipCode },
    { label: "Applied", value: fmtDate(candidate.appliedAt) },
    { label: "Added by", value: candidate.createdByName },
  ];

  const isEmpty = (f: Field) => f.value === undefined || f.value === null || f.value === "";
  const filled = fields.filter((f) => !isEmpty(f));
  const blanks = fields.filter(isEmpty);
  const shown = showEmpty ? fields : filled;

  return (
    <AdminCard className="overflow-hidden">
      <AdminCardHeader
        icon={IconFile}
        title="Applicant details"
        count={filled.length}
        action={
          <WorkspaceButton variant="ghost" onClick={onEdit} className="h-8 px-2.5 text-[13px]">
            <IconEdit aria-hidden="true" /> Edit
          </WorkspaceButton>
        }
      />

      {shown.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 p-4 sm:grid-cols-3">
          {shown.map((f) => (
            <Cell key={f.label} {...f} value={isEmpty(f) ? undefined : f.value} />
          ))}
        </dl>
      )}

      {blanks.length > 0 && (
        <div className="border-t border-[var(--adm-line-soft)] px-4 py-2.5">
          <button
            type="button"
            onClick={() => setShowEmpty((v) => !v)}
            aria-expanded={showEmpty}
            className="rounded-[6px] text-[13px] text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]"
          >
            {showEmpty
              ? "Hide empty fields"
              : `${blanks.length} ${blanks.length === 1 ? "field is" : "fields are"} not recorded. Show`}
          </button>
        </div>
      )}
    </AdminCard>
  );
}
