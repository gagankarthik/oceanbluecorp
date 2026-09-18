"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight, Minus, Check, PlayCircle, ListTree,
} from "lucide-react";
import {
  IconOverview, IconJob, IconBookmark, IconBuilding, IconPhone, IconUserRole,
  IconBell, IconTerminal, IconShield, IconCloud, IconKey, IconInfo,
  IconSuccess, IconAlert, IconCopy, IconLayers, IconSettings,
} from "@/components/admin/icons";
import { cn } from "@/lib/utils";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { UserRole } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Kbd } from "@/components/admin/kbd";
import { WorkspaceButton } from "@/components/admin/workspace";
import type { Tone } from "@/components/admin/theme";

// ── Sidebar config ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: "introduction",
    label: "Introduction",
    items: [
      { id: "overview",        label: "Overview",        icon: IconOverview },
      { id: "getting-started", label: "Getting started", icon: PlayCircle },
    ],
  },
  {
    id: "core",
    label: "Core features",
    items: [
      { id: "jobs",         label: "Job postings", icon: IconJob },
      { id: "applications", label: "Applications", icon: IconLayers },
      { id: "talent-bench", label: "Talent bench", icon: IconBookmark },
    ],
  },
  {
    id: "relationships",
    label: "Relationships",
    items: [
      { id: "clients-vendors", label: "Clients & vendors", icon: IconBuilding },
      { id: "contacts",        label: "Contacts",          icon: IconPhone },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    items: [
      { id: "users-roles",      label: "Users & roles",      icon: IconUserRole },
      { id: "search-notifs",    label: "Search & alerts",    icon: IconBell },
      { id: "content-settings", label: "Content & settings", icon: IconSettings },
    ],
  },
  {
    id: "technical",
    label: "Technical",
    items: [
      { id: "api-reference", label: "API reference",   icon: IconTerminal },
      { id: "aws-services",  label: "AWS services",    icon: IconCloud },
      { id: "security",      label: "Auth & security", icon: IconShield },
    ],
  },
];

const ALL_ITEMS = CATEGORIES.flatMap((c) => c.items);

// ── Primitives ─────────────────────────────────────────────────────────────────

/** Key caps in prose sit a size up from the toolbar default. */
const KBD = "h-6 px-1.5 text-[11.5px]";

/** Inline code span. */
const CODE = "rounded-[6px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--adm-ink-mute)]";

/** Title that opens a documentation chapter. */
function SectionHeader({
  id,
  icon: Icon,
  title,
  description,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description?: string;
}) {
  return (
    <div id={id} className="scroll-mt-6 border-b border-[var(--adm-line)] pb-4">
      <div className="flex items-center gap-2">
        <Icon className="h-[18px] w-[18px] flex-none text-[var(--adm-ink-subtle)]" strokeWidth={1.75} />
        <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">{title}</h2>
      </div>
      {description && <p className="mt-1 text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">{description}</p>}
    </div>
  );
}

/** Each documented topic / endpoint group is its own panel. */
function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <AdminCard className="mt-4">
      <AdminCardHeader title={title} />
      <div className="min-w-0 space-y-3 p-4">{children}</div>
    </AdminCard>
  );
}

function InfoCard({ children, variant = "info" }: { children: React.ReactNode; variant?: "info" | "warning" | "tip" }) {
  const styles = {
    info:    "border-[var(--adm-line)] bg-[var(--adm-accent-tint)] text-[var(--adm-ink-mute)] [&_strong]:text-[var(--adm-ink)]",
    warning: "border-[var(--adm-warning)]/30 bg-[var(--adm-warning-soft)] text-[var(--adm-warning-ink)]",
    tip:     "border-[var(--adm-success)]/30 bg-[var(--adm-success-soft)] text-[var(--adm-success-ink)]",
  };
  const iconInk = {
    info:    "text-[var(--adm-accent)]",
    warning: "text-[var(--adm-warning-ink)]",
    tip:     "text-[var(--adm-success-ink)]",
  };
  const icons = { info: IconInfo, warning: IconAlert, tip: IconSuccess };
  const Icon = icons[variant];
  return (
    <div className={cn("flex items-start gap-2.5 rounded-[12px] border p-3.5 text-[13px] leading-relaxed", styles[variant])}>
      <Icon className={cn("mt-0.5 h-4 w-4 flex-shrink-0", iconInk[variant])} />
      <div className="min-w-0 [&_code]:break-words">{children}</div>
    </div>
  );
}

/**
 * Reference table. Deliberately the local, static form, these rows are prose,
 * not records, so they need no sorting, selection, or pagination. Chrome comes
 * from the shared `.adm-grid` rules so it reads like every other admin grid.
 */
function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="max-w-full overflow-x-auto rounded-[12px] border border-[var(--adm-line)]">
      <table className="adm-grid min-w-[520px] text-[13.5px]">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-4 py-3 text-left first:pl-5 last:pr-5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="transition-colors duration-150 hover:bg-[var(--adm-row-hover)]">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 align-top text-[var(--adm-ink-mute)] first:pl-5 last:pr-5">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeBlock({ label = "Code", children }: { label?: string; children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="min-w-0 overflow-hidden rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--adm-line-soft)] px-4 py-1.5">
        <span className="truncate font-mono text-[12px] text-[var(--adm-ink-subtle)]">{label}</span>
        <button
          type="button"
          onClick={() => { void navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          aria-label={copied ? "Copied" : "Copy code"}
          className={cn(
            "inline-flex h-8 flex-none items-center gap-1.5 rounded-[8px] px-2 text-[12.5px] font-medium transition-colors duration-150",
            copied
              ? "text-[var(--adm-success-ink)]"
              : "text-[var(--adm-ink-mute)] hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]",
          )}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <IconCopy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {/* Scrolls sideways inside itself; long env lines never widen the page. */}
      <pre className="max-w-full overflow-x-auto whitespace-pre p-4 font-mono text-[12.5px] leading-relaxed text-[var(--adm-ink)]">{children}</pre>
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: Tone }) {
  return <StatusBadge tone={tone} label={label} />;
}

function HttpBadge({ method }: { method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" }) {
  const colors = {
    GET:    "bg-[var(--adm-success-soft)] text-[var(--adm-success-ink)]",
    POST:   "bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]",
    PUT:    "bg-[var(--adm-warning-soft)] text-[var(--adm-warning-ink)]",
    DELETE: "bg-[var(--adm-danger-soft)] text-[var(--adm-danger-ink)]",
    PATCH:  "bg-[var(--adm-surface-2)] text-[var(--adm-ink-mute)]",
  };
  return (
    <span className={cn("inline-flex items-center rounded-[6px] px-1.5 py-0.5 font-mono text-[11.5px] font-semibold", colors[method])}>
      {method}
    </span>
  );
}

/** Permission-matrix marks, glyph first, colour second. */
function Yes() {
  return (
    <span className="inline-flex items-center text-[var(--adm-success-ink)]">
      <Check className="h-4 w-4" strokeWidth={2.5} />
      <span className="sr-only">Allowed</span>
    </span>
  );
}

function No() {
  return (
    <span className="inline-flex items-center text-[var(--adm-ink-subtle)]">
      <Minus className="h-4 w-4" strokeWidth={2} />
      <span className="sr-only">No access</span>
    </span>
  );
}

/** A labelled note in a well, used for the "where to add an applicant" list. */
function Well({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-[var(--adm-line-soft)] bg-[var(--adm-surface-sunken)] p-4">
      <p className="mb-1 text-[13px] font-medium text-[var(--adm-ink)]">{title}</p>
      <p className="text-[13.5px] text-[var(--adm-ink-mute)]">{children}</p>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdminDocsPage() {
  const router = useRouter();
  const [activeId, setActiveId] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sectionIds = ALL_ITEMS.map((i) => i.id);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const topmost = visible.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b
          );
          setActiveId(topmost.target.id);
        }
      },
      { rootMargin: "-10% 0px -60% 0px", threshold: 0 }
    );

    elements.forEach((el) => observerRef.current!.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
    setSidebarOpen(false);
  };

  const nav = (
    <nav aria-label="Documentation contents" className="grid grid-cols-1 gap-4 p-3 sm:grid-cols-2 lg:grid-cols-1">
      {CATEGORIES.map((cat) => (
        <div key={cat.id}>
          <p className="mb-1 px-2.5 text-[13px] font-medium text-[var(--adm-ink-subtle)]">
            {cat.label}
          </p>
          <div className="space-y-px">
            {cat.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollTo(item.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[13px] transition-colors duration-150 lg:py-1.5",
                    isActive
                      ? "bg-[var(--adm-accent-soft)] font-semibold text-[var(--adm-accent)]"
                      : "text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]",
                  )}
                >
                  <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-[var(--adm-accent)]" : "text-[var(--adm-ink-subtle)]")} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const activeLabel = ALL_ITEMS.find((i) => i.id === activeId)?.label;

  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
    <div className="pb-10">

      <PageHeader
        title="Developer docs"
        info="Platform reference for the admin console, the internal REST API, and the AWS estate."
        actions={
          <>
            <WorkspaceButton onClick={() => router.push("/admin")}>
              <IconOverview className="h-4 w-4" /><span className="hidden sm:inline">Dashboard</span>
            </WorkspaceButton>
            <WorkspaceButton onClick={() => router.push("/admin/api-keys")}>
              <IconKey className="h-4 w-4" />API keys
            </WorkspaceButton>
          </>
        }
      />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-5">

        {/* Sticky beside the reference from lg; a collapsible contents panel above it below. */}
        <div className="min-w-0 lg:sticky lg:top-6">
          <AdminCard className="overflow-hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-expanded={sidebarOpen}
              aria-controls="docs-contents"
              className="flex min-h-11 w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-[var(--adm-row-hover)] lg:pointer-events-none lg:border-b lg:border-[var(--adm-line-soft)]"
            >
              <span className="inline-flex min-w-0 items-center gap-2 text-[13px] font-medium text-[var(--adm-ink-mute)]">
                <ListTree className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" />
                Contents
                {activeLabel && (
                  <span className="truncate font-normal text-[var(--adm-ink-subtle)] lg:hidden">· {activeLabel}</span>
                )}
              </span>
              <ChevronRight
                className={cn("h-4 w-4 flex-none text-[var(--adm-ink-subtle)] transition-transform duration-150 lg:hidden", sidebarOpen && "rotate-90")}
                aria-hidden="true"
              />
            </button>
            <div
              id="docs-contents"
              className={cn(
                "max-h-[70vh] overflow-y-auto border-t border-[var(--adm-line-soft)] lg:max-h-[calc(100dvh-180px)] lg:border-t-0",
                sidebarOpen ? "block" : "hidden lg:block",
              )}
            >
              {nav}
            </div>
          </AdminCard>
        </div>

        <div className="min-w-0 space-y-6 lg:space-y-8">
          <section>
            <SectionHeader
              id="overview"
              icon={IconOverview}
              title="Overview"
              description="Ocean Blue Admin is the internal operations platform for managing job postings, applicant pipelines, clients, vendors, contacts, and team members."
            />

            <AdminCard className="mt-4 overflow-hidden">
            <div className="grid grid-cols-1 gap-px bg-[var(--adm-line-soft)] sm:grid-cols-2 xl:grid-cols-3">
              {[
                { icon: IconJob, label: "Jobs", desc: "Post and manage open roles" },
                { icon: IconLayers,    label: "Applications", desc: "Track candidate pipeline" },
                { icon: IconBookmark, label: "Talent bench", desc: "Save top candidates" },
                { icon: IconBuilding, label: "Clients",      desc: "Manage client accounts" },
                { icon: IconPhone,     label: "Contacts",     desc: "Handle site inquiries" },
                { icon: IconUserRole,   label: "Users",        desc: "Manage team access" },
              ].map((f) => (
                <div key={f.label} className="bg-[var(--adm-surface)] p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <f.icon className="h-4 w-4 text-[var(--adm-ink-subtle)]" strokeWidth={1.75} />
                    <span className="text-[14px] font-semibold text-[var(--adm-ink)]">{f.label}</span>
                  </div>
                  <p className="text-[13px] text-[var(--adm-ink-mute)]">{f.desc}</p>
                </div>
              ))}
            </div>
            </AdminCard>

            <SubSection title="Admin panel URL structure">
              <DataTable
                headers={["Route", "Page", "Access"]}
                rows={[
                  ["/admin", "Dashboard", <Badge key="a" label="All staff roles" tone="blue" />],
                  ["/admin/jobs", "Job Postings", <Badge key="b" label="Admin · HR · Recruiter" tone="blue" />],
                  ["/admin/applications", "Applications", <Badge key="c" label="Admin · HR · Recruiter" tone="blue" />],
                  ["/admin/bench", "Talent Bench", <Badge key="d" label="Admin · HR · Recruiter" tone="blue" />],
                  ["/admin/clients", "Clients", <Badge key="e" label="Admin · HR" tone="slate" />],
                  ["/admin/vendors", "Vendors", <Badge key="f" label="Admin · HR" tone="slate" />],
                  ["/admin/contacts", "Contacts", <Badge key="g" label="Admin · HR" tone="slate" />],
                  ["/admin/users", "User Management", <Badge key="h" label="Admin only" tone="rose" />],
                  ["/admin/content", "CMS Content", <Badge key="i" label="Admin only" tone="rose" />],
                  ["/admin/settings", "Settings", <Badge key="j" label="All roles · System tab: Admin" tone="blue" />],
                  ["/admin/docs", "Developer Docs", <Badge key="k" label="Admin only" tone="rose" />],
                ]}
              />
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="getting-started"
              icon={PlayCircle}
              title="Getting started"
              description="How to log in, navigate the platform, and use keyboard shortcuts."
            />

            <SubSection title="Authentication">
              <div className="space-y-3">
                <p className="text-[14px] text-[var(--adm-ink-mute)] leading-relaxed">
                  The admin panel is <strong>staff-only and invite-based</strong>, there is no public sign-up. Sign in with your email and password directly on <code className={CODE}>/auth/signin</code>; the form posts to <code className={CODE}>/api/auth/signin</code>, which authenticates against Cognito and returns your tokens. There is no Cognito Hosted UI redirect.
                </p>
                <InfoCard variant="info">
                  Sessions are stored in browser localStorage. Closing the browser tab does not sign you out, use the <strong>Sign Out</strong> button in the sidebar or header.
                </InfoCard>
                <InfoCard variant="tip">
                  On your <strong>first sign-in</strong> after an invite, Cognito raises a one-time password change. The sign-in page switches to a &ldquo;Complete your account&rdquo; step where you set your full name, phone, and a permanent password before any tokens are issued.
                </InfoCard>
              </div>
            </SubSection>

            <SubSection title="User roles">
              <DataTable
                headers={["Role", "Level", "Permissions"]}
                rows={[
                  [
                    <Badge key="1" label="Admin" tone="slate" />,
                    "4",
                    "Full platform access, all features, user management, content, settings",
                  ],
                  [
                    <Badge key="2" label="HR" tone="blue" />,
                    "3",
                    "Jobs, applications, candidates, clients, vendors, contacts",
                  ],
                  [
                    <Badge key="3" label="Recruiter" tone="emerald" />,
                    "2",
                    "Jobs, applications, candidates, talent bench, no clients/contacts",
                  ],
                  [
                    <Badge key="4" label="Sales" tone="amber" />,
                    "2",
                    "Same as Recruiter, clients and vendors read-only",
                  ],
                ]}
              />
              <InfoCard variant="info">
                These four staff groups are the only roles. There is no public &ldquo;user&rdquo; account, job applicants submit anonymously through <code className={CODE}>/careers/search</code> with no login required.
              </InfoCard>
            </SubSection>

            <SubSection title="Keyboard shortcuts">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {[
                  { keys: "⌘ K", desc: "Open global command palette / search" },
                  { keys: "⌘ /", desc: "Focus search bar on current page" },
                  { keys: "Esc", desc: "Close modals, drawers, dropdowns" },
                  { keys: "Enter", desc: "Confirm selection in dropdowns" },
                  { keys: "↑ ↓", desc: "Navigate command palette results" },
                  { keys: "Tab", desc: "Cycle through form fields" },
                ].map((s) => (
                  <div key={s.keys} className="flex min-w-0 items-center gap-3 rounded-[12px] border border-[var(--adm-line-soft)] bg-[var(--adm-surface-sunken)] px-4 py-2.5">
                    <Kbd className={KBD}>{s.keys}</Kbd>
                    <span className="text-[14px] text-[var(--adm-ink-mute)]">{s.desc}</span>
                  </div>
                ))}
              </div>
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="jobs"
              icon={IconJob}
              title="Job postings"
              description="Create, manage, and track open roles. Jobs are linked to clients, vendors, and applicants."
            />

            <SubSection title="Creating a job">
              <div className="space-y-2 text-[14px] text-[var(--adm-ink-mute)] leading-relaxed">
                <p>Navigate to <strong>/admin/jobs</strong> and click <strong>New Job</strong>. The form is organized into sections:</p>
                <ol className="list-decimal list-outside space-y-1 ml-5">
                  <li><strong>Basic Info</strong>, Title, department, type (full-time / contract / etc.), location</li>
                  <li><strong>Job Details</strong>, Description, requirements, responsibilities</li>
                  <li><strong>Compensation</strong>, Pay rate, bill rate, salary range</li>
                  <li><strong>Client & Vendor</strong>, Link to client/vendor records</li>
                  <li><strong>Team Assignment</strong>, Recruitment manager + assigned recruiters</li>
                  <li><strong>Deadline</strong>, Submission due date (auto-closes when passed)</li>
                </ol>
              </div>
            </SubSection>

            <SubSection title="Job status workflow">
              <div className="flex flex-wrap items-center gap-2">
                {([
                  ["draft", "Draft"],
                  ["open", "Open"],
                  ["active", "Active"],
                  ["on-hold", "On hold"],
                  ["closed", "Closed"],
                ] as const).map(([status, label], i, arr) => (
                  <Fragment key={status}>
                    <StatusBadge status={status} label={label} size="md" />
                    {i < arr.length - 1 && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-[var(--adm-ink-subtle)]" />}
                  </Fragment>
                ))}
              </div>
              <InfoCard variant="info">
                Jobs with a <strong>Submission Due Date</strong> in the past are automatically closed by the system on the next page load.
              </InfoCard>
            </SubSection>

            <SubSection title="Job fields reference">
              <DataTable
                headers={["Field", "Required", "Description"]}
                rows={[
                  ["Posting ID", "Auto", "Generated as OB-YYYY-XXXX (e.g. OB-2025-0042)"],
                  ["Title", "Yes", "Job title shown on listings and applications"],
                  ["Department", "Yes", "Engineering, Sales, Finance, HR, etc."],
                  ["Type", "Yes", "Full-Time, Part-Time, Contract, Contract-to-Hire, Temp"],
                  ["Location", "Yes", "City; state auto-populated from form"],
                  ["Status", "Yes", "Draft / Open / Active / On Hold / Closed"],
                  ["Pay Rate", "No", "Candidate pay rate per hour"],
                  ["Bill Rate", "No", "Client bill rate per hour"],
                  ["Client", "No", "Linked client from /admin/clients"],
                  ["Vendor", "No", "Linked vendor from /admin/vendors"],
                  ["Due Date", "No", "Auto-closes job when this date passes"],
                  ["Assigned Team", "No", "Recruiter manager + team members (email + name)"],
                ]}
              />
            </SubSection>

            <SubSection title="Duplicate a job">
              <p className="text-[14px] text-[var(--adm-ink-mute)] leading-relaxed">
                In the jobs table, click the <strong>⋯ menu</strong> on any row and select <strong>Duplicate</strong>. A copy is created with a new Posting ID and status reset to <em>Draft</em>. Useful for recurring roles or similar positions.
              </p>
            </SubSection>

            <SubSection title="Export">
              <p className="text-[14px] text-[var(--adm-ink-mute)]">
                The <strong>Export</strong> button on the jobs page downloads a CSV with columns: Job ID, Title, Client, Location, Status, Pay Rate, Bill Rate, Manager, Created, Deadline. Applies your current filter/search state.
              </p>
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="applications"
              icon={IconLayers}
              title="Applications & pipeline"
              description="Track every candidate through the hiring pipeline from initial review to hire or rejection."
            />

            <SubSection title="Pipeline stages">
              <div className="space-y-1.5">
                {([
                  ["pending",   "New (pending)", "Application just received, not yet reviewed"],
                  ["reviewing", "Screening",     "Initial review, checking resume and qualifications"],
                  ["interview", "Interview",     "Actively scheduling or conducting interviews"],
                  ["offered",   "Offered",       "Offer extended, awaiting candidate response"],
                  ["hired",     "Hired",         "Accepted offer and placement confirmed"],
                  ["rejected",  "Rejected",      "Not moving forward, candidate notified"],
                ] as const).map(([status, label, desc]) => (
                  <div key={status} className="flex flex-col gap-1.5 rounded-[12px] border border-[var(--adm-line-soft)] bg-[var(--adm-surface-sunken)] px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
                    <span className="sm:w-32 sm:flex-none"><StatusBadge status={status} label={label} size="md" /></span>
                    <p className="text-[14px] text-[var(--adm-ink-mute)]">{desc}</p>
                  </div>
                ))}
              </div>
            </SubSection>

            <SubSection title="Views">
              <DataTable
                headers={["View", "Best for"]}
                rows={[
                  ["Table View", "Bulk scanning, sorting, searching many applicants at once"],
                  ["Kanban View", "Visualizing pipeline stage distribution, drag-and-drop status changes"],
                  ["List View",  "Compact browsing with applicant details at a glance"],
                ]}
              />
            </SubSection>

            <SubSection title="Adding applicants">
              <div className="space-y-2.5">
                <Well title="From the job detail page">
                  Open a job → click the <strong>Add Applicant</strong> floating button (bottom-right corner). The form opens with that job pre-selected.
                </Well>
                <Well title="From the applications page">
                  Go to <strong>/admin/applications</strong> → click <strong>+ Add Applicant</strong> in the top-right. Select the job from the dropdown.
                </Well>
                <Well title="Portal submissions">
                  Candidates applying through <strong>/careers/search</strong> are automatically added with status <em>New</em>. Confirmation email sent automatically.
                </Well>
              </div>
            </SubSection>

            <SubSection title="Application fields">
              <DataTable
                headers={["Field", "Description"]}
                rows={[
                  ["Name / Email / Phone", "Candidate contact information"],
                  ["Job Posting", "Linked job, drives which team receives notifications"],
                  ["Pipeline Stage", "New → Screening → Interview → Offered → Hired / Rejected"],
                  ["Source", "LinkedIn, Indeed, Referral, Company Website, etc."],
                  ["Skills", "Chip-tagged skills for filtering and search"],
                  ["Work Authorization", "US Citizen, Green Card, H1-B, OPT/CPT, etc."],
                  ["Rating", "1–5 star internal rating (not visible to candidate)"],
                  ["Notes", "Internal notes with timestamp history"],
                  ["Resume", "PDF or Word document stored in S3"],
                  ["Talent Bench", "Toggle to save candidate to the talent pool"],
                ]}
              />
            </SubSection>

            <SubSection title="Export">
              <p className="text-[14px] text-[var(--adm-ink-mute)]">
                Use the <strong>Export CSV</strong> button on the applications page to download all filtered results with columns: Name, Email, Phone, Status, Applied, Source, Work Auth.
              </p>
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="talent-bench"
              icon={IconBookmark}
              title="Talent bench"
              description="A curated pool of pre-qualified candidates available for future roles."
            />

            <SubSection title="Adding to the bench">
              <div className="space-y-2 text-[14px] text-[var(--adm-ink-mute)] leading-relaxed">
                <p>Toggle <strong>Add to Talent Bench</strong> when creating or editing an application. The candidate is then visible in <strong>/admin/bench</strong> regardless of job status.</p>
                <InfoCard variant="tip">
                  Bench candidates retain all their application data (skills, visa status, notes, rating). Use the bench to quickly match top candidates when new roles open.
                </InfoCard>
              </div>
            </SubSection>

            <SubSection title="Resume bank">
              <div className="space-y-2 text-[14px] text-[var(--adm-ink-mute)] leading-relaxed">
                <p>The <strong>/admin/resumes</strong> page shows all uploaded resumes stored in S3. Each resume entry has:</p>
                <ul className="list-disc list-outside ml-5 space-y-1">
                  <li>File name and size</li>
                  <li>Upload date and uploader</li>
                  <li>Linked applicant (if created through an application)</li>
                  <li>Download button (generates presigned S3 URL valid for 1 hour)</li>
                </ul>
              </div>
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="clients-vendors"
              icon={IconBuilding}
              title="Clients & vendors"
              description="Manage the companies you place candidates with (clients) and staffing partners (vendors)."
            />

            <SubSection title="Clients">
              <DataTable
                headers={["Field", "Description"]}
                rows={[
                  ["Name", "Company name, appears on job postings"],
                  ["Website", "Client website URL"],
                  ["Contact Name / Email / Phone", "Primary contact at the client company"],
                  ["Status", "Active or Inactive"],
                  ["Notes", "Internal notes about the client relationship"],
                ]}
              />
              <p className="text-[13px] text-[var(--adm-ink-mute)]">Clients are linked to jobs via the <em>Client Name</em> field. When a job is created, you can search existing clients or enter a new one.</p>
            </SubSection>

            <SubSection title="Vendors">
              <DataTable
                headers={["Field", "Description"]}
                rows={[
                  ["Name", "Vendor company name"],
                  ["Contact", "Primary vendor contact information"],
                  ["Vendor Lead", "Internal team member responsible for this vendor relationship"],
                  ["Status", "Active or Inactive"],
                ]}
              />
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="contacts"
              icon={IconPhone}
              title="Contacts"
              description="Manage inquiries submitted through the website contact form at /contact."
            />

            <SubSection title="Contact status workflow">
              <div className="flex flex-wrap items-center gap-2">
                {([
                  ["New", "blue"],
                  ["Read", "slate"],
                  ["Replied", "emerald"],
                  ["Archived", "slate"],
                ] as const).map(([label, tone], i, arr) => (
                  <Fragment key={label}>
                    <StatusBadge tone={tone} label={label} size="md" />
                    {i < arr.length - 1 && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-[var(--adm-ink-subtle)]" />}
                  </Fragment>
                ))}
              </div>
              <p className="text-[14px] text-[var(--adm-ink-mute)]">All contact submissions arrive as <strong>New</strong>. Mark as <em>Replied</em> after responding, or <em>Archived</em> to hide from active view.</p>
            </SubSection>

            <SubSection title="Contact fields">
              <DataTable
                headers={["Field", "Description"]}
                rows={[
                  ["Name / Email / Phone", "Submitter contact details"],
                  ["Subject", "Inquiry subject line"],
                  ["Message", "Full inquiry message body"],
                  ["Status", "New / Read / Replied / Archived"],
                  ["Submitted At", "Timestamp of form submission"],
                ]}
              />
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="users-roles"
              icon={IconUserRole}
              title="Users & roles"
              description="Manage team member access through AWS Cognito groups. Admin-only feature."
            />

            <SubSection title="User management">
              <div className="space-y-2 text-[14px] text-[var(--adm-ink-mute)] leading-relaxed">
                <p>Navigate to <strong>/admin/users</strong> to see all Cognito users. You can:</p>
                <ul className="list-disc list-outside ml-5 space-y-1">
                  <li>View all registered users with their email, status, and role</li>
                  <li>Assign roles by adding users to Cognito groups (admin, hr, recruiter, sales)</li>
                  <li>Enable or disable user accounts</li>
                  <li>Delete users from the pool (irreversible)</li>
                </ul>
              </div>
            </SubSection>

            <SubSection title="Role permission matrix">
              <DataTable
                headers={["Feature", "Admin", "HR", "Recruiter", "Sales"]}
                rows={[
                  ["Dashboard", <Yes />, <Yes />, <Yes />, <Yes />],
                  ["Jobs (R/W)", <Yes />, <Yes />, <Yes />, <Yes />],
                  ["Applications (R/W)", <Yes />, <Yes />, <Yes />, <Yes />],
                  ["Talent Bench", <Yes />, <Yes />, <Yes />, <Yes />],
                  ["Clients / Vendors", <Yes />, <Yes />, <No />, <No />],
                  ["Contacts", <Yes />, <Yes />, <No />, <No />],
                  ["Resume Bank", <Yes />, <Yes />, <Yes />, <No />],
                  ["Settings. Profile / Security / Notifications", <Yes />, <Yes />, <Yes />, <Yes />],
                  ["Settings. System tab", <Yes />, <No />, <No />, <No />],
                  ["User Management", <Yes />, <No />, <No />, <No />],
                  ["CMS Content", <Yes />, <No />, <No />, <No />],
                  ["Developer / API Docs", <Yes />, <No />, <No />, <No />],
                ]}
              />
            </SubSection>

            <SubSection title="Inviting a team member">
              <ol className="text-[14px] text-[var(--adm-ink-mute)] space-y-1.5 list-decimal list-outside ml-5 leading-relaxed">
                <li>Go to <strong>/admin/users</strong> → click <strong>Invite User</strong></li>
                <li>Enter the email address and select the role: <code className={CODE}>admin</code>, <code className={CODE}>hr</code>, <code className={CODE}>recruiter</code>, or <code className={CODE}>sales</code></li>
                <li>Cognito emails the invite with a temporary password</li>
                <li>On first sign-in they&apos;re prompted to set their full name, phone number, and a permanent password</li>
              </ol>
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="search-notifs"
              icon={IconBell}
              title="Search & alerts"
              description="Global search across all data and the in-app notification system."
            />

            <SubSection title="Global command palette">
              <div className="space-y-2 text-[14px] text-[var(--adm-ink-mute)]">
                <p>Press <Kbd className={KBD}>⌘ K</Kbd> (Mac) or <Kbd className={KBD}>Ctrl K</Kbd> (Windows) from anywhere in the admin panel to open the command palette.</p>
                <DataTable
                  headers={["Search scope", "Examples"]}
                  rows={[
                    ["Jobs", "Search by title, department, client, posting ID"],
                    ["Applications", "Search by candidate name or email"],
                    ["Contacts", "Search by name, email, or subject"],
                    ["Quick Navigation", "Type a page name to jump directly to it"],
                  ]}
                />
              </div>
            </SubSection>

            <SubSection title="In-app notifications">
              <div className="space-y-2 text-[14px] text-[var(--adm-ink-mute)] leading-relaxed">
                <p>The bell icon in the admin header shows unread notification count. Notifications are created automatically for:</p>
                <ul className="list-disc list-outside ml-5 space-y-1">
                  <li>New application received for a job you manage</li>
                  <li>Application status changed</li>
                  <li>New job posting created</li>
                </ul>
                <InfoCard variant="info">
                  Notifications have a <strong>7-day TTL</strong>, they are automatically deleted from DynamoDB after 7 days.
                </InfoCard>
              </div>
            </SubSection>

            <SubSection title="Email notifications (SES)">
              <DataTable
                headers={["Trigger", "Recipients"]}
                rows={[
                  ["New portal application submitted", "Candidate (confirmation) + Recruitment Manager + Assigned Team"],
                  ["Application status updated", "Candidate (if email enabled in settings)"],
                  ["New job posted", "Assigned team members"],
                  ["Interview scheduled", "Candidate + interviewer"],
                ]}
              />
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="content-settings"
              icon={IconSettings}
              title="Content & settings"
              description="CMS content blocks and application-wide configuration. Admin only."
            />

            <SubSection title="Content management">
              <div className="space-y-2 text-[14px] text-[var(--adm-ink-mute)] leading-relaxed">
                <p><strong>/admin/content</strong> lets you update website content blocks without deploying code. Sections available:</p>
                <ul className="list-disc list-outside ml-5 space-y-1">
                  <li>Homepage hero text, CTA labels</li>
                  <li>About page content blocks</li>
                  <li>Services descriptions</li>
                  <li>Footer links and address</li>
                </ul>
                <InfoCard variant="warning">
                  Content changes take effect immediately on the live site. Each save creates a new version, the current version number is shown next to each block.
                </InfoCard>
              </div>
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="api-reference"
              icon={IconTerminal}
              title="API reference"
              description="Internal REST API routes served from the Next.js App Router. All routes are at /api/*."
            />

            <div className="mt-4">
              <InfoCard variant="info">
                All API routes are server-side only. Admin routes (<code>/api/admin/*</code>, <code>/api/users/*</code>) require an <code>Authorization</code> header with a valid Cognito Bearer token.
              </InfoCard>
            </div>

            <SubSection title="Jobs">
              <DataTable
                headers={["Method", "Route", "Description"]}
                rows={[
                  [<HttpBadge key="1" method="GET" />, "/api/jobs", "List all jobs (optional ?status= filter)"],
                  [<HttpBadge key="2" method="POST" />, "/api/jobs", "Create a new job posting"],
                  [<HttpBadge key="3" method="GET" />, "/api/jobs/[id]", "Get a single job by ID"],
                  [<HttpBadge key="4" method="PUT" />, "/api/jobs/[id]", "Update job fields or status"],
                  [<HttpBadge key="5" method="DELETE" />, "/api/jobs/[id]", "Delete a job (irreversible)"],
                  [<HttpBadge key="6" method="POST" />, "/api/jobs/[id]/duplicate", "Clone a job with new Posting ID"],
                  [<HttpBadge key="7" method="POST" />, "/api/jobs/notify-update", "Send team notification about job update"],
                ]}
              />
            </SubSection>

            <SubSection title="Applications">
              <DataTable
                headers={["Method", "Route", "Description"]}
                rows={[
                  [<HttpBadge key="1" method="GET" />, "/api/applications", "List applications (?jobId= or ?userId=)"],
                  [<HttpBadge key="2" method="POST" />, "/api/applications", "Create application + send email notifications"],
                  [<HttpBadge key="3" method="GET" />, "/api/applications/[id]", "Get single application"],
                  [<HttpBadge key="4" method="PUT" />, "/api/applications/[id]", "Update status, notes, rating"],
                  [<HttpBadge key="5" method="DELETE" />, "/api/applications/[id]", "Delete application"],
                ]}
              />
            </SubSection>

            <SubSection title="Resumes">
              <DataTable
                headers={["Method", "Route", "Description"]}
                rows={[
                  [<HttpBadge key="1" method="POST" />, "/api/resume/upload", "Upload a resume: server-side to S3 + DynamoDB record"],
                  [<HttpBadge key="2" method="POST" />, "/api/resume/parse", "Read a resume and return its structured content, stores nothing (backs the new-applicant autofill)"],
                  [<HttpBadge key="3" method="GET" />, "/api/resume/[id]", "Get presigned download URL (1h expiry)"],
                  [<HttpBadge key="4" method="DELETE" />, "/api/resume/[id]", "Delete resume from S3 + DynamoDB"],
                  [<HttpBadge key="5" method="GET" />, "/api/resume-bank", "List all resume bank entries"],
                  [<HttpBadge key="6" method="POST" />, "/api/resume-bank", "Upload to resume bank"],
                ]}
              />
            </SubSection>

            <SubSection title="Admin & stats">
              <DataTable
                headers={["Method", "Route", "Description"]}
                rows={[
                  [<HttpBadge key="1" method="GET" />, "/api/admin/stats", "Dashboard statistics (requires auth)"],
                  [<HttpBadge key="2" method="GET" />, "/api/admin/search?q=", "Global search across all entities"],
                  [<HttpBadge key="3" method="GET" />, "/api/users", "List all Cognito users"],
                  [<HttpBadge key="4" method="PUT" />, "/api/users/[id]", "Update user role / enable / disable"],
                  [<HttpBadge key="5" method="DELETE" />, "/api/users/[id]", "Remove user from Cognito pool"],
                  [<HttpBadge key="6" method="GET" />, "/api/users/me", "Get current user's profile"],
                ]}
              />
            </SubSection>

            <SubSection title="Clients, vendors & contacts">
              <DataTable
                headers={["Method", "Route", "Description"]}
                rows={[
                  [<HttpBadge key="1" method="GET" />, "/api/clients", "List all clients"],
                  [<HttpBadge key="2" method="POST" />, "/api/clients", "Create client"],
                  [<HttpBadge key="3" method="PUT" />, "/api/clients/[id]", "Update client"],
                  [<HttpBadge key="4" method="GET" />, "/api/vendors", "List all vendors"],
                  [<HttpBadge key="5" method="POST" />, "/api/vendors", "Create vendor"],
                  [<HttpBadge key="6" method="GET" />, "/api/contacts", "List contact submissions"],
                  [<HttpBadge key="7" method="POST" />, "/api/contacts", "Create contact (public, from website form)"],
                  [<HttpBadge key="8" method="PUT" />, "/api/contacts/[id]", "Update contact status"],
                ]}
              />
            </SubSection>

            <SubSection title="Job feed API v1 (partner platforms)">
              <InfoCard variant="tip">
                These are public-facing routes authenticated by API keys (not Cognito). Manage keys at{" "}
                <strong>/admin/api-keys</strong>. Public docs at <strong>/developers</strong>.
              </InfoCard>
              <DataTable
                headers={["Method", "Route", "Auth", "Description"]}
                rows={[
                  [<HttpBadge key="1" method="GET" />, "/api/v1/jobs", "X-API-Key, jobs:read", "Paginated list of active/open jobs. Query: status, department, type, page, limit"],
                  [<HttpBadge key="2" method="GET" />, "/api/v1/jobs/[id]", "X-API-Key, jobs:read", "Single job by UUID, strips all internal fields"],
                  [<HttpBadge key="3" method="POST" />, "/api/v1/jobs", "X-API-Key, jobs:write", "Partner files a posting. Declared fields only, sanitized, draft unless status is sent"],
                ]}
              />
            </SubSection>

            <SubSection title="API key management (admin)">
              <DataTable
                headers={["Method", "Route", "Description"]}
                rows={[
                  [<HttpBadge key="1" method="GET" />, "/api/admin/api-keys", "List all partner API keys (key value previewed only)"],
                  [<HttpBadge key="2" method="POST" />, "/api/admin/api-keys", "Generate a new API key, full value returned once only"],
                  [<HttpBadge key="3" method="PUT" />, "/api/admin/api-keys/[id]", "Enable / disable key, update name/description, or change accessLevel"],
                  [<HttpBadge key="4" method="DELETE" />, "/api/admin/api-keys/[id]", "Permanently revoke and delete a key"],
                ]}
              />
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="aws-services"
              icon={IconCloud}
              title="AWS services"
              description="The platform runs entirely on AWS. All credentials are server-side only and never exposed to the browser."
            />

            <SubSection title="Services in use">
              <DataTable
                headers={["Service", "Purpose", "Config file"]}
                rows={[
                  ["DynamoDB", "Primary database, all app data", "src/lib/aws/dynamodb.ts"],
                  ["S3", "Resume file storage with presigned URLs", "src/lib/aws/s3.ts"],
                  ["Cognito", "User authentication + RBAC groups", "src/lib/auth/AuthContext.tsx"],
                  ["SES / SMTP", "Transactional email notifications", "src/lib/aws/ses.ts"],
                  ["Amplify", "Hosting, CI/CD, environment variables", "amplify.yml"],
                ]}
              />
            </SubSection>

            <SubSection title="DynamoDB tables">
              <DataTable
                headers={["Table", "PK", "GSIs", "Purpose"]}
                rows={[
                  ["oceanblue-jobs", "id", "–", "Job postings with all metadata"],
                  ["oceanblue-applications", "id", "userId-index, jobId-index", "Candidate applications (portal + HR-created)"],
                  ["oceanblue-candidates", "id", "email-index, userId-index", "Talent bench candidate profiles"],
                  ["oceanblue-resumes", "id", "userId-index", "Resume metadata (file key, size, type)"],
                  ["oceanblue-contacts", "id", "–", "Contact form submissions"],
                  ["oceanblue-notifications", "id", "–", "In-app notifications (7-day TTL)"],
                  ["oceanblue-clients", "id", "–", "Client company records"],
                  ["oceanblue-vendors", "id", "–", "Vendor partner records"],
                  ["oceanblue-counters", "id", "–", "Auto-increment counters for Posting IDs"],
                  ["oceanblue-content", "id", "–", "CMS content blocks with version history"],
                  ["oceanblue-api-keys", "id", "–", "Partner API keys for the Job Feed API (v1)"],
                ]}
              />
            </SubSection>

            <SubSection title="Environment variables">
              <CodeBlock label=".env.local">{`# AWS Credentials (server-side only)
NEXT_AWS_ACCESS_KEY_ID=your_access_key
NEXT_AWS_SECRET_ACCESS_KEY=your_secret_key
NEXT_PUBLIC_AWS_REGION=us-east-2

# S3
NEXT_AWS_S3_BUCKET_NAME=oceanblue-resumes
NEXT_AWS_S3_BUCKET_REGION=us-east-2

# DynamoDB Tables
NEXT_AWS_DYNAMODB_TABLE_JOBS=oceanblue-jobs
NEXT_AWS_DYNAMODB_TABLE_APPLICATIONS=oceanblue-applications
NEXT_AWS_DYNAMODB_TABLE_CANDIDATES=oceanblue-candidates
NEXT_AWS_DYNAMODB_TABLE_RESUMES=oceanblue-resumes
NEXT_AWS_DYNAMODB_TABLE_CONTACTS=oceanblue-contacts

# Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-2_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=your_client_id
NEXT_PUBLIC_COGNITO_DOMAIN=https://oceanblue.auth.us-east-2.amazoncognito.com
NEXT_PUBLIC_APP_URL=https://oceanbluecorp.com

# SES / SMTP
NEXT_AWS_STMP=smtp_username
NEXT_AWS_STMP_PASSWORD=smtp_password
NEXT_AWS_SES_FROM_EMAIL=hiring@oceanbluecorp.com`}</CodeBlock>
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="security"
              icon={IconShield}
              title="Auth & security"
              description="Authentication architecture, HTTP security headers, and data protection."
            />

            <SubSection title="Authentication flow">
              <div className="space-y-2 text-[14px] text-[var(--adm-ink-mute)] leading-relaxed">
                <ol className="list-decimal list-outside space-y-2 ml-5">
                  <li>User enters email + password on <code className={CODE}>/auth/signin</code> and submits to <code className={CODE}>/api/auth/signin</code></li>
                  <li>The route runs Cognito <code className={CODE}>USER_PASSWORD_AUTH</code> and returns ID + access + refresh tokens</li>
                  <li>First-time invited users get a <code className={CODE}>NEW_PASSWORD_REQUIRED</code> challenge, completed via <code className={CODE}>/api/auth/complete-invite</code> before tokens are issued</li>
                  <li>Tokens stored in localStorage, user object decoded from JWT claims</li>
                  <li>Cognito groups in JWT claims map to app roles (admin → ADMIN, hr → HR, etc.)</li>
                </ol>
              </div>
            </SubSection>

            <SubSection title="HTTP security headers">
              <DataTable
                headers={["Header", "Value", "Protection"]}
                rows={[
                  ["X-Frame-Options", "SAMEORIGIN", "Prevents clickjacking in iframes"],
                  ["X-Content-Type-Options", "nosniff", "Prevents MIME-type sniffing attacks"],
                  ["Referrer-Policy", "strict-origin-when-cross-origin", "Controls referrer information leakage"],
                  ["Permissions-Policy", "camera=(), mic=(), geolocation=()", "Disables sensitive browser APIs"],
                  ["Strict-Transport-Security", "max-age=63072000; preload", "Forces HTTPS for 2 years"],
                  ["Cache-Control (API)", "no-store, max-age=0", "Prevents API response caching"],
                ]}
              />
            </SubSection>

            <SubSection title="Data security">
              <div className="space-y-2.5">
                <InfoCard variant="tip">
                  AWS credentials are <strong>never exposed to the browser</strong>. All DynamoDB and S3 operations run server-side in Next.js API routes or server components.
                </InfoCard>
                <InfoCard variant="info">
                  Resume files are stored in S3 with <strong>presigned URLs</strong> that expire after 1 hour. Direct public access to the S3 bucket is blocked.
                </InfoCard>
                <InfoCard variant="warning">
                  Admin API routes require an Authorization header with a valid Cognito Bearer token. Requests without a token receive a <code>401 Unauthorized</code> response.
                </InfoCard>
              </div>
            </SubSection>
          </section>

        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
