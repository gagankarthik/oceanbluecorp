"use client";

import { useState } from "react";
import type { Application } from "@/lib/aws/dynamodb";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { IconEdit, IconFile } from "@/components/admin/icons";
import { hireTypeLabel } from "@/components/admin/theme";
import { fmtDate } from "@/lib/format";

/* ============================================================
   ApplicantDetails — the application's own fields.

   ── Empty fields stop being rendered as data ────────────────
   This grid used to print every field whether or not it held
   anything, so a typical record showed four em-dashes among
   nine cells: nearly half a card saying nothing, which the eye
   still has to read to discover is nothing. Blanks are now
   collapsed behind one line that says how many there are and
   offers the action that fixes them.

   That is also the design system's own rule (principle 5: empty
   sections say why they are empty and what to do), which the
   old grid quietly broke.

   The blanks stay reachable — a recruiter checking whether work
   authorisation is on file needs to see that it is missing, not
   just fail to find it. One click, and the difference between
   "absent" and "unrecorded" is explicit.
   ============================================================ */

type Field = { label: string; value?: React.ReactNode };

function Cell({ label, value }: Field) {
  return (
    <div className="min-w-0">
      <dt className="text-[13px] font-medium text-[var(--adm-ink-subtle)]">{label}</dt>
      <dd className="mt-1 break-words text-[14px] text-[var(--adm-ink)]">
        {value ?? <span className="text-[var(--adm-ink-subtle)]">—</span>}
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
          <button
            onClick={onEdit}
            className="inline-flex flex-none items-center gap-1.5 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--adm-ink-mute)] transition-colors hover:border-[var(--adm-accent)] hover:text-[var(--adm-accent)]"
          >
            <IconEdit className="h-3.5 w-3.5" /> Edit
          </button>
        }
      />

      {shown.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 py-4 sm:grid-cols-3">
          {shown.map((f) => (
            <Cell key={f.label} {...f} />
          ))}
        </dl>
      )}

      {blanks.length > 0 && (
        <div className="border-t border-[var(--adm-line-soft)] px-5 py-2.5">
          <button
            onClick={() => setShowEmpty((v) => !v)}
            className="text-[12.5px] font-medium text-[var(--adm-ink-subtle)] transition-colors hover:text-[var(--adm-accent)]"
          >
            {showEmpty
              ? "Hide empty fields"
              : `${blanks.length} ${blanks.length === 1 ? "field is" : "fields are"} not recorded — show`}
          </button>
        </div>
      )}
    </AdminCard>
  );
}
