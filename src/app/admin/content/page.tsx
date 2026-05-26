"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Save,
  Eye,
  Home,
  Info,
  Briefcase,
  Phone,
  Edit3,
  Check,
  X,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Trash2,
  Globe,
  Mail,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

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
    icon: Home,
    sections: [
      { id: "hero", label: "Hero Section" },
      { id: "stats", label: "Statistics" },
      { id: "cta", label: "Call to Action" },
    ],
    fields: {
      hero: [
        { key: "announcement", label: "Announcement bar — leave blank to hide", type: "text", placeholder: "e.g. We're hiring across 4 cities — view open roles" },
        { key: "announcementHref", label: "Announcement link (optional)", type: "text", placeholder: "/careers" },
        { key: "announcementScroll", label: "Scroll the announcement (marquee)", type: "toggle" },
        { key: "heroTitle", label: "Headline — blank uses the default", type: "text", placeholder: "The people and platforms behind enterprises and government agencies." },
        { key: "heroSubtitle", label: "Subheadline", type: "textarea", placeholder: "IT staffing, enterprise solutions, and managed services — one accountable partner, one accountable standard." },
        { key: "heroCtaText", label: "Primary CTA Button", type: "text", placeholder: "Start a conversation" },
        { key: "heroCtaSecondary", label: "Secondary CTA Button", type: "text", placeholder: "Explore what we do" },
      ],
      stats: [
        { key: "statsHeading", label: "Section heading", type: "text", placeholder: "Over a decade of delivery, one accountable team." },
        { key: "statsSubtitle", label: "Section subtitle", type: "textarea", placeholder: "Headquartered in Powell, Ohio — trusted by enterprises and state government agencies across North America, held to one standard of delivery." },
        { key: "statYears", label: "Stat 1 — Years delivering", type: "text", placeholder: "13+" },
        { key: "statClients", label: "Stat 2 — Enterprise clients", type: "text", placeholder: "50+" },
        { key: "statRetention", label: "Stat 3 — Client retention", type: "text", placeholder: "98%" },
        { key: "statOffices", label: "Stat 4 — Global offices", type: "text", placeholder: "4" },
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
    icon: Info,
    sections: [
      { id: "main", label: "Hero" },
    ],
    fields: {
      main: [
        { key: "aboutTitle", label: "Headline — blank uses the default", type: "text", placeholder: "We build the technology and teams that move organizations forward." },
        { key: "aboutSubtitle", label: "Subheadline", type: "textarea", placeholder: "A trusted partner for IT staffing, enterprise solutions, and digital transformation." },
      ],
    },
  },
  {
    id: "services",
    name: "Services",
    icon: Briefcase,
    sections: [
      { id: "header", label: "Hero" },
    ],
    fields: {
      header: [
        { key: "servicesTitle", label: "Headline — blank uses the default", type: "text", placeholder: "Talent, technology, and managed services." },
        { key: "servicesSubtitle", label: "Subheadline", type: "textarea", placeholder: "From specialized staffing to enterprise-grade technology services." },
      ],
    },
  },
  {
    id: "contact",
    name: "Contact",
    icon: Phone,
    sections: [
      { id: "info", label: "Hero & Details" },
    ],
    fields: {
      info: [
        { key: "contactTitle", label: "Headline — blank uses the default", type: "text", placeholder: "Let's start a conversation." },
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Edit and publish website content — changes save directly to the database.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            <Eye className="w-4 h-4" />Preview
          </a>
          <button
            onClick={() => savePage(activePage)}
            disabled={isSaving}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isSaved
                ? "bg-emerald-600 text-white"
                : saveError
                ? "bg-rose-600 text-white"
                : "bg-[var(--hz-cobalt)] hover:bg-[var(--hz-cobalt-600)] text-white"
            } disabled:opacity-60`}
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
            ) : isSaved ? (
              <><CheckCircle2 className="w-4 h-4" />Saved!</>
            ) : saveError ? (
              <><AlertCircle className="w-4 h-4" />Retry</>
            ) : (
              <><Save className="w-4 h-4" />Save Changes</>
            )}
          </button>
        </div>
      </div>

      {fetching ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-[var(--hz-cobalt)] animate-spin" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Pages */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden sticky top-24">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Pages</p>
              </div>
              <nav className="p-2 space-y-0.5">
                {PAGES.map((page) => {
                  const Icon = page.icon;
                  const isActive = activePage === page.id;
                  const saved = savedPages.has(page.id);
                  const err = errorPages[page.id];
                  return (
                    <button
                      key={page.id}
                      onClick={() => setActivePage(page.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm ${
                        isActive ? "bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] font-medium" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">{page.name}</span>
                      {saved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                      {err && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                      <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${isActive ? "rotate-90 text-[var(--hz-cobalt)]" : "text-slate-300"}`} />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Sections for current page */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Sections</p>
              </div>
              <nav className="p-2 space-y-0.5">
                {currentPage.sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => { setActiveSection(section.id); setEditingField(null); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-all ${
                      activeSection === section.id ? "bg-slate-100 text-slate-900 font-medium" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeSection === section.id ? "bg-[var(--hz-cobalt)]" : "bg-slate-300"}`} />
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Last saved info */}
            {lastSaved[activePage] && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 px-1">
                <Clock className="w-3 h-3" />
                Last saved at {lastSaved[activePage]}
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="lg:col-span-3 space-y-4">
            {/* Section header */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{currentPage.name}</p>
                  <h2 className="text-lg font-semibold text-slate-900">{currentSection.label}</h2>
                </div>
                {saveError && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5" />{saveError}
                  </div>
                )}
              </div>

              <div className="divide-y divide-slate-100">
                {currentFields.map((fieldDef) => {
                  const fieldKey = `${activePage}.${fieldDef.key}`;
                  const isEditing = editingField === fieldKey;
                  const value = getVal(activePage, fieldDef.key);
                  const isLong = fieldDef.type === "textarea";

                  if (fieldDef.type === "toggle") {
                    const on = value === "true";
                    return (
                      <div key={fieldDef.key} className="flex items-center justify-between gap-4 px-5 py-4">
                        <label className="text-sm font-medium text-slate-700">{fieldDef.label}</label>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={on}
                          onClick={() =>
                            setContent((prev) => ({
                              ...prev,
                              [activePage]: { ...(prev[activePage] || {}), [fieldDef.key]: on ? "false" : "true" },
                            }))
                          }
                          className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors ${on ? "bg-[var(--hz-cobalt)]" : "bg-slate-200"}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={fieldDef.key} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">{fieldDef.label}</label>
                          {isEditing ? (
                            <div className="space-y-2">
                              {isLong ? (
                                <textarea
                                  value={tempValue}
                                  onChange={(e) => setTempValue(e.target.value)}
                                  rows={4}
                                  autoFocus
                                  className="w-full px-3 py-2.5 text-sm border border-[var(--hz-cobalt)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(29,78,216,0.2)] resize-y"
                                />
                              ) : (
                                <input
                                  type={fieldDef.type === "text" ? "text" : fieldDef.type}
                                  value={tempValue}
                                  onChange={(e) => setTempValue(e.target.value)}
                                  autoFocus
                                  placeholder={fieldDef.placeholder}
                                  className="w-full px-3 py-2.5 text-sm border border-[var(--hz-cobalt)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(29,78,216,0.2)]"
                                />
                              )}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => commitEdit(activePage, fieldDef.key)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--hz-cobalt)] text-white text-sm rounded-lg hover:bg-[var(--hz-cobalt-600)] transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />Apply
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => startEdit(activePage, fieldDef.key)}
                              className="group cursor-text"
                            >
                              {value ? (
                                <p className={`text-slate-900 text-sm leading-relaxed group-hover:bg-slate-50 rounded px-2 py-1 -mx-2 transition-colors ${isLong ? "whitespace-pre-wrap" : "truncate"}`}>
                                  {value}
                                </p>
                              ) : (
                                <p className="text-slate-400 text-sm italic group-hover:bg-slate-50 rounded px-2 py-1 -mx-2 transition-colors">
                                  {fieldDef.placeholder || "Click to add…"}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        {!isEditing && (
                          <button
                            onClick={() => startEdit(activePage, fieldDef.key)}
                            className="p-2 text-slate-300 hover:text-[var(--hz-cobalt)] hover:bg-[var(--hz-cobalt-100)] rounded-lg transition-colors flex-shrink-0"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save button (bottom) */}
            <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/80 px-5 py-3">
              <p className="text-xs text-slate-400">
                {lastSaved[activePage]
                  ? `Changes last saved at ${lastSaved[activePage]}`
                  : "Unsaved changes will be lost if you leave without saving."}
              </p>
              <button
                onClick={() => savePage(activePage)}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--hz-cobalt)] hover:bg-[var(--hz-cobalt-600)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? "Saving…" : "Save Page"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
