import { Reveal } from "./motion/Primitives";
import { ClientRow } from "./ClientLogos";

/* ============================================================
   Clients, the logo row, on its own.

   This was a tab pair: clients on one panel, accreditations on the
   other. The tabs are gone and so are the accreditations, because
   the certifications now have their own strip directly above the
   closing CTA, and a control offering two views is only worth its
   cost when there are two views. One panel behind a tab strip is a
   section wearing a costume.

   Dropping the tabs also drops the client-side state, so this is a
   plain server component now. Nothing here needed to hydrate.
   ============================================================ */

export default function Credentials() {
  return (
    <section className="relative w-full overflow-hidden bg-[var(--hz-canvas)] pt-12 pb-8 sm:pt-14 sm:pb-10 lg:pt-16 lg:pb-12">
      <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
        <Reveal className="flex flex-col items-center text-center">
          <span className="hz-eyebrow">Clients</span>
          <h2 className="hz-display hz-statement mt-3 max-w-2xl text-[var(--hz-text)]">
            Relied on by enterprises and state government agencies across North America.
          </h2>
        </Reveal>

        {/* The gap under the row was sized for a tab strip that is no longer
            above it, which left a band of dead space between the logos and the
            next section. */}
        <div className="mt-10 sm:mt-12">
          <ClientRow />
        </div>
      </div>
    </section>
  );
}
