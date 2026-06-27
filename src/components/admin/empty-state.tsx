import type { LucideIcon } from "lucide-react";
import { FilterX, FolderOpen, AlertTriangle, Lock } from "lucide-react";
import { tones, type Tone } from "./theme";
import { cn } from "@/lib/utils";

/** Context in which the list is empty — determines the default icon + copy. */
export type EmptyVariant = "fresh" | "filtered" | "error" | "permission";

const VARIANT_DEFAULTS: Record<
  EmptyVariant,
  { icon: LucideIcon; tone: Tone; fallbackTitle: string; fallbackDescription: string }
> = {
  fresh: {
    icon: FolderOpen,
    tone: "slate",
    fallbackTitle: "Nothing here yet",
    fallbackDescription: "Create your first item to get started.",
  },
  filtered: {
    icon: FilterX,
    tone: "blue",
    fallbackTitle: "No results match your filters",
    fallbackDescription: "Try adjusting or clearing your filters.",
  },
  error: {
    icon: AlertTriangle,
    tone: "rose",
    fallbackTitle: "Could not load data",
    fallbackDescription: "An error occurred while loading. Try again.",
  },
  permission: {
    icon: Lock,
    tone: "amber",
    fallbackTitle: "Access restricted",
    fallbackDescription: "You don't have permission to view this content.",
  },
};

interface EmptyStateProps {
  /** Icon override — uses variant default when omitted. */
  icon?: LucideIcon;
  title?: string;
  description?: string;
  tone?: Tone;
  /**
   * Semantic variant — sets defaults for icon, tone, and copy when the
   * specific props are omitted. Defaults to "fresh".
   */
  variant?: EmptyVariant;
  /** Usually a small ui/Button (or PageHeaderButton) creating the missing thing. */
  action?: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Canonical empty state — replaces the per-page hand-rolled
 * "icon well + message" blocks. Always say what the section is for
 * and, when the viewer can act, offer the action.
 *
 * Variant presets:
 *  - "fresh"      → user has nothing yet; show a CTA to create the first item
 *  - "filtered"   → search/filters returned nothing; show a "Clear filters" CTA
 *  - "error"      → data load failed; show a Retry CTA
 *  - "permission" → user can see the section but not the content
 */
export function EmptyState({
  icon: iconProp,
  title,
  description,
  tone: toneProp,
  variant = "fresh",
  action,
  size = "md",
  className,
}: EmptyStateProps) {
  const defaults = VARIANT_DEFAULTS[variant];
  const Icon = iconProp ?? defaults.icon;
  const resolvedTone = toneProp ?? defaults.tone;
  const resolvedTitle = title ?? defaults.fallbackTitle;
  const resolvedDescription = description ?? defaults.fallbackDescription;
  const t = tones[resolvedTone];
  const sm = size === "sm";

  return (
    <div
      role="status"
      aria-label={resolvedTitle}
      className={cn(
        "flex flex-col items-center text-center",
        sm ? "px-4 py-8" : "px-5 py-12",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid place-items-center rounded-2xl",
          t.bg,
          sm ? "h-10 w-10" : "h-12 w-12",
        )}
      >
        <Icon className={cn(t.text, sm ? "h-5 w-5" : "h-6 w-6")} strokeWidth={1.5} />
      </span>
      <p className={cn("mt-3 font-medium text-slate-600", sm ? "text-xs" : "text-sm")}>
        {resolvedTitle}
      </p>
      {resolvedDescription && (
        <p className="mt-1 max-w-xs text-xs text-slate-400">{resolvedDescription}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
