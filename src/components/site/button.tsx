import Link from "next/link";
import { cn } from "@/lib/utils";

/* Site buttons. Pills, one height scale, and variants named for their role
   rather than their colour. `inverse` and `outline-dark` are the pair for dark
   grounds. sm is 40 (44 on touch), md 48, lg 56 for the one oversized action
   on a page (the job search). */

type Variant = "primary" | "accent" | "dark" | "outline" | "ghost" | "inverse" | "outline-dark";
type Size = "sm" | "md" | "lg";

const PRIMARY =
  "bg-[var(--button-primary-background)] text-[var(--button-primary-text)] border border-[var(--button-primary-background)] not-disabled:hover:bg-[var(--button-primary-background-hover)] not-disabled:hover:border-[var(--button-primary-background-hover)] not-disabled:active:bg-[var(--button-primary-background-pressed)]";

const variants: Record<Variant, string> = {
  // The brand's action colour. `accent` is kept as an alias for older call sites.
  primary: PRIMARY,
  accent: PRIMARY,
  dark: "bg-ink text-white border border-ink not-disabled:hover:bg-ink-muted not-disabled:hover:border-ink-muted",
  outline: "bg-white text-ink border border-line-input not-disabled:hover:border-cobalt not-disabled:hover:text-cobalt not-disabled:active:bg-paper",
  ghost: "bg-transparent text-ink-muted border border-transparent not-disabled:hover:text-ink not-disabled:hover:bg-paper not-disabled:active:bg-paper-deep",
  inverse: "bg-white text-ink border border-white not-disabled:hover:bg-cobalt-tint not-disabled:hover:border-cobalt-tint",
  "outline-dark": "bg-transparent text-white border border-white/60 not-disabled:hover:border-white not-disabled:hover:bg-white/10",
};

const sizes: Record<Size, string> = {
  sm: "h-[var(--button-height-sm)] pointer-coarse:h-[var(--size-control-touch)] px-4 type-label gap-2",
  md: "h-[var(--button-height-md)] px-6 type-body font-semibold gap-2",
  lg: "h-[var(--button-height-lg)] px-7 type-body font-semibold gap-2",
};

export function buttonClass(variant: Variant = "primary", size: Size = "sm", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap transition-[color,background-color,border-color,transform] duration-[var(--dur-short)] ease-out not-disabled:active:translate-y-px",
    "disabled:cursor-not-allowed disabled:opacity-[var(--opacity-disabled)] aria-disabled:cursor-not-allowed aria-disabled:opacity-[var(--opacity-disabled)] aria-busy:cursor-progress",
    variants[variant],
    sizes[size],
    className,
  );
}

type LinkButtonProps = React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function LinkButton({ variant, size, className, ...rest }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

/** Spins in place of a leading icon. */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn("size-4 animate-spin motion-reduce:animate-none", className)}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type ButtonProps = React.ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean };

/** A <button> with the site styles. `loading` disables it, marks it busy and
 *  swaps any leading content for a spinner, so a second click cannot resubmit. */
export function Button({ variant, size, loading, disabled, className, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
