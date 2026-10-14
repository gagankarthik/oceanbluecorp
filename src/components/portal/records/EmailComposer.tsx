"use client";

import { useMemo, useState } from "react";
import { EMAIL_TEMPLATES, fillTemplate, unfilledPlaceholders, type TemplateVars } from "@/lib/email-templates";
import { Button, Drawer } from "@/components/portal/kit";
import { useToast } from "@/components/portal/toast";
import { CheckRow, Field, NativeSelect, Notice, TextArea, TextInput } from "@/components/portal/fields";

const COMPANY = "Oceanblue";
const DURATIONS = [15, 30, 45, 60, 90, 120];

/** "Tuesday, October 7, 2026 at 2:00 PM EDT" in the sender's zone. */
function fmtWhen(local: string): string {
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}

/** Side sheet for one email to the candidate, with templates, an optional invite and a preview. */
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
  // Mounted only while open, so every opening starts blank.
  return open ? <Composer close={() => onOpenChange(false)} applicationId={applicationId} candidate={candidate} senderName={senderName} onSent={onSent} /> : null;
}

function Composer({
  close,
  applicationId,
  candidate,
  senderName,
  onSent,
}: {
  close: () => void;
  applicationId: string;
  candidate: { name?: string; firstName?: string; email?: string; jobTitle?: string };
  senderName: string;
  onSent?: () => void;
}) {
  const notify = useToast();
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [invite, setInvite] = useState(false);
  const [when, setWhen] = useState("");
  const [duration, setDuration] = useState(30);
  const [where, setWhere] = useState("");
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(false);

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

  // Placeholders are filled at send time, so the invite can be set after the template.
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
            interview: { start: new Date(when).toISOString(), durationMinutes: duration, ...(where.trim() && { location: where.trim() }) },
          }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) throw new Error("You've sent a lot of emails in the last hour. Try again later.");
      if (!res.ok || !data.success) throw new Error(data.error || "Couldn't send the email. Try again.");
      notify(`Email sent to ${candidate.email}`);
      close();
      onSent?.();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Couldn't send the email. Try again.", { tone: "error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Drawer
      title={`Email ${candidate.name || "candidate"}`}
      onClose={() => !sending && close()}
      footer={
        <>
          <a
            href={candidate.email ? `mailto:${candidate.email}` : undefined}
            className={`mr-auto text-adm-base text-mist-600 underline-offset-4 hover:text-navy-900 hover:underline ${candidate.email ? "" : "pointer-events-none opacity-50"}`}
          >
            Open in my mail app
          </a>
          <Button variant="ghost" onClick={close} disabled={sending}>
            Cancel
          </Button>
          <Button icon="send" loading={sending} disabled={!canSend} onClick={() => void send()}>
            Send
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="grid gap-5"
      >
        <p className="text-adm-base text-mist-600">To {candidate.email || "no address on file"} · replies come to you</p>
        <Field label="Template" htmlFor="ec-template">
          <NativeSelect id="ec-template" value={templateId} onChange={(e) => pickTemplate(e.target.value)}>
            <option value="">Blank message</option>
            {EMAIL_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Subject" required htmlFor="ec-subject">
          <TextInput id="ec-subject" value={subject} maxLength={200} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <Field label="Message" required htmlFor="ec-body" hint={body.length > 8000 ? `${body.length.toLocaleString()} / 10,000` : undefined}>
          <TextArea id="ec-body" rows={10} value={body} maxLength={10_000} onChange={(e) => setBody(e.target.value)} />
        </Field>
        {unfilled.length > 0 && (
          <Notice tone="warning" role="alert">
            Fill in or remove {unfilled.map((p) => `{{${p}}}`).join(", ")} before sending.
            {unfilled.some((p) => p.startsWith("interview")) && !invite && " Attaching an interview invite fills the interview details."}
          </Notice>
        )}
        <div className="rounded-lg ring-1 ring-inset ring-mist-200">
          <div className="px-3.5">
            <CheckRow id="ec-invite" checked={invite} onChange={setInvite} title="Attach an interview invite" description="Sends a calendar file with the email." />
          </div>
          {invite && (
            <div className="grid gap-4 border-t border-mist-200 p-3.5 sm:grid-cols-[minmax(0,1fr)_8rem]">
              <Field label="Starts" required htmlFor="ec-when" error={when && inviteInvalid ? "Enter a valid date and time." : undefined}>
                <TextInput id="ec-when" type="datetime-local" className="tabular-nums" value={when} onChange={(e) => setWhen(e.target.value)} />
              </Field>
              <Field label="Length" htmlFor="ec-duration">
                <NativeSelect id="ec-duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                  {DURATIONS.map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Location or link" htmlFor="ec-where" className="sm:col-span-2">
                <TextInput id="ec-where" value={where} maxLength={500} onChange={(e) => setWhere(e.target.value)} placeholder="Office address or https://…" />
              </Field>
            </div>
          )}
        </div>
        {(finalSubject || finalBody) && (
          <div>
            <button type="button" onClick={() => setPreview((v) => !v)} aria-expanded={preview} className="min-h-8 text-adm-base font-medium text-ocean-700 hover:underline">
              {preview ? "Hide preview" : "Preview what they receive"}
            </button>
            {preview && (
              <div className="mt-2 rounded-lg bg-mist-50 p-4 ring-1 ring-inset ring-mist-200">
                <p className="text-adm-base font-semibold text-navy-900">{finalSubject || "(no subject)"}</p>
                <p className="mt-2 whitespace-pre-wrap text-adm-base leading-normal text-mist-700">{finalBody}</p>
              </div>
            )}
          </div>
        )}
      </form>
    </Drawer>
  );
}
