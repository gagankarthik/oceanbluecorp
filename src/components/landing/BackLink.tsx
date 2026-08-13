import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * "Back to X" for the Resources section.
 *
 * A real <Link> to a stated destination rather than `router.back()`. History
 * back is a lie on the two paths that matter most here: arriving from a search
 * result or a shared link, where "back" returns to Google or to nothing at all.
 * Naming the destination also means the control says where it goes before it
 * is clicked, which a bare "← Back" never does.
 */
export default function BackLink({
  href,
  label,
  className = "",
}: {
  href: string;
  /** The destination, not the action: "Blog", not "Back". */
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2 text-[14.5px] font-semibold text-[var(--hz-text-mute)] transition-colors hover:text-[var(--hz-cobalt)] ${className}`}
    >
      <ArrowLeft
        className="h-4 w-4 flex-none transition-transform group-hover:-translate-x-0.5"
        aria-hidden="true"
      />
      Back to {label}
    </Link>
  );
}
