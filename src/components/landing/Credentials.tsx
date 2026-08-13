import { Reveal } from "./motion/Primitives";
import { ClientRow } from "./ClientLogos";

/** The client logo row. Accreditations live in CertificationStrip. */

export default function Credentials() {
  return (
    <section className="relative w-full overflow-hidden bg-[var(--hz-canvas)] pt-12 pb-8 sm:pt-14 sm:pb-10 lg:pt-16 lg:pb-12">
      {/* Heading beside the marks, not above them, so the row reads as one
          line of proof rather than a section with a title on it. */}
      <div className="mx-auto grid w-full max-w-[2200px] items-center gap-10 px-6 sm:px-10 lg:grid-cols-12 lg:gap-14 lg:px-16 2xl:px-28">
        <Reveal className="lg:col-span-3">
          <h2 className="hz-display hz-statement max-w-[14ch] text-[var(--hz-text)]">
            Trusted by the best.
          </h2>
        </Reveal>

        <div className="lg:col-span-9">
          <ClientRow />
        </div>
      </div>
    </section>
  );
}
