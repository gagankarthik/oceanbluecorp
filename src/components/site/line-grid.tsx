import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Faint architectural grid behind openers: hairlines every 96px with a small
 * cross at alternate intersections, faded out from the centre so it frames the
 * type instead of sitting under it. Decorative only.
 *
 * Vertical lines fall at 50% ± n·96px and horizontal ones at n·96px, which
 * HeroBackdrop relies on to run its beams along them.
 *
 * Rainbow beams glide along a few of those lines on load (`.grid-beam` in
 * globals.css): one slow pass, finished inside five seconds (WCAG 2.2.2), and
 * not at all under reduced motion.
 */
const H_LINES = [96, 192, 288];
const V_LINES = [-288, -96, 96, 288];
const SPAN = 1200;

export function LineGrid({ className, dark, beams = true }: { className?: string; dark?: boolean; beams?: boolean }) {
  const id = useId();
  const stroke = dark ? "rgb(255 255 255 / 0.07)" : "rgb(11 26 51 / 0.07)";
  const mark = dark ? "rgb(255 255 255 / 0.2)" : "rgb(11 26 51 / 0.2)";
  const rainbow = ["#3b82f6", "#06b6d4", "#22c55e", "#eab308", "#f97316", "#ec4899", "#8b5cf6"];
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
        {beams && (
          <>
            <linearGradient id={`${id}-h`} gradientUnits="userSpaceOnUse" x1={-SPAN} y1="0" x2={SPAN} y2="0">
              {rainbow.map((c, i) => <stop key={c} offset={i / (rainbow.length - 1)} stopColor={c} />)}
            </linearGradient>
            <linearGradient id={`${id}-v`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={SPAN * 2}>
              {rainbow.map((c, i) => <stop key={c} offset={i / (rainbow.length - 1)} stopColor={c} />)}
            </linearGradient>
          </>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
      {beams && (
        // Origin at the horizontal centre, where the pattern's vertical lines are anchored.
        <svg x="50%" overflow="visible" className={dark ? "opacity-90" : "opacity-75"}>
          {H_LINES.map((y, i) => (
            <line
              key={`h${y}`}
              className="grid-beam"
              style={{ animationDelay: `${i * 120}ms` }}
              // Alternate rows run in opposite directions.
              x1={i % 2 ? SPAN : -SPAN}
              x2={i % 2 ? -SPAN : SPAN}
              y1={y}
              y2={y}
              stroke={`url(#${id}-h)`}
            />
          ))}
          {V_LINES.map((x, i) => (
            <line
              key={`v${x}`}
              className="grid-beam"
              style={{ animationDelay: `${60 + i * 60}ms` }}
              x1={x}
              x2={x}
              y1={i % 2 ? SPAN * 2 - 400 : -400}
              y2={i % 2 ? -400 : SPAN * 2 - 400}
              stroke={`url(#${id}-v)`}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}
