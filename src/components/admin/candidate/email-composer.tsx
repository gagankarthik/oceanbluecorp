"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { WorkspaceButton } from "@/components/admin/workspace";
import { Field, FormInput, FormSelect, FormTextarea } from "@/components/admin/forms/primitives";
import { IconCalendar, IconSend, IconWarning } from "@/components/admin/icons";
import { EMAIL_TEMPLATES, fillTemplate, unfilledPlaceholders, type TemplateVars } from "@/lib/email-templates";
import { cn } from "@/lib/utils";

const COMPANY = "Ocean Blue";
const DURATIONS = [15, 30, 45, 60, 90, 120];

/** "Tuesday, October 7, 2026 at 2:00 PM EDT" in the sender's zone. */
function fmtWhen(local: string): string {
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  });
}

export function EmailComposer({
  open,
  onOpenChange,
  applicationId,
  candidate,
  senderName,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  candidate: { name?: string; firstName?: string; email?: string; jobTitle?: string };
  senderName: string;
  onSent?: () => void;
}) {
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [invite, setInvite] = useState(false);
  const [when, setWhen] = useState("");
  const [duration, setDuration] = useState(30);
  const [where, setWhere] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTemplateId(""); setSubject(""); setBody("");
    setInvite(false); setWhen(""); setDuration(30); setWhere("");
  }, [open]);

  const vars: TemplateVars = useMemo(() => {
    const fullName = candidate.name?.trim() || "";
    return {
      firstName: candidate.firstName?.trim() || fullName.split(/\s+/)[0] || "",
      fullName,
      jobTitle: candidate.jobTitle || "",
      recruiterName: senderName,
      companyName: COMPANY,
      ...(invite && when && { interviewWhen: fmtWhen(when) }),
      ...(invite && where.trim() && { interviewWhere: where.trim() }),
    };
  }, [candidate, senderName, invite, when, where]);

  // Placeholders left in the text are filled at send time, so the invite can be set after the template.
  const finalSubject = fillTemplate(subject, vars).trim();
  const finalBody = fillTemplate(body, vars).trim();
  const unfilled = unfilledPlaceholders(`${finalSubject}\n${finalBody}`);
  const inviteInvalid = invite && (!when || Number.isNaN(new Date(when).getTime()));
  const canSend = !!finalSubject && !!finalBody && unfilled.length === 0 && !inviteInvalid && !sending && !!candidate.email;

  const pickTemplate = (id: string) => {
    setTemplateId(id);
    const t = EMAIL_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    if (/\{\{interview(When|Where)\}\}/.test(t.body)) setInvite(true);
    setSubject(fillTemplate(t.subject, vars));
    setBody(fillTemplate(t.body, vars));
  };

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: finalSubject,
          body: finalBody,
          ...(invite && {
            interview: {
              start: new Date(when).toISOString(),
              durationMinutes: duration,
              ...(where.trim() && { location: where.trim() }),
            },
          }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) throw new Error("You've sent a lot of emails in the last hour. Try again later.");
      if (!res.ok || !data.success) throw new Error(data.error || "Couldn't send the email. Try again.");
      toast.success(`Email sent to ${candidate.email}`);
      onOpenChange(false);
      onSent?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send the email. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!sending) onOpenChange(next); }}>
      <SheetContent side="right" showCloseButton={false} overlayClassName="bg-[var(--adm-scrim)]" className="flex w-full flex-col gap-0 bg-[var(--adm-surface-sunken)] p-0 sm:max-w-[600px]">
        <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-[var(--adm-line)] bg-[var(--adm-surface)] px-4 py-4">
          <div className="min-w-0">
            <SheetTitle className="truncate text-[16px] font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">
              Email {candidate.name || "candidate"}
            </SheetTitle>
            <SheetDescription className="mt-0.5 truncate text-[13px] text-[var(--adm-ink-mute)]">
              To {candidate.email || "no address on file"} · replies come to you
            </SheetDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={sending}
            aria-label="Close"
            className="grid h-8 w-8 flex-none place-items-center rounded-[6px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form
          id="email-composer"
          onSubmit={(e) => { e.preventDefault(); void send(); }}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
        >
          <Field label="Template" htmlFor="ec-template">
            <FormSelect id="ec-template" value={templateId} onChange={(e) => pickTemplate(e.target.value)}>
              <option value="">Blank message</option>
              {EMAIL_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </FormSelect>
          </Field>

          <Field label="Subject" htmlFor="ec-subject" required>
            <FormInput id="ec-subject" value={subject} maxLength={200} onChange={(e) => setSubject(e.target.value)} />
          </Field>

          <Field label="Message" htmlFor="ec-body" required>
            <FormTextarea id="ec-body" rows={12} value={body} maxLength={10_000} onChange={(e) => setBody(e.target.value)} />
          </Field>

          {unfilled.length > 0 && (
            <div role="alert" className="flex gap-2.5 rounded-[6px] border border-[var(--adm-warning)] bg-[var(--adm-warning-soft)] px-3 py-2.5 text-[13px] text-[var(--adm-warning-ink)]">
              <IconWarning className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
              <p>
                Fill in or remove {unfilled.map((p) => `{{${p}}}`).join(", ")} before sending.
                {unfilled.some((p) => p.startsWith("interview")) && !invite && " Attaching an interview invite fills the interview details."}
              </p>
            </div>
          )}

          <div className="rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)]">
            <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5">
              <input
                type="checkbox"
                checked={invite}
                onChange={(e) => setInvite(e.target.checked)}
                className="h-4 w-4 accent-[var(--adm-accent)]"
              />
              <IconCalendar className="h-4 w-4 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
              <span className="text-[14px] font-medium text-[var(--adm-ink)]">Attach interview invite</span>
            </label>
            {invite && (
              <div className="grid grid-cols-1 gap-3 border-t border-[var(--adm-line-soft)] p-3 sm:grid-cols-[1fr_140px]">
                <Field label="Starts" htmlFor="ec-when" required error={when && inviteInvalid ? "Enter a valid date and time" : undefined}>
                  <FormInput id="ec-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="tabular-nums" />
                </Field>
                <Field label="Length" htmlFor="ec-duration">
                  <FormSelect id="ec-duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                    {DURATIONS.map((m) => <option key={m} value={m}>{m} min</option>)}
                  </FormSelect>
                </Field>
                <Field label="Location or link" htmlFor="ec-where" fullWidth className="sm:col-span-2">
                  <FormInput id="ec-where" value={where} maxLength={500} onChange={(e) => setWhere(e.target.value)} placeholder="Office address or https://…" />
                </Field>
              </div>
            )}
          </div>
        </form>

        <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[var(--adm-line)] bg-[var(--adm-surface)] px-4 py-3">
          <a
            href={candidate.email ? `mailto:${candidate.email}` : undefined}
            className={cn(
              "text-[13px] text-[var(--adm-ink-mute)] underline-offset-4 hover:text-[var(--adm-ink)] hover:underline",
              !candidate.email && "pointer-events-none opacity-50",
            )}
          >
            Open in my mail app
          </a>
          <div className="flex items-center gap-2">
            <WorkspaceButton variant="ghost" onClick={() => onOpenChange(false)} disabled={sending}>Cancel</WorkspaceButton>
            <WorkspaceButton type="submit" form="email-composer" variant="primary" disabled={!canSend}>
              {sending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <IconSend aria-hidden="true" />}
              {sending ? "Sending…" : "Send"}
            </WorkspaceButton>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
