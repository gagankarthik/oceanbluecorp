import {
  Clock, Eye, MessageSquare, Mail, CheckCircle2, XCircle, FileText,
} from "lucide-react";

export type Tone =
  | "blue" | "indigo" | "violet" | "emerald" | "amber" | "rose" | "sky" | "slate" | "teal" | "cyan" | "purple";

export const tones: Record<Tone, {
  bg: string; soft: string; ring: string; text: string; dot: string; solid: string; gradFrom: string; gradTo: string;
}> = {
  blue:    { bg: "bg-[var(--hz-cobalt-100)]", soft: "bg-[var(--hz-cobalt-100)]", ring: "ring-[var(--hz-cobalt-100)]", text: "text-[var(--hz-cobalt)]", dot: "bg-[var(--hz-cobalt)]", solid: "bg-[var(--hz-cobalt)]", gradFrom: "from-[var(--hz-cobalt)]", gradTo: "to-[var(--hz-cobalt-600)]" },
  indigo:  { bg: "bg-indigo-50",  soft: "bg-indigo-100",  ring: "ring-indigo-200",  text: "text-indigo-700",  dot: "bg-indigo-500",  solid: "bg-indigo-600",  gradFrom: "from-indigo-500",  gradTo: "to-indigo-600"  },
  violet:  { bg: "bg-violet-50",  soft: "bg-violet-100",  ring: "ring-violet-200",  text: "text-violet-700",  dot: "bg-violet-500",  solid: "bg-violet-600",  gradFrom: "from-violet-500",  gradTo: "to-violet-600"  },
  emerald: { bg: "bg-emerald-50", soft: "bg-emerald-100", ring: "ring-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", solid: "bg-emerald-600", gradFrom: "from-emerald-500", gradTo: "to-emerald-600" },
  amber:   { bg: "bg-amber-50",   soft: "bg-amber-100",   ring: "ring-amber-200",   text: "text-amber-700",   dot: "bg-amber-500",   solid: "bg-amber-600",   gradFrom: "from-amber-500",   gradTo: "to-amber-600"   },
  rose:    { bg: "bg-rose-50",    soft: "bg-rose-100",    ring: "ring-rose-200",    text: "text-rose-700",    dot: "bg-rose-500",    solid: "bg-rose-600",    gradFrom: "from-rose-500",    gradTo: "to-rose-600"    },
  sky:     { bg: "bg-sky-50",     soft: "bg-sky-100",     ring: "ring-sky-200",     text: "text-sky-700",     dot: "bg-sky-500",     solid: "bg-sky-600",     gradFrom: "from-sky-500",     gradTo: "to-sky-600"     },
  slate:   { bg: "bg-slate-50",   soft: "bg-slate-100",   ring: "ring-slate-200",   text: "text-slate-700",   dot: "bg-slate-400",   solid: "bg-slate-600",   gradFrom: "from-slate-500",   gradTo: "to-slate-600"   },
  teal:    { bg: "bg-teal-50",    soft: "bg-teal-100",    ring: "ring-teal-200",    text: "text-teal-700",    dot: "bg-teal-500",    solid: "bg-teal-600",    gradFrom: "from-teal-500",    gradTo: "to-teal-600"    },
  cyan:    { bg: "bg-cyan-50",    soft: "bg-cyan-100",    ring: "ring-cyan-200",    text: "text-cyan-700",    dot: "bg-cyan-500",    solid: "bg-cyan-600",    gradFrom: "from-cyan-500",    gradTo: "to-cyan-600"    },
  purple:  { bg: "bg-purple-50",  soft: "bg-purple-100",  ring: "ring-purple-200",  text: "text-purple-700",  dot: "bg-purple-500",  solid: "bg-purple-600",  gradFrom: "from-purple-500",  gradTo: "to-purple-600"  },
};

export type AppStatus =
  | "pending" | "reviewing" | "submitted" | "interview" | "offered" | "hired" | "rejected"
  | "active" | "inactive" | "paused" | "draft" | "closed" | "open" | "on-hold";

export const statusMeta: Record<AppStatus, { label: string; tone: Tone; icon: React.ComponentType<{ className?: string }> }> = {
  pending:   { label: "New",       tone: "slate",   icon: Clock        },
  reviewing: { label: "Screening", tone: "blue",    icon: Eye          },
  submitted: { label: "Submitted", tone: "indigo",  icon: FileText     },
  interview: { label: "Interview", tone: "violet",  icon: MessageSquare},
  offered:   { label: "Offered",   tone: "amber",   icon: Mail         },
  hired:     { label: "Hired",     tone: "emerald", icon: CheckCircle2 },
  rejected:  { label: "Rejected",  tone: "rose",    icon: XCircle      },
  active:    { label: "Active",    tone: "emerald", icon: CheckCircle2 },
  inactive:  { label: "Inactive",  tone: "slate",   icon: XCircle      },
  paused:    { label: "Paused",    tone: "amber",   icon: Clock        },
  draft:     { label: "Draft",     tone: "slate",   icon: FileText     },
  closed:    { label: "Closed",    tone: "rose",    icon: XCircle      },
  open:      { label: "Open",      tone: "emerald", icon: CheckCircle2 },
  "on-hold": { label: "On Hold",   tone: "amber",   icon: Clock        },
};

export const PIPELINE_STAGES: { key: AppStatus; label: string; tone: Tone }[] = [
  { key: "pending",   label: "New",       tone: "slate"   },
  { key: "reviewing", label: "Screening", tone: "blue"    },
  { key: "submitted", label: "Submitted", tone: "indigo"  },
  { key: "interview", label: "Interview", tone: "violet"  },
  { key: "offered",   label: "Offered",   tone: "amber"   },
  { key: "hired",     label: "Hired",     tone: "emerald" },
];

export const WORK_AUTH_OPTIONS = [
  "US Citizen", "Green Card", "H1-B", "OPT", "CPT", "TN Visa", "Other",
];

export const SOURCE_OPTIONS = [
  "LinkedIn", "Indeed", "Company Website", "Referral", "Agency", "Career Portal", "Other",
];

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];
