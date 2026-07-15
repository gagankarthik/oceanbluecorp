"use client";
import { AdminRowsSkeleton } from "@/components/admin/skeletons";

import { useState, useEffect } from "react";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  Globe,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

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

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function formatRelative(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">API Keys</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage API keys for partner platforms to pull your job listings via the public Job Feed API.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--hz-cobalt)] hover:bg-[var(--hz-cobalt-600)] text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New API Key
        </button>
      </div>

      {/* API Reference Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--hz-cobalt-100)] flex items-center justify-center flex-shrink-0">
            <Globe className="w-4 h-4 text-[var(--hz-cobalt)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">Job Feed API</p>
            <p className="text-xs text-slate-500 mt-0.5 mb-2">
              Partner platforms authenticate with <code className="bg-slate-200 px-1 rounded text-xs">X-API-Key: &lt;key&gt;</code> header.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono">
              <span className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-600">
                GET /api/v1/jobs
              </span>
              <span className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-600">
                GET /api/v1/jobs/:id
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Query params: <code className="bg-slate-200 px-1 rounded">status</code> · <code className="bg-slate-200 px-1 rounded">department</code> · <code className="bg-slate-200 px-1 rounded">type</code> · <code className="bg-slate-200 px-1 rounded">page</code> · <code className="bg-slate-200 px-1 rounded">limit</code>
            </p>
          </div>
        </div>
      </div>

      {/* Newly created key reveal */}
      {newKey && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">Copy your API key now — it won&apos;t be shown again</p>
              <p className="text-xs text-amber-700 mt-0.5 mb-3">Platform: <strong>{newKey.name}</strong></p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 font-mono text-sm text-slate-800 truncate select-all">
                  {showKey ? newKey.key : newKey.key.slice(0, 16) + "•".repeat(newKey.key.length - 16)}
                </div>
                <button
                  onClick={() => setShowKey((v) => !v)}
                  aria-label="Show key"
                  className="p-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                  title={showKey ? "Hide" : "Reveal"}
                >
                  {showKey ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
                <button
                  onClick={() => handleCopy(newKey.key)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <button onClick={() => setNewKey(null)} aria-label="Dismiss" className="p-1 text-amber-600 hover:bg-amber-100 rounded-md transition-colors">
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Create form modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--hz-cobalt-100)] flex items-center justify-center">
                  <Key className="w-4 h-4 text-[var(--hz-cobalt)]" />
                </div>
                <h2 className="text-base font-semibold text-slate-900">New API Key</h2>
              </div>
              <button onClick={() => setShowCreateForm(false)} aria-label="Close" className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Platform Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Indeed, LinkedIn, Internal Portal"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--hz-cobalt)] focus:border-transparent"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="e.g. Used for job syndication feed"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--hz-cobalt)] focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !formName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--hz-cobalt)] hover:bg-[var(--hz-cobalt-600)] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  {creating ? "Generating..." : "Generate Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-sm text-rose-700">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} aria-label="Dismiss error" className="ml-auto p-1 hover:bg-rose-100 rounded">
            <X className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-medium text-slate-700">
            {keys.length} {keys.length === 1 ? "key" : "keys"}
          </p>
        </div>

        {loading ? (
          <AdminRowsSkeleton rows={5} />
        ) : keys.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Key className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No API keys yet</p>
            <p className="text-xs text-slate-400 mt-1">Create one to share with a partner platform.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50/50 transition-colors">
                {/* Status dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${k.isActive ? "bg-green-500" : "bg-slate-300"}`} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900">{k.name}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                        k.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {k.isActive ? "Active" : "Disabled"}
                    </span>
                  </div>
                  {k.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{k.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <code className="text-[11px] text-slate-400 font-mono">{k.keyPreview}</code>
                    <span className="text-[11px] text-slate-400">Created {formatDate(k.createdAt)}</span>
                    {k.lastUsedAt && (
                      <span className="text-[11px] text-slate-400">Last used {formatRelative(k.lastUsedAt)}</span>
                    )}
                    {!k.lastUsedAt && (
                      <span className="text-[11px] text-slate-300 italic">Never used</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(k.id, k.isActive)}
                    disabled={togglingId === k.id}
                    title={k.isActive ? "Disable key" : "Enable key"}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  >
                    {togglingId === k.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : k.isActive ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    {k.isActive ? "Disable" : "Enable"}
                  </button>

                  <button
                    onClick={() => handleDelete(k.id)}
                    disabled={deletingId === k.id}
                    aria-label="Delete key"
                    title="Delete key permanently"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === k.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
