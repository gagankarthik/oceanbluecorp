import Link from "next/link";
import PageHero from "@/components/landing/PageHero";
import { SOCIAL_LINKS } from "@/components/layout/social";
import Locations from "@/components/landing/Locations";
import { CONTAINER, SECTION_Y } from "@/components/site/sections";
import { IconMail, IconClock } from "@/components/site/icons";
import { IconPhone, IconPin } from "@/components/site/company/icons";
import { ContactForm } from "./contact-form";

/** Direct routes, for anyone who would rather not fill in a form. */
const DIRECT = [
  { icon: IconPhone, k: "Call", v: "+1 (614) 844-6925", href: "tel:+16148446925" },
  { icon: IconMail, k: "Email", v: "hr@oceanbluecorp.com", href: "mailto:hr@oceanbluecorp.com" },
  { icon: IconClock, k: "Hours", v: "Monday to Friday, 8:00 AM to 5:00 PM EST", href: null },
  { icon: IconPin, k: "Head office", v: "Powell, Ohio", href: "#locations" },
];

/** For the visitor who is not here to start a project. */
const ROUTES = [
  { k: "Applying for a job", v: "Browse open roles", href: "/careers/search" },
  { k: "Your personal data", v: "Request access or deletion", href: "/data-deletion" },
  { k: "Something wrong with the site", v: "Check system status", href: "/status" },
];

export default function ContactPage({ content = {} }: { content?: Record<string, string> }) {
  return (
    <>
      <PageHero
        eyebrow="Contact us"
        title={content.contactTitle || "Let's start a conversation."}
        subtitle={
          content.contactSubtitle ||
          "A question about our services, a custom solution, or a partnership, our team is ready to help."
        }
      />

      <section id="contact-form" data-tone="white" className={`scroll-mt-28 bg-white ${SECTION_Y}`}>
        <div className={`${CONTAINER} grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16`}>
          <ContactForm />

          {/* What a person needs beside a form: the way to skip it. */}
          <aside className="lg:pt-4">
            <h2 className="type-headline-sm text-ink">Reach a person directly.</h2>
            <p className="mt-3 type-body text-ink-muted">
              No switchboard and no ticket number. Whoever picks up can put you through to the people who would actually do the work.
            </p>

            <ul className="mt-8 divide-y divide-line border-y border-line">
              {DIRECT.map((row) => (
                <li key={row.k} className="flex items-start gap-4 py-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink">
                    <row.icon size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] text-ink-subtle">{row.k}</span>
                    {row.href ? (
                      <a href={row.href} className="block type-body font-semibold text-ink underline-offset-4 hover:text-cobalt hover:underline">
                        {row.v}
                      </a>
                    ) : (
                      <span className="block type-body font-semibold text-ink">{row.v}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <h3 className="mt-9 type-title font-semibold text-ink">Here for something else?</h3>
            <ul className="mt-3 space-y-2.5">
              {ROUTES.map((r) => (
                <li key={r.href} className="flex flex-wrap items-baseline gap-x-2 type-body-sm">
                  <span className="text-ink-subtle">{r.k}:</span>
                  <Link href={r.href} className="font-semibold text-ink underline-offset-4 hover:text-cobalt hover:underline">
                    {r.v}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <span className="type-body-sm text-ink-muted">Or message us on</span>
              {SOCIAL_LINKS.map((sl) => (
                <a
                  key={sl.name}
                  href={sl.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={sl.name}
                  className="flex size-11 items-center justify-center rounded-full border border-line-strong text-ink-muted transition-colors hover:border-ink hover:text-ink"
                >
                  <sl.icon className="size-4" />
                </a>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* Offices, with a map: four pins across three countries reads as coverage at a glance. */}
      <Locations />
    </>
  );
}
