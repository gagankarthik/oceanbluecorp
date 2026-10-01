import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { LEGAL_DOCS } from "@/lib/legal";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DocPage, DocSection, P, UL, DocTable, RelatedLinks, IconPin, Callout } from "@/components/site/legal/doc";
import { IconShieldLock, IconSettings, IconExternal, IconMail, type Icon } from "@/components/site/icons";

export const metadata: Metadata = pageMetadata({
  path: "/cookies",
  title: "Cookie Policy",
  description: "The cookies and browser storage Ocean Blue Corporation uses: essential sign-in and consent storage only, no analytics or ads, and how to change your choice.",
});

const SECTIONS = [
  { id: "what-are-cookies",  label: "What Are Cookies" },
  { id: "how-we-use",        label: "How We Use Cookies" },
  { id: "types",             label: "Types of Cookies We Use" },
  { id: "third-party",       label: "Cookies and Storage in Use" },
  { id: "duration",          label: "Cookie Duration" },
  { id: "managing",          label: "Managing Your Cookies" },
  { id: "browser-controls",  label: "Browser Controls" },
  { id: "do-not-track",      label: "Do Not Track" },
  { id: "consent",           label: "Your Consent" },
  { id: "updates",           label: "Updates to This Policy" },
  { id: "contact",           label: "Contact Us" },
];

/* Status colours sit on their own tint at the 700 step, so every label clears AA. */
const TONES = {
  cobalt: "bg-cobalt-tint text-cobalt",
  emerald: "bg-success-container text-success",
  neutral: "bg-paper text-ink-muted",
} as const;

function CookieCard({ icon: Glyph, title, status, tone, children }: {
  icon: Icon; title: string; status: string; tone: keyof typeof TONES; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-line bg-white p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line text-ink">
          <Glyph size={17} />
        </span>
        <p className="text-[15.5px] font-semibold text-ink">{title}</p>
      </div>
      <div className="mt-3 type-body">{children}</div>
      <p className={cn("mt-4 self-start rounded-full px-2.5 py-0.5 type-caption font-medium", TONES[tone])}>{status}</p>
    </div>
  );
}

const TYPE_TONE: Record<string, keyof typeof TONES> = { Security: "cobalt", Functional: "emerald", Preference: "emerald" };

function TypeTag({ type }: { type: string }) {
  return <span className={cn("inline-block rounded-full px-2 py-0.5 type-caption font-medium", TONES[TYPE_TONE[type] ?? "neutral"])}>{type}</span>;
}

const COOKIE_TABLE = [
  { name: "oidc.user:*", provider: "Ocean Blue", purpose: "Keeps staff signed in to the admin console (staff only)", duration: "Until sign out", type: "Security" },
  { name: "cookieConsent, cookieConsentPrefs", provider: "Ocean Blue", purpose: "Stores your cookie choice so we do not ask again", duration: "Until cleared", type: "Functional" },
  { name: "ob.announcement.dismissed:*", provider: "Ocean Blue", purpose: "Remembers that you closed an announcement", duration: "Until cleared (session only without consent)", type: "Preference" },
];

export default function CookiesPage() {
  const { effective: EFFECTIVE, updated, history } = LEGAL_DOCS.cookies;

  return (
    <DocPage
      title="Cookie Policy"
      lede={<>This Cookie Policy explains how Ocean Blue Corporation (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) uses cookies and similar tracking technologies when you visit our website at{" "} <strong className="font-semibold text-ink">oceanbluecorp.com</strong>.</>}
      meta={[{ label: "Effective date", value: EFFECTIVE }, { label: "Last updated", value: updated }]}
      toc={SECTIONS}
      history={history}
      aside={
        <div className="rounded-xl border border-line bg-paper p-4">
          <p className="type-label font-semibold text-ink">Questions?</p>
          <p className="mt-1 type-body-sm text-ink-muted">
            Contact us at{" "}
            <a href="mailto:hr@oceanbluecorp.com" className="font-medium text-cobalt underline underline-offset-2">
              hr@oceanbluecorp.com
            </a>
          </p>
        </div>
      }
    >
              <DocSection id="what-are-cookies" number="01" title="What Are Cookies">
                <Callout title="At a Glance">
                  <p>This site stores only what it needs to work: your cookie choice, whether you closed an announcement, and, for staff, the sign-in session. It sets no analytics or advertising cookies. You can clear any of it in your browser at any time.</p>
                </Callout>
                <P>
                  Cookies are small text files placed on your device (computer, tablet, or smartphone) when you visit a website. They are widely used to make websites work, improve user experience, and provide reporting information to website owners.
                </P>
                <P>
                  Cookies set by the website owner (in this case, Ocean Blue Corporation) are called &ldquo;first-party cookies.&rdquo; Cookies set by parties other than the website owner are called &ldquo;third-party cookies.&rdquo; Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., advertising, interactive content, and analytics).
                </P>
                <P>
                  In addition to cookies, websites can use similar technologies such as local storage and session storage. Our website uses these for the purposes described below. We do not use analytics, advertising, or tracking technologies of any kind.
                </P>
              </DocSection>

              <DocSection id="how-we-use" number="02" title="How We Use Cookies">
                <P>We use cookies and similar technologies for the following purposes:</P>
                <UL items={[
                  "To ensure our website functions correctly and securely, including maintaining your login session",
                  "To remember your preferences and settings so you do not have to re-enter them on each visit",
                  "To comply with legal and regulatory obligations relating to record-keeping and security",
                  "To protect against fraudulent, unauthorized, or unlawful activity",
                  "To improve our website, services, and the overall user experience over time",
                ]} />
              </DocSection>

              <DocSection id="types" number="03" title="Types of Cookies We Use">
                <P>We categorize the cookies and storage on our website into two types:</P>
                <div className="grid gap-4 sm:grid-cols-2">
                  <CookieCard icon={IconShieldLock} title="Strictly Necessary" status="Always active" tone="cobalt">
                    <p>
                      Essential for the website to function. They keep staff signed in and remember your cookie choice. You cannot opt out of these without affecting how our website works.
                    </p>
                  </CookieCard>
                  <CookieCard icon={IconSettings} title="Preferences" status="Optional, requires consent" tone="emerald">
                    <p>
                      Remember choices you make across visits, such as closing an announcement. Without consent, these choices last only until you close the tab.
                    </p>
                  </CookieCard>
                </div>
              </DocSection>

              <DocSection id="third-party" number="04" title="Third-Party Cookies">
                <P>
                  We do not place third-party cookies. The following table lists everything our website stores on your device:
                </P>
                <DocTable
                  head={[
                    { label: "Cookie Name" },
                    { label: "Provider" },
                    { label: "Purpose", className: "hidden lg:table-cell" },
                    { label: "Duration" },
                    { label: "Type" },
                  ]}
                  rows={COOKIE_TABLE.map((row) => ({
                    key: row.name,
                    cells: [
                      { node: row.name, className: "font-mono text-[12.5px] text-ink" },
                      { node: row.provider },
                      { node: row.purpose, className: "hidden lg:table-cell" },
                      { node: row.duration, className: "whitespace-nowrap" },
                      { node: <TypeTag type={row.type} /> },
                    ],
                  }))}
                />
              </DocSection>

              <DocSection id="duration" number="05" title="Cookie Duration">
                <P>Cookies can remain on your device for different periods of time. We use two types based on duration:</P>
                <UL items={[
                  <><strong>Session cookies</strong>, These are temporary cookies that expire and are automatically deleted when you close your browser. They are used to carry information from one page to the next during a browsing session, such as maintaining your logged-in state.</>,
                  <><strong>Persistent cookies</strong>, These remain on your device for a specified period or until you delete them manually. They are used to remember your preferences and settings across multiple visits. The specific duration varies by cookie and is listed in the table in Section 04.</>,
                ]} />
              </DocSection>

              <DocSection id="managing" number="06" title="Managing Your Cookies">
                <P>
                  You have the right to decide whether to accept or reject non-essential cookies. When you first visit our website, you will be presented with a cookie consent banner that allows you to accept all, reject optional cookies, or choose by category.
                </P>
                <P>
                  You can update your cookie preferences at any time by clicking the &ldquo;Cookie Settings&rdquo; link in the footer of our website. Please note that withdrawing your consent will not affect the lawfulness of processing carried out before you withdrew consent.
                </P>
                <P>
                  Blocking strictly necessary cookies may impair the functionality of our website, including preventing you from logging in or accessing certain features.
                </P>
              </DocSection>

              <DocSection id="browser-controls" number="07" title="Browser Controls">
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
                <div className="flex flex-wrap gap-2">
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
                      className="plain inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line-strong bg-white px-4 py-2 type-body-sm font-medium text-ink transition-colors hover:border-cobalt"
                    >
                      {b.name}
                      <IconExternal size={13} className="text-ink-subtle" />
                    </a>
                  ))}
                </div>
              </DocSection>

              <DocSection id="do-not-track" number="08" title="Do Not Track">
                <P>
                  Some browsers offer a &ldquo;Do Not Track&rdquo; (DNT) feature that signals to websites that you prefer not to be tracked. Because there is no industry-standard interpretation of DNT signals, our website does not currently respond to DNT browser settings.
                </P>
                <P>
                  Our website does not track you, so there is nothing for a DNT signal to switch off.
                </P>
              </DocSection>

              <DocSection id="consent" number="09" title="Your Consent">
                <P>
                  Where required by applicable law (including the EU ePrivacy Directive and GDPR), we will obtain your consent before placing non-essential cookies on your device. Your consent is indicated by your affirmative action in our cookie consent banner.
                </P>
                <P>
                  For users in the United States, some states (including California under the CPRA) provide rights relating to the use of cookies for targeted advertising purposes. We do not use cookies for targeted advertising. Please see our{" "}
                  <Link href="/privacy#california">
                    Privacy Policy
                  </Link>{" "}
                  for details about your rights as a California resident.
                </P>
                <P>
                  By continuing to use our website after being presented with our cookie notice, you consent to our use of cookies as described in this policy.
                </P>
              </DocSection>

              <DocSection id="updates" number="10" title="Updates to This Policy">
                <P>
                  We may update this Cookie Policy from time to time to reflect changes in technology, law, or our business practices. We will post the revised policy on this page with an updated effective date. For significant changes, we may provide a more prominent notice, including by displaying a new cookie consent banner.
                </P>
                <P>
                  We encourage you to review this page periodically to stay informed about our use of cookies. Your continued use of our website after any changes to this policy constitutes your acceptance of the updated policy.
                </P>
              </DocSection>

              <DocSection id="contact" number="11" title="Contact Us">
                <P>
                  If you have any questions or concerns about our use of cookies or this Cookie Policy, please contact us:
                </P>
                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    href="mailto:hr@oceanbluecorp.com"
                    className="plain group flex items-center gap-3 rounded-xl border border-line bg-white p-4 transition-colors hover:border-ink"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line text-cobalt">
                      <IconMail size={18} />
                    </span>
                    <span>
                      <span className="block type-caption text-ink-subtle">Email</span>
                      <span className="block type-body font-medium text-ink">hr@oceanbluecorp.com</span>
                    </span>
                  </a>
                  <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line text-cobalt">
                      <IconPin size={18} />
                    </span>
                    <span>
                      <span className="block type-caption text-ink-subtle">Mailing Address</span>
                      <span className="block type-body font-medium text-ink">
                        9775 Fairway Drive, Suite C<br />
                        Powell, OH 43065
                      </span>
                    </span>
                  </div>
                </div>
                <P>
                  For general inquiries unrelated to privacy, please visit our{" "}
                  <Link href="/contact">
                    Contact page
                  </Link>.
                </P>
              </DocSection>

      <RelatedLinks links={[{ href: "/privacy", label: "Privacy Policy" }, { href: "/terms", label: "Terms of Service" }]} />
    </DocPage>
  );
}
