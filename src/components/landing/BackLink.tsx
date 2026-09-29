import Link from "next/link";
import { IconArrowLeft } from "@/components/site/resources/icons";

/**
 * "Back to X" for the Resources section.
 *
 * A real <Link> to a stated destination rather than `router.back()`: history
 * back returns to a search engine or to nothing when the reader arrived from a
 * shared link. Naming the destination says where it goes before the click.
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
    <Link href={href} className={`group inline-flex items-center gap-2 type-label font-semibold text-ink-muted transition-colors hover:text-cobalt ${className}`}>
      <IconArrowLeft size={16} className="flex-none transition-transform group-hover:-translate-x-0.5" />
      Back to {label}
    </Link>
  );
}
