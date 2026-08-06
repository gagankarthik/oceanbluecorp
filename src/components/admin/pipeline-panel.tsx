"use client";

/**
 * The recruiting pipeline for one candidate: who they were submitted to, the
 * interviews that came of it, and the placement at the end.
 *
 * Reads as a spine rather than three lists, because that is the shape of the
 * work — a submission goes out, interviews hang off it, a placement closes it.
 * Interviews and placements recorded without a submission (a direct-hire
 * conversation, a rehire) are still shown, grouped separately, rather than
 * hidden for failing to fit the common case.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import {
  IconPipeline, IconSend, IconInterview, IconPlacement, IconMoney,
  IconCalendar, IconTrash, IconWarning, IconBuilding, IconPercent, IconUser,
} from "@/components/admin/icons";
import type {
  Client, Interview, PipelineKind, PipelineRecord, Placement, RateUnit, Submission, Vendor,
} from "@/lib/aws/dynamodb";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AdminCard, AdminCardHeader } from "./admin-card";
import { ConfirmDialog } from "./confirm-dialog";
import { EmptyState } from "./empty-state";
import { StatusBadge } from "./status-badge";
import { WorkspaceButton } from "./workspace";
import { Field, FormInput, FormSelect, FormTextarea } from "./forms/primitives";
import {
  SUBMISSION_STATUS_LABELS, SUBMISSION_STATUS_ORDER, submissionTone,
  INTERVIEW_STATUS_LABELS, INTERVIEW_STATUS_ORDER, INTERVIEW_MODE_LABELS,
  INTERVIEW_OUTCOME_LABELS, interviewTone,
  PLACEMENT_STATUS_LABELS, PLACEMENT_STATUS_ORDER, placementTone,
  RATE_UNIT_LABELS, formatRate, grossMarginAmount, grossMarginPct,
} from "@/lib/pipeline-records";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const RATE_UNITS: RateUnit[] = ["hourly", "daily", "weekly", "monthly", "annual"];

const KIND_META: Record<PipelineKind, { label: string; icon: typeof IconSend; blurb: string }> = {
  submission: { label: "Submission", icon: IconSend, blurb: "Sent to a client or vendor" },
  interview: { label: "Interview", icon: IconInterview, blurb: "Scheduled or completed" },
  placement: { label: "Placement", icon: IconPlacement, blurb: "Started on assignment" },
};

/** ISO string → the value an <input type="datetime-local"> expects, in local time. */
function toLocalInput(iso?: string, dateOnly = false): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return dateOnly ? date : `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Local input value → ISO, or undefined for a blank field. */
function fromLocalInput(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

interface PipelinePanelProps {
  applicationId: string;
  candidateName?: string;
  jobId?: string;
  jobTitle?: string;
  /** Defaults for a new submission/placement, taken from the requisition. */
  defaultClientId?: string;
  defaultClientName?: string;
  defaultVendorId?: string;
  defaultVendorName?: string;
  defaultBillRate?: number;
  defaultPayRate?: number;
  /** Told when the candidate's stage was advanced by a recorded event. */
  onStatusAdvanced?: (status: string) => void;
}

export function PipelinePanel({
  applicationId, candidateName, jobId, jobTitle,
  defaultClientId, defaultClientName, defaultVendorId, defaultVendorName,
  defaultBillRate, defaultPayRate,
  onStatusAdvanced,
}: PipelinePanelProps) {
  const [records, setRecords] = useState<PipelineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drawerKind, setDrawerKind] = useState<PipelineKind | null>(null);
  const [editing, setEditing] = useState<PipelineRecord | null>(null);
  const [parentSubmission, setParentSubmission] = useState<Submission | null>(null);
  /** The record awaiting delete confirmation — ConfirmDialog, not window.confirm. */
  const [pendingDelete, setPendingDelete] = useState<PipelineRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/pipeline?applicationId=${encodeURIComponent(applicationId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load the pipeline");
      setRecords(data.records || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the pipeline");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => { void load(); }, [load]);

  const submissions = useMemo(
    () => records.filter((r): r is Submission => r.kind === "submission"),
    [records],
  );

  /** Interviews and placements that belong to no submission — shown on their own. */
  const unattached = useMemo(
    () => records.filter((r) => r.kind !== "submission" && !r.submissionId),
    [records],
  );

  const childrenOf = useCallback(
    (submissionId: string) => ({
      interviews: records.filter((r): r is Interview => r.kind === "interview" && r.submissionId === submissionId),
      placement: records.find((r): r is Placement => r.kind === "placement" && r.submissionId === submissionId),
    }),
    [records],
  );

  const openCreate = (kind: PipelineKind, submission?: Submission) => {
    setEditing(null);
    setParentSubmission(submission || null);
    setDrawerKind(kind);
  };

  const openEdit = (record: PipelineRecord) => {
    setEditing(record);
    setParentSubmission(
      record.submissionId ? submissions.find((s) => s.id === record.submissionId) || null : null,
    );
    setDrawerKind(record.kind);
  };

  const handleDelete = async () => {
    const record = pendingDelete;
    if (!record) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/pipeline/${record.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Delete failed");
      }
      toast.success(`${KIND_META[record.kind].label} deleted`);
      setPendingDelete(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <AdminCard className="overflow-hidden">
        <AdminCardHeader
          icon={IconPipeline}
          title="Pipeline"
          tone="blue"
          count={records.length || undefined}
          action={
            <div className="flex flex-none items-center gap-2">
              <PanelAction icon={IconSend} label="Submission" onClick={() => openCreate("submission")} />
              <PanelAction icon={IconInterview} label="Interview" onClick={() => openCreate("interview")} />
            </div>
          }
        />

        {loading ? (
          <div className="flex items-center justify-center px-5 py-10">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--adm-accent)]" />
          </div>
        ) : error ? (
          <p role="alert" className="mx-5 my-4 flex items-start gap-2 rounded-[6px] border border-[var(--adm-danger-soft)] bg-[var(--adm-danger-soft)] px-3 py-2.5 text-[13px] text-[var(--adm-danger)]">
            <IconWarning className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
            {error}
          </p>
        ) : records.length === 0 ? (
          <EmptyState
            icon={IconSend}
            tone="blue"
            title="Nothing submitted yet"
            description="Record a submission to track where this candidate has been sent, what rate went out, and what came back."
            action={
              <WorkspaceButton variant="primary" onClick={() => openCreate("submission")}>
                <Plus className="h-4 w-4" /> Record submission
              </WorkspaceButton>
            }
          />
        ) : (
          <div className="divide-y divide-[var(--adm-line-soft)]">
            {submissions.map((submission) => {
              const { interviews, placement } = childrenOf(submission.id);
              return (
                <SubmissionRow
                  key={submission.id}
                  submission={submission}
                  interviews={interviews}
                  placement={placement}
                  onAddInterview={() => openCreate("interview", submission)}
                  onAddPlacement={() => openCreate("placement", submission)}
                  onEdit={openEdit}
                  onDelete={setPendingDelete}
                />
              );
            })}

            {unattached.length > 0 && (
              <div className="px-5 py-4">
                <p className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-wider text-[var(--adm-ink-subtle)]">
                  Not tied to a submission
                </p>
                <div className="space-y-2">
                  {unattached.map((record) => (
                    <div key={record.id} className="rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] p-3">
                      {record.kind === "interview"
                        ? <InterviewLine interview={record as Interview} onEdit={openEdit} onDelete={setPendingDelete} />
                        : <PlacementLine placement={record as Placement} onEdit={openEdit} onDelete={setPendingDelete} />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AdminCard>

      <ConfirmDialog
        open={!!pendingDelete}
        tone="danger"
        title={pendingDelete ? `Delete this ${KIND_META[pendingDelete.kind].label.toLowerCase()}?` : ""}
        body={
          pendingDelete?.kind === "submission"
            ? "Any interviews and the placement recorded under this submission go with it. The candidate's stage is left as it is."
            : "This removes the record from the pipeline and from every report that counts it."
        }
        busy={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />

      {drawerKind && (
        <PipelineRecordDrawer
          open
          kind={drawerKind}
          record={editing}
          parentSubmission={parentSubmission}
          applicationId={applicationId}
          candidateName={candidateName}
          jobId={jobId}
          jobTitle={jobTitle}
          defaults={{
            clientId: defaultClientId, clientName: defaultClientName,
            vendorId: defaultVendorId, vendorName: defaultVendorName,
            billRate: defaultBillRate, payRate: defaultPayRate,
          }}
          onClose={() => { setDrawerKind(null); setEditing(null); setParentSubmission(null); }}
          onSaved={async (statusAdvancedTo) => {
            setDrawerKind(null);
            setEditing(null);
            setParentSubmission(null);
            await load();
            if (statusAdvancedTo) onStatusAdvanced?.(statusAdvancedTo);
          }}
        />
      )}
    </>
  );
}

/* ── Rows ────────────────────────────────────────────────────────────────── */

function PanelAction({
  icon: Icon, label, onClick,
}: { icon: typeof IconSend; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--adm-ink-mute)] transition-colors hover:border-[var(--adm-accent)] hover:text-[var(--adm-accent)]"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
    </button>
  );
}

function RowActions({
  record, onEdit, onDelete,
}: {
  record: PipelineRecord;
  onEdit: (r: PipelineRecord) => void;
  onDelete: (r: PipelineRecord) => void;
}) {
  return (
    <div className="flex flex-none items-center gap-1">
      <button
        type="button"
        onClick={() => onEdit(record)}
        className="rounded-[6px] px-2 py-1 text-[12px] font-semibold text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-accent)]"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => onDelete(record)}
        aria-label="Delete"
        className="rounded-[6px] p-1.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger)]"
      >
        <IconTrash className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

function SubmissionRow({
  submission, interviews, placement, onAddInterview, onAddPlacement, onEdit, onDelete,
}: {
  submission: Submission;
  interviews: Interview[];
  placement?: Placement;
  onAddInterview: () => void;
  onAddPlacement: () => void;
  onEdit: (r: PipelineRecord) => void;
  onDelete: (r: PipelineRecord) => void;
}) {
  const target = submission.clientName || submission.vendorName || "Unnamed client";
  const viaVendor = !!submission.vendorName && !!submission.clientName;

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-start gap-3">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-[6px] bg-[var(--adm-accent-soft)]">
          <IconBuilding className="h-4 w-4 text-[var(--adm-accent)]" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-semibold text-[var(--adm-ink)]">{target}</p>
            <StatusBadge tone={submissionTone(submission.status)} label={SUBMISSION_STATUS_LABELS[submission.status]} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[var(--adm-ink-subtle)]">
            <span className="inline-flex items-center gap-1">
              <IconCalendar className="h-3.5 w-3.5" aria-hidden="true" /> Sent {fmtDate(submission.occurredAt)}
            </span>
            {typeof submission.rate === "number" && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <IconMoney className="h-3.5 w-3.5" aria-hidden="true" />
                {formatRate(submission.rate, submission.rateUnit, submission.currency)}
              </span>
            )}
            {viaVendor && <span>via {submission.vendorName}</span>}
            {submission.submittedTo && (
              <span className="inline-flex items-center gap-1">
                <IconUser className="h-3.5 w-3.5" aria-hidden="true" /> {submission.submittedTo}
              </span>
            )}
            {submission.jobTitle && <span>for {submission.jobTitle}</span>}
          </p>
          {submission.rejectionReason && (
            <p className="mt-1.5 text-[12.5px] text-[var(--adm-danger)]">
              Rejected: {submission.rejectionReason}
            </p>
          )}
          {submission.notes && (
            <p className="mt-1.5 whitespace-pre-line text-[12.5px] leading-relaxed text-[var(--adm-ink-mute)]">
              {submission.notes}
            </p>
          )}
        </div>

        <RowActions record={submission} onEdit={onEdit} onDelete={onDelete} />
      </div>

      {/* Children, indented under the submission that produced them. */}
      <div className="mt-3 space-y-2 border-l border-[var(--adm-line)] pl-4 sm:ml-12">
        {interviews.map((interview) => (
          <InterviewLine key={interview.id} interview={interview} onEdit={onEdit} onDelete={onDelete} />
        ))}
        {placement && <PlacementLine placement={placement} onEdit={onEdit} onDelete={onDelete} />}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onAddInterview}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--adm-ink-subtle)] transition-colors hover:text-[var(--adm-accent)]"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Interview
          </button>
          {!placement && (
            <button
              type="button"
              onClick={onAddPlacement}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--adm-ink-subtle)] transition-colors hover:text-[var(--adm-success)]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Placement
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InterviewLine({
  interview, onEdit, onDelete,
}: {
  interview: Interview;
  onEdit: (r: PipelineRecord) => void;
  onDelete: (r: PipelineRecord) => void;
}) {
  return (
    <div className="flex flex-wrap items-start gap-2.5">
      <IconInterview className="mt-0.5 h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-semibold text-[var(--adm-ink)]">
            Round {interview.round} · {INTERVIEW_MODE_LABELS[interview.mode]}
          </p>
          <StatusBadge
            tone={interviewTone(interview.status, interview.outcome)}
            label={
              interview.status === "completed" && interview.outcome && interview.outcome !== "pending"
                ? INTERVIEW_OUTCOME_LABELS[interview.outcome]
                : INTERVIEW_STATUS_LABELS[interview.status]
            }
          />
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12px] text-[var(--adm-ink-subtle)]">
          <span>{fmtDateTime(interview.scheduledAt)}</span>
          {interview.durationMinutes ? <span>{interview.durationMinutes} min</span> : null}
          {interview.location && <span className="truncate">{interview.location}</span>}
          {interview.panel?.length ? <span>with {interview.panel.join(", ")}</span> : null}
        </p>
        {interview.feedback && (
          <p className="mt-1 whitespace-pre-line text-[12.5px] leading-relaxed text-[var(--adm-ink-mute)]">
            {interview.feedback}
          </p>
        )}
      </div>
      <RowActions record={interview} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function PlacementLine({
  placement, onEdit, onDelete,
}: {
  placement: Placement;
  onEdit: (r: PipelineRecord) => void;
  onDelete: (r: PipelineRecord) => void;
}) {
  const marginPct = grossMarginPct(placement);
  const marginAmt = grossMarginAmount(placement);

  return (
    <div className="flex flex-wrap items-start gap-2.5">
      <IconPlacement className="mt-0.5 h-4 w-4 flex-none text-[var(--adm-success)]" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-semibold text-[var(--adm-ink)]">Placement</p>
          <StatusBadge tone={placementTone(placement.status)} label={PLACEMENT_STATUS_LABELS[placement.status]} />
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12px] tabular-nums text-[var(--adm-ink-subtle)]">
          <span>{fmtDate(placement.startAt)} → {placement.endAt ? fmtDate(placement.endAt) : "open ended"}</span>
          {typeof placement.billRate === "number" && (
            <span>Bill {formatRate(placement.billRate, placement.rateUnit, placement.currency)}</span>
          )}
          {typeof placement.payRate === "number" && (
            <span>Pay {formatRate(placement.payRate, placement.rateUnit, placement.currency)}</span>
          )}
          {marginPct !== null && marginAmt !== null && (
            <span className={cn(
              "inline-flex items-center gap-1 font-semibold",
              marginPct >= 0 ? "text-[var(--adm-success)]" : "text-[var(--adm-danger)]",
            )}>
              <IconPercent className="h-3.5 w-3.5" aria-hidden="true" />
              {marginPct.toFixed(1)}% margin
              {" "}({formatRate(marginAmt, placement.rateUnit, placement.currency)})
            </span>
          )}
          {placement.poNumber && <span>PO {placement.poNumber}</span>}
        </p>
      </div>
      <RowActions record={placement} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

/* ── Drawer ──────────────────────────────────────────────────────────────── */

interface DrawerDefaults {
  clientId?: string;
  clientName?: string;
  vendorId?: string;
  vendorName?: string;
  billRate?: number;
  payRate?: number;
}

function PipelineRecordDrawer({
  open, kind, record, parentSubmission, applicationId, candidateName, jobId, jobTitle, defaults,
  onClose, onSaved,
}: {
  open: boolean;
  kind: PipelineKind;
  record: PipelineRecord | null;
  parentSubmission: Submission | null;
  applicationId: string;
  candidateName?: string;
  jobId?: string;
  jobTitle?: string;
  defaults: DrawerDefaults;
  onClose: () => void;
  onSaved: (statusAdvancedTo?: string) => void;
}) {
  const isEdit = !!record;
  const meta = KIND_META[kind];

  const [clients, setClients] = useState<Client[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Submission fields
  const sub = record?.kind === "submission" ? record : null;
  const [clientId, setClientId] = useState(sub?.clientId ?? defaults.clientId ?? "");
  const [vendorId, setVendorId] = useState(sub?.vendorId ?? defaults.vendorId ?? "");
  const [submittedTo, setSubmittedTo] = useState(sub?.submittedTo ?? "");
  const [sentAt, setSentAt] = useState(toLocalInput(sub?.occurredAt || new Date().toISOString(), true));
  const [subStatus, setSubStatus] = useState(sub?.status ?? "sent");
  const [rate, setRate] = useState(sub?.rate != null ? String(sub.rate) : defaults.billRate != null ? String(defaults.billRate) : "");
  const [rejectionReason, setRejectionReason] = useState(sub?.rejectionReason ?? "");

  // Interview fields
  const iv = record?.kind === "interview" ? record : null;
  const [round, setRound] = useState(String(iv?.round ?? 1));
  const [mode, setMode] = useState(iv?.mode ?? "video");
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(iv?.scheduledAt || new Date().toISOString()));
  const [durationMinutes, setDurationMinutes] = useState(String(iv?.durationMinutes ?? 45));
  const [location, setLocation] = useState(iv?.location ?? "");
  const [panel, setPanel] = useState((iv?.panel || []).join(", "));
  const [ivStatus, setIvStatus] = useState(iv?.status ?? "scheduled");
  const [outcome, setOutcome] = useState(iv?.outcome ?? "pending");
  const [feedback, setFeedback] = useState(iv?.feedback ?? "");

  // Placement fields
  const pl = record?.kind === "placement" ? record : null;
  const [startAt, setStartAt] = useState(toLocalInput(pl?.startAt || new Date().toISOString(), true));
  const [endAt, setEndAt] = useState(toLocalInput(pl?.endAt, true));
  const [billRate, setBillRate] = useState(
    pl?.billRate != null ? String(pl.billRate)
      : parentSubmission?.rate != null ? String(parentSubmission.rate)
        : defaults.billRate != null ? String(defaults.billRate) : "",
  );
  const [payRate, setPayRate] = useState(
    pl?.payRate != null ? String(pl.payRate) : defaults.payRate != null ? String(defaults.payRate) : "",
  );
  const [plStatus, setPlStatus] = useState(pl?.status ?? "active");
  const [poNumber, setPoNumber] = useState(pl?.poNumber ?? "");

  // Shared
  const [rateUnit, setRateUnit] = useState<RateUnit>(
    (sub?.rateUnit || pl?.rateUnit || parentSubmission?.rateUnit || "hourly") as RateUnit,
  );
  const [notes, setNotes] = useState(record?.notes ?? "");

  // Client and vendor pickers. A failure here is not fatal: the name fields fall
  // back to free text so a submission can still be recorded.
  useEffect(() => {
    if (kind !== "submission") return;
    void (async () => {
      try {
        const [c, v] = await Promise.all([
          fetch("/api/clients").then((r) => r.json()).catch(() => ({})),
          fetch("/api/vendors").then((r) => r.json()).catch(() => ({})),
        ]);
        setClients(c.clients || []);
        setVendors(v.vendors || []);
      } catch { /* pickers stay empty */ }
    })();
  }, [kind]);

  const livePreview = useMemo(() => {
    const bill = Number(billRate);
    const pay = Number(payRate);
    if (!billRate || !payRate || Number.isNaN(bill) || Number.isNaN(pay) || bill <= 0) return null;
    const pct = grossMarginPct({ billRate: bill, payRate: pay });
    if (pct === null) return null;
    return { pct, amount: bill - pay };
  }, [billRate, payRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const num = (v: string): number | undefined => {
      if (!v.trim()) return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };

    let payload: Record<string, unknown> = {
      kind, applicationId, candidateName, jobId, jobTitle,
      submissionId: parentSubmission?.id || record?.submissionId,
      notes: notes.trim() || undefined,
    };

    if (kind === "submission") {
      const client = clients.find((c) => c.id === clientId);
      const vendor = vendors.find((v) => v.id === vendorId);
      payload = {
        ...payload,
        clientId: clientId || undefined,
        clientName: client?.name || (clientId ? undefined : defaults.clientName),
        vendorId: vendorId || undefined,
        vendorName: vendor?.name || (vendorId ? undefined : defaults.vendorName),
        submittedTo: submittedTo.trim() || undefined,
        occurredAt: fromLocalInput(sentAt),
        status: subStatus,
        rate: num(rate),
        rateUnit,
        rejectionReason: subStatus === "rejected" ? rejectionReason.trim() || undefined : undefined,
      };
    } else if (kind === "interview") {
      payload = {
        ...payload,
        round: num(round) ?? 1,
        mode,
        scheduledAt: fromLocalInput(scheduledAt),
        durationMinutes: num(durationMinutes),
        location: location.trim() || undefined,
        panel: panel.split(",").map((p) => p.trim()).filter(Boolean),
        status: ivStatus,
        outcome,
        feedback: feedback.trim() || undefined,
      };
    } else {
      payload = {
        ...payload,
        startAt: fromLocalInput(startAt),
        endAt: fromLocalInput(endAt),
        billRate: num(billRate),
        payRate: num(payRate),
        rateUnit,
        status: plStatus,
        poNumber: poNumber.trim() || undefined,
      };
    }

    try {
      const res = await fetch(isEdit ? `/api/pipeline/${record!.id}` : "/api/pipeline", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      toast.success(`${meta.label} ${isEdit ? "updated" : "recorded"}`);
      onSaved(data.statusChanged ? data.status : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-[520px] p-0 flex flex-col gap-0 bg-[var(--adm-surface-sunken)]">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[var(--adm-line)] bg-[var(--adm-surface)] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-[6px] bg-[var(--adm-accent-soft)]">
              <meta.icon className="h-[18px] w-[18px] text-[var(--adm-accent)]" aria-hidden="true" />
            </span>
            <div>
              <SheetTitle className="text-[15px] font-bold text-[var(--adm-ink)]">
                {isEdit ? `Edit ${meta.label.toLowerCase()}` : `Record ${meta.label.toLowerCase()}`}
              </SheetTitle>
              <SheetDescription className="mt-0.5 text-xs text-[var(--adm-ink-subtle)]">
                {parentSubmission
                  ? `Under ${parentSubmission.clientName || parentSubmission.vendorName || "the submission"}`
                  : meta.blurb}
              </SheetDescription>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-[6px] p-1.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink-mute)]">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-[6px] border border-[var(--adm-danger)] bg-[var(--adm-danger-soft)] p-3 text-xs leading-relaxed text-[var(--adm-danger)]">
                <IconWarning className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}

            {kind === "submission" && (
              <>
                <Field label="Client" htmlFor="pl-client" helper={clients.length ? undefined : "No clients on file yet — add them under Clients."}>
                  <FormSelect id="pl-client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                    <option value="">{defaults.clientName ? `${defaults.clientName} (from the job)` : "Select…"}</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </FormSelect>
                </Field>

                <Field label="Through vendor" htmlFor="pl-vendor" helper="Leave blank when submitting to the client directly.">
                  <FormSelect id="pl-vendor" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                    <option value="">{defaults.vendorName ? `${defaults.vendorName} (from the job)` : "Direct"}</option>
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </FormSelect>
                </Field>

                <Field label="Submitted to" htmlFor="pl-to" helper="The person to chase for a response.">
                  <FormInput id="pl-to" value={submittedTo} onChange={(e) => setSubmittedTo(e.target.value)} placeholder="name or email" />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Date sent" htmlFor="pl-sent">
                    <FormInput id="pl-sent" type="date" value={sentAt} onChange={(e) => setSentAt(e.target.value)} className="tabular-nums" />
                  </Field>
                  <Field label="Status" htmlFor="pl-status">
                    <FormSelect id="pl-status" value={subStatus} onChange={(e) => setSubStatus(e.target.value as Submission["status"])}>
                      {SUBMISSION_STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>{SUBMISSION_STATUS_LABELS[s]}</option>
                      ))}
                    </FormSelect>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Rate submitted" htmlFor="pl-rate">
                    <FormInput id="pl-rate" type="number" step="0.01" min="0" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="85.00" className="tabular-nums" />
                  </Field>
                  <Field label="Per" htmlFor="pl-unit">
                    <FormSelect id="pl-unit" value={rateUnit} onChange={(e) => setRateUnit(e.target.value as RateUnit)}>
                      {RATE_UNITS.map((u) => <option key={u} value={u}>{RATE_UNIT_LABELS[u]}</option>)}
                    </FormSelect>
                  </Field>
                </div>

                {subStatus === "rejected" && (
                  <Field label="Rejection reason" htmlFor="pl-reject">
                    <FormInput id="pl-reject" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="rate too high, missing skill, position filled…" />
                  </Field>
                )}
              </>
            )}

            {kind === "interview" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Round" htmlFor="pl-round">
                    <FormInput id="pl-round" type="number" min="1" value={round} onChange={(e) => setRound(e.target.value)} className="tabular-nums" />
                  </Field>
                  <Field label="Mode" htmlFor="pl-mode">
                    <FormSelect id="pl-mode" value={mode} onChange={(e) => setMode(e.target.value as Interview["mode"])}>
                      {(Object.keys(INTERVIEW_MODE_LABELS) as Interview["mode"][]).map((m) => (
                        <option key={m} value={m}>{INTERVIEW_MODE_LABELS[m]}</option>
                      ))}
                    </FormSelect>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="When" htmlFor="pl-when">
                    <FormInput id="pl-when" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="tabular-nums" />
                  </Field>
                  <Field label="Duration (min)" htmlFor="pl-duration">
                    <FormInput id="pl-duration" type="number" min="0" step="15" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} className="tabular-nums" />
                  </Field>
                </div>

                <Field label={mode === "onsite" ? "Address" : "Meeting link"} htmlFor="pl-loc">
                  <FormInput id="pl-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={mode === "onsite" ? "office address" : "https://…"} />
                </Field>

                <Field label="Panel" htmlFor="pl-panel" helper="Comma separated.">
                  <FormInput id="pl-panel" value={panel} onChange={(e) => setPanel(e.target.value)} placeholder="Alex Reed, Dana Patel" />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Status" htmlFor="pl-ivstatus">
                    <FormSelect id="pl-ivstatus" value={ivStatus} onChange={(e) => setIvStatus(e.target.value as Interview["status"])}>
                      {INTERVIEW_STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>{INTERVIEW_STATUS_LABELS[s]}</option>
                      ))}
                    </FormSelect>
                  </Field>
                  <Field label="Outcome" htmlFor="pl-outcome">
                    <FormSelect id="pl-outcome" value={outcome} onChange={(e) => setOutcome(e.target.value as NonNullable<Interview["outcome"]>)}>
                      {(Object.keys(INTERVIEW_OUTCOME_LABELS) as NonNullable<Interview["outcome"]>[]).map((o) => (
                        <option key={o} value={o}>{INTERVIEW_OUTCOME_LABELS[o]}</option>
                      ))}
                    </FormSelect>
                  </Field>
                </div>

                <Field label="Feedback" htmlFor="pl-feedback">
                  <FormTextarea id="pl-feedback" rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="What the panel said, and what happens next…" />
                </Field>
              </>
            )}

            {kind === "placement" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Start date" htmlFor="pl-start">
                    <FormInput id="pl-start" type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="tabular-nums" />
                  </Field>
                  <Field label="End date" htmlFor="pl-end" helper="Blank for open ended.">
                    <FormInput id="pl-end" type="date" value={endAt} onChange={(e) => setEndAt(e.target.value)} className="tabular-nums" />
                  </Field>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Field label="Bill rate" htmlFor="pl-bill">
                    <FormInput id="pl-bill" type="number" step="0.01" min="0" value={billRate} onChange={(e) => setBillRate(e.target.value)} className="tabular-nums" />
                  </Field>
                  <Field label="Pay rate" htmlFor="pl-pay">
                    <FormInput id="pl-pay" type="number" step="0.01" min="0" value={payRate} onChange={(e) => setPayRate(e.target.value)} className="tabular-nums" />
                  </Field>
                  <Field label="Per" htmlFor="pl-plunit">
                    <FormSelect id="pl-plunit" value={rateUnit} onChange={(e) => setRateUnit(e.target.value as RateUnit)}>
                      {RATE_UNITS.map((u) => <option key={u} value={u}>{RATE_UNIT_LABELS[u]}</option>)}
                    </FormSelect>
                  </Field>
                </div>

                {/* Margin as it is typed: the number that decides whether the deal
                    is worth doing should not wait until after saving. */}
                {livePreview && (
                  <p className={cn(
                    "rounded-[6px] border p-3 text-[12.5px] font-semibold tabular-nums",
                    livePreview.pct >= 0
                      ? "border-[var(--adm-success-soft)] bg-[var(--adm-success-soft)] text-[var(--adm-success)]"
                      : "border-[var(--adm-danger-soft)] bg-[var(--adm-danger-soft)] text-[var(--adm-danger)]",
                  )}>
                    Gross margin {livePreview.pct.toFixed(1)}% ·{" "}
                    {formatRate(livePreview.amount, rateUnit)} per unit
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Status" htmlFor="pl-plstatus">
                    <FormSelect id="pl-plstatus" value={plStatus} onChange={(e) => setPlStatus(e.target.value as Placement["status"])}>
                      {PLACEMENT_STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>{PLACEMENT_STATUS_LABELS[s]}</option>
                      ))}
                    </FormSelect>
                  </Field>
                  <Field label="PO number" htmlFor="pl-po">
                    <FormInput id="pl-po" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="optional" />
                  </Field>
                </div>
              </>
            )}

            <Field label="Notes" htmlFor="pl-notes" helper="Visible to staff only.">
              <FormTextarea id="pl-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </div>

          <div className="flex flex-shrink-0 items-center justify-end gap-3 border-t border-[var(--adm-line)] bg-[var(--adm-surface)] px-5 py-3">
            <WorkspaceButton type="button" onClick={onClose}>Cancel</WorkspaceButton>
            <WorkspaceButton type="submit" variant="primary" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isEdit ? "Save changes" : `Record ${meta.label.toLowerCase()}`}
            </WorkspaceButton>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
