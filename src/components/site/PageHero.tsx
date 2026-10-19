import Photo from "./Photo";
import type { PhotoKey } from "@/lib/photos";

export type Cell = { photo: PhotoKey; position?: string } | { tone: string };

/**
 * The masthead of an inner page: a gutterless mosaic band of photographs and
 * flat colour tiles, then the title starting on the axis with its standfirst.
 */
export default function PageHero({
  cells,
  lines,
  standfirst,
  side,
}: {
  /** Four to six cells for the mosaic band */
  cells: Cell[];
  lines: [string] | [string, string];
  standfirst: React.ReactNode;
  side?: React.ReactNode;
}) {
  const cols = cells.length === 6 ? "md:grid-cols-6" : cells.length === 5 ? "md:grid-cols-5" : "md:grid-cols-4";
  return (
    <section id="top" className="bg-field-paper">
      <div className="px-4 pt-2">
        <div className={`grid h-[30svh] grid-cols-3 md:h-[42svh] ${cols}`}>
          {cells.map((c, i) => (
            <div key={i} className={`${i >= 3 ? "hidden md:block" : ""} ${i === 0 ? "shutter" : ""}`}>
              {"photo" in c ? (
                <Photo name={c.photo} position={c.position} className="h-full" preload={i === 0} eager sizes="(min-width: 768px) 25vw, 33vw" />
              ) : (
                <div className={`h-full ${c.tone}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="gutter grid gap-8 pb-24 pt-12 md:pb-32 md:pt-16 lg:grid-cols-12">
        {side && (
          <div data-after-lines className="side order-2 text-small leading-normal text-mist-600 lg:order-1 lg:row-span-2 lg:pt-4">
            {side}
          </div>
        )}
        <h1 className="lines poster axis order-1 text-poster lg:order-2">
          {lines.map((l, i) => (
            <span key={l} className="line">
              <span data-line style={{ "--i": i } as React.CSSProperties}>
                {i > 0 && " "}
                {l}
              </span>
            </span>
          ))}
        </h1>
        <p data-after-lines className="axis order-1 max-w-measure-narrow text-lead leading-snug lg:order-3">
          {standfirst}
        </p>
      </div>
    </section>
  );
}
