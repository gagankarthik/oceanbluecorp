import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | Ocean Blue Corporation",
  description: "Read the Terms of Service governing your use of Ocean Blue Corporation's website and services.",
};

const SECTIONS = [
  { id: "acceptance",      label: "Acceptance of Terms" },
  { id: "services",        label: "Description of Services" },
  { id: "accounts",        label: "User Accounts" },
  { id: "staffing",        label: "Staffing & Recruitment" },
  { id: "client",          label: "Client Obligations" },
  { id: "ip",              label: "Intellectual Property" },
  { id: "confidentiality", label: "Confidentiality" },
  { id: "payment",         label: "Payment Terms" },
  { id: "liability",       label: "Limitation of Liability" },
  { id: "indemnification", label: "Indemnification" },
  { id: "termination",     label: "Termination" },
  { id: "governing",       label: "Governing Law" },
  { id: "disputes",        label: "Dispute Resolution" },
  { id: "changes",         label: "Changes to Terms" },
  { id: "contact",         label: "Contact Information" },
];

function Section({ id, number, title, children }: {
  id: string; number: string; title: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 py-8 border-b border-gray-100 last:border-0">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-mono text-[11px] font-semibold text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-md">
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

function UL({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function TermsPage() {
  const EFFECTIVE = "April 1, 2026";

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div
        className="border-b border-gray-100"
        style={{
          background: [
            "radial-gradient(ellipse 70% 55% at 10% 20%, rgba(99,102,241,0.07) 0%, transparent 60%)",
            "radial-gradient(ellipse 55% 45% at 90% 80%, rgba(6,182,212,0.05) 0%, transparent 60%)",
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

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Legal
          </div>

          <h1
            className="mt-3 text-[1.9rem] font-extrabold leading-[1.06] tracking-tight text-gray-900 sm:text-[2.6rem] md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Terms of Service
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-500">
            These Terms of Service govern your access to and use of Ocean Blue Corporation&apos;s
            website, platform, and services. Please read them carefully before using our services.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-gray-400">
            <span><strong className="text-gray-600">Effective:</strong> {EFFECTIVE}</span>
            <span><strong className="text-gray-600">Jurisdiction:</strong> State of Ohio, USA</span>
          </div>

          {/* Jump links */}
          <div className="mt-8 flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
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

          {/* Sticky sidebar TOC */}
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
                    className="block rounded-lg px-3 py-1.5 text-[13px] text-gray-500 transition-colors hover:bg-gray-50 hover:text-indigo-700"
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <div className="min-w-0 flex-1 pt-8">

            <Section id="acceptance" number="01" title="Acceptance of Terms">
              <P>
                By accessing or using the website located at oceanbluecorp.com (the &quot;Site&quot;) or any services
                provided by Ocean Blue Corporation (&quot;Ocean Blue,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you
                agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to all of these
                Terms, you may not access or use our Site or services.
              </P>
              <P>
                These Terms constitute a legally binding agreement between you and Ocean Blue Corporation,
                a company incorporated in the State of Ohio. Your continued use of the Site or services
                following any posted modifications constitutes acceptance of those modifications.
              </P>
              <P>
                If you are using our services on behalf of a company or other legal entity, you represent
                that you have the authority to bind that entity to these Terms. In that case, &quot;you&quot; also
                refers to that entity.
              </P>
            </Section>

            <Section id="services" number="02" title="Description of Services">
              <P>
                Ocean Blue Corporation provides a range of enterprise information technology solutions and
                services, including but not limited to:
              </P>
              <UL items={[
                "IT Staffing and Talent Acquisition — contract, contract-to-hire, and direct placement of technology professionals",
                "Enterprise Resource Planning (ERP) — implementation, customization, and support for SAP, Oracle, and other ERP platforms",
                "Cloud Infrastructure Services — architecture, migration, and managed services on AWS, Microsoft Azure, and Google Cloud Platform",
                "Artificial Intelligence and Data Analytics — predictive modeling, machine learning, business intelligence, and data warehousing solutions",
                "Salesforce CRM Consulting — implementation, integration, administration, and custom development",
                "Managed IT Services — 24/7 monitoring, help desk support, and infrastructure management",
                "DevOps and Application Development — CI/CD pipeline design, containerization, and custom software development",
                "Corporate Training — technical skills development, certification preparation, and leadership programs",
                "Digital Transformation Consulting — strategic advisory services for organizational modernization",
              ]} />
              <P>
                Ocean Blue reserves the right to modify, suspend, or discontinue any service at any time
                with or without notice. We shall not be liable to you or any third party for any such
                modification, suspension, or discontinuation.
              </P>
            </Section>

            <Section id="accounts" number="03" title="User Accounts and Registration">
              <P>
                To access certain features of our platform—including submitting job applications, uploading
                resumes, and tracking application status—you must register for an account. You agree to:
              </P>
              <UL items={[
                "Provide accurate, current, and complete registration information",
                "Maintain and promptly update your account information to keep it accurate",
                "Keep your password confidential and not share it with any third party",
                "Notify us immediately of any unauthorized use of your account at hr@oceanbluecorp.com",
                "Accept responsibility for all activities that occur under your account",
                "Not create an account using false information or impersonating another person",
              ]} />
              <P>
                Ocean Blue reserves the right to suspend or terminate accounts that violate these Terms,
                contain false information, or have been inactive for extended periods, at our sole
                discretion and without liability.
              </P>
              <P>
                You must be at least 18 years of age to create an account or use our services. By
                registering, you represent and warrant that you meet this age requirement.
              </P>
            </Section>

            <Section id="staffing" number="04" title="Staffing and Recruitment Services">
              <P>
                Ocean Blue provides recruitment and staffing services to connect qualified candidates with
                client companies. The following terms apply specifically to these services:
              </P>
              <P><strong className="text-gray-800">For Candidates:</strong></P>
              <UL items={[
                "You warrant that all information in your profile and resume is accurate, truthful, and not misleading",
                "Submitting a profile does not guarantee placement in any position",
                "You authorize Ocean Blue to present your information to potential client employers in connection with open roles",
                "You agree not to directly contact client companies introduced through Ocean Blue to circumvent the placement process for a period of twelve (12) months from introduction",
                "You must promptly inform Ocean Blue of any changes to your availability, employment status, or contact details",
                "Contract placements are governed by a separate Staffing Agreement which will be provided before assignment commencement",
              ]} />
              <P><strong className="text-gray-800">For Client Companies:</strong></P>
              <UL items={[
                "You may not directly hire any candidate introduced by Ocean Blue without Ocean Blue's written consent and applicable placement fees",
                "You agree to accurately describe position requirements and working conditions",
                "You are responsible for background checks, drug screening, and other pre-employment requirements unless contracted otherwise",
                "Fees for placement services are governed by your executed Master Services Agreement or Statement of Work",
              ]} />
            </Section>

            <Section id="client" number="05" title="Client Obligations">
              <P>
                Clients engaging Ocean Blue for consulting, managed services, or staffing acknowledge and
                agree to the following obligations:
              </P>
              <UL items={[
                "Provide Ocean Blue personnel with reasonable access to systems, data, and personnel necessary to perform contracted services",
                "Designate a primary point of contact to coordinate with Ocean Blue's delivery team",
                "Review and provide timely feedback on deliverables within agreed review periods",
                "Maintain a safe and non-discriminatory work environment for all Ocean Blue personnel on-site",
                "Comply with all applicable laws and regulations in your jurisdiction",
                "Not solicit or hire Ocean Blue's employees, contractors, or subcontractors directly for a period of twelve (12) months following completion of services without payment of a conversion fee",
                "Pay all invoices in accordance with agreed payment terms",
              ]} />
              <P>
                Failure to meet these obligations may result in delays in service delivery for which
                Ocean Blue shall not be held responsible.
              </P>
            </Section>

            <Section id="ip" number="06" title="Intellectual Property">
              <P>
                All content on this Site, including but not limited to text, graphics, logos, images,
                data compilations, and software, is the property of Ocean Blue Corporation or its content
                suppliers and is protected by United States and international copyright, trademark, and
                other intellectual property laws.
              </P>
              <P>
                You may not reproduce, distribute, modify, create derivative works from, publicly display,
                publicly perform, republish, download, store, or transmit any material from our Site
                without the prior written consent of Ocean Blue Corporation, except:
              </P>
              <UL items={[
                "Your computer may temporarily store copies in RAM incidental to your accessing the Site",
                "You may store files automatically cached by your browser for display enhancement purposes",
                "You may print one copy of a reasonable number of pages for your personal, non-commercial use",
              ]} />
              <P>
                For custom software, systems, and deliverables developed by Ocean Blue under a client
                engagement, intellectual property ownership is governed by the applicable Statement of
                Work or Master Services Agreement. In the absence of a written agreement, Ocean Blue
                retains all intellectual property rights in all work product.
              </P>
              <P>
                &quot;Ocean Blue Corporation,&quot; &quot;Ocean Blue Solutions,&quot; and associated logos are registered
                trademarks or trademarks of Ocean Blue Corporation. Nothing in these Terms grants you
                any right to use our trademarks without prior written permission.
              </P>
            </Section>

            <Section id="confidentiality" number="07" title="Confidentiality">
              <P>
                In the course of providing or receiving services, parties may have access to confidential
                information belonging to the other party. &quot;Confidential Information&quot; means any non-public
                information disclosed by one party to the other, whether orally, in writing, or by
                electronic means, that is designated as confidential or that reasonably should be
                understood to be confidential given its nature and the circumstances of disclosure.
              </P>
              <P>
                Each party agrees to:
              </P>
              <UL items={[
                "Protect the other party's Confidential Information using the same degree of care it uses for its own confidential information, but no less than reasonable care",
                "Not disclose Confidential Information to any third party without prior written consent",
                "Use Confidential Information only for the purpose of performing obligations under these Terms or a separate agreement",
                "Limit access to Confidential Information to employees or contractors with a legitimate need to know",
                "Promptly notify the disclosing party upon discovery of any unauthorized use or disclosure",
              ]} />
              <P>
                These obligations do not apply to information that is publicly available, independently
                developed, lawfully obtained from a third party, or required to be disclosed by law.
                Confidentiality obligations survive termination of these Terms for a period of three (3) years.
              </P>
            </Section>

            <Section id="payment" number="08" title="Payment Terms">
              <P>
                Payment terms for Ocean Blue&apos;s services are set forth in executed Statements of Work,
                Master Services Agreements, or staffing contracts. Unless otherwise agreed in writing:
              </P>
              <UL items={[
                "Invoices are due and payable within thirty (30) days of the invoice date",
                "Late payments accrue interest at 1.5% per month (18% per annum) or the maximum rate permitted by law, whichever is lower",
                "Client is responsible for all reasonable costs of collection, including attorneys' fees, for overdue amounts",
                "Ocean Blue reserves the right to suspend services for accounts more than thirty (30) days past due",
                "All fees are exclusive of applicable taxes; client is responsible for all sales, use, value-added, or similar taxes",
                "Disputed invoices must be raised in writing within fifteen (15) days of receipt; undisputed portions remain due",
              ]} />
              <P>
                For staffing placements, fees and billing rates are specified in the applicable Staffing
                Agreement and may include bill rates for contractors, direct hire placement fees, or
                retainer arrangements as mutually agreed.
              </P>
            </Section>

            <Section id="liability" number="09" title="Limitation of Liability">
              <P>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, OCEAN BLUE CORPORATION, ITS OFFICERS,
                DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS,
                DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH:
              </P>
              <UL items={[
                "Your use of or inability to use the Site or services",
                "Any unauthorized access to or use of our servers or personal information stored therein",
                "Any interruption or cessation of transmission to or from the Site",
                "Any bugs, viruses, or other harmful code transmitted through the Site by third parties",
                "Any errors or omissions in any content, or any loss or damage incurred as a result of the use of any content posted, emailed, transmitted, or otherwise made available through the Site",
                "The conduct or performance of any candidate placed through our staffing services",
              ]} />
              <P>
                IN NO EVENT SHALL OCEAN BLUE&apos;S AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF
                OR RELATED TO THESE TERMS OR OUR SERVICES EXCEED THE GREATER OF (A) ONE HUNDRED DOLLARS
                ($100.00) OR (B) THE TOTAL AMOUNTS PAID BY YOU TO OCEAN BLUE IN THE THREE (3) MONTHS
                PRECEDING THE CLAIM.
              </P>
              <P>
                Some jurisdictions do not allow the exclusion or limitation of certain warranties or
                liabilities. In such jurisdictions, our liability is limited to the maximum extent
                permitted by law.
              </P>
            </Section>

            <Section id="indemnification" number="10" title="Indemnification">
              <P>
                You agree to defend, indemnify, and hold harmless Ocean Blue Corporation and its
                affiliates, officers, directors, employees, and agents from and against any claims,
                liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including
                reasonable attorneys&apos; fees) arising out of or relating to:
              </P>
              <UL items={[
                "Your violation of these Terms",
                "Your use of the Site or services in a manner not authorized by these Terms",
                "Any content you submit, post, or transmit through the Site, including your resume or profile information",
                "Your violation of any third-party rights, including any copyright, trademark, trade secret, or privacy rights",
                "Your violation of any applicable law or regulation",
                "Any misrepresentation made by you in connection with our services",
              ]} />
              <P>
                Ocean Blue reserves the right to assume the exclusive defense and control of any matter
                subject to indemnification by you, in which case you agree to cooperate with our defense
                of such claims.
              </P>
            </Section>

            <Section id="termination" number="11" title="Termination">
              <P>
                Ocean Blue may terminate or suspend your access to the Site and services immediately,
                without prior notice or liability, for any reason, including if you breach these Terms.
              </P>
              <P>
                You may terminate your account at any time by contacting us at hr@oceanbluecorp.com.
                Upon termination, your right to use the Site and services will immediately cease.
              </P>
              <P>
                The following provisions survive termination: Intellectual Property, Confidentiality,
                Limitation of Liability, Indemnification, Governing Law, and Dispute Resolution.
              </P>
              <P>
                Upon termination of a staffing or consulting engagement, client remains obligated to
                pay all fees for services rendered prior to the effective termination date. Any early
                termination fees applicable to the engagement will be governed by the relevant
                Statement of Work.
              </P>
            </Section>

            <Section id="governing" number="12" title="Governing Law">
              <P>
                These Terms and any disputes arising out of or related to them or our services shall be
                governed by and construed in accordance with the laws of the State of Ohio, United States
                of America, without regard to its conflict of law principles.
              </P>
              <P>
                You agree that any legal proceeding arising out of or related to these Terms shall be
                brought exclusively in the state or federal courts located in Delaware County, Ohio,
                and you hereby consent to personal jurisdiction in such courts.
              </P>
            </Section>

            <Section id="disputes" number="13" title="Dispute Resolution">
              <P>
                Before initiating any formal legal proceeding, the parties agree to attempt to resolve
                disputes informally. Either party may initiate informal dispute resolution by providing
                written notice describing the nature of the dispute and the relief sought. The parties
                will attempt to resolve the dispute within thirty (30) days of such notice.
              </P>
              <P>
                If the dispute is not resolved informally, any controversy or claim arising out of or
                relating to these Terms, or the breach thereof, shall be settled by binding arbitration
                administered by the American Arbitration Association (&quot;AAA&quot;) under its Commercial
                Arbitration Rules. The arbitration shall take place in Columbus, Ohio, and judgment on
                the award rendered by the arbitrator(s) may be entered in any court having jurisdiction.
              </P>
              <P>
                Notwithstanding the foregoing, either party may seek emergency injunctive or other
                equitable relief from a court of competent jurisdiction to prevent irreparable harm
                pending arbitration.
              </P>
              <P>
                YOU AND OCEAN BLUE AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR
                OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED
                CLASS OR REPRESENTATIVE ACTION.
              </P>
            </Section>

            <Section id="changes" number="14" title="Changes to Terms">
              <P>
                Ocean Blue reserves the right to update or modify these Terms at any time. When we do,
                we will revise the &quot;Effective&quot; date at the top of this page. For material changes,
                we will provide at least thirty (30) days&apos; notice by posting a prominent notice on our
                Site or by emailing the address associated with your account.
              </P>
              <P>
                Your continued use of the Site or services after any changes constitutes acceptance of the
                revised Terms. If you do not agree to the updated Terms, you must stop using the Site and
                services and may request account deletion.
              </P>
            </Section>

            <Section id="contact" number="15" title="Contact Information">
              <P>
                If you have any questions about these Terms of Service, please contact our legal team:
              </P>
              <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-6">
                <p className="mb-4 text-sm font-semibold text-gray-800" style={{ fontFamily: "var(--font-display)" }}>
                  Ocean Blue Corporation — Legal Department
                </p>
                <div className="space-y-2.5 text-sm text-gray-600">
                  <a href="mailto:hr@oceanbluecorp.com" className="flex items-center gap-3 transition-colors hover:text-indigo-600">
                    <Mail className="h-4 w-4 text-indigo-400" />
                    hr@oceanbluecorp.com
                  </a>
                  <a href="tel:+16148446925" className="flex items-center gap-3 transition-colors hover:text-indigo-600">
                    <Phone className="h-4 w-4 text-indigo-400" />
                    +1 (614) 844-6925
                  </a>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-400" />
                    <span>9775 Fairway Drive, Suite C<br />Powell, OH 43065</span>
                  </div>
                </div>
              </div>
            </Section>

            {/* Related pages */}
            <div className="mt-8 mb-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/privacy"
                className="flex flex-1 items-center justify-between rounded-xl border border-gray-200 bg-gray-50/60 px-5 py-4 text-sm font-semibold text-gray-700 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <span>Privacy Policy</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="flex flex-1 items-center justify-between rounded-xl border border-gray-200 bg-gray-50/60 px-5 py-4 text-sm font-semibold text-gray-700 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
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
