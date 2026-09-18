"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Loader2, X } from "lucide-react";
import {
  IconKey,
  IconTrash,
  IconCopy,
  IconSuccess,
  IconError,
  IconEye,
  IconEyeOff,
  IconWarning,
} from "@/components/admin/icons";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { fmtDate, fmtRelative } from "@/lib/format";
import { PageHeader } from "@/components/admin/page-header";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { WorkspaceButton, StatStrip } from "@/components/admin/workspace";
import { Field, FormInput } from "@/components/admin/forms/primitives";
import { FormErrorBanner } from "@/components/admin/forms/form-alert";
import { useFormErrors } from "@/hooks/use-form-errors";
import { check, collectErrors, maxLen, required, LIMITS } from "@/lib/form-validation";
import { StatusBadge } from "@/components/admin/status-badge";
import { Avatar } from "@/components/admin/avatar";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import {
  API_ACCESS_LEVELS, DEFAULT_ACCESS_LEVEL, accessLevelMeta,
  type ApiAccessLevel,
} from "@/lib/api-scopes";

interface ApiKeyRecord {
  id: string;
  name: string;
  description?: string;
  keyPreview: string;
  accessLevel: ApiAccessLevel;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  lastUsedAt?: string;
  createdByName?: string;
}

interface NewKeyData {
  id: string;
  key: string;
  name: string;
  accessLevel: ApiAccessLevel;
}

/** Access picker at issue time. Spelled out, not a select: one level can publish to the careers site. */
function AccessLevelChoice({
  value, onChange, disabled,
}: {
  value: ApiAccessLevel;
  onChange: (level: ApiAccessLevel) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-labelledby="apikey-access-label" className="grid gap-2">
      {API_ACCESS_LEVELS.map((level) => {
        const selected = value === level.id;
        return (
          <label
            key={level.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-[12px] border p-3 transition-colors duration-150",
              selected
                ? "border-[var(--adm-accent)] bg-[var(--adm-accent-tint)]"
                : "border-[var(--adm-line)] hover:border-[var(--adm-line-strong)] hover:bg-[var(--adm-row-hover)]",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <input
              type="radio"
              name="apikey-access"
              value={level.id}
              checked={selected}
              disabled={disabled}
              onChange={() => onChange(level.id)}
              className="mt-0.5 h-4 w-4 flex-none accent-[var(--adm-accent)]"
            />
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold text-[var(--adm-ink)]">{level.label}</span>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-[var(--adm-ink-mute)]">
                {level.description}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

/** Empty cell. */
function Blank() {
  return <span className="text-[var(--adm-ink-subtle)]">&mdash;</span>;
}

export default function ApiKeysPage() {
  const { user } = useAuth();

  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAccess, setFormAccess] = useState<ApiAccessLevel>(DEFAULT_ACCESS_LEVEL);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const { errors, validateAll, revalidate, reset, invalidProps } = useFormErrors(
    () => collectErrors({
      name: check(formName, required("Name the platform this key is for, like Indeed."), maxLen(LIMITS.name)),
      desc: check(formDesc, maxLen(LIMITS.short)),
    }),
    { name: "apikey-name", desc: "apikey-desc" },
  );

  function openCreate() {
    reset();
    setCreateError(null);
    setShowCreateForm(true);
  }

  // Newly created key (shown once)
  const [newKey, setNewKey] = useState<NewKeyData | null>(null);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [scopingId, setScopingId] = useState<string | null>(null);

  async function fetchKeys() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/api-keys");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load API keys");
      setKeys(data.apiKeys || []);
    } catch (e) {
      console.error("Failed to load API keys:", e);
      setError("Couldn't load API keys. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchKeys(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;
    if (!validateAll()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDesc.trim(),
          accessLevel: formAccess,
          createdBy: user?.id || "admin",
          createdByName: user?.name || "Admin",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "The key could not be created. Try again in a moment.");
      setNewKey({
        id: data.apiKey.id,
        key: data.apiKey.key,
        name: data.apiKey.name,
        accessLevel: data.apiKey.accessLevel ?? formAccess,
      });
      setShowKey(false);
      setCopied(false);
      setFormName("");
      setFormDesc("");
      setFormAccess(DEFAULT_ACCESS_LEVEL);
      setShowCreateForm(false);
      await fetchKeys();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "The key could not be created. Try again in a moment.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setKeys((prev) => prev.map((k) => k.id === id ? { ...k, isActive: !currentActive } : k));
    } catch (e) {
      console.error("Failed to toggle API key:", e);
      setError(`Couldn't ${currentActive ? "disable" : "enable"} that key. Try again.`);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleAccessChange(id: string, level: ApiAccessLevel) {
    const previous = keys.find((k) => k.id === id)?.accessLevel;
    if (previous === level) return;
    setScopingId(id);
    // Optimistic, reverted on failure: the select is this control's only feedback.
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, accessLevel: level } : k)));
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessLevel: level }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to change key access");
      }
    } catch (e) {
      setKeys((prev) => prev.map((k) => (k.id === id && previous ? { ...k, accessLevel: previous } : k)));
      setError(e instanceof Error ? e.message : "Failed to change key access");
    } finally {
      setScopingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (e) {
      console.error("Failed to revoke API key:", e);
      setError("Couldn't revoke that key, so it still exists. Try again.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── derived ───────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const used = keys
      .map((k) => k.lastUsedAt)
      .filter((d): d is string => !!d)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return {
      total:    keys.length,
      active:   keys.filter((k) => k.isActive).length,
      disabled: keys.filter((k) => !k.isActive).length,
      lastUsed: used.length > 0 ? fmtRelative(used[0]) : "Never",
    };
  }, [keys]);

  // ── grid columns ──────────────────────────────────────────────────────────

  const codeChip = "rounded-[6px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--adm-ink-mute)]";

  const columns: DataTableColumn<ApiKeyRecord>[] = [
    {
      key: "name",
      header: "Platform",
      sortValue: (k) => k.name,
      cell: (k) => (
        <div className="min-w-0 max-w-[240px]">
          <span className="block truncate font-semibold text-[var(--adm-ink)]">{k.name}</span>
          <span className="mt-0.5 block truncate text-[13px] text-[var(--adm-ink-subtle)]">
            {k.description || "–"}
          </span>
        </div>
      ),
    },
    {
      key: "keyPreview",
      header: "Key",
      // The API only ever returns a prefix; the secret is shown once, at creation.
      cell: (k) => <span className={codeChip}>{k.keyPreview}</span>,
    },
    {
      key: "access",
      header: "Access",
      sortValue: (k) => k.accessLevel,
      cell: (k) => (
        // Editable in place: a two-value choice doesn't earn a modal.
        <label className="relative inline-flex items-center">
          <span className="sr-only">Access for {k.name}</span>
          <select
            value={k.accessLevel}
            disabled={scopingId === k.id}
            onChange={(e) => handleAccessChange(k.id, e.target.value as ApiAccessLevel)}
            onClick={(e) => e.stopPropagation()}
            className="h-8 cursor-pointer appearance-none rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] py-0 pl-3 pr-8 text-[13px] font-medium text-[var(--adm-ink)] transition-colors duration-150 hover:border-[var(--adm-line-strong)] focus:border-[var(--adm-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)] disabled:opacity-50"
          >
            {API_ACCESS_LEVELS.map((level) => (
              <option key={level.id} value={level.id}>{level.label}</option>
            ))}
          </select>
          {scopingId === k.id ? (
            <Loader2 className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 animate-spin text-[var(--adm-ink-subtle)]" aria-hidden="true" />
          ) : (
            <svg
              aria-hidden viewBox="0 0 24 24"
              className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-[var(--adm-ink-subtle)]"
              fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          )}
        </label>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (k) => (k.isActive ? 1 : 0),
      cell: (k) => <StatusBadge status={k.isActive ? "active" : "inactive"} />,
    },
    {
      key: "createdBy",
      header: "Created by",
      hideBelow: "xl",
      sortValue: (k) => k.createdByName || "",
      cell: (k) => k.createdByName ? (
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={k.createdByName} size="xs" />
          <span className="max-w-[140px] truncate text-[13px] text-[var(--adm-ink-mute)]">{k.createdByName}</span>
        </div>
      ) : <Blank />,
    },
    {
      key: "created",
      header: "Created",
      hideBelow: "lg",
      sortValue: (k) => new Date(k.createdAt).getTime(),
      cell: (k) => <span className="text-[13px] tabular-nums text-[var(--adm-ink-mute)]">{fmtDate(k.createdAt)}</span>,
    },
    {
      key: "lastUsed",
      header: "Last used",
      hideBelow: "lg",
      sortValue: (k) => (k.lastUsedAt ? new Date(k.lastUsedAt).getTime() : 0),
      cell: (k) => k.lastUsedAt
        ? <span className="text-[13px] tabular-nums text-[var(--adm-ink-mute)]">{fmtRelative(k.lastUsedAt)}</span>
        : <span className="text-[13px] text-[var(--adm-ink-subtle)]">Never used</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (k) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => handleToggle(k.id, k.isActive)}
            disabled={togglingId === k.id}
            title={k.isActive ? "Disable key" : "Enable key"}
            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[13px] font-medium text-[var(--adm-ink-mute)] transition-colors duration-150 hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)] disabled:opacity-50"
          >
            {togglingId === k.id ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : k.isActive ? (
              <IconError className="h-4 w-4" aria-hidden="true" />
            ) : (
              <IconSuccess className="h-4 w-4" aria-hidden="true" />
            )}
            {k.isActive ? "Disable" : "Enable"}
          </button>
          <button
            type="button"
            onClick={() => handleDelete(k.id)}
            disabled={deletingId === k.id}
            aria-label={`Revoke ${k.name}`}
            title="Revoke key permanently"
            className="grid h-9 w-9 place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors duration-150 hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)] disabled:opacity-50"
          >
            {deletingId === k.id ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <IconTrash className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 pb-10 lg:space-y-5">
      <PageHeader
        title="API keys"
        info="Keys partner platforms use to pull your job listings via the public job feed API."
        actions={
          <WorkspaceButton variant="primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />New API key
          </WorkspaceButton>
        }
      />

      <div className="flex flex-col">
        <StatStrip
          className="mb-0"
          items={[
            { label: "Total keys", value: stats.total },
            { label: "Active", value: stats.active },
            { label: "Disabled", value: stats.disabled },
            { label: "Last used", value: stats.lastUsed, hint: "Most recent call across all keys" },
          ]}
        />
      </div>

      {newKey && (
        <div
          role="status"
          className="rounded-[12px] border border-[color-mix(in_srgb,var(--adm-warning)_35%,transparent)] bg-[var(--adm-warning-soft)] p-4"
        >
          <div className="flex items-start gap-3">
            <IconWarning className="mt-0.5 h-[18px] w-[18px] flex-none text-[var(--adm-warning-ink)]" />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-[var(--adm-warning-ink)]">Copy your API key now, it won&apos;t be shown again</p>
              <p className="mt-0.5 text-[13px] text-[var(--adm-ink-mute)]">
                Platform: <span className="font-medium text-[var(--adm-ink)]">{newKey.name}</span> · Access:{" "}
                <span className="font-medium text-[var(--adm-ink)]">{accessLevelMeta(newKey.accessLevel).label}</span>
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex h-9 min-w-0 flex-1 select-all items-center truncate rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-3 font-mono text-[13px] text-[var(--adm-ink)]">
                  <span className="truncate">
                    {showKey ? newKey.key : newKey.key.slice(0, 16) + "•".repeat(newKey.key.length - 16)}
                  </span>
                </div>
                <div className="flex flex-none items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    aria-label={showKey ? "Hide key" : "Show key"}
                    title={showKey ? "Hide" : "Reveal"}
                    className="grid h-9 w-9 place-items-center rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] text-[var(--adm-ink-mute)] transition-colors duration-150 hover:border-[var(--adm-line-strong)] hover:text-[var(--adm-ink)]"
                  >
                    {showKey ? <IconEyeOff className="h-4 w-4" aria-hidden="true" /> : <IconEye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                  <WorkspaceButton onClick={() => handleCopy(newKey.key)} className="flex-1 sm:flex-none">
                    {copied ? <IconSuccess className="text-[var(--adm-success-ink)]" /> : <IconCopy />}
                    {copied ? "Copied" : "Copy key"}
                  </WorkspaceButton>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNewKey(null)}
              aria-label="Dismiss"
              className="-mr-1 -mt-1 grid h-9 w-9 flex-none place-items-center rounded-[8px] text-[var(--adm-warning-ink)] transition-colors duration-150 hover:bg-[var(--adm-warning-soft)]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-[12px] border border-[color-mix(in_srgb,var(--adm-danger)_30%,transparent)] bg-[var(--adm-danger-soft)] py-2 pl-4 pr-2 text-[13.5px] text-[var(--adm-danger-ink)]"
        >
          <IconError className="h-4 w-4 flex-none" />
          <span className="min-w-0 flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="grid h-9 w-9 flex-none place-items-center rounded-[8px] transition-colors duration-150 hover:bg-[var(--adm-danger-soft)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <AdminCard className="overflow-hidden">
        <AdminCardHeader title="Issued keys" subtitle="Disable to pause a partner, revoke to remove for good" count={keys.length} />
        <DataTable
          columns={columns}
          rows={keys}
          rowKey={(k) => k.id}
          loading={loading}
          pageSize={25}
          initialSort={{ key: "created", dir: "desc" }}
          empty={{
            icon: IconKey,
            title: "No API keys yet",
            description: "Create one to share with a partner platform.",
            action: (
              <WorkspaceButton onClick={openCreate}>
                <Plus className="h-4 w-4" />New API key
              </WorkspaceButton>
            ),
          }}
        />
      </AdminCard>

      <AdminCard>
        <AdminCardHeader title="Job feed API" subtitle="What a partner calls with its key" />
        <div className="space-y-4 p-4">
          <p className="text-[13.5px] leading-relaxed text-[var(--adm-ink-mute)]">
            Partner platforms authenticate with an{" "}
            <code className={codeChip}>X-API-Key: &lt;key&gt;</code>{" "}
            header.
          </p>
          <ul className="divide-y divide-[var(--adm-line-soft)] overflow-hidden rounded-[12px] border border-[var(--adm-line)]">
            {[
              { route: "GET /api/v1/jobs", scope: "jobs:read" },
              { route: "GET /api/v1/jobs/:id", scope: "jobs:read" },
              { route: "POST /api/v1/jobs", scope: "jobs:write" },
            ].map(({ route, scope }) => (
              <li key={route} className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5">
                <span className="min-w-0 break-all font-mono text-[13px] text-[var(--adm-ink)]">{route}</span>
                <span className={codeChip}>{scope}</span>
              </li>
            ))}
          </ul>
          <p className="text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">
            A <span className="font-medium text-[var(--adm-ink)]">View jobs</span> key holds <code className={codeChip}>jobs:read</code> only;
            calling the write endpoint with one returns 403. Postings filed over the API land as
            drafts unless the request asks for <code className={codeChip}>status</code>.
          </p>
          <p className="text-[13px] leading-loose text-[var(--adm-ink-mute)]">
            Query params:{" "}
            {["status", "department", "type", "page", "limit"].map((p, i) => (
              <span key={p}>
                {i > 0 && " · "}
                <code className={codeChip}>{p}</code>
              </span>
            ))}
          </p>
        </div>
      </AdminCard>

      {showCreateForm && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[var(--adm-scrim)] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="apikey-form-title"
        >
          {/* Bounded, middle scrolls: the access picker outgrows a laptop viewport. */}
          <form
            onSubmit={handleCreate}
            onBlur={revalidate}
            noValidate
            className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-lg)]"
          >
            <div className="flex flex-none items-center justify-between gap-3 border-b border-[var(--adm-line-soft)] px-4 py-3 sm:px-5">
              <h2 id="apikey-form-title" className="truncate text-[15px] font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">New API key</h2>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                aria-label="Close"
                className="grid h-9 w-9 flex-none place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors duration-150 hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]"
              >
                <X className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
              <FormErrorBanner message={createError} onDismiss={() => setCreateError(null)} />
              <Field label="Platform name" required htmlFor="apikey-name" error={errors.name}>
                <FormInput
                  id="apikey-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Indeed, LinkedIn, Internal Portal"
                  required
                  autoFocus
                  {...invalidProps("name")}
                />
              </Field>
              <Field label="Description" hint="Optional" htmlFor="apikey-desc" error={errors.desc}>
                <FormInput
                  id="apikey-desc"
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="e.g. Used for job syndication feed"
                  {...invalidProps("desc")}
                />
              </Field>
              <div>
                <p id="apikey-access-label" className="mb-2 text-[14px] font-medium text-[var(--adm-ink-mute)]">Access</p>
                <AccessLevelChoice value={formAccess} onChange={setFormAccess} disabled={creating} />
              </div>
            </div>

            <div className="flex flex-none flex-col-reverse gap-2 border-t border-[var(--adm-line-soft)] bg-[var(--adm-surface-sunken)] px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
              <WorkspaceButton onClick={() => setShowCreateForm(false)} className="w-full sm:w-auto">
                Cancel
              </WorkspaceButton>
              <WorkspaceButton type="submit" variant="primary" disabled={creating} className="w-full sm:w-auto">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <IconKey className="h-4 w-4" aria-hidden="true" />}
                {creating ? "Generating…" : "Generate key"}
              </WorkspaceButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
