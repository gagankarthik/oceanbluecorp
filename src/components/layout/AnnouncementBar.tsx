import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Sitewide announcement strip shown above the top navbar. Rendered only when
 * the CMS announcement field is set (see LayoutWrapper). 40px tall.
 *
 * Positioning belongs to the WRAPPER in LayoutWrapper, not here: the wrapper
 * is what slides the strip out of view once the reader is past the fold, and
 * two elements both claiming `fixed inset-x-0 top-0` would fight over it.
 * `scroll` (CMS toggle) turns it into a continuous marquee.
 */
export default function AnnouncementBar({ text, href, scroll }: { text: string; href?: string; scroll?: boolean }) {
  const barClass =
    "horizon relative flex h-10 w-full items-center overflow-hidden text-[13px] font-medium text-white";
  const barStyle = {
    background: "linear-gradient(90deg, var(--hz-cobalt-600) 0%, var(--hz-cobalt) 50%, var(--hz-cobalt-600) 100%)",
    color: "#ffffff", // force white — beats the .horizon base color
  } as const;

  // ── Scrolling / marquee mode ──
  if (scroll) {
    const item = (key: number) => (
      <span key={key} className="mx-10 inline-flex items-center gap-2 whitespace-nowrap">
        {text}
        {href && <ArrowRight className="h-3.5 w-3.5 flex-none" />}
      </span>
    );
    // Two identical halves so the -50% loop is seamless.
    const half = Array.from({ length: 4 }, (_, i) => item(i));
    const track = <div className="hz-marquee flex w-max items-center">{[...half, ...half.map((_, i) => item(i + 4))]}</div>;
    return (
      <div className={barClass} style={barStyle}>
        {href ? (
          <Link href={href} className="w-full transition-opacity hover:opacity-90">{track}</Link>
        ) : (
          track
        )}
      </div>
    );
  }

  // ── Static centered ──
  const label = (
    <span className="inline-flex max-w-full items-center gap-2 truncate whitespace-nowrap">
      {text}
      {href && <ArrowRight className="h-3.5 w-3.5 flex-none transition-transform group-hover:translate-x-0.5" />}
    </span>
  );
  return (
    <div className={`${barClass} justify-center px-4`} style={barStyle}>
      {href ? (
        <Link href={href} className="group inline-flex max-w-full items-center transition-opacity hover:opacity-90">{label}</Link>
      ) : (
        label
      )}
    </div>
  );
}
