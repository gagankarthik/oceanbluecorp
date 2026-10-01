import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { LEGAL_DOCS } from "@/lib/legal";
import { DocPage, DocSection, P, UL, SubHead, Callout, ContactCard, RelatedLinks, HQ_ADDRESS } from "@/components/site/legal/doc";

export const metadata: Metadata = pageMetadata({
  path: "/privacy",
  title: "Privacy Policy",
  description: "How Ocean Blue Corporation collects, uses, shares and protects personal information from clients, candidates and visitors, and the rights you have over it.",
});

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

export default function PrivacyPage() {
  const { effective: EFFECTIVE, updated, history } = LEGAL_DOCS.privacy;

  return (
    <DocPage
      title="Privacy Policy"
      lede={<>Ocean Blue Corporation is committed to protecting your privacy. This policy explains what personal information we collect, how we use it, and what rights you have over your data.</>}
      meta={[{ label: "Effective", value: EFFECTIVE }, { label: "Last updated", value: updated }, { label: "Controller", value: "Ocean Blue Corporation, Powell, OH" }]}
      toc={SECTIONS}
      history={history}
    >

            <DocSection id="introduction" number="01" title="Introduction">
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
              <Callout title="At a Glance">
                <p>We collect what you send us: a job application and resume, or a contact form. We use it to match candidates with roles and to answer enquiries. This site runs no analytics or advertising trackers, and we do not sell personal data. You can ask to see, correct, or delete what we hold.</p>
              </Callout>
            </DocSection>

            <DocSection id="information" number="02" title="Information We Collect">
              <P>
                We collect information in several ways depending on how you interact with us:
              </P>

              <SubHead>2.1 Information You Provide Directly</SubHead>
              <UL items={[
                "Job applications: name, email address, phone number, cover letter, and the resume file you upload. You do not need an account to apply",
                "Resume contents: work history, education, skills, certifications, and links included in the file",
                "Details you give a recruiter during the process: availability, pay expectations, work authorization status",
                "Contact form submissions: name, email address, phone number, company, job title, inquiry type, and your message",
                "Client account data: company name, billing address, tax identification, authorized contacts",
                "Communications: emails and notes from calls with our team",
                "Staff accounts: name, work email, phone number, and password. These are created by invitation for Ocean Blue employees only; there is no public sign-up",
              ]} />

              <SubHead>2.2 Information Collected Automatically</SubHead>
              <UL items={[
                "IP address: used for a few minutes to limit how often the application, resume upload, and contact forms can be submitted from one connection",
                "Log data: server logs that may include IP addresses, dates/times, browser type, and requested pages",
                "Browser storage: your cookie choice and similar preferences, as described in Section 8",
                "We do not use analytics or advertising trackers, and we do not build a profile of the pages you visit",
              ]} />

              <SubHead>2.3 Information from Third Parties</SubHead>
              <UL items={[
                "Job boards and professional networks (e.g., LinkedIn) where you applied to one of our roles or made your profile available to recruiters",
                "Referrals from existing employees, contractors, or clients",
                "Background check providers (with your consent, where required by applicable law)",
                "Skills assessment platforms used during our recruitment process",
                "Publicly available professional information to verify credentials",
              ]} />
            </DocSection>

            <DocSection id="usage" number="03" title="How We Use Your Information">
              <P>
                Ocean Blue uses your personal information for the following purposes:
              </P>

              <SubHead>For Candidates</SubHead>
              <UL items={[
                "Evaluate your qualifications and match you with suitable job opportunities",
                "Read your resume with software that extracts your contact details, skills, and experience and scores how closely they fit a role. The score is a guide for the recruiter; the software does not reject or advance an application on its own",
                "Present your profile to client companies with appropriate positions",
                "Communicate updates about your applications and placement status",
                "Conduct onboarding for contract or direct-hire positions",
                "Process payroll and benefits for contractors placed through Ocean Blue",
                "Comply with legal requirements including employment and tax law obligations",
              ]} />

              <SubHead>For Clients</SubHead>
              <UL items={[
                "Deliver contracted staffing, consulting, or managed services",
                "Manage project communications, deliverables, and reporting",
                "Process invoices and payments",
                "Provide account management and customer support",
              ]} />

              <SubHead>For All Users</SubHead>
              <UL items={[
                "Operate, maintain, and improve our website and platform",
                "Send administrative communications (application confirmations, replies to enquiries)",
                "Send marketing emails (with your consent, and you may opt out at any time)",
                "Detect, investigate, and prevent fraudulent activity and security incidents",
                "Comply with legal obligations and enforce our Terms of Service",
              ]} />
            </DocSection>

            <DocSection id="legal-basis" number="04" title="Legal Basis for Processing (GDPR)">
              <P>
                If you are located in the European Economic Area (EEA) or United Kingdom, Ocean Blue
                processes your personal data under the following legal bases:
              </P>
              <UL items={[
                <><strong>Contract Performance:</strong> Processing necessary to fulfill our staffing, consulting, or service agreements with you or your employer.</>,
                <><strong>Legitimate Interests:</strong> Processing for our legitimate business interests, such as fraud prevention, improving our services, and direct marketing to business contacts, where these interests are not overridden by your rights.</>,
                <><strong>Legal Obligation:</strong> Processing required to comply with applicable law, including employment, tax, and anti-money laundering regulations.</>,
                <><strong>Consent:</strong> Processing based on your freely given, specific, informed, and unambiguous consent, including for marketing communications. You may withdraw consent at any time.</>,
              ]} />
            </DocSection>

            <DocSection id="sharing" number="05" title="Sharing Your Information">
              <P>
                Ocean Blue does not sell, rent, or trade your personal information to third parties for
                their own marketing purposes. We may share your information in the following circumstances:
              </P>
              <UL items={[
                <><strong>Client Companies:</strong> We share candidate profiles (with candidate consent) with client employers in connection with specific job opportunities. Clients are contractually bound to use this information only for hiring purposes.</>,
                <><strong>Service Providers:</strong> We engage third-party vendors to help operate our business. This site runs on Amazon Web Services, which provides its hosting, database, file storage, staff sign-in, and email delivery, and resumes are read by a resume parsing and matching service. Other vendors support payroll processing and background checks. These vendors have access to personal data only as necessary to perform their functions and are contractually bound to protect it.</>,
                <><strong>Legal Requirements:</strong> We may disclose information when required by law, regulation, court order, or governmental authority, or to protect the rights, property, or safety of Ocean Blue, our users, or others.</>,
                <><strong>Business Transfers:</strong> In connection with a merger, acquisition, sale of assets, or bankruptcy, your information may be transferred. We will notify you before your information becomes subject to a different privacy policy.</>,
                <><strong>With Your Consent:</strong> We may share information with other third parties when you explicitly authorize us to do so.</>,
              ]} />
              <P>
                All third-party service providers are required to maintain the confidentiality and security
                of your personal information and are prohibited from using it for any purpose other than
                providing services to Ocean Blue.
              </P>
              <P>
                A few items on this site load directly from other servers: the office map (OpenStreetMap)
                and some client and partner logos, which come from those companies&apos; own websites. When
                your browser requests them, those servers receive your IP address, as with any web request.
                We send them nothing else.
              </P>
            </DocSection>

            <DocSection id="retention" number="06" title="Data Retention">
              <P>
                We retain your personal information for as long as necessary to fulfill the purposes for
                which it was collected, comply with legal obligations, resolve disputes, and enforce
                agreements. Specific retention periods:
              </P>
              <UL items={[
                "Active candidate profiles: maintained while we are working with you and for 2 years after our last contact",
                "Placed contractor records: retained for 7 years following placement to comply with tax and employment law",
                "Job applications (unplaced): retained for 1 year from submission date",
                "Client engagement records: retained for 7 years following the end of the engagement",
                "Form submission counters (by IP address): deleted automatically within minutes",
                "Marketing communications preferences: retained until you opt out and for 3 years thereafter",
                "Background check results: deleted within 90 days of a final hiring decision",
              ]} />
              <P>
                When personal information is no longer needed, we securely delete or anonymize it. You may
                request early deletion of your data subject to applicable legal obligations (see Section 7).
              </P>
            </DocSection>

            <DocSection id="rights" number="07" title="Your Rights">
              <P>
                Depending on your jurisdiction, you have the following rights regarding your personal data:
              </P>
              <UL items={[
                <><strong>Right of Access:</strong> Request a copy of the personal information we hold about you.</>,
                <><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete personal information.</>,
                <><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request deletion of your personal data, subject to legal retention requirements.</>,
                <><strong>Right to Restriction:</strong> Request that we restrict processing of your data in certain circumstances.</>,
                <><strong>Right to Data Portability:</strong> Receive a copy of your data in a machine-readable format for transfer to another controller.</>,
                <><strong>Right to Object:</strong> Object to processing based on legitimate interests or for direct marketing purposes.</>,
                <><strong>Right to Withdraw Consent:</strong> Where processing is based on consent, withdraw it at any time without affecting prior lawful processing.</>,
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
            </DocSection>

            <DocSection id="cookies" number="08" title="Cookies & Tracking Technologies">
              <P>
                Our Site uses cookies and browser storage to keep it working and to remember your
                choices. We do not use analytics or advertising cookies. We use the following types:
              </P>
              <UL items={[
                <><strong>Strictly Necessary Storage:</strong> Your cookie choice, and, for Ocean Blue staff only, the sign-in session for the staff console. Cannot be disabled.</>,
                <><strong>Preference Storage:</strong> Remembers choices you make, such as a dismissed announcement. Kept across visits only with your consent.</>,
              ]} />
              <P>
                You can manage cookie preferences through your browser settings or our cookie consent
                banner when you first visit the Site. Note that disabling certain cookies may affect
                Site functionality.
              </P>
              <P>
                The emails this site sends, such as an application confirmation, carry no tracking pixels.
                The full list of what is stored is in our <a href="/cookies">Cookie Policy</a>.
              </P>
            </DocSection>

            <DocSection id="security" number="09" title="Data Security">
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
            </DocSection>

            <DocSection id="international" number="10" title="International Data Transfers">
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
            </DocSection>

            <DocSection id="children" number="11" title="Children's Privacy">
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
            </DocSection>

            <DocSection id="california" number="12" title="California Residents: CCPA Rights">
              <P>
                If you are a California resident, the California Consumer Privacy Act (CCPA) and the
                California Privacy Rights Act (CPRA) grant you specific rights regarding your personal
                information:
              </P>
              <UL items={[
                <><strong>Right to Know:</strong> Request disclosure of the categories and specific pieces of personal information we have collected, the sources, the business purpose, and the third parties with whom we share it.</>,
                <><strong>Right to Delete:</strong> Request deletion of personal information we have collected, subject to certain exceptions.</>,
                <><strong>Right to Correct:</strong> Request correction of inaccurate personal information.</>,
                <><strong>Right to Opt-Out of Sale or Sharing:</strong> We do not sell personal information. We do not share personal information for cross-context behavioral advertising without your consent.</>,
                <><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights.</>,
                <><strong>Sensitive Personal Information:</strong> We collect limited sensitive information (Social Security numbers for payroll, where applicable). We use it only for the purpose for which it was collected.</>,
              ]} />
              <P>
                To submit a California privacy rights request, email hr@oceanbluecorp.com with the
                subject &quot;California Privacy Rights Request.&quot; We will verify your identity and respond
                within 45 days. You may designate an authorized agent to submit requests on your behalf.
              </P>
              <Callout title="Categories of Personal Information Collected (Past 12 Months)">
                <p>Identifiers (name, email, phone, IP address), professional/employment information (resume, work history), and inferences drawn from a resume to assess fit for a role. We do not collect browsing activity. No personal information sold.</p>
              </Callout>
            </DocSection>

            <DocSection id="updates" number="13" title="Updates to This Policy">
              <P>
                We may update this Privacy Policy periodically to reflect changes in our practices,
                technology, legal requirements, or other factors. When we update this policy, we will
                revise the &quot;Effective&quot; date at the top of this page.
              </P>
              <P>
                For material changes, we will provide at least 30 days&apos; notice by posting a prominent
                notice on our Site, emailing candidates and clients we are actively working with, or both. We encourage you to
                review this policy periodically to stay informed.
              </P>
              <P>
                Your continued use of our Site or services after any changes to this Privacy Policy
                constitutes your acceptance of the updated policy. If you do not agree with the changes,
                you must stop using our Site and services and may request deletion of your data.
              </P>
            </DocSection>

            <DocSection id="contact" number="14" title="Contact Us">
              <P>
                If you have questions, concerns, or requests regarding this Privacy Policy or our
                handling of your personal information, please contact our Privacy Team:
              </P>
              <ContactCard
                title="Ocean Blue Corporation, Privacy Team"
                email={{ href: "mailto:hr@oceanbluecorp.com", label: "hr@oceanbluecorp.com" }}
                phone={{ href: "tel:+16148446925", label: "+1 (614) 844-6925" }}
                address={HQ_ADDRESS}
              />
              <P>
                We will acknowledge receipt of your privacy inquiry within 5 business days and aim
                to resolve it within 30 days. For urgent matters, please call us directly.
              </P>
            </DocSection>

      <RelatedLinks links={[{ href: "/terms", label: "Terms of Service" }, { href: "/contact", label: "Contact Us" }]} />
    </DocPage>
  );
}
