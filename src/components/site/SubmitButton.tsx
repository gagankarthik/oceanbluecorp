"use client";

/**
 * The site's form submit. Busy shows a spinner and the busy label stacked over
 * the idle label, so the button keeps its width while it works.
 */
export default function SubmitButton({
  children,
  busy = false,
  busyLabel,
  disabled,
  full = false,
  className = "",
}: {
  children: React.ReactNode;
  busy?: boolean;
  /** Shown beside the spinner, like "Sending…" */
  busyLabel: string;
  disabled?: boolean;
  /** Stretch to the form's width (auth cards) */
  full?: boolean;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      aria-busy={busy || undefined}
      className={`${full ? "flex w-full" : "inline-flex"} min-h-12 items-center justify-center bg-ocean-600 px-7 font-medium text-white btn-fill btn-fill-ocean active:translate-y-px disabled:cursor-not-allowed disabled:opacity-[var(--opacity-disabled)] disabled:active:translate-y-0 ${className}`}
    >
      <span className="grid place-items-center">
        <span className={`[grid-area:1/1] ${busy ? "invisible" : ""}`}>{children}</span>
        <span className={`[grid-area:1/1] inline-flex items-center gap-2 ${busy ? "" : "invisible"}`}>
          <span
            aria-hidden
            className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-[spin_1.6s_linear_infinite]"
          />
          {busyLabel}
        </span>
      </span>
    </button>
  );
}
