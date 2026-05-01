import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Cookie, Shield, BarChart2, Settings2, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie Policy | Ocean Blue Corporation",
  description: "Learn how Ocean Blue Corporation uses cookies and similar tracking technologies on our website.",
};

const SECTIONS = [
  { id: "what-are-cookies",  label: "What Are Cookies" },
  { id: "how-we-use",        label: "How We Use Cookies" },
  { id: "types",             label: "Types of Cookies We Use" },
  { id: "third-party",       label: "Third-Party Cookies" },
  { id: "duration",          label: "Cookie Duration" },
  { id: "managing",          label: "Managing Your Cookies" },
  { id: "browser-controls",  label: "Browser Controls" },
  { id: "do-not-track",      label: "Do Not Track" },
  { id: "consent",           label: "Your Consent" },
  { id: "updates",           label: "Updates to This Policy" },
  { id: "contact",           label: "Contact Us" },
];

function Section({ id, number, title, children }: {
  id: string; number: string; title: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 border-b border-gray-100 py-8 last:border-0">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="rounded-md bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-600">
          {number}
        </span>
        <h2
          className="text-xl font-bold text-gray-900"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
      </div>
      <div className="space-y-3 text-[15px] leading-relaxed text-gray-600">
        {children}
      </div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function UL({ items }: { items: (string | React.ReactNode)[] }) {
  return (
    <ul className="space-y-2 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function CookieCard({ icon: Icon, title, color, children }: {
  icon: React.ElementType; title: string; color: string; children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border p-5 ${color}`}>
      <div className="mb-3 flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <p className="font-semibold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </p>
      </div>
      <div className="text-sm leading-relaxed text-gray-600">{children}</div>
    </div>
  );
}

const COOKIE_TABLE = [
  { name: "_ga, _gid", provider: "Google Analytics", purpose: "Distinguishes users and sessions for analytics reporting", duration: "2 years / 24 hours", type: "Analytics" },
  { name: "_gat", provider: "Google Analytics", purpose: "Throttles request rate to Google Analytics", duration: "1 minute", type: "Analytics" },
  { name: "csrftoken", provider: "Ocean Blue", purpose: "Prevents cross-site request forgery attacks", duration: "Session", type: "Security" },
  { name: "sessionid", provider: "Ocean Blue", purpose: "Maintains authenticated user session state", duration: "2 weeks", type: "Functional" },
  { name: "cookie_consent", provider: "Ocean Blue", purpose: "Stores your cookie preference decision", duration: "1 year", type: "Preference" },
  { name: "__cf_bm", provider: "Cloudflare", purpose: "Bot management and security protection", duration: "30 minutes", type: "Security" },
  { name: "ln_or", provider: "LinkedIn", purpose: "Tracks LinkedIn ad conversions and insights", duration: "1 day", type: "Marketing" },
];

export default function CookiesPage() {
  const EFFECTIVE = "April 1, 2026";

  return (
    <div
      className="min-h-screen"
      style={{
        background: [
          "radial-gradient(ellipse 70% 50% at 15% 5%, rgba(245,158,11,0.06) 0%, transparent 55%)",
          "radial-gradient(ellipse 60% 45% at 88% 15%, rgba(99,102,241,0.05) 0%, transparent 55%)",
          "#FAFBFF",
        ].join(", "),
      }}
    >
      {/* Hero */}
      <div className="border-b border-gray-100 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
          <Link
            href="/"
            className="group mb-8 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Home
          </Link>
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-100">
              <Cookie className="h-7 w-7 text-amber-500" />
            </div>
            <div>
              <h1
                className="text-4xl font-extrabold tracking-tight text-gray-900 lg:text-5xl"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
              >
                Cookie Policy
              </h1>
              <p className="mt-2 text-base text-gray-500">
                Effective date: <span className="font-medium text-gray-700">{EFFECTIVE}</span>
                &nbsp;·&nbsp;
                Last updated: <span className="font-medium text-gray-700">{EFFECTIVE}</span>
              </p>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-gray-500">
                This Cookie Policy explains how Ocean Blue Corporation (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) uses cookies and similar tracking technologies when you visit our website at{" "}
                <span className="font-medium text-gray-700">oceanbluecorp.com</span>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="flex gap-12 xl:gap-16">

          {/* Sticky TOC */}
          <aside className="hidden xl:block w-64 flex-shrink-0">
            <div className="sticky top-8">
              <p
                className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-gray-400"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Contents
              </p>
              <nav className="space-y-1">
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-amber-50 hover:text-amber-700"
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
              <div className="mt-8 rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                <p className="mb-1 text-xs font-semibold text-amber-700">Questions?</p>
                <p className="text-xs text-amber-700/70 leading-relaxed">
                  Contact our privacy team at{" "}
                  <a href="mailto:privacy@oceanbluecorp.com" className="underline underline-offset-2">
                    privacy@oceanbluecorp.com
                  </a>
                </p>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1">
            <div className="divide-y divide-gray-100 rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 px-8 py-2 lg:px-12">

              <Section id="what-are-cookies" number="01" title="What Are Cookies">
                <P>
                  Cookies are small text files placed on your device (computer, tablet, or smartphone) when you visit a website. They are widely used to make websites work, improve user experience, and provide reporting information to website owners.
                </P>
                <P>
                  Cookies set by the website owner (in this case, Ocean Blue Corporation) are called &ldquo;first-party cookies.&rdquo; Cookies set by parties other than the website owner are called &ldquo;third-party cookies.&rdquo; Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., advertising, interactive content, and analytics).
                </P>
                <P>
                  In addition to cookies, we may also use similar tracking technologies such as web beacons (also known as pixel tags or clear GIFs), local storage, and session storage to collect information about your browsing activities.
                </P>
              </Section>

              <Section id="how-we-use" number="02" title="How We Use Cookies">
                <P>We use cookies and similar technologies for the following purposes:</P>
                <UL items={[
                  "To ensure our website functions correctly and securely, including maintaining your login session",
                  "To remember your preferences and settings so you do not have to re-enter them on each visit",
                  "To analyze how visitors use our website, which pages are most popular, and where users encounter difficulties",
                  "To measure the effectiveness of our marketing campaigns and understand how visitors reach our website",
                  "To comply with legal and regulatory obligations relating to record-keeping and security",
                  "To protect against fraudulent, unauthorized, or unlawful activity",
                  "To improve our website, services, and the overall user experience over time",
                ]} />
              </Section>

              <Section id="types" number="03" title="Types of Cookies We Use">
                <P>We categorize the cookies on our website into four types:</P>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <CookieCard icon={Shield} title="Strictly Necessary" color="border-blue-100 bg-blue-50/50">
                    <p>
                      Essential for the website to function. They enable core features such as security, account login, and network management. You cannot opt out of these without significantly affecting how our website works.
                    </p>
                    <p className="mt-2 text-xs font-medium text-blue-700">Always active</p>
                  </CookieCard>
                  <CookieCard icon={Settings2} title="Functional / Preference" color="border-green-100 bg-green-50/50">
                    <p>
                      Allow our website to remember choices you make (such as language, region, or cookie consent) and provide enhanced, more personal features. Disabling these may affect your experience.
                    </p>
                    <p className="mt-2 text-xs font-medium text-green-700">Optional — enabled by default</p>
                  </CookieCard>
                  <CookieCard icon={BarChart2} title="Analytics / Performance" color="border-amber-100 bg-amber-50/50">
                    <p>
                      Help us understand how visitors interact with our website by collecting and reporting information anonymously. We use Google Analytics 4 for this purpose. No personally identifiable information is transmitted.
                    </p>
                    <p className="mt-2 text-xs font-medium text-amber-700">Optional — requires consent</p>
                  </CookieCard>
                  <CookieCard icon={ExternalLink} title="Marketing / Targeting" color="border-rose-100 bg-rose-50/50">
                    <p>
                      Used to deliver advertisements and track campaign performance across websites. These cookies are placed by our advertising partners to build a profile of your interests and show relevant ads.
                    </p>
                    <p className="mt-2 text-xs font-medium text-rose-700">Optional — requires consent</p>
                  </CookieCard>
                </div>
              </Section>

              <Section id="third-party" number="04" title="Third-Party Cookies">
                <P>
                  Some cookies on our website are placed by third-party service providers. We do not control these cookies, and they are governed by each provider&apos;s own privacy policy.
                </P>
                <P>The following table lists the specific cookies currently in use:</P>
                <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Cookie Name</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Provider</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 hidden lg:table-cell">Purpose</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Duration</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {COOKIE_TABLE.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-gray-700">{row.name}</td>
                            <td className="px-4 py-3 text-gray-600">{row.provider}</td>
                            <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{row.purpose}</td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{row.duration}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                row.type === "Security"    ? "bg-blue-50 text-blue-700" :
                                row.type === "Analytics"  ? "bg-amber-50 text-amber-700" :
                                row.type === "Marketing"  ? "bg-rose-50 text-rose-700" :
                                row.type === "Functional" ? "bg-green-50 text-green-700" :
                                "bg-gray-100 text-gray-600"
                              }`}>{row.type}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <P>
                  For more information about these third-party cookies, please visit the respective privacy policies of Google Analytics, Cloudflare, and LinkedIn.
                </P>
              </Section>

              <Section id="duration" number="05" title="Cookie Duration">
                <P>Cookies can remain on your device for different periods of time. We use two types based on duration:</P>
                <UL items={[
                  <><strong className="text-gray-800">Session cookies</strong> — These are temporary cookies that expire and are automatically deleted when you close your browser. They are used to carry information from one page to the next during a browsing session, such as maintaining your logged-in state.</>,
                  <><strong className="text-gray-800">Persistent cookies</strong> — These remain on your device for a specified period or until you delete them manually. They are used to remember your preferences and settings across multiple visits. The specific duration varies by cookie and is listed in the table in Section 04.</>,
                ]} />
              </Section>

              <Section id="managing" number="06" title="Managing Your Cookies">
                <P>
                  You have the right to decide whether to accept or reject non-essential cookies. When you first visit our website, you will be presented with a cookie consent banner that allows you to accept all cookies, reject optional cookies, or customize your preferences by category.
                </P>
                <P>
                  You can update your cookie preferences at any time by clicking the &ldquo;Cookie Settings&rdquo; link in the footer of our website. Please note that withdrawing your consent will not affect the lawfulness of processing carried out before you withdrew consent.
                </P>
                <P>
                  Blocking strictly necessary cookies may impair the functionality of our website, including preventing you from logging in or accessing certain features.
                </P>
              </Section>

              <Section id="browser-controls" number="07" title="Browser Controls">
                <P>
                  Most web browsers allow you to control cookies through their settings. You can typically find these settings in the &ldquo;Options,&rdquo; &ldquo;Tools,&rdquo; or &ldquo;Preferences&rdquo; menus of your browser. You can configure your browser to:
                </P>
                <UL items={[
                  "Block all cookies (note: this will prevent many websites from working correctly)",
                  "Block only third-party cookies",
                  "Delete all cookies when you close your browser",
                  "Alert you each time a cookie is about to be placed",
                  "Manage cookies on a site-by-site basis",
                ]} />
                <P>
                  The following links provide instructions for managing cookies in common browsers:
                </P>
                <div className="mt-2 flex flex-wrap gap-3">
                  {[
                    { name: "Google Chrome", href: "https://support.google.com/chrome/answer/95647" },
                    { name: "Mozilla Firefox", href: "https://support.mozilla.org/kb/cookies-information-websites-store-on-your-computer" },
                    { name: "Apple Safari", href: "https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" },
                    { name: "Microsoft Edge", href: "https://support.microsoft.com/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" },
                  ].map((b) => (
                    <a
                      key={b.name}
                      href={b.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition-colors hover:border-amber-300 hover:text-amber-700"
                    >
                      {b.name}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
                <P>
                  To opt out of being tracked by Google Analytics across all websites, you can install the{" "}
                  <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-amber-600 underline underline-offset-2 hover:text-amber-700">
                    Google Analytics Opt-out Browser Add-on
                  </a>.
                </P>
              </Section>

              <Section id="do-not-track" number="08" title="Do Not Track">
                <P>
                  Some browsers offer a &ldquo;Do Not Track&rdquo; (DNT) feature that signals to websites that you prefer not to be tracked. Because there is no industry-standard interpretation of DNT signals, our website does not currently respond to DNT browser settings.
                </P>
                <P>
                  However, you can use the cookie consent options and browser controls described in Sections 06 and 07 to limit tracking on our website.
                </P>
              </Section>

              <Section id="consent" number="09" title="Your Consent">
                <P>
                  Where required by applicable law (including the EU ePrivacy Directive and GDPR), we will obtain your consent before placing non-essential cookies on your device. Your consent is indicated by your affirmative action in our cookie consent banner.
                </P>
                <P>
                  For users in the United States, some states (including California under the CPRA) provide rights relating to the use of cookies for targeted advertising purposes. Please see our{" "}
                  <Link href="/privacy#california" className="text-amber-600 underline underline-offset-2 hover:text-amber-700">
                    Privacy Policy
                  </Link>{" "}
                  for details about your rights as a California resident.
                </P>
                <P>
                  By continuing to use our website after being presented with our cookie notice, you consent to our use of cookies as described in this policy.
                </P>
              </Section>

              <Section id="updates" number="10" title="Updates to This Policy">
                <P>
                  We may update this Cookie Policy from time to time to reflect changes in technology, law, or our business practices. We will post the revised policy on this page with an updated effective date. For significant changes, we may provide a more prominent notice, including by displaying a new cookie consent banner.
                </P>
                <P>
                  We encourage you to review this page periodically to stay informed about our use of cookies. Your continued use of our website after any changes to this policy constitutes your acceptance of the updated policy.
                </P>
              </Section>

              <Section id="contact" number="11" title="Contact Us">
                <P>
                  If you have any questions or concerns about our use of cookies or this Cookie Policy, please contact us:
                </P>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <a
                    href="mailto:privacy@oceanbluecorp.com"
                    className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 transition-colors hover:border-amber-200 hover:bg-amber-50"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-100 group-hover:bg-amber-100 group-hover:ring-amber-200 transition-colors">
                      <Mail className="h-4 w-4 text-gray-500 group-hover:text-amber-600 transition-colors" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Privacy Team</p>
                      <p className="text-sm font-medium text-gray-700">privacy@oceanbluecorp.com</p>
                    </div>
                  </a>
                  <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-100">
                      <Cookie className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Mailing Address</p>
                      <p className="text-sm font-medium text-gray-700">
                        9775 Fairway Drive, Suite #C<br />
                        Powell, OH 43065
                      </p>
                    </div>
                  </div>
                </div>
                <P>
                  For general inquiries unrelated to privacy, please visit our{" "}
                  <Link href="/contact" className="text-amber-600 underline underline-offset-2 hover:text-amber-700">
                    Contact page
                  </Link>.
                </P>
              </Section>

            </div>

            {/* Footer nav */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white px-8 py-5 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center gap-6 text-sm">
                <Link href="/privacy" className="text-gray-500 hover:text-amber-600 transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-gray-500 hover:text-amber-600 transition-colors">
                  Terms of Service
                </Link>
              </div>
              <Link
                href="/"
                className="group inline-flex items-center gap-2 text-sm font-medium text-amber-600 transition-colors hover:text-amber-700"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                Back to Home
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
