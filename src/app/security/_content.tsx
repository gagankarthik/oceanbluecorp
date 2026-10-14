import Image from "next/image";
import FaqList from "@/components/site/FaqList";
import { faqsFor } from "@/lib/faqs";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Closing from "@/components/site/Closing";
import { company } from "@/lib/site-content";

/* What this page may say: every claim is verifiable in this repo (headers in
   next.config.ts, invite-only Cognito auth, roles in lib/auth/config.ts, the
   us-east-2 region) or is a documented property of the AWS service used.
   Three absences are stated on purpose: no SOC 2 or ISO 27001, no third-party
   penetration test, and delivery staff outside the US can reach client data.
   Add no certification, audit or response-time commitment until it is a fact. */

const protections = [
  {
    title: "Encrypted in transit",
    body: "Every connection to this site and its APIs is HTTPS. Strict-Transport-Security is set for two years with subdomains included and preload requested, so browsers refuse to fall back to an unencrypted connection.",
  },
  {
    title: "Encrypted at rest",
    body: "Application data is held in Amazon DynamoDB and Amazon S3, both of which encrypt stored data by default using AWS-managed keys.",
  },
  {
    title: "Hardened responses",
    body: "The site sets X-Frame-Options, X-Content-Type-Options, Referrer-Policy and Permissions-Policy on every response, which closes off clickjacking, MIME sniffing, referrer leakage and unrequested access to camera, microphone, location and payment APIs.",
  },
  {
    title: "No credentials in the browser",
    body: "AWS credentials and table names are read on the server only. The client bundle is checked to ensure the AWS SDK never ships to the browser.",
  },
];

const accessControls = [
  {
    title: "No public sign-up",
    body: "There is no self-service registration. Every account is created by an administrator who sets the person's role at the point of invitation.",
  },
  {
    title: "Five roles, least privilege",
    body: "Accounts are Admin, HR, Recruiter, Sales or Media, and each role reaches only what its work needs. A person authenticated but not placed in a staff group has no access at all rather than a default level of it.",
  },
  {
    title: "Managed authentication",
    body: "Sign-in runs through Amazon Cognito. Passwords are never stored by this application, and a new joiner must set their own password on first sign-in before they can reach anything.",
  },
  {
    title: "Access ends with the engagement",
    body: "Accounts are removed by an administrator when someone leaves the company or rolls off an account.",
  },
];

const certifications = [
  { name: "NMSDC", logo: "/logos/certifications/NMSDC.png", w: 340, h: 340, cls: "h-[56px]" },
  { name: "Ohio WBE", logo: "/logos/certifications/wbe.png", w: 845, h: 202, cls: "h-9" },
  { name: "Ohio MBE", logo: "/logos/certifications/ohiombe.png", w: 734, h: 202, cls: "h-9" },
  { name: "City of Columbus MBE", logo: "/logos/certifications/mbe.png", w: 707, h: 353, cls: "h-12" },
];

const jumps = [
  ["#protection", "How data is protected"],
  ["#access", "Who can reach client data"],
  ["#residency", "Where data lives"],
  ["#certifications", "Certifications"],
  ["#report", "Reporting a vulnerability"],
];

const H2 = "display text-head";
const delay = (d: number) => ({ "--d": d }) as React.CSSProperties;

export default function SecurityPage() {
  const reportHref = `mailto:${company.email}?subject=Security%20report`;
  return (
    <>
      <PageHero
        cells={[{ photo: "keyboard" }, { tone: "bg-navy-900" }, { photo: "console" }, { tone: "bg-tide-200" }, { photo: "lattice" }]}
        lines={["How we handle", "your data."]}
        standfirst="What we encrypt, who can reach client information, where it is stored, and how to tell us if you find a problem."
        side={
          <ul className="grid gap-1">
            {jumps.map(([href, label]) => (
              <li key={href}>
                <a href={href} className="text-navy-900 underline decoration-navy-900/30 underline-offset-4 hover:decoration-navy-900">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        }
      />

      {/* Leads with the limits rather than burying them */}
      <section aria-labelledby="position" className="bg-field-paper">
        <div className="gutter grid gap-8 pb-20 md:pb-24 lg:grid-cols-12">
          <h2 id="position" className={`side ${H2}`} data-reveal>
            Our position
          </h2>
          <div className="axis grid gap-6 md:grid-cols-2 md:gap-10" data-reveal>
            <p className="text-lead leading-snug">
              We place engineers inside client systems and we run managed services on client infrastructure, so the honest answer to most security
              questions is that your controls govern your estate and ours govern ours. This page covers ours.
            </p>
            <p className="leading-normal text-mist-600">
              Where we hold a certification we say so. Where we do not, we say that too, further down this page. A security page that only lists
              strengths is not useful to anyone evaluating a supplier, and the gaps are the part you would find in diligence anyway.
            </p>
          </div>
        </div>
      </section>

      <section id="protection" aria-labelledby="protection-h" className="scroll-mt-24 bg-field-mist">
        <div className="gutter py-20 md:py-24">
          <h2 id="protection-h" className={H2} data-reveal>
            How data is protected
          </h2>
          <ul className="mt-10 grid gap-2 md:grid-cols-2">
            {protections.map((p, i) => (
              <li key={p.title} className="bg-mist-0 p-7 md:p-9" data-reveal style={delay(i % 2)}>
                <p className="font-mono text-small text-ocean-700">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 text-title font-semibold">{p.title}</h3>
                <p className="mt-2 max-w-measure-narrow leading-normal text-mist-600">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="access" aria-labelledby="access-h" className="scroll-mt-24 bg-field-paper">
        <div className="gutter grid gap-10 py-20 md:py-24 lg:grid-cols-12">
          <div className="side">
            <h2 id="access-h" className={`lg:sticky lg:top-28 ${H2}`} data-reveal>
              Who can reach client data
            </h2>
          </div>
          <ul className="axis divide-y divide-mist-200 border-y border-mist-200">
            {accessControls.map((a) => (
              <li key={a.title} className="grid gap-2 py-7 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:gap-8" data-reveal>
                <h3 className="text-title font-semibold leading-snug">{a.title}</h3>
                <p className="leading-normal text-mist-600">{a.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="residency" aria-labelledby="residency-h" className="on-dark scroll-mt-24 bg-navy-900 text-mist-50">
        <div className="gutter grid gap-10 py-20 md:py-24 lg:grid-cols-12">
          <h2 id="residency-h" className={`side ${H2}`} data-reveal>
            Where data lives, and who reaches it
          </h2>
          <div className="axis grid max-w-measure gap-5 leading-normal text-tide-300" data-reveal>
            <p>
              Application data is stored and processed in Amazon Web Services in the{" "}
              <strong className="font-semibold text-white">US East (Ohio) region</strong>, us-east-2.
            </p>
            <p>
              We operate delivery centres in India and the United Kingdom, and named personnel in those locations can access client data where their
              role on an engagement requires it. Access follows the same role model as everyone else, and the scope of it is agreed in the Master
              Service Agreement before work starts.
            </p>
            <p>
              If your programme requires US-only personnel or data handling, say so during scoping. It is a constraint we can staff to, but it has to
              be agreed up front rather than assumed.
            </p>
          </div>
        </div>
      </section>

      <section id="certifications" aria-labelledby="certs-h" className="scroll-mt-24 bg-field-paper">
        <div className="gutter grid gap-10 py-20 md:py-24 lg:grid-cols-12">
          <div className="side" data-reveal>
            <h2 id="certs-h" className={H2}>
              Certifications we hold
            </h2>
            <p className="mt-4 max-w-measure-narrow text-mist-600">
              These are supplier-diversity certifications. They speak to ownership and procurement eligibility, not to information security, and we
              do not present them as security credentials.
            </p>
            <Link href="/certifications" className="mt-5 inline-block font-medium text-ocean-700 underline underline-offset-4">
              About our certifications
            </Link>
          </div>
          <div className="axis" data-reveal>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {certifications.map((c) => (
                <li key={c.name} className="flex h-28 items-center justify-center bg-mist-0 px-4">
                  <Image src={c.logo} alt={c.name} width={c.w} height={c.h} className={`${c.cls} w-auto max-w-full object-contain`} />
                </li>
              ))}
            </ul>

            {/* The absences, stated rather than omitted */}
            <div className="mt-8 border-l-2 border-ocean-600 bg-mist-100 px-6 py-5">
              <p className="font-semibold">What we do not hold</p>
              <p className="mt-2 max-w-measure leading-normal text-mist-700">
                Oceanblue is not SOC 2 audited and does not hold ISO 27001. We have not commissioned a third-party penetration test. If your
                procurement process requires either, tell us early and we will tell you honestly whether we can meet the timeline rather than let it
                surface late in the process.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="report" aria-labelledby="report-h" className="scroll-mt-24 bg-field-mist">
        <div className="gutter grid gap-2 py-20 md:py-24 lg:grid-cols-12">
          <div className="bg-mist-0 p-7 sm:p-10 lg:col-span-7" data-reveal>
            <h2 id="report-h" className={H2}>
              Reporting a vulnerability
            </h2>
            <p className="mt-6 max-w-measure leading-normal">
              If you have found a security problem in this site or any Oceanblue system, email{" "}
              <a href={reportHref} className="text-ocean-700 underline underline-offset-4">
                {company.email}
              </a>{" "}
              with &ldquo;Security report&rdquo; in the subject line.
            </p>
            <p className="mt-5 max-w-measure leading-normal">
              Include what you found, where, and the steps to reproduce it. We will confirm receipt and keep you updated as we work through it. We
              ask that you give us a reasonable window to fix the issue before publishing it, and that you avoid accessing or altering data that is
              not your own while testing.
            </p>
            <p className="mt-5 max-w-measure text-mist-600">We do not run a paid bug bounty. We will credit you if you would like to be named.</p>
            <a
              href={reportHref}
              className="mt-8 inline-flex min-h-12 items-center bg-ocean-600 px-6 font-medium text-white btn-fill btn-fill-ocean active:scale-[0.98]"
            >
              Send a security report
            </a>
          </div>

          <div className="bg-mist-0 p-7 sm:p-10 lg:col-span-5" data-reveal style={delay(1)}>
            <h2 className="text-head-sm font-semibold">Incident history</h2>
            <p className="mt-4 max-w-measure-narrow leading-normal text-mist-600">
              We have not disclosed a security incident affecting client or candidate data. If that changes, the incident and its resolution will be
              recorded here with dates.
            </p>
            <p className="mt-6 max-w-measure-narrow border-t border-mist-200 pt-6 text-small text-mist-600">
              For live availability of the AWS services this product runs on, see the{" "}
              <Link href="/status" className="text-ocean-700 underline underline-offset-4">
                status page
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <FaqList title="Security questions" items={faqsFor("Security and data")} here="/security" />

      <Closing
        lines={["Send us your", "security questionnaire"]}
        sentence="We would rather answer it early and tell you where we fall short than discover the mismatch after a contract is drafted."
        action="Talk to us"
      />
    </>
  );
}
