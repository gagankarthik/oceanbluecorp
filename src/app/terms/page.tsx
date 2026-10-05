import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { LEGAL_DOCS } from "@/lib/legal";
import { DocPage, DocSection, P, UL, SubHead, Callout, ContactCard, RelatedLinks, HQ_ADDRESS } from "@/components/site/legal/doc";

export const metadata: Metadata = pageMetadata({
  path: "/terms",
  title: "Terms of Service",
  description: "The Terms of Service governing your use of the Oceanblue Solutions, Inc. website, job applications and services, including acceptable use and limits of liability.",
});

const SECTIONS = [
  { id: "acceptance",      label: "Acceptance of Terms" },
  { id: "services",        label: "Description of Services" },
  { id: "accounts",        label: "Applications and Accounts" },
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

export default function TermsPage() {
  const { effective: EFFECTIVE, updated, history } = LEGAL_DOCS.terms;

  return (
    <DocPage
      title="Terms of Service"
      lede={<>These Terms of Service govern your access to and use of Oceanblue Solutions, Inc.&apos;s website, platform, and services. Please read them carefully before using our services.</>}
      meta={[{ label: "Effective", value: EFFECTIVE }, { label: "Last updated", value: updated }, { label: "Jurisdiction", value: "State of Ohio, USA" }]}
      history={history}
      toc={SECTIONS}
    >

            <DocSection id="acceptance" number="01" title="Acceptance of Terms">
              <P>
                By accessing or using the website located at oceanbluecorp.com (the &quot;Site&quot;) or any services
                provided by Oceanblue Solutions, Inc. (&quot;Oceanblue,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you
                agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to all of these
                Terms, you may not access or use our Site or services.
              </P>
              <P>
                These Terms constitute a legally binding agreement between you and Oceanblue Solutions, Inc.,
                a company incorporated in the State of Ohio. Your continued use of the Site or services
                following any posted modifications constitutes acceptance of those modifications.
              </P>
              <P>
                If you are using our services on behalf of a company or other legal entity, you represent
                that you have the authority to bind that entity to these Terms. In that case, &quot;you&quot; also
                refers to that entity.
              </P>
            </DocSection>

            <DocSection id="services" number="02" title="Description of Services">
              <P>
                Oceanblue Solutions, Inc. provides a range of enterprise information technology solutions and
                services, including but not limited to:
              </P>
              <UL items={[
                "IT Staffing and Talent Acquisition, contract, contract-to-hire, and direct placement of technology professionals",
                "Enterprise Resource Planning (ERP), implementation, customization, and support for SAP, Oracle, and other ERP platforms",
                "Cloud Infrastructure Services, architecture, migration, and managed services on AWS, Microsoft Azure, and Google Cloud Platform",
                "Artificial Intelligence and Data Analytics, predictive modeling, machine learning, business intelligence, and data warehousing solutions",
                "Salesforce CRM Consulting, implementation, integration, administration, and custom development",
                "Managed IT Services, 24/7 monitoring, help desk support, and infrastructure management",
                "DevOps and Application Development, CI/CD pipeline design, containerization, and custom software development",
                "Cybersecurity, security assessments, identity and access management, vulnerability management, and HIPAA, SOC 2, and NIST compliance",
                "Digital Transformation Consulting, strategic advisory services for organizational modernization",
              ]} />
              <P>
                Oceanblue reserves the right to modify, suspend, or discontinue any service at any time
                with or without notice. We shall not be liable to you or any third party for any such
                modification, suspension, or discontinuation.
              </P>
            </DocSection>

            <DocSection id="accounts" number="03" title="Applications and Staff Accounts">
              <P>
                You do not need an account to use this Site, to contact us, or to apply for a role.
                When you submit a job application, a resume, or a contact form, you agree to:
              </P>
              <UL items={[
                "Provide accurate, current, and complete information",
                "Submit only information that is your own, or that you are authorized to share",
                "Not submit an application using false information or impersonating another person",
                "Tell us at hr@oceanbluecorp.com if something you sent us needs correcting",
              ]} />
              <P>
                The staff console is for Oceanblue employees. Accounts are created by invitation, and
                there is no public registration. Staff must keep their password confidential and report
                any unauthorized use of their account immediately.
              </P>
              <P>
                You must be at least 18 years of age to apply for a role or use our services. By
                submitting an application, you represent and warrant that you meet this age requirement.
              </P>
            </DocSection>

            <DocSection id="staffing" number="04" title="Staffing and Recruitment Services">
              <P>
                Oceanblue provides recruitment and staffing services to connect qualified candidates with
                client companies. The following terms apply specifically to these services:
              </P>
              <P><strong>For Candidates:</strong></P>
              <UL items={[
                "You warrant that all information in your profile and resume is accurate, truthful, and not misleading",
                "Submitting a profile does not guarantee placement in any position",
                "You authorize Oceanblue to present your information to potential client employers in connection with open roles",
                "You agree not to directly contact client companies introduced through Oceanblue to circumvent the placement process for a period of twelve (12) months from introduction",
                "You must promptly inform Oceanblue of any changes to your availability, employment status, or contact details",
                "Contract placements are governed by a separate Staffing Agreement which will be provided before assignment commencement",
              ]} />
              <P><strong>For Client Companies:</strong></P>
              <UL items={[
                "You may not directly hire any candidate introduced by Oceanblue without Oceanblue's written consent and applicable placement fees",
                "You agree to accurately describe position requirements and working conditions",
                "You are responsible for background checks, drug screening, and other pre-employment requirements unless contracted otherwise",
                "Fees for placement services are governed by your executed Master Services Agreement or Statement of Work",
              ]} />
            </DocSection>

            <DocSection id="client" number="05" title="Client Obligations">
              <P>
                Clients engaging Oceanblue for consulting, managed services, or staffing acknowledge and
                agree to the following obligations:
              </P>
              <UL items={[
                "Provide Oceanblue personnel with reasonable access to systems, data, and personnel necessary to perform contracted services",
                "Designate a primary point of contact to coordinate with Oceanblue's delivery team",
                "Review and provide timely feedback on deliverables within agreed review periods",
                "Maintain a safe and non-discriminatory work environment for all Oceanblue personnel on-site",
                "Comply with all applicable laws and regulations in your jurisdiction",
                "Not solicit or hire Oceanblue's employees, contractors, or subcontractors directly for a period of twelve (12) months following completion of services without payment of a conversion fee",
                "Pay all invoices in accordance with agreed payment terms",
              ]} />
              <P>
                Failure to meet these obligations may result in delays in service delivery for which
                Oceanblue shall not be held responsible.
              </P>
            </DocSection>

            <DocSection id="ip" number="06" title="Intellectual Property">
              <P>
                All content on this Site, including but not limited to text, graphics, logos, images,
                data compilations, and software, is the property of Oceanblue Solutions, Inc. or its content
                suppliers and is protected by United States and international copyright, trademark, and
                other intellectual property laws.
              </P>
              <P>
                You may not reproduce, distribute, modify, create derivative works from, publicly display,
                publicly perform, republish, download, store, or transmit any material from our Site
                without the prior written consent of Oceanblue Solutions, Inc., except:
              </P>
              <UL items={[
                "Your computer may temporarily store copies in RAM incidental to your accessing the Site",
                "You may store files automatically cached by your browser for display enhancement purposes",
                "You may print one copy of a reasonable number of pages for your personal, non-commercial use",
              ]} />
              <P>
                For custom software, systems, and deliverables developed by Oceanblue under a client
                engagement, intellectual property ownership is governed by the applicable Statement of
                Work or Master Services Agreement. In the absence of a written agreement, Oceanblue
                retains all intellectual property rights in all work product.
              </P>
              <P>
                &quot;Oceanblue Solutions, Inc.,&quot; &quot;Oceanblue,&quot; and associated logos are registered
                trademarks or trademarks of Oceanblue Solutions, Inc. Nothing in these Terms grants you
                any right to use our trademarks without prior written permission.
              </P>
            </DocSection>

            <DocSection id="confidentiality" number="07" title="Confidentiality">
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
            </DocSection>

            <DocSection id="payment" number="08" title="Payment Terms">
              <P>
                Payment terms for Oceanblue&apos;s services are set forth in executed Statements of Work,
                Master Services Agreements, or staffing contracts. Unless otherwise agreed in writing:
              </P>
              <UL items={[
                "Invoices are due and payable within thirty (30) days of the invoice date",
                "Late payments accrue interest at 1.5% per month (18% per annum) or the maximum rate permitted by law, whichever is lower",
                "Client is responsible for all reasonable costs of collection, including attorneys' fees, for overdue amounts",
                "Oceanblue reserves the right to suspend services for accounts more than thirty (30) days past due",
                "All fees are exclusive of applicable taxes; client is responsible for all sales, use, value-added, or similar taxes",
                "Disputed invoices must be raised in writing within fifteen (15) days of receipt; undisputed portions remain due",
              ]} />
              <P>
                For staffing placements, fees and billing rates are specified in the applicable Staffing
                Agreement and may include bill rates for contractors, direct hire placement fees, or
                retainer arrangements as mutually agreed.
              </P>
            </DocSection>

            <DocSection id="liability" number="09" title="Limitation of Liability">
              <P>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, OCEANBLUE SOLUTIONS, INC., ITS OFFICERS,
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
                IN NO EVENT SHALL OCEANBLUE&apos;S AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF
                OR RELATED TO THESE TERMS OR OUR SERVICES EXCEED THE GREATER OF (A) ONE HUNDRED DOLLARS
                ($100.00) OR (B) THE TOTAL AMOUNTS PAID BY YOU TO OCEANBLUE IN THE THREE (3) MONTHS
                PRECEDING THE CLAIM.
              </P>
              <P>
                Some jurisdictions do not allow the exclusion or limitation of certain warranties or
                liabilities. In such jurisdictions, our liability is limited to the maximum extent
                permitted by law.
              </P>
            </DocSection>

            <DocSection id="indemnification" number="10" title="Indemnification">
              <P>
                You agree to defend, indemnify, and hold harmless Oceanblue Solutions, Inc. and its
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
                Oceanblue reserves the right to assume the exclusive defense and control of any matter
                subject to indemnification by you, in which case you agree to cooperate with our defense
                of such claims.
              </P>
            </DocSection>

            <DocSection id="termination" number="11" title="Termination">
              <P>
                Oceanblue may terminate or suspend your access to the Site and services immediately,
                without prior notice or liability, for any reason, including if you breach these Terms.
              </P>
              <P>
                You may withdraw an application or ask us to stop working with you at any time by
                contacting us at hr@oceanbluecorp.com.
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
            </DocSection>

            <DocSection id="governing" number="12" title="Governing Law">
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
            </DocSection>

            <DocSection id="disputes" number="13" title="Dispute Resolution">
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
                YOU AND OCEANBLUE AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR
                OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED
                CLASS OR REPRESENTATIVE ACTION.
              </P>
            </DocSection>

            <DocSection id="changes" number="14" title="Changes to Terms">
              <P>
                Oceanblue reserves the right to update or modify these Terms at any time. When we do,
                we will revise the &quot;Effective&quot; date at the top of this page. For material changes,
                we will provide at least thirty (30) days&apos; notice by posting a prominent notice on our
                Site or by emailing candidates and clients we are actively working with.
              </P>
              <P>
                Your continued use of the Site or services after any changes constitutes acceptance of the
                revised Terms. If you do not agree to the updated Terms, you must stop using the Site and
                services and may request deletion of your data.
              </P>
            </DocSection>

            <DocSection id="contact" number="15" title="Contact Information">
              <P>
                If you have any questions about these Terms of Service, please contact our legal team:
              </P>
              <ContactCard
                title="Oceanblue Solutions, Inc., Legal Department"
                email={{ href: "mailto:hr@oceanbluecorp.com", label: "hr@oceanbluecorp.com" }}
                phone={{ href: "tel:+16148446925", label: "+1 (614) 844-6925" }}
                address={HQ_ADDRESS}
              />
            </DocSection>

      <RelatedLinks links={[{ href: "/privacy", label: "Privacy Policy" }, { href: "/contact", label: "Contact Us" }]} />
    </DocPage>
  );
}
