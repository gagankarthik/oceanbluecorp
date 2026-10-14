/**
 * Portal icon set: hand-drawn on a 24px grid, 1.6 stroke, round joins.
 * Use <Icon name="..." /> and size it with a className (default size-5).
 */
const paths = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="9" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
      <rect x="3.5" y="15.5" width="7" height="5" rx="1.5" />
    </>
  ),
  capitol: (
    <>
      <path d="M12 3v2.5M8.5 9.5a3.5 3.5 0 0 1 7 0" />
      <path d="M5 9.5h14M6.5 9.5v8M10 9.5v8M14 9.5v8M17.5 9.5v8M4 17.5h16M3 20.5h18" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18M10.5 12.5v1.5h3v-1.5" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 13.5 6.5 5h11l2.5 8.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" />
      <path d="M4 13.5h4.5l1.5 2.5h4l1.5-2.5H20" />
    </>
  ),
  bench: (
    <>
      <circle cx="8" cy="7.5" r="2.5" />
      <circle cx="16" cy="7.5" r="2.5" />
      <path d="M3.5 15a4.5 4.5 0 0 1 9 0M11.5 15a4.5 4.5 0 0 1 9 0M3 17.5h18M5 17.5v3M19 17.5v3" />
    </>
  ),
  resume: (
    <>
      <path d="M6 3h8.5L19 7.5V19.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15A1.5 1.5 0 0 1 6.5 3z" />
      <path d="M14 3v5h5" />
      <circle cx="10" cy="11.5" r="1.8" />
      <path d="M7.5 16a2.6 2.6 0 0 1 5 0M14 11h2.5M14 14h2.5M8 18.5h8.5" />
    </>
  ),
  contact: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <circle cx="9" cy="10.5" r="2.2" />
      <path d="M5.5 16a3.6 3.6 0 0 1 7 0M14.5 9.5h4M14.5 12.5h4M14.5 15.5h2.5" />
    </>
  ),
  building: (
    <>
      <path d="M4 20.5V5.5A1.5 1.5 0 0 1 5.5 4h7A1.5 1.5 0 0 1 14 5.5v15M14 9.5h4.5A1.5 1.5 0 0 1 20 11v9.5M2.5 20.5h19" />
      <path d="M7.5 8h3M7.5 11.5h3M7.5 15h3M16.5 13h1.5M16.5 16.5h1.5" />
    </>
  ),
  handshake: (
    <>
      <path d="M2.5 9.5 6 6l4 1.5L13 6l3 1 5.5 2.5M2.5 9.5 5 15l2 1M21.5 9.5 19 15l-6.5 4.5L8 16" />
      <path d="M13 6 9.5 9.5a1.6 1.6 0 0 0 2.3 2.3L14 10l4.5 4M11 14.5l2 1.8M9 13l2 1.8" />
    </>
  ),
  pen: (
    <>
      <path d="M15.5 4.5 19.5 8.5 9 19H5v-4z" />
      <path d="M13 7l4 4M4 21h16" />
    </>
  ),
  chart: (
    <>
      <path d="M3.5 3.5v17h17" />
      <path d="M7.5 15.5 11 11l3 2.5 5-6.5" />
      <path d="M15.5 7H19v3.5" />
    </>
  ),
  quote: (
    <>
      <path d="M4 18.5V13a5 5 0 0 1 5-5" />
      <rect x="4" y="12.5" width="6" height="6" rx="1" />
      <path d="M14 18.5V13a5 5 0 0 1 5-5" />
      <rect x="14" y="12.5" width="6" height="6" rx="1" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 10v4a1.5 1.5 0 0 0 1.5 1.5H8l8 4.5V4L8 8.5H5.5A1.5 1.5 0 0 0 4 10z" />
      <path d="M8 15.5 9.5 20.5M19 9.5a3 3 0 0 1 0 5" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3.5 21 8l-9 4.5L3 8z" />
      <path d="M3 12l9 4.5 9-4.5M3 16l9 4.5 9-4.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 19.5 6v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z" />
      <circle cx="12" cy="10" r="2.3" />
      <path d="M8 16.5a4.5 4.5 0 0 1 8 0" />
    </>
  ),
  code: (
    <>
      <path d="M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" />
      <path d="M10 21h4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  filter: <path d="M4 5h16l-6 7.5V19l-4 2v-8.5z" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  logout: (
    <>
      <path d="M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14" />
      <path d="M10 12h10M16.5 8.5 20 12l-3.5 3.5" />
    </>
  ),
  settings: (
    <>
      <path d="M12.2 2.5h-.4a1.8 1.8 0 0 0-1.8 1.8v.2a1.8 1.8 0 0 1-.9 1.5l-.4.2a1.8 1.8 0 0 1-1.8 0l-.1-.1a1.8 1.8 0 0 0-2.5.7l-.2.3a1.8 1.8 0 0 0 .7 2.5l.1.1a1.8 1.8 0 0 1 .9 1.5v.5a1.8 1.8 0 0 1-.9 1.6l-.1.1a1.8 1.8 0 0 0-.7 2.5l.2.3a1.8 1.8 0 0 0 2.5.7l.1-.1a1.8 1.8 0 0 1 1.8 0l.4.2a1.8 1.8 0 0 1 .9 1.5v.2a1.8 1.8 0 0 0 1.8 1.8h.4a1.8 1.8 0 0 0 1.8-1.8v-.2a1.8 1.8 0 0 1 .9-1.5l.4-.2a1.8 1.8 0 0 1 1.8 0l.1.1a1.8 1.8 0 0 0 2.5-.7l.2-.3a1.8 1.8 0 0 0-.7-2.5l-.1-.1a1.8 1.8 0 0 1-.9-1.6v-.5a1.8 1.8 0 0 1 .9-1.5l.1-.1a1.8 1.8 0 0 0 .7-2.5l-.2-.3a1.8 1.8 0 0 0-2.5-.7l-.1.1a1.8 1.8 0 0 1-1.8 0l-.4-.2a1.8 1.8 0 0 1-.9-1.5v-.2a1.8 1.8 0 0 0-1.8-1.8z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  idBadge: (
    <>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" />
      <path d="M10 3.5v2.5h4V3.5" />
      <circle cx="12" cy="11" r="2.3" />
      <path d="M8.3 17a3.7 3.7 0 0 1 7.4 0" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  check: <path d="m4.5 12.5 4.5 4.5 10.5-11" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  dots: (
    <>
      <circle cx="5.5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
      <path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" />
      <path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.5 7 8.5 6.5L20.5 7" />
    </>
  ),
  phone: <path d="M5 4h3.5l1.5 4-2 1.5a10.5 10.5 0 0 0 6.5 6.5l1.5-2 4 1.5V19a1.5 1.5 0 0 1-1.5 1.5A16.5 16.5 0 0 1 3.5 5.5 1.5 1.5 0 0 1 5 4z" />,
  star: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8L3.5 9.7l5.9-.8z" />,
  external: (
    <>
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  map: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  dollar: (
    <>
      <path d="M12 3v18" />
      <path d="M16.5 7.5c0-1.7-2-3-4.5-3s-4.5 1.3-4.5 3 2 2.6 4.5 3 4.5 1.4 4.5 3.2-2 3.3-4.5 3.3-4.5-1.3-4.5-3" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 6.5h15M9.5 6.5V4.5h5v2M6.5 6.5l1 13.5h9l1-13.5" />
      <path d="M10 10.5v6M14 10.5v6" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8.5-8.5M16 7l2.5 2.5M18.5 4.5 21 7" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5s1.2-6.1 3.6-8.5z" />
    </>
  ),
  activity: <path d="M3 12h4l2.5-6 5 12 2.5-6h4" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  sparkle: <path d="M12 3.5 13.8 10.2 20.5 12 13.8 13.8 12 20.5 10.2 13.8 3.5 12 10.2 10.2z" />,
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="m4.5 18 5-5 3.5 3.5 2.5-2.5 4 4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M8 6H5a2 2 0 0 0 2 4h1M16 6h3a2 2 0 0 1-2 4h-1M12 13v4M8.5 20.5h7M10 17h4" />
    </>
  ),
  send: <path d="M20.5 3.5 10 14M20.5 3.5 14 20.5l-4-6.5-6.5-4z" />,
  userCheck: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M15.5 11.5l2 2 4-4" />
    </>
  ),
  funnel: <path d="M3.5 4.5h17l-6.5 8v6l-4 2v-8z" />,
  trendUp: (
    <>
      <path d="M3.5 17 9.5 11l4 4 7-7.5" />
      <path d="M15 7.5h5.5V13" />
    </>
  ),
  percent: (
    <>
      <path d="M19 5 5 19" />
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="17" cy="17" r="2.5" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 9.5v4l2.5 1.5M9.5 2.5h5M19 6l1.5-1.5" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m8.5 13.5-1.5 7.5 5-2.5 5 2.5-1.5-7.5" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.7M12 16.4v.3" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5.5M12 16.2v.3" />
    </>
  ),
  tag: (
    <>
      <path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9z" />
      <circle cx="8.5" cy="8.5" r="1.5" />
    </>
  ),
  sliders: <path d="M4 7h9M17 7h3M4 17h3M11 17h9M15 4.5v5M9 14.5v5" />,
  sidebar: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M9.5 4.5v15M6 8.5h1M6 11h1" />
    </>
  ),
  refresh: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 4v4h-4" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
      <path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
    </>
  ),
} as const;

export type IconName = keyof typeof paths;

export default function Icon({ name, className = "size-5", title }: { name: IconName; className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      {paths[name]}
    </svg>
  );
}
