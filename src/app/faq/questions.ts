/* The questions, kept separate from the page so the JSON-LD in page.tsx and
   the rendered list are built from one array and cannot drift apart.

   Every answer here restates something the site already commits to elsewhere
   (the solutions pages, /security, /careers). Nothing new is promised. If an
   answer needs a claim that is not already made somewhere else, get it
   confirmed before adding it. */

export type Faq = {
  q: string;
  a: string;
  topic: Topic;
  /** Where the fuller answer lives, when there is one. */
  href?: string;
};

export const TOPICS = [
  "Working with us",
  "Talent and delivery",
  "Security and data",
  "Careers",
] as const;

export type Topic = (typeof TOPICS)[number];

export const FAQS: Faq[] = [
  // ── Working with us ─────────────────────────────────────
  {
    topic: "Working with us",
    q: "What does Ocean Blue actually do?",
    a: "Four connected practices under one accountable team: IT staffing and talent, engineering talent and services, enterprise solutions such as cloud, ERP, Salesforce and AI, and managed services. We serve enterprises and state government agencies across North America.",
    href: "/solutions",
  },
  {
    topic: "Working with us",
    q: "How do engagements usually start?",
    a: "With a discovery conversation. We learn the business, the constraints and the outcome that matters before proposing anything, then design the solution and roadmap together with success metrics agreed up front.",
    href: "/contact",
  },
  {
    topic: "Working with us",
    q: "What engagement models do you offer?",
    a: "Four: by the project, try before you hire, permanent hire, and a managed project team under an outcome-based statement of work where we own scope, staffing and delivery.",
    href: "/solutions/engineering",
  },
  {
    topic: "Working with us",
    q: "Do you work with government agencies?",
    a: "Yes. We serve state government agencies alongside enterprise clients, and we are a certified MBE and WBE supplier, which counts toward supplier-diversity requirements in public procurement.",
    href: "/about",
  },
  {
    topic: "Working with us",
    q: "Where are your offices?",
    a: "Four offices across three countries: Powell, Ohio in the United States, Hyderabad and Vizianagaram in India, and London in the United Kingdom.",
    href: "/contact",
  },

  // ── Talent and delivery ─────────────────────────────────
  {
    topic: "Talent and delivery",
    q: "How quickly can you provide a shortlist?",
    a: "Typically within 48 hours of an agreed scope. The shortlist is curated to fit rather than padded to volume, and every candidate has been through technical screening plus background and reference checks.",
    href: "/solutions/staffing",
  },
  {
    topic: "Talent and delivery",
    q: "How do your engineers work with our team?",
    a: "They are embedded with the client and accountable for the outcome, not working a ticket queue at arm's length. They carry real scope from the first week.",
    href: "/careers",
  },
  {
    topic: "Talent and delivery",
    q: "Which engineering disciplines do you cover?",
    a: "Nine: mechanical, electrical and electronics, structural and civil, aerospace, manufacturing and industrial, controls and automation, quality and reliability, power and energy, and communications and RF.",
    href: "/solutions/engineering",
  },
  {
    topic: "Talent and delivery",
    q: "Do you support ongoing operations after a project ships?",
    a: "Yes. Managed services covers monitoring, helpdesk and application support, cloud and infrastructure management and security monitoring, under one accountable SLA with quarterly reviews.",
    href: "/solutions/managed",
  },

  // ── Security and data ───────────────────────────────────
  {
    topic: "Security and data",
    q: "Are you SOC 2 or ISO 27001 certified?",
    a: "No. Ocean Blue is not SOC 2 audited and does not hold ISO 27001, and we have not commissioned a third-party penetration test. If your procurement process requires any of these, raise it early and we will tell you honestly whether we can meet the timeline.",
    href: "/security",
  },
  {
    topic: "Security and data",
    q: "Where is our data stored?",
    a: "Application data is stored and processed in Amazon Web Services in the US East (Ohio) region, us-east-2. Data is encrypted in transit over HTTPS and encrypted at rest by the AWS services holding it.",
    href: "/security",
  },
  {
    topic: "Security and data",
    q: "Can staff outside the United States access our data?",
    a: "Yes. We operate delivery centres in India and the United Kingdom, and named personnel there can access client data where their role on an engagement requires it. Access follows the same role model as everyone else and its scope is agreed in the Master Service Agreement. If you need US-only personnel, say so during scoping.",
    href: "/security",
  },
  {
    topic: "Security and data",
    q: "How do I report a security vulnerability?",
    a: "Email hr@oceanbluecorp.com with “Security report” in the subject line, describing what you found, where, and how to reproduce it. We will confirm receipt and keep you updated. We do not run a paid bug bounty.",
    href: "/security",
  },
  {
    topic: "Security and data",
    q: "How do I request deletion of my personal data?",
    a: "Email hr@oceanbluecorp.com with your request. Our privacy policy sets out what we collect, how long we keep it, and the rights available to you, including under CCPA.",
    href: "/data-deletion",
  },

  // ── Careers ─────────────────────────────────────────────
  {
    topic: "Careers",
    q: "How do I apply for a role?",
    a: "Browse open positions and apply directly. You can filter by practice: IT staffing, cloud services, engineering, ERP, data and AI, Salesforce, PMO and training.",
    href: "/careers/search",
  },
  {
    topic: "Careers",
    q: "What benefits do you offer?",
    a: "Comprehensive medical, dental and vision coverage, a 401(k) with savings options, and generous vacation and sick leave.",
    href: "/careers",
  },
  {
    topic: "Careers",
    q: "Do you hire outside the United States?",
    a: "Yes. We hire across all four offices, in the United States, India and the United Kingdom.",
    href: "/careers",
  },
  {
    topic: "Careers",
    q: "Can I ask for an accommodation during hiring?",
    a: "Yes. Tell your recruiter at any point in the process and we will arrange it. We are an equal opportunity employer.",
    href: "/careers",
  },
];
