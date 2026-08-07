"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, Loader2 } from "lucide-react";
import {
  IconSave,
  IconEye,
  IconFile,
  IconHome,
  IconInfo,
  IconJob,
  IconPhone,
  IconEdit,
  IconSuccess,
  IconAlert,
  IconClock,
} from "@/components/admin/icons";
import { useAuth } from "@/lib/auth/AuthContext";
import { PageHeader, PageHeaderButton } from "@/components/admin/page-header";
import { AdminCard } from "@/components/admin/admin-card";
import { cn } from "@/lib/utils";

// ─── Schema ────────────────────────────────────────────────────────────────

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "email" | "tel" | "url" | "toggle";
  placeholder?: string;
}

interface SectionDef {
  id: string;
  label: string;
}

interface PageDef {
  id: string;
  name: string;
  icon: React.FC<{ className?: string }>;
  sections: SectionDef[];
  fields: Record<string, FieldDef[]>;
}

const PAGES: PageDef[] = [
  {
    id: "homepage",
    name: "Homepage",
    icon: IconHome,
    sections: [
      { id: "hero", label: "Hero Section" },
      { id: "anniversary", label: "Anniversary" },
      { id: "stats", label: "Statistics" },
      { id: "cta", label: "Call to Action" },
    ],
    fields: {
      hero: [
        { key: "announcement", label: "Announcement bar, leave blank to hide", type: "text", placeholder: "e.g. We're hiring across 4 cities, view open roles" },
        { key: "announcementHref", label: "Announcement link (optional)", type: "text", placeholder: "/careers" },
        { key: "announcementScroll", label: "Scroll the announcement (marquee)", type: "toggle" },
        { key: "heroTitle", label: "Headline, blank uses the default", type: "text", placeholder: "The people and platforms behind enterprises and government agencies." },
        { key: "heroSubtitle", label: "Subheadline", type: "textarea", placeholder: "IT staffing, enterprise solutions, and managed services, one accountable partner, one accountable standard." },
        { key: "heroCtaText", label: "Primary CTA Button", type: "text", placeholder: "Start a conversation" },
        { key: "heroCtaSecondary", label: "Secondary CTA Button", type: "text", placeholder: "Explore what we do" },
      ],
      // TEMPORARY — the 13-year celebration band. Delete this section with
      // src/components/landing/anniversary/. The toggle is the kill switch:
      // off hides the band immediately, and with it left untouched the band
      // retires itself after the celebration window (see lib/anniversary.ts).
      anniversary: [
        { key: "anniversary", label: "Show the 13-year celebration band", type: "toggle" },
        { key: "anniversaryHeading", label: "Heading, blank uses the default", type: "text", placeholder: "Ocean Blue turns 13" },
        { key: "anniversaryTagline", label: "Tagline", type: "text", placeholder: "Celebrating 13 years of innovation, trust, and excellence." },
        { key: "anniversaryThanks", label: "Thank-you line", type: "textarea", placeholder: "Thank you to our employees, clients, and partners for being part of our journey." },
        { key: "anniversaryCtaText", label: "Button label", type: "text", placeholder: "Read our 13-year story" },
      ],
      stats: [
        { key: "statsHeading", label: "Section heading", type: "text", placeholder: "Over a decade of delivery, one accountable team." },
        { key: "statsSubtitle", label: "Section subtitle", type: "textarea", placeholder: "Headquartered in Powell, Ohio, trusted by enterprises and state government agencies across North America, held to one standard of delivery." },
        { key: "statYears", label: "Stat 1, Years delivering", type: "text", placeholder: "13+" },
        { key: "statClients", label: "Stat 2, Enterprise clients", type: "text", placeholder: "50+" },
        { key: "statRetention", label: "Stat 3, Client retention", type: "text", placeholder: "98%" },
        { key: "statOffices", label: "Stat 4, Global offices", type: "text", placeholder: "4" },
      ],
      cta: [
        { key: "ctaHeading", label: "CTA Heading", type: "text", placeholder: "Ready to transform your business?" },
        { key: "ctaBody", label: "CTA Body Text", type: "textarea", placeholder: "Contact us today…" },
        { key: "ctaButton", label: "CTA Button Label", type: "text", placeholder: "Schedule a Consultation" },
      ],
    },
  },
  {
    id: "about",
    name: "About",
    icon: IconInfo,
    sections: [
      { id: "main", label: "Hero" },
    ],
    fields: {
      main: [
        { key: "aboutTitle", label: "Headline, blank uses the default", type: "text", placeholder: "We build the technology and teams that move organizations forward." },
        { key: "aboutSubtitle", label: "Subheadline", type: "textarea", placeholder: "A trusted partner for IT staffing, enterprise solutions, and digital transformation." },
      ],
    },
  },
  {
    id: "services",
    name: "Services",
    icon: IconJob,
    sections: [
      { id: "header", label: "Hero" },
    ],
    fields: {
      header: [
        { key: "servicesTitle", label: "Headline, blank uses the default", type: "text", placeholder: "Talent, technology, and managed services." },
        { key: "servicesSubtitle", label: "Subheadline", type: "textarea", placeholder: "From specialized staffing to enterprise-grade technology services." },
      ],
    },
  },
  {
    id: "contact",
    name: "Contact",
    icon: IconPhone,
    sections: [
      { id: "info", label: "Hero & Details" },
    ],
    fields: {
      info: [
        { key: "contactTitle", label: "Headline, blank uses the default", type: "text", placeholder: "Let's start a conversation." },
        { key: "contactSubtitle", label: "Subheadline", type: "textarea", placeholder: "A question about our services, a custom solution, or a partnership." },
        { key: "contactPhone", label: "Phone (Call us card)", type: "tel", placeholder: "+1 (614) 844-6925" },
        { key: "contactEmail", label: "Email (Email us card)", type: "email", placeholder: "hr@oceanbluecorp.com" },
        { key: "contactAddress", label: "Address (Visit us card)", type: "text", placeholder: "9775 Fairway Drive, Suite C, Powell, OH 43065" },
        { key: "contactHours", label: "Business hours card", type: "text", placeholder: "8:00 AM – 5:00 PM EST" },
      ],
    },
  },
];

// Intentionally empty: a blank field means "use the site's built-in copy".
// (The page components hold the real default text and fall back to it when a
// field is empty.) This keeps the editor and the live site in sync — saving a
// page never overwrites unedited copy with generic placeholder text. The
// helpful guidance text lives in each field's `placeholder`.
const DEFAULT_FIELDS: Record<string, string> = {};

/** Uppercase micro-label that titles a nav panel. */
function NavLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-[var(--adm-line)] px-4 py-2.5">
      <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[var(--adm-head-ink)]">
        {children}
      </p>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ContentPage() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState("homepage");
  const [activeSection, setActiveSection] = useState("hero");

  // content[pageId][fieldKey] = value
  const [content, setContent] = useState<Record<string, Record<string, string>>>({});
  const [loadingPages, setLoadingPages] = useState<Set<string>>(new Set());
  const [savedPages, setSavedPages] = useState<Set<string>>(new Set());
  const [errorPages, setErrorPages] = useState<Record<string, string>>({});
  const [lastSaved, setLastSaved] = useState<Record<string, string>>({});
  const [fetching, setFetching] = useState(true);

  // Edit state
  const [editingField, setEditingField] = useState<string | null>(null); // "pageId.fieldKey"
  const [tempValue, setTempValue] = useState("");

  // ── Load all content on mount ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setFetching(true);
        const res = await fetch("/api/content");
        if (!res.ok) throw new Error("Failed to load content");
        const data = await res.json();
        const blocks = data.blocks as { id: string; fields: Record<string, string> }[];

        const merged: Record<string, Record<string, string>> = {};
        blocks.forEach((block) => {
          merged[block.id] = { ...DEFAULT_FIELDS, ...block.fields };
        });

        // Ensure every page has defaults
        PAGES.forEach((page) => {
          if (!merged[page.id]) {
            merged[page.id] = { ...DEFAULT_FIELDS };
          }
        });

        setContent(merged);
      } catch {
        // Fall back to defaults on error
        const defaults: Record<string, Record<string, string>> = {};
        PAGES.forEach((page) => { defaults[page.id] = { ...DEFAULT_FIELDS }; });
        setContent(defaults);
      } finally {
        setFetching(false);
      }
    };
    load();
  }, []);

  // Switch section when page changes
  useEffect(() => {
    const page = PAGES.find((p) => p.id === activePage);
    if (page) setActiveSection(page.sections[0].id);
    setEditingField(null);
  }, [activePage]);

  // ── Field helpers ────────────────────────────────────────────────────────
  const getVal = (pageId: string, key: string) =>
    content[pageId]?.[key] ?? DEFAULT_FIELDS[key] ?? "";

  const startEdit = (pageId: string, key: string) => {
    setEditingField(`${pageId}.${key}`);
    setTempValue(getVal(pageId, key));
  };

  const commitEdit = (pageId: string, key: string) => {
    setContent((prev) => ({
      ...prev,
      [pageId]: { ...(prev[pageId] || {}), [key]: tempValue },
    }));
    setEditingField(null);
  };

  const cancelEdit = () => setEditingField(null);

  // ── Save a page block to DB ──────────────────────────────────────────────
  const savePage = useCallback(async (pageId: string) => {
    setLoadingPages((prev) => new Set(prev).add(pageId));
    setErrorPages((prev) => { const n = { ...prev }; delete n[pageId]; return n; });
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pageId,
          fields: content[pageId] || {},
          updatedBy: user?.id,
          updatedByName: user?.name || user?.email || "Admin",
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSavedPages((prev) => new Set(prev).add(pageId));
      setLastSaved((prev) => ({ ...prev, [pageId]: new Date().toLocaleTimeString() }));
      setTimeout(() => setSavedPages((prev) => { const n = new Set(prev); n.delete(pageId); return n; }), 3000);
    } catch {
      setErrorPages((prev) => ({ ...prev, [pageId]: "Failed to save. Please try again." }));
    } finally {
      setLoadingPages((prev) => { const n = new Set(prev); n.delete(pageId); return n; });
    }
  }, [content, user]);

  // ── Render ───────────────────────────────────────────────────────────────
  const currentPage = PAGES.find((p) => p.id === activePage)!;
  // Fall back to the first section: when switching pages, activeSection may
  // briefly hold a section id that doesn't exist on the new page.
  const currentSection = currentPage.sections.find((s) => s.id === activeSection) ?? currentPage.sections[0];
  const currentFields = currentPage.fields[currentSection.id] || [];

  const isSaving = loadingPages.has(activePage);
  const isSaved = savedPages.has(activePage);
  const saveError = errorPages[activePage];

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Content"
        subtitle="Edit and publish website copy, changes save straight to the database."
        icon={IconFile}
        actions={
          <>
            <PageHeaderButton variant="secondary" asChild>
              <a href="/" target="_blank" rel="noopener noreferrer">
                <IconEye className="h-4 w-4" />Preview
              </a>
            </PageHeaderButton>
            <PageHeaderButton
              variant="primary"
              onClick={() => savePage(activePage)}
              disabled={isSaving}
              className={cn(
                isSaved && "bg-emerald-600 hover:bg-emerald-700",
                saveError && "bg-rose-600 hover:bg-rose-700",
              )}
            >
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
              ) : isSaved ? (
                <><IconSuccess className="h-4 w-4" />Saved</>
              ) : saveError ? (
                <><IconAlert className="h-4 w-4" />Retry</>
              ) : (
                <><IconSave className="h-4 w-4" />Save changes</>
              )}
            </PageHeaderButton>
          </>
        }
      />

      {fetching ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--adm-accent)]" />
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[236px_minmax(0,1fr)]">

          {/* ── Section nav — sticks while the editor scrolls ── */}
          <div className="space-y-4 lg:sticky lg:top-[76px]">
            <AdminCard className="overflow-hidden">
              <NavLabel>Pages</NavLabel>
              <nav className="p-1.5">
                {PAGES.map((page) => {
                  const Icon = page.icon;
                  const isActive = activePage === page.id;
                  const saved = savedPages.has(page.id);
                  const err = errorPages[page.id];
                  return (
                    <button
                      key={page.id}
                      onClick={() => setActivePage(page.id)}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left text-[13px] transition-colors",
                        isActive
                          ? "bg-[var(--adm-accent-soft)] font-semibold text-[var(--adm-accent)]"
                          : "text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]",
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{page.name}</span>
                      {saved && <IconSuccess className="h-3.5 w-3.5 flex-none text-[var(--adm-success)]" />}
                      {err && <IconAlert className="h-3.5 w-3.5 flex-none text-[var(--adm-danger)]" />}
                    </button>
                  );
                })}
              </nav>
            </AdminCard>

            <AdminCard className="overflow-hidden">
              <NavLabel>Sections</NavLabel>
              <nav className="p-1.5">
                {currentPage.sections.map((section) => {
                  const isActive = currentSection.id === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => { setActiveSection(section.id); setEditingField(null); }}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "relative flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left text-[13px] transition-colors",
                        isActive
                          ? "bg-[var(--adm-surface-2)] font-semibold text-[var(--adm-ink)]"
                          : "text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]",
                      )}
                    >
                      <span className={cn(
                        "h-1.5 w-1.5 flex-shrink-0 rounded-full",
                        isActive ? "bg-[var(--adm-accent)]" : "bg-[var(--adm-line-strong)]",
                      )} />
                      <span className="truncate">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </AdminCard>

            {lastSaved[activePage] && (
              <p className="flex items-center gap-1.5 px-1 text-[12px] text-[var(--adm-ink-subtle)]">
                <IconClock className="h-3 w-3" />
                Last saved at <span className="tabular-nums">{lastSaved[activePage]}</span>
              </p>
            )}
          </div>

          {/* ── Editor ── */}
          <AdminCard className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--adm-line)] px-5 py-3.5">
              <div className="min-w-0">
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[var(--adm-ink-subtle)]">
                  {currentPage.name}
                </p>
                <h2 className="truncate text-[15px] font-semibold text-[var(--adm-ink)]">{currentSection.label}</h2>
              </div>
              {saveError && (
                <span className="inline-flex flex-none items-center gap-1.5 rounded-[4px] bg-[var(--adm-danger-soft)] px-2.5 py-1 text-[12px] font-semibold text-[var(--adm-danger)]">
                  <IconAlert className="h-3.5 w-3.5" />{saveError}
                </span>
              )}
            </div>

            <div className="divide-y divide-[var(--adm-line-soft)]">
              {currentFields.map((fieldDef) => {
                const fieldKey = `${activePage}.${fieldDef.key}`;
                const isEditing = editingField === fieldKey;
                const value = getVal(activePage, fieldDef.key);
                const isLong = fieldDef.type === "textarea";

                if (fieldDef.type === "toggle") {
                  const on = value === "true";
                  return (
                    <div key={fieldDef.key} className="flex items-center justify-between gap-4 px-5 py-4">
                      <label className="text-[13px] font-semibold text-[var(--adm-ink-mute)]">{fieldDef.label}</label>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        aria-label={fieldDef.label}
                        onClick={() =>
                          setContent((prev) => ({
                            ...prev,
                            [activePage]: { ...(prev[activePage] || {}), [fieldDef.key]: on ? "false" : "true" },
                          }))
                        }
                        className={cn(
                          "relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors",
                          on ? "bg-[var(--adm-accent)]" : "bg-[var(--adm-line-strong)]",
                        )}
                      >
                        <span className={cn(
                          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                          on ? "translate-x-5" : "translate-x-0.5",
                        )} />
                      </button>
                    </div>
                  );
                }

                return (
                  <div key={fieldDef.key} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <label className="mb-1.5 block text-[13px] font-semibold text-[var(--adm-ink-mute)]">{fieldDef.label}</label>
                        {isEditing ? (
                          <div className="space-y-2">
                            {isLong ? (
                              <textarea
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                rows={4}
                                autoFocus
                                placeholder={fieldDef.placeholder}
                                className="w-full resize-y rounded-[8px] border border-[var(--adm-accent)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)]"
                              />
                            ) : (
                              <input
                                type={fieldDef.type === "text" ? "text" : fieldDef.type}
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                autoFocus
                                placeholder={fieldDef.placeholder}
                                className="w-full rounded-[8px] border border-[var(--adm-accent)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)]"
                              />
                            )}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => commitEdit(activePage, fieldDef.key)}
                                className="inline-flex items-center gap-1 rounded-[6px] bg-[var(--adm-accent)] px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--adm-accent-strong)]"
                              >
                                <Check className="h-3.5 w-3.5" />Apply
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-3 py-1.5 text-[13px] font-semibold text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)]"
                              >
                                <X className="h-3.5 w-3.5" />Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div onClick={() => startEdit(activePage, fieldDef.key)} className="group cursor-text">
                            {value ? (
                              <p className={cn(
                                "-mx-2 rounded-[4px] px-2 py-1 text-sm leading-relaxed text-[var(--adm-ink)] transition-colors group-hover:bg-[var(--adm-row-hover)]",
                                isLong ? "whitespace-pre-wrap" : "truncate",
                              )}>
                                {value}
                              </p>
                            ) : (
                              <p className="-mx-2 rounded-[4px] px-2 py-1 text-sm italic text-[var(--adm-ink-subtle)] transition-colors group-hover:bg-[var(--adm-row-hover)]">
                                {fieldDef.placeholder || "Click to add…"}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      {!isEditing && (
                        <button
                          onClick={() => startEdit(activePage, fieldDef.key)}
                          aria-label={`Edit ${fieldDef.label}`}
                          className="flex-shrink-0 rounded-[6px] p-2 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-accent-soft)] hover:text-[var(--adm-accent)]"
                          title="Edit"
                        >
                          <IconEdit className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save bar — the sheet's own footer, not a floating card. */}
            <div className="flex items-center justify-between gap-3 border-t border-[var(--adm-line)] bg-[var(--adm-zebra)] px-5 py-3">
              <p className="text-[12.5px] text-[var(--adm-ink-subtle)]">
                {lastSaved[activePage]
                  ? <>Changes last saved at <span className="tabular-nums">{lastSaved[activePage]}</span></>
                  : "Unsaved changes will be lost if you leave without saving."}
              </p>
              <PageHeaderButton variant="primary" onClick={() => savePage(activePage)} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconSave className="h-4 w-4" />}
                {isSaving ? "Saving…" : "Save Page"}
              </PageHeaderButton>
            </div>
          </AdminCard>
        </div>
      )}
    </div>
  );
}
