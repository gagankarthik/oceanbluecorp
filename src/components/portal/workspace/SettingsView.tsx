"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useFormErrors } from "@/hooks/use-form-errors";
import { check, collectErrors, maxLen, phone, required, strongPassword, LIMITS } from "@/lib/form-validation";
import Icon, { type IconName } from "@/components/portal/icons";
import { useSession } from "@/components/portal/session";
import { Avatar, Badge, Button, ConfirmDialog, Page, PageHeader, Skeleton, Spinner, type Tone } from "@/components/portal/kit";
import { inputCls } from "@/components/portal/relationships/shared";

/** `?tab=` from older links; now only picks the card to scroll to. */
export type SettingsTab = "profile" | "security" | "system";

const ROLE_CHIP: Record<string, { label: string; tone: Tone }> = {
  admin: { label: "Administrator", tone: "navy" },
  hr: { label: "HR manager", tone: "grey" },
  recruiter: { label: "Recruiter", tone: "grey" },
  sales: { label: "Sales", tone: "grey" },
  media: { label: "Media", tone: "grey" },
};

/** Cognito wants E.164; US numbers without a country code get +1. */
export function toE164(v: string): string {
  const t = v.trim();
  if (!t) return "";
  const digits = t.replace(/\D/g, "");
  if (t.startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return t;
}

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

type Status = { tone: "ok" | "error"; text: string } | null;

function Card({ id, title, action, footer, children }: { id?: string; title?: string; action?: React.ReactNode; footer?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} aria-label={title} className="min-w-0 scroll-mt-20 rounded-xl bg-mist-0 ring-1 ring-mist-200">
      {title && (
        <header className="flex min-h-12 items-center justify-between gap-3 border-b border-mist-100 px-4 py-2.5">
          <h2 className="text-adm-base font-semibold text-navy-900">{title}</h2>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
      {footer}
    </section>
  );
}

function Field({ id, label, required: req, error, hint, children }: { id: string; label: string; required?: boolean; error?: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-adm-base font-medium text-navy-900">
        {label}
        {req && <span className="text-status-danger"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-adm-xs text-status-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-adm-xs text-mist-600">{hint}</p>
      )}
    </div>
  );
}

function StatusLine({ status }: { status: Status }) {
  if (!status) return <span aria-live="polite" />;
  const ok = status.tone === "ok";
  return (
    <p role={ok ? "status" : "alert"} className={`flex min-w-0 items-start gap-1.5 text-adm-base ${ok ? "text-status-success" : "text-status-danger"}`}>
      <Icon name={ok ? "check" : "alert"} className="mt-0.5 size-4 shrink-0" />
      <span className="min-w-0">{status.text}</span>
    </p>
  );
}

function Footer({ status, children }: { status: Status; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-mist-100 bg-mist-50 px-4 py-3">
      <div className="min-w-0 flex-1 basis-40">
        <StatusLine status={status} />
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Profile header                                                      */
/* ------------------------------------------------------------------ */

const linkBtn = "rounded text-adm-base font-medium text-ocean-700 hover:text-ocean-800 hover:underline disabled:opacity-50 disabled:no-underline";

function ProfileCard() {
  const { user } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [version, setVersion] = useState(0);
  const [failed, setFailed] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const display = user?.name || user?.email || "You";
  const chip = ROLE_CHIP[user?.role ?? ""];

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user?.id) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return setStatus({ tone: "error", text: "Choose a JPG, PNG or WebP image for your photo." });
    if (file.size > 2 * 1024 * 1024) return setStatus({ tone: "error", text: "That image is larger than 2 MB. Choose a smaller one." });
    setStatus(null);
    setBusy("upload");
    try {
      const res = await fetch(`/api/users/avatar?userId=${encodeURIComponent(user.id)}`, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Your photo could not be uploaded. Try again.");
      setFailed(false);
      setHasPhoto(true);
      setVersion(Date.now());
      setStatus({ tone: "ok", text: "Photo updated" });
    } catch (x) {
      setStatus({ tone: "error", text: x instanceof Error ? x.message : "Your photo could not be uploaded. Try again." });
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!user?.id) return;
    setStatus(null);
    setBusy("remove");
    try {
      const res = await fetch(`/api/users/avatar/${encodeURIComponent(user.id)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Your photo could not be removed. Try again.");
      }
      setHasPhoto(false);
      setFailed(true);
      setVersion(Date.now());
      setStatus({ tone: "ok", text: "Photo removed" });
    } catch (x) {
      setStatus({ tone: "error", text: x instanceof Error ? x.message : "Your photo could not be removed. Try again." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card id="settings-profile">
      <div className="flex min-w-0 items-center gap-4">
        <div className="relative size-16 shrink-0">
          {user?.id && !failed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/users/avatar/${user.id}?v=${version}`}
              alt=""
              className="size-16 rounded-full object-cover ring-1 ring-mist-200"
              onLoad={() => setHasPhoto(true)}
              onError={() => {
                setHasPhoto(false);
                setFailed(true);
              }}
            />
          ) : (
            <span className="grid size-16 place-items-center [&>*]:size-16 [&>*]:text-adm-lg">
              <Avatar name={display} size="lg" />
            </span>
          )}
          {busy && (
            <span className="absolute inset-0 grid place-items-center rounded-full bg-navy-950/40 text-white">
              <Spinner label={busy === "upload" ? "Uploading photo" : "Removing photo"} />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="min-w-0 truncate text-adm-md font-semibold text-navy-900">{display}</p>
            {chip && <Badge tone={chip.tone}>{chip.label}</Badge>}
          </div>
          <p className="truncate text-adm-base text-mist-600">{user?.email || "–"}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3">
            <button type="button" className={linkBtn} disabled={!!busy} onClick={() => input.current?.click()}>
              {hasPhoto ? "Change photo" : "Add photo"}
            </button>
            {hasPhoto && (
              <button type="button" className={linkBtn} disabled={!!busy} onClick={() => void remove()}>
                Remove
              </button>
            )}
          </div>
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" aria-label="Choose a profile photo" onChange={upload} />
        </div>
      </div>
      {status && (
        <div className="mt-3">
          <StatusLine status={status} />
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Personal details                                                    */
/* ------------------------------------------------------------------ */

function DetailsCard() {
  const { user } = useAuth();
  const split = (user?.name || "").trim().split(" ");
  const [form, setForm] = useState({ firstName: split[0] || "", lastName: split.slice(1).join(" "), phone: user?.phone || "" });
  const [base, setBase] = useState(form);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(base);

  const v = useFormErrors(() =>
    collectErrors({
      firstName: check(form.firstName, required("Enter your first name."), maxLen(LIMITS.name)),
      lastName: check(form.lastName, maxLen(LIMITS.name)),
      phone: check(form.phone, phone()),
    }),
  );

  const edit = (patch: Partial<typeof form>) => {
    setForm({ ...form, ...patch });
    if (status?.tone === "ok") setStatus(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !dirty || !v.validateAll()) return;
    setSaving(true);
    setStatus(null);
    const phoneOut = toE164(form.phone);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, name: `${form.firstName} ${form.lastName}`.trim(), phone: phoneOut }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Your profile could not be saved. Try again in a moment.");
      }
      const next = { ...form, phone: phoneOut };
      setForm(next);
      setBase(next);
      setStatus({ tone: "ok", text: "Saved" });
    } catch (x) {
      setStatus({ tone: "error", text: x instanceof Error ? x.message : "Your profile could not be saved. Try again in a moment." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} onBlur={v.revalidate} noValidate>
      <Card
        title="Personal details"
        footer={
          <Footer status={status}>
            {dirty && (
              <Button
                variant="ghost"
                disabled={saving}
                onClick={() => {
                  setForm(base);
                  v.reset();
                  setStatus(null);
                }}
              >
                Discard
              </Button>
            )}
            <Button type="submit" loading={saving} disabled={!dirty}>
              Save
            </Button>
          </Footer>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="firstName" label="First name" required error={v.errors.firstName}>
              <input id="firstName" {...v.invalidProps("firstName")} autoComplete="given-name" maxLength={LIMITS.name} value={form.firstName} onChange={(e) => edit({ firstName: e.target.value })} className={inputCls} />
            </Field>
            <Field id="lastName" label="Last name" error={v.errors.lastName}>
              <input id="lastName" {...v.invalidProps("lastName")} autoComplete="family-name" maxLength={LIMITS.name} value={form.lastName} onChange={(e) => edit({ lastName: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <Field id="phone" label="Phone" error={v.errors.phone} hint="US numbers get +1 added. Include the country code for anywhere else.">
            <input id="phone" type="tel" {...v.invalidProps("phone")} autoComplete="tel" value={form.phone} onChange={(e) => edit({ phone: e.target.value })} placeholder="+1 614 555 0100" className={inputCls} />
          </Field>
        </div>
      </Card>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Password                                                            */
/* ------------------------------------------------------------------ */

type PwKey = "currentPassword" | "newPassword" | "confirmPassword";
const EMPTY_PW: Record<PwKey, string> = { currentPassword: "", newPassword: "", confirmPassword: "" };

function PasswordCard() {
  const [form, setForm] = useState<Record<PwKey, string>>(EMPTY_PW);
  const [show, setShow] = useState<Record<PwKey, boolean>>({ currentPassword: false, newPassword: false, confirmPassword: false });
  const [serverErr, setServerErr] = useState<Partial<Record<"currentPassword" | "newPassword", string>>>({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const dirty = Object.values(form).some(Boolean);

  const v = useFormErrors(() =>
    collectErrors({
      currentPassword: check(form.currentPassword, required("Enter your current password.")) ?? serverErr.currentPassword,
      newPassword:
        check(form.newPassword, required("Choose a new password."), strongPassword()) ??
        (form.newPassword === form.currentPassword ? "Choose a password different from your current one." : serverErr.newPassword),
      confirmPassword:
        check(form.confirmPassword, required("Re-enter the new password to confirm it.")) ??
        (form.confirmPassword !== form.newPassword ? "This doesn't match the new password you entered above." : undefined),
    }),
  );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !v.validateAll()) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/users/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data.error || "Your password could not be changed. Try again in a moment.";
        if (data.field === "currentPassword" || data.field === "newPassword") {
          const field: "currentPassword" | "newPassword" = data.field;
          setServerErr({ [field]: message });
          v.setErrors((prev) => ({ ...prev, [field]: message }));
          document.getElementById(field)?.focus();
          return;
        }
        throw new Error(message);
      }
      setForm(EMPTY_PW);
      setServerErr({});
      v.reset();
      setStatus({ tone: "ok", text: "Password updated" });
    } catch (x) {
      setStatus({ tone: "error", text: x instanceof Error ? x.message : "Your password could not be changed. Try again in a moment." });
    } finally {
      setSaving(false);
    }
  };

  const input = (key: PwKey, label: string, ac: string) => (
    <Field id={key} label={label} required error={v.errors[key]}>
      <div className="relative">
        <input
          id={key}
          {...v.invalidProps(key)}
          type={show[key] ? "text" : "password"}
          autoComplete={ac}
          value={form[key]}
          onChange={(e) => {
            setForm({ ...form, [key]: e.target.value });
            if (key in serverErr) setServerErr({});
            if (status?.tone === "ok") setStatus(null);
          }}
          className={`${inputCls} pr-12`}
        />
        <button
          type="button"
          onClick={() => setShow({ ...show, [key]: !show[key] })}
          aria-label={`${show[key] ? "Hide" : "Show"} ${label.toLowerCase()}`}
          title={`${show[key] ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={show[key]}
          className="absolute bottom-0 right-0 grid size-10 place-items-center rounded-lg text-mist-500 hover:text-navy-900"
        >
          <Icon name="eye" className={`size-4 ${show[key] ? "text-ocean-700" : ""}`} />
        </button>
      </div>
    </Field>
  );

  return (
    <form onSubmit={save} onBlur={v.revalidate} noValidate>
      <Card
        id="settings-security"
        title="Password"
        footer={
          <Footer status={status}>
            <Button type="submit" loading={saving} disabled={!dirty}>
              Update password
            </Button>
          </Footer>
        }
      >
        <div className="grid gap-4">
          {input("currentPassword", "Current password", "current-password")}
          <div className="grid gap-4 sm:grid-cols-2">
            {input("newPassword", "New password", "new-password")}
            {input("confirmPassword", "Confirm new password", "new-password")}
          </div>
          <p className="text-adm-xs text-mist-600">At least 8 characters, with an uppercase letter, a lowercase letter, a number and a symbol.</p>
        </div>
      </Card>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Website status (admins)                                             */
/* ------------------------------------------------------------------ */

function WebsiteCard() {
  const { user } = useAuth();
  const [maint, setMaint] = useState({ enabled: false, message: "", eta: "" });
  const [base, setBase] = useState(maint);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [preparing, setPreparing] = useState(false);
  const [confirmOffline, setConfirmOffline] = useState(false);
  const textDirty = maint.message !== base.message || maint.eta !== base.eta;

  useEffect(() => {
    let alive = true;
    fetch("/api/content")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        const site = (d.blocks as { id: string; fields: Record<string, string> }[] | undefined)?.find((b) => b.id === "site");
        if (!alive || !site?.fields) return;
        const next = { enabled: site.fields.maintenance === "true", message: site.fields.maintenanceMessage || "", eta: site.fields.maintenanceEta || "" };
        setMaint(next);
        setBase(next);
      })
      .catch(() => alive && setLoadError(true))
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  const save = async (next: typeof maint, msg: string) => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "site",
          fields: { maintenance: next.enabled ? "true" : "false", maintenanceMessage: next.message, maintenanceEta: next.eta },
          updatedBy: user?.email,
          updatedByName: user?.name,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "The setting could not be saved. Try again.");
      }
      setMaint(next);
      setBase(next);
      setPreparing(false);
      setStatus({ tone: "ok", text: msg });
    } catch (x) {
      setStatus({ tone: "error", text: x instanceof Error ? x.message : "The setting could not be saved. Try again." });
    } finally {
      setSaving(false);
    }
  };

  const locked = !loaded || loadError || saving;
  const showFields = loaded && !loadError && (base.enabled || preparing);
  const edit = (patch: Partial<typeof maint>) => {
    setMaint({ ...maint, ...patch });
    if (status?.tone === "ok") setStatus(null);
  };

  return (
    <Card
      id="settings-system"
      title="Website status"
      action={
        loaded && !loadError ? (
          <Badge tone={base.enabled ? "amber" : "green"} dot>
            {base.enabled ? "Offline" : "Live"}
          </Badge>
        ) : undefined
      }
      footer={
        <Footer status={loadError ? { tone: "error", text: "Couldn't load the current setting. Refresh before changing it." } : status}>
          <a href="/maintenance" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-adm-base font-medium text-navy-900 hover:bg-mist-100">
            <Icon name="external" className="size-4" />
            Preview
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          {base.enabled ? (
            <>
              <Button variant="secondary" disabled={locked || !textDirty} onClick={() => void save({ ...maint, enabled: true }, "Message updated")}>
                Update message
              </Button>
              <Button loading={saving} disabled={locked} onClick={() => void save({ ...maint, enabled: false }, "The site is back online")}>
                Bring site online
              </Button>
            </>
          ) : preparing ? (
            <>
              <Button
                variant="ghost"
                disabled={saving}
                onClick={() => {
                  setMaint(base);
                  setPreparing(false);
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" loading={saving} disabled={locked} onClick={() => setConfirmOffline(true)}>
                Take site offline
              </Button>
            </>
          ) : (
            <Button variant="secondary" disabled={locked} onClick={() => setPreparing(true)}>
              Take site offline…
            </Button>
          )}
        </Footer>
      }
    >
      {!loaded ? (
        <div role="status" aria-label="Loading the website status">
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : (
        <div className="grid gap-4">
          <p className="text-adm-base text-mist-600">
            {base.enabled ? "Visitors see the maintenance screen. The portal and sign-in stay reachable." : "The public site is live. Taking it offline shows visitors a maintenance screen; the portal stays reachable."}
          </p>
          {showFields && (
            <>
              <Field id="maint-message" label="Message to visitors" hint="Optional. Leave empty for the default wording.">
                <input id="maint-message" value={maint.message} onChange={(e) => edit({ message: e.target.value })} placeholder="We are upgrading our systems and will be back shortly." disabled={locked} className={inputCls} />
              </Field>
              <Field id="maint-eta" label="Expected back" hint="Fill in for planned work. Left empty, it reads as an unexpected outage.">
                <input id="maint-eta" value={maint.eta} onChange={(e) => edit({ eta: e.target.value })} placeholder="by 3:00 PM EST" disabled={locked} className={inputCls} />
              </Field>
            </>
          )}
        </div>
      )}
      {confirmOffline && (
        <ConfirmDialog
          title="Take the public site offline?"
          body="Visitors will see the maintenance screen until you turn this off. The portal stays available."
          confirmLabel="Take site offline"
          busy={saving}
          onCancel={() => setConfirmOffline(false)}
          onConfirm={() => {
            setConfirmOffline(false);
            void save({ ...maint, enabled: true }, "The site is offline");
          }}
        />
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function SettingsView({ initialTab }: { initialTab: SettingsTab }) {
  const { user } = useAuth();
  const { signOut } = useSession();
  const isAdmin = user?.role === "admin";

  // Deep links (?tab=security) scroll to their card.
  useEffect(() => {
    if (initialTab === "profile") return;
    document.getElementById(`settings-${initialTab}`)?.scrollIntoView({ block: "start" });
  }, [initialTab, isAdmin]);

  return (
    <Page width="narrow">
      <div className="mx-auto grid w-full max-w-[40rem] min-w-0 content-start gap-4">
        <PageHeader title="Account settings" icon="settings" section="workspace" />
        <ProfileCard />
        <DetailsCard key={user?.id ?? "anon"} />
        <PasswordCard />
        {isAdmin && <WebsiteCard />}
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-adm-base text-mist-600">
          <span className="min-w-0 truncate">
            Signed in as <span className="font-medium text-navy-900">{user?.email || "–"}</span>
          </span>
          <span aria-hidden>·</span>
          <button type="button" onClick={signOut} className="inline-flex items-center gap-1 rounded font-medium text-ocean-700 hover:text-ocean-800 hover:underline">
            <Icon name="logout" className="size-4" />
            Sign out
          </button>
        </p>
      </div>
    </Page>
  );
}
