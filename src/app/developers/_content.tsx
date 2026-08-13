"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  Key,
  Globe,
  Lock,
  ChevronRight,
  Terminal,
  Zap,
  AlertTriangle,
  Mail,
  ArrowRight,
  Code2,
  BookOpen,
} from "lucide-react";

// ── Primitives ────────────────────────────────────────────────────────────────

function CodeBlock({ lang = "bash", children }: { lang?: string; children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden border border-slate-800 my-4">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-2">
        <span className="text-[10px] text-[var(--hz-text-subtle)] font-mono uppercase tracking-wider">{lang}</span>
        <button
          onClick={() => {
            void navigator.clipboard.writeText(children);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex items-center gap-1.5 text-[11px] text-[var(--hz-text-subtle)] hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="bg-slate-950 text-slate-200 text-[13px] leading-relaxed p-4 overflow-x-auto font-mono whitespace-pre">{children}</pre>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${color}`}>
      {label}
    </span>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 mb-16">
      <h2 className="text-2xl font-bold text-[var(--hz-text)] mb-6 flex items-center gap-3">
        <span className="w-1 h-7 bg-[var(--hz-cobalt)] rounded-full block" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function EndpointCard({
  method,
  path,
  description,
  params,
  responseExample,
}: {
  method: "GET" | "POST" | "DELETE" | "PUT";
  path: string;
  description: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  responseExample?: string;
}) {
  const [open, setOpen] = useState(false);
  const methodColors: Record<string, string> = {
    GET: "bg-emerald-100 text-emerald-700 border-emerald-200",
    POST: "bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] border-[var(--hz-cobalt-100)]",
    PUT: "bg-amber-100 text-amber-700 border-amber-200",
    DELETE: "bg-rose-100 text-rose-700 border-rose-200",
  };
  return (
    <div className="border border-[var(--hz-paper-line)] rounded-xl overflow-hidden mb-3 hover:border-slate-300 transition-colors">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[var(--hz-paper)] transition-colors"
      >
        <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded border ${methodColors[method]}`}>
          {method}
        </span>
        <code className="text-sm font-mono text-[var(--hz-text)] flex-1">{path}</code>
        <span className="text-sm text-[var(--hz-text-subtle)] hidden sm:block">{description}</span>
        <ChevronRight className={`w-4 h-4 text-[var(--hz-text-subtle)] flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-[var(--hz-paper-line)] px-5 py-5 bg-[var(--hz-paper)] space-y-5">
          <p className="text-sm text-[var(--hz-text-mute)]">{description}</p>
          {params && params.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--hz-text-subtle)] uppercase tracking-wider mb-3">Parameters</p>
              <div className="overflow-x-auto rounded-lg border border-[var(--hz-paper-line)] bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--hz-paper)] border-b border-[var(--hz-paper-line)]">
                      <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-[var(--hz-text-subtle)] uppercase tracking-wider">Name</th>
                      <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-[var(--hz-text-subtle)] uppercase tracking-wider">Type</th>
                      <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-[var(--hz-text-subtle)] uppercase tracking-wider">Required</th>
                      <th className="py-2.5 px-4 text-left text-[11px] font-semibold text-[var(--hz-text-subtle)] uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {params.map((p) => (
                      <tr key={p.name}>
                        <td className="py-2.5 px-4"><code className="text-xs font-mono text-[var(--hz-cobalt)]">{p.name}</code></td>
                        <td className="py-2.5 px-4"><code className="text-xs font-mono text-[var(--hz-text-subtle)]">{p.type}</code></td>
                        <td className="py-2.5 px-4">
                          {p.required
                            ? <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">required</span>
                            : <span className="text-[10px] text-[var(--hz-text-subtle)]">optional</span>}
                        </td>
                        <td className="py-2.5 px-4 text-sm text-[var(--hz-text-mute)]">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {responseExample && (
            <div>
              <p className="text-xs font-semibold text-[var(--hz-text-subtle)] uppercase tracking-wider mb-2">Example Response</p>
              <CodeBlock lang="json">{responseExample}</CodeBlock>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "authentication", label: "Authentication" },
  { id: "endpoints", label: "Endpoints" },
  { id: "filtering", label: "Filtering & Pagination" },
  { id: "response-schema", label: "Response Schema" },
  { id: "errors", label: "Errors" },
  { id: "quickstart", label: "Quickstart" },
  { id: "get-access", label: "Get Access" },
];

// ── Main component ─────────────────────────────────────────────────────────────

export default function DevelopersContent() {
  return (
    <div className="horizon min-h-screen bg-[var(--hz-paper)]">
      {/* Hero, the landing page's header, on paper. It was a dark diagonal
          gradient with white type and three translucent pill chips, each chip
          carrying a differently-coloured icon (yellow, emerald, cyan), which
          put three accents on a page that runs on one. The CODE BLOCKS below
          stay dark on purpose: a terminal is dark because that is what a
          terminal looks like, and inverting them would make them harder to
          read, not more consistent. Chrome follows the site; code follows
          code. */}
      <section className="w-full bg-[var(--hz-paper)] pt-16 sm:pt-20 lg:pt-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <span className="hz-eyebrow block text-[var(--hz-cobalt)]">Developer documentation</span>
          <h1 className="hz-display mt-5 max-w-[18ch] text-[clamp(2.25rem,5vw,4rem)] leading-[1.0] tracking-[-0.03em] text-[var(--hz-text)]">
            Job Feed API
          </h1>
          <p className="mt-7 max-w-[54ch] text-[17px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[19px]">
            Pull Ocean Blue Corporation&apos;s live job listings directly into your platform.
            Real-time REST API, authenticated with API keys, versioned, and ready to integrate.
          </p>
          <ul className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-2.5 border-t border-[var(--hz-paper-line)] pt-6">
            {[
              { Icon: Zap, label: "Real-time data" },
              { Icon: Lock, label: "API key auth" },
              { Icon: Globe, label: "REST / JSON" },
            ].map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-[13.5px] text-[var(--hz-text-mute)]">
                <Icon className="h-4 w-4 flex-none text-[var(--hz-cobalt)]" strokeWidth={1.75} />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 flex gap-12">

        {/* Sidebar nav */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          {/* top-24 (96px), not top-8. The site header is FIXED and 72px tall,
              so a sticky offset of 32px parks this list underneath it, the
              nav scrolled up and then disappeared behind the bar. 96px clears
              the header with a 24px gap, and matches the `scroll-mt-24` on the
              sections below so a clicked anchor lands at the same line the
              sidebar sits on.

              The max-height and overflow matter once the list plus the "Need a
              key?" card is taller than the viewport: without them the bottom of
              a sticky element is simply unreachable, because it never scrolls
              relative to the page. */}
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
            <p className="text-[10px] font-bold text-[var(--hz-text-subtle)] uppercase tracking-widest mb-3">On this page</p>
            <nav className="space-y-0.5">
              {NAV.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-sm text-[var(--hz-text-subtle)] hover:text-[var(--hz-cobalt)] py-1 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-8 rounded-xl border border-[var(--hz-paper-line)] bg-white p-4">
              <p className="text-xs font-semibold text-[var(--hz-cobalt)] mb-1">Need a key?</p>
              <p className="text-xs text-[var(--hz-cobalt)] mb-3">Contact us to get an API key for your platform.</p>
              <a
                href="mailto:hr@oceanbluecorp.com"
                className="flex items-center gap-1.5 text-xs font-semibold text-[var(--hz-cobalt)] hover:text-[var(--hz-cobalt-600)] transition-colors"
              >
                <Mail className="w-3 h-3" />
                hr@oceanbluecorp.com
              </a>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 max-w-3xl">

          {/* Overview */}
          <Section id="overview" title="Overview">
            <p className="text-[var(--hz-text-mute)] leading-relaxed mb-4">
              The Ocean Blue Corporation Job Feed API lets external platforms pull our live job listings.
              It&apos;s a versioned REST API hosted at <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-[var(--hz-cobalt)]">/api/v1</code> and returns JSON.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Globe, title: "Base URL", desc: "https://oceanbluecorp.com/api/v1" },
                { icon: Terminal, title: "Format", desc: "JSON, all requests and responses" },
                { icon: Lock, title: "Auth", desc: "API key via X-API-Key header" },
                { icon: BookOpen, title: "Versioning", desc: "Current version: v1" },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 p-4 border border-[var(--hz-paper-line)] rounded-xl">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-[var(--hz-cobalt)]">
                    <item.icon className="w-4 h-4 text-[var(--hz-cobalt)]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--hz-text-subtle)] uppercase tracking-wider">{item.title}</p>
                    <p className="text-sm text-[var(--hz-text)] mt-0.5 font-mono break-all">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Authentication */}
          <Section id="authentication" title="Authentication">
            <p className="text-[var(--hz-text-mute)] leading-relaxed mb-4">
              Every request must include your API key in the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">X-API-Key</code> request header.
              You can alternatively pass it as a query parameter <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">?api_key=</code> for quick testing.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Keep your API key secret. Do not expose it in client-side code or public repositories.
                Contact us immediately if a key is compromised, we can disable it instantly.
              </p>
            </div>
            <CodeBlock lang="bash">{`# Recommended: header
curl https://oceanbluecorp.com/api/v1/jobs \\
  -H "X-API-Key: obk_live_your_api_key_here"

# Alternative: query param (testing only)
curl "https://oceanbluecorp.com/api/v1/jobs?api_key=obk_live_your_api_key_here"`}</CodeBlock>

            <div className="overflow-x-auto rounded-xl border border-[var(--hz-paper-line)] mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--hz-paper)] border-b border-[var(--hz-paper-line)]">
                    <th className="py-3 px-4 text-left text-[11px] font-semibold text-[var(--hz-text-subtle)] uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-left text-[11px] font-semibold text-[var(--hz-text-subtle)] uppercase tracking-wider">Code</th>
                    <th className="py-3 px-4 text-left text-[11px] font-semibold text-[var(--hz-text-subtle)] uppercase tracking-wider">Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr><td className="py-3 px-4"><Badge label="401" color="bg-rose-100 text-rose-700" /></td><td className="py-3 px-4 font-mono text-xs text-[var(--hz-text-mute)]">Missing API key</td><td className="py-3 px-4 text-[var(--hz-text-mute)]">No X-API-Key header provided</td></tr>
                  <tr><td className="py-3 px-4"><Badge label="401" color="bg-rose-100 text-rose-700" /></td><td className="py-3 px-4 font-mono text-xs text-[var(--hz-text-mute)]">Invalid API key</td><td className="py-3 px-4 text-[var(--hz-text-mute)]">Key not found in our system</td></tr>
                  <tr><td className="py-3 px-4"><Badge label="403" color="bg-orange-100 text-orange-700" /></td><td className="py-3 px-4 font-mono text-xs text-[var(--hz-text-mute)]">Key disabled</td><td className="py-3 px-4 text-[var(--hz-text-mute)]">Key has been revoked or disabled</td></tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* Endpoints */}
          <Section id="endpoints" title="Endpoints">
            <EndpointCard
              method="GET"
              path="/api/v1/jobs"
              description="Returns a paginated list of active and open job listings."
              params={[
                { name: "status", type: "string", required: false, description: "Filter by status: active (default), open, paused, closed" },
                { name: "department", type: "string", required: false, description: "Filter by department name (case-insensitive)" },
                { name: "type", type: "string", required: false, description: "Filter by employment type: full-time, part-time, contract, contract-to-hire, direct-hire, managed-teams, remote" },
                { name: "page", type: "integer", required: false, description: "Page number (default: 1)" },
                { name: "limit", type: "integer", required: false, description: "Results per page, 1–100 (default: 20)" },
              ]}
              responseExample={`{
  "data": [
    {
      "id": "b3f1a2c4-...",
      "postingId": "OB-2025-0042",
      "title": "Senior SAP Consultant",
      "department": "SAP Practice",
      "location": "Columbus, OH",
      "state": "OH",
      "type": "contract",
      "description": "We are seeking...",
      "requirements": ["5+ years SAP experience", "..."],
      "responsibilities": ["Lead implementation", "..."],
      "salary": null,
      "status": "active",
      "submissionDueDate": "2025-06-15T00:00:00.000Z",
      "clientName": "Fortune 500 Retail",
      "postedByName": "Jane Doe",
      "createdAt": "2025-05-01T14:22:00.000Z",
      "updatedAt": null
    }
  ],
  "meta": {
    "total": 38,
    "page": 1,
    "limit": 20,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}`}
            />

            <EndpointCard
              method="GET"
              path="/api/v1/jobs/:id"
              description="Returns a single job listing by its UUID."
              params={[
                { name: "id", type: "string", required: true, description: "Job UUID (from the id field in list results)" },
              ]}
              responseExample={`{
  "data": {
    "id": "b3f1a2c4-...",
    "postingId": "OB-2025-0042",
    "title": "Senior SAP Consultant",
    "department": "SAP Practice",
    "location": "Columbus, OH",
    "state": "OH",
    "type": "contract",
    "description": "We are seeking a Senior SAP Consultant...",
    "requirements": ["5+ years SAP experience"],
    "responsibilities": ["Lead full-cycle implementation"],
    "salary": { "min": 80, "max": 110, "currency": "USD" },
    "status": "active",
    "submissionDueDate": "2025-06-15T00:00:00.000Z",
    "clientName": "Fortune 500 Retail",
    "postedByName": "Jane Doe",
    "createdAt": "2025-05-01T14:22:00.000Z",
    "updatedAt": "2025-05-02T09:10:00.000Z"
  }
}`}
            />
          </Section>

          {/* Filtering & Pagination */}
          <Section id="filtering" title="Filtering & Pagination">
            <p className="text-[var(--hz-text-mute)] leading-relaxed mb-4">
              By default the list endpoint returns only <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">active</code> and <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">open</code> jobs.
              You can combine any query params.
            </p>
            <CodeBlock lang="bash">{`# Active contract jobs in Ohio, page 2
GET /api/v1/jobs?type=contract&status=active&page=2&limit=10

# All open jobs in "SAP Practice" department
GET /api/v1/jobs?department=SAP+Practice&status=open

# Specific job by ID
GET /api/v1/jobs/b3f1a2c4-1234-5678-abcd-ef0123456789`}</CodeBlock>

            <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--hz-paper-line)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--hz-paper)] border-b border-[var(--hz-paper-line)]">
                    <th className="py-3 px-4 text-left text-[11px] font-semibold text-[var(--hz-text-subtle)] uppercase tracking-wider">Field</th>
                    <th className="py-3 px-4 text-left text-[11px] font-semibold text-[var(--hz-text-subtle)] uppercase tracking-wider">Values</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[var(--hz-text-mute)]">
                  <tr>
                    <td className="py-3 px-4 font-mono text-xs">status</td>
                    <td className="py-3 px-4 text-xs">
                      <code className="bg-slate-100 px-1 rounded">active</code> · <code className="bg-slate-100 px-1 rounded">open</code> · <code className="bg-slate-100 px-1 rounded">paused</code> · <code className="bg-slate-100 px-1 rounded">closed</code>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-xs">type</td>
                    <td className="py-3 px-4 text-xs">
                      <code className="bg-slate-100 px-1 rounded">full-time</code> · <code className="bg-slate-100 px-1 rounded">part-time</code> · <code className="bg-slate-100 px-1 rounded">contract</code> · <code className="bg-slate-100 px-1 rounded">contract-to-hire</code> · <code className="bg-slate-100 px-1 rounded">direct-hire</code> · <code className="bg-slate-100 px-1 rounded">managed-teams</code> · <code className="bg-slate-100 px-1 rounded">remote</code>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-xs">limit</td>
                    <td className="py-3 px-4 text-xs">Integer 1–100. Default 20.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* Response Schema */}
          <Section id="response-schema" title="Response Schema">
            <p className="text-[var(--hz-text-mute)] leading-relaxed mb-4">
              All job objects returned by the API contain these fields. Internal fields (pay rates, recruiter details, billing data) are never included.
            </p>
            <div className="overflow-x-auto rounded-xl border border-[var(--hz-paper-line)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--hz-paper)] border-b border-[var(--hz-paper-line)]">
                    <th className="py-3 px-4 text-left text-[11px] font-semibold text-[var(--hz-text-subtle)] uppercase tracking-wider">Field</th>
                    <th className="py-3 px-4 text-left text-[11px] font-semibold text-[var(--hz-text-subtle)] uppercase tracking-wider">Type</th>
                    <th className="py-3 px-4 text-left text-[11px] font-semibold text-[var(--hz-text-subtle)] uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ["id", "string", "UUID, use this to fetch by /api/v1/jobs/:id"],
                    ["postingId", "string | null", "Human-readable ID, e.g. OB-2025-0042"],
                    ["title", "string", "Job title"],
                    ["department", "string", "Business unit / practice area"],
                    ["location", "string", "City and state, e.g. Columbus, OH"],
                    ["state", "string | null", "Two-letter state code"],
                    ["type", "string", "Employment type, see filtering table above"],
                    ["description", "string", "Full job description text"],
                    ["requirements", "string[]", "Array of requirement bullet points"],
                    ["responsibilities", "string[]", "Array of responsibility bullet points"],
                    ["salary", "object | null", "{ min, max, currency } if disclosed"],
                    ["status", "string", "active | open | paused | closed"],
                    ["submissionDueDate", "string | null", "ISO 8601 application deadline"],
                    ["clientName", "string | null", "End-client company name if disclosed"],
                    ["vendorName", "string | null", "Staffing vendor name if applicable"],
                    ["postedByName", "string | null", "Name of the recruiter who posted"],
                    ["createdAt", "string", "ISO 8601 creation timestamp"],
                    ["updatedAt", "string | null", "ISO 8601 last-updated timestamp"],
                  ].map(([field, type, notes]) => (
                    <tr key={field} className="hover:bg-[var(--hz-paper)]">
                      <td className="py-3 px-4"><code className="text-xs font-mono text-[var(--hz-cobalt)]">{field}</code></td>
                      <td className="py-3 px-4"><code className="text-xs font-mono text-[var(--hz-text-subtle)]">{type}</code></td>
                      <td className="py-3 px-4 text-xs text-[var(--hz-text-mute)]">{notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Errors */}
          <Section id="errors" title="Errors">
            <p className="text-[var(--hz-text-mute)] leading-relaxed mb-4">
              All errors return a JSON body with an <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">error</code> field.
            </p>
            <CodeBlock lang="json">{`{
  "error": "Missing API key. Pass X-API-Key header."
}`}</CodeBlock>
            <div className="overflow-x-auto rounded-xl border border-[var(--hz-paper-line)] mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--hz-paper)] border-b border-[var(--hz-paper-line)]">
                    <th className="py-3 px-4 text-left text-[11px] font-semibold text-[var(--hz-text-subtle)] uppercase tracking-wider">HTTP Code</th>
                    <th className="py-3 px-4 text-left text-[11px] font-semibold text-[var(--hz-text-subtle)] uppercase tracking-wider">Meaning</th>
                    <th className="py-3 px-4 text-left text-[11px] font-semibold text-[var(--hz-text-subtle)] uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ["401", "Missing or invalid API key", "Check that X-API-Key is set and correct"],
                    ["403", "API key disabled", "Contact us, your key may have been revoked"],
                    ["404", "Job not found", "The job ID does not exist or was removed"],
                    ["500", "Internal server error", "Retry after a moment; contact us if persistent"],
                  ].map(([code, meaning, action]) => (
                    <tr key={code} className="hover:bg-[var(--hz-paper)]">
                      <td className="py-3 px-4"><Badge label={code} color={code === "404" ? "bg-slate-100 text-[var(--hz-text-mute)]" : code === "500" ? "bg-rose-100 text-rose-700" : "bg-orange-100 text-orange-700"} /></td>
                      <td className="py-3 px-4 text-sm text-[var(--hz-text-mute)]">{meaning}</td>
                      <td className="py-3 px-4 text-sm text-[var(--hz-text-subtle)]">{action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Quickstart */}
          <Section id="quickstart" title="Quickstart">
            <p className="text-[var(--hz-text-mute)] leading-relaxed mb-4">Copy-paste examples to get up and running in minutes.</p>

            <p className="text-sm font-semibold text-[var(--hz-text-mute)] mb-2">cURL</p>
            <CodeBlock lang="bash">{`curl https://oceanbluecorp.com/api/v1/jobs \\
  -H "X-API-Key: obk_live_your_key_here" | jq .`}</CodeBlock>

            <p className="text-sm font-semibold text-[var(--hz-text-mute)] mb-2 mt-5">JavaScript / TypeScript</p>
            <CodeBlock lang="typescript">{`const BASE = "https://oceanbluecorp.com/api/v1";
const KEY  = process.env.OCEAN_BLUE_API_KEY;

async function getJobs(page = 1) {
  const res = await fetch(\`\${BASE}/jobs?page=\${page}&limit=20\`, {
    headers: { "X-API-Key": KEY! },
  });
  if (!res.ok) throw new Error(\`API error \${res.status}\`);
  return res.json(); // { data: Job[], meta: { total, page, ... } }
}

async function getJob(id: string) {
  const res = await fetch(\`\${BASE}/jobs/\${id}\`, {
    headers: { "X-API-Key": KEY! },
  });
  if (!res.ok) throw new Error(\`API error \${res.status}\`);
  return res.json(); // { data: Job }
}`}</CodeBlock>

            <p className="text-sm font-semibold text-[var(--hz-text-mute)] mb-2 mt-5">Python</p>
            <CodeBlock lang="python">{`import os, requests

BASE = "https://oceanbluecorp.com/api/v1"
HEADERS = {"X-API-Key": os.environ["OCEAN_BLUE_API_KEY"]}

def get_jobs(page=1, limit=20):
    r = requests.get(f"{BASE}/jobs", headers=HEADERS,
                     params={"page": page, "limit": limit})
    r.raise_for_status()
    return r.json()  # {"data": [...], "meta": {...}}

def get_job(job_id: str):
    r = requests.get(f"{BASE}/jobs/{job_id}", headers=HEADERS)
    r.raise_for_status()
    return r.json()  # {"data": {...}}`}</CodeBlock>
          </Section>

          {/* Get Access */}
          <Section id="get-access" title="Get Access">
            {/* Flat paper and a hairline, not a tinted gradient card with a
                shadowed icon tile, the same close the marketing pages use. */}
            <div className="rounded-2xl border border-[var(--hz-paper-line)] bg-[var(--hz-paper)] p-8 text-center">
              <Key className="mx-auto mb-4 h-7 w-7 text-[var(--hz-cobalt)]" strokeWidth={1.75} />
              <h3 className="text-xl font-bold text-[var(--hz-text)] mb-2">Ready to integrate?</h3>
              <p className="text-[var(--hz-text-mute)] mb-6 max-w-md mx-auto text-sm leading-relaxed">
                API access is available to vetted job platforms and technology partners.
                Reach out to our team and we&apos;ll issue you an API key within one business day.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="mailto:hr@oceanbluecorp.com?subject=Job Feed API Access Request"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--hz-cobalt)] hover:bg-[var(--hz-cobalt)] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  <Mail className="w-4 h-4" />
                  Request API Access
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  href="/careers"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-[var(--hz-paper-line)] hover:border-slate-300 text-[var(--hz-text-mute)] text-sm font-semibold rounded-xl transition-colors"
                >
                  View Open Positions
                </Link>
              </div>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
