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
  IconGlobe,
  IconBlocked,
  IconClock,
} from "@/components/admin/icons";
import { useAuth } from "@/lib/auth";
import { fmtDate, fmtRelative } from "@/lib/format";
import { PageHeader, PageHeaderButton } from "@/components/admin/page-header";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { StatCard, KpiStrip } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Avatar } from "@/components/admin/avatar";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";

interface ApiKeyRecord {
  id: string;
  name: string;
  description?: string;
  keyPreview: string;
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
}

/** Placeholder for an empty cell, an em-dash, aligned with the other columns. */
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
  const [creating, setCreating] = useState(false);

  // Newly created key (shown once)
  const [newKey, setNewKey] = useState<NewKeyData | null>(null);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function fetchKeys() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/api-keys");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load API keys");
      setKeys(data.apiKeys || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchKeys(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDesc.trim(),
          createdBy: user?.id || "admin",
          createdByName: user?.name || "Admin",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create key");
      setNewKey({ id: data.apiKey.id, key: data.apiKey.key, name: data.apiKey.name });
      setShowKey(false);
      setCopied(false);
      setFormName("");
      setFormDesc("");
      setShowCreateForm(false);
      await fetchKeys();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create key");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    setTogglingId(id);
    try {
      await fetch(`/api/admin/api-keys/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      setKeys((prev) => prev.map((k) => k.id === id ? { ...k, isActive: !currentActive } : k));
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" });
      setKeys((prev) => prev.filter((k) => k.id !== id));
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

  const columns: DataTableColumn<ApiKeyRecord>[] = [
    {
      key: "name",
      header: "Platform",
      sortValue: (k) => k.name,
      cell: (k) => (
        <div className="max-w-[240px]">
          <span className="block truncate font-semibold text-[var(--adm-ink)]">{k.name}</span>
          <span className="mt-0.5 block truncate text-xs text-[var(--adm-ink-subtle)]">
            {k.description || "–"}
          </span>
        </div>
      ),
    },
    {
      key: "keyPreview",
      header: "Key",
      cell: (k) => (
        // Only the first 12 characters are ever returned by the API, the
        // secret itself is shown once, at creation, and never again.
        <span className="rounded-[4px] bg-[var(--adm-surface-2)] px-2 py-0.5 font-mono text-[11px] text-[var(--adm-ink-subtle)]">
          {k.keyPreview}
        </span>
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
        <div className="flex items-center gap-2">
          <Avatar name={k.createdByName} size="xs" />
          <span className="max-w-[120px] truncate text-xs text-[var(--adm-ink-mute)]">{k.createdByName}</span>
        </div>
      ) : <Blank />,
    },
    {
      key: "created",
      header: "Created",
      hideBelow: "lg",
      sortValue: (k) => new Date(k.createdAt).getTime(),
      cell: (k) => <span className="text-xs tabular-nums text-[var(--adm-ink-subtle)]">{fmtDate(k.createdAt)}</span>,
    },
    {
      key: "lastUsed",
      header: "Last used",
      hideBelow: "lg",
      sortValue: (k) => (k.lastUsedAt ? new Date(k.lastUsedAt).getTime() : 0),
      cell: (k) => k.lastUsedAt
        ? <span className="text-xs tabular-nums text-[var(--adm-ink-subtle)]">{fmtRelative(k.lastUsedAt)}</span>
        : <span className="text-xs text-[var(--adm-ink-subtle)]">Never used</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (k) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleToggle(k.id, k.isActive)}
            disabled={togglingId === k.id}
            title={k.isActive ? "Disable key" : "Enable key"}
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)] disabled:opacity-50"
          >
            {togglingId === k.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : k.isActive ? (
              <IconError className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <IconSuccess className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {k.isActive ? "Disable" : "Enable"}
          </button>
          <button
            onClick={() => handleDelete(k.id)}
            disabled={deletingId === k.id}
            aria-label={`Revoke ${k.name}`}
            title="Revoke key permanently"
            className="rounded-[6px] p-1.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger)] disabled:opacity-50"
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
    <div className="space-y-5 pb-10">
      <PageHeader
        title="API Keys"
        subtitle="Keys partner platforms use to pull your job listings via the public Job Feed API."
        icon={IconKey}
        actions={
          <PageHeaderButton variant="primary" onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4" />New API Key
          </PageHeaderButton>
        }
      />

      {/* ── KPI strip ── */}
      <KpiStrip cols={4}>
        <StatCard size="sm" tone="slate" label="Total keys" value={stats.total}    icon={IconKey} />
        <StatCard size="sm" tone="slate" label="Active"     value={stats.active}   icon={IconSuccess} />
        <StatCard size="sm" tone="slate" label="Disabled"   value={stats.disabled} icon={IconBlocked} />
        <StatCard size="sm" tone="slate" label="Last used"  value={stats.lastUsed} icon={IconClock} hint="Most recent call across all keys" />
      </KpiStrip>

      {/* ── Newly created key reveal ── */}
      {newKey && (
        <div className="rounded-[6px] border border-amber-300 bg-[var(--adm-warning-soft)] p-4">
          <div className="flex items-start gap-3">
            <IconWarning className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--adm-warning)]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--adm-warning)]">Copy your API key now, it won&apos;t be shown again</p>
              <p className="mb-3 mt-0.5 text-xs text-[var(--adm-warning)]">Platform: <strong>{newKey.name}</strong></p>
              <div className="flex items-center gap-2">
                <div className="flex-1 select-all truncate rounded-[6px] border border-amber-200 bg-[var(--adm-surface)] px-3 py-2 font-mono text-sm text-[var(--adm-ink)]">
                  {showKey ? newKey.key : newKey.key.slice(0, 16) + "•".repeat(newKey.key.length - 16)}
                </div>
                <button
                  onClick={() => setShowKey((v) => !v)}
                  aria-label="Show key"
                  className="rounded-[6px] p-2 text-[var(--adm-warning)] transition-colors hover:bg-[var(--adm-warning-soft)]"
                  title={showKey ? "Hide" : "Reveal"}
                >
                  {showKey ? <IconEyeOff className="h-4 w-4" aria-hidden="true" /> : <IconEye className="h-4 w-4" aria-hidden="true" />}
                </button>
                <button
                  onClick={() => handleCopy(newKey.key)}
                  className="inline-flex items-center gap-1.5 rounded-[6px] bg-amber-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
                >
                  {copied ? <IconSuccess className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <button
              onClick={() => setNewKey(null)}
              aria-label="Dismiss"
              className="rounded-[6px] p-1 text-[var(--adm-warning)] transition-colors hover:bg-[var(--adm-warning-soft)]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 rounded-[6px] border border-rose-200 bg-[var(--adm-danger-soft)] p-3 text-sm text-[var(--adm-danger)]">
          <IconError className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} aria-label="Dismiss error" className="ml-auto rounded-[4px] p-1 hover:bg-[var(--adm-danger-soft)]">
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* ── Key ledger ── */}
      <AdminCard className="overflow-hidden">
        <AdminCardHeader icon={IconKey} tone="blue" title="Issued keys" count={keys.length} />
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
              <PageHeaderButton onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4" />New API Key
              </PageHeaderButton>
            ),
          }}
        />
      </AdminCard>

      {/* ── Job Feed API reference ── */}
      <AdminCard>
        <AdminCardHeader icon={IconGlobe} tone="blue" title="Job Feed API" />
        <div className="space-y-3 p-5">
          <p className="text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">
            Partner platforms authenticate with an{" "}
            <code className="rounded-[4px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--adm-ink-mute)]">X-API-Key: &lt;key&gt;</code>{" "}
            header.
          </p>
          <div className="flex flex-wrap gap-2">
            {["GET /api/v1/jobs", "GET /api/v1/jobs/:id"].map((route) => (
              <span
                key={route}
                className="rounded-[4px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-2 py-1 font-mono text-[11px] text-[var(--adm-ink-mute)]"
              >
                {route}
              </span>
            ))}
          </div>
          <p className="text-[12.5px] text-[var(--adm-ink-subtle)]">
            Query params:{" "}
            {["status", "department", "type", "page", "limit"].map((p, i) => (
              <span key={p}>
                {i > 0 && " · "}
                <code className="rounded-[4px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--adm-ink-mute)]">{p}</code>
              </span>
            ))}
          </p>
        </div>
      </AdminCard>

      {/* ── Create form modal ── */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-lg)]">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--adm-line)] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <IconKey className="h-[18px] w-[18px] text-[var(--adm-accent)]" strokeWidth={1.75} />
                <h2 className="text-[15px] font-semibold text-[var(--adm-ink)]">New API Key</h2>
              </div>
              <button
                onClick={() => setShowCreateForm(false)}
                aria-label="Close"
                className="rounded-[6px] p-1.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink-mute)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 p-5">
              <div>
                <label htmlFor="apikey-name" className="mb-1.5 block text-[13px] font-semibold text-[var(--adm-ink-mute)]">
                  Platform Name <span className="text-[var(--adm-danger)]">*</span>
                </label>
                <input
                  id="apikey-name"
                  type="text"
                  autoComplete="off"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Indeed, LinkedIn, Internal Portal"
                  className="w-full rounded-[8px] border border-[var(--adm-line)] px-3 py-2 text-sm transition-colors focus:border-[var(--adm-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)]"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="apikey-desc" className="mb-1.5 block text-[13px] font-semibold text-[var(--adm-ink-mute)]">
                  Description <span className="font-normal text-[var(--adm-ink-subtle)]">(optional)</span>
                </label>
                <input
                  id="apikey-desc"
                  type="text"
                  autoComplete="off"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="e.g. Used for job syndication feed"
                  className="w-full rounded-[8px] border border-[var(--adm-line)] px-3 py-2 text-sm transition-colors focus:border-[var(--adm-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <PageHeaderButton type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </PageHeaderButton>
                <PageHeaderButton type="submit" variant="primary" disabled={creating || !formName.trim()}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconKey className="h-4 w-4" />}
                  {creating ? "Generating…" : "Generate Key"}
                </PageHeaderButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
