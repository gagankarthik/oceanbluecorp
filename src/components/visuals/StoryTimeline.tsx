import { milestones } from "@/lib/site-content";

/**
 * The company story as a ruled timeline: each milestone sits on its own
 * stretch of the line, three to a row on desktop, so it reads left to right
 * like a printed chronology. The latest one is marked in cyan.
 */
export default function StoryTimeline() {
  const last = milestones.length - 1;

  return (
    <ol className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
      {milestones.map((m, i) => {
        const latest = i === last;
        return (
          <li key={m.year} className="relative pt-10" data-reveal style={{ "--d": i % 3 } as React.CSSProperties}>
            {/* The line, and this milestone's point on it */}
            <span aria-hidden className={`absolute inset-x-0 top-0 h-0.5 ${latest ? "bg-cyan-500" : "bg-ocean-200"}`} />
            <span
              aria-hidden
              className={`absolute left-0 top-0 size-4 -translate-y-1/2 rounded-full ring-4 ring-field-mist ${latest ? "bg-cyan-500" : "bg-ocean-600"}`}
            />
            <p className="flex items-baseline gap-3">
              <span className="poster text-head-xl tabular-nums text-ocean-700">{m.year}</span>
              {latest && <span className="bg-cyan-100 px-2 py-0.5 text-caption font-semibold text-navy-900">Latest</span>}
            </p>
            <h3 className="mt-4 text-title font-semibold text-navy-900">{m.title}</h3>
            <p className="mt-2 max-w-measure-narrow leading-normal text-mist-600">{m.text}</p>
          </li>
        );
      })}
    </ol>
  );
}
