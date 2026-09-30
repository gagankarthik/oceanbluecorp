import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Faint architectural grid behind openers: hairlines every 96px with a small
 * cross at alternate intersections, faded out from the centre so it frames the
 * type instead of sitting under it. Decorative only.
 *
 * Vertical lines fall at 50% ± n·96px and horizontal ones at n·96px, which
 * HeroBackdrop relies on to run its beams along them.
 */
export function LineGrid({ className, dark }: { className?: string; dark?: boolean }) {
  const id = useId();
  const stroke = dark ? "rgb(255 255 255 / 0.07)" : "rgb(11 26 51 / 0.07)";
  const mark = dark ? "rgb(255 255 255 / 0.2)" : "rgb(11 26 51 / 0.2)";
  return (
    <svg
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 h-full w-full [mask-image:radial-gradient(90%_75%_at_50%_45%,black_20%,transparent_80%)]",
        className,
      )}
    >
      <defs>
        <pattern id={id} width="192" height="192" patternUnits="userSpaceOnUse" x="50%" y="0">
          <path d="M192 0H0V192M96 0V192M0 96H192" fill="none" stroke={stroke} />
          <path d="M96 90v12M90 96h12" stroke={mark} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
