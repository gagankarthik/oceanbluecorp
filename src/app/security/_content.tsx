"use client";

import Image from "next/image";
import {
  Lock, Database, ShieldCheck, KeyRound, UserCog, Users, Fingerprint,
  UserMinus, Globe2, BugPlay, FileClock, type LucideIcon,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion/Primitives";
import { Cta } from "@/components/landing/ui";
import { AccentHeading } from "@/components/landing/bands";
import Photo from "@/components/landing/Photo";
import PageHero from "@/components/landing/PageHero";
import { IMG } from "@/components/landing/media";

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

const protections: { title: string; body: string; icon: LucideIcon }[] = [
  {
    icon: Lock,
    title: "Encrypted in transit",
    body: "Every connection to this site and its APIs is HTTPS. Strict-Transport-Security is set for two years with subdomains included and preload requested, so browsers refuse to fall back to an unencrypted connection.",
  },
  {
    icon: Database,
    title: "Encrypted at rest",
    body: "Application data is held in Amazon DynamoDB and Amazon S3, both of which encrypt stored data by default using AWS-managed keys.",
  },
  {
    icon: ShieldCheck,
    title: "Hardened responses",
    body: "The site sets X-Frame-Options, X-Content-Type-Options, Referrer-Policy and Permissions-Policy on every response, which closes off clickjacking, MIME sniffing, referrer leakage and unrequested access to camera, microphone, location and payment APIs.",
  },
  {
    icon: KeyRound,
    title: "No credentials in the browser",
    body: "AWS credentials and table names are read on the server only. The client bundle is checked to ensure the AWS SDK never ships to the browser.",
  },
];

const accessControls: { title: string; body: string; icon: LucideIcon }[] = [
  {
    icon: UserCog,
    title: "No public sign-up",
    body: "There is no self-service registration. Every account is created by an administrator who sets the person's role at the point of invitation.",
  },
  {
    icon: Users,
    title: "Four roles, least privilege",
    body: "Accounts are Admin, HR, Recruiter or Sales. A person authenticated but not placed in a staff group has no access at all rather than a default level of it.",
  },
  {
    icon: Fingerprint,
    title: "Managed authentication",
    body: "Sign-in runs through Amazon Cognito. Passwords are never stored by this application, and a new joiner must set their own password on first sign-in before they can reach anything.",
  },
  {
    icon: UserMinus,
    title: "Access ends with the engagement",
    body: "Accounts are removed by an administrator when someone leaves the company or rolls off an account.",
  },
];

const certifications = [
  { name: "NMSDC", logo: "/logos/certifications/NMSDC.png", w: 340, h: 340, cls: "h-[60px]" },
  { name: "Ohio WBE", logo: "/logos/certifications/wbe.png", w: 845, h: 202, cls: "h-[40px]" },
  { name: "Ohio MBE", logo: "/logos/certifications/ohiombe.png", w: 734, h: 202, cls: "h-[40px]" },
  { name: "City of Columbus MBE", logo: "/logos/certifications/mbe.png", w: 707, h: 353, cls: "h-[50px]" },
];

export default function SecurityPage() {
  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      <PageHero
        eyebrow="Security"
        title="How we handle your data, stated plainly."
        subtitle="What we encrypt, who can reach client information, where it is stored, and how to tell us if you find a problem."
        image={IMG.serviceSolutions}
      />

      {/* Opening position. Leads with the limits rather than burying them. */}
      <section className="w-full px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <Reveal className="w-full">
          <AccentHeading>Our position</AccentHeading>
          <div className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-2 lg:gap-16">
            <p className="text-[17px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[19px]">
              We place engineers inside client systems and we run managed
              services on client infrastructure, so the honest answer to most
              security questions is that your controls govern your estate and
              ours govern ours. This page covers ours.
            </p>
            <p className="text-[16px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[17px]">
              Where we hold a certification we say so. Where we do not, we say
              that too, further down this page. A security page that only lists
              strengths is not useful to anyone evaluating a supplier, and the
              gaps are the part you would find in diligence anyway.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Protection */}
      <section className="w-full border-t border-[var(--hz-line)] px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <Reveal className="max-w-2xl">
          <h2 className="hz-display hz-h2 text-[var(--hz-text)]">How data is protected.</h2>
        </Reveal>
        <Stagger as="ul" className="mt-10 grid gap-10 sm:mt-12 sm:grid-cols-2 lg:gap-12" gap={0.07}>
          {protections.map((p) => (
            <StaggerItem as="li" key={p.title}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
                <p.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="hz-display mt-5 text-[1.2rem] leading-tight text-[var(--hz-text)]">{p.title}</h3>
              <p className="mt-3 max-w-[52ch] text-[14.5px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[15px]">
                {p.body}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Access */}
      <section className="w-full border-t border-[var(--hz-line)] px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <Reveal className="max-w-2xl">
          <h2 className="hz-display hz-h2 text-[var(--hz-text)]">Who can reach client data.</h2>
        </Reveal>
        <Stagger as="ul" className="mt-10 divide-y divide-[var(--hz-line)] border-t border-[var(--hz-line)] sm:mt-12" gap={0.06}>
          {accessControls.map((a) => (
            <StaggerItem as="li" key={a.title}>
              <div className="grid gap-3 py-6 lg:grid-cols-12 lg:gap-10">
                <div className="flex items-center gap-3.5 lg:col-span-4">
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-[var(--hz-surface-2)] text-[var(--hz-cobalt)]">
                    <a.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </span>
                  <h3 className="hz-display text-[1.1rem] leading-tight text-[var(--hz-text)]">
                    {a.title}
                  </h3>
                </div>
                <p className="max-w-[62ch] text-[14.5px] leading-relaxed text-[var(--hz-text-mute)] lg:col-span-8 sm:text-[15px]">
                  {a.body}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Residency. The section most suppliers soften; stated directly here. */}
      <section className="w-full border-t border-[var(--hz-line)] px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
              <Globe2 className="h-6 w-6" strokeWidth={1.5} />
            </span>
            <h2 className="hz-display hz-h2 mt-6 max-w-[16ch] text-[var(--hz-text)]">
              Where data lives, and who reaches it.
            </h2>
          </Reveal>
          <Reveal delay={0.06} className="lg:col-span-6 lg:col-start-7">
            <p className="text-[16px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[17px]">
              Application data is stored and processed in Amazon Web Services in
              the <strong className="font-semibold text-[var(--hz-text)]">US East (Ohio) region</strong>, us-east-2.
            </p>
            <p className="mt-5 text-[16px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[17px]">
              We operate delivery centres in India and the United Kingdom, and
              named personnel in those locations can access client data where
              their role on an engagement requires it. Access follows the same
              role model as everyone else, and the scope of it is agreed in the
              Master Service Agreement before work starts.
            </p>
            <p className="mt-5 text-[16px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[17px]">
              If your programme requires US-only personnel or data handling, say
              so during scoping. It is a constraint we can staff to, but it has
              to be agreed up front rather than assumed.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Certifications, correctly labelled. */}
      <section className="w-full border-t border-[var(--hz-line)] px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <h2 className="hz-display hz-h2 max-w-[16ch] text-[var(--hz-text)]">
              Certifications we hold.
            </h2>
            <p className="mt-6 max-w-[46ch] text-[16px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[17px]">
              These are supplier-diversity certifications. They speak to
              ownership and procurement eligibility, not to information
              security, and we do not present them as security credentials.
            </p>
          </Reveal>

          <div className="lg:col-span-6 lg:col-start-7">
            <ul className="grid grid-cols-2 items-center gap-x-10 gap-y-10 sm:grid-cols-4">
              {certifications.map((c) => (
                <li key={c.name} className="flex items-center justify-center">
                  <Image
                    src={c.logo}
                    alt={c.name}
                    width={c.w}
                    height={c.h}
                    className={`${c.cls} w-auto max-w-full object-contain`}
                  />
                </li>
              ))}
            </ul>

            {/* The absences, stated rather than omitted. */}
            <div className="mt-12 border-t border-[var(--hz-line)] pt-8">
              <p className="hz-eyebrow text-[var(--hz-text-subtle)]">What we do not hold</p>
              <p className="mt-5 max-w-[58ch] text-[15px] leading-relaxed text-[var(--hz-text-mute)]">
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

      {/* Disclosure + incident history */}
      <section className="w-full border-t border-[var(--hz-line)] px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <Reveal>
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]">
                <BugPlay className="h-6 w-6" strokeWidth={1.5} />
              </span>
              <h2 className="hz-display hz-h2 mt-6 max-w-[16ch] text-[var(--hz-text)]">
                Reporting a vulnerability.
              </h2>
              <p className="mt-6 max-w-[52ch] text-[16px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[17px]">
                If you have found a security problem in this site or any Ocean
                Blue system, email{" "}
                <a
                  href="mailto:hr@oceanbluecorp.com?subject=Security%20report"
                  className="hz-focus font-semibold text-[var(--hz-cobalt)] underline-offset-4 hover:underline"
                >
                  hr@oceanbluecorp.com
                </a>{" "}
                with &ldquo;Security report&rdquo; in the subject line.
              </p>
              <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-[var(--hz-text-mute)]">
                Include what you found, where, and the steps to reproduce it. We
                will confirm receipt and keep you updated as we work through it.
                We ask that you give us a reasonable window to fix the issue
                before publishing it, and that you avoid accessing or altering
                data that is not your own while testing.
              </p>
              <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-[var(--hz-text-subtle)]">
                We do not run a paid bug bounty. We will credit you if you would
                like to be named.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-5 lg:col-start-8">
            <Reveal delay={0.06}>
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--hz-surface-2)] text-[var(--hz-cobalt)]">
                <FileClock className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h2 className="hz-display mt-5 text-[1.5rem] leading-tight text-[var(--hz-text)]">
                Incident history
              </h2>
              <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-[var(--hz-text-mute)]">
                We have not disclosed a security incident affecting client or
                candidate data. If that changes, the incident and its resolution
                will be recorded here with dates.
              </p>
              <p className="mt-6 max-w-[46ch] text-[14px] leading-relaxed text-[var(--hz-text-subtle)]">
                For live availability of the AWS services this product runs on,
                see the{" "}
                <a href="/status" className="hz-focus font-semibold text-[var(--hz-cobalt)] underline-offset-4 hover:underline">
                  status page
                </a>
                .
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="relative isolate w-full overflow-hidden">
        <div className="relative min-h-[380px] w-full sm:min-h-[440px]">
          <Photo src={IMG.cta} alt="An Ocean Blue security review" sizes="100vw" priority={false} />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,23,48,0.62) 0%, rgba(10,23,48,0.82) 60%, rgba(10,23,48,0.94) 100%)",
            }}
          />
          <div className="relative z-10 flex min-h-[380px] items-center px-6 py-16 sm:min-h-[440px] sm:px-10 lg:px-16 2xl:px-24">
            <Reveal className="max-w-2xl">
              <h2 className="hz-display max-w-[20ch] text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.05] text-white">
                Send us your security questionnaire.
              </h2>
              <p className="mt-6 max-w-[46ch] text-[16px] leading-relaxed text-white/80 sm:text-[17px]">
                We would rather answer it early and tell you where we fall short
                than discover the mismatch after a contract is drafted.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Cta href="/contact" variant="primary">Start a conversation</Cta>
                <Cta href="/privacy" variant="ghostDark">Read the privacy policy</Cta>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
