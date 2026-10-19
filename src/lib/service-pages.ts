// SEO and the odd extra facet line per service page. The page copy itself
// lives on `services` in site-content.ts.

export type ServicePage = {
  meta: { title: string; description: string; keywords: string[] };
  /** A second facet line under the intro, beside `facets` */
  moreFacets?: { label: string; items: string[] };
};

export const servicePages: Record<string, ServicePage> = {
  "it-staffing": {
    meta: {
      title: "IT Staffing Agency in Columbus, Ohio",
      description:
        "Pre-vetted cloud, data, security, ERP, Salesforce and AI specialists for your team on contract, contract-to-hire or direct hire. Shortlists in 48 hours.",
      keywords: ["IT staffing", "technical recruiting", "contract IT staffing", "direct placement", "managed teams", "cloud engineer staffing"],
    },
  },
  "engineering-talent": {
    meta: {
      title: "Engineering Staffing & Services",
      description:
        "Mechanical, electrical, structural, aerospace, controls and manufacturing engineers for automotive, aerospace, power and manufacturing. Shortlists in 48 hours.",
      keywords: [
        "mechanical engineer staffing",
        "aerospace engineering staffing",
        "structural engineer staffing",
        "controls engineer staffing",
        "manufacturing engineering staffing",
        "electrical engineering talent",
        "engineering contract staffing",
        "managed engineering SOW",
      ],
    },
    moreFacets: {
      label: "Markets",
      items: ["Automotive", "Manufacturing", "Aerospace and defense", "Power and utilities", "Communications", "Industrial and heavy equipment"],
    },
  },
  training: {
    meta: {
      title: "IT Training & Upskilling",
      description:
        "Instructor-led training in cloud, DevOps, data and AI, security, ERP and Salesforce, with custom curricula, hands-on labs and certification prep.",
      keywords: ["IT training", "corporate technology training", "cloud training", "upskilling", "certification preparation", "Salesforce training"],
    },
    moreFacets: { label: "How it runs", items: ["Instructor-led", "On-site or virtual", "Custom curricula and workshops"] },
  },
  "cloud-engineering": {
    meta: {
      title: "Cloud Engineering & Migration",
      description:
        "Cloud migration, modernization and DevOps across AWS, Azure and Google Cloud: landing zones, infrastructure as code, observability and FinOps cost optimization.",
      keywords: ["cloud migration", "cloud engineering", "AWS Azure GCP", "DevOps", "infrastructure as code", "FinOps"],
    },
  },
  cybersecurity: {
    meta: {
      title: "Cybersecurity Services",
      description:
        "Compliance-aligned cybersecurity: assessments, identity and access, vulnerability management, cloud security posture, and HIPAA, SOC 2 and NIST readiness.",
      keywords: ["cybersecurity services", "IAM", "vulnerability management", "cloud security", "SOC 2", "HIPAA compliance", "NIST"],
    },
    moreFacets: { label: "Frameworks we align to", items: ["HIPAA", "SOC 2", "NIST"] },
  },
  erp: {
    meta: {
      title: "SAP, Oracle & Dynamics ERP Consulting",
      description:
        "ERP implementations, upgrades and integrations across SAP, Oracle and Microsoft Dynamics, with clean data migration, reporting and ongoing support.",
      keywords: ["ERP solutions", "SAP implementation", "Oracle ERP", "Microsoft Dynamics", "ERP integration", "ERP support"],
    },
  },
  salesforce: {
    meta: {
      title: "Salesforce Consulting & Managed Admin",
      description:
        "Salesforce implementation, Apex and LWC development, workflow automation, integrations and managed admin, for cleaner data and reporting you can act on.",
      keywords: ["Salesforce services", "Salesforce implementation", "Apex development", "Lightning Web Components", "Salesforce admin", "CRM automation"],
    },
  },
  "ai-data": {
    meta: {
      title: "AI & Data Services",
      description:
        "Business-first AI and data services: workflow automation, predictive analytics, LLM integrations, data engineering, BI and MLOps, with governance built in.",
      keywords: ["AI services", "data intelligence", "predictive analytics", "LLM integration", "data engineering", "MLOps", "workflow automation"],
    },
  },
  "digital-transformation": {
    meta: {
      title: "Digital Transformation Consulting",
      description:
        "Digital transformation with a clear roadmap: technology strategy, architecture, process redesign, modernization and change management, with KPIs set up front.",
      keywords: ["digital transformation", "technology strategy", "IT roadmap", "application modernization", "process optimization", "change management"],
    },
  },
  "managed-services": {
    meta: {
      title: "Managed IT Services & 24/7 Helpdesk",
      description:
        "24/7 managed services: monitoring, helpdesk and application support, cloud and infrastructure management, and security monitoring, on one accountable SLA.",
      keywords: ["managed services", "24/7 monitoring", "IT helpdesk", "infrastructure management", "application support", "managed SLA"],
    },
  },
};

/**
 * Common questions per service, rendered with FaqList (and its FAQPage JSON-LD).
 * Same rule as lib/faqs.ts: every answer restates something the site already
 * commits to. A new claim, number or promise needs confirming before it goes here.
 */
export const serviceFaqs: Record<string, { q: string; a: string; href?: string }[]> = {
  "it-staffing": [
    {
      q: "How quickly can you send candidates?",
      a: "Typically within 48 hours of an agreed scope. You get a short, matched list rather than a stack of resumes, and every candidate on it has already been through technical screening and background and reference checks.",
    },
    {
      q: "Which IT roles do you place?",
      a: "Cloud, data and security engineers; software engineers and developers; AI and machine learning engineers; data scientists; data and business analysts; cloud and solution architects; ERP and Salesforce specialists; QA and DevOps engineers; and project and program managers.",
    },
    {
      q: "Do you offer contract, contract-to-hire and direct hire?",
      a: "Yes, all three. Contract specialists join your team for as long as you need them. Contract-to-hire lets you prove the fit on a real deliverable first. For direct hire we run the search and vetting, and you make the permanent hire.",
      href: "/how-we-work",
    },
    {
      q: "How are candidates vetted?",
      a: "We write the role with you before we search. Candidates are then tested on the skills the role needs by people who do that work, and background and reference checks are done before anyone reaches your shortlist.",
    },
    {
      q: "Do you staff Ohio state agencies?",
      a: "Yes. We are headquartered in Powell, Ohio, serve state agencies alongside enterprise clients, and hold State of Ohio MBE and WBE, City of Columbus MBE and NMSDC MBE certifications, so work placed with us counts toward supplier-diversity goals.",
      href: "/industries/government",
    },
  ],
  "engineering-talent": [
    {
      q: "Which engineering disciplines do you cover?",
      a: "Nine: mechanical, electrical and electronics, structural and civil, aerospace, manufacturing and industrial, controls and automation, quality and reliability, power and energy, and communications and RF.",
    },
    {
      q: "How can we engage engineers?",
      a: "Three ways: contract engineers who join your project for as long as you need them, direct hires we find, screen and place on your staff, or a complete project team that owns a defined engineering scope from start to finish.",
      href: "/how-we-work",
    },
    {
      q: "Can your engineers work with the systems that run our plant?",
      a: "Yes. Our controls and electrical engineers work alongside the IT that runs the plant, and the same company can supply the ERP and managed services around it.",
      href: "/industries/manufacturing",
    },
    {
      q: "How quickly can you send engineering candidates?",
      a: "Engineering is staffed the same way as IT: a short, matched shortlist, typically within 48 hours of an agreed scope.",
    },
  ],
  training: [
    {
      q: "What courses do you run?",
      a: "Cloud and DevOps; data, analytics and AI; security awareness and engineering; and ERP and Salesforce enablement, with labs and examples drawn from the platforms your team actually runs.",
    },
    {
      q: "Is training on-site or virtual?",
      a: "Either. Courses are instructor-led, on-site or virtual, and we build custom curricula and workshops around your stack rather than teaching a generic syllabus.",
    },
    {
      q: "Do you prepare people for certification exams?",
      a: "Yes. Structured preparation for the professional exams your team is working toward is part of the course.",
    },
    {
      q: "How do we know the training worked?",
      a: "Skills are assessed before and after, so progress is visible to you and to the people taking the course.",
    },
  ],
  "cloud-engineering": [
    {
      q: "Which clouds do you work with?",
      a: "AWS, where we are an Advanced Tier Services Partner, Microsoft Azure and Google Cloud.",
      href: "/certifications",
    },
    {
      q: "How do you migrate without disrupting the business?",
      a: "In planned, reversible steps, each one tested before the next, so the business keeps running throughout the move.",
    },
    {
      q: "What happens after the migration?",
      a: "We modernize the parts that hold you back, with CI/CD and infrastructure as code, and our managed services team can run the environment afterwards on one SLA.",
      href: "/services/managed-services",
    },
    {
      q: "How do you keep cloud costs under control?",
      a: "Sizing, tagging and budgets are set up as part of the work, so the bill matches what you planned. Identity, network and data controls are designed in from the start the same way.",
    },
  ],
  cybersecurity: [
    {
      q: "Where do you start a security engagement?",
      a: "With the gaps an attacker would actually use. We fix what an attacker would reach first, not what is easiest to report.",
    },
    {
      q: "Which frameworks do you align to?",
      a: "We map every control to the frameworks you are measured against, including HIPAA, SOC 2 and NIST, and keep the evidence as the work happens so an audit is a review rather than a project.",
    },
    {
      q: "What do you protect?",
      a: "Cloud environments, identity and access, and applications, with least-privilege access at the core.",
    },
    {
      q: "Is Oceanblue itself SOC 2 or ISO 27001 certified?",
      a: "No. We are not SOC 2 audited and do not hold ISO 27001. If your procurement process requires either, raise it early and we will tell you honestly whether we can meet the timeline.",
      href: "/security",
    },
  ],
  erp: [
    {
      q: "Which ERP platforms do you work with?",
      a: "SAP, Oracle and Microsoft Dynamics, with specialists for all three on one team.",
    },
    {
      q: "Will we have to change our processes to fit the software?",
      a: "We configure the ERP around the way your business actually works, with your people involved from the first workshop, rather than asking the business to change around the software.",
    },
    {
      q: "Do you integrate ERP with our other systems?",
      a: "Yes. We connect it to the systems around it so data moves between them without re-keying.",
    },
    {
      q: "Who supports the system after go-live?",
      a: "The same team that built it stays to fix, tune and extend it.",
    },
  ],
  salesforce: [
    {
      q: "Which parts of Salesforce do you cover?",
      a: "Sales Cloud and Service Cloud, with custom development in Apex and Lightning Web Components.",
    },
    {
      q: "Do you offer ongoing Salesforce administration?",
      a: "Yes. Managed administration keeps changes, users and data in order, so the org stays clean as you grow.",
    },
    {
      q: "Can you connect Salesforce to our ERP and marketing tools?",
      a: "Yes. We integrate Salesforce with ERP, marketing and the rest of your systems.",
      href: "/services/erp",
    },
    {
      q: "Can you automate our sales and service workflows?",
      a: "Yes. We build custom work and automated flows mapped to how your teams actually work, removing repetitive steps.",
    },
  ],
  "ai-data": [
    {
      q: "Which data platforms do you build on?",
      a: "Snowflake, Databricks and AWS. We are a technology partner of Snowflake and Databricks and an AWS Advanced Tier Services Partner.",
      href: "/certifications",
    },
    {
      q: "Can you take an AI pilot to production?",
      a: "Yes. That is the point of the practice: models taken from pilot to production, with the controls to run them safely.",
    },
    {
      q: "Do you do data engineering as well as AI?",
      a: "Yes. We build the pipelines, warehouses and BI underneath the AI, so your teams have data they can query and trust.",
    },
    {
      q: "How do you decide what to build?",
      a: "Every model is built around a decision someone actually has to make, so the work is tied to a business outcome rather than a demo.",
    },
  ],
  "digital-transformation": [
    {
      q: "What does a digital transformation engagement produce?",
      a: "A technology strategy written down and agreed, a target architecture with the steps to reach it, and a roadmap sequenced into stages.",
    },
    {
      q: "How do you measure progress?",
      a: "Each stage of the roadmap has a measure of success agreed up front, and we deliver in increments that show measurable wins along the way rather than one big-bang release.",
    },
    {
      q: "Who carries out the roadmap?",
      a: "The same team that sets the strategy builds it, so nothing is lost in a hand-off between planners and builders.",
    },
  ],
  "managed-services": [
    {
      q: "What do your managed services cover?",
      a: "Around-the-clock monitoring and response, helpdesk and application support, cloud and infrastructure management, security monitoring, patch and release management, and quarterly business reviews.",
    },
    {
      q: "Is monitoring really 24/7?",
      a: "Yes. Infrastructure and applications are watched day and night, with alerts that reach a person.",
    },
    {
      q: "How are patches handled?",
      a: "Updates are applied on a schedule you agree and tested before they reach production.",
    },
    {
      q: "How is the service measured?",
      a: "All of it runs on one service level agreement, with one team and one number to call, and improvements are reviewed with you every quarter.",
    },
  ],
};
