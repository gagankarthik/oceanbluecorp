"use client";

import { useEffect, useRef, useState, Fragment } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { UserRole, routeAccess } from "@/lib/auth";
import { ARTICLE_KIND_CONFIG, ARTICLE_KINDS, ARTICLE_STATUSES } from "@/lib/articles";
import Icon, { type IconName } from "@/components/portal/icons";
import { Badge, Button, EmptyState, Page, PageHeader, statusTone, type Tone } from "@/components/portal/kit";

// Contents rail. Ids double as URL hashes (#api-reference).
const CATEGORIES: { id: string; label: string; items: { id: string; label: string; icon: IconName }[] }[] = [
  {
    id: "introduction",
    label: "Introduction",
    items: [
      { id: "overview", label: "Overview", icon: "dashboard" },
      { id: "getting-started", label: "Getting started", icon: "sparkle" },
    ],
  },
  {
    id: "core",
    label: "Core features",
    items: [
      { id: "jobs", label: "Job postings", icon: "briefcase" },
      { id: "applications", label: "Applications", icon: "inbox" },
      { id: "talent-bench", label: "Talent bench", icon: "bench" },
    ],
  },
  {
    id: "relationships",
    label: "Relationships",
    items: [
      { id: "clients-vendors", label: "Clients & vendors", icon: "building" },
      { id: "contacts", label: "Contacts", icon: "contact" },
    ],
  },
  {
    id: "publishing-group",
    label: "Publishing",
    items: [{ id: "publishing", label: "Articles", icon: "pen" }],
  },
  {
    id: "administration",
    label: "Administration",
    items: [
      { id: "users-roles", label: "Users & roles", icon: "shield" },
      { id: "search-notifs", label: "Search & alerts", icon: "bell" },
      { id: "content-settings", label: "Content & settings", icon: "settings" },
    ],
  },
  {
    id: "technical",
    label: "Technical",
    items: [
      { id: "api-reference", label: "API reference", icon: "code" },
      { id: "aws-services", label: "AWS services", icon: "globe" },
      { id: "security", label: "Auth & security", icon: "key" },
    ],
  },
];

const ALL_ITEMS = CATEGORIES.flatMap((c) => c.items);

// Route table, read from the access map so it cannot drift from the guards.
const ROUTE_NAMES: Record<string, string> = {
  "/portal": "Dashboard",
  "/portal/state-roles": "State roles",
  "/portal/open-roles": "Open roles",
  "/portal/applications": "Applications",
  "/portal/candidates": "Candidate record",
  "/portal/talent-bench": "Talent bench",
  "/portal/lead-sourcing": "Lead sourcing",
  "/portal/resumes": "Resume bank",
  "/portal/contacts": "Contacts",
  "/portal/clients": "Clients",
  "/portal/vendors": "Vendors",
  "/portal/content": "Site content",
  "/portal/blog": "Blog",
  "/portal/case-studies": "Case studies",
  "/portal/customer-stories": "Customer stories",
  "/portal/news": "News",
  "/portal/users": "Users (Roles & permissions tab: admin)",
  "/portal/developer": "Developer (API keys)",
  "/portal/settings": "Settings (System tab: admin)",
  "/portal/docs": "Developer docs",
  "/portal/help": "Help",
  "/portal/notifications": "Notifications",
};

const ROLE_SHORT: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Admin",
  [UserRole.HR]: "HR",
  [UserRole.RECRUITER]: "Recruiter",
  [UserRole.SALES]: "Sales",
  [UserRole.MEDIA]: "Media",
};
const ROLE_ORDER = [UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES, UserRole.MEDIA];

function accessBadge(roles: UserRole[]): { label: string; tone: Tone } {
  if (roles.length === ROLE_ORDER.length) return { label: "All roles", tone: "blue" };
  if (roles.length === 1) return { label: `${ROLE_SHORT[roles[0]]} only`, tone: "navy" };
  return { label: ROLE_ORDER.filter((r) => roles.includes(r)).map((r) => ROLE_SHORT[r]).join(" · "), tone: "grey" };
}

const ROUTE_ROWS = Object.entries(routeAccess)
  .filter(([route]) => route in ROUTE_NAMES)
  .map(([route, roles]) => ({ route, name: ROUTE_NAMES[route], ...accessBadge(roles) }));

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

const CODE = "rounded-md bg-mist-100 px-1.5 py-0.5 font-mono text-adm-base text-navy-900";

const TONE_MAP: Record<string, Tone> = { slate: "grey", blue: "blue", emerald: "green", amber: "amber", violet: "cyan", indigo: "navy", sky: "cyan", rose: "red", grey: "grey", green: "green", navy: "navy", cyan: "cyan", red: "red" };

/** Badge under the names the reference content uses (admin tones or a status word). */
function DocBadge({ label, tone, status }: { label: string; tone?: string; status?: string; size?: string }) {
  return (
    <Badge tone={tone ? (TONE_MAP[tone] ?? "grey") : statusTone(status ?? label)} dot={!!status}>
      {label}
    </Badge>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="inline-flex h-6 shrink-0 items-center rounded-md bg-mist-0 px-1.5 font-mono text-adm-xs text-navy-900 ring-1 ring-inset ring-mist-300">{children}</kbd>;
}

function SectionHeader({ id, icon, title, description }: { id: string; icon: IconName; title: string; description?: string }) {
  return (
    <div id={id} data-doc-section className="scroll-mt-24 border-b border-mist-200 pb-4">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ocean-50 text-ocean-700">
          <Icon name={icon} className="size-5" />
        </span>
        <h2 className="text-adm-lg font-semibold tracking-tight text-navy-900">
          <a href={`#${id}`} className="hover:underline">
            {title}
          </a>
        </h2>
      </div>
      {description && <p className="mt-2 max-w-[70ch] text-adm-base leading-normal text-mist-600">{description}</p>}
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-lg bg-mist-0 ring-1 ring-mist-200">
      <h3 className="border-b border-mist-200 px-5 py-3 text-adm-md font-semibold text-navy-900">{title}</h3>
      <div className="grid min-w-0 gap-3 p-5">{children}</div>
    </section>
  );
}

function InfoCard({ children, variant = "info" }: { children: React.ReactNode; variant?: "info" | "warning" | "tip" }) {
  const styles = {
    info: "bg-ocean-50 text-navy-900 ring-ocean-200",
    warning: "bg-status-warning-soft text-status-warning-strong ring-status-warning-line",
    tip: "bg-status-success-soft text-status-success-strong ring-status-success-line",
  };
  const icon: Record<"info" | "warning" | "tip", IconName> = { info: "help", warning: "alert", tip: "check" };
  return (
    <div className={`flex items-start gap-3 rounded-lg p-4 text-adm-base leading-normal ring-1 ring-inset ${styles[variant]}`}>
      <Icon name={icon[variant]} className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 [&_code]:break-words [&_code]:font-mono">{children}</div>
    </div>
  );
}

/** Static reference table; scrolls inside itself on phones. */
function DocTable({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="scroll-thin max-w-full overflow-x-auto overflow-y-hidden rounded-lg ring-1 ring-mist-200">
      <table className="w-full min-w-[520px] border-collapse text-adm-base">
        <thead>
          <tr className="border-b border-mist-200 bg-mist-50 text-adm-xs text-mist-600">
            {headers.map((h, i) => (
              <th key={i} scope="col" className="whitespace-nowrap px-4 py-2.5 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-mist-100 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 align-top text-mist-700">
                  {cell}
                </td>
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
    <div className="min-w-0 overflow-hidden rounded-lg bg-navy-950">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-1">
        <span className="truncate font-mono text-adm-xs text-tide-200">{label}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(children).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-adm-base font-medium text-tide-200 hover:bg-white/10"
        >
          <Icon name={copied ? "check" : "copy"} className="size-4" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="scroll-thin max-w-full overflow-x-auto overflow-y-hidden whitespace-pre p-4 font-mono text-adm-xs leading-normal text-mist-0">{children}</pre>
    </div>
  );
}

const METHOD: Record<string, string> = {
  GET: "bg-status-success-soft text-status-success",
  POST: "bg-ocean-50 text-ocean-700",
  PUT: "bg-status-warning-soft text-status-warning",
  DELETE: "bg-status-danger-soft text-status-danger",
  PATCH: "bg-mist-100 text-mist-700",
};
function HttpBadge({ method }: { method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" }) {
  return <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-adm-xs font-semibold ${METHOD[method]}`}>{method}</span>;
}

function Yes() {
  return (
    <span className="inline-flex text-status-success">
      <Icon name="check" className="size-4" />
      <span className="sr-only">Allowed</span>
    </span>
  );
}

function No() {
  return (
    <span className="inline-flex text-mist-600">
      <Icon name="x" className="size-4" />
      <span className="sr-only">No access</span>
    </span>
  );
}

function Well({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-mist-50 p-4 ring-1 ring-inset ring-mist-200">
      <p className="mb-1 text-adm-base font-semibold text-navy-900">{title}</p>
      <p className="max-w-[65ch] text-adm-base text-mist-700">{children}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const setHash = (id: string) => {
  try {
    window.history.replaceState(null, "", `#${id}`);
  } catch {}
};

export default function DocsView() {
  const [activeId, setActiveId] = useState("overview");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Set<string> | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const userScrolled = useRef(false);

  // Scroll-spy; once the reader scrolls, the hash follows so a copied URL lands on the section.
  useEffect(() => {
    const els = ALL_ITEMS.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (!visible.length) return;
        const top = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        setActiveId(top.target.id);
        if (userScrolled.current) setHash(top.target.id);
      },
      { rootMargin: "-10% 0px -60% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    const onScroll = () => {
      userScrolled.current = true;
    };
    window.addEventListener("wheel", onScroll, { passive: true, once: true });
    window.addEventListener("touchmove", onScroll, { passive: true, once: true });
    // Deep link on arrival.
    const id = window.location.hash.slice(1);
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    return () => {
      io.disconnect();
      window.removeEventListener("wheel", onScroll);
      window.removeEventListener("touchmove", onScroll);
    };
  }, []);

  // In-page search: hides chapters whose text doesn't match.
  useEffect(() => {
    const q = query.trim().toLowerCase();
    const sections = [...(content.current?.querySelectorAll<HTMLElement>(":scope > section") ?? [])];
    if (!q) {
      sections.forEach((s) => (s.hidden = false));
      setHits(null);
      return;
    }
    const found = new Set<string>();
    for (const s of sections) {
      const id = s.querySelector<HTMLElement>("[data-doc-section]")?.id;
      const match = (s.textContent ?? "").toLowerCase().includes(q);
      s.hidden = !match;
      if (match && id) found.add(id);
    }
    setHits(found);
  }, [query]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
    setHash(id);
    setOpen(false);
  };

  const activeLabel = ALL_ITEMS.find((i) => i.id === activeId)?.label;

  const rail = (
    <nav aria-label="Documentation contents" className="grid gap-4 p-3 sm:grid-cols-2 lg:grid-cols-1">
      {CATEGORIES.map((cat) => {
        const items = cat.items.filter((i) => !hits || hits.has(i.id));
        if (!items.length) return null;
        return (
          <div key={cat.id}>
            <p className="mb-1 px-3 text-adm-xs font-semibold uppercase tracking-[0.06em] text-mist-600">{cat.label}</p>
            <ul className="grid gap-px">
              {items.map((item) => {
                const active = activeId === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollTo(item.id);
                      }}
                      aria-current={active ? "location" : undefined}
                      className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-adm-base transition-colors duration-150 lg:min-h-9 ${
                        active ? "bg-ocean-50 font-semibold text-ocean-800" : "text-mist-700 hover:bg-mist-100 hover:text-navy-900"
                      }`}
                    >
                      <Icon name={item.icon} className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
      <Page>
        <PageHeader
          title="Developer docs"
          icon="code"
          section="workspace"
          description="How the portal works, the internal REST API, AWS services, and auth."
          actions={
            <Button variant="secondary" icon="key" href="/portal/developer">
              API keys
            </Button>
          }
        />

        <div className="grid items-start gap-6 lg:grid-cols-[248px_minmax(0,1fr)]">
          <div className="grid min-w-0 gap-3 lg:sticky lg:top-4">
            <label className="relative block">
              <span className="sr-only">Search the docs</span>
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the docs"
                className="h-8 w-full rounded-md border border-mist-200 bg-mist-0 pl-9 pr-3 text-adm-base text-navy-900 placeholder:text-placeholder focus:border-mist-400 focus:outline-none"
              />
            </label>
            <div className="overflow-hidden rounded-lg bg-mist-0 ring-1 ring-mist-200">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="docs-contents"
                className="flex min-h-11 w-full items-center justify-between gap-2 px-4 text-left text-adm-base font-medium text-navy-900 hover:bg-mist-50 lg:hidden"
              >
                <span className="min-w-0 truncate">
                  Contents{activeLabel && <span className="font-normal text-mist-600"> · {activeLabel}</span>}
                </span>
                <Icon name="chevronDown" className={`size-4 shrink-0 text-mist-500 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
              </button>
              <div id="docs-contents" className={`scroll-thin max-h-[70vh] overflow-y-auto border-t border-mist-200 lg:block lg:max-h-[calc(100dvh-220px)] lg:border-t-0 ${open ? "block" : "hidden"}`}>
                {rail}
              </div>
            </div>
          </div>

          <div className="min-w-0">
            {hits && hits.size === 0 && (
              <EmptyState framed variant="no-results" title={`Nothing in the docs matches “${query.trim()}”`} body="Try a route, a table name or a feature." onClearFilters={() => setQuery("")} />
            )}
            <div ref={content} className="grid min-w-0 gap-10">
          <section>
            <SectionHeader
              id="overview"
              icon="dashboard"
              title="Overview"
              description="The staff portal: job postings, the applicant pipeline, clients, vendors, contact enquiries, the four publishing sections, and team access."
            />

            <div className="mt-4 overflow-hidden rounded-lg ring-1 ring-mist-200">
            <div className="grid grid-cols-1 gap-px bg-mist-200 sm:grid-cols-2 xl:grid-cols-3">
              {([
                { icon: "briefcase",         label: "Jobs",         desc: "State roles and open roles" },
                { icon: "inbox", label: "Applications", desc: "Every candidate, by pipeline stage" },
                { icon: "bench",       label: "Talent bench", desc: "Candidates ready to place" },
                { icon: "building",      label: "Clients",      desc: "Client and vendor accounts" },
                { icon: "contact",     label: "Contacts",     desc: "Enquiries from the website" },
                { icon: "pen",        label: "Publishing",   desc: "Blog, case studies, stories, news" },
              ] as { icon: IconName; label: string; desc: string }[]).map((f) => (
                <div key={f.label} className="bg-mist-0 p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <Icon name={f.icon} className="size-5 text-mist-500" />
                    <span className="text-adm-base font-semibold text-navy-900">{f.label}</span>
                  </div>
                  <p className="max-w-[65ch] text-adm-base text-mist-700">{f.desc}</p>
                </div>
              ))}
            </div>
            </div>

            <SubSection title="Admin panel URL structure">
              <p className="max-w-[65ch] text-adm-base text-mist-700">
                Read from <code className={CODE}>routeAccess</code> in <code className={CODE}>src/lib/auth/config.ts</code>, the same map the layout enforces.
              </p>
              <DocTable
                headers={["Route", "Page", "Access"]}
                rows={ROUTE_ROWS.map((r) => [r.route, r.name, <DocBadge key={r.route} label={r.label} tone={r.tone} />])}
              />
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="getting-started"
              icon="sparkle"
              title="Getting started"
              description="How to log in, navigate the platform, and use keyboard shortcuts."
            />

            <SubSection title="Authentication">
              <div className="space-y-3">
                <p className="max-w-[65ch] text-adm-base text-mist-700 leading-normal">
                  The console is <strong>staff-only and invite-based</strong>; there is no public sign-up. A forgotten password is reset from the same page with an emailed code. Sign in with your email and password directly on <code className={CODE}>/auth/sign-in</code>; the form posts to <code className={CODE}>/api/auth/signin</code>, which authenticates against Cognito and returns your tokens. There is no Cognito Hosted UI redirect.
                </p>
                <InfoCard variant="info">
                  Sessions are stored in browser localStorage. Closing the browser tab does not sign you out, use <strong>Sign out</strong> in the account menu, top right.
                </InfoCard>
                <InfoCard variant="tip">
                  On your <strong>first sign-in</strong> after an invite, Cognito raises a one-time password change. The sign-in page switches to a &ldquo;Complete your account&rdquo; step where you set your full name, phone, and a permanent password before any tokens are issued.
                </InfoCard>
              </div>
            </SubSection>

            <SubSection title="User roles">
              <DocTable
                headers={["Role", "What it is for"]}
                rows={[
                  [<DocBadge key="1" label="Admin" tone="slate" />, "Everything, including users, roles, API keys, site content and settings"],
                  [<DocBadge key="2" label="HR" tone="blue" />, "Recruiting, clients, vendors, contacts, publishing, and inviting staff"],
                  [<DocBadge key="3" label="Recruiter" tone="emerald" />, "Applications, candidates, bench and resumes. Reads job postings without editing them"],
                  [<DocBadge key="4" label="Sales" tone="amber" />, "Same recruiting access as Recruiter, and can create and edit job postings"],
                  [<DocBadge key="5" label="Media" tone="violet" />, "Publishing sections and the public copy of job postings. No candidates, rates, clients or vendors"],
                ]}
              />
              <InfoCard variant="info">
                These five staff groups are the only roles, and access is granted by naming a role, not by rank. There is no public &ldquo;user&rdquo; account, job applicants submit anonymously through <code className={CODE}>/careers/search</code> with no login required.
              </InfoCard>
            </SubSection>

            <SubSection title="Keyboard shortcuts">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { keys: "Ctrl K", desc: "Open the command palette (⌘ K on a Mac)" },
                  { keys: "Esc", desc: "Close modals, drawers, dropdowns" },
                  { keys: "Enter", desc: "Confirm selection in dropdowns" },
                  { keys: "↑ ↓", desc: "Navigate command palette results" },
                  { keys: "Tab", desc: "Cycle through form fields" },
                ].map((s) => (
                  <div key={s.keys} className="flex min-w-0 items-center gap-3 rounded-lg border border-mist-200 bg-mist-50 px-4 py-3">
                    <Kbd>{s.keys}</Kbd>
                    <span className="text-adm-base text-mist-700">{s.desc}</span>
                  </div>
                ))}
              </div>
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="jobs"
              icon="briefcase"
              title="Job postings"
              description="Create, manage, and track open roles. Jobs are linked to clients, vendors, and applicants."
            />

            <SubSection title="Creating a job">
              <div className="space-y-2 text-adm-base text-mist-700 leading-normal">
                <p className="max-w-[65ch]">Postings live in two lists: <strong>State roles</strong> (<strong>/portal/state-roles</strong>) and <strong>Open roles</strong> (<strong>/portal/open-roles</strong>). Click <strong>New job</strong> on either. Admin, HR, Sales and Media can create and edit; Media does not see or set the commercial fields. The form is organized into sections:</p>
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
                    <DocBadge status={status} label={label} size="md" />
                    {i < arr.length - 1 && <Icon name="chevronRight" className="size-3.5 shrink-0 text-mist-500" />}
                  </Fragment>
                ))}
              </div>
              <InfoCard variant="info">
                Jobs with a <strong>Submission Due Date</strong> in the past are automatically closed by the system on the next page load.
              </InfoCard>
            </SubSection>

            <SubSection title="Job fields reference">
              <DocTable
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
                  ["Client", "No", "Linked client record from /portal/clients (stored as clientId)"],
                  ["Vendor", "No", "Linked vendor record from /portal/vendors (stored as vendorId)"],
                  ["Due Date", "No", "Auto-closes job when this date passes"],
                  ["Assigned Team", "No", "Recruiter manager + team members (email + name)"],
                ]}
              />
            </SubSection>

            <SubSection title="Duplicate a job">
              <p className="max-w-[65ch] text-adm-base text-mist-700 leading-normal">
                In the jobs table, click the <strong>⋯ menu</strong> on any row and select <strong>Duplicate</strong>. A copy is created with a new Posting ID and status reset to <em>Draft</em>. Useful for recurring roles or similar positions.
              </p>
            </SubSection>

            <SubSection title="Export">
              <p className="max-w-[65ch] text-adm-base text-mist-700">
                The <strong>Export</strong> button on the jobs page downloads a CSV with columns: Job ID, Title, Client, Location, Status, Pay Rate, Bill Rate, Manager, Created, Deadline. Applies your current filter/search state.
              </p>
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="applications"
              icon="inbox"
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
                  <div key={status} className="flex flex-col gap-1.5 rounded-lg border border-mist-200 bg-mist-50 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
                    <span className="sm:w-32 sm:flex-none"><DocBadge status={status} label={label} size="md" /></span>
                    <p className="max-w-[65ch] text-adm-base text-mist-700">{desc}</p>
                  </div>
                ))}
              </div>
            </SubSection>

            <SubSection title="Views">
              <DocTable
                headers={["View", "Best for"]}
                rows={[
                  ["Table View", "Bulk scanning, sorting, searching many applicants at once"],
                  ["Kanban View", "Visualizing pipeline stage distribution, drag-and-drop status changes"],
                  ["List View",  "Compact browsing with applicant details at a glance"],
                ]}
              />
            </SubSection>

            <SubSection title="Adding applicants">
              <div className="space-y-3">
                <Well title="From the job detail page">
                  Open a job → click the <strong>Add Applicant</strong> floating button (bottom-right corner). The form opens with that job pre-selected.
                </Well>
                <Well title="From the applications page">
                  Go to <strong>/portal/applications</strong> → click <strong>+ Add Applicant</strong> in the top-right. Select the job from the dropdown.
                </Well>
                <Well title="Portal submissions">
                  Candidates applying through <strong>/careers/search</strong> are automatically added with status <em>New</em>. Confirmation email sent automatically.
                </Well>
              </div>
            </SubSection>

            <SubSection title="Application fields">
              <DocTable
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
                  ["Talent bench", "Toggle to save candidate to the talent pool"],
                ]}
              />
            </SubSection>

            <SubSection title="Export">
              <p className="max-w-[65ch] text-adm-base text-mist-700">
                Use the <strong>Export CSV</strong> button on the applications page to download all filtered results with columns: Name, Email, Phone, Status, Applied, Source, Work Auth.
              </p>
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="talent-bench"
              icon="bench"
              title="Talent bench"
              description="A curated pool of pre-qualified candidates available for future roles."
            />

            <SubSection title="Adding to the bench">
              <div className="space-y-2 text-adm-base text-mist-700 leading-normal">
                <p className="max-w-[65ch]">Toggle <strong>Add to talent bench</strong> when creating or editing an application. The candidate is then visible in <strong>/portal/talent-bench</strong> regardless of job status.</p>
                <InfoCard variant="tip">
                  Bench candidates retain all their application data (skills, visa status, notes, rating). Use the bench to quickly match top candidates when new roles open.
                </InfoCard>
              </div>
            </SubSection>

            <SubSection title="Resume bank">
              <div className="space-y-2 text-adm-base text-mist-700 leading-normal">
                <p className="max-w-[65ch]">The <strong>/portal/resumes</strong> page shows all uploaded resumes stored in S3. Each resume entry has:</p>
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
              icon="building"
              title="Clients & vendors"
              description="Manage the companies you place candidates with (clients) and staffing partners (vendors)."
            />

            <SubSection title="Clients">
              <DocTable
                headers={["Field", "Description"]}
                rows={[
                  ["Name", "Company name, appears on job postings"],
                  ["Website", "Client website URL"],
                  ["Contact Name / Email / Phone", "Primary contact at the client company"],
                  ["Status", "Active or Inactive"],
                  ["Notes", "Internal notes about the client relationship"],
                ]}
              />
              <p className="max-w-[65ch] text-adm-base text-mist-700">A job links to a client by its record id (<code className={CODE}>clientId</code>), picked from the client list on the job form. Rename a client and every linked role follows. Media never sees the client on a job.</p>
            </SubSection>

            <SubSection title="Vendors">
              <DocTable
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
              icon="contact"
              title="Contacts"
              description="Manage inquiries submitted through the website contact form at /contact."
            />

            <SubSection title="Contact status workflow">
              <div className="flex flex-wrap items-center gap-2">
                {([
                  ["New", "blue"],
                  ["Read", "slate"],
                  ["Responded", "emerald"],
                  ["Archived", "slate"],
                ] as const).map(([label, tone], i, arr) => (
                  <Fragment key={label}>
                    <DocBadge tone={tone} label={label} size="md" />
                    {i < arr.length - 1 && <Icon name="chevronRight" className="size-3.5 shrink-0 text-mist-500" />}
                  </Fragment>
                ))}
              </div>
              <p className="max-w-[65ch] text-adm-base text-mist-700">All contact submissions arrive as <strong>New</strong>. Reply from the record (it marks the enquiry <em>Responded</em>), or <em>Archived</em> to hide from active view.</p>
            </SubSection>

            <SubSection title="Contact fields">
              <DocTable
                headers={["Field", "Description"]}
                rows={[
                  ["Name / Email / Phone", "Submitter contact details"],
                  ["Enquiry type", "Hiring staff, or Job Seeker - {area}"],
                  ["Message", "Full inquiry message body"],
                  ["Status", "New / Read / Responded / Archived"],
                  ["Submitted At", "Timestamp of form submission"],
                ]}
              />
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="publishing"
              icon="pen"
              title="Publishing"
              description="Blog posts, case studies, customer stories and news. Admin, HR and Media publish; the API guard is requirePublisher."
            />

            <SubSection title="Sections">
              <DocTable
                headers={["Section", "Portal route", "Public route"]}
                rows={ARTICLE_KINDS.map((k) => [ARTICLE_KIND_CONFIG[k].label, `/portal/${k}`, `/${k}`])}
              />
              <p className="max-w-[65ch] text-adm-base text-mist-700">
                Articles live in <code className={CODE}>oceanblue-content</code> with <code className={CODE}>recordType: &quot;article&quot;</code> and a <code className={CODE}>kind</code>. The house style per kind is in <code className={CODE}>src/lib/editorial.ts</code>.
              </p>
            </SubSection>

            <SubSection title="Status">
              <div className="grid gap-1.5">
                {ARTICLE_STATUSES.map((s) => (
                  <div key={s.key} className="flex flex-col gap-1.5 rounded-lg bg-mist-50 px-4 py-3 ring-1 ring-inset ring-mist-200 sm:flex-row sm:items-center sm:gap-3">
                    <span className="sm:w-32 sm:flex-none">
                      <DocBadge label={s.label} tone={s.tone} />
                    </span>
                    <p className="max-w-[65ch] text-adm-base text-mist-700">{s.hint}</p>
                  </div>
                ))}
              </div>
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="users-roles"
              icon="shield"
              title="Users & roles"
              description="Team access through AWS Cognito groups. Admin and HR; only an admin changes Admin or HR roles."
            />

            <SubSection title="User management">
              <div className="space-y-2 text-adm-base text-mist-700 leading-normal">
                <p className="max-w-[65ch]">Open <strong>/portal/users</strong> to see every staff account. The <strong>Roles &amp; permissions</strong> tab (admins) shows which screens each role opens, generated from the same access rules. You can:</p>
                <ul className="list-disc list-outside ml-5 space-y-1">
                  <li>View all registered users with their email, status, and role</li>
                  <li>Assign a role, which is a Cognito group (admin, hr, recruiter, sales, media)</li>
                  <li>Enable or disable user accounts</li>
                  <li>Delete users from the pool (irreversible)</li>
                </ul>
              </div>
            </SubSection>

            <SubSection title="Role permission matrix">
              <DocTable
headers={["Feature", "Admin", "HR", "Recruiter", "Sales", "Media"]}
                rows={[
                  ["Dashboard", <Yes />, <Yes />, <Yes />, <Yes />, <No />],
                  ["Job postings, read", <Yes />, <Yes />, <Yes />, <Yes />, <Yes />],
                  ["Job postings, create and edit", <Yes />, <Yes />, <No />, <Yes />, <Yes />],
                  ["Job commercials (rates, client, vendor, team)", <Yes />, <Yes />, <Yes />, <Yes />, <No />],
                  ["Applications, candidates, bench, resumes", <Yes />, <Yes />, <Yes />, <Yes />, <No />],
                  ["Clients, vendors, contacts", <Yes />, <Yes />, <No />, <No />, <No />],
                  ["Publishing (blog, case studies, stories, news)", <Yes />, <Yes />, <No />, <No />, <Yes />],
                  ["Users (invite, deactivate)", <Yes />, <Yes />, <No />, <No />, <No />],
                  ["Roles, API keys, site content, developer docs", <Yes />, <No />, <No />, <No />, <No />],
                  ["Settings: profile and security", <Yes />, <Yes />, <Yes />, <Yes />, <Yes />],
                  ["Settings: System tab (maintenance mode)", <Yes />, <No />, <No />, <No />, <No />],
                ]}
              />
            </SubSection>

            <SubSection title="Inviting a team member">
              <ol className="text-adm-base text-mist-700 space-y-1.5 list-decimal list-outside ml-5 leading-normal">
                <li>Go to <strong>/portal/users</strong> → click <strong>Invite user</strong></li>
                <li>Enter the email address and select the role: <code className={CODE}>admin</code>, <code className={CODE}>hr</code>, <code className={CODE}>recruiter</code>, <code className={CODE}>sales</code>, or <code className={CODE}>media</code></li>
                <li>Cognito emails the invite with a temporary password</li>
                <li>On first sign-in they&apos;re prompted to set their full name, phone number, and a permanent password</li>
              </ol>
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="search-notifs"
              icon="bell"
              title="Search & alerts"
              description="Global search across all data and the in-app notification system."
            />

            <SubSection title="Global command palette">
              <div className="space-y-2 text-adm-base text-mist-700">
                <p className="max-w-[65ch]">Press <Kbd>⌘ K</Kbd> (Mac) or <Kbd>Ctrl K</Kbd> (Windows) from anywhere in the admin panel to open the command palette.</p>
                <DocTable
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
              <div className="space-y-2 text-adm-base text-mist-700 leading-normal">
                <p className="max-w-[65ch]">The bell icon in the admin header shows unread notification count. Notifications are created automatically for:</p>
                <ul className="list-disc list-outside ml-5 space-y-1">
                  <li>New application received</li>
                  <li>New contact form submission</li>
                  <li>A task assigned to you on a candidate</li>
                  <li>An application deleted (admins only)</li>
                  <li>New job posting created</li>
                </ul>
                <InfoCard variant="info">
                  Notifications have a <strong>7-day TTL</strong>, they are automatically deleted from DynamoDB after 7 days.
                </InfoCard>
              </div>
            </SubSection>

            <SubSection title="Email notifications (SES)">
              <DocTable
                headers={["Trigger", "Recipients"]}
                rows={[
                  ["New portal application submitted", "Candidate (confirmation) + recruitment manager + assigned team"],
                  ["New job posted", "Assigned team members"],
                  ["Contact form submitted", "The team inbox"],
                  ["Staff invited", "The invitee, from Cognito, with a temporary password"],
                ]}
              />
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="content-settings"
              icon="settings"
              title="Content & settings"
              description="CMS content blocks and application-wide configuration. Admin only."
            />

            <SubSection title="Content management">
              <div className="space-y-2 text-adm-base text-mist-700 leading-normal">
                <p className="max-w-[65ch]"><strong>/portal/content</strong> lets you update website content blocks without deploying code. Sections available:</p>
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

            <SubSection title="Maintenance mode">
              <div className="space-y-2 text-adm-base leading-normal text-mist-700">
                <p className="max-w-[65ch]"><strong>Settings → System</strong> replaces the public site with the maintenance screen. Set <em>Expected back</em> for planned work; left empty, the screen reads as an unexpected outage. <strong>Preview what visitors will see</strong> opens <code className={CODE}>/maintenance</code>.</p>
                <InfoCard variant="info">
                  While it is on, public pages answer <strong>503</strong> with <code>Retry-After</code>, so search engines keep the indexed pages. The console, sign-in, the API, <code>/status</code>, <code>robots.txt</code> and <code>sitemap.xml</code> stay up. The status code follows the switch within 30 seconds.
                </InfoCard>
              </div>
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="api-reference"
              icon="code"
              title="API reference"
              description="Internal REST API routes served from the Next.js App Router. All routes are at /api/*."
            />

            <div className="mt-4">
              <InfoCard variant="info">
                Every handler guards itself as its first statement. The caller is identified by the httpOnly <code>ob_session</code> cookie set at sign-in (an <code>Authorization: Bearer</code> token is also accepted), and the JWT is verified on every request. Public by design, and rate limited: sign-in, password reset, the application and resume upload forms, and the contact form.
              </InfoCard>
            </div>

            <SubSection title="Jobs">
              <DocTable
                headers={["Method", "Route", "Description"]}
                rows={[
                  [<HttpBadge key="1" method="GET" />, "/api/jobs", "List all jobs (optional ?status= filter)"],
                  [<HttpBadge key="2" method="POST" />, "/api/jobs", "Create a new job posting"],
                  [<HttpBadge key="3" method="GET" />, "/api/jobs/[id]", "Get a single job by ID"],
                  [<HttpBadge key="4" method="PUT" />, "/api/jobs/[id]", "Update job fields or status"],
                  [<HttpBadge key="5" method="DELETE" />, "/api/jobs/[id]", "Delete a job (irreversible)"],
                  [<HttpBadge key="6" method="POST" />, "/api/jobs/[id]/duplicate", "Clone a job with new Posting ID"],
                  [<HttpBadge key="7" method="POST" />, "/api/jobs/notify-update", "Send team notification about job update"],
                  [<HttpBadge key="8" method="POST" />, "/api/jobs/[id]/match-candidates", "Rank bench candidates against the posting"],
                ]}
              />
            </SubSection>

            <SubSection title="Applications">
              <DocTable
                headers={["Method", "Route", "Description"]}
                rows={[
                  [<HttpBadge key="1" method="GET" />, "/api/applications", "List applications (?jobId= or ?userId=)"],
                  [<HttpBadge key="2" method="POST" />, "/api/applications", "Create application + send email notifications"],
                  [<HttpBadge key="3" method="GET" />, "/api/applications/[id]", "Get single application"],
                  [<HttpBadge key="4" method="PUT" />, "/api/applications/[id]", "Update status, notes, rating"],
                  [<HttpBadge key="5" method="DELETE" />, "/api/applications/[id]", "Delete application"],
                  [<HttpBadge key="6" method="POST" />, "/api/applications/[id]/analyze", "Parse the attached resume"],
                  [<HttpBadge key="7" method="POST" />, "/api/applications/[id]/job-fit", "Score the candidate against the job"],
                ]}
              />
            </SubSection>

            <SubSection title="Resumes">
              <DocTable
                headers={["Method", "Route", "Description"]}
                rows={[
                  [<HttpBadge key="1" method="POST" />, "/api/resume/upload", "Upload a resume: server-side to S3 + DynamoDB record"],
                  [<HttpBadge key="2" method="POST" />, "/api/resume/parse", "Read a resume and return its structured content, stores nothing (backs the new-applicant autofill)"],
                  [<HttpBadge key="3" method="GET" />, "/api/resume/[id]?applicationId=", "Get presigned download URL, only through an application you can see"],
                  [<HttpBadge key="4" method="DELETE" />, "/api/resume/[id]", "Delete resume from S3 + DynamoDB"],
                  [<HttpBadge key="5" method="GET" />, "/api/resume-bank", "List all resume bank entries"],
                  [<HttpBadge key="6" method="POST" />, "/api/resume-bank", "Upload to resume bank"],
                ]}
              />
            </SubSection>

            <SubSection title="Admin & stats">
              <DocTable
                headers={["Method", "Route", "Description"]}
                rows={[
                  [<HttpBadge key="1" method="GET" />, "/api/admin/stats", "Dashboard statistics (requires auth)"],
                  [<HttpBadge key="2" method="GET" />, "/api/admin/search?q=", "Global search across all entities"],
                  [<HttpBadge key="3" method="GET" />, "/api/users", "List all Cognito users"],
                  [<HttpBadge key="4" method="PATCH" />, "/api/users/[id]", "Update user role / enable / disable"],
                  [<HttpBadge key="5" method="DELETE" />, "/api/users/[id]", "Remove user from Cognito pool"],
                  [<HttpBadge key="6" method="PATCH" />, "/api/users/me", "Update your own profile"],
                  [<HttpBadge key="7" method="POST" />, "/api/users/me/password", "Change your own password"],
                  [<HttpBadge key="8" method="POST" />, "/api/users/invite", "Invite a teammate (Admin, HR)"],
                  [<HttpBadge key="9" method="PUT" />, "/api/content", "Save a site content block, including maintenance mode (Admin)"],
                ]}
              />
            </SubSection>

            <SubSection title="Clients, vendors & contacts">
              <DocTable
                headers={["Method", "Route", "Description"]}
                rows={[
                  [<HttpBadge key="1" method="GET" />, "/api/clients", "List all clients"],
                  [<HttpBadge key="2" method="POST" />, "/api/clients", "Create client"],
                  [<HttpBadge key="3" method="PATCH" />, "/api/clients/[id]", "Update client"],
                  [<HttpBadge key="4" method="GET" />, "/api/vendors", "List all vendors"],
                  [<HttpBadge key="5" method="POST" />, "/api/vendors", "Create vendor"],
                  [<HttpBadge key="6" method="GET" />, "/api/contacts", "List contact submissions"],
                  [<HttpBadge key="7" method="POST" />, "/api/contacts", "Create contact (public, from website form)"],
                  [<HttpBadge key="8" method="PATCH" />, "/api/contacts/[id]", "Update contact status"],
                ]}
              />
            </SubSection>

            <SubSection title="Publishing, pipeline and notifications">
              <DocTable
                headers={["Method", "Route", "Description"]}
                rows={[
                  [<HttpBadge key="1" method="GET" />, "/api/articles", "List articles by kind (Admin, HR, Media)"],
                  [<HttpBadge key="2" method="POST" />, "/api/articles", "Create a blog post, case study, news item or customer story"],
                  [<HttpBadge key="3" method="PATCH" />, "/api/articles/[id]", "Edit, publish, archive"],
                  [<HttpBadge key="4" method="DELETE" />, "/api/articles/[id]", "Delete an article"],
                  [<HttpBadge key="5" method="GET" />, "/api/pipeline", "Submissions, interviews and placements for a candidate or job"],
                  [<HttpBadge key="6" method="POST" />, "/api/pipeline", "Create a pipeline record; the body is validated against a declared schema"],
                  [<HttpBadge key="7" method="PUT" />, "/api/pipeline/[id]", "Update a pipeline record"],
                  [<HttpBadge key="8" method="GET" />, "/api/notifications", "The caller's notifications and unread count"],
                  [<HttpBadge key="9" method="PATCH" />, "/api/notifications", "Mark all as read"],
                ]}
              />
            </SubSection>

            <SubSection title="Sign-in and session">
              <DocTable
                headers={["Method", "Route", "Description"]}
                rows={[
                  [<HttpBadge key="1" method="POST" />, "/api/auth/signin", "Email and password against Cognito; returns tokens or the first-sign-in challenge"],
                  [<HttpBadge key="2" method="POST" />, "/api/auth/complete-invite", "Answer the first-sign-in challenge: name, phone, permanent password"],
                  [<HttpBadge key="3" method="POST" />, "/api/auth/forgot-password", "Email a reset code. Always answers the same, so it cannot confirm an address"],
                  [<HttpBadge key="4" method="POST" />, "/api/auth/reset-password", "Set a new password with the emailed code"],
                  [<HttpBadge key="5" method="POST" />, "/api/auth/session", "Set the httpOnly session cookie; DELETE clears it"],
                  [<HttpBadge key="6" method="GET" />, "/api/status", "Health check, no data"],
                ]}
              />
            </SubSection>

            <SubSection title="Job feed API v1 (partner platforms)">
              <InfoCard variant="tip">
                These are public-facing routes authenticated by API keys (not Cognito). Manage keys at{" "}
                <strong>/portal/developer</strong>. Public docs at <strong>/developers</strong>.
              </InfoCard>
              <DocTable
                headers={["Method", "Route", "Auth", "Description"]}
                rows={[
                  [<HttpBadge key="1" method="GET" />, "/api/v1/jobs", "X-API-Key, jobs:read", "Paginated list of active/open jobs. Query: status, department, type, page, limit"],
                  [<HttpBadge key="2" method="GET" />, "/api/v1/jobs/[id]", "X-API-Key, jobs:read", "Single job by UUID, strips all internal fields"],
                  [<HttpBadge key="3" method="POST" />, "/api/v1/jobs", "X-API-Key, jobs:write", "Partner files a posting. Declared fields only, sanitized, draft unless status is sent"],
                ]}
              />
            </SubSection>

            <SubSection title="API key management (admin)">
              <DocTable
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
              icon="globe"
              title="AWS services"
              description="The platform runs entirely on AWS. All credentials are server-side only and never exposed to the browser."
            />

            <SubSection title="Services in use">
              <DocTable
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
              <DocTable
                headers={["Table", "PK", "GSIs", "Purpose"]}
                rows={[
                  ["oceanblue-jobs", "id", "status-index", "Job postings with all metadata"],
                  ["oceanblue-applications", "id", "userId-index, jobId-index", "Candidate applications (portal + HR-created)"],
                  ["oceanblue-candidates", "id", "email-index, userId-index", "Talent bench candidate profiles"],
                  ["oceanblue-resumes", "id", "userId-index", "Resume metadata (file key, size, type)"],
                  ["oceanblue-contacts", "id", "–", "Contact form submissions"],
                  ["oceanblue-notifications", "id", "–", "In-app notifications (7-day TTL)"],
                  ["oceanblue-clients", "id", "–", "Client company records"],
                  ["oceanblue-vendors", "id", "–", "Vendor partner records"],
                  ["oceanblue-counters", "id", "–", "Auto-increment counters for Posting IDs"],
                  ["oceanblue-content", "id", "–", "Two record types, told apart by recordType: CMS blocks, and published articles"],
                  ["oceanblue-pipeline", "id", "–", "Submissions, interviews and placements"],
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
NEXT_AWS_DYNAMODB_TABLE_CLIENTS=oceanblue-clients
NEXT_AWS_DYNAMODB_TABLE_VENDORS=oceanblue-vendors
NEXT_AWS_DYNAMODB_TABLE_NOTIFICATIONS=oceanblue-notifications
NEXT_AWS_DYNAMODB_TABLE_COUNTERS=oceanblue-counters
NEXT_AWS_DYNAMODB_TABLE_CONTENT=oceanblue-content
NEXT_AWS_DYNAMODB_TABLE_API_KEYS=oceanblue-api-keys
NEXT_AWS_DYNAMODB_TABLE_PIPELINE=oceanblue-pipeline

# Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-2_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=your_client_id
NEXT_PUBLIC_COGNITO_DOMAIN=https://oceanblue.auth.us-east-2.amazoncognito.com
NEXT_PUBLIC_APP_URL=https://oceanbluecorp.com

# SES / SMTP
NEXT_AWS_STMP=smtp_username
NEXT_AWS_STMP_PASSWORD=smtp_password
NEXT_AWS_SES_FROM_EMAIL=hiring@oceanbluecorp.com

# Resume parsing and matching engine (server-side)
NEXT_PUBLIC_RESUME_PARSER_API_URL=https://...
NEXT_EXTRACTION_SHARED_SECRET=shared_secret
RESUME_MATCH_API_URL=https://...
RESUME_MATCH_API_KEY=your_key`}</CodeBlock>
              <InfoCard variant="warning">
                A table variable must exist in three places or production silently falls back to the default name: <code>.env.local</code>, <code>src/lib/aws/config.ts</code>, and <code>amplify.yml</code>.
              </InfoCard>
            </SubSection>
          </section>

          <section>
            <SectionHeader
              id="security"
              icon="key"
              title="Auth & security"
              description="Authentication architecture, HTTP security headers, and data protection."
            />

            <SubSection title="Authentication flow">
              <div className="space-y-2 text-adm-base text-mist-700 leading-normal">
                <ol className="list-decimal list-outside space-y-2 ml-5">
                  <li>User enters email + password on <code className={CODE}>/auth/sign-in</code> and submits to <code className={CODE}>/api/auth/signin</code></li>
                  <li>The route runs Cognito <code className={CODE}>USER_PASSWORD_AUTH</code> and returns ID + access + refresh tokens</li>
                  <li>First-time invited users get a <code className={CODE}>NEW_PASSWORD_REQUIRED</code> challenge, completed via <code className={CODE}>/api/auth/complete-invite</code> before tokens are issued</li>
                  <li>The browser keeps the tokens in localStorage and the server sets an httpOnly <code className={CODE}>ob_session</code> cookie; every API request re-verifies the JWT</li>
                  <li>Cognito groups in the JWT map to the five roles (admin, hr, recruiter, sales, media)</li>
                </ol>
              </div>
            </SubSection>

            <SubSection title="HTTP security headers">
              <DocTable
                headers={["Header", "Value", "Protection"]}
                rows={[
                  ["X-Frame-Options", "SAMEORIGIN", "Prevents clickjacking in iframes"],
                  ["X-Content-Type-Options", "nosniff", "Prevents MIME-type sniffing attacks"],
                  ["Referrer-Policy", "strict-origin-when-cross-origin", "Controls referrer information leakage"],
                  ["Permissions-Policy", "camera=(), mic=(), geolocation=()", "Disables sensitive browser APIs"],
                  ["Strict-Transport-Security", "max-age=63072000; preload", "Forces HTTPS for 2 years"],
                  ["Cache-Control (API)", "no-store, max-age=0", "Prevents API response caching"],
                  ["Content-Security-Policy", "object-src, base-uri, frame-ancestors, form-action enforced", "Blocks plugin embeds, base hijacking, framing and off-site form posts; the full policy runs report-only"],
                  ["X-Robots-Tag (/portal, /auth, /api)", "noindex", "Keeps the console and API out of search results"],
                ]}
              />
            </SubSection>

            <SubSection title="Data security">
              <div className="space-y-3">
                <InfoCard variant="tip">
                  AWS credentials are <strong>never exposed to the browser</strong>. All DynamoDB and S3 operations run server-side in Next.js API routes or server components.
                </InfoCard>
                <InfoCard variant="info">
                  Resume files are stored in S3 with <strong>presigned URLs</strong> that expire after 1 hour. Direct public access to the S3 bucket is blocked.
                </InfoCard>
                <InfoCard variant="warning">
                  A request with no valid session gets <code>401</code>; a valid session without the role gets <code>403</code>. Public forms are rate limited per connection: 5 applications a minute, 10 resume uploads per 5 minutes, 3 contact messages per 5 minutes. Staff are exempt.
                </InfoCard>
              </div>
            </SubSection>
          </section>
            </div>
          </div>
        </div>
      </Page>
    </ProtectedRoute>
  );
}
