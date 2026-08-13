import type { ComponentType, SVGProps } from "react";

/**
 * Any admin icon component, one of the custom glyphs in this file OR a lucide
 * glyph. Props typed with this accept BOTH, which the plain `LucideIcon` type
 * (a forwardRef exotic) does not: the custom icons are plain function
 * components. Use this for any `icon` prop that a page might feed a custom icon.
 */
export type IconComponent = ComponentType<{ className?: string; strokeWidth?: number | string }>;

/* ============================================================
   Custom admin iconography.

   The dashboard previously borrowed general-purpose Lucide glyphs
   (Users for applications, Activity for the pipeline, CheckCircle
   for conversion) that describe the shape of the data rather than
   what it means here. These are drawn for this domain: a
   requisition, an application record, a hiring funnel, an offer
   awaiting response, an ageing candidate, an unassigned record.

   Rules so they read as one set:
     · 24×24 box, 1.5 stroke, round caps and joins
     · geometry snapped to the half-pixel grid at 16px render size
     · currentColor only, so tone comes from the call site
     · no fills except deliberate solid state dots
   ============================================================ */

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Application record: a document with a candidate mark on it. */
export function IconApplication(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <circle cx="12" cy="13" r="2" />
      <path d="M9 18a3 3 0 0 1 6 0" />
    </svg>
  );
}

/** HR Portal: a person framed in an open doorway, people, through a portal. */
export function IconHrPortal(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 21V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v15" />
      <path d="M3 21h18" />
      <circle cx="12" cy="10.5" r="2" />
      <path d="M8.5 17.5a3.5 3.5 0 0 1 7 0" />
    </svg>
  );
}

/** Requisition: an open role, drawn as a posting board rather than a briefcase. */
export function IconRequisition(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6" />
      <path d="M7 11h6M7 15h4" />
    </svg>
  );
}

/** Pipeline: a funnel, the actual shape of the hiring stages. */
export function IconPipeline(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 4h18l-7 8v7l-4 2v-9z" />
    </svg>
  );
}

/** Conversion: a funnel narrowing to a single confirmed outcome. */
export function IconConversion(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 4h16l-6 7v4" />
      <circle cx="16.5" cy="17.5" r="4.5" />
      <path d="M14.6 17.5l1.4 1.4 2.6-2.8" />
    </svg>
  );
}

/** Offer awaiting response: sealed envelope with a waiting indicator. */
export function IconOfferPending(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h11a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 15.5 15h-11A1.5 1.5 0 0 1 3 13.5z" />
      <path d="M3.4 6l6.6 5 6.6-5" />
      <circle cx="18.5" cy="17.5" r="4" />
      <path d="M18.5 15.8v1.9l1.3.8" />
    </svg>
  );
}

/** Ageing record: an hourglass with the sand run down. */
export function IconStale(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3h10M7 21h10" />
      <path d="M8 3v3.5c0 1.2 1.6 2.6 4 5.5 2.4-2.9 4-4.3 4-5.5V3" />
      <path d="M8 21v-3.5c0-1.2 1.6-2.6 4-5.5 2.4 2.9 4 4.3 4 5.5V21" />
      <path d="M9.5 19h5" strokeWidth={2.5} />
    </svg>
  );
}

/** Unassigned: a person outline with no owner attached. */
export function IconUnassigned(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="8" r="3.5" />
      <path d="M4 20a6 6 0 0 1 12 0" />
      <path d="M17 6.5h5" />
      <path d="M19.5 4v5" />
    </svg>
  );
}

/** Team member throughput, used by the submissions table header. */
export function IconTeam(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="8" r="3" />
      <path d="M2.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8" />
      <path d="M17.5 19a5.5 5.5 0 0 0-2.2-4.4" />
    </svg>
  );
}

/** Source attribution, for the channel breakdown. */
export function IconSource(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 9.5V4M12 14.5V20M9.8 10.8 5.5 6.5M14.2 13.2l4.3 4.3M9.8 13.2 5.5 17.5M14.2 10.8l4.3-4.3" />
    </svg>
  );
}

/** Live/streaming state marker for the refresh control. */
export function IconLive(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
      <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 16.2a6 6 0 0 0 0-8.4" />
      <path d="M4.9 4.9a10 10 0 0 0 0 14.2M19.1 19.1a10 10 0 0 0 0-14.2" opacity={0.45} />
    </svg>
  );
}

/* ============================================================
   Module iconography.

   The set above covers dashboard metrics. This block covers the
   navigation and the screen headers, which were still borrowing
   general-purpose Lucide glyphs, a briefcase for requisitions, a
   building for clients, a box for the bench. Those describe the
   shape of a thing, not what it means in a staffing system, and
   next to the domain icons above they read as a different family.

   IDEA, one rule generates the whole set:

       every icon = a CONTAINER (the record) + a MARK (its state)

   The container is one of three recurring bodies:
     · sheet    , a document with a folded corner  (a person's paper)
     · board    , a rounded rect, r=2              (a posting, a panel)
     · figure   , circle r≈3 + shoulder arc        (a person)

   The mark is what distinguishes them: a funnel for flow, a key for
   access, a pulse for liveness, a plus/tick/clock for state. So
   Applications is sheet+figure, Bench is stacked figures, Clients is
   board+handshake, Vendors is a node network. Scanned as a column in
   the sidebar they read as one alphabet.

   Construction rules, so additions stay consistent:
     · 24×24 box, 1.5 stroke, round caps and joins
     · geometry on the half-pixel grid at 16px render size
     · currentColor only, tone comes from the call site
     · no fills except deliberate solid state dots
     · optical weight balanced: 2–4 strokes per icon, never more
   ============================================================ */

/** Overview: a panel of readings with a live pulse across it. */
export function IconOverview(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M6.5 15.5l2.5-3 2 2.5 2-4 2.5 4.5" />
    </svg>
  );
}

/** Talent bench: figures held in reserve, stacked behind one another. */
export function IconBench(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 9.5h4.5" />
      <path d="M16 13h4.5" />
      <path d="M16 16.5h4.5" />
    </svg>
  );
}

/** Resume: a sheet with a folded corner and a candidate's ruled lines. */
export function IconResume(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M8.5 12.5h7M8.5 16h4.5" />
    </svg>
  );
}

/** Contact enquiry: a message with an unread state dot. */
export function IconContact(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-9l-4.5 3.5V16.5H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z" />
      <circle cx="9" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Client: an account building marked with an agreement tick. */
export function IconClient(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 21h11V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z" />
      <path d="M6.5 9h3M6.5 13h3M6.5 17h3" />
      <path d="M14 21h7v-9h-4" />
      <path d="M16.5 17.5l1.2 1.2 2.3-2.4" />
    </svg>
  );
}

/** Vendor: a supply network, one hub feeding several partners. */
export function IconVendor(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="5" cy="18.5" r="2.5" />
      <circle cx="19" cy="18.5" r="2.5" />
      <path d="M10.3 7.1 6.4 16.2M13.7 7.1l3.9 9.1M7.5 18.5h9" />
    </svg>
  );
}

/** Content: a page composed of layout blocks. */
export function IconContent(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 8.5h18" />
      <path d="M7 12h4v5H7z" />
      <path d="M14 12h3.5M14 15h3.5" />
    </svg>
  );
}

/** Staff: a figure carrying an access mark, an account, not a candidate. */
export function IconStaff(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="8" r="3.5" />
      <path d="M4 20a6 6 0 0 1 11.2-3" />
      <circle cx="17.5" cy="17.5" r="2" />
      <path d="M17.5 19.5v2M16 21h3" />
    </svg>
  );
}

/** Notifications: a bell whose clapper is a live state dot. */
export function IconBell(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10z" />
      <path d="M10.2 19a2 2 0 0 0 3.6 0" />
    </svg>
  );
}

/** Help: a ring buoy, support, not a generic question mark. */
export function IconHelp(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M6 6l3.5 3.5M18 6l-3.5 3.5M6 18l3.5-3.5M18 18l-3.5-3.5" />
    </svg>
  );
}

/** API key: a key whose bit is the record it unlocks. */
export function IconKey(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="7.5" cy="12" r="3.5" />
      <path d="M11 12h9.5" />
      <path d="M17 12v3M20 12v2.5" />
    </svg>
  );
}

/** Roles: a shield banded into permission tiers. */
export function IconRoles(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l7 3v5.5c0 4.4-3 7.7-7 9.5-4-1.8-7-5.1-7-9.5V6z" />
      <path d="M5.4 10.5h13.2" />
      <path d="M7 14.5h10" />
    </svg>
  );
}

/** Developer docs: a reference sheet marked with a code chevron. */
export function IconDocs(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H18a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6.5A1.5 1.5 0 0 1 5 18.5z" />
      <path d="M5 17h14" />
      <path d="M10.5 8L8.5 10.2l2 2.3M13.5 8l2 2.2-2 2.3" />
    </svg>
  );
}

/** Settings: control sliders, not a cog, these are preferences, not machinery. */
export function IconSettings(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
      <circle cx="9" cy="7" r="2" fill="none" />
      <circle cx="15" cy="12" r="2" fill="none" />
      <circle cx="8" cy="17" r="2" fill="none" />
    </svg>
  );
}

/** Export: a record leaving the system into a tray. */
export function IconExport(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v10" />
      <path d="M8.5 9.5 12 13l3.5-3.5" />
      <path d="M4.5 15v3.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V15" />
    </svg>
  );
}

/** Refresh: re-read the record set. */
export function IconRefresh(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 12a8 8 0 1 1-2.5-5.8" />
      <path d="M20 4v4h-4" />
    </svg>
  );
}

/** Coverage: a gauge, supply measured against demand. */
export function IconCoverage(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 17a8 8 0 1 1 16 0" />
      <path d="M12 17l4.2-4.6" />
      <circle cx="12" cy="17" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Time in stage: an ageing mark for velocity readings. */
export function IconDwell(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12.5" r="7.5" />
      <path d="M12 8.5v4.5l3 1.8" />
      <path d="M9.5 3h5" />
    </svg>
  );
}

/* ============================================================
   Semantic UI iconography.

   These replace the general-purpose Lucide glyphs the admin
   pages still pull in for status, people, comms, actions and
   objects. Same construction rules as the module set above, so
   they read as one alphabet next to it:

     · 24×24 box, 1.5 stroke, round caps and joins
     · geometry on the half-pixel grid at 16px render size
     · currentColor only, tone comes from the call site
     · no fills except deliberate solid state dots
     · 2–4 strokes per icon; a recognisable silhouette first

   Kept on Lucide on purpose (a bespoke version would only look
   like a broken copy, or is a trademarked brand mark):
     · mechanical marks, chevrons, X, plus/minus, arrows,
       the loader spinner, menu, panel toggles, ellipsis, ⌘,
       search, external-link, view-mode toggles (grid/list)
     · brand logos. LinkedIn, Twitter/X
   ============================================================ */

/* ── Status & feedback ──────────────────────────────────────── */

/** Alert: a ringed record demanding attention. */
export function IconAlert(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5" />
      <circle cx="12" cy="16" r="0.85" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Warning: a hazard triangle, a stronger note than a plain alert. */
export function IconWarning(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10.3 4.3a2 2 0 0 1 3.4 0l7.1 12.4a2 2 0 0 1-1.7 3H4.9a2 2 0 0 1-1.7-3z" />
      <path d="M12 9.5v4" />
      <circle cx="12" cy="16.8" r="0.85" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Success: a confirmed record, ring plus tick. */
export function IconSuccess(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.2l2.7 2.7L16 9.4" />
    </svg>
  );
}

/** Error / rejected: a ring struck through with a cross. */
export function IconError(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </svg>
  );
}

/** Info: a ring carrying a note. */
export function IconInfo(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11.2v5" />
      <circle cx="12" cy="8" r="0.85" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Blocked / banned: a ring barred through. */
export function IconBlocked(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </svg>
  );
}

/** Clock: a pending or timed record. */
export function IconClock(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v4.7l3.2 1.9" />
    </svg>
  );
}

/** History: a clock wound back, an audit trail. */
export function IconHistory(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.2 12a8.8 8.8 0 1 0 2.8-6.5L3 8" />
      <path d="M3 3.5V8h4.5" />
      <path d="M12 8v4.3l3 1.8" />
    </svg>
  );
}

/* ── People ─────────────────────────────────────────────────── */

/** A single person. */
export function IconUser(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

/** Add / invite a person. */
export function IconUserPlus(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9.5" cy="8" r="3.4" />
      <path d="M3.5 20a6 6 0 0 1 12 0" />
      <path d="M19 8.5v5M16.5 11h5" />
    </svg>
  );
}

/** Remove a person. */
export function IconUserMinus(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9.5" cy="8" r="3.4" />
      <path d="M3.5 20a6 6 0 0 1 12 0" />
      <path d="M16.5 11h5" />
    </svg>
  );
}

/** A verified / hired person. */
export function IconUserCheck(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9.5" cy="8" r="3.4" />
      <path d="M3.5 20a6 6 0 0 1 12 0" />
      <path d="M16.2 11.2l1.7 1.7 3.1-3.3" />
    </svg>
  );
}

/** A rejected / removed person. */
export function IconUserX(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9.5" cy="8" r="3.4" />
      <path d="M3.5 20a6 6 0 0 1 12 0" />
      <path d="M16.5 9l4 4M20.5 9l-4 4" />
    </svg>
  );
}

/** A starred / top-rated person. */
export function IconUserStar(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9.5" cy="8" r="3.4" />
      <path d="M3.5 20a6 6 0 0 1 12 0" />
      <path d="M18.5 7.4l1.15 2.33 2.57.37-1.86 1.81.44 2.56-2.3-1.21-2.3 1.21.44-2.56-1.86-1.81 2.57-.37z" />
    </svg>
  );
}

/** A person with an access role, staff, not a candidate. */
export function IconUserRole(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9.5" cy="8" r="3.4" />
      <path d="M3.5 20a6 6 0 0 1 12 0" />
      <path d="M18.5 7l3 1.2v2.3c0 1.9-1.3 3.3-3 4-1.7-.7-3-2.1-3-4V8.2z" />
    </svg>
  );
}

/** A group, a team or department. */
export function IconGroup(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="8.5" cy="8.5" r="3.1" />
      <path d="M3 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16.5 6.2a3 3 0 0 1 0 5.7" />
      <path d="M17.6 18.5a5.4 5.4 0 0 0-2.3-4.3" />
    </svg>
  );
}

/* ── Communications ─────────────────────────────────────────── */

/** Email, a sealed envelope. */
export function IconMail(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M4 7.5l8 5.5 8-5.5" />
    </svg>
  );
}

/** Opened email, read correspondence. */
export function IconMailOpen(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 10l9-5.5 9 5.5v7.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M3 10l9 6 9-6" />
    </svg>
  );
}

/** Phone, a handset. */
export function IconPhone(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.4 3.5c.9 0 1.6.6 1.8 1.4l.7 2.6c.2.7 0 1.4-.5 1.9l-1.2 1.1a12.5 12.5 0 0 0 4.8 4.8l1.1-1.2c.5-.5 1.2-.7 1.9-.5l2.6.7c.8.2 1.4.9 1.4 1.8v2.3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3.5 5.7 2 2 0 0 1 5.5 3.5z" />
    </svg>
  );
}

/** A message thread. */
export function IconMessage(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5.5h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-9l-4.5 3.5V15.5H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" />
    </svg>
  );
}

/** A message with content, a note. */
export function IconMessageText(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5.5h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-9l-4.5 3.5V15.5H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" />
      <path d="M7 9.5h10M7 12.5h6" />
    </svg>
  );
}

/** Send / submit, a paper plane in flight. */
export function IconSend(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M21 4L3.5 11.2a.4.4 0 0 0 0 .75L10 14.2l2.3 6.4a.4.4 0 0 0 .75.03z" />
      <path d="M21 4l-11 10.2" />
    </svg>
  );
}

/* ── Places & organisations ─────────────────────────────────── */

/** Building, a company or client office. */
export function IconBuilding(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 20.5V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15.5" />
      <path d="M14.5 9.5H19a1 1 0 0 1 1 1v10" />
      <path d="M3 20.5h18" />
      <path d="M7.5 8h4M7.5 12h4M7.5 16h4" />
    </svg>
  );
}

/** Location, a map pin. */
export function IconLocation(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21c4.5-4.6 7-8.2 7-11.2a7 7 0 1 0-14 0C5 12.8 7.5 16.4 12 21z" />
      <circle cx="12" cy="9.8" r="2.6" />
    </svg>
  );
}

/** Globe, the public site, or a region. */
export function IconGlobe(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.7 2.8 2.7 15.2 0 18M12 3c-2.7 2.8-2.7 15.2 0 18" />
    </svg>
  );
}

/* ── Hiring objects ─────────────────────────────────────────── */

/** Job, a briefcase, the role being filled. */
export function IconJob(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
      <path d="M3 12.5h18" />
      <path d="M10.5 12.5h3" />
    </svg>
  );
}

/** Inbox, where new applications land. */
export function IconInbox(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 13l2.4-6.6A2 2 0 0 1 7.3 5h9.4a2 2 0 0 1 1.9 1.4L21 13v4.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M3 13h5l1.4 2.5h5L16 13h5" />
    </svg>
  );
}

/** ID card, a candidate profile. */
export function IconIdCard(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10.8" r="2.2" />
      <path d="M5.4 16a3.2 3.2 0 0 1 6.2 0" />
      <path d="M14.5 9.5h4M14.5 12.5h4M14.5 15.5h2.5" />
    </svg>
  );
}

/** Interview, a candidate in conversation. */
export function IconInterview(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="8.5" r="3.1" />
      <path d="M2.8 19.5a5.4 5.4 0 0 1 10.4 0" />
      <path d="M14 4h6a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2.5L15 12.5V10h-1a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
    </svg>
  );
}

/** Placement, a candidate seated at a client, flag planted. */
export function IconPlacement(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="8.5" cy="8" r="3.2" />
      <path d="M3 19.5a5.5 5.5 0 0 1 11 0" />
      <path d="M17.5 4v16" />
      <path d="M17.5 4.5h4l-1.3 2.3 1.3 2.3h-4" />
    </svg>
  );
}

/* ── Money & metrics ────────────────────────────────────────── */

/** Money, pay rate, bill rate, margin. */
export function IconMoney(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5v17" />
      <path d="M16.3 7.2c-.9-1.4-2.6-2-4.3-2-2.1 0-3.9 1-3.9 2.9 0 4.2 8.4 1.9 8.4 6 0 2-1.9 3-4.2 3-1.9 0-3.7-.7-4.6-2.2" />
    </svg>
  );
}

/** Percent, a rate or ratio. */
export function IconPercent(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 18L18 6" />
      <circle cx="7.5" cy="7.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </svg>
  );
}

/** Trend, a rising line. */
export function IconTrend(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 16.5L9.5 10l4 4L21 6.5" />
      <path d="M15.5 6.5H21V12" />
    </svg>
  );
}

/** Chart, a bar reading. */
export function IconChart(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 4v16h16" />
      <path d="M8 20v-6M13 20v-9M18 20v-4" strokeWidth={2} />
    </svg>
  );
}

/* ── Actions & tools ────────────────────────────────────────── */

/** Edit, a pencil. */
export function IconEdit(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20h4L18.6 9.4a2 2 0 0 0-2.8-2.8L5 17.2z" />
      <path d="M14.5 8l2.8 2.8" />
    </svg>
  );
}

/** Delete, a bin. */
export function IconTrash(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6.5h16" />
      <path d="M9 6.5V5A1.5 1.5 0 0 1 10.5 3.5h3A1.5 1.5 0 0 1 15 5v1.5" />
      <path d="M6 6.5l.9 12.6A2 2 0 0 0 8.9 21h6.2a2 2 0 0 0 2-1.9L18 6.5" />
      <path d="M10 10.5v6M14 10.5v6" />
    </svg>
  );
}

/** Save, write the record to disk. */
export function IconSave(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 4h10.6L20 8.4V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <path d="M8 4v4h6V4" />
      <rect x="7.5" y="12.5" width="9" height="7.5" rx="1" />
    </svg>
  );
}

/** Copy, duplicate the record. */
export function IconCopy(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" />
    </svg>
  );
}

/** Download, pull a record down into a tray. */
export function IconDownload(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5v10.5" />
      <path d="M7.5 9.5L12 14l4.5-4.5" />
      <path d="M4 16.5v2.5a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5v-2.5" />
    </svg>
  );
}

/** Upload, push a record up from a tray. */
export function IconUpload(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 15V4.5" />
      <path d="M7.5 9L12 4.5 16.5 9" />
      <path d="M4 16.5v2.5a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5v-2.5" />
    </svg>
  );
}

/** Visible, an open eye. */
export function IconEye(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Hidden, an eye struck through. */
export function IconEyeOff(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 4l16 16" />
      <path d="M9.8 5.8A9.4 9.4 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15.6 15.6 0 0 1-3.3 3.9" />
      <path d="M6.4 7.7A15.3 15.3 0 0 0 2.5 12S6 18.5 12 18.5a9.2 9.2 0 0 0 3.2-.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

/** Locked, a padlock. */
export function IconLock(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <path d="M12 14.5v2.5" />
    </svg>
  );
}

/** Shield, security or protection. */
export function IconShield(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l7.5 3.2v5.2c0 4.7-3.2 8.3-7.5 10.1-4.3-1.8-7.5-5.4-7.5-10.1V6.2z" />
    </svg>
  );
}

/** Link, a chain joining two records. */
export function IconLink(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 12h6" />
      <path d="M8.5 8H6.5a4 4 0 0 0 0 8h2" />
      <path d="M15.5 8h2a4 4 0 0 1 0 8h-2" />
    </svg>
  );
}

/** Camera, capture or change a photo. */
export function IconCamera(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2l1.1-1.9A1 1 0 0 1 8.5 4.6h7a1 1 0 0 1 .9.5L17.5 7h2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />
      <circle cx="12" cy="12.8" r="3.4" />
    </svg>
  );
}

/** Star, a favourite or rating. */
export function IconStar(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.8l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z" />
    </svg>
  );
}

/** Bookmark, a saved record. */
export function IconBookmark(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 4.5h12a1 1 0 0 1 1 1V20l-7-4-7 4V5.5a1 1 0 0 1 1-1z" />
    </svg>
  );
}

/** Bookmark with a tick, saved and confirmed. */
export function IconBookmarkCheck(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 4.5h12a1 1 0 0 1 1 1V20l-7-4-7 4V5.5a1 1 0 0 1 1-1z" />
      <path d="M9 9.5l2.2 2.2L15 8" />
    </svg>
  );
}

/** Bookmark with a plus, add to saved. */
export function IconBookmarkPlus(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 4.5h12a1 1 0 0 1 1 1V20l-7-4-7 4V5.5a1 1 0 0 1 1-1z" />
      <path d="M12 7.5v6M9 10.5h6" />
    </svg>
  );
}

/** Book, a guide or knowledge base. */
export function IconBook(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 6.5C10.4 5 8.4 4.5 4.5 4.5V17c3.9 0 5.9.5 7.5 2 1.6-1.5 3.6-2 7.5-2V4.5c-3.9 0-5.9.5-7.5 2z" />
      <path d="M12 6.5V19" />
    </svg>
  );
}

/** Hash, an identifier or reference number. */
export function IconHash(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9.5 4L7.5 20M16.5 4l-2 16" />
      <path d="M4.5 9h15M4 15h15" />
    </svg>
  );
}

/** Layers, stacked categories or groupings. */
export function IconLayers(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l9 5-9 5-9-5z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 16l9 5 9-5" />
    </svg>
  );
}

/** Home, the dashboard root. */
export function IconHome(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

/** Sign out, leave through the door. */
export function IconLogout(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 4.5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h3" />
      <path d="M16 8l4 4-4 4" />
      <path d="M20 12H9.5" />
    </svg>
  );
}

/** Terminal, a developer console. */
export function IconTerminal(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 10l3 2.5-3 2.5" />
      <path d="M12.5 15h4.5" />
    </svg>
  );
}

/** Sparkles. AI assistance, or something new. */
export function IconSparkles(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M11.5 4l1.6 4.3 4.3 1.6-4.3 1.6-1.6 4.3-1.6-4.3L5.6 9.9l4.3-1.6z" />
      <path d="M18 14.5l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" />
    </svg>
  );
}

/** Radar, sourcing or discovery sweep. */
export function IconRadar(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3a9 9 0 1 0 9 9" />
      <path d="M12 7.5a4.5 4.5 0 1 0 4.5 4.5" opacity={0.5} />
      <path d="M12 12l7-6" />
      <circle cx="16.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Cloud, hosted storage. */
export function IconCloud(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 18h10.2a4 4 0 0 0 .3-8A6 6 0 0 0 6 8.6 4.5 4.5 0 0 0 7 18z" />
    </svg>
  );
}

/** Truck, vendor supply or delivery. */
export function IconTruck(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="6" width="11.5" height="9.5" rx="1" />
      <path d="M14 9.5h3.3a1 1 0 0 1 .8.4l2.2 2.9a1 1 0 0 1 .2.6v2.1H14z" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
      <path d="M9 17.5h6M2.5 15.5h1.7M19 15.5h1.5" />
    </svg>
  );
}

/** Boxes, inventory, modules, a catalogue. */
export function IconBoxes(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="12.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="12.5" width="7" height="7" rx="1" />
      <rect x="8.5" y="4" width="7" height="7" rx="1" />
    </svg>
  );
}

/** Calendar, a date or schedule. */
export function IconCalendar(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3.5v3M16 3.5v3" />
      <path d="M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2" />
    </svg>
  );
}

/** A plain document. */
export function IconFile(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}
