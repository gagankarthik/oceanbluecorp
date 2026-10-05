import { cn } from "@/lib/utils";
import { IconCheck, IconClock, IconUser, IconArrowRight, type Icon } from "./icons";

/* The product cards behind the solutions showcase: one per offer, each a small
   illustrative UI of what that offer looks like in practice. Values are
   example content, the way a product screenshot is, not reported figures.

   `on` marks the card the canvas is centred on: its bars grow in and the demo
   cursor presses its action. */

type CardProps = { on: boolean };

function Shell({
  on,
  title,
  sub,
  cta,
  children,
}: {
  on: boolean;
  title: string;
  sub: string;
  cta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden border border-line bg-white">
      <div className="px-5 pt-5 text-center">
        <p className="type-title text-ink">{title}</p>
        <p className="mt-1 text-[12.5px] text-ink-subtle">{sub}</p>
      </div>
      <div className="px-5 pt-4">{children}</div>
      <div className="px-5 pt-4 pb-5">
        <span
          className={cn(
            "flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-ink text-[13px] font-semibold text-white",
            on && "demo-press",
          )}
        >
          {cta}
          <svg aria-hidden viewBox="0 0 8 10" className="size-2 fill-current">
            <path d="M0 0l8 5-8 5z" />
          </svg>
        </span>
      </div>
      <div className="border-t border-line bg-paper py-2.5 text-center text-[11.5px] text-ink-subtle">
        Delivered by <span className="font-semibold text-ink">Oceanblue</span>
      </div>
      {on && <Cursor />}
    </div>
  );
}

/** A pointer that glides onto the card's action and presses it. */
function Cursor() {
  return (
    <svg aria-hidden viewBox="0 0 16 20" className="demo-cursor pointer-events-none absolute size-5 drop-shadow">
      <path d="M1 1l13 9-6 1.2L5 18z" fill="#0b1a33" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function Bar({ on, label, value, tone = "bg-cobalt" }: { on: boolean; label: string; value: number; tone?: string }) {
  return (
    <div>
      <div className="flex justify-between text-[12px] text-ink-muted">
        <span>{label}</span>
        <span className="tabular-nums">{value}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-deep">
        <div className={cn("h-full origin-left rounded-full", tone, on && "demo-grow")} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Row({ icon: I = IconCheck, children, right, tone = "text-success" }: { icon?: Icon; children: React.ReactNode; right?: React.ReactNode; tone?: string }) {
  return (
    <li className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-[12.5px] text-ink">
      <I size={14} className={cn("shrink-0", tone)} />
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {right && <span className="shrink-0 text-[11.5px] text-ink-subtle">{right}</span>}
    </li>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {items.map((c) => (
        <span key={c} className="rounded-full border border-line bg-paper px-2.5 py-0.5 text-[11.5px] text-ink-muted">
          {c}
        </span>
      ))}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11.5px] font-medium text-ink">{label}</p>
      <p className="mt-1 rounded-lg border border-line-strong px-3 py-1.5 text-[12.5px] text-ink-muted">{value}</p>
    </div>
  );
}

function Avatar({ tone = "bg-cobalt-tint text-cobalt" }: { tone?: string }) {
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", tone)}>
      <IconUser size={15} />
    </span>
  );
}

/* ---- IT Staffing & Talent ---- */

function Shortlist({ on }: CardProps) {
  const rows = [
    ["Senior cloud engineer", "AWS · Terraform", "96"],
    ["Data engineer", "Snowflake · dbt", "92"],
    ["Security engineer", "SIEM · IAM", "89"],
  ];
  return (
    <Shell on={on} title="Your shortlist" sub="Matched to the role and the team" cta="Review shortlist">
      <ul className="space-y-2">
        {rows.map(([r, s, m]) => (
          <li key={r} className="flex items-center gap-2.5 rounded-lg border border-line px-2.5 py-2">
            <Avatar />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-medium text-ink">{r}</span>
              <span className="block text-[11.5px] text-ink-subtle">{s}</span>
            </span>
            <span className="rounded-full bg-success-container px-2 py-0.5 text-[11px] font-semibold text-success tabular-nums">{m}%</span>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function ErpProfile({ on }: CardProps) {
  return (
    <Shell on={on} title="Salesforce architect" sub="Available for a six-month engagement" cta="Request interview">
      <div className="flex flex-col items-center">
        <Avatar tone="size-12 bg-cobalt text-white" />
        <div className="mt-3">
          <Chips items={["Sales Cloud", "CPQ", "Apex", "Integration"]} />
        </div>
        <ul className="mt-3 w-full space-y-1.5">
          <Row right="Verified">Technical screening passed</Row>
          <Row right="Verified">References checked</Row>
        </ul>
      </div>
    </Shell>
  );
}

function AiMatch({ on }: CardProps) {
  return (
    <Shell on={on} title="Skills match" sub="Machine learning engineer" cta="Add to shortlist">
      <div className="space-y-2.5">
        <Bar on={on} label="Python" value={95} />
        <Bar on={on} label="Model deployment" value={88} />
        <Bar on={on} label="Data pipelines" value={82} />
        <Bar on={on} label="LLM evaluation" value={76} />
      </div>
    </Shell>
  );
}

function PmOnboard({ on }: CardProps) {
  const steps = [
    ["Kickoff with stakeholders", "Week 1", true],
    ["Delivery plan agreed", "Week 2", true],
    ["First milestone review", "Week 4", false],
  ] as const;
  return (
    <Shell on={on} title="Program onboarding" sub="Program manager, embedded in your PMO" cta="View plan">
      <ol className="relative space-y-3 pl-5">
        <span aria-hidden className="absolute top-1.5 bottom-1.5 left-[5px] w-px bg-line-strong" />
        {steps.map(([t, w, done]) => (
          <li key={t} className="relative text-[12.5px]">
            <span className={cn("absolute top-1 -left-5 size-2.5 rounded-full border-2", done ? "border-cobalt bg-cobalt" : "border-line-strong bg-white")} />
            <span className="text-ink">{t}</span>
            <span className="ml-2 text-ink-subtle">{w}</span>
          </li>
        ))}
      </ol>
    </Shell>
  );
}

/* ---- Engineering Talent ---- */

function MechReq({ on }: CardProps) {
  return (
    <Shell on={on} title="Engineering requisition" sub="Mechanical design" cta="Submit requisition">
      <div className="space-y-2.5">
        <Field label="Discipline" value="Mechanical design engineer" />
        <Field label="Tools" value="SolidWorks, GD&T, FEA" />
        <Field label="Engagement" value="Contract, on-site" />
      </div>
    </Shell>
  );
}

function Electrical({ on }: CardProps) {
  return (
    <Shell on={on} title="Board design review" sub="Electrical & electronics" cta="Approve review">
      <svg viewBox="0 0 240 90" className="h-[90px] w-full rounded-lg border border-line bg-paper">
        <g fill="none" stroke="#1d4ed8" strokeWidth="1.5">
          <path d="M20 45h40l10-15 10 30 10-30 10 15h40" />
          <rect x="150" y="30" width="30" height="30" rx="3" />
          <path d="M180 45h40M40 45v25h160V60" strokeOpacity=".45" />
        </g>
        <g fill="#1d4ed8">
          <circle cx="20" cy="45" r="3" />
          <circle cx="220" cy="45" r="3" />
        </g>
      </svg>
      <ul className="mt-3 space-y-1.5">
        <Row>Schematic checked</Row>
        <Row icon={IconClock} tone="text-warning" right="In review">
          Layout sign-off
        </Row>
      </ul>
    </Shell>
  );
}

function Aerospace({ on }: CardProps) {
  return (
    <Shell on={on} title="Program team" sub="Aerospace engineering" cta="Staff the program">
      <ul className="space-y-1.5">
        <Row right="Filled">Structures engineer</Row>
        <Row right="Filled">Propulsion engineer</Row>
        <Row icon={IconClock} tone="text-cobalt" right="Sourcing">
          Avionics engineer
        </Row>
      </ul>
      <div className="mt-3">
        <Bar on={on} label="Team staffed" value={67} />
      </div>
    </Shell>
  );
}

function Controls({ on }: CardProps) {
  const lines = [
    ["Line 1 · PLC", "Running", "bg-success"],
    ["Line 2 · HMI", "Running", "bg-success"],
    ["Line 3 · Robot cell", "Commissioning", "bg-warning"],
  ];
  return (
    <Shell on={on} title="Plant controls" sub="Controls & automation" cta="Open commissioning">
      <ul className="space-y-1.5">
        {lines.map(([l, s, d]) => (
          <li key={l} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-[12.5px]">
            <span className={cn("size-2 rounded-full", d, on && "demo-pulse")} />
            <span className="flex-1 text-ink">{l}</span>
            <span className="text-[11.5px] text-ink-subtle">{s}</span>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

/* ---- Enterprise Solutions ---- */

function CloudMigration({ on }: CardProps) {
  return (
    <Shell on={on} title="Cloud migration" sub="Wave 2 of 3, no planned downtime" cta="Promote to production">
      <div className="space-y-2.5">
        <Bar on={on} label="Workloads migrated" value={72} />
        <Bar on={on} label="Tests passing" value={98} tone="bg-success" />
      </div>
      <div className="mt-3">
        <Chips items={["AWS", "Terraform", "Kubernetes"]} />
      </div>
    </Shell>
  );
}

function Security({ on }: CardProps) {
  return (
    <Shell on={on} title="Security posture" sub="Across cloud accounts and endpoints" cta="Review findings">
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 36 36" className="size-16 shrink-0 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#e7edf6" strokeWidth="4" />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="#047857"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="94.2"
            strokeDashoffset="14"
            className={cn(on && "demo-ring")}
          />
        </svg>
        <ul className="flex-1 space-y-1.5 text-[12px]">
          <li className="flex justify-between text-ink-muted">
            Critical <span className="font-semibold text-ink">0</span>
          </li>
          <li className="flex justify-between text-ink-muted">
            High <span className="font-semibold text-ink">2</span>
          </li>
          <li className="flex justify-between text-ink-muted">
            MFA coverage <span className="font-semibold text-ink">100%</span>
          </li>
        </ul>
      </div>
    </Shell>
  );
}

function ErpSync({ on }: CardProps) {
  return (
    <Shell on={on} title="ERP ↔ CRM sync" sub="Orders, accounts and invoices" cta="Run sync">
      <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-paper px-3 py-3 text-[12px] font-semibold text-ink">
        <span className="rounded-md bg-white px-2 py-1 shadow-sm">ERP</span>
        <span className="relative h-px flex-1 bg-line-strong">
          <span className={cn("absolute -top-1 left-0 size-2 rounded-full bg-cobalt", on && "demo-flow")} />
        </span>
        <span className="rounded-md bg-white px-2 py-1 shadow-sm">Salesforce</span>
      </div>
      <ul className="mt-3 space-y-1.5">
        <Row right="Synced">Accounts</Row>
        <Row right="Synced">Sales orders</Row>
      </ul>
    </Shell>
  );
}

function ProductionAi({ on }: CardProps) {
  const pts = [30, 34, 28, 40, 36, 44, 48, 46, 55, 58];
  return (
    <Shell on={on} title="Model in production" sub="Document classifier, v2" cta="Promote v2">
      <svg viewBox="0 0 200 60" className="h-[60px] w-full">
        <polyline
          fill="none"
          stroke="#1d4ed8"
          strokeWidth="2"
          strokeLinejoin="round"
          points={pts.map((p, i) => `${i * 22},${60 - p}`).join(" ")}
          className={cn(on && "demo-draw")}
          pathLength={1}
        />
      </svg>
      <div className="mt-2 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg border border-line py-1.5">
          <p className="text-[11px] text-ink-subtle">Accuracy</p>
          <p className="text-[13px] font-semibold text-ink">94%</p>
        </div>
        <div className="rounded-lg border border-line py-1.5">
          <p className="text-[11px] text-ink-subtle">Latency</p>
          <p className="text-[13px] font-semibold text-ink">180 ms</p>
        </div>
      </div>
    </Shell>
  );
}

/* ---- Managed Services ---- */

function Monitoring({ on }: CardProps) {
  return (
    <Shell on={on} title="24/7 monitoring" sub="Last 30 days, all services" cta="Open dashboard">
      <div className="flex h-10 items-end gap-[3px]">
        {Array.from({ length: 30 }, (_, i) => (
          <span
            key={i}
            className={cn("flex-1 origin-bottom rounded-sm", i === 17 ? "h-6 bg-warning" : "h-full bg-success", on && "demo-rise")}
            style={on ? { animationDelay: `${i * 18}ms` } : undefined}
          />
        ))}
      </div>
      <ul className="mt-3 space-y-1.5">
        <Row right="Operational">API gateway</Row>
        <Row right="Operational">Databases</Row>
      </ul>
    </Shell>
  );
}

function Helpdesk({ on }: CardProps) {
  return (
    <Shell on={on} title="Support queue" sub="Helpdesk & application support" cta="Assign ticket">
      <ul className="space-y-1.5">
        <Row icon={IconClock} tone="text-warning" right="P2 · 12m">
          Password reset for finance team
        </Row>
        <Row icon={IconClock} tone="text-cobalt" right="P3 · 40m">
          Report export times out
        </Row>
        <Row right="Resolved">VPN access for new hire</Row>
      </ul>
    </Shell>
  );
}

function Infra({ on }: CardProps) {
  return (
    <Shell on={on} title="Infrastructure" sub="Cloud & infrastructure management" cta="Apply patches">
      <div className="space-y-2.5">
        <Bar on={on} label="Servers patched" value={96} tone="bg-success" />
        <Bar on={on} label="Reserved capacity used" value={81} />
        <Bar on={on} label="Backups verified" value={100} tone="bg-success" />
      </div>
    </Shell>
  );
}

function Qbr({ on }: CardProps) {
  const bars = [52, 60, 58, 70, 76, 84];
  return (
    <Shell on={on} title="Quarterly review" sub="Service outcomes against the SLA" cta="Download report">
      <div className="flex h-20 items-end gap-2 rounded-lg border border-line bg-paper px-3 pt-3">
        {bars.map((b, i) => (
          <span
            key={i}
            className={cn("flex-1 origin-bottom rounded-t", i === bars.length - 1 ? "bg-cobalt" : "bg-cobalt/30", on && "demo-rise")}
            style={{ height: `${b}%`, animationDelay: on ? `${i * 60}ms` : undefined }}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-[11.5px] text-ink-subtle">Tickets resolved within target, by month</p>
    </Shell>
  );
}

/* ---- Training & Upskilling ---- */

function DevOpsCourse({ on }: CardProps) {
  return (
    <Shell on={on} title="Cloud & DevOps" sub="Instructor-led, six modules" cta="Continue module 4">
      <ul className="space-y-1.5">
        <Row right="Done">Infrastructure as code</Row>
        <Row right="Done">CI/CD pipelines</Row>
        <Row icon={IconArrowRight} tone="text-cobalt" right="Next">
          Containers & Kubernetes
        </Row>
      </ul>
      <div className="mt-3">
        <Bar on={on} label="Cohort progress" value={58} />
      </div>
    </Shell>
  );
}

function DataLab({ on }: CardProps) {
  return (
    <Shell on={on} title="Hands-on lab" sub="Data, analytics & AI" cta="Run lab">
      <pre className="overflow-hidden rounded-lg bg-night px-3 py-2.5 font-mono text-[11.5px] leading-relaxed text-white/80">
        <span className="text-cobalt-light">$</span> dbt run --select sales{"\n"}
        <span className="text-success">✓</span> 12 models built{"\n"}
        <span className={cn("text-cobalt-light", on && "demo-caret")}>$</span>
      </pre>
    </Shell>
  );
}

function ErpSessions({ on }: CardProps) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return (
    <Shell on={on} title="Enablement schedule" sub="ERP & Salesforce, for your admins" cta="Book a seat">
      <div className="grid grid-cols-5 gap-1.5 text-center">
        {days.map((d, i) => (
          <div key={d} className={cn("rounded-lg border py-2 text-[11.5px]", i === 1 || i === 3 ? "border-cobalt bg-cobalt-tint text-cobalt" : "border-line text-ink-subtle")}>
            <p className="font-semibold">{d}</p>
            <p className="mt-0.5">{i === 1 || i === 3 ? "10:00" : "—"}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[11.5px] text-ink-subtle">On-site or virtual, with hands-on labs</p>
    </Shell>
  );
}

function CertPrep({ on }: CardProps) {
  return (
    <Shell on={on} title="Certification prep" sub="Practice assessment results" cta="Schedule exam">
      <div className="space-y-2.5">
        <Bar on={on} label="Before training" value={54} tone="bg-line-strong" />
        <Bar on={on} label="After training" value={86} />
      </div>
      <div className="mt-3">
        <Chips items={["AWS", "Azure", "Salesforce"]} />
      </div>
    </Shell>
  );
}

/** Cards in offer order, one list per practice, matching PRACTICES in practice-showcase. */
export const PRACTICE_CARDS: ((p: CardProps) => React.ReactElement)[][] = [
  [Shortlist, ErpProfile, AiMatch, PmOnboard],
  [MechReq, Electrical, Aerospace, Controls],
  [CloudMigration, Security, ErpSync, ProductionAi],
  [Monitoring, Helpdesk, Infra, Qbr],
  [DevOpsCourse, DataLab, ErpSessions, CertPrep],
];
