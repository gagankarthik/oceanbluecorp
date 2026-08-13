import { tones, type Tone } from "./theme";
import { cn } from "@/lib/utils";

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
        "rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]",
        // Interactive panels change border + wash instead of translating; the
        // grid must not shift under the pointer.
        hover &&
          "transition-colors duration-150 hover:border-[var(--adm-accent)] hover:bg-[var(--adm-accent-tint)]",
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
  tone = "slate",
  count,
  action,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  tone?: Tone;
  count?: number;
  action?: React.ReactNode;
}) {
  const t = tones[tone];
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--adm-line)] bg-[var(--adm-surface)] px-6 py-4">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && <Icon className={cn("h-[18px] w-[18px] flex-none", t.text)} strokeWidth={1.75} />}
        <h3 className="truncate text-[15px] font-semibold text-[var(--adm-ink)]">
          {title}
        </h3>
        {count !== undefined && count > 0 && (
          <span className="rounded-full bg-[var(--adm-surface-2)] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-[var(--adm-ink-mute)]">
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}
