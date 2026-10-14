import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Closing from "@/components/site/Closing";
import { company } from "@/lib/site-content";
import { pageMetadata } from "@/lib/seo";
import { CodeBlock } from "./_content";

export const metadata: Metadata = pageMetadata({
  path: "/developers",
  title: "Developers, Job Feed API",
  description: "Integrate Oceanblue Solutions, Inc.'s live job feed into your platform. REST API with API key authentication, pull active job listings in real time.",
});

const BASE = "https://oceanbluecorp.com/api/v1";
const ACCESS_MAIL = `mailto:${company.email}?subject=Job%20Feed%20API%20access%20request`;

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "authentication", label: "Authentication" },
  { id: "endpoints", label: "Endpoints" },
  { id: "filtering", label: "Filtering and pagination" },
  { id: "response-schema", label: "Response schema" },
  { id: "errors", label: "Errors" },
  { id: "quickstart", label: "Quickstart" },
  { id: "get-access", label: "Get access" },
];

// ── Small pieces ──

function C({ children }: { children: React.ReactNode }) {
  return <code className="bg-mist-100 px-1.5 py-0.5 font-mono text-[0.9em] text-navy-900">{children}</code>;
}

function Section({ id, n, title, children }: { id: string; n: number; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="min-w-0 scroll-mt-28 border-t border-mist-200 pt-12 first:border-t-0 first:pt-0">
      <h2 className="display text-[clamp(1.75rem,2.6vw,2.5rem)]">
        <span className="mr-3 font-mono text-[0.5em] font-medium text-mist-500">{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      <div className="mt-6 grid min-w-0 gap-4 leading-relaxed text-navy-900 [&>*]:min-w-0">{children}</div>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto overflow-y-hidden bg-mist-0">
      <table className="w-full min-w-[560px] text-left text-[15px]">
        <thead>
          <tr className="bg-mist-100">
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-mist-200 align-top">
              {r.map((cell, j) => (
                <td key={j} className={`px-4 py-3 ${j === 0 ? "" : "text-mist-700"}`}>
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

const field = (s: string) => <code className="font-mono text-[14px] text-ocean-700">{s}</code>;
const mono = (s: string) => <code className="font-mono text-[14px]">{s}</code>;

function Endpoint({
  method,
  path,
  description,
  params,
  response,
  children,
}: {
  method: "GET" | "POST";
  path: string;
  description: string;
  params: { name: string; type: string; required: boolean; description: string }[];
  response: string;
  children?: React.ReactNode;
}) {
  return (
    <article className="bg-mist-0 p-5 md:p-7">
      <h3 className="flex flex-wrap items-center gap-3">
        <span className={`px-2 py-0.5 font-mono text-[13px] font-semibold ${method === "GET" ? "bg-tide-200 text-navy-900" : "bg-ocean-600 text-white"}`}>
          {method}
        </span>
        <code className="break-all font-mono text-[16px] font-medium">{path}</code>
      </h3>
      <p className="mt-3 text-mist-700">{description}</p>
      <p className="mt-6 text-[14px] font-semibold text-mist-600">Parameters</p>
      <div className="mt-2 border border-mist-200">
        <Table
          head={["Name", "Type", "Required", "Description"]}
          rows={params.map((p) => [field(p.name), mono(p.type), p.required ? "Required" : "Optional", p.description])}
        />
      </div>
      <p className="mt-6 text-[14px] font-semibold text-mist-600">Example response</p>
      <CodeBlock lang="json">{response}</CodeBlock>
      {children}
    </article>
  );
}

// ── Page ──

export default function DevelopersPage() {
  return (
    <>
      <PageHero
        cells={[{ photo: "workstation" }, { tone: "bg-navy-900" }, { photo: "keyboard" }, { tone: "bg-tide-200" }]}
        lines={["Job Feed API"]}
        standfirst="Pull our live job listings into your platform. A versioned REST API that returns JSON, authenticated with an API key."
        side={
          <dl className="grid gap-3">
            <div>
              <dt className="font-semibold text-navy-900">Base URL</dt>
              <dd className="break-all font-mono text-[14px]">{BASE}</dd>
            </div>
            <div>
              <dt className="font-semibold text-navy-900">Auth</dt>
              <dd>API key in the X-API-Key header</dd>
            </div>
            <div>
              <dt className="font-semibold text-navy-900">Version</dt>
              <dd>v1</dd>
            </div>
          </dl>
        }
      />

      <div className="bg-field-paper">
        <div className="gutter grid gap-12 pb-24 md:pb-32 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <nav aria-label="On this page" className="bg-mist-100 p-5 lg:sticky lg:top-24">
              <p className="text-[14px] font-semibold text-mist-600">On this page</p>
              <ol className="mt-3 grid gap-1.5 text-[15px]">
                {NAV.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-navy-900 hover:text-ocean-700 hover:underline">
                      {i + 1}. {s.label}
                    </a>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-[14px] font-semibold text-mist-600">Need a key?</p>
              <a href={ACCESS_MAIL} className="mt-1 inline-block break-all text-[15px] text-ocean-700 underline underline-offset-4">
                {company.email}
              </a>
            </nav>
          </aside>

          <div className="grid min-w-0 gap-16 lg:col-span-8 lg:col-start-5">
            <Section id="overview" n={1} title="Overview">
              <p className="max-w-[68ch]">
                The Oceanblue Solutions, Inc. Job Feed API lets external platforms pull our live job listings. It is a versioned REST API hosted at{" "}
                <C>/api/v1</C>, and every request and response is JSON.
              </p>
              <CodeBlock lang="bash">{`curl ${BASE}/jobs \\
  -H "X-API-Key: obk_live_your_key_here"`}</CodeBlock>
            </Section>

            <Section id="authentication" n={2} title="Authentication">
              <p className="max-w-[68ch]">
                Every request must include your API key in the <C>X-API-Key</C> header. For a quick test you can pass it as the <C>?api_key=</C>{" "}
                query parameter instead.
              </p>
              <p className="max-w-[68ch] border-l-2 border-buoy-400 bg-mist-0 px-5 py-4">
                Keep your API key secret. Do not put it in client-side code or a public repository. Contact us straight away if a key is
                compromised and we will disable it.
              </p>
              <CodeBlock lang="bash">{`# Recommended: header
curl ${BASE}/jobs \\
  -H "X-API-Key: obk_live_your_api_key_here"

# Alternative: query parameter (testing only)
curl "${BASE}/jobs?api_key=obk_live_your_api_key_here"`}</CodeBlock>
              <Table
                head={["Status", "Error", "Meaning"]}
                rows={[
                  [mono("401"), "Missing API key. Pass X-API-Key header.", "No key was sent"],
                  [mono("401"), "Invalid API key.", "The key is not in our system"],
                  [mono("403"), "API key is disabled.", "The key has been revoked or disabled"],
                  [mono("403"), 'This API key does not have the "<scope>" scope.', "The key lacks the scope this endpoint needs"],
                ]}
              />

              <h3 className="mt-6 text-[clamp(1.25rem,1.6vw,1.5rem)] font-semibold">Scopes</h3>
              <p className="max-w-[68ch]">
                Each key is issued at one of two access levels. A read-only key that calls a write endpoint gets a <C>403</C> naming the scope it is
                missing, in a <C>requiredScope</C> field. Ask your Oceanblue contact if you need a level changed; the key value itself does not change.
              </p>
              <Table
                head={["Access level", "Scopes", "Endpoints"]}
                rows={[
                  ["View jobs", field("jobs:read"), "GET /api/v1/jobs, GET /api/v1/jobs/:id"],
                  ["Create and view jobs", field("jobs:read, jobs:write"), "All of the above, plus POST /api/v1/jobs"],
                ]}
              />
            </Section>

            <Section id="endpoints" n={3} title="Endpoints">
              <Endpoint
                method="GET"
                path="/api/v1/jobs"
                description="Returns a paginated list of job listings, newest first. Without a status filter it returns only active and open jobs."
                params={[
                  { name: "status", type: "string", required: false, description: "active, open, paused or closed. Any other value is ignored" },
                  { name: "department", type: "string", required: false, description: "Exact department name, case-insensitive" },
                  { name: "type", type: "string", required: false, description: "Employment type, see Filtering and pagination" },
                  { name: "page", type: "integer", required: false, description: "Page number (default 1)" },
                  { name: "limit", type: "integer", required: false, description: "Results per page, 1 to 100 (default 20)" },
                ]}
                response={`{
  "data": [
    {
      "id": "b3f1a2c4-...",
      "postingId": "OB-2025-0042",
      "title": "Senior SAP Consultant",
      "department": "SAP Practice",
      "location": "Columbus, OH",
      "state": "OH",
      "type": "contract",
      "workplace": "hybrid",
      "description": "<p>We are seeking...</p>",
      "requirements": "<ul><li>5+ years SAP experience</li></ul>",
      "responsibilities": "<ul><li>Lead implementation</li></ul>",
      "status": "active",
      "submissionDueDate": "2025-06-15T00:00:00.000Z",
      "postedByName": "Jane Doe",
      "createdAt": "2025-05-01T14:22:00.000Z"
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

              <Endpoint
                method="GET"
                path="/api/v1/jobs/:id"
                description="Returns a single job by its UUID, whatever its status."
                params={[{ name: "id", type: "string", required: true, description: "Job UUID, from the id field in list results" }]}
                response={`{
  "data": {
    "id": "b3f1a2c4-...",
    "postingId": "OB-2025-0042",
    "title": "Senior SAP Consultant",
    "department": "SAP Practice",
    "location": "Columbus, OH",
    "state": "OH",
    "type": "contract",
    "description": "<p>We are seeking a Senior SAP Consultant...</p>",
    "requirements": "<ul><li>5+ years SAP experience</li></ul>",
    "responsibilities": "<ul><li>Lead full-cycle implementation</li></ul>",
    "salary": { "min": 80, "max": 110, "currency": "USD" },
    "status": "active",
    "submissionDueDate": "2025-06-15T00:00:00.000Z",
    "postedByName": "Jane Doe",
    "createdAt": "2025-05-01T14:22:00.000Z",
    "updatedAt": "2025-05-02T09:10:00.000Z"
  }
}`}
              />

              <Endpoint
                method="POST"
                path="/api/v1/jobs"
                description="Files a new job posting. Needs a key with the jobs:write scope. Fields not listed here are ignored."
                params={[
                  { name: "title", type: "string", required: true, description: "Job title, up to 200 characters" },
                  { name: "department", type: "string", required: true, description: "Business unit or practice area, up to 120 characters" },
                  { name: "type", type: "string", required: true, description: "full-time, part-time, contract, contract-to-hire, direct-hire or managed-teams" },
                  { name: "description", type: "string", required: true, description: "Job description. Basic HTML is accepted and sanitized on save" },
                  { name: "location", type: "string", required: false, description: "City and state, e.g. Columbus, OH. Required unless workplace is remote" },
                  { name: "workplace", type: "string", required: false, description: "on-site, hybrid or remote" },
                  { name: "state", type: "string", required: false, description: "Two-letter state code" },
                  { name: "requirements", type: "string", required: false, description: "Requirements, as HTML or plain text" },
                  { name: "responsibilities", type: "string", required: false, description: "Responsibilities, as HTML or plain text" },
                  { name: "salary", type: "object", required: false, description: "{ min, max, currency }. Dropped unless min and max are both numbers and max is at least min" },
                  { name: "status", type: "string", required: false, description: "draft (default), active or open. Anything else is rejected" },
                  { name: "submissionDueDate", type: "string", required: false, description: "ISO 8601 application deadline" },
                ]}
                response={`// 201 Created
{
  "data": {
    "id": "9c2e77a1-...",
    "postingId": "OB-2025-0043",
    "title": "Senior SAP Consultant",
    "department": "SAP Practice",
    "location": "Columbus, OH",
    "type": "contract",
    "status": "draft",
    "postedByName": "Your API key's name",
    "createdAt": "2025-05-04T11:02:00.000Z"
  }
}

// 403 when the key is read-only
{
  "error": "This API key does not have the \\"jobs:write\\" scope.",
  "requiredScope": "jobs:write"
}`}
              >
                <p className="mt-2 bg-mist-100 px-5 py-4 text-[15px] text-mist-700">
                  Postings created over the API arrive as <C>draft</C> unless you send <C>status</C>, so a recruiter reviews them before they reach
                  the public jobs page. Rates, client and vendor details and recruiter assignments cannot be set through this endpoint. A{" "}
                  <C>type</C> of <C>remote</C> is still accepted from older integrations and is saved as full-time with a remote workplace.
                </p>
              </Endpoint>
            </Section>

            <Section id="filtering" n={4} title="Filtering and pagination">
              <p className="max-w-[68ch]">
                By default the list endpoint returns only <C>active</C> and <C>open</C> jobs. Query parameters can be combined.
              </p>
              <CodeBlock lang="bash">{`# Active contract jobs, page 2
GET /api/v1/jobs?type=contract&status=active&page=2&limit=10

# Open jobs in the "SAP Practice" department
GET /api/v1/jobs?department=SAP+Practice&status=open

# One job by ID
GET /api/v1/jobs/b3f1a2c4-1234-5678-abcd-ef0123456789`}</CodeBlock>
              <Table
                head={["Parameter", "Values"]}
                rows={[
                  [field("status"), "active · open · paused · closed"],
                  [field("type"), "full-time · part-time · contract · contract-to-hire · direct-hire · managed-teams"],
                  [field("limit"), "Integer 1 to 100. Default 20."],
                ]}
              />
            </Section>

            <Section id="response-schema" n={5} title="Response schema">
              <p className="max-w-[68ch]">
                Job objects contain these fields. Fields with no value are left out of the JSON. Pay rates, bill rates, recruiter assignments and
                other internal fields are never included.
              </p>
              <Table
                head={["Field", "Type", "Notes"]}
                rows={[
                  ["id", "string", "UUID. Use it with /api/v1/jobs/:id"],
                  ["postingId", "string", "Human-readable ID, e.g. OB-2025-0042"],
                  ["title", "string", "Job title"],
                  ["department", "string", "Business unit or practice area"],
                  ["location", "string", "City and state, e.g. Columbus, OH. Empty for a remote role with no base"],
                  ["workplace", "string", "on-site, hybrid or remote. Absent on older postings"],
                  ["state", "string", "Two-letter state code"],
                  ["type", "string", "Employment type. Older postings may still read remote"],
                  ["description", "string", "Full job description, as HTML"],
                  ["requirements", "string | string[]", "HTML on current postings; an array of bullet points on older ones"],
                  ["responsibilities", "string | string[]", "HTML on current postings; an array of bullet points on older ones"],
                  ["salary", "object", "{ min, max, currency, period? } when disclosed. No period means annual"],
                  ["status", "string", "active, open, paused, closed, on-hold or draft"],
                  ["submissionDueDate", "string", "ISO 8601 application deadline"],
                  ["clientName", "string", "End-client company name, when disclosed"],
                  ["vendorName", "string", "Staffing vendor name, when applicable"],
                  ["postedByName", "string", "Who posted it: a recruiter, or the API key's name"],
                  ["createdAt", "string", "ISO 8601 creation time"],
                  ["updatedAt", "string", "ISO 8601 last update"],
                ].map(([f, t, n]) => [field(f), mono(t), n])}
              />
            </Section>

            <Section id="errors" n={6} title="Errors">
              <p className="max-w-[68ch]">
                Every error returns a JSON body with an <C>error</C> field.
              </p>
              <CodeBlock lang="json">{`{
  "error": "Missing API key. Pass X-API-Key header."
}`}</CodeBlock>
              <Table
                head={["HTTP code", "Meaning", "What to do"]}
                rows={[
                  [mono("400"), "The POST body failed validation", "Read the error message, which names the field"],
                  [mono("401"), "Missing or invalid API key", "Check that X-API-Key is set and correct"],
                  [mono("403"), "Key disabled, or missing a scope", "Contact us; the key may be revoked or read-only"],
                  [mono("404"), "Job not found", "The job ID does not exist or was removed"],
                  [mono("500"), "Server error", "Retry after a moment; contact us if it persists"],
                ]}
              />
            </Section>

            <Section id="quickstart" n={7} title="Quickstart">
              <p>Examples to copy and run.</p>
              <h3 className="mt-2 font-semibold">cURL</h3>
              <CodeBlock lang="bash">{`curl ${BASE}/jobs \\
  -H "X-API-Key: obk_live_your_key_here" | jq .`}</CodeBlock>

              <h3 className="mt-2 font-semibold">JavaScript / TypeScript</h3>
              <CodeBlock lang="typescript">{`const BASE = "${BASE}";
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

              <h3 className="mt-2 font-semibold">Python</h3>
              <CodeBlock lang="python">{`import os, requests

BASE = "${BASE}"
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

            <Section id="get-access" n={8} title="Get access">
              <div className="bg-mist-100 p-6 md:p-8">
                <p className="max-w-[56ch]">
                  API access is available to vetted job platforms and technology partners. Email our team and we will issue you an API key within one
                  business day.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={ACCESS_MAIL}
                    className="inline-flex min-h-12 items-center bg-ocean-600 px-6 font-medium text-white btn-fill btn-fill-ocean active:scale-[0.98]"
                  >
                    Request API access
                  </a>
                  <Link
                    href="/jobs"
                    className="inline-flex min-h-12 items-center px-6 font-medium text-navy-900 ring-2 ring-inset ring-navy-900 btn-fill btn-fill-outline active:scale-[0.98]"
                  >
                    View open jobs
                  </Link>
                </div>
              </div>
            </Section>
          </div>
        </div>
      </div>

      <Closing
        lines={["Building on", "our job feed?"]}
        sentence="Tell us about your platform and we will set up the right access level for it."
      />
    </>
  );
}
