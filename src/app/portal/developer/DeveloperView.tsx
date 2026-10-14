"use client";

import { useEffect, useMemo, useState } from "react";
import { API_ACCESS_LEVELS, DEFAULT_ACCESS_LEVEL, accessLevelMeta, type ApiAccessLevel, type ApiScope } from "@/lib/api-scopes";
import { fmtDate, fmtDateTime, fmtRelative } from "@/lib/format";
import { LIMITS } from "@/lib/form-validation";
import { useAuth } from "@/lib/auth";
import { SITE_URL } from "@/lib/seo";
import { useResource } from "@/hooks/use-resource";
import DataTable, { type Column, type Filter } from "@/components/portal/DataTable";
import Icon from "@/components/portal/icons";
import Select from "@/components/portal/Select";
import { RoleGate } from "@/components/portal/session";
import type { MenuEntry } from "@/components/portal/records/Menu";
import {
  Badge,
  Button,
  ConfirmDialog,
  deleteConfirmText,
  EmptyState,
  ErrorState,
  KpiRow,
  KpiRowSkeleton,
  Modal,
  Page,
  PageHeader,
  Panel,
  StatCard,
  TableSkeleton,
} from "@/components/portal/kit";
import { Facts, Field, FormError, GoneNotice, ViewTabs, errorText, inputCls, send, useToast } from "@/components/portal/relationships/shared";

const KEY = "/api/admin/api-keys";

/** A row of GET /api/admin/api-keys; the raw key never comes back after creation. */
type ApiKeyRow = {
  id: string;
  name: string;
  description?: string;
  keyPreview: string;
  scopes: ApiScope[];
  accessLevel: ApiAccessLevel;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  lastUsedAt?: string;
  createdBy?: string;
  createdByName?: string;
};
type Tab = "keys" | "reference";

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/jobs", scope: "jobs:read", note: "Live postings, newest first" },
  { method: "GET", path: "/api/v1/jobs/{id}", scope: "jobs:read", note: "One posting by id" },
  { method: "POST", path: "/api/v1/jobs", scope: "jobs:write", note: "File a new posting as a draft" },
];
const QUERY_PARAMS = ["status", "department", "type", "page", "limit"];
const methodTone: Record<string, string> = { GET: "bg-ocean-50 text-ocean-700", POST: "bg-status-success-soft text-status-success" };
const code = "rounded bg-mist-100 px-1 font-mono text-adm-base text-navy-900";

// Disabled is a deliberate pause: grey, not red.
function KeyStatus({ active }: { active: boolean }) {
  return (
    <Badge tone={active ? "green" : "grey"} dot>
      {active ? "Active" : "Disabled"}
    </Badge>
  );
}

const lastUsedText = (k: ApiKeyRow) => (k.lastUsedAt ? `Last used ${fmtRelative(k.lastUsedAt)}` : "Never used");

function KeyDetail({
  k,
  onToggle,
  onAccess,
  onRename,
  onRevoke,
  startEditing,
  onEditStarted,
}: {
  k: ApiKeyRow;
  /** Set from the sheet header or the row menu's Edit; consumed once. */
  startEditing?: boolean;
  onEditStarted?: () => void;
  onToggle: () => Promise<void>;
  onAccess: (l: ApiAccessLevel) => Promise<void>;
  onRename: (p: { name: string; description: string }) => Promise<boolean>;
  onRevoke: () => void;
}) {
  const [busy, setBusy] = useState<"toggle" | "access" | "rename" | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(k.name);
  const [description, setDescription] = useState(k.description ?? "");
  const [nameError, setNameError] = useState<string>();
  useEffect(() => {
    if (!startEditing) return;
    setName(k.name);
    setDescription(k.description ?? "");
    setEditing(true);
    onEditStarted?.();
  }, [startEditing, onEditStarted, k.name, k.description]);
  const run = (kind: "toggle" | "access", fn: () => Promise<void>) => {
    setBusy(kind);
    void fn().finally(() => setBusy(null));
  };
  const save = async () => {
    const n = name.trim();
    if (!n) return setNameError("Name the partner or platform that uses this key.");
    if (n.length > LIMITS.name) return setNameError(`Keep the name to ${LIMITS.name} characters or fewer.`);
    setNameError(undefined);
    setBusy("rename");
    const ok = await onRename({ name: n, description: description.trim() });
    setBusy(null);
    if (ok) setEditing(false);
  };

  return (
    <div className="grid gap-6">
      <div className={`flex items-center gap-3 rounded-xl p-4 ${k.lastUsedAt ? "bg-mist-50" : "bg-status-warning-soft"}`}>
        <Icon name="activity" className={`size-5 shrink-0 ${k.lastUsedAt ? "text-mist-500" : "text-status-warning"}`} />
        <div className="min-w-0 text-adm-base">
          <p className="font-semibold text-navy-900">{lastUsedText(k)}</p>
          <p className="text-adm-base text-mist-600">{k.lastUsedAt ? fmtDateTime(k.lastUsedAt) : "Nothing has called the API with this key yet."}</p>
        </div>
      </div>

      {editing ? (
        <div className="grid gap-4 rounded-xl p-4 ring-1 ring-mist-200">
          <Field label="Partner or platform" required error={nameError}>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={LIMITS.name} aria-invalid={!!nameError || undefined} className={inputCls} autoFocus />
          </Field>
          <Field label="Description" hint="What uses it, and who to ask before revoking it.">
            <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={LIMITS.short} className={inputCls} />
          </Field>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" disabled={busy === "rename"} onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button loading={busy === "rename"} onClick={() => void save()}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <KeyStatus active={k.isActive} />
              {k.scopes.map((s) => (
                <Badge key={s} tone="blue">
                  {s}
                </Badge>
              ))}
            </div>
            <p className="mt-3 font-mono text-adm-base text-mist-700">{k.keyPreview}</p>
            <p className="mt-2 text-adm-base text-mist-700">{k.description || <span className="text-mist-600">No description</span>}</p>
          </div>
        </div>
      )}

      <Facts
        items={[
          ["Created", fmtDateTime(k.createdAt)],
          ["Created by", k.createdByName],
          ["Last changed", k.updatedAt ? fmtDateTime(k.updatedAt) : undefined],
          ["Access", accessLevelMeta(k.accessLevel).summary],
        ]}
      />

      <section className="rounded-xl ring-1 ring-mist-200">
        <h3 className="border-b border-mist-200 px-4 py-3 text-adm-base font-semibold">Access</h3>
        <div className="grid gap-4 p-4">
          <div className="text-adm-base font-medium">
            <p className="mb-1.5">What this key can do</p>
            <Select
              label="Access level"
              showLabel={false}
              variant="field"
              width="w-full"
              disabled={busy !== null}
              value={k.accessLevel}
              onChange={(v) => v !== k.accessLevel && run("access", () => onAccess(v as ApiAccessLevel))}
              options={API_ACCESS_LEVELS.map((l) => ({ value: l.id, label: l.label, description: l.description }))}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mist-200 pt-4">
            <p className="text-adm-base text-mist-700">{k.isActive ? "Requests with this key are accepted." : "Requests with this key get 401 until it is enabled."}</p>
            <Button variant="secondary" icon={k.isActive ? "x" : "check"} loading={busy === "toggle"} onClick={() => run("toggle", onToggle)}>
              {k.isActive ? "Disable" : "Enable"}
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-2 border-t border-mist-200 pt-5">
        <div>
          <Button variant="danger" icon="trash" onClick={onRevoke}>
            Revoke key
          </Button>
        </div>
        <p className="text-adm-xs text-mist-600">Revoking deletes the key. To pause it, disable it instead.</p>
      </div>
    </div>
  );
}

function CreateKey({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<ApiAccessLevel>(DEFAULT_ACCESS_LEVEL);
  const [nameError, setNameError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ key: string; name: string; level: ApiAccessLevel } | null>(null);
  const [copied, setCopied] = useState(false);
  const [stored, setStored] = useState(false);
  const [nudge, setNudge] = useState(false);
  const toast = useToast();

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (creating) return;
    if (!name.trim()) return setNameError("Name the partner or platform that will use this key.");
    if (name.trim().length > LIMITS.name) return setNameError(`Keep the name to ${LIMITS.name} characters or fewer.`);
    setNameError(undefined);
    setCreating(true);
    setError(null);
    try {
      const data = await send<{ apiKey: { key: string; name: string; accessLevel?: ApiAccessLevel } }>(KEY, "POST", {
        name: name.trim(),
        description: description.trim(),
        accessLevel: level,
        createdBy: user?.id,
        createdByName: user?.name || user?.email,
      });
      setCreated({ key: data.apiKey.key, name: data.apiKey.name, level: data.apiKey.accessLevel ?? level });
      onCreated();
    } catch (x) {
      setError(errorText(x, "The key could not be created. Try again."));
    } finally {
      setCreating(false);
    }
  };

  if (created) {
    // The key is shown once: Escape, the backdrop and the close button only nudge until it's confirmed.
    const tryClose = () => (stored ? onClose() : setNudge(true));
    return (
      <Modal
        title="Copy your new key"
        description="Step 2 of 2"
        onClose={tryClose}
        footer={
          <Button icon="check" disabled={!stored} onClick={onClose}>
            Done
          </Button>
        }
      >
        <div className="grid gap-4">
          <p className="text-adm-base text-mist-700">
            <span className="font-semibold text-navy-900">{created.name}</span> ({accessLevelMeta(created.level).summary}). This is the only time the full key is shown.
          </p>
          <div className="flex flex-col gap-2 rounded-lg bg-mist-100 p-3 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 select-all break-all font-mono text-adm-base text-navy-900">{created.key}</code>
            <Button
              size="sm"
              variant="secondary"
              icon={copied ? "check" : undefined}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(created.key);
                  setCopied(true);
                  setStored(true);
                  toast.show("Key copied");
                } catch {
                  toast.error("Couldn't copy, select the key and copy it manually");
                }
              }}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <label className="flex min-h-10 cursor-pointer items-center gap-3 text-adm-base text-navy-900">
            <input type="checkbox" checked={stored} onChange={(e) => setStored(e.target.checked)} className="size-4 accent-ocean-600" />
            I&apos;ve stored this key somewhere safe
          </label>
          {nudge && !stored && (
            <p role="alert" className="rounded-lg bg-status-warning-soft px-3 py-2 text-adm-base text-status-warning ring-1 ring-inset ring-status-warning-line">
              Copy the key and tick the box first. Once this closes, the key can&apos;t be shown again.
            </p>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Create API key"
      description="Step 1 of 2"
      onClose={() => !creating && onClose()}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button icon="key" loading={creating} onClick={() => void submit()}>
            Create key
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-4">
        <FormError message={error} />
        <Field label="Partner or platform" required error={nameError}>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={LIMITS.name} placeholder="For example: Dice syndication" aria-invalid={!!nameError || undefined} className={inputCls} autoFocus />
        </Field>
        <Field label="Description" hint="Optional: what uses it, and who to ask before revoking it.">
          <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={LIMITS.short} className={inputCls} />
        </Field>
        <fieldset>
          <legend className="text-adm-base font-medium text-navy-900">
            Access <span className="text-status-danger">*</span>
          </legend>
          <div className="mt-2 grid gap-2">
            {API_ACCESS_LEVELS.map((l) => (
              <label key={l.id} className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 ring-1 ring-inset ${level === l.id ? "bg-ocean-50 ring-ocean-600" : "ring-mist-300 hover:bg-mist-50"}`}>
                <input type="radio" name="access" value={l.id} checked={level === l.id} onChange={() => setLevel(l.id)} className="mt-0.5 size-4 accent-ocean-600" />
                <span className="text-adm-base">
                  <span className="block font-medium text-navy-900">{l.label}</span>
                  <span className="block text-adm-base text-mist-600">{l.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

function Reference() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid content-start gap-6">
        <Panel title="Endpoints" description="Partner job feed. Send the key in the x-api-key header.">
          <ul className="grid gap-2">
            {ENDPOINTS.map((e) => (
              <li key={e.method + e.path} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-mist-50 px-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 font-mono text-adm-xs font-semibold ${methodTone[e.method]}`}>{e.method}</span>
                  <span className="truncate font-mono text-adm-base text-navy-900">{e.path}</span>
                </span>
                <span className="text-adm-xs text-mist-600">
                  {e.note} · <span className="font-mono">{e.scope}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Example">
          <pre className="scroll-thin overflow-x-auto overflow-y-hidden rounded-lg bg-navy-900 p-4 font-mono text-adm-xs leading-normal text-tide-200">
            {`curl -H "x-api-key: obk_live_…" \\\n  "${SITE_URL}/api/v1/jobs?status=active&limit=20"`}
          </pre>
        </Panel>
        <Panel title="Rules">
          <ul className="grid gap-3 text-adm-base leading-normal text-mist-700">
            <li>
              Query parameters on the list: {QUERY_PARAMS.map((p, i) => (
                <span key={p}>
                  {i > 0 && " · "}
                  <code className={code}>{p}</code>
                </span>
              ))}
            </li>
            <li>
              A <span className="font-medium text-navy-900">View jobs</span> key holds <code className={code}>jobs:read</code> only; calling the write endpoint with one returns 403.
            </li>
            <li>
              Postings filed over the API land as drafts unless the request asks for a <code className={code}>status</code>.
            </li>
            <li>Disabling or revoking a key takes effect on its next request. A disabled or unknown key gets 401.</li>
          </ul>
        </Panel>
      </div>
      <Panel title="More">
        <div className="grid gap-3 text-adm-base text-mist-700">
          <p>The full internal API, AWS services and auth notes are in the docs.</p>
          <div>
            <Button variant="secondary" icon="code" href="/portal/docs#api-reference">
              Open the API reference
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export default function DeveloperView({ initialTab = "keys" }: { initialTab?: Tab }) {
  const { data, error, isLoading, isValidating, reload, setData } = useResource<{ apiKeys?: ApiKeyRow[] }>(KEY);
  const keys = useMemo(() => data?.apiKeys ?? [], [data]);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<ApiKeyRow | null>(null);
  const [revokeBusy, setRevokeBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const toast = useToast();

  const switchTab = (t: Tab) => {
    setTab(t);
    try {
      const url = new URL(window.location.href);
      if (t === "keys") url.searchParams.delete("tab");
      else url.searchParams.set("tab", t);
      window.history.replaceState(null, "", url);
    } catch {}
  };

  const clearEdit = useMemo(() => () => setEditId(null), []);
  const patchLocal = (id: string, p: Partial<ApiKeyRow>) => setData((d) => ({ ...d, apiKeys: (d?.apiKeys ?? []).map((k) => (k.id === id ? { ...k, ...p } : k)) }));

  const toggle = async (k: ApiKeyRow) => {
    try {
      await send(`${KEY}/${k.id}`, "PUT", { isActive: !k.isActive });
      patchLocal(k.id, { isActive: !k.isActive });
      toast.show(k.isActive ? `${k.name} disabled` : `${k.name} enabled`);
    } catch (e) {
      toast.error(errorText(e, `Couldn't ${k.isActive ? "disable" : "enable"} that key. Try again.`));
    }
  };

  const changeAccess = async (k: ApiKeyRow, level: ApiAccessLevel) => {
    try {
      await send(`${KEY}/${k.id}`, "PUT", { accessLevel: level });
      patchLocal(k.id, { accessLevel: level, scopes: [...accessLevelMeta(level).scopes] });
      toast.show(`${k.name} can now ${level === "write" ? "create and view" : "only view"} jobs`);
    } catch (e) {
      toast.error(errorText(e, "Couldn't change the key's access. Try again."));
    }
  };

  const rename = async (k: ApiKeyRow, p: { name: string; description: string }) => {
    try {
      await send(`${KEY}/${k.id}`, "PUT", p);
      patchLocal(k.id, p);
      toast.show("Key details saved");
      return true;
    } catch (e) {
      toast.error(errorText(e, "Couldn't save the key details. Try again."));
      return false;
    }
  };

  const revoke = async () => {
    if (!revoking) return;
    setRevokeBusy(true);
    try {
      await send(`${KEY}/${revoking.id}`, "DELETE");
      setData((d) => ({ ...d, apiKeys: (d?.apiKeys ?? []).filter((k) => k.id !== revoking.id) }));
      toast.show(`${revoking.name} revoked`);
      setRevoking(null);
    } catch (e) {
      toast.error(errorText(e, "Couldn't revoke that key, so it still works. Try again."));
    } finally {
      setRevokeBusy(false);
    }
  };

  const rowMenu = (k: ApiKeyRow, openDetail: () => void): MenuEntry[] => [
    { label: "Open", icon: "eye", onSelect: openDetail },
    {
      label: "Edit",
      icon: "edit",
      onSelect: () => {
        setEditId(k.id);
        openDetail();
      },
    },
    { label: k.isActive ? "Disable" : "Enable", icon: k.isActive ? "x" : "check", onSelect: () => void toggle(k) },
    { kind: "separator" },
    { label: "Revoke", icon: "trash", danger: true, onSelect: () => setRevoking(k) },
  ];

  const active = keys.filter((k) => k.isActive).length;
  const writers = keys.filter((k) => k.isActive && k.accessLevel === "write").length;
  const recent = keys.filter((k) => k.lastUsedAt && Date.now() - new Date(k.lastUsedAt).getTime() < 30 * 86_400_000).length;

  const columns: Column<ApiKeyRow>[] = [
    {
      key: "name",
      header: "Key",
      sortable: true,
      cell: (k) => (
        <span className="block min-w-0">
          <span className="block max-w-[16rem] truncate font-medium">{k.name}</span>
          <span className="block font-mono text-adm-xs text-mist-600">{k.keyPreview}</span>
        </span>
      ),
    },
    { key: "access", header: "Access", sortable: true, value: (k) => accessLevelMeta(k.accessLevel).summary, cell: (k) => <Badge tone={k.accessLevel === "write" ? "amber" : "blue"}>{accessLevelMeta(k.accessLevel).summary}</Badge> },
    { key: "status", header: "Status", sortable: true, align: "center", value: (k) => (k.isActive ? "Active" : "Disabled"), cell: (k) => <KeyStatus active={k.isActive} /> },
    {
      key: "lastUsedAt",
      header: "Last used",
      sortable: true,
      value: (k) => (k.lastUsedAt ? new Date(k.lastUsedAt).getTime() : 0),
      cell: (k) => (
        <span className={`tabular-nums ${k.lastUsedAt ? "font-medium text-navy-900" : "font-medium text-status-warning"}`} title={k.lastUsedAt ? fmtDateTime(k.lastUsedAt) : undefined}>
          {k.lastUsedAt ? fmtRelative(k.lastUsedAt) : "Never"}
        </span>
      ),
    },
    { key: "createdAt", header: "Created", sortable: true, hideBelow: "lg", value: (k) => new Date(k.createdAt).getTime(), cell: (k) => <span className="tabular-nums text-mist-700">{fmtDate(k.createdAt)}</span> },
    { key: "createdByName", header: "Created by", hideBelow: "xl", value: (k) => k.createdByName || "" },
    { key: "description", header: "Description", defaultHidden: true, value: (k) => k.description || "" },
  ];

  const filters: Filter<ApiKeyRow>[] = [
    { key: "status", label: "Status", options: ["Active", "Disabled"], value: (k) => (k.isActive ? "Active" : "Disabled") },
    { key: "access", label: "Access", options: API_ACCESS_LEVELS.map((l) => l.summary), value: (k) => accessLevelMeta(k.accessLevel).summary },
  ];

  return (
    <RoleGate href="/portal/developer">
      <Page>
        <PageHeader
          title="Developer"
          icon="code"
          section="workspace"
          description="Partner API keys for the public job feed, and how to call it."
          actions={
            <>
              <Button variant="secondary" icon="code" href="/portal/docs">
                Docs
              </Button>
              <Button icon="key" onClick={() => setCreating(true)}>
                Create API key
              </Button>
            </>
          }
          tabs={
            <ViewTabs
              label="Developer views"
              tabs={[
                { id: "keys", label: "Keys", count: data ? keys.length : undefined },
                { id: "reference", label: "Reference" },
              ]}
              value={tab}
              onChange={switchTab}
            />
          }
        />

        {tab === "reference" ? (
          <Reference />
        ) : isLoading ? (
          <div role="status" aria-label="Loading API keys" className="grid gap-6">
            <KpiRowSkeleton count={3} />
            <TableSkeleton rows={5} />
          </div>
        ) : error && !data ? (
          <ErrorState title="Couldn't load API keys" message={error.message} onRetry={() => void reload()} retrying={isValidating} />
        ) : keys.length === 0 ? (
          <EmptyState
            framed
            variant="first-use"
            icon="key"
            title="No API keys yet"
            body="Create one for each partner that reads the job feed, so you can switch them off one at a time."
            primary={{ label: "Create API key", icon: "key", onClick: () => setCreating(true) }}
            secondary={{ label: "How the API works", icon: "code", onClick: () => switchTab("reference") }}
          />
        ) : (
          <>
            <KpiRow>
              <StatCard section="workspace" label="Active keys" value={active} icon="key" hint={`${keys.length - active} disabled`} trend="flat" />
              <StatCard section="workspace" label="Keys that can write" value={writers} icon="edit" hint="can file draft postings" trend="flat" />
              <StatCard section="workspace" label="Used in 30 days" value={recent} icon="activity" hint={`of ${keys.length} keys`} trend="flat" />
            </KpiRow>
            <DataTable
              rows={keys}
              columns={columns}
              filters={filters}
              exportName="api-keys"
              storageKey="portal.api-keys"
              searchPlaceholder="Search keys"
              emptyTitle="No keys match your filters"
              initialSort={{ key: "lastUsedAt", dir: -1 }}
              detailTitle={(k) => k.name}
              detailActions={(k) => (
                <Button size="sm" variant="secondary" icon="edit" onClick={() => setEditId(k.id)}>
                  Edit
                </Button>
              )}
              rowMenu={rowMenu}
              renderDetail={(r) => {
                const live = keys.find((x) => x.id === r.id);
                return live ? (
                  <KeyDetail
                    key={live.id}
                    k={live}
                    onToggle={() => toggle(live)}
                    onAccess={(l) => changeAccess(live, l)}
                    onRename={(p) => rename(live, p)}
                    onRevoke={() => setRevoking(live)}
                    startEditing={editId === live.id}
                    onEditStarted={clearEdit}
                  />
                ) : (
                  <GoneNotice noun="key" />
                );
              }}
            />
          </>
        )}
      </Page>

      {creating && <CreateKey onClose={() => setCreating(false)} onCreated={() => void reload()} />}
      {revoking && (
        <ConfirmDialog
          title="Revoke this key?"
          body={
            <>
              <span className="font-semibold text-navy-900">{revoking.name}</span> stops working immediately and is deleted. Anything using it starts getting 401 errors. {lastUsedText(revoking)}. To pause it instead, disable it.
            </>
          }
          confirmLabel="Revoke key"
          requireText={deleteConfirmText(revoking.name)}
          busy={revokeBusy}
          onConfirm={() => void revoke()}
          onCancel={() => setRevoking(null)}
        />
      )}
    </RoleGate>
  );
}
