import { tones, type Tone } from "./theme";
import { cn } from "@/lib/utils";
import { InfoTip } from "./info-tip";

/**
 * Canonical admin panel.
 *
 * Reworked from a soft 16px-radius, shadowed card to a flat business-system
 * panel: near-square corners, a solid (not translucent) border, and no resting
 * shadow. In a dense screen a dozen lifting cards read as a consumer dashboard;
 * a business application wants sheets of record separated by rules.
 */
export function AdminCard({
  className,
  hover = false,
  children,
}: {
  className?: string;
  hover?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]",
        // Interactive panels change border + wash instead of translating; the
        // grid must not shift under the pointer.
        hover &&
          "transition-[border-color,box-shadow] duration-150 hover:border-[var(--adm-line-strong)] hover:shadow-[var(--adm-shadow-md)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Section header for an AdminCard, a titled band, as in a report subsection. */
export function AdminCardHeader({
  icon: Icon,
  title,
  subtitle,
  meta,
  tone = "slate",
  count,
  action,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  /** What the panel answers. Shown as an ⓘ tooltip beside the title. */
  subtitle?: string;
  /** A visible line of data or live status under the title. */
  meta?: React.ReactNode;
  tone?: Tone;
  count?: number;
  action?: React.ReactNode;
}) {
  const t = tones[tone];
  return (
    <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-t-[14px] border-b border-[var(--adm-line-soft)] bg-[var(--adm-surface)] px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        {Icon && <Icon className={cn("h-4 w-4 flex-none", tone === "slate" ? "text-[var(--adm-ink-subtle)]" : t.text)} strokeWidth={1.75} />}
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-[var(--adm-ink)]">{title}</h3>
            {subtitle && <InfoTip label={title}>{subtitle}</InfoTip>}
            {count !== undefined && count > 0 && (
              <span className="flex-none rounded-full bg-[var(--adm-surface-2)] px-1.5 py-px text-[11.5px] font-medium tabular-nums text-[var(--adm-ink-mute)]">
                {count}
              </span>
            )}
          </div>
          {meta && <p className="mt-0.5 truncate text-[12.5px] text-[var(--adm-ink-subtle)]">{meta}</p>}
        </div>
      </div>
      {action && <div className="flex flex-none items-center gap-1">{action}</div>}
    </div>
  );
}
