"use client";

import { useState } from "react";
import { IconCheck, IconChevronRight, IconArrowRight, IconLock, IconMail, IconKey, IconTerminal, IconClock } from "@/components/site/icons";
import { IconCopy, IconGlobe, IconBracesDoc, IconAlert } from "@/components/site/resources/icons";
import { LinkButton } from "@/components/site/button";
import { GeoStack } from "@/components/site/geo-art";
import { CONTAINER, OPENER_Y, SECTION_Y } from "@/components/site/sections";

// ── Primitives ────────────────────────────────────────────────────────────────

function CodeBlock({ lang = "bash", children }: { lang?: string; children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    // min-w-0 + overflow-x-auto on the <pre>: long lines scroll inside the pane, never the page.
    <div className="my-4 min-w-0 overflow-hidden rounded-xl border border-white/10 bg-night shadow-overlay">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2">
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-full bg-white/25" />
          <span aria-hidden className="size-2.5 rounded-full bg-white/25" />
          <span aria-hidden className="size-2.5 rounded-full bg-white/25" />
          <span className="ml-2 font-mono text-[11.5px] text-white/70">{lang}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(children);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex min-h-9 items-center gap-1.5 rounded-md px-2.5 type-caption text-white/75 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-w-full overflow-x-auto p-4 font-mono text-[13px] leading-relaxed whitespace-pre text-white/90">{children}</pre>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[11.5px] font-semibold ${color}`}>
      {label}
    </span>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-14 scroll-mt-28 border-t border-line pt-14 first:border-t-0 first:pt-0 last:mb-0">
      <h2 className="mb-6 type-headline-sm font-semibold text-ink">{title}</h2>
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
    GET: "bg-success-container text-success border-success/25",
    POST: "bg-cobalt-tint text-cobalt-deep border-cobalt-light",
    PUT: "bg-warning-container text-warning border-warning/25",
    DELETE: "bg-danger-container text-danger border-danger/25",
  };
  return (
    <div className="mb-3 min-w-0 overflow-hidden rounded-xl border border-line bg-white transition-colors hover:border-line-strong">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-14 w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-paper sm:px-5"
      >
        <span className={`flex-none rounded-md border px-2 py-0.5 font-mono text-[12px] font-semibold ${methodColors[method]}`}>
          {method}
        </span>
        <code className="min-w-0 flex-1 font-mono text-[14px] break-all text-ink">{path}</code>
        <span className="hidden max-w-[22rem] truncate type-body-sm text-ink-subtle md:block">{description}</span>
        <IconChevronRight size={16} className={`flex-shrink-0 text-ink-subtle transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="min-w-0 space-y-5 border-t border-line bg-paper px-4 py-5 sm:px-5">
          <p className="type-body text-ink-muted">{description}</p>
          {params && params.length > 0 && (
            <div>
              <p className="mb-3 type-label font-semibold text-ink">Parameters</p>
              <div className="overflow-x-auto rounded-lg border border-line bg-white">
                <table className="w-full min-w-[560px] type-body-sm">
                  <thead>
                    <tr className="bg-paper border-b border-line">
                      <th className="py-2.5 px-4 text-left type-caption font-semibold text-ink-subtle">Name</th>
                      <th className="py-2.5 px-4 text-left type-caption font-semibold text-ink-subtle">Type</th>
                      <th className="py-2.5 px-4 text-left type-caption font-semibold text-ink-subtle">Required</th>
                      <th className="py-2.5 px-4 text-left type-caption font-semibold text-ink-subtle">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {params.map((p) => (
                      <tr key={p.name}>
                        <td className="py-2.5 px-4"><code className="text-xs font-mono text-cobalt">{p.name}</code></td>
                        <td className="py-2.5 px-4"><code className="text-xs font-mono text-ink-subtle">{p.type}</code></td>
                        <td className="py-2.5 px-4">
                          {p.required
                            ? <span className="rounded-md bg-danger-container px-1.5 py-0.5 type-caption font-semibold text-danger">required</span>
                            : <span className="type-caption text-ink-subtle">optional</span>}
                        </td>
                        <td className="py-2.5 px-4 text-sm text-ink-muted">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {responseExample && (
            <div>
              <p className="mb-2 type-label font-semibold text-ink">Example response</p>
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
    <>
      <section data-opener className="border-b border-line bg-white">
        <div className={`${CONTAINER} ${OPENER_Y} grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-12`}>
          <div className="lg:col-span-7">
            <p className="rise type-label font-semibold text-cobalt">Developer documentation</p>
            <h1 className="rise mt-3 type-headline-lg font-semibold text-ink" style={{ animationDelay: "80ms" }}>
              Job Feed API
            </h1>
            <p className="rise mt-6 max-w-[58ch] type-body-lg text-ink-muted" style={{ animationDelay: "160ms" }}>
              Pull Oceanblue Solutions, Inc.&apos;s live job listings directly into your platform.
              Real-time REST API, authenticated with API keys, versioned, and ready to integrate.
            </p>
            <div className="rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "240ms" }}>
              <LinkButton href="#quickstart" variant="primary" size="lg">
                Quickstart
                <IconArrowRight size={16} />
              </LinkButton>
              <LinkButton href="#get-access" variant="outline" size="lg">
                Request an API key
              </LinkButton>
            </div>
          </div>
          {/* The request a reader will make first, set as a live terminal. */}
          <div className="rise min-w-0 lg:col-span-5" style={{ animationDelay: "300ms" }}>
            <CodeBlock lang="bash">{`curl https://oceanbluecorp.com/api/v1/jobs \\
  -H "X-API-Key: obk_live_your_key_here"`}</CodeBlock>
            <ul className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2.5">
              {[
                { Icon: IconClock, label: "Real-time data" },
                { Icon: IconLock, label: "API key auth" },
                { Icon: IconGlobe, label: "REST / JSON" },
              ].map(({ Icon, label }) => (
                <li key={label} className="flex items-center gap-2 type-body-sm text-ink-muted">
                  <Icon size={16} className="flex-none text-cobalt" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Body */}
      <div data-tone="white" className={`bg-white ${SECTION_Y}`}>
      <div className={`${CONTAINER} flex gap-12`}>

        {/* Sidebar nav. top-28 clears the fixed header; the max-height keeps
            the foot of a tall sticky list reachable. */}
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <div className="sticky top-28 max-h-[calc(100vh-9rem)] overflow-y-auto pr-1">
            <p className="mb-3 type-label font-semibold text-ink">On this page</p>
            <nav className="space-y-0.5 border-l border-line">
              {NAV.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="-ml-px block border-l border-transparent py-1 pl-4 type-body-sm text-ink-muted transition-colors hover:border-ink hover:text-ink"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-8 rounded-xl border border-line bg-paper p-4">
              <p className="mb-1 type-label font-semibold text-ink">Need a key?</p>
              <p className="mb-3 type-caption text-ink-muted">Contact us to get an API key for your platform.</p>
              <a href="mailto:hr@oceanbluecorp.com" className="flex items-center gap-1.5 type-caption font-semibold text-cobalt hover:text-cobalt-deep">
                <IconMail size={14} />
                hr@oceanbluecorp.com
              </a>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 max-w-3xl flex-1">
          <nav aria-label="On this page" className="-mx-4 mb-12 overflow-x-auto px-4 lg:hidden">
            <ul className="flex w-max gap-2">
              {NAV.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="inline-flex h-11 items-center rounded-full border border-line-strong bg-white px-4 type-body-sm font-medium whitespace-nowrap text-ink">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Overview */}
          <Section id="overview" title="Overview">
            <p className="mb-4 type-body text-ink-muted">
              The Oceanblue Solutions, Inc. Job Feed API lets external platforms pull our live job listings.
              It&apos;s a versioned REST API hosted at <code className="bg-paper px-1.5 py-0.5 rounded text-sm font-mono text-cobalt">/api/v1</code> and returns JSON.
            </p>
            <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
              {[
                { icon: IconGlobe, title: "Base URL", desc: "https://oceanbluecorp.com/api/v1" },
                { icon: IconTerminal, title: "Format", desc: "JSON, all requests and responses" },
                { icon: IconLock, title: "Auth", desc: "API key via X-API-Key header" },
                { icon: IconBracesDoc, title: "Versioning", desc: "Current version: v1" },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 bg-white p-5">
                  <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg border border-line text-ink">
                    <item.icon size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="type-label font-semibold text-ink-subtle">{item.title}</p>
                    <p className="mt-0.5 font-mono text-[13.5px] break-all text-ink">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Authentication */}
          <Section id="authentication" title="Authentication">
            <p className="mb-4 type-body text-ink-muted">
              Every request must include your API key in the <code className="bg-paper px-1.5 py-0.5 rounded text-sm font-mono">X-API-Key</code> request header.
              You can alternatively pass it as a query parameter <code className="bg-paper px-1.5 py-0.5 rounded text-sm font-mono">?api_key=</code> for quick testing.
            </p>
            <div className="mb-5 flex gap-3 rounded-xl border border-warning/25 bg-warning-container p-4">
              <IconAlert size={18} className="mt-0.5 flex-shrink-0 text-warning" />
              <p className="type-body-sm text-warning">
                Keep your API key secret. Do not expose it in client-side code or public repositories.
                Contact us immediately if a key is compromised, we can disable it instantly.
              </p>
            </div>
            <CodeBlock lang="bash">{`# Recommended: header
curl https://oceanbluecorp.com/api/v1/jobs \\
  -H "X-API-Key: obk_live_your_api_key_here"

# Alternative: query param (testing only)
curl "https://oceanbluecorp.com/api/v1/jobs?api_key=obk_live_your_api_key_here"`}</CodeBlock>

            <div className="overflow-x-auto rounded-xl border border-line mt-2">
              <table className="w-full min-w-[560px] type-body-sm">
                <thead>
                  <tr className="bg-paper border-b border-line">
                    <th className="py-3 px-4 text-left type-caption font-semibold text-ink-subtle">Status</th>
                    <th className="py-3 px-4 text-left type-caption font-semibold text-ink-subtle">Code</th>
                    <th className="py-3 px-4 text-left type-caption font-semibold text-ink-subtle">Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <tr><td className="py-3 px-4"><Badge label="401" color="bg-danger-container text-danger border-danger/25" /></td><td className="py-3 px-4 font-mono text-xs text-ink-muted">Missing API key</td><td className="py-3 px-4 text-ink-muted">No X-API-Key header provided</td></tr>
                  <tr><td className="py-3 px-4"><Badge label="401" color="bg-danger-container text-danger border-danger/25" /></td><td className="py-3 px-4 font-mono text-xs text-ink-muted">Invalid API key</td><td className="py-3 px-4 text-ink-muted">Key not found in our system</td></tr>
                  <tr><td className="py-3 px-4"><Badge label="403" color="bg-warning-container text-warning border-warning/25" /></td><td className="py-3 px-4 font-mono text-xs text-ink-muted">Key disabled</td><td className="py-3 px-4 text-ink-muted">Key has been revoked or disabled</td></tr>
                  <tr><td className="py-3 px-4"><Badge label="403" color="bg-warning-container text-warning border-warning/25" /></td><td className="py-3 px-4 font-mono text-xs text-ink-muted">Missing scope</td><td className="py-3 px-4 text-ink-muted">Key does not hold the scope this endpoint needs</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className="mt-10 type-title-lg font-semibold text-ink">Scopes</h3>
            <p className="mt-2 mb-4 leading-relaxed text-ink-muted">
              Each key is issued at one of two access levels. A read-only key that calls a write
              endpoint gets a <code className="bg-paper px-1.5 py-0.5 rounded text-sm font-mono">403</code> naming
              the scope it is missing, in a <code className="bg-paper px-1.5 py-0.5 rounded text-sm font-mono">requiredScope</code> field.
              Ask your Oceanblue contact if you need a level changed; the key value itself does not change.
            </p>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[560px] type-body-sm">
                <thead>
                  <tr className="bg-paper border-b border-line">
                    <th className="py-3 px-4 text-left type-caption font-semibold text-ink-subtle">Access level</th>
                    <th className="py-3 px-4 text-left type-caption font-semibold text-ink-subtle">Scopes</th>
                    <th className="py-3 px-4 text-left type-caption font-semibold text-ink-subtle">Endpoints</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[
                    ["View jobs", "jobs:read", "GET /api/v1/jobs, GET /api/v1/jobs/:id"],
                    ["Create and view jobs", "jobs:read, jobs:write", "All of the above, plus POST /api/v1/jobs"],
                  ].map(([level, scopes, endpoints]) => (
                    <tr key={level} className="hover:bg-paper">
                      <td className="py-3 px-4 font-medium text-ink">{level}</td>
                      <td className="py-3 px-4"><code className="text-xs font-mono text-cobalt">{scopes}</code></td>
                      <td className="py-3 px-4 text-xs text-ink-muted">{endpoints}</td>
                    </tr>
                  ))}
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

            <EndpointCard
              method="POST"
              path="/api/v1/jobs"
              description="Files a new job posting. Requires a key with the jobs:write scope."
              params={[
                { name: "title", type: "string", required: true, description: "Job title, up to 200 characters" },
                { name: "department", type: "string", required: true, description: "Business unit / practice area" },
                { name: "location", type: "string", required: true, description: "City and state, e.g. Columbus, OH" },
                { name: "type", type: "string", required: true, description: "full-time | part-time | contract | contract-to-hire | direct-hire | managed-teams | remote" },
                { name: "description", type: "string", required: true, description: "Job description. Basic HTML is accepted and sanitized on save" },
                { name: "state", type: "string", required: false, description: "Two-letter state code" },
                { name: "requirements", type: "string", required: false, description: "Requirements, as HTML or plain text" },
                { name: "responsibilities", type: "string", required: false, description: "Responsibilities, as HTML or plain text" },
                { name: "salary", type: "object", required: false, description: "{ min, max, currency }. Dropped unless min and max are both numbers" },
                { name: "status", type: "string", required: false, description: "draft (default) | active | open. Anything else is rejected" },
                { name: "submissionDueDate", type: "string", required: false, description: "ISO 8601 application deadline" },
              ]}
              responseExample={`// 201 Created
{
  "data": {
    "id": "9c2e77a1-...",
    "postingId": "OB-2025-0043",
    "title": "Senior SAP Consultant",
    "department": "SAP Practice",
    "location": "Columbus, OH",
    "type": "contract",
    "status": "draft",
    "createdAt": "2025-05-04T11:02:00.000Z"
  }
}

// 403 when the key is read-only
{
  "error": "This API key does not have the \"jobs:write\" scope.",
  "requiredScope": "jobs:write"
}`}
            />
            <div className="mt-3 rounded-xl border border-line bg-paper p-4">
              <p className="text-sm text-ink-muted">
                Postings created over the API arrive as <code className="bg-paper px-1.5 py-0.5 rounded text-xs font-mono">draft</code> unless
                you send <code className="bg-paper px-1.5 py-0.5 rounded text-xs font-mono">status</code>, so a
                recruiter reviews them before they reach the public careers site. Rates, client and
                vendor details and recruiter assignments cannot be set through this endpoint.
              </p>
            </div>
          </Section>

          {/* Filtering & Pagination */}
          <Section id="filtering" title="Filtering & Pagination">
            <p className="mb-4 type-body text-ink-muted">
              By default the list endpoint returns only <code className="bg-paper px-1.5 py-0.5 rounded text-sm font-mono">active</code> and <code className="bg-paper px-1.5 py-0.5 rounded text-sm font-mono">open</code> jobs.
              You can combine any query params.
            </p>
            <CodeBlock lang="bash">{`# Active contract jobs in Ohio, page 2
GET /api/v1/jobs?type=contract&status=active&page=2&limit=10

# All open jobs in "SAP Practice" department
GET /api/v1/jobs?department=SAP+Practice&status=open

# Specific job by ID
GET /api/v1/jobs/b3f1a2c4-1234-5678-abcd-ef0123456789`}</CodeBlock>

            <div className="mt-4 overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[560px] type-body-sm">
                <thead>
                  <tr className="bg-paper border-b border-line">
                    <th className="py-3 px-4 text-left type-caption font-semibold text-ink-subtle">Field</th>
                    <th className="py-3 px-4 text-left type-caption font-semibold text-ink-subtle">Values</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ink-muted">
                  <tr>
                    <td className="py-3 px-4 font-mono text-xs">status</td>
                    <td className="py-3 px-4 text-xs">
                      <code className="bg-paper px-1 rounded">active</code> · <code className="bg-paper px-1 rounded">open</code> · <code className="bg-paper px-1 rounded">paused</code> · <code className="bg-paper px-1 rounded">closed</code>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-xs">type</td>
                    <td className="py-3 px-4 text-xs">
                      <code className="bg-paper px-1 rounded">full-time</code> · <code className="bg-paper px-1 rounded">part-time</code> · <code className="bg-paper px-1 rounded">contract</code> · <code className="bg-paper px-1 rounded">contract-to-hire</code> · <code className="bg-paper px-1 rounded">direct-hire</code> · <code className="bg-paper px-1 rounded">managed-teams</code> · <code className="bg-paper px-1 rounded">remote</code>
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
            <p className="mb-4 type-body text-ink-muted">
              All job objects returned by the API contain these fields. Internal fields (pay rates, recruiter details, billing data) are never included.
            </p>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[560px] type-body-sm">
                <thead>
                  <tr className="bg-paper border-b border-line">
                    <th className="py-3 px-4 text-left type-caption font-semibold text-ink-subtle">Field</th>
                    <th className="py-3 px-4 text-left type-caption font-semibold text-ink-subtle">Type</th>
                    <th className="py-3 px-4 text-left type-caption font-semibold text-ink-subtle">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
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
                    <tr key={field} className="hover:bg-paper">
                      <td className="py-3 px-4"><code className="text-xs font-mono text-cobalt">{field}</code></td>
                      <td className="py-3 px-4"><code className="text-xs font-mono text-ink-subtle">{type}</code></td>
                      <td className="py-3 px-4 text-xs text-ink-muted">{notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Errors */}
          <Section id="errors" title="Errors">
            <p className="mb-4 type-body text-ink-muted">
              All errors return a JSON body with an <code className="bg-paper px-1.5 py-0.5 rounded text-sm font-mono">error</code> field.
            </p>
            <CodeBlock lang="json">{`{
  "error": "Missing API key. Pass X-API-Key header."
}`}</CodeBlock>
            <div className="overflow-x-auto rounded-xl border border-line mt-4">
              <table className="w-full min-w-[560px] type-body-sm">
                <thead>
                  <tr className="bg-paper border-b border-line">
                    <th className="py-3 px-4 text-left type-caption font-semibold text-ink-subtle">HTTP Code</th>
                    <th className="py-3 px-4 text-left type-caption font-semibold text-ink-subtle">Meaning</th>
                    <th className="py-3 px-4 text-left type-caption font-semibold text-ink-subtle">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[
                    ["401", "Missing or invalid API key", "Check that X-API-Key is set and correct"],
                    ["403", "API key disabled", "Contact us, your key may have been revoked"],
                    ["404", "Job not found", "The job ID does not exist or was removed"],
                    ["500", "Internal server error", "Retry after a moment; contact us if persistent"],
                  ].map(([code, meaning, action]) => (
                    <tr key={code} className="hover:bg-paper">
                      <td className="py-3 px-4"><Badge label={code} color={code === "404" ? "bg-paper text-ink-muted border-line" : code === "500" ? "bg-danger-container text-danger border-danger/25" : "bg-warning-container text-warning border-warning/25"} /></td>
                      <td className="py-3 px-4 text-sm text-ink-muted">{meaning}</td>
                      <td className="py-3 px-4 text-sm text-ink-subtle">{action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Quickstart */}
          <Section id="quickstart" title="Quickstart">
            <p className="mb-4 type-body text-ink-muted">Copy-paste examples to get up and running in minutes.</p>

            <p className="mb-2 type-label font-semibold text-ink">cURL</p>
            <CodeBlock lang="bash">{`curl https://oceanbluecorp.com/api/v1/jobs \\
  -H "X-API-Key: obk_live_your_key_here" | jq .`}</CodeBlock>

            <p className="mt-6 mb-2 type-label font-semibold text-ink">JavaScript / TypeScript</p>
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

            <p className="mt-6 mb-2 type-label font-semibold text-ink">Python</p>
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
            <div className="grid overflow-hidden rounded-2xl border border-line bg-paper md:grid-cols-12">
              <div className="p-8 sm:p-10 md:col-span-8">
                <span className="flex size-11 items-center justify-center rounded-xl border border-line bg-white text-ink">
                  <IconKey size={20} />
                </span>
                <h3 className="mt-5 type-title-lg font-semibold text-ink">Ready to integrate?</h3>
                <p className="mt-2 max-w-md type-body text-ink-muted">
                  API access is available to vetted job platforms and technology partners.
                  Reach out to our team and we&apos;ll issue you an API key within one business day.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="mailto:hr@oceanbluecorp.com?subject=Job Feed API Access Request"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-cobalt bg-cobalt px-6 text-[15px] font-semibold text-white transition-colors hover:bg-cobalt-deep"
                  >
                    <IconMail size={16} />
                    Request API access
                    <IconArrowRight size={16} />
                  </a>
                  <LinkButton href="/careers" variant="outline" size="lg">
                    View open positions
                  </LinkButton>
                </div>
              </div>
              <div aria-hidden className="hidden items-center justify-center border-l border-line bg-white p-8 md:col-span-4 md:flex">
                <GeoStack className="h-auto w-full max-w-[200px]" />
              </div>
            </div>
          </Section>

        </div>
      </div>
      </div>
    </>
  );
}
