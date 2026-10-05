import Link from "next/link";
import { IconArrowRight, IconX } from "@/components/site/icons";

/**
 * Sitewide announcement strip shown above the top navbar. Rendered only when
 * the CMS announcement field is set (see LayoutWrapper). 40px tall.
 *
 * Positioning belongs to the WRAPPER in LayoutWrapper, not here: the wrapper
 * is what slides the strip out of view once the reader is past the fold, and
 * two elements both claiming `fixed inset-x-0 top-0` would fight over it.
 * `scroll` (CMS toggle) turns it into a continuous marquee. On phones it is
 * always the marquee: the static label would be truncated at that width.
 */
export default function AnnouncementBar({
  text,
  href,
  scroll,
  onDismiss,
}: {
  text: string;
  href?: string;
  scroll?: boolean;
  /** Renders the close control. Owned by LayoutWrapper, which remembers it. */
  onDismiss?: () => void;
}) {
  const barClass =
    "horizon relative h-10 w-full items-center overflow-hidden text-[13px] font-medium text-white";
  const barStyle = {
    // Ink navy, not cobalt: the strip sits above a blue hero, and blue on blue
    // read as one smeared band. Dark bar, white header, blue hero instead.
    background: "#0b1a33",
    color: "#ffffff", // force white, beats the .horizon base color
  } as const;

  /**
   * The close control. In the static mode it is pinned to the right end so the
   * centred label stays centred (`pr-12` keeps a long label clear of it). In the
   * marquee it takes its own slot, so the track never runs underneath it.
   */
  const dismissButton = (pinned: boolean) =>
    onDismiss ? (
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss announcement"
        title="Dismiss"
        className={`${pinned ? "absolute right-2 top-1/2 -translate-y-1/2" : "mx-1.5 flex-none"} z-[2] grid h-7 w-7 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60`}
      >
        <IconX size={16} />
      </button>
    ) : null;

  // ── Scrolling / marquee mode ──
  const marquee = (extra = "") => {
    const item = (key: number) => (
      <span key={key} className="mx-10 inline-flex items-center gap-2 whitespace-nowrap">
        {text}
        {href && <IconArrowRight size={14} className="flex-none text-cobalt-light" />}
      </span>
    );
    // Two identical halves so the -50% loop is seamless.
    const half = Array.from({ length: 4 }, (_, i) => item(i));
    const track = <div className="hz-marquee flex w-max items-center">{[...half, ...half.map((_, i) => item(i + 4))]}</div>;
    return (
      <div className={`${barClass} flex ${extra}`} style={barStyle}>
        <div className="h-full min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)]">
          {href ? (
            <Link href={href} className="flex h-full w-full items-center transition-opacity hover:opacity-90">{track}</Link>
          ) : (
            <div className="flex h-full items-center">{track}</div>
          )}
        </div>
        {dismissButton(false)}
      </div>
    );
  };
  if (scroll) return marquee();

  // ── Static centered ──
  const label = (
    <span className="inline-flex max-w-full items-center gap-2 truncate whitespace-nowrap">
      {text}
      {href && <IconArrowRight size={14} className="flex-none text-cobalt-light transition-transform group-hover:translate-x-0.5" />}
    </span>
  );
  return (
    <>
      {marquee("sm:hidden")}
      <div className={`${barClass} hidden justify-center px-4 sm:flex ${onDismiss ? "pr-12" : ""}`} style={barStyle}>
        {href ? (
          <Link href={href} className="group inline-flex max-w-full items-center transition-opacity hover:opacity-90">{label}</Link>
        ) : (
          label
        )}
        {dismissButton(true)}
      </div>
    </>
  );
}
