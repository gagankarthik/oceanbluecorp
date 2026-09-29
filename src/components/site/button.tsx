import Link from "next/link";
import { cn } from "@/lib/utils";

/* Site buttons. Pills, one height scale, and variants named for their role
   rather than their colour. `inverse` and `ghost-dark` are the pair for dark
   and cobalt grounds. */

type Variant = "primary" | "accent" | "dark" | "outline" | "ghost" | "inverse" | "outline-dark";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  // The brand's action colour. `accent` is kept as an alias for older call sites.
  primary: "bg-cobalt text-white border border-cobalt hover:bg-cobalt-deep hover:border-cobalt-deep",
  accent: "bg-cobalt text-white border border-cobalt hover:bg-cobalt-deep hover:border-cobalt-deep",
  dark: "bg-ink text-white border border-ink hover:bg-ink-muted hover:border-ink-muted",
  outline: "bg-white text-ink border border-line-strong hover:border-cobalt hover:text-cobalt",
  ghost: "bg-transparent text-ink-muted border border-transparent hover:text-ink hover:bg-paper",
  inverse: "bg-white text-ink border border-white hover:bg-cobalt-tint hover:border-cobalt-tint",
  "outline-dark": "bg-transparent text-white border border-white/45 hover:border-white hover:bg-white/10",
};

const sizes: Record<Size, string> = {
  md: "h-10 px-4 text-[14.5px] gap-2",
  lg: "h-12 px-6 text-[15.5px] gap-2",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap transition-colors duration-200 active:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-40",
    variants[variant],
    sizes[size],
    className,
  );
}

type LinkButtonProps = React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function LinkButton({ variant, size, className, ...rest }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
