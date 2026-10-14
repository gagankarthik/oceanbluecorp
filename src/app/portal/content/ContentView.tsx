"use client";

import { useCallback, useEffect, useId, useState } from "react";
import DataTable, { type Column } from "@/components/portal/DataTable";
import Icon from "@/components/portal/icons";
import { Badge, KeyValue, type Tone } from "@/components/portal/ui";
import { Button, EmptyState, ErrorState, Page, PageHeader, Panel } from "@/components/portal/kit";
import { useToast } from "@/components/portal/toast";
import { fmtRelative } from "@/components/portal/publishing/shared";
import { Counter, Field, TextArea, TextInput } from "@/components/portal/publishing/fields";
import { ContentSkeleton } from "@/components/portal/publishing/skeleton";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

type Block = { id: string; fields: Record<string, string>; updatedAt?: string; updatedByName?: string };

// The announcement keys on the "homepage" block that the public bar reads.
// `announcementScroll` is left out on purpose: AnnouncementBar never reads it. The PUT merge keeps it stored.
const ANNOUNCEMENT_KEYS = ["announcementTag", "announcement", "announcementHref", "announcementLinkLabel"] as const;
type AnnouncementKey = (typeof ANNOUNCEMENT_KEYS)[number];
type Draft = Record<AnnouncementKey, string>;

const EMPTY: Draft = { announcementTag: "", announcement: "", announcementHref: "", announcementLinkLabel: "" };
const LIMIT = { announcement: 140, announcementTag: 24, announcementLinkLabel: 32 } as const;

/** What, if anything, still reads each stored block. Anything else is legacy copy the redesign ignores. */
const BLOCK_USE: Record<string, { label: string; tone: Tone; live?: readonly string[] }> = {
  homepage: { label: "Announcement bar only", tone: "amber", live: [...ANNOUNCEMENT_KEYS] },
  site: { label: "Maintenance mode (Settings)", tone: "green", live: ["maintenance", "maintenanceMessage", "maintenanceEta"] },
  "help-directory": { label: "Help page directory", tone: "green" },
};
const useOf = (id: string) => BLOCK_USE[id] ?? { label: "Not read by the site", tone: "grey" as Tone, live: [] };
const isLiveField = (blockId: string, key: string) => {
  const live = useOf(blockId).live;
  return live === undefined || live.includes(key);
};

const draftFrom = (fields: Record<string, string> = {}): Draft =>
  Object.fromEntries(ANNOUNCEMENT_KEYS.map((k) => [k, fields[k] ?? ""])) as Draft;

/** Same markup and sizes as components/site/AnnouncementBar.tsx, inert. */
function AnnouncementPreview({ draft }: { draft: Draft }) {
  const text = draft.announcement.trim();
  if (!text) return <EmptyState compact icon="eye" title="The bar is hidden" body="Write a message to show it above the site navigation." />;
  const tag = draft.announcementTag.trim();
  const href = draft.announcementHref.trim();
  return (
    <div aria-label="Announcement bar preview" className="overflow-hidden rounded-lg ring-1 ring-mist-200">
      <div className="relative flex min-h-11 items-center justify-center gap-3 bg-navy-900 py-2 pl-4 pr-12 text-center text-[14px] leading-snug text-mist-50 sm:text-[15px]">
        {tag && <span className="inline-flex shrink-0 items-center bg-cyan-500 px-2 py-0.5 text-[13px] font-semibold text-navy-950">{tag}</span>}
        <p className="min-w-0 break-words">
          <span className="text-tide-300">{text}</span>{" "}
          {href && (
            <span className="whitespace-nowrap font-medium text-white underline decoration-cyan-300/60 underline-offset-4">
              {draft.announcementLinkLabel.trim() || "Learn more"}
            </span>
          )}
        </p>
        <span aria-hidden className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center text-tide-300">
          <Icon name="x" className="size-4" />
        </span>
      </div>
      <div aria-hidden className="flex h-16 items-center gap-3 bg-mist-0 px-4">
        <span className="h-3 w-20 rounded bg-mist-200" />
        <span className="ml-auto hidden h-3 w-40 rounded bg-mist-100 sm:block" />
        <span className="h-7 w-20 rounded-md bg-mist-200" />
      </div>
    </div>
  );
}

export default function ContentView() {
  const notify = useToast();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [showBlocks, setShowBlocks] = useState(false);
  const blocksId = useId();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/content", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't load the site content.");
      const list = ((data.blocks as Block[]) || []).sort((a, b) => a.id.localeCompare(b.id));
      setBlocks(list);
      setDraft(draftFrom(list.find((b) => b.id === "homepage")?.fields));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the site content.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const homepage = blocks.find((b) => b.id === "homepage");
  const saved = draftFrom(homepage?.fields);
  const dirty = ANNOUNCEMENT_KEYS.some((k) => draft[k] !== saved[k]);
  useUnsavedChanges(dirty);
  const set = (k: AnnouncementKey) => (v: string) => setDraft((d) => ({ ...d, [k]: v }));

  const tooLong =
    draft.announcementTag.length > LIMIT.announcementTag ||
    draft.announcement.length > LIMIT.announcement ||
    draft.announcementLinkLabel.length > LIMIT.announcementLinkLabel;
  const badHref = !!draft.announcementHref.trim() && !/^(\/|https?:\/\/)/.test(draft.announcementHref.trim());

  /** PUT replaces the block's fields, so the legacy homepage keys go back unchanged. */
  const save = async (next: Draft, undoTo?: Draft) => {
    const clean = Object.fromEntries(ANNOUNCEMENT_KEYS.map((k) => [k, next[k].trim()])) as Draft;
    const fields = { ...(homepage?.fields ?? {}), ...clean };
    setSaving(true);
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "homepage", fields }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "That did not save, so the site is unchanged.");
      const stamp = { updatedAt: new Date().toISOString(), updatedByName: "you" };
      setBlocks((all) =>
        all.some((b) => b.id === "homepage") ? all.map((b) => (b.id === "homepage" ? { ...b, ...stamp, fields } : b)) : [...all, { id: "homepage", fields, ...stamp }],
      );
      setDraft(clean);
      notify(clean.announcement ? "Announcement is live" : "Announcement bar hidden", undoTo ? { undo: () => void save(undoTo) } : undefined);
    } catch (err) {
      notify(err instanceof Error ? err.message : "That did not save, so the site is unchanged.", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const site = blocks.find((b) => b.id === "site")?.fields ?? {};
  const maintenanceOn = site.maintenance === "true";

  const columns: Column<Block>[] = [
    { key: "id", header: "Block", sortable: true, value: (b) => b.id, cell: (b) => <span className="font-medium text-navy-900">{b.id}</span> },
    { key: "use", header: "Used by the site for", sortable: true, value: (b) => useOf(b.id).label, cell: (b) => <Badge tone={useOf(b.id).tone}>{useOf(b.id).label}</Badge> },
    { key: "fields", header: "Fields", sortable: true, numeric: true, hideBelow: "md", value: (b) => Object.keys(b.fields || {}).length, cell: (b) => <span className="tabular-nums">{Object.keys(b.fields || {}).length}</span> },
    {
      key: "updated",
      header: "Last edited",
      sortable: true,
      hideBelow: "md",
      value: (b) => (b.updatedAt ? new Date(b.updatedAt).getTime() : 0),
      cell: (b) => (
        <span className="whitespace-nowrap text-mist-600">
          {fmtRelative(b.updatedAt)}
          {b.updatedByName ? `, ${b.updatedByName}` : ""}
        </span>
      ),
    },
  ];

  const header = (
    <PageHeader
      title="Content"
      icon="layers"
      section="workspace"
      description="The site-wide announcement bar, and what the public site still reads from stored content."
      actions={
        <Button variant="secondary" icon="globe" href="/">
          Open website
        </Button>
      }
    />
  );

  if (loading) {
    return (
      <Page>
        {header}
        <ContentSkeleton header={false} />
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        {header}
        <ErrorState title="Couldn't load the site content" message={`${error} Nothing can be saved until it loads, so live copy is never overwritten.`} onRetry={load} />
      </Page>
    );
  }

  const isLive = !!saved.announcement;

  return (
    <Page>
      {header}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel
          title="Announcement bar"
          description={isLive ? "Showing on every page of the site." : "Hidden. Write a message to show it."}
          action={homepage?.updatedAt && <span className="text-[12px] text-mist-500">Saved {fmtRelative(homepage.updatedAt).toLowerCase()}</span>}
        >
          <div className="grid gap-5">
            <Field
              id="announcement"
              label="Message"
              counter={<Counter value={draft.announcement.length} hard={LIMIT.announcement} />}
              helper="Leave blank to hide the bar."
            >
              <TextArea id="announcement" rows={2} value={draft.announcement} onChange={set("announcement")} placeholder="We're hiring SAP consultants in Columbus" />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="announcementTag" label="Tag" counter={<Counter value={draft.announcementTag.length} hard={LIMIT.announcementTag} />} helper="Optional pill before the message.">
                <TextInput id="announcementTag" value={draft.announcementTag} onChange={set("announcementTag")} placeholder="Now hiring" />
              </Field>
              <Field
                id="announcementLinkLabel"
                label="Link label"
                counter={<Counter value={draft.announcementLinkLabel.length} hard={LIMIT.announcementLinkLabel} />}
                helper="Shown only when there is a link."
              >
                <TextInput id="announcementLinkLabel" value={draft.announcementLinkLabel} onChange={set("announcementLinkLabel")} placeholder="Learn more" />
              </Field>
            </div>
            <Field
              id="announcementHref"
              label="Link"
              error={badHref ? "Start with / for a page on this site, or https:// for another site." : undefined}
              helper={badHref ? undefined : "Optional. A path like /careers, or a full https:// address."}
            >
              <TextInput
                id="announcementHref"
                value={draft.announcementHref}
                onChange={set("announcementHref")}
                placeholder="/careers"
                aria-invalid={badHref || undefined}
                aria-describedby={badHref ? "announcementHref-error" : undefined}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-2 border-t border-mist-200 pt-4">
              <Button icon="check" loading={saving} disabled={!dirty || tooLong || badHref} onClick={() => save(draft)}>
                {draft.announcement.trim() ? "Save and publish" : "Save, bar hidden"}
              </Button>
              <Button variant="ghost" disabled={!dirty || saving} onClick={() => setDraft(saved)}>
                Discard
              </Button>
              {isLive && (
                <Button variant="danger" icon="eye" className="sm:ml-auto" disabled={saving} onClick={() => save({ ...draft, announcement: "" }, saved)}>
                  Hide the bar
                </Button>
              )}
            </div>
          </div>
        </Panel>

        <div className="lg:sticky lg:top-6">
          <Panel title="Preview" description={dirty ? "Unsaved. This is what visitors will see after you save." : "What visitors see now."}>
            <AnnouncementPreview draft={draft} />
            <p className="mt-4 text-[13px] text-mist-600">Saving updates the live site straight away. Visitors who dismissed an earlier message will see a new one.</p>
          </Panel>
        </div>
      </div>

      <Panel
        title="Maintenance mode"
        action={
          <Button size="sm" variant="secondary" icon="settings" href="/portal/settings">
            Change in Settings
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-3 text-[14px] text-navy-900">
          <Badge tone={maintenanceOn ? "red" : "green"} dot>
            {maintenanceOn ? "Site offline" : "Site online"}
          </Badge>
          <span className="min-w-0 text-mist-600">{maintenanceOn ? site.maintenanceMessage || "Showing the default maintenance message." : "Visitors see the public site as normal."}</span>
        </div>
      </Panel>

      <section aria-label="Stored content blocks" className="grid gap-4">
        <button
          type="button"
          aria-expanded={showBlocks}
          aria-controls={blocksId}
          onClick={() => setShowBlocks((v) => !v)}
          className="flex min-h-10 w-full items-start gap-3 rounded-lg text-left"
        >
          <Icon name="chevronDown" className={`mt-1 size-4 shrink-0 text-mist-500 transition-transform duration-200 motion-reduce:transition-none ${showBlocks ? "" : "-rotate-90"}`} />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2 text-[16px] font-semibold text-navy-900">
              Advanced: stored blocks
              <Badge>{blocks.length}</Badge>
            </span>
            <span className="mt-0.5 block max-w-[75ch] text-[14px] text-mist-600">
              The redesigned site takes its page copy from code. Of the stored blocks it reads only the announcement, maintenance mode and the help directory; the rest is kept for reference.
            </span>
          </span>
        </button>
        {showBlocks && (
          <div id={blocksId} className="min-w-0">
            {blocks.length === 0 ? (
              <EmptyState framed variant="first-use" icon="layers" title="No content saved yet" body="Saving the announcement creates the first block." />
            ) : (
              <DataTable
                rows={blocks}
                columns={columns}
                exportName="content-blocks"
                searchPlaceholder="Search blocks"
                detailTitle={(b) => b.id}
                renderDetail={(b) => {
                  const entries = Object.entries(b.fields || {}).sort(([a], [z]) => a.localeCompare(z));
                  return (
                    <div className="grid gap-5">
                      <KeyValue
                        items={[
                          { k: "Used by the site for", v: useOf(b.id).label },
                          { k: "Last edited", v: `${fmtRelative(b.updatedAt)}${b.updatedByName ? `, ${b.updatedByName}` : ""}` },
                        ]}
                      />
                      {entries.length === 0 ? (
                        <EmptyState compact icon="layers" title="No fields stored" />
                      ) : (
                        <ul className="grid gap-2">
                          {entries.map(([k, v]) => (
                            <li key={k} className="rounded-lg bg-mist-50 p-3 ring-1 ring-inset ring-mist-200">
                              <p className="flex items-center justify-between gap-2 text-[12px] font-medium text-mist-600">
                                <span className="min-w-0 break-all">{k}</span>
                                {isLiveField(b.id, k) ? <Badge tone="green">Read by the site</Badge> : <Badge>Not used</Badge>}
                              </p>
                              <p className="mt-1 line-clamp-4 whitespace-pre-wrap break-words text-[13px] text-navy-900">{v || <span className="text-mist-400">Empty</span>}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                      {b.id === "help-directory" && (
                        <a href="/portal/help" className="inline-flex min-h-10 items-center gap-1.5 text-[13px] font-medium text-ocean-700 hover:underline">
                          Edit on the Help page
                          <Icon name="chevronRight" className="size-4" />
                        </a>
                      )}
                    </div>
                  );
                }}
              />
            )}
          </div>
        )}
      </section>
    </Page>
  );
}
