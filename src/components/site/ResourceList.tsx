import Link from "next/link";
import { categories, type Resource } from "@/lib/resources";

/** A list of resources as rows: category, title, summary */
export default function ResourceList({ items, showCategory = true }: { items: Resource[]; showCategory?: boolean }) {
  if (items.length === 0) {
    return <p className="bg-mist-0 p-6 text-mist-600 md:p-7">Nothing published here yet. Check back soon.</p>;
  }
  return (
    <ul className="grid gap-2">
      {items.map((r, i) => {
        const label = showCategory ? `${categories[r.category].singular}${r.date ? `, ${r.date}` : ""}` : r.date;
        return (
        <li key={`${r.category}/${r.slug}`} data-reveal style={{ "--d": i % 3 } as React.CSSProperties}>
          <Link
            href={`/resources/${r.category}/${r.slug}`}
            className={`group grid gap-3 bg-mist-0 p-6 transition-colors hover:bg-tide-100 md:items-baseline md:gap-8 md:p-7 ${
              label ? "md:grid-cols-[9rem_1fr_auto]" : "md:grid-cols-[1fr_auto]"
            }`}
          >
            {label && <span className="text-small text-mist-600">{label}</span>}
            <span>
              <span className="display block text-head-sm group-hover:text-ocean-700">{r.title}</span>
              <span className="mt-2 block max-w-measure text-mist-600">{r.summary}</span>
            </span>
            <span className="text-small font-medium text-ocean-700">Read</span>
          </Link>
        </li>
        );
      })}
    </ul>
  );
}
