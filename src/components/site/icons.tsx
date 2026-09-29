/**
 * Site icon set. Drawn on a 24px grid, 1.5px stroke, currentColor, so every
 * glyph shares one weight. Service-specific marks are at the bottom.
 */
import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 16, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export type Icon = (p: IconProps) => React.ReactElement;

export const IconOverview = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="7" height="9" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
    <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
    <rect x="3.5" y="15.5" width="7" height="5" rx="1.5" />
  </Svg>
);

export const IconTerminal = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <path d="m7 10 3 2.5L7 15M12.5 15h4.5" />
  </Svg>
);

export const IconSettings = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);

export const IconX = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const IconChevronDown = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const IconChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);

export const IconArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" />
  </Svg>
);

export const IconExternal = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13.5 4.5h6v6M19.5 4.5 11 13M17.5 14v4.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1H10" />
  </Svg>
);

export const IconPause = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8.5 5.5v13M15.5 5.5v13" strokeWidth={2} />
  </Svg>
);

export const IconPlay = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7.5 5.5v13l11-6.5z" fill="currentColor" fillOpacity=".2" />
  </Svg>
);

export const IconMenu = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </Svg>
);

export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const IconLock = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2" />
  </Svg>
);

export const IconMail = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
    <path d="m4 7 8 6 8-6" />
  </Svg>
);

export const IconBuilding = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 20.5v-15l8-2v17M12.5 8.5h7v12M3 20.5h18" />
    <path d="M7.5 8h2M7.5 11.5h2M7.5 15h2M15.5 12h1.5M15.5 15.5h1.5" />
  </Svg>
);

export const IconLogout = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 4.5H6.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1H14M10 12h10M16.5 8.5 20 12l-3.5 3.5" />
  </Svg>
);

export const IconTeam = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="3" />
    <path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5" />
    <circle cx="16.5" cy="9.5" r="2.3" />
    <path d="M16 14.6c2.3.1 4 1.4 4.5 3.9" />
  </Svg>
);

export const IconUser = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 19.5c.8-3.4 3.6-5.2 7-5.2s6.2 1.8 7 5.2" />
  </Svg>
);

export const IconKey = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="15.5" r="4" />
    <path d="m11 12.5 8.5-8.5M16.5 7l2.5 2.5M14 9.5l2 2" />
  </Svg>
);


/* ---------- Solutions ---------- */

/** IT staffing: a specialist, vetted. */
export const IconTalent = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="10" cy="8" r="3.5" />
    <path d="M3.5 19.5c.7-3.4 3.3-5.3 6.5-5.3 1.3 0 2.5.3 3.5.8" />
    <circle cx="17.5" cy="16.5" r="3.5" />
    <path d="m16 16.6 1.1 1.1 2-2.2" />
  </Svg>
);

/** Engineering: a hard hat. */
export const IconHardHat = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="16.5" width="18" height="3" rx="1.5" />
    <path d="M5.5 16.5a6.5 6.5 0 0 1 13 0" />
    <path d="M10 10.2V7.5h4v2.7" />
  </Svg>
);

/** Cloud engineering: moving up to the cloud. */
export const IconCloudUp = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7.5 18.5H7a4 4 0 0 1-.6-8 5.5 5.5 0 0 1 10.7-1.3A4.5 4.5 0 0 1 17 18.5h-.5" />
    <path d="M12 20.5v-7M9.5 16l2.5-2.5 2.5 2.5" />
  </Svg>
);

/** Cybersecurity: a shield, locked. */
export const IconShieldLock = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 19.5 6v5.6c0 4.6-3.1 7.8-7.5 9.4-4.4-1.6-7.5-4.8-7.5-9.4V6z" />
    <rect x="9" y="11.5" width="6" height="4.5" rx="1" />
    <path d="M10.25 11.5V10a1.75 1.75 0 0 1 3.5 0v1.5" />
  </Svg>
);

/** ERP: one system in layers. */
export const IconLayers = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5 3.5 8 12 12.5 20.5 8z" />
    <path d="m3.5 12 8.5 4.5 8.5-4.5" />
    <path d="m3.5 16 8.5 4.5 8.5-4.5" />
  </Svg>
);

/** Salesforce: a customer record, the CRM. */
export const IconCrm = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="14" rx="2" />
    <circle cx="9" cy="10.5" r="2" />
    <path d="M6 15.5c.5-1.6 1.6-2.4 3-2.4s2.5.8 3 2.4M14.5 9.5h3M14.5 12.5h3" />
  </Svg>
);

/** AI and data: a processor. */
export const IconChip = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
    <rect x="10" y="10" width="4" height="4" rx=".6" />
    <path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3" />
  </Svg>
);

/** Managed services: a rack, both units live. */
export const IconServer = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="7" rx="1.5" />
    <rect x="4" y="13" width="16" height="7" rx="1.5" />
    <path d="M7.5 7.5h.01M7.5 16.5h.01" strokeWidth={2.2} />
    <path d="M11 7.5h5.5M11 16.5h5.5" />
  </Svg>
);

/** Training: a mortarboard. */
export const IconGraduation = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 9.5 12 5l9.5 4.5L12 14z" />
    <path d="M6.5 11.6V16c1.6 1.4 3.4 2 5.5 2s3.9-.6 5.5-2v-4.4M21.5 9.5V15" />
  </Svg>
);

/** Digital transformation: the cycle around the core it changes. */
export const IconTransform = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19.5 11A7.5 7.5 0 0 0 6.2 6.8M4.5 13a7.5 7.5 0 0 0 13.3 4.2" />
    <path d="M5.5 3.5v3.5H9M18.5 20.5V17H15" />
    <path d="M12 9.5 14.5 12 12 14.5 9.5 12z" />
  </Svg>
);

/* ---------- Resources and company ---------- */

/** Case studies: a report with results. */
export const IconCaseStudy = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3.5h9l3.5 3.5v13.5H6z" />
    <path d="M15 3.5V7h3.5M9 17.5v-3M12 17.5v-6M15 17.5v-4.5" />
  </Svg>
);

/** Customer stories: a quote in a speech bubble. */
export const IconStory = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 5.5h15v10h-8l-4.5 3.5v-3.5H4.5z" />
    <path d="M9.5 9v1.5c0 .8-.4 1.3-1 1.5M13.5 9v1.5c0 .8-.4 1.3-1 1.5" />
  </Svg>
);

/** Blog: a pencil writing a line. */
export const IconPencil = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
    <path d="m13.5 6.5 4 4M13 20h7" />
  </Svg>
);

/** News: a folded newspaper. */
export const IconNewspaper = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 5.5h12v13a1.5 1.5 0 0 0 1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5z" />
    <path d="M16.5 9.5h3v9a1.5 1.5 0 0 1-3 0M7.5 9h6M7.5 12h6M7.5 15h4" />
  </Svg>
);

/** Developer docs: a document with code. */
export const IconDocsCode = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3.5h9l3.5 3.5v13.5H6z" />
    <path d="M15 3.5V7h3.5M10.5 11.5 8.5 13.5l2 2M13.5 11.5l2 2-2 2" />
  </Svg>
);

/** Products: a package we ship. */
export const IconPackage = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5 19.5 7.5v9L12 20.5 4.5 16.5v-9z" />
    <path d="m4.5 7.5 7.5 4 7.5-4M12 11.5v9M8.2 5.5l7.5 4" />
  </Svg>
);

/** Careers: a briefcase. */
export const IconBriefcase = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="7.5" width="17" height="12" rx="1.5" />
    <path d="M9 7.5V5.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3.5 12.5h17" />
  </Svg>
);

/* ---------- Utility ---------- */
export const IconPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20.5s6.5-5.8 6.5-10.5a6.5 6.5 0 0 0-13 0c0 4.7 6.5 10.5 6.5 10.5Z" />
    <circle cx="12" cy="10" r="2.3" />
  </Svg>
);

export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Svg>
);

export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
  </Svg>
);

export const IconRefresh = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19.5 11A7.5 7.5 0 0 0 6.2 6.8M4.5 13a7.5 7.5 0 0 0 13.3 4.2" />
    <path d="M5.5 3.5v3.5H9M18.5 20.5V17H15" />
  </Svg>
);

export const IconArrowLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 12H5M10.5 6.5 5 12l5.5 5.5" />
  </Svg>
);

/** Phone: a handset. */
export const IconPhone = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 4.5h3.2l1.6 4-2 1.3a10 10 0 0 0 6.4 6.4l1.3-2 4 1.6V19a1.5 1.5 0 0 1-1.5 1.5A15.5 15.5 0 0 1 3.5 6 1.5 1.5 0 0 1 5 4.5Z" />
  </Svg>
);

export const IconCopy = (p: IconProps) => (
  <Svg {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
    <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
  </Svg>
);

export const IconGlobe = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5S9.7 5.9 12 3.5Z" />
  </Svg>
);

export const IconDownload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4v11M7 10.5l5 5 5-5M4.5 19.5h15" />
  </Svg>
);

export const IconAlert = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4 21 19.5H3z" />
    <path d="M12 10v4M12 17h.01" />
  </Svg>
);

/** Media kit: brand swatches fanned out. */
export const IconSwatches = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="4" width="6" height="16" rx="2" />
    <path d="m9.5 8.5 3.6-3.6a2 2 0 0 1 2.8 0l1.2 1.2a2 2 0 0 1 0 2.8L9.5 16.5" />
    <path d="M9.5 20h9a2 2 0 0 0 2-2v-1.6a2 2 0 0 0-2-2h-2.3" />
    <circle cx="6.5" cy="16.5" r="1" />
  </Svg>
);
