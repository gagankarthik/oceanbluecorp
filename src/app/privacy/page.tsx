import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Ocean Blue Corporation",
  description: "Learn how Ocean Blue Corporation collects, uses, and protects your personal information.",
};

const SECTIONS = [
  { id: "introduction",   label: "Introduction" },
  { id: "information",    label: "Information We Collect" },
  { id: "usage",          label: "How We Use Your Information" },
  { id: "legal-basis",    label: "Legal Basis for Processing" },
  { id: "sharing",        label: "Sharing Your Information" },
  { id: "retention",      label: "Data Retention" },
  { id: "rights",         label: "Your Rights" },
  { id: "cookies",        label: "Cookies & Tracking" },
  { id: "security",       label: "Data Security" },
  { id: "international",  label: "International Transfers" },
  { id: "children",       label: "Children's Privacy" },
  { id: "california",     label: "California Residents (CCPA)" },
  { id: "updates",        label: "Updates to This Policy" },
  { id: "contact",        label: "Contact Us" },
];

function Section({ id, number, title, children }: {
  id: string; number: string; title: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 border-b border-gray-100 py-8 last:border-0">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="rounded-md bg-violet-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-violet-500">
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
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function InfoBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-5">
      <p className="mb-2 text-sm font-semibold text-violet-700" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </p>
      <div className="text-sm text-violet-800/80 space-y-1">{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  const EFFECTIVE = "April 1, 2026";

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div
        className="border-b border-gray-100"
        style={{
          background: [
            "radial-gradient(ellipse 70% 55% at 90% 15%, rgba(124,58,237,0.07) 0%, transparent 60%)",
            "radial-gradient(ellipse 55% 45% at 10% 80%, rgba(6,182,212,0.05) 0%, transparent 60%)",
            "#FAFBFF",
          ].join(", "),
        }}
      >
        <div className="mx-auto max-w-5xl px-6 pt-24 pb-12 md:pt-28 lg:px-8">
          <Link
            href="/"
            className="group mb-8 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Home
          </Link>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-600">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            Legal
          </div>

          <h1
            className="mt-3 text-[1.9rem] font-extrabold leading-[1.06] tracking-tight text-gray-900 sm:text-[2.6rem] md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Privacy Policy
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-500">
            Ocean Blue Corporation is committed to protecting your privacy. This policy explains what
            personal information we collect, how we use it, and what rights you have over your data.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-gray-400">
            <span><strong className="text-gray-600">Effective:</strong> {EFFECTIVE}</span>
            <span><strong className="text-gray-600">Controller:</strong> Ocean Blue Corporation, Powell, OH</span>
          </div>

          {/* Jump links */}
          <div className="mt-8 flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 py-4 lg:px-8">
        <div className="flex gap-12">

          {/* Sticky TOC */}
          <aside className="hidden w-56 flex-shrink-0 xl:block">
            <div className="sticky top-8 pt-8">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                Contents
              </p>
              <nav className="space-y-1">
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block rounded-lg px-3 py-1.5 text-[13px] text-gray-500 transition-colors hover:bg-gray-50 hover:text-violet-700"
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <div className="min-w-0 flex-1 pt-8">

            <Section id="introduction" number="01" title="Introduction">
              <P>
                Ocean Blue Corporation (&quot;Ocean Blue,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website
                at oceanbluecorp.com and provides enterprise IT solutions and staffing services. This
                Privacy Policy describes how we collect, use, disclose, and safeguard personal information
                when you visit our website, use our platform, or engage with our services.
              </P>
              <P>
                We take your privacy seriously. Please read this policy carefully. If you disagree with
                its terms, please discontinue use of our Site and services. By using our Site or services,
                you acknowledge that you have read and understood this Privacy Policy.
              </P>
              <InfoBox title="At a Glance">
                <p>We collect your information to match candidates with job opportunities, deliver enterprise services to clients, and improve our platform. We do not sell your personal data. You have rights to access, correct, and delete your information.</p>
              </InfoBox>
            </Section>

            <Section id="information" number="02" title="Information We Collect">
              <P>
                We collect information in several ways depending on how you interact with us:
              </P>

              <p className="font-semibold text-gray-800 mt-2">2.1 Information You Provide Directly</p>
              <UL items={[
                "Account registration data: name, email address, password, phone number",
                "Profile and resume information: work history, education, skills, certifications, portfolio links",
                "Job applications: cover letters, availability, salary expectations, visa/work authorization status",
                "Contact form submissions: name, company, message, service interests",
                "Client account data: company name, billing address, tax identification, authorized contacts",
                "Communications: emails, chat transcripts, and notes from calls with our team",
              ]} />

              <p className="font-semibold text-gray-800 mt-4">2.2 Information Collected Automatically</p>
              <UL items={[
                "Device information: IP address, browser type and version, operating system, device identifiers",
                "Usage data: pages visited, links clicked, time spent, referring URLs, search queries",
                "Log data: server logs that may include IP addresses, dates/times, browser type, and requested pages",
                "Location data: approximate geographic location derived from IP address",
                "Cookies and tracking technologies: as described in Section 8",
              ]} />

              <p className="font-semibold text-gray-800 mt-4">2.3 Information from Third Parties</p>
              <UL items={[
                "Professional networks (e.g., LinkedIn) if you connect such accounts or apply through them",
                "Referrals from existing employees, contractors, or clients",
                "Background check providers (with your consent, where required by applicable law)",
                "Skills assessment platforms used during our recruitment process",
                "Publicly available professional information to verify credentials",
              ]} />
            </Section>

            <Section id="usage" number="03" title="How We Use Your Information">
              <P>
                Ocean Blue uses your personal information for the following purposes:
              </P>

              <p className="font-semibold text-gray-800 mt-2">For Candidates</p>
              <UL items={[
                "Evaluate your qualifications and match you with suitable job opportunities",
                "Present your profile to client companies with appropriate positions",
                "Communicate updates about your applications and placement status",
                "Conduct onboarding for contract or direct-hire positions",
                "Process payroll and benefits for contractors placed through Ocean Blue",
                "Comply with legal requirements including employment and tax law obligations",
              ]} />

              <p className="font-semibold text-gray-800 mt-4">For Clients</p>
              <UL items={[
                "Deliver contracted staffing, consulting, or managed services",
                "Manage project communications, deliverables, and reporting",
                "Process invoices and payments",
                "Provide account management and customer support",
              ]} />

              <p className="font-semibold text-gray-800 mt-4">For All Users</p>
              <UL items={[
                "Operate, maintain, and improve our website and platform",
                "Send administrative communications (account confirmations, security alerts)",
                "Send marketing emails and newsletters (with your consent, and you may opt out at any time)",
                "Analyze usage trends to enhance user experience",
                "Detect, investigate, and prevent fraudulent activity and security incidents",
                "Comply with legal obligations and enforce our Terms of Service",
              ]} />
            </Section>

            <Section id="legal-basis" number="04" title="Legal Basis for Processing (GDPR)">
              <P>
                If you are located in the European Economic Area (EEA) or United Kingdom, Ocean Blue
                processes your personal data under the following legal bases:
              </P>
              <UL items={[
                <><strong className="text-gray-800">Contract Performance:</strong> Processing necessary to fulfill our staffing, consulting, or service agreements with you or your employer.</>,
                <><strong className="text-gray-800">Legitimate Interests:</strong> Processing for our legitimate business interests, such as fraud prevention, improving our services, and direct marketing to business contacts, where these interests are not overridden by your rights.</>,
                <><strong className="text-gray-800">Legal Obligation:</strong> Processing required to comply with applicable law, including employment, tax, and anti-money laundering regulations.</>,
                <><strong className="text-gray-800">Consent:</strong> Processing based on your freely given, specific, informed, and unambiguous consent, including for marketing communications. You may withdraw consent at any time.</>,
              ]} />
            </Section>

            <Section id="sharing" number="05" title="Sharing Your Information">
              <P>
                Ocean Blue does not sell, rent, or trade your personal information to third parties for
                their own marketing purposes. We may share your information in the following circumstances:
              </P>
              <UL items={[
                <><strong className="text-gray-800">Client Companies:</strong> We share candidate profiles (with candidate consent) with client employers in connection with specific job opportunities. Clients are contractually bound to use this information only for hiring purposes.</>,
                <><strong className="text-gray-800">Service Providers:</strong> We engage third-party vendors to help operate our business (cloud hosting, payroll processing, background check services, email delivery, analytics). These vendors have access to personal data only as necessary to perform their functions and are contractually bound to protect it.</>,
                <><strong className="text-gray-800">Legal Requirements:</strong> We may disclose information when required by law, regulation, court order, or governmental authority, or to protect the rights, property, or safety of Ocean Blue, our users, or others.</>,
                <><strong className="text-gray-800">Business Transfers:</strong> In connection with a merger, acquisition, sale of assets, or bankruptcy, your information may be transferred. We will notify you before your information becomes subject to a different privacy policy.</>,
                <><strong className="text-gray-800">With Your Consent:</strong> We may share information with other third parties when you explicitly authorize us to do so.</>,
              ]} />
              <P>
                All third-party service providers are required to maintain the confidentiality and security
                of your personal information and are prohibited from using it for any purpose other than
                providing services to Ocean Blue.
              </P>
            </Section>

            <Section id="retention" number="06" title="Data Retention">
              <P>
                We retain your personal information for as long as necessary to fulfill the purposes for
                which it was collected, comply with legal obligations, resolve disputes, and enforce
                agreements. Specific retention periods:
              </P>
              <UL items={[
                "Active candidate profiles: maintained while your account is active and for 2 years after your last login",
                "Placed contractor records: retained for 7 years following placement to comply with tax and employment law",
                "Job applications (unplaced): retained for 1 year from submission date",
                "Client engagement records: retained for 7 years following the end of the engagement",
                "Website usage logs and analytics: retained for 12 months",
                "Marketing communications preferences: retained until you opt out and for 3 years thereafter",
                "Background check results: deleted within 90 days of a final hiring decision",
              ]} />
              <P>
                When personal information is no longer needed, we securely delete or anonymize it. You may
                request early deletion of your data subject to applicable legal obligations (see Section 7).
              </P>
            </Section>

            <Section id="rights" number="07" title="Your Rights">
              <P>
                Depending on your jurisdiction, you have the following rights regarding your personal data:
              </P>
              <UL items={[
                <><strong className="text-gray-800">Right of Access:</strong> Request a copy of the personal information we hold about you.</>,
                <><strong className="text-gray-800">Right to Rectification:</strong> Request correction of inaccurate or incomplete personal information.</>,
                <><strong className="text-gray-800">Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request deletion of your personal data, subject to legal retention requirements.</>,
                <><strong className="text-gray-800">Right to Restriction:</strong> Request that we restrict processing of your data in certain circumstances.</>,
                <><strong className="text-gray-800">Right to Data Portability:</strong> Receive a copy of your data in a machine-readable format for transfer to another controller.</>,
                <><strong className="text-gray-800">Right to Object:</strong> Object to processing based on legitimate interests or for direct marketing purposes.</>,
                <><strong className="text-gray-800">Right to Withdraw Consent:</strong> Where processing is based on consent, withdraw it at any time without affecting prior lawful processing.</>,
              ]} />
              <P>
                To exercise any of these rights, contact us at hr@oceanbluecorp.com with the subject line
                &quot;Privacy Rights Request.&quot; We will respond within 30 days (or within the timeframe required
                by applicable law). We may need to verify your identity before processing your request.
              </P>
              <P>
                You also have the right to lodge a complaint with your local data protection supervisory
                authority if you believe our processing of your personal data violates applicable law.
              </P>
            </Section>

            <Section id="cookies" number="08" title="Cookies & Tracking Technologies">
              <P>
                Our Site uses cookies and similar tracking technologies to enhance your experience and
                analyze usage. We use the following types:
              </P>
              <UL items={[
                <><strong className="text-gray-800">Strictly Necessary Cookies:</strong> Essential for the Site to function (e.g., authentication tokens, session management). Cannot be disabled.</>,
                <><strong className="text-gray-800">Functional Cookies:</strong> Remember your preferences (e.g., language, region settings) to provide a personalized experience.</>,
                <><strong className="text-gray-800">Analytics Cookies:</strong> Collect anonymized data on how visitors interact with the Site (e.g., pages viewed, time spent) using tools like Google Analytics. We use this to improve our content and functionality.</>,
                <><strong className="text-gray-800">Marketing Cookies:</strong> Track your browsing to deliver relevant advertisements. These are only set with your prior consent.</>,
              ]} />
              <P>
                You can manage cookie preferences through your browser settings or our cookie consent
                banner when you first visit the Site. Note that disabling certain cookies may affect
                Site functionality.
              </P>
              <P>
                We also use pixel tags and web beacons in our email communications to determine whether
                emails have been opened and links clicked. You can disable this by setting your email
                client to not download images.
              </P>
            </Section>

            <Section id="security" number="09" title="Data Security">
              <P>
                Ocean Blue implements industry-standard technical and organizational measures to protect
                your personal information from unauthorized access, disclosure, alteration, and destruction.
                These measures include:
              </P>
              <UL items={[
                "Encryption of data in transit using TLS 1.2 or higher",
                "Encryption of sensitive data at rest using AES-256",
                "Access controls and multi-factor authentication for systems containing personal data",
                "Regular security assessments and penetration testing",
                "Employee training on data handling and security best practices",
                "Incident response procedures to detect and respond to security breaches",
                "AWS cloud infrastructure with SOC 2 Type II compliance",
              ]} />
              <P>
                Despite these measures, no method of electronic transmission or storage is 100% secure.
                We cannot guarantee absolute security. In the event of a data breach that is likely to
                result in a risk to your rights and freedoms, we will notify affected individuals and
                relevant authorities as required by applicable law, typically within 72 hours of discovery.
              </P>
            </Section>

            <Section id="international" number="10" title="International Data Transfers">
              <P>
                Ocean Blue is headquartered in the United States. If you are located outside the US,
                your personal information will be transferred to, stored, and processed in the United
                States, where data protection laws may differ from those in your country.
              </P>
              <P>
                Where we transfer personal data from the EEA, UK, or other jurisdictions with data
                transfer restrictions, we rely on appropriate safeguards including:
              </P>
              <UL items={[
                "Standard Contractual Clauses (SCCs) approved by the European Commission",
                "Data Processing Agreements with service providers that include appropriate transfer mechanisms",
                "Other lawful transfer mechanisms as may be required by applicable law",
              ]} />
              <P>
                By submitting your personal information to us, you consent to such international transfers
                where permitted by law. You may contact us for more information about the specific
                safeguards we use.
              </P>
            </Section>

            <Section id="children" number="11" title="Children's Privacy">
              <P>
                Our Site and services are not directed to individuals under the age of 18. We do not
                knowingly collect personal information from children. If you are a parent or guardian
                and believe your child has provided us with personal information, please contact us
                immediately at hr@oceanbluecorp.com.
              </P>
              <P>
                If we discover that we have collected personal information from a child without
                verification of parental consent, we will take steps to delete that information promptly.
              </P>
            </Section>

            <Section id="california" number="12" title="California Residents — CCPA Rights">
              <P>
                If you are a California resident, the California Consumer Privacy Act (CCPA) and the
                California Privacy Rights Act (CPRA) grant you specific rights regarding your personal
                information:
              </P>
              <UL items={[
                <><strong className="text-gray-800">Right to Know:</strong> Request disclosure of the categories and specific pieces of personal information we have collected, the sources, the business purpose, and the third parties with whom we share it.</>,
                <><strong className="text-gray-800">Right to Delete:</strong> Request deletion of personal information we have collected, subject to certain exceptions.</>,
                <><strong className="text-gray-800">Right to Correct:</strong> Request correction of inaccurate personal information.</>,
                <><strong className="text-gray-800">Right to Opt-Out of Sale or Sharing:</strong> We do not sell personal information. We do not share personal information for cross-context behavioral advertising without your consent.</>,
                <><strong className="text-gray-800">Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights.</>,
                <><strong className="text-gray-800">Sensitive Personal Information:</strong> We collect limited sensitive information (Social Security numbers for payroll, where applicable). We use it only for the purpose for which it was collected.</>,
              ]} />
              <P>
                To submit a California privacy rights request, email hr@oceanbluecorp.com with the
                subject &quot;California Privacy Rights Request.&quot; We will verify your identity and respond
                within 45 days. You may designate an authorized agent to submit requests on your behalf.
              </P>
              <InfoBox title="Categories of Personal Information Collected (Past 12 Months)">
                <p>Identifiers (name, email, IP), professional/employment information (resume, work history), internet activity (browsing on our Site), and inferences drawn from the above to create a candidate profile. No personal information sold.</p>
              </InfoBox>
            </Section>

            <Section id="updates" number="13" title="Updates to This Policy">
              <P>
                We may update this Privacy Policy periodically to reflect changes in our practices,
                technology, legal requirements, or other factors. When we update this policy, we will
                revise the &quot;Effective&quot; date at the top of this page.
              </P>
              <P>
                For material changes, we will provide at least 30 days&apos; notice by posting a prominent
                notice on our Site, sending an email to registered users, or both. We encourage you to
                review this policy periodically to stay informed.
              </P>
              <P>
                Your continued use of our Site or services after any changes to this Privacy Policy
                constitutes your acceptance of the updated policy. If you do not agree with the changes,
                you must stop using our Site and services and may request deletion of your account.
              </P>
            </Section>

            <Section id="contact" number="14" title="Contact Us">
              <P>
                If you have questions, concerns, or requests regarding this Privacy Policy or our
                handling of your personal information, please contact our Privacy Team:
              </P>
              <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-6">
                <p className="mb-4 text-sm font-semibold text-gray-800" style={{ fontFamily: "var(--font-display)" }}>
                  Ocean Blue Corporation — Privacy Team
                </p>
                <div className="space-y-2.5 text-sm text-gray-600">
                  <a href="mailto:hr@oceanbluecorp.com" className="flex items-center gap-3 transition-colors hover:text-violet-600">
                    <Mail className="h-4 w-4 text-violet-400" />
                    hr@oceanbluecorp.com
                  </a>
                  <a href="tel:+16148446925" className="flex items-center gap-3 transition-colors hover:text-violet-600">
                    <Phone className="h-4 w-4 text-violet-400" />
                    +1 (614) 844-6925
                  </a>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-400" />
                    <span>9775 Fairway Drive, Suite C<br />Powell, OH 43065</span>
                  </div>
                </div>
              </div>
              <P>
                We will acknowledge receipt of your privacy inquiry within 5 business days and aim
                to resolve it within 30 days. For urgent matters, please call us directly.
              </P>
            </Section>

            {/* Related pages */}
            <div className="mb-10 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/terms"
                className="flex flex-1 items-center justify-between rounded-xl border border-gray-200 bg-gray-50/60 px-5 py-4 text-sm font-semibold text-gray-700 transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
              >
                <span>Terms of Service</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="flex flex-1 items-center justify-between rounded-xl border border-gray-200 bg-gray-50/60 px-5 py-4 text-sm font-semibold text-gray-700 transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
              >
                <span>Contact Us</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
