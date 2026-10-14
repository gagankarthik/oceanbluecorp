import Link from "next/link";

/** Section-header link to the page that covers it in full: label, forward arrow, underline that draws in on hover. */
export default function MoreLink({
  href,
  label,
  tone = "ocean",
  inline = false,
  className = "",
}: {
  href: string;
  label: string;
  tone?: "ocean" | "light";
  /** Under a paragraph: no tall tap box, so it sits close to the text */
  inline?: boolean;
  className?: string;
}) {
  const color = tone === "light" ? "text-white" : "text-ocean-700 hover:text-ocean-800";
  return (
    <Link href={href} className={`group inline-flex w-fit items-center gap-2 text-small font-medium ${inline ? "py-1" : "min-h-10"} ${color} ${className}`}>
      <span className="relative">
        {label}
        <span
          aria-hidden
          className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-current transition-transform duration-300 ease-[var(--ease-out-strong)] group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
        />
      </span>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="size-4 shrink-0 transition-transform duration-300 ease-[var(--ease-out-strong)] group-hover:translate-x-1 motion-reduce:transition-none"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 8h10M9 4l4 4-4 4" />
      </svg>
    </Link>
  );
}
