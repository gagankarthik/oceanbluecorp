import Image from "next/image";
import PageHero from "@/components/landing/PageHero";
import { IMG } from "@/components/landing/media";
import { CONTAINER, ClosingCta, SECTION_Y } from "@/components/site/sections";
import {
  IconLock, IconServer, IconShieldLock, IconKey, IconSettings, IconTeam, IconUser, IconLogout, IconClock, type Icon, type IconProps,
} from "@/components/site/icons";

/* ── A note on what this page may say ──────────────────────────────────────
   Every claim below is either verifiable in this repository (the response
   headers in next.config.ts, the Cognito invite-only auth model, the role
   hierarchy in lib/auth/config.ts, the us-east-2 region in the AWS config) or
   is a documented property of the AWS service being used.

   Three things are stated as absences on purpose, because a procurement
   reviewer will find them anyway and finding them here is far better than
   finding them after a claim has been made:

     · Ocean Blue holds no SOC 2 or ISO 27001 certification.
     · No third-party penetration test has been carried out.
     · Delivery staff outside the United States can access client data.

   Do not add a certification, an audit, or a response-time commitment to this
   page until it is a fact someone can be held to. ─────────────────────────── */

function Glyph({ children, ...p }: IconProps & { children: React.ReactNode }) {
  const { size = 16, ...rest } = p;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

/** Residency: a globe with its meridian. */
const IconGlobe = (p: IconProps) => (
  <Glyph {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5s1.2-6.1 3.5-8.5Z" />
  </Glyph>
);

/** Vulnerability reporting: a bug. */
const IconBug = (p: IconProps) => (
  <Glyph {...p}>
    <rect x="8" y="8" width="8" height="11" rx="4" />
    <path d="M9.5 8a2.5 2.5 0 0 1 5 0M12 11v8M8 12.5H4.5M19.5 12.5H16M8.5 16.5 5.5 18.5M15.5 16.5l3 2M8.5 9.5 5.5 7.5M15.5 9.5l3-2" />
  </Glyph>
);

const protections: { title: string; body: string; icon: Icon }[] = [
  {
    icon: IconLock,
    title: "Encrypted in transit",
    body: "Every connection to this site and its APIs is HTTPS. Strict-Transport-Security is set for two years with subdomains included and preload requested, so browsers refuse to fall back to an unencrypted connection.",
  },
  {
    icon: IconServer,
    title: "Encrypted at rest",
    body: "Application data is held in Amazon DynamoDB and Amazon S3, both of which encrypt stored data by default using AWS-managed keys.",
  },
  {
    icon: IconShieldLock,
    title: "Hardened responses",
    body: "The site sets X-Frame-Options, X-Content-Type-Options, Referrer-Policy and Permissions-Policy on every response, which closes off clickjacking, MIME sniffing, referrer leakage and unrequested access to camera, microphone, location and payment APIs.",
  },
  {
    icon: IconKey,
    title: "No credentials in the browser",
    body: "AWS credentials and table names are read on the server only. The client bundle is checked to ensure the AWS SDK never ships to the browser.",
  },
];

const accessControls: { title: string; body: string; icon: Icon }[] = [
  {
    icon: IconSettings,
    title: "No public sign-up",
    body: "There is no self-service registration. Every account is created by an administrator who sets the person's role at the point of invitation.",
  },
  {
    icon: IconTeam,
    title: "Four roles, least privilege",
    body: "Accounts are Admin, HR, Recruiter or Sales. A person authenticated but not placed in a staff group has no access at all rather than a default level of it.",
  },
  {
    icon: IconUser,
    title: "Managed authentication",
    body: "Sign-in runs through Amazon Cognito. Passwords are never stored by this application, and a new joiner must set their own password on first sign-in before they can reach anything.",
  },
  {
    icon: IconLogout,
    title: "Access ends with the engagement",
    body: "Accounts are removed by an administrator when someone leaves the company or rolls off an account.",
  },
];

const certifications = [
  { name: "NMSDC", logo: "/logos/certifications/NMSDC.png", w: 340, h: 340, cls: "h-[56px]" },
  { name: "Ohio WBE", logo: "/logos/certifications/wbe.png", w: 845, h: 202, cls: "h-[36px]" },
  { name: "Ohio MBE", logo: "/logos/certifications/ohiombe.png", w: 734, h: 202, cls: "h-[36px]" },
  { name: "City of Columbus MBE", logo: "/logos/certifications/mbe.png", w: 707, h: 353, cls: "h-[46px]" },
];

const H2 = "type-headline font-semibold text-ink";

export default function SecurityPage() {
  return (
    <>
      <PageHero
        eyebrow="Security"
        title="How we handle your data, stated plainly."
        subtitle="What we encrypt, who can reach client information, where it is stored, and how to tell us if you find a problem."
        image={IMG.serviceSolutions}
      />

      {/* Opening position. Leads with the limits rather than burying them. */}
      <section data-tone="white" className={`bg-white ${SECTION_Y}`}>
        <div className={`${CONTAINER} reveal grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16`}>
          <h2 className={H2}>Our position</h2>
          <div className="grid gap-6 md:grid-cols-2 md:gap-10">
            <p className="type-body-lg text-ink">
              We place engineers inside client systems and we run managed
              services on client infrastructure, so the honest answer to most
              security questions is that your controls govern your estate and
              ours govern ours. This page covers ours.
            </p>
            <p className="type-body text-ink-muted">
              Where we hold a certification we say so. Where we do not, we say
              that too, further down this page. A security page that only lists
              strengths is not useful to anyone evaluating a supplier, and the
              gaps are the part you would find in diligence anyway.
            </p>
          </div>
        </div>
      </section>

      {/* Protection: four controls in a hairline grid. */}
      <section data-tone="paper" className={`bg-paper ${SECTION_Y}`}>
        <div className={CONTAINER}>
          <h2 className={`reveal ${H2}`}>How data is protected.</h2>
          <ul className="reveal mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:mt-12 md:grid-cols-2">
            {protections.map((p) => (
              <li key={p.title} className="bg-white p-7 sm:p-9">
                <span className="flex size-11 items-center justify-center rounded-xl border border-line text-cobalt">
                  <p.icon size={20} />
                </span>
                <h3 className="mt-5 type-title-lg font-semibold text-ink">{p.title}</h3>
                <p className="mt-2 max-w-[54ch] type-body text-ink-muted">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Access: the heading holds its column while the rows scroll past. */}
      <section data-tone="white" className={`bg-white ${SECTION_Y}`}>
        <div className={`${CONTAINER} grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16`}>
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className={`reveal ${H2}`}>Who can reach client data.</h2>
          </div>
          <ul className="reveal divide-y divide-line border-y border-line">
            {accessControls.map((a) => (
              <li key={a.title} className="grid gap-3 py-7 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:gap-8">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line text-cobalt">
                    <a.icon size={18} />
                  </span>
                  <h3 className="type-title font-semibold text-ink">{a.title}</h3>
                </div>
                <p className="type-body text-ink-muted">{a.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Residency. The section most suppliers soften; stated directly here. */}
      <section data-tone="paper" className={`bg-paper ${SECTION_Y}`}>
        <div className={`${CONTAINER} reveal grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16`}>
          <div>
            <span className="flex size-12 items-center justify-center rounded-xl border border-line bg-white text-cobalt">
              <IconGlobe size={22} />
            </span>
            <h2 className={`mt-6 max-w-[16ch] ${H2}`}>Where data lives, and who reaches it.</h2>
          </div>
          <div className="space-y-5 type-body text-ink-muted">
            <p>
              Application data is stored and processed in Amazon Web Services in
              the <strong className="font-semibold text-ink">US East (Ohio) region</strong>, us-east-2.
            </p>
            <p>
              We operate delivery centres in India and the United Kingdom, and
              named personnel in those locations can access client data where
              their role on an engagement requires it. Access follows the same
              role model as everyone else, and the scope of it is agreed in the
              Master Service Agreement before work starts.
            </p>
            <p>
              If your programme requires US-only personnel or data handling, say
              so during scoping. It is a constraint we can staff to, but it has
              to be agreed up front rather than assumed.
            </p>
          </div>
        </div>
      </section>

      {/* Certifications, correctly labelled, with the absences beside them. */}
      <section data-tone="white" className={`bg-white ${SECTION_Y}`}>
        <div className={`${CONTAINER} reveal grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16`}>
          <div>
            <h2 className={`max-w-[16ch] ${H2}`}>Certifications we hold.</h2>
            <p className="mt-6 max-w-[46ch] type-body text-ink-muted">
              These are supplier-diversity certifications. They speak to
              ownership and procurement eligibility, not to information
              security, and we do not present them as security credentials.
            </p>
          </div>
          <div>
            <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
              {certifications.map((c) => (
                <li key={c.name} className="flex h-28 items-center justify-center bg-white px-4">
                  <Image src={c.logo} alt={c.name} width={c.w} height={c.h} className={`${c.cls} w-auto max-w-full object-contain`} />
                </li>
              ))}
            </ul>

            {/* The absences, stated rather than omitted. */}
            <div className="mt-8 rounded-r-xl border-l-2 border-cobalt bg-paper px-6 py-5">
              <p className="text-[15px] font-semibold text-ink">What we do not hold</p>
              <p className="mt-2 max-w-[58ch] type-body text-ink-muted">
                Ocean Blue is not SOC 2 audited and does not hold ISO 27001. We
                have not commissioned a third-party penetration test. If your
                procurement process requires either, tell us early and we will
                tell you honestly whether we can meet the timeline rather than
                let it surface late in the process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclosure + incident history: the action wide, the record narrow. */}
      <section data-tone="paper" className={`bg-paper ${SECTION_Y}`}>
        <div className={`${CONTAINER} reveal grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]`}>
          <div className="rounded-2xl border border-line bg-white p-7 sm:p-10">
            <span className="flex size-12 items-center justify-center rounded-xl border border-line text-cobalt">
              <IconBug size={22} />
            </span>
            <h2 className={`mt-6 max-w-[16ch] ${H2}`}>Reporting a vulnerability.</h2>
            <p className="mt-6 max-w-[52ch] type-body text-ink-muted">
              If you have found a security problem in this site or any Ocean
              Blue system, email{" "}
              <a href="mailto:hr@oceanbluecorp.com?subject=Security%20report" className="font-semibold text-cobalt underline underline-offset-4">
                hr@oceanbluecorp.com
              </a>{" "}
              with &ldquo;Security report&rdquo; in the subject line.
            </p>
            <p className="mt-5 max-w-[52ch] type-body text-ink-muted">
              Include what you found, where, and the steps to reproduce it. We
              will confirm receipt and keep you updated as we work through it.
              We ask that you give us a reasonable window to fix the issue
              before publishing it, and that you avoid accessing or altering
              data that is not your own while testing.
            </p>
            <p className="mt-5 max-w-[52ch] type-body text-ink-subtle">
              We do not run a paid bug bounty. We will credit you if you would
              like to be named.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-7 sm:p-10">
            <span className="flex size-10 items-center justify-center rounded-lg border border-line text-cobalt">
              <IconClock size={20} />
            </span>
            <h2 className="mt-5 type-title-lg font-semibold text-ink">Incident history</h2>
            <p className="mt-4 max-w-[46ch] type-body text-ink-muted">
              We have not disclosed a security incident affecting client or
              candidate data. If that changes, the incident and its resolution
              will be recorded here with dates.
            </p>
            <p className="mt-6 max-w-[46ch] border-t border-line pt-6 type-body-sm text-ink-subtle">
              For live availability of the AWS services this product runs on,
              see the{" "}
              <a href="/status" className="font-semibold text-cobalt underline underline-offset-4">
                status page
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <ClosingCta
        title="Send us your security questionnaire."
        sub="We would rather answer it early and tell you where we fall short than discover the mismatch after a contract is drafted."
        primary={{ href: "/contact", label: "Talk to us" }}
        secondary={{ href: "/privacy", label: "Read the privacy policy" }}
      />
    </>
  );
}
