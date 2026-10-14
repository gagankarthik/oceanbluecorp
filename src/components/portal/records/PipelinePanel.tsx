"use client";

/**
 * One candidate's pipeline as a spine: a submission goes out, interviews hang
 * off it, a placement closes it. Interviews and placements recorded without a
 * submission (a direct hire, a rehire) are grouped on their own.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Client, Interview, PipelineKind, PipelineRecord, Placement, RateUnit, Submission, Vendor } from "@/lib/aws/dynamodb";
import { buildIcs } from "@/lib/ics";
import { fmtDate, fmtDateTime } from "@/lib/format";
import {
  SUBMISSION_STATUS_LABELS, SUBMISSION_STATUS_ORDER, submissionTone,
  INTERVIEW_STATUS_LABELS, INTERVIEW_STATUS_ORDER, INTERVIEW_MODE_LABELS, INTERVIEW_OUTCOME_LABELS, interviewTone,
  PLACEMENT_STATUS_LABELS, PLACEMENT_STATUS_ORDER, placementTone,
  RATE_UNIT_LABELS, formatRate, grossMarginAmount, grossMarginPct,
} from "@/lib/pipeline-records";
import { Badge, Button, ConfirmDialog, Drawer, EmptyState, ErrorState, Panel, Skeleton, type Tone } from "@/components/portal/kit";
import {
  Field, FormBanner, MarginPreview, MoneyInput, NativeSelect, PartnerPicker, RateInput, TextArea, TextInput, moneyValue,
} from "@/components/portal/fields";
import Icon, { type IconName } from "@/components/portal/icons";
import { useToast } from "@/components/portal/toast";
import { ActionMenu } from "./Menu";

type LegacyTone = ReturnType<typeof submissionTone>;
const TONE: Record<LegacyTone, Tone> = { sky: "cyan", blue: "blue", indigo: "blue", violet: "blue", emerald: "green", amber: "amber", rose: "red", slate: "grey" };
/** pipeline-records tones → kit badge tones. */
export const kitTone = (t: LegacyTone): Tone => TONE[t] ?? "grey";

const KIND_META: Record<PipelineKind, { label: string; icon: IconName; blurb: string }> = {
  submission: { label: "Submission", icon: "send", blurb: "Sent to a client or vendor" },
  interview: { label: "Interview", icon: "calendar", blurb: "Scheduled or completed" },
  placement: { label: "Placement", icon: "award", blurb: "Started on assignment" },
};

/** ISO → the value a date / datetime-local input expects, in local time. */
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
  /** Bump to re-read the records, e.g. after the record page saved one. */
  refreshKey?: number;
}

export function PipelinePanel({
  applicationId, candidateName, jobId, jobTitle,
  defaultClientId, defaultClientName, defaultVendorId, defaultVendorName, defaultBillRate, defaultPayRate,
  onStatusAdvanced, refreshKey,
}: PipelinePanelProps) {
  const notify = useToast();
  const [records, setRecords] = useState<PipelineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drawerKind, setDrawerKind] = useState<PipelineKind | null>(null);
  const [editing, setEditing] = useState<PipelineRecord | null>(null);
  const [parentSubmission, setParentSubmission] = useState<Submission | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PipelineRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
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

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const submissions = useMemo(() => records.filter((r): r is Submission => r.kind === "submission"), [records]);
  const unattached = useMemo(() => records.filter((r) => r.kind !== "submission" && !r.submissionId), [records]);
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
    setParentSubmission(record.submissionId ? submissions.find((s) => s.id === record.submissionId) || null : null);
    setDrawerKind(record.kind);
  };

  const closeDrawer = () => {
    setDrawerKind(null);
    setEditing(null);
    setParentSubmission(null);
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
      notify(`${KIND_META[record.kind].label} deleted`);
      setPendingDelete(null);
      await load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Delete failed", { tone: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const rowProps = { onEdit: openEdit, onDelete: setPendingDelete };
  const first = loading && records.length === 0;

  return (
    <>
      <Panel
        padded={false}
        title={
          <>
            Pipeline
            {records.length > 0 && <span className="ml-2 text-adm-base font-medium tabular-nums text-mist-600">{records.length}</span>}
          </>
        }
        description="Submissions, interviews and the placement"
        action={
          !first && !error && records.length > 0 && (
            <>
              <Button size="sm" variant="secondary" icon="send" onClick={() => openCreate("submission")}>
                Submission
              </Button>
              <Button size="sm" variant="secondary" icon="calendar" onClick={() => openCreate("interview")}>
                Interview
              </Button>
            </>
          )
        }
      >
        {first ? (
          <ul role="status" aria-label="Loading pipeline" className="divide-y divide-mist-100">
            {Array.from({ length: 2 }, (_, i) => (
              <li key={i} className="flex items-start gap-3 px-5 py-4">
                <Skeleton className="size-9 shrink-0 rounded-lg" />
                <span className="grid flex-1 gap-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-64 max-w-full" />
                </span>
                <Skeleton className="h-8 w-16 rounded-lg" />
              </li>
            ))}
          </ul>
        ) : error ? (
          <ErrorState framed={false} title="Couldn't load the pipeline" message={error} onRetry={() => void load()} retrying={loading} />
        ) : records.length === 0 ? (
          <EmptyState
            compact
            variant="first-use"
            icon="send"
            title="Nothing submitted yet"
            body="Record a submission to track where this candidate has been sent, what rate went out, and what came back."
            primary={{ label: "Record submission", icon: "send", onClick: () => openCreate("submission") }}
            secondary={{ label: "Record interview", icon: "calendar", onClick: () => openCreate("interview") }}
          />
        ) : (
          <div className="divide-y divide-mist-100">
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
                  {...rowProps}
                />
              );
            })}
            {unattached.length > 0 && (
              <div className="px-5 py-4">
                <p className="mb-3 text-adm-xs font-semibold text-mist-600">Not tied to a submission</p>
                <div className="grid gap-3">
                  {unattached.map((record) =>
                    record.kind === "interview" ? (
                      <InterviewLine key={record.id} interview={record as Interview} {...rowProps} />
                    ) : (
                      <PlacementLine key={record.id} placement={record as Placement} {...rowProps} />
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Panel>

      {pendingDelete && (
        <ConfirmDialog
          title={`Delete this ${KIND_META[pendingDelete.kind].label.toLowerCase()}?`}
          body={
            pendingDelete.kind === "submission"
              ? "Any interviews and the placement recorded under this submission go with it. The candidate's stage is left as it is."
              : "This removes the record from the pipeline and from every report that counts it."
          }
          confirmLabel="Delete"
          busy={deleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {drawerKind && (
        <PipelineRecordDrawer
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
          onClose={closeDrawer}
          onSaved={async (statusAdvancedTo) => {
            closeDrawer();
            await load();
            if (statusAdvancedTo) onStatusAdvanced?.(statusAdvancedTo);
          }}
        />
      )}
    </>
  );
}

/** Builds the invite in the browser; nothing is sent to the candidate. */
function downloadInterviewIcs(interview: Interview, onError: (m: string) => void) {
  const start = new Date(interview.scheduledAt);
  if (Number.isNaN(start.getTime())) {
    onError("This interview has no valid date");
    return;
  }
  const who = interview.candidateName || "Candidate";
  const ics = buildIcs({
    uid: `${interview.id}@oceanbluecorp.com`,
    start,
    durationMinutes: interview.durationMinutes || 30,
    title: `Interview: ${who}${interview.jobTitle ? ` (${interview.jobTitle})` : ""}`,
    description: `Round ${interview.round}, ${INTERVIEW_MODE_LABELS[interview.mode]}${interview.panel?.length ? `. Panel: ${interview.panel.join(", ")}` : ""}`,
    location: interview.location,
    url: /^https?:\/\//.test(interview.location || "") ? interview.location : undefined,
  });
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `interview-${who.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "candidate"}-round-${interview.round}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ── Rows ── */

type RowHandlers = { onEdit: (r: PipelineRecord) => void; onDelete: (r: PipelineRecord) => void };

function RowActions({ record, onEdit, onDelete, extra }: RowHandlers & { record: PipelineRecord; extra?: { label: string; icon: IconName; onSelect: () => void } }) {
  const noun = KIND_META[record.kind].label.toLowerCase();
  return (
    <span className="-my-1 flex shrink-0 items-center gap-1">
      <Button size="sm" variant="ghost" onClick={() => onEdit(record)}>
        Edit
      </Button>
      <ActionMenu
        label={`More actions for this ${noun}`}
        width="w-56"
        items={[...(extra ? [extra] : []), { label: `Delete ${noun}`, icon: "trash", danger: true, onSelect: () => onDelete(record) }]}
      />
    </span>
  );
}

function Meta({ items }: { items: (React.ReactNode | false | null | undefined)[] }) {
  const shown = items.filter(Boolean);
  if (!shown.length) return null;
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-adm-base text-mist-600">
      {shown.map((it, i) => (
        <span key={i} className="inline-flex min-w-0 items-center gap-1.5">
          {it}
        </span>
      ))}
    </p>
  );
}

function Glyph({ name, tone = "grey" }: { name: IconName; tone?: "grey" | "green" }) {
  return (
    <span aria-hidden className={`hidden size-9 shrink-0 place-items-center rounded-lg sm:grid ${tone === "green" ? "bg-status-success-soft text-status-success" : "bg-mist-100 text-mist-600"}`}>
      <Icon name={name} className="size-5" />
    </span>
  );
}

function SubmissionRow({
  submission, interviews, placement, onAddInterview, onAddPlacement, onEdit, onDelete,
}: RowHandlers & {
  submission: Submission;
  interviews: Interview[];
  placement?: Placement;
  onAddInterview: () => void;
  onAddPlacement: () => void;
}) {
  const target = submission.clientName || submission.vendorName || "Unnamed client";
  const viaVendor = !!submission.vendorName && !!submission.clientName;
  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-3">
        <Glyph name="building" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 truncate text-adm-base font-semibold text-navy-900">{target}</p>
            <Badge tone={kitTone(submissionTone(submission.status))} dot>
              {SUBMISSION_STATUS_LABELS[submission.status]}
            </Badge>
          </div>
          <Meta
            items={[
              <span key="d" className="tabular-nums">Sent {fmtDate(submission.occurredAt)}</span>,
              typeof submission.rate === "number" && <span className="font-medium tabular-nums text-navy-900">{formatRate(submission.rate, submission.rateUnit, submission.currency)}</span>,
              viaVendor && `via ${submission.vendorName}`,
              submission.submittedTo && `To ${submission.submittedTo}`,
              submission.jobTitle && `for ${submission.jobTitle}`,
            ]}
          />
          {submission.rejectionReason && <p className="mt-1.5 text-adm-base text-status-danger">Rejected: {submission.rejectionReason}</p>}
          {submission.notes && <p className="mt-1.5 whitespace-pre-line text-adm-base leading-normal text-mist-700">{submission.notes}</p>}
        </div>
        <RowActions record={submission} onEdit={onEdit} onDelete={onDelete} />
      </div>

      {/* Children hang off a rule running down from the submission. */}
      <div className="ml-1 mt-3 grid gap-3 border-l-2 border-mist-200 pl-4 sm:ml-[18px] sm:pl-5">
        {interviews.map((interview) => (
          <InterviewLine key={interview.id} interview={interview} onEdit={onEdit} onDelete={onDelete} />
        ))}
        {placement && <PlacementLine placement={placement} onEdit={onEdit} onDelete={onDelete} />}
        <div className="-ml-2 flex flex-wrap items-center gap-1">
          <Button size="sm" variant="ghost" icon="plus" onClick={onAddInterview}>
            Interview
          </Button>
          {!placement && (
            <Button size="sm" variant="ghost" icon="plus" onClick={onAddPlacement}>
              Placement
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function InterviewLine({ interview, onEdit, onDelete }: RowHandlers & { interview: Interview }) {
  const notify = useToast();
  const label =
    interview.status === "completed" && interview.outcome && interview.outcome !== "pending"
      ? INTERVIEW_OUTCOME_LABELS[interview.outcome]
      : INTERVIEW_STATUS_LABELS[interview.status];
  return (
    <div className="flex items-start gap-3">
      <Glyph name="calendar" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-adm-base font-semibold text-navy-900">
            Round {interview.round} · {INTERVIEW_MODE_LABELS[interview.mode]}
          </p>
          <Badge tone={kitTone(interviewTone(interview.status, interview.outcome))} dot>
            {label}
          </Badge>
        </div>
        <Meta
          items={[
            <span key="w" className="tabular-nums">{fmtDateTime(interview.scheduledAt)}</span>,
            !!interview.durationMinutes && `${interview.durationMinutes} min`,
            interview.location && <span className="max-w-full truncate">{interview.location}</span>,
            !!interview.panel?.length && `with ${interview.panel.join(", ")}`,
          ]}
        />
        {interview.feedback && <p className="mt-1.5 whitespace-pre-line text-adm-base leading-normal text-mist-700">{interview.feedback}</p>}
      </div>
      <RowActions
        record={interview}
        onEdit={onEdit}
        onDelete={onDelete}
        extra={interview.status !== "cancelled" ? { label: "Download invite (.ics)", icon: "download", onSelect: () => downloadInterviewIcs(interview, (m) => notify(m, { tone: "error" })) } : undefined}
      />
    </div>
  );
}

function PlacementLine({ placement, onEdit, onDelete }: RowHandlers & { placement: Placement }) {
  const marginPct = grossMarginPct(placement);
  const marginAmt = grossMarginAmount(placement);
  return (
    <div className="flex items-start gap-3">
      <Glyph name="award" tone="green" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-adm-base font-semibold text-navy-900">Placement</p>
          <Badge tone={kitTone(placementTone(placement.status))} dot>
            {PLACEMENT_STATUS_LABELS[placement.status]}
          </Badge>
        </div>
        <Meta
          items={[
            <span key="r" className="tabular-nums">{fmtDate(placement.startAt)} to {placement.endAt ? fmtDate(placement.endAt) : "open ended"}</span>,
            typeof placement.billRate === "number" && <span className="tabular-nums">Bill {formatRate(placement.billRate, placement.rateUnit, placement.currency)}</span>,
            typeof placement.payRate === "number" && <span className="tabular-nums">Pay {formatRate(placement.payRate, placement.rateUnit, placement.currency)}</span>,
            marginPct !== null && marginAmt !== null && (
              <span className={`font-semibold tabular-nums ${marginPct >= 0 ? "text-status-success" : "text-status-danger"}`}>
                {marginPct.toFixed(1)}% margin ({formatRate(marginAmt, placement.rateUnit, placement.currency)})
              </span>
            ),
            placement.poNumber && `PO ${placement.poNumber}`,
          ]}
        />
      </div>
      <RowActions record={placement} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

/* ── Record editor ── */

export interface DrawerDefaults {
  clientId?: string;
  clientName?: string;
  vendorId?: string;
  vendorName?: string;
  billRate?: number;
  payRate?: number;
}

interface EditorValues {
  clientId: string;
  vendorId: string;
  submittedTo: string;
  sentAt: string;
  subStatus: Submission["status"];
  rate: string;
  rejectionReason: string;
  round: string;
  mode: Interview["mode"];
  scheduledAt: string;
  durationMinutes: string;
  location: string;
  panel: string;
  ivStatus: Interview["status"];
  outcome: NonNullable<Interview["outcome"]>;
  feedback: string;
  startAt: string;
  endAt: string;
  billRate: string;
  payRate: string;
  plStatus: Placement["status"];
  poNumber: string;
  rateUnit: RateUnit;
  notes: string;
}

const str = (n: number | null | undefined) => (n != null ? String(n) : "");

function initialValues(record: PipelineRecord | null, parent: Submission | null, defaults: DrawerDefaults): EditorValues {
  const sub = record?.kind === "submission" ? record : null;
  const iv = record?.kind === "interview" ? record : null;
  const pl = record?.kind === "placement" ? record : null;
  const now = new Date().toISOString();
  return {
    clientId: sub?.clientId ?? defaults.clientId ?? "",
    vendorId: sub?.vendorId ?? defaults.vendorId ?? "",
    submittedTo: sub?.submittedTo ?? "",
    sentAt: toLocalInput(sub?.occurredAt || now, true),
    subStatus: sub?.status ?? "sent",
    rate: sub?.rate != null ? String(sub.rate) : str(defaults.billRate),
    rejectionReason: sub?.rejectionReason ?? "",
    round: String(iv?.round ?? 1),
    mode: iv?.mode ?? "video",
    scheduledAt: toLocalInput(iv?.scheduledAt || now),
    durationMinutes: String(iv?.durationMinutes ?? 45),
    location: iv?.location ?? "",
    panel: (iv?.panel || []).join(", "),
    ivStatus: iv?.status ?? "scheduled",
    outcome: iv?.outcome ?? "pending",
    feedback: iv?.feedback ?? "",
    startAt: toLocalInput(pl?.startAt || now, true),
    endAt: toLocalInput(pl?.endAt, true),
    billRate: pl?.billRate != null ? String(pl.billRate) : parent?.rate != null ? String(parent.rate) : str(defaults.billRate),
    payRate: pl?.payRate != null ? String(pl.payRate) : str(defaults.payRate),
    plStatus: pl?.status ?? "active",
    poNumber: pl?.poNumber ?? "",
    rateUnit: (sub?.rateUnit || pl?.rateUnit || parent?.rateUnit || "hourly") as RateUnit,
    notes: record?.notes ?? "",
  };
}

const FORM_ID = "pipeline-record-form";

export function PipelineRecordDrawer({
  kind, record, parentSubmission, applicationId, candidateName, jobId, jobTitle, defaults, onClose, onSaved,
}: {
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
  const notify = useToast();
  const isEdit = !!record;
  const meta = KIND_META[kind];
  const noun = meta.label.toLowerCase();

  const [clients, setClients] = useState<Client[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [initial] = useState(() => initialValues(record, parentSubmission, defaults));
  const [values, setValues] = useState(initial);
  const set = <K extends keyof EditorValues>(key: K, value: EditorValues[K]) => setValues((prev) => ({ ...prev, [key]: value }));
  const v = values;

  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const requestClose = () => {
    if (saving) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  // Pickers only; a failure leaves them on the job's defaults so a submission can still be recorded.
  useEffect(() => {
    if (kind !== "submission") return;
    void (async () => {
      try {
        const [c, vd] = await Promise.all([
          fetch("/api/clients").then((r) => r.json()).catch(() => ({})),
          fetch("/api/vendors").then((r) => r.json()).catch(() => ({})),
        ]);
        setClients(c.clients || []);
        setVendors(vd.vendors || []);
      } catch { /* pickers stay empty */ }
    })();
  }, [kind]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);

    const num = (s: string): number | undefined => {
      if (!s.trim()) return undefined;
      const n = Number(s);
      return Number.isFinite(n) ? n : undefined;
    };

    let payload: Record<string, unknown> = {
      kind, applicationId, candidateName, jobId, jobTitle,
      submissionId: parentSubmission?.id || record?.submissionId,
      notes: v.notes.trim() || undefined,
    };

    if (kind === "submission") {
      const client = clients.find((c) => c.id === v.clientId);
      const vendor = vendors.find((x) => x.id === v.vendorId);
      payload = {
        ...payload,
        clientId: v.clientId || undefined,
        clientName: client?.name || (v.clientId ? undefined : defaults.clientName),
        vendorId: v.vendorId || undefined,
        vendorName: vendor?.name || (v.vendorId ? undefined : defaults.vendorName),
        submittedTo: v.submittedTo.trim() || undefined,
        occurredAt: fromLocalInput(v.sentAt),
        status: v.subStatus,
        rate: moneyValue(v.rate),
        rateUnit: v.rateUnit,
        rejectionReason: v.subStatus === "rejected" ? v.rejectionReason.trim() || undefined : undefined,
      };
    } else if (kind === "interview") {
      payload = {
        ...payload,
        round: num(v.round) ?? 1,
        mode: v.mode,
        scheduledAt: fromLocalInput(v.scheduledAt),
        durationMinutes: num(v.durationMinutes),
        location: v.location.trim() || undefined,
        panel: v.panel.split(",").map((p) => p.trim()).filter(Boolean),
        status: v.ivStatus,
        outcome: v.outcome,
        feedback: v.feedback.trim() || undefined,
      };
    } else {
      payload = {
        ...payload,
        startAt: fromLocalInput(v.startAt),
        endAt: fromLocalInput(v.endAt),
        billRate: moneyValue(v.billRate),
        payRate: moneyValue(v.payRate),
        rateUnit: v.rateUnit,
        status: v.plStatus,
        poNumber: v.poNumber.trim() || undefined,
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
      notify(`${meta.label} ${isEdit ? "updated" : "recorded"}`);
      onSaved(data.statusChanged ? data.status : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const under = parentSubmission ? `Under ${parentSubmission.clientName || parentSubmission.vendorName || "the submission"}` : meta.blurb;

  return (
    <>
      <Drawer
        title={isEdit ? `Edit ${noun}` : `Record ${noun}`}
        onClose={requestClose}
        footer={
          <>
            <Button variant="ghost" onClick={requestClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form={FORM_ID} icon="check" loading={saving}>
              {isEdit ? "Save changes" : `Record ${noun}`}
            </Button>
          </>
        }
      >
        <form id={FORM_ID} noValidate onSubmit={handleSubmit} className="grid gap-5">
          <p className="-mt-1 flex items-center gap-2 text-adm-base text-mist-600">
            <Icon name={meta.icon} className="size-4 shrink-0 text-mist-500" />
            <span className="min-w-0 truncate">{under}</span>
          </p>
          <FormBanner message={error} onDismiss={() => setError(null)} />

          {kind === "submission" && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Client" htmlFor="pl-client" helper={clients.length ? undefined : "No clients on file yet. Add them under Clients."}>
                  <PartnerPicker
                    id="pl-client"
                    kind="client"
                    items={clients}
                    value={v.clientId}
                    onChange={(id) => set("clientId", id)}
                    noneLabel={defaults.clientName ? `${defaults.clientName} (from the job)` : "Select…"}
                  />
                </Field>
                <Field label="Through vendor" htmlFor="pl-vendor" helper="Blank when submitting to the client directly.">
                  <PartnerPicker
                    id="pl-vendor"
                    kind="vendor"
                    items={vendors}
                    value={v.vendorId}
                    onChange={(id) => set("vendorId", id)}
                    noneLabel={defaults.vendorName ? `${defaults.vendorName} (from the job)` : "Direct"}
                  />
                </Field>
              </div>
              <Field label="Submitted to" htmlFor="pl-to" optional helper="The person to chase for a response.">
                <TextInput id="pl-to" value={v.submittedTo} onChange={(e) => set("submittedTo", e.target.value)} placeholder="Name or email" />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Date sent" htmlFor="pl-sent">
                  <TextInput id="pl-sent" type="date" value={v.sentAt} onChange={(e) => set("sentAt", e.target.value)} className="tabular-nums" />
                </Field>
                <Field label="Status" htmlFor="pl-status">
                  <NativeSelect id="pl-status" value={v.subStatus} onChange={(e) => set("subStatus", e.target.value as Submission["status"])}>
                    {SUBMISSION_STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {SUBMISSION_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
              <RateInput id="pl-rate" label="Rate submitted" amount={v.rate} unit={v.rateUnit} onAmount={(a) => set("rate", a)} onUnit={(u) => set("rateUnit", u)} placeholder="85.00" />
              {v.subStatus === "rejected" && (
                <Field label="Rejection reason" htmlFor="pl-reject" optional>
                  <TextInput id="pl-reject" value={v.rejectionReason} onChange={(e) => set("rejectionReason", e.target.value)} placeholder="Rate too high, missing skill, position filled…" />
                </Field>
              )}
            </>
          )}

          {kind === "interview" && (
            <>
              <div className="grid grid-cols-2 gap-5">
                <Field label="Round" htmlFor="pl-round">
                  <TextInput id="pl-round" type="number" inputMode="numeric" min="1" value={v.round} onChange={(e) => set("round", e.target.value)} className="tabular-nums" />
                </Field>
                <Field label="Mode" htmlFor="pl-mode">
                  <NativeSelect id="pl-mode" value={v.mode} onChange={(e) => set("mode", e.target.value as Interview["mode"])}>
                    {(Object.keys(INTERVIEW_MODE_LABELS) as Interview["mode"][]).map((m) => (
                      <option key={m} value={m}>
                        {INTERVIEW_MODE_LABELS[m]}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_10rem]">
                <Field label="When" htmlFor="pl-when">
                  <TextInput id="pl-when" type="datetime-local" value={v.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} className="tabular-nums" />
                </Field>
                <Field label="Duration (min)" htmlFor="pl-duration">
                  <TextInput id="pl-duration" type="number" inputMode="numeric" min="0" step="15" value={v.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} className="tabular-nums" />
                </Field>
              </div>
              <Field label={v.mode === "onsite" ? "Address" : "Meeting link"} htmlFor="pl-loc" optional>
                <TextInput id="pl-loc" value={v.location} onChange={(e) => set("location", e.target.value)} placeholder={v.mode === "onsite" ? "Office address" : "https://…"} />
              </Field>
              <Field label="Panel" htmlFor="pl-panel" optional helper="Separate names with commas.">
                <TextInput id="pl-panel" value={v.panel} onChange={(e) => set("panel", e.target.value)} placeholder="Alex Reed, Dana Patel" />
              </Field>
              <div className="grid grid-cols-2 gap-5">
                <Field label="Status" htmlFor="pl-ivstatus">
                  <NativeSelect id="pl-ivstatus" value={v.ivStatus} onChange={(e) => set("ivStatus", e.target.value as Interview["status"])}>
                    {INTERVIEW_STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {INTERVIEW_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Outcome" htmlFor="pl-outcome">
                  <NativeSelect id="pl-outcome" value={v.outcome} onChange={(e) => set("outcome", e.target.value as NonNullable<Interview["outcome"]>)}>
                    {(Object.keys(INTERVIEW_OUTCOME_LABELS) as NonNullable<Interview["outcome"]>[]).map((o) => (
                      <option key={o} value={o}>
                        {INTERVIEW_OUTCOME_LABELS[o]}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
              <Field label="Feedback" htmlFor="pl-feedback" optional>
                <TextArea id="pl-feedback" rows={4} value={v.feedback} onChange={(e) => set("feedback", e.target.value)} placeholder="What the panel said, and what happens next…" />
              </Field>
            </>
          )}

          {kind === "placement" && (
            <>
              <div className="grid grid-cols-2 gap-5">
                <Field label="Start date" htmlFor="pl-start">
                  <TextInput id="pl-start" type="date" value={v.startAt} onChange={(e) => set("startAt", e.target.value)} className="tabular-nums" />
                </Field>
                <Field label="End date" htmlFor="pl-end" helper="Blank for open ended.">
                  <TextInput id="pl-end" type="date" value={v.endAt} onChange={(e) => set("endAt", e.target.value)} className="tabular-nums" />
                </Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <RateInput id="pl-bill" label="Bill rate" amount={v.billRate} unit={v.rateUnit} onAmount={(a) => set("billRate", a)} onUnit={(u) => set("rateUnit", u)} />
                <Field label="Pay rate" htmlFor="pl-pay">
                  <MoneyInput id="pl-pay" value={v.payRate} onChange={(e) => set("payRate", e.target.value)} suffix={RATE_UNIT_LABELS[v.rateUnit]} />
                </Field>
              </div>
              {/* Margin as it is typed: the number that decides the deal shouldn't wait for Save. */}
              <MarginPreview bill={v.billRate} pay={v.payRate} unit={v.rateUnit} />
              <div className="grid grid-cols-2 gap-5">
                <Field label="Status" htmlFor="pl-plstatus">
                  <NativeSelect id="pl-plstatus" value={v.plStatus} onChange={(e) => set("plStatus", e.target.value as Placement["status"])}>
                    {PLACEMENT_STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {PLACEMENT_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="PO number" htmlFor="pl-po" optional>
                  <TextInput id="pl-po" value={v.poNumber} onChange={(e) => set("poNumber", e.target.value)} />
                </Field>
              </div>
            </>
          )}

          <Field label="Notes" htmlFor="pl-notes" optional>
            <TextArea id="pl-notes" rows={3} value={v.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </form>
      </Drawer>

      {confirmDiscard && (
        <ConfirmDialog
          tone="primary"
          title="Discard your changes?"
          body={`This ${noun} hasn't been saved. Closing now loses your edits.`}
          confirmLabel="Discard"
          onConfirm={() => {
            setConfirmDiscard(false);
            onClose();
          }}
          onCancel={() => setConfirmDiscard(false)}
        />
      )}
    </>
  );
}
