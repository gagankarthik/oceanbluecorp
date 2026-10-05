/**
 * Careers-only glyphs, drawn to the site set's rules: 24px grid, 1.5px
 * stroke, currentColor. Shared marks come from ../icons.
 */
import type { IconProps } from "../icons";
export { IconPin, IconSearch, IconCalendar, IconRefresh, IconArrowLeft } from "../icons";

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


export const IconFilter = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </Svg>
);



export const IconMoney = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="6.5" width="18" height="11" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6.5 9.5v5M17.5 9.5v5" />
  </Svg>
);


export const IconChevronLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="m15 6-6 6 6 6" />
  </Svg>
);


export const IconCheckCircle = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.5 12.2 2.4 2.4 4.6-4.8" />
  </Svg>
);

export const IconUpload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9" />
    <path d="M4.5 15v3a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-3" />
  </Svg>
);

export const IconFile = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3.5h9l3.5 3.5v13.5H6z" />
    <path d="M15 3.5V7h3.5M9 12h6M9 15.5h4" />
  </Svg>
);

export const IconShare = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="17.5" cy="5.5" r="2.5" />
    <circle cx="6.5" cy="12" r="2.5" />
    <circle cx="17.5" cy="18.5" r="2.5" />
    <path d="m8.7 10.8 6.6-4M8.7 13.2l6.6 4" />
  </Svg>
);

export const IconBookmark = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.5 3.5h11v17L12 16.5l-5.5 4z" />
  </Svg>
);

export const IconSpinner = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" />
  </Svg>
);

/* ---------- Life here and benefits ---------- */

/** Growth: a step up. */
export const IconGrowth = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 19.5h4.5v-5h4.5v-5h4.5v-5H21" />
    <path d="M14.5 4.5H21V11" />
  </Svg>
);

/** Work-life balance: a sun set over a horizon. */
export const IconBalance = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 17.5h17M7.5 17.5a4.5 4.5 0 0 1 9 0M12 7.5v-3M5.6 10.1 3.5 8M18.4 10.1 20.5 8" />
  </Svg>
);

/** Inclusion: three people, arms linked. */
export const IconInclusive = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="6" cy="8" r="2.2" />
    <circle cx="12" cy="6.5" r="2.4" />
    <circle cx="18" cy="8" r="2.2" />
    <path d="M2.5 18c.3-2.7 1.7-4.3 3.5-4.3M21.5 18c-.3-2.7-1.7-4.3-3.5-4.3M7.5 19.5c.4-3.5 2.1-5.5 4.5-5.5s4.1 2 4.5 5.5" />
  </Svg>
);

/** Health insurance: a shield with a medical cross, i.e. coverage. Tinted fill. */
export const IconHealth = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6L12 3Z" fill="currentColor" fillOpacity={0.14} />
    <path d="M12 8.5v7M8.5 12h7" strokeWidth={2} />
  </Svg>
);

/** Retirement plans: a piggy bank with a coin going in. Tinted fill. */
export const IconSavings = (p: IconProps) => (
  <Svg {...p}>
    <path
      d="M5 13c0-3.3 3.1-5.5 7-5.5 1.3 0 2.5.2 3.6.7L18 7v2.8c.9.8 1.5 1.8 1.7 2.9H21v3h-1.6c-.5 1-1.3 1.9-2.4 2.5V20.5h-2.5v-1.4c-.8.2-1.6.2-2.5.2s-1.7-.1-2.5-.3v1.5H7v-2.2C5.8 17 5 15.1 5 13Z"
      fill="currentColor"
      fillOpacity={0.14}
    />
    <path d="M10 10h3.5M5 13c-1.2 0-2-.8-2-1.8" />
    <circle cx="11.75" cy="4" r="1.75" />
    <circle cx="16.6" cy="11.6" r="0.6" fill="currentColor" stroke="none" />
  </Svg>
);

/** Paid time off: a beach umbrella over the sand. Tinted fill. */
export const IconTimeOff = (p: IconProps) => (
  <Svg {...p}>
    <path
      d="M4 11a8 8 0 0 1 16 0c-1.3-1-2.7-1-4 0-1.3-1-2.7-1-4 0-1.3-1-2.7-1-4 0-1.3-1-2.7-1-4 0Z"
      fill="currentColor"
      fillOpacity={0.14}
    />
    <path d="M12 3c-2 2.2-3 4.9-3 8M12 3c2 2.2 3 4.9 3 8M12 11v9M4 20.5h16" />
  </Svg>
);

/** Equal opportunity: balanced scales. */
export const IconScale = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4v16M8 20h8M5 7h14M12 4.5 5 7M12 4.5 19 7" />
    <path d="M5 7 2.5 13a2.5 2.5 0 0 0 5 0zM19 7l-2.5 6a2.5 2.5 0 0 0 5 0z" />
  </Svg>
);

/** Programme delivery: a checklist. */
export const IconChecklist = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 3v2.5h6V3M8.5 11l1.2 1.2 2.3-2.3M14 11h2M8.5 16l1.2 1.2 2.3-2.3M14 16h2" />
  </Svg>
);
