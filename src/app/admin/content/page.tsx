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
  type: "text" | "textarea" | "email" | "tel" | "url";
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
        { key: "heroTitle", label: "Headline", type: "text", placeholder: "Transform Your Business…" },
        { key: "heroSubtitle", label: "Subheadline", type: "textarea", placeholder: "Leading provider of…" },
        { key: "heroCtaText", label: "Primary CTA Button", type: "text", placeholder: "Get Started" },
        { key: "heroCtaSecondary", label: "Secondary CTA Button", type: "text", placeholder: "Learn More" },
      ],
      stats: [
        { key: "statsClients", label: "Enterprise Clients", type: "text", placeholder: "500+" },
        { key: "statsYears", label: "Years of Excellence", type: "text", placeholder: "15+" },
        { key: "statsLocations", label: "Global Locations", type: "text", placeholder: "25+" },
        { key: "statsSatisfaction", label: "Client Satisfaction", type: "text", placeholder: "98%" },
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
      { id: "main", label: "About Page" },
      { id: "values", label: "Core Values" },
    ],
    fields: {
      main: [
        { key: "aboutTitle", label: "Page Title", type: "text", placeholder: "About Ocean Blue" },
        { key: "aboutMission", label: "Mission Statement", type: "textarea", placeholder: "Our mission is…" },
        { key: "aboutVision", label: "Vision Statement", type: "textarea", placeholder: "Our vision is…" },
        { key: "aboutDescription", label: "Company Description", type: "textarea", placeholder: "Ocean Blue Corporation is…" },
        { key: "aboutFoundedYear", label: "Founded Year", type: "text", placeholder: "2009" },
        { key: "aboutHeadquarters", label: "Headquarters", type: "text", placeholder: "Powell, OH" },
      ],
      values: [
        { key: "value1Title", label: "Value 1 Title", type: "text", placeholder: "Innovation" },
        { key: "value1Desc", label: "Value 1 Description", type: "textarea", placeholder: "" },
        { key: "value2Title", label: "Value 2 Title", type: "text", placeholder: "Integrity" },
        { key: "value2Desc", label: "Value 2 Description", type: "textarea", placeholder: "" },
        { key: "value3Title", label: "Value 3 Title", type: "text", placeholder: "Excellence" },
        { key: "value3Desc", label: "Value 3 Description", type: "textarea", placeholder: "" },
      ],
    },
  },
  {
    id: "services",
    name: "Services",
    icon: Briefcase,
    sections: [
      { id: "header", label: "Page Header" },
      { id: "offerings", label: "Service Offerings" },
    ],
    fields: {
      header: [
        { key: "servicesTitle", label: "Page Title", type: "text", placeholder: "Our Services" },
        { key: "servicesSubtitle", label: "Subtitle", type: "text", placeholder: "Comprehensive IT Solutions…" },
        { key: "servicesDescription", label: "Intro Description", type: "textarea", placeholder: "From legacy system modernization…" },
      ],
      offerings: [
        { key: "service1Name", label: "Service 1 Name", type: "text", placeholder: "ERP Solutions" },
        { key: "service1Desc", label: "Service 1 Description", type: "textarea", placeholder: "" },
        { key: "service2Name", label: "Service 2 Name", type: "text", placeholder: "Cloud Services" },
        { key: "service2Desc", label: "Service 2 Description", type: "textarea", placeholder: "" },
        { key: "service3Name", label: "Service 3 Name", type: "text", placeholder: "Data & AI" },
        { key: "service3Desc", label: "Service 3 Description", type: "textarea", placeholder: "" },
        { key: "service4Name", label: "Service 4 Name", type: "text", placeholder: "Salesforce" },
        { key: "service4Desc", label: "Service 4 Description", type: "textarea", placeholder: "" },
      ],
    },
  },
  {
    id: "contact",
    name: "Contact",
    icon: Phone,
    sections: [
      { id: "info", label: "Contact Info" },
      { id: "social", label: "Social & Links" },
    ],
    fields: {
      info: [
        { key: "contactTitle", label: "Page Title", type: "text", placeholder: "Get in Touch" },
        { key: "contactSubtitle", label: "Subtitle", type: "text", placeholder: "We'd love to hear from you" },
        { key: "contactEmail", label: "Email", type: "email", placeholder: "hr@oceanbluecorp.com" },
        { key: "contactPhone", label: "Phone", type: "tel", placeholder: "+1 614-844-6925" },
        { key: "contactAddress", label: "Address", type: "text", placeholder: "Powell, OH 43065" },
        { key: "contactHours", label: "Business Hours", type: "text", placeholder: "Mon–Fri, 9 AM – 6 PM EST" },
      ],
      social: [
        { key: "socialLinkedIn", label: "LinkedIn URL", type: "url", placeholder: "https://linkedin.com/company/…" },
        { key: "socialTwitter", label: "Twitter/X URL", type: "url", placeholder: "https://x.com/…" },
        { key: "socialFacebook", label: "Facebook URL", type: "url", placeholder: "https://facebook.com/…" },
        { key: "socialYouTube", label: "YouTube URL", type: "url", placeholder: "https://youtube.com/…" },
      ],
    },
  },
];

// Default values so fields show useful placeholders before first DB save
const DEFAULT_FIELDS: Record<string, string> = {
  heroTitle: "Transform Your Business with Enterprise IT Solutions",
  heroSubtitle: "Leading provider of ERP, Cloud, AI, and Salesforce solutions for Fortune 500 companies worldwide.",
  heroCtaText: "Get Started",
  heroCtaSecondary: "Learn More",
  statsClients: "500+",
  statsYears: "15+",
  statsLocations: "25+",
  statsSatisfaction: "98%",
  aboutTitle: "About Ocean Blue Corporation",
  aboutMission: "To empower businesses with cutting-edge technology solutions that drive growth and innovation.",
  aboutVision: "To be the global leader in enterprise IT transformation and digital innovation.",
  aboutDescription: "Ocean Blue Corporation is a premier IT consulting firm specializing in enterprise solutions. With over 15 years of experience, we have helped hundreds of organizations transform their operations through technology.",
  servicesTitle: "Our Services",
  servicesSubtitle: "Comprehensive IT Solutions for Modern Enterprises",
  servicesDescription: "From legacy system modernization to cutting-edge AI implementation, we provide end-to-end solutions that drive business growth.",
  contactTitle: "Get in Touch",
  contactSubtitle: "We'd love to hear from you",
  contactEmail: "hr@oceanbluecorp.com",
  contactPhone: "+1 614-844-6925",
  contactAddress: "Powell, OH 43065",
};

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
  const currentSection = currentPage.sections.find((s) => s.id === activeSection)!;
  const currentFields = currentPage.fields[activeSection] || [];

  const isSaving = loadingPages.has(activePage);
  const isSaved = savedPages.has(activePage);
  const saveError = errorPages[activePage];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">Edit and publish website content — changes save directly to the database.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
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
                : "bg-blue-600 hover:bg-blue-700 text-white"
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
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Pages */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-24">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pages</p>
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
                        isActive ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">{page.name}</span>
                      {saved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                      {err && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                      <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${isActive ? "rotate-90 text-blue-500" : "text-gray-300"}`} />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Sections for current page */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Sections</p>
              </div>
              <nav className="p-2 space-y-0.5">
                {currentPage.sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => { setActiveSection(section.id); setEditingField(null); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-all ${
                      activeSection === section.id ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeSection === section.id ? "bg-blue-500" : "bg-gray-300"}`} />
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Last saved info */}
            {lastSaved[activePage] && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 px-1">
                <Clock className="w-3 h-3" />
                Last saved at {lastSaved[activePage]}
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="lg:col-span-3 space-y-4">
            {/* Section header */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{currentPage.name}</p>
                  <h2 className="text-lg font-semibold text-gray-900">{currentSection.label}</h2>
                </div>
                {saveError && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5" />{saveError}
                  </div>
                )}
              </div>

              <div className="divide-y divide-gray-100">
                {currentFields.map((fieldDef) => {
                  const fieldKey = `${activePage}.${fieldDef.key}`;
                  const isEditing = editingField === fieldKey;
                  const value = getVal(activePage, fieldDef.key);
                  const isLong = fieldDef.type === "textarea";

                  return (
                    <div key={fieldDef.key} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">{fieldDef.label}</label>
                          {isEditing ? (
                            <div className="space-y-2">
                              {isLong ? (
                                <textarea
                                  value={tempValue}
                                  onChange={(e) => setTempValue(e.target.value)}
                                  rows={4}
                                  autoFocus
                                  className="w-full px-3 py-2.5 text-sm border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
                                />
                              ) : (
                                <input
                                  type={fieldDef.type === "text" ? "text" : fieldDef.type}
                                  value={tempValue}
                                  onChange={(e) => setTempValue(e.target.value)}
                                  autoFocus
                                  placeholder={fieldDef.placeholder}
                                  className="w-full px-3 py-2.5 text-sm border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                              )}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => commitEdit(activePage, fieldDef.key)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />Apply
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
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
                                <p className={`text-gray-900 text-sm leading-relaxed group-hover:bg-gray-50 rounded px-2 py-1 -mx-2 transition-colors ${isLong ? "whitespace-pre-wrap" : "truncate"}`}>
                                  {value}
                                </p>
                              ) : (
                                <p className="text-gray-400 text-sm italic group-hover:bg-gray-50 rounded px-2 py-1 -mx-2 transition-colors">
                                  {fieldDef.placeholder || "Click to add…"}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        {!isEditing && (
                          <button
                            onClick={() => startEdit(activePage, fieldDef.key)}
                            className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
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
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-3">
              <p className="text-xs text-gray-400">
                {lastSaved[activePage]
                  ? `Changes last saved at ${lastSaved[activePage]}`
                  : "Unsaved changes will be lost if you leave without saving."}
              </p>
              <button
                onClick={() => savePage(activePage)}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
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
