"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { IconSave, IconEye, IconAlert } from "@/components/admin/icons";
import { useAuth } from "@/lib/auth/AuthContext";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { PageHeader } from "@/components/admin/page-header";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { FormActionBar, NotePanel, WorkspaceButton } from "@/components/admin/workspace";
import { Field, FormInput, FormTextarea } from "@/components/admin/forms/primitives";
import { PeriodSwitcher } from "@/components/admin/charts";
import { fmtRelative } from "@/lib/format";
import { Skel } from "@/components/admin/skeletons";
import { cn } from "@/lib/utils";

// ─── Schema ────────────────────────────────────────────────────────────────

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "email" | "tel" | "url" | "toggle";
  /** Shown beside the label. */
  hint?: string;
  placeholder?: string;
  /** Spans both columns. */
  wide?: boolean;
}

interface SectionDef {
  id: string;
  label: string;
}

interface PageDef {
  id: string;
  name: string;
  /** The public page this copy appears on. */
  path: string;
  sections: SectionDef[];
  fields: Record<string, FieldDef[]>;
}

const PAGES: PageDef[] = [
  {
    id: "homepage",
    name: "Homepage",
    path: "/",
    sections: [
      { id: "hero", label: "Hero section" },
      { id: "stats", label: "Statistics" },
      { id: "cta", label: "Call to action" },
    ],
    fields: {
      hero: [
        { key: "announcement", label: "Announcement bar", hint: "Blank hides it", type: "text", wide: true, placeholder: "e.g. We're hiring across 4 cities, view open roles" },
        { key: "announcementHref", label: "Announcement link", hint: "Optional", type: "text", placeholder: "/careers" },
        { key: "announcementScroll", label: "Scroll the announcement", type: "toggle" },
        { key: "heroTitle", label: "Headline", type: "text", wide: true, placeholder: "The people and platforms behind enterprises and government agencies." },
        { key: "heroSubtitle", label: "Subheadline", type: "textarea", placeholder: "IT staffing, enterprise solutions, and managed services, one accountable partner, one accountable standard." },
        { key: "heroCtaText", label: "Primary button", type: "text", placeholder: "Start a conversation" },
        { key: "heroCtaSecondary", label: "Secondary button", type: "text", placeholder: "Explore what we do" },
      ],
      stats: [
        { key: "statsHeading", label: "Section heading", type: "text", wide: true, placeholder: "Over a decade of delivery, one accountable team." },
        { key: "statsSubtitle", label: "Section subtitle", type: "textarea", placeholder: "Headquartered in Powell, Ohio, trusted by enterprises and state government agencies across North America, held to one standard of delivery." },
        { key: "statYears", label: "Years delivering", type: "text", placeholder: "13+" },
        { key: "statClients", label: "Enterprise clients", type: "text", placeholder: "50+" },
        { key: "statRetention", label: "Client retention", type: "text", placeholder: "98%" },
        { key: "statOffices", label: "Global offices", type: "text", placeholder: "4" },
      ],
      cta: [
        { key: "ctaHeading", label: "Heading", type: "text", wide: true, placeholder: "Ready to transform your business?" },
        { key: "ctaBody", label: "Body text", type: "textarea", placeholder: "Contact us today…" },
        { key: "ctaButton", label: "Button label", type: "text", placeholder: "Schedule a Consultation" },
      ],
    },
  },
  {
    id: "about",
    name: "About",
    path: "/about",
    sections: [
      { id: "main", label: "Hero" },
    ],
    fields: {
      main: [
        { key: "aboutTitle", label: "Headline", type: "text", wide: true, placeholder: "We build the technology and teams that move organizations forward." },
        { key: "aboutSubtitle", label: "Subheadline", type: "textarea", placeholder: "A trusted partner for IT staffing, enterprise solutions, and digital transformation." },
      ],
    },
  },
  {
    id: "services",
    name: "Solutions",
    path: "/solutions",
    sections: [
      { id: "header", label: "Hero" },
    ],
    fields: {
      header: [
        { key: "servicesTitle", label: "Headline", type: "text", wide: true, placeholder: "Talent, technology, and managed services." },
        { key: "servicesSubtitle", label: "Subheadline", type: "textarea", placeholder: "From specialized staffing to enterprise-grade technology services." },
      ],
    },
  },
  {
    id: "contact",
    name: "Contact",
    path: "/contact",
    sections: [
      { id: "info", label: "Hero and details" },
    ],
    fields: {
      info: [
        { key: "contactTitle", label: "Headline", type: "text", wide: true, placeholder: "Let's start a conversation." },
        { key: "contactSubtitle", label: "Subheadline", type: "textarea", placeholder: "A question about our services, a custom solution, or a partnership." },
        { key: "contactPhone", label: "Phone", type: "tel", placeholder: "+1 (614) 844-6925" },
        { key: "contactEmail", label: "Email", type: "email", placeholder: "hr@oceanbluecorp.com" },
        { key: "contactAddress", label: "Address", type: "text", wide: true, placeholder: "9775 Fairway Drive, Suite C, Powell, OH 43065" },
        { key: "contactHours", label: "Business hours", type: "text", placeholder: "8:00 AM – 5:00 PM EST" },
      ],
    },
  },
];

// Intentionally empty: a blank field means "use the site's built-in copy".
// (The page components hold the real default text and fall back to it when a
// field is empty.) This keeps the editor and the live site in sync, saving a
// page never overwrites unedited copy with generic placeholder text. The
// helpful guidance text lives in each field's `placeholder`.
const DEFAULT_FIELDS: Record<string, string> = {};

function ContentSkeleton() {
  return (
    <div className="max-w-4xl space-y-4" role="status" aria-busy="true" aria-label="Loading site content">
      <Skel className="h-9 w-80 max-w-full rounded-[10px]" />
      {[4, 3].map((n, k) => (
        <AdminCard key={k} className="overflow-hidden">
          <div className="border-b border-[var(--adm-line-soft)] px-4 py-3"><Skel className="h-4 w-32" /></div>
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            {Array.from({ length: n }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skel className="h-3.5 w-28" />
                <Skel className="h-9 w-full" />
              </div>
            ))}
          </div>
        </AdminCard>
      ))}
    </div>
  );
}

/** On/off field. The label is the control's name; the row is the hit area. */
function ToggleRow({ id, label, on, onChange }: { id: string; label: string; on: boolean; onChange: (next: boolean) => void }) {
  return (
    <div className="col-span-full flex items-center justify-between gap-4 rounded-[10px] border border-[var(--adm-line-soft)] bg-[var(--adm-surface-sunken)] px-3.5 py-2.5">
      <label htmlFor={id} className="text-[14px] font-medium text-[var(--adm-ink)]">{label}</label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={cn(
          "relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors duration-150",
          on ? "bg-[var(--adm-accent)]" : "bg-[var(--adm-line-strong)]",
        )}
      >
        <span className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-[var(--adm-shadow-sm)] transition-transform duration-150",
          on ? "translate-x-5" : "translate-x-0.5",
        )} />
      </button>
    </div>
  );
}

type PageContent = Record<string, string>;
const same = (a: PageContent = {}, b: PageContent = {}) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) if ((a[k] ?? "") !== (b[k] ?? "")) return false;
  return true;
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function ContentPage() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState("homepage");

  // content[pageId][fieldKey] is what is on screen; `saved` is what the database holds.
  const [content, setContent] = useState<Record<string, PageContent>>({});
  const [saved, setSaved] = useState<Record<string, PageContent>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Record<string, Date>>({});
  const [fetching, setFetching] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/content");
        if (!res.ok) throw new Error("Failed to load content");
        const data = await res.json();
        const blocks = data.blocks as { id: string; fields: PageContent }[];
        const merged: Record<string, PageContent> = {};
        blocks.forEach((block) => { merged[block.id] = { ...DEFAULT_FIELDS, ...block.fields }; });
        PAGES.forEach((page) => { merged[page.id] ??= { ...DEFAULT_FIELDS }; });
        setContent(merged);
        setSaved(merged);
      } catch (err) {
        // Empty fields are shown, and saving them would overwrite live copy, so saving is off.
        console.error("Failed to load site content:", err);
        setLoadFailed(true);
        const empty: Record<string, PageContent> = {};
        PAGES.forEach((page) => { empty[page.id] = { ...DEFAULT_FIELDS }; });
        setContent(empty);
        setSaved(empty);
      } finally {
        setFetching(false);
      }
    };
    load();
  }, []);

  const dirtyPages = PAGES.filter((p) => !same(content[p.id], saved[p.id])).map((p) => p.id);
  const dirty = dirtyPages.includes(activePage);
  const anyDirty = dirtyPages.length > 0;

  useUnsavedChanges(anyDirty);

  const setField = (key: string, value: string) =>
    setContent((prev) => ({ ...prev, [activePage]: { ...(prev[activePage] || {}), [key]: value } }));

  const discard = () => {
    setContent((prev) => ({ ...prev, [activePage]: { ...(saved[activePage] || {}) } }));
    setSaveError(null);
  };

  const savePage = useCallback(async () => {
    const pageId = activePage;
    const fields = content[pageId] || {};
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pageId,
          fields,
          updatedBy: user?.id,
          updatedByName: user?.name || user?.email || "Admin",
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved((prev) => ({ ...prev, [pageId]: { ...fields } }));
      setSavedAt((prev) => ({ ...prev, [pageId]: new Date() }));
      toast.success(`${PAGES.find((p) => p.id === pageId)?.name} copy is live`);
    } catch {
      setSaveError("That did not save, so the live site is unchanged. Try again.");
    } finally {
      setSaving(false);
    }
  }, [activePage, content, user]);

  const page = PAGES.find((p) => p.id === activePage)!;
  const values = content[activePage] || {};

  return (
    <div>
      <PageHeader
        title="Content"
        info="The copy on the public site. A blank field uses the built-in wording. Saving puts the page live."
        actions={
          <WorkspaceButton asChild>
            <a href={page.path} target="_blank" rel="noopener noreferrer">
              <IconEye className="h-4 w-4" />View live page
            </a>
          </WorkspaceButton>
        }
      />

      {fetching ? (
        <ContentSkeleton />
      ) : (
        <div className="max-w-4xl space-y-4">
          {loadFailed && (
            <NotePanel className="flex items-start gap-2.5">
              <IconAlert className="mt-0.5 h-4 w-4 flex-none text-[var(--adm-danger-ink)]" />
              The saved copy could not be loaded, so these fields are empty and saving is off. Refresh to try again.
            </NotePanel>
          )}

          <div className="adm-scroll-hidden -mx-1 max-w-full overflow-x-auto px-1">
            <PeriodSwitcher
              label="Page"
              value={activePage}
              onChange={(id) => { setActivePage(id); setSaveError(null); }}
              options={PAGES.map((p) => ({ value: p.id, label: dirtyPages.includes(p.id) ? `${p.name} •` : p.name }))}
            />
          </div>

          {page.sections.map((section) => (
            <AdminCard key={section.id}>
              <AdminCardHeader title={section.label} />
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                {(page.fields[section.id] || []).map((f) => {
                  const id = `${activePage}-${f.key}`;
                  const value = values[f.key] ?? "";
                  if (f.type === "toggle") {
                    return <ToggleRow key={f.key} id={id} label={f.label} on={value === "true"} onChange={(next) => setField(f.key, next ? "true" : "false")} />;
                  }
                  return (
                    <Field key={f.key} label={f.label} hint={f.hint} htmlFor={id} fullWidth={f.type === "textarea" || f.wide}>
                      {f.type === "textarea" ? (
                        <FormTextarea id={id} rows={3} value={value} placeholder={f.placeholder} onChange={(e) => setField(f.key, e.target.value)} />
                      ) : (
                        <FormInput id={id} type={f.type} value={value} placeholder={f.placeholder} onChange={(e) => setField(f.key, e.target.value)} />
                      )}
                    </Field>
                  );
                })}
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <FormActionBar
        dirty={dirty}
        message={
          saveError ? (
            <span role="alert" className="inline-flex items-center gap-2 font-medium text-[var(--adm-danger-ink)]">
              <IconAlert className="h-4 w-4 flex-none" />{saveError}
            </span>
          ) : !dirty && savedAt[activePage] ? (
            <span role="status">Saved {fmtRelative(savedAt[activePage]).toLowerCase()}</span>
          ) : undefined
        }
      >
        <WorkspaceButton onClick={discard} disabled={!dirty || saving}>Discard</WorkspaceButton>
        <WorkspaceButton variant="primary" onClick={savePage} disabled={!dirty || saving || loadFailed}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <IconSave className="h-4 w-4" />}
          {saving ? "Saving…" : `Save ${page.name.toLowerCase()}`}
        </WorkspaceButton>
      </FormActionBar>
    </div>
  );
}
