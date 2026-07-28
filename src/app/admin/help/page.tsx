"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Search, Command, X } from "lucide-react";
import {
  IconBook, IconCopy, IconHelp, IconMail, IconPhone,
} from "@/components/admin/icons";
import { PageHeader } from "@/components/admin/page-header";
import { Avatar } from "@/components/admin/avatar";
import { Kbd } from "@/components/admin/kbd";
import { useAdmin } from "@/components/admin/admin-provider";
import { cn } from "@/lib/utils";

/* ============================================================================
   Help & contacts.

   Was a single flat grid of nine identical cards under one "Company directory"
   heading. Two problems with that:

   1. The page is called Help but only ever offered a phone list. Someone
      arriving stuck had nothing to act on.
   2. Nine equal cells in one undifferentiated block means finding "who do I
      ask about payroll" is a linear read of every card. Grouping by what each
      person is FOR turns that into one glance at a heading (Law of Common
      Region), and the group labels double as the answer to the question.
   ========================================================================== */

type Team = "Leadership" | "People & HR" | "Recruiting" | "Sales";

interface TeamMember {
  name: string;
  designation: string;
  email: string;
  phone: string;
  team: Team;
}

const teamMembers: TeamMember[] = [
  { name: "Sarojini Gude",       designation: "President",                  email: "sgude@oceanbluecorp.com",    phone: "",                   team: "Leadership"  },
  { name: "Ravi OceanBlue",      designation: "Chief Operating Officer",    email: "ravi@oceanbluecorp.com",     phone: "+1 (614) 352-0189",  team: "Leadership"  },
  { name: "Sushma Moturu",       designation: "Global HR",                  email: "hr@oceanbluecorp.com",       phone: "+1 (614) 352-2777",  team: "People & HR" },
  { name: "Harika Kalam",        designation: "HR Coordinator",             email: "services@oceanbluecorp.com", phone: "+1 (614) 352-2701",  team: "People & HR" },
  { name: "Venky Tadikonda",     designation: "Executive Recruiter",        email: "venky@oceanbluecorp.com",    phone: "+1 (614) 352-2668",  team: "Recruiting"  },
  { name: "Susmitha Pampana",    designation: "Senior Recruiter",           email: "susmitha@oceanbluecorp.com", phone: "+1 (614) 352-2527",  team: "Recruiting"  },
  { name: "Clark A Cristolfoli", designation: "Executive Recruiter",        email: "clark@oceanbluecorp.com",    phone: "+1 (614) 352-2759",  team: "Recruiting"  },
  { name: "Raja Kethineni",      designation: "Executive Recruiter",        email: "raja@oceanbluecorp.com",     phone: "+1 (614) 352-2877",  team: "Recruiting"  },
  { name: "Brent Wallace",       designation: "Sr. Vice President - Sales", email: "bwallace@oceanbluecorp.com", phone: "+1 (614) 352-2701",  team: "Sales"       },
];

/** Group order is seniority-then-function, and doubles as "who to ask first". */
const TEAM_ORDER: { key: Team; blurb: string }[] = [
  { key: "Leadership",  blurb: "Escalations and anything commercial." },
  { key: "People & HR", blurb: "Payroll, benefits, onboarding and policy." },
  { key: "Recruiting",  blurb: "Requisitions, candidates and submissions." },
  { key: "Sales",       blurb: "Client accounts and new business." },
];

// ── copy-to-clipboard ────────────────────────────────────────────────────────

/**
 * Copying an address is the single most common thing anyone does on a
 * directory, and selecting truncated text with a mouse is fiddly. The button
 * confirms in place for ~1.5s rather than firing a toast, so the feedback
 * appears where the eye already is.
 */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      title={copied ? "Copied" : `Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          // Clipboard is permission-gated and unavailable over plain http on
          // some hosts. Staying silent is right: the address is still visible
          // and selectable, so there is nothing the user needs to act on.
        }
      }}
      className={cn(
        "grid h-8 w-8 flex-none place-items-center rounded-[6px] transition-colors",
        "opacity-0 focus-visible:opacity-100 group-hover/row:opacity-100",
        copied
          ? "text-[var(--adm-success)] opacity-100"
          : "text-[var(--adm-ink-subtle)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink-mute)]",
      )}
    >
      {copied ? <Check className="h-4 w-4" /> : <IconCopy className="h-3.5 w-3.5" />}
    </button>
  );
}

/** One contact method — the value is the link, the copy button sits beside it. */
function ContactRow({
  icon: Icon,
  href,
  value,
  label,
  numeric,
}: {
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  value?: string;
  label: string;
  numeric?: boolean;
}) {
  if (!value) {
    return (
      <div className="flex items-center gap-2.5 text-[13.5px]">
        <Icon className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" />
        <span className="select-none text-[var(--adm-ink-subtle)]">Not on record</span>
      </div>
    );
  }
  return (
    <div className="group/row flex items-center gap-2.5">
      <Icon className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" />
      <a
        href={href}
        title={value}
        className={cn(
          "min-w-0 flex-1 truncate text-[13.5px] text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]",
          numeric && "tabular-nums",
        )}
      >
        {value}
      </a>
      <CopyButton value={value} label={label} />
    </div>
  );
}

function DirectoryCard({ member }: { member: TeamMember }) {
  return (
    <div className="flex flex-col gap-3.5 rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-5 shadow-[var(--adm-shadow-sm)] transition-all duration-150 hover:border-[var(--adm-line)] hover:shadow-[var(--adm-shadow-md)]">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={member.name} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-[var(--adm-ink)]">{member.name}</p>
          <p className="truncate text-[13px] text-[var(--adm-ink-subtle)]">{member.designation}</p>
        </div>
      </div>

      <div className="space-y-1 border-t border-[var(--adm-line-soft)] pt-3">
        <ContactRow
          icon={IconMail}
          href={`mailto:${member.email}`}
          value={member.email}
          label="email address"
        />
        <ContactRow
          icon={IconPhone}
          href={member.phone ? `tel:${member.phone.replace(/[^+\d]/g, "")}` : undefined}
          value={member.phone}
          label="phone number"
          numeric
        />
      </div>
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const { openCommandPalette } = useAdmin();
  const [query, setQuery] = React.useState("");

  const q = query.trim().toLowerCase();
  const matches = React.useMemo(
    () =>
      !q
        ? teamMembers
        : teamMembers.filter((m) =>
            [m.name, m.designation, m.email, m.team].some((f) => f.toLowerCase().includes(q)),
          ),
    [q],
  );

  const groups = TEAM_ORDER.map((t) => ({
    ...t,
    people: matches.filter((m) => m.team === t.key),
  })).filter((g) => g.people.length > 0);

  return (
    <div className="pb-10">
      <PageHeader
        title="Help & contacts"
        subtitle="Who to reach at Ocean Blue, and how to get unstuck."
      />

      {/* ── Ways to get help ──
          The page is named Help, so it leads with things you can DO. Without
          this it was a phone list wearing a help label. */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <a
          href="mailto:hr@oceanbluecorp.com"
          className="group flex items-start gap-3 rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4 shadow-[var(--adm-shadow-sm)] transition-all duration-150 hover:-translate-y-px hover:border-[var(--adm-accent)] hover:shadow-[var(--adm-shadow-md)]"
        >
          <span className="grid h-9 w-9 flex-none place-items-center rounded-[8px] bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]">
            <IconHelp className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold text-[var(--adm-ink)]">Ask the team</span>
            <span className="mt-0.5 block text-[13px] leading-snug text-[var(--adm-ink-subtle)]">
              Email HR and it gets routed to the right person.
            </span>
          </span>
        </a>

        <button
          type="button"
          onClick={openCommandPalette}
          className="group flex items-start gap-3 rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4 text-left shadow-[var(--adm-shadow-sm)] transition-all duration-150 hover:-translate-y-px hover:border-[var(--adm-accent)] hover:shadow-[var(--adm-shadow-md)]"
        >
          <span className="grid h-9 w-9 flex-none place-items-center rounded-[8px] bg-[var(--adm-surface-2)] text-[var(--adm-ink-subtle)]">
            <Command className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2 text-[14px] font-semibold text-[var(--adm-ink)]">
              Jump to anything <Kbd>Ctrl K</Kbd>
            </span>
            <span className="mt-0.5 block text-[13px] leading-snug text-[var(--adm-ink-subtle)]">
              Search jobs, candidates and screens from anywhere.
            </span>
          </span>
        </button>

        <Link
          href="/admin/docs"
          className="group flex items-start gap-3 rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4 shadow-[var(--adm-shadow-sm)] transition-all duration-150 hover:-translate-y-px hover:border-[var(--adm-accent)] hover:shadow-[var(--adm-shadow-md)]"
        >
          <span className="grid h-9 w-9 flex-none place-items-center rounded-[8px] bg-[var(--adm-surface-2)] text-[var(--adm-ink-subtle)]">
            <IconBook className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold text-[var(--adm-ink)]">Developer docs</span>
            <span className="mt-0.5 block text-[13px] leading-snug text-[var(--adm-ink-subtle)]">
              API keys, endpoints and integration notes.
            </span>
          </span>
        </Link>
      </div>

      {/* ── Directory ── */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--adm-ink)]">
            Company directory
          </h2>
          <p className="mt-0.5 text-[13.5px] text-[var(--adm-ink-subtle)]">
            Grouped by what each team handles, so you can skip to the right one.
          </p>
        </div>

        <div className="relative w-full sm:w-[280px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--adm-ink-subtle)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setQuery(""); }}
            placeholder="Find a person or team"
            aria-label="Search the directory"
            className="h-10 w-full rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] pl-9 pr-9 text-[14px] text-[var(--adm-ink)] shadow-[inset_0_1px_2px_rgba(16,24,40,0.03)] transition-colors placeholder:text-[var(--adm-ink-subtle)] focus:border-[var(--adm-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)] [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-[5px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink-mute)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] py-16 text-center shadow-[var(--adm-shadow-sm)]">
          <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-[10px] bg-[var(--adm-surface-2)]">
            <Search className="h-5 w-5 text-[var(--adm-ink-subtle)]" />
          </div>
          <p className="text-[15px] font-semibold text-[var(--adm-ink)]">No one matches &ldquo;{query}&rdquo;</p>
          <p className="mt-1 text-[13.5px] text-[var(--adm-ink-subtle)]">
            Try a name, a role, or a team like &ldquo;recruiting&rdquo;.
          </p>
        </div>
      ) : (
        <div className="space-y-7">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="mb-3 flex items-baseline gap-2.5">
                <h3 className="text-[14px] font-semibold text-[var(--adm-ink)]">{group.key}</h3>
                <span className="text-[13px] tabular-nums text-[var(--adm-ink-subtle)]">{group.people.length}</span>
                <span className="hidden text-[13px] text-[var(--adm-ink-subtle)] sm:inline">{group.blurb}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.people.map((member) => (
                  <DirectoryCard key={member.email + member.name} member={member} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
