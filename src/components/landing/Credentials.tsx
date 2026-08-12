"use client";

import { useState } from "react";
import { Reveal } from "./motion/Primitives";
import { ClientRow } from "./ClientLogos";
import { CertificationRow } from "./Certifications";

/* ============================================================
   Credentials — clients and accreditations behind one pair of tabs.

   These were two separate full-width bands answering the same question:
   who vouches for you? Running them as consecutive sections said it twice
   and spent two screens doing it. As tabs they read as one claim with two
   kinds of evidence, and the visitor chooses which they care about — a
   procurement officer goes straight to the certifications, a commercial
   buyer to the logos.

   Heading first, then the tabs beneath it on a full-width rule. Pills
   ABOVE the heading read as a filter applied to the page; an underlined
   tab strip under the heading reads as two views of one section, which
   is what this is.

   Both panels stay mounted. Unmounting the inactive one made every tab
   switch re-request six remote client logos, and the row visibly reflowed
   as they decoded; `hidden` keeps them decoded and costs nothing.
   ============================================================ */

const TABS = [
  { id: "clients", label: "Clients" },
  { id: "certifications", label: "Certifications" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Credentials() {
  const [active, setActive] = useState<TabId>("clients");

  return (
    <section className="relative w-full overflow-hidden bg-[var(--hz-canvas)] pt-12 pb-16 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24">
      <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
        <Reveal className="flex flex-col items-center text-center">
          <span className="hz-eyebrow">Credentials</span>
          {/* One heading for the section rather than a line per tab. Swapping
              the statement on every tab press moved the tabs up and down as the
              text rewrapped, and the certifications line was restating what the
              badges below it already say. */}
          <h2 className="hz-display hz-statement mt-3 max-w-2xl text-[var(--hz-text)]">
            Relied on by enterprises and state government agencies across North America.
          </h2>
        </Reveal>

        {/* The rule is capped and centred rather than running the full page
            width. Edge to edge it read as a section divider that the tabs
            happened to sit on; at this width it reads as the control's own
            baseline, with the active tab breaking it. */}
        <div
          role="tablist"
          aria-label="Clients and certifications"
          className="mx-auto mt-8 flex max-w-md items-center justify-center gap-10 border-b border-[var(--hz-line)] sm:mt-10"
        >
          {TABS.map((t) => {
            const selected = t.id === active;
            return (
              <button
                key={t.id}
                role="tab"
                id={`cred-tab-${t.id}`}
                aria-selected={selected}
                aria-controls={`cred-panel-${t.id}`}
                onClick={() => setActive(t.id)}
                className={`-mb-px border-b-2 px-1 pb-3.5 text-[14px] font-semibold transition-colors duration-200 ${
                  selected
                    ? "border-[var(--hz-cobalt)] text-[var(--hz-cobalt)]"
                    : "border-transparent text-[var(--hz-text-mute)] hover:text-[var(--hz-text)]"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Equal columns for both panels, so six client logos and four
            certification badges are spaced by the same rule rather than each
            row inventing its own rhythm. */}
        <div className="mt-10 sm:mt-12">
          <div
            role="tabpanel"
            id="cred-panel-clients"
            aria-labelledby="cred-tab-clients"
            hidden={active !== "clients"}
          >
            <ClientRow />
          </div>
          <div
            role="tabpanel"
            id="cred-panel-certifications"
            aria-labelledby="cred-tab-certifications"
            hidden={active !== "certifications"}
          >
            <CertificationRow />
          </div>
        </div>
      </div>
    </section>
  );
}
