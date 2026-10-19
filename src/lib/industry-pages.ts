// Copy for /industries/[slug]. The sector name, tagline, photo and lead services
// live on `industries` in site-content.ts. Same rule as lib/faqs.ts: everything
// here restates what the site already commits to; a new claim needs confirming.

export type IndustryPage = {
  meta: { title: string; description: string };
  /** Answer-first opening: who we are for this sector and what we do, in one paragraph. */
  answer: string;
  /** Named clients in this sector, only ones already shown on the site. */
  clients?: string[];
  faqs: { q: string; a: string; href?: string }[];
};

export const industryPages: Record<string, IndustryPage> = {
  government: {
    meta: {
      title: "IT Staffing for Ohio State Agencies",
      description:
        "Certified MBE and WBE IT staffing, managed services and cybersecurity for state agencies, from Powell, Ohio. Work placed with us counts toward diversity goals.",
    },
    answer:
      "Oceanblue Solutions supplies IT staff augmentation, managed services and cybersecurity to state agencies. We are a minority-owned and women-owned business headquartered in Powell, Ohio, certified by the State of Ohio (MBE and WBE), the City of Columbus (MBE) and the National Minority Supplier Development Council (MBE), so work placed with us counts toward an agency's supplier-diversity goals.",
    clients: ["Ohio Department of Development"],
    faqs: [
      {
        q: "Does work with Oceanblue count toward supplier-diversity goals?",
        a: "Yes. State agencies in Ohio set aside contracts and spending goals for certified minority businesses, and we hold State of Ohio MBE and WBE certifications, City of Columbus MBE and NMSDC MBE. Work placed with us counts toward those goals.",
        href: "/certifications",
      },
      {
        q: "What do you provide to state agencies?",
        a: "Most agencies start with IT staff augmentation, managed services or cybersecurity. All of our services are open to the public sector, from cloud and ERP to training.",
        href: "/services",
      },
      {
        q: "Where is agency data stored?",
        a: "Application data is stored and processed in Amazon Web Services in the US East (Ohio) region, us-east-2, encrypted in transit and at rest.",
        href: "/security",
      },
      {
        q: "Can we require US-only personnel?",
        a: "Yes. Named staff in our India and United Kingdom delivery centres can access client data only where their role requires it. If you need US-only personnel, say so during scoping.",
        href: "/security",
      },
      {
        q: "Are you SOC 2 or ISO 27001 certified?",
        a: "No. We are not SOC 2 audited and do not hold ISO 27001. If your procurement process requires either, raise it early and we will tell you honestly whether we can meet the timeline.",
        href: "/security",
      },
    ],
  },
  healthcare: {
    meta: {
      title: "Healthcare IT Staffing & Cloud Services",
      description:
        "Cloud, data and application specialists for the systems that hold patient information, with security controls mapped to HIPAA. Staffed or delivered by our team.",
    },
    answer:
      "Oceanblue Solutions places cloud, data and application specialists on the systems that hold patient information, and builds and secures those systems directly. Our cybersecurity team maps every control to the frameworks you report against, including HIPAA, because in healthcare security and uptime are not optional.",
    faqs: [
      {
        q: "What do you do for healthcare organizations?",
        a: "Most start with cloud engineering, AI and data, or IT staffing: specialists for the systems that hold patient information, placed in your team or delivered as a project.",
        href: "/services",
      },
      {
        q: "Do you align security work to HIPAA?",
        a: "Yes. Our cybersecurity team maps every control to the frameworks you are measured against, including HIPAA, and keeps the evidence as the work happens.",
        href: "/services/cybersecurity",
      },
      {
        q: "How do you move healthcare systems to the cloud safely?",
        a: "In planned, reversible steps, each one tested before the next, with identity, network and data controls designed in from the start.",
        href: "/services/cloud-engineering",
      },
      {
        q: "Are you SOC 2 or ISO 27001 certified?",
        a: "No. We are not SOC 2 audited and do not hold ISO 27001. If your procurement process requires either, raise it early and we will tell you honestly whether we can meet the timeline.",
        href: "/security",
      },
    ],
  },
  "financial-services": {
    meta: {
      title: "Financial Services IT Staffing & Security",
      description:
        "Security, data and platform engineers for regulated financial systems that can't go down, with controls mapped to SOC 2 and NIST. Staffed or delivered.",
    },
    answer:
      "Oceanblue Solutions supplies security, data and platform engineers for regulated financial systems that can't go down. We map security controls to the frameworks you are measured against, build data platforms on Snowflake and Databricks, and move systems to the cloud in planned, reversible steps.",
    faqs: [
      {
        q: "What do you do for financial services firms?",
        a: "Most start with cybersecurity, AI and data, or cloud engineering, either as engineers placed in your team or as a project we deliver.",
        href: "/services",
      },
      {
        q: "Which frameworks do you align to?",
        a: "We map every control to the frameworks you report against, including SOC 2 and NIST, and keep the audit evidence as the work happens.",
        href: "/services/cybersecurity",
      },
      {
        q: "How do you change systems that can't go down?",
        a: "In planned, reversible steps, each one tested before the next, so the business keeps running throughout.",
        href: "/services/cloud-engineering",
      },
      {
        q: "Which data platforms do you use?",
        a: "Snowflake, Databricks and AWS. We are a technology partner of Snowflake and Databricks and an AWS Advanced Tier Services Partner.",
        href: "/services/ai-data",
      },
    ],
  },
  manufacturing: {
    meta: {
      title: "Manufacturing Engineering Staffing & ERP",
      description:
        "Mechanical, electrical and controls engineers alongside the IT that runs the plant, plus SAP, Oracle and Dynamics ERP and managed services from one team.",
    },
    answer:
      "Oceanblue Solutions places mechanical, electrical and controls engineers alongside the IT that runs the plant. The same team implements SAP, Oracle and Microsoft Dynamics ERP around the way the plant works, and can run the systems afterwards under one managed services agreement.",
    faqs: [
      {
        q: "Which engineering disciplines do you staff for manufacturers?",
        a: "Nine: mechanical, electrical and electronics, structural and civil, aerospace, manufacturing and industrial, controls and automation, quality and reliability, power and energy, and communications and RF.",
        href: "/services/engineering-talent",
      },
      {
        q: "Can you deliver a complete engineering project?",
        a: "Yes. A project team owns a defined engineering scope from start to finish under an outcome-based statement of work, as well as contract and direct-hire options.",
        href: "/how-we-work",
      },
      {
        q: "Which ERP systems do you implement?",
        a: "SAP, Oracle and Microsoft Dynamics, configured around your processes and connected to the systems around them so data moves without re-keying.",
        href: "/services/erp",
      },
      {
        q: "Can you support plant systems after go-live?",
        a: "Yes. Managed services covers monitoring, helpdesk, infrastructure management and patching on one SLA, with quarterly reviews.",
        href: "/services/managed-services",
      },
    ],
  },
  "retail-hospitality": {
    meta: {
      title: "Retail & Restaurant IT Staffing and ERP",
      description:
        "IT staffing, ERP and managed services for restaurant groups, wholesalers and retailers, from store systems to the back office, from one accountable team.",
    },
    answer:
      "Oceanblue Solutions supports restaurant groups, wholesalers and retailers with IT staffing, ERP and managed services, from the systems in the store to the back office. One team is accountable for the work, so there is one contact to call.",
    clients: ["City Barbeque", "Condado Tacos & Tequila", "Satya Wholesalers"],
    faqs: [
      {
        q: "What do you do for restaurant groups and retailers?",
        a: "Most start with IT staffing, ERP or managed services, covering store systems through to the back office.",
        href: "/services",
      },
      {
        q: "Can you run our systems day to day?",
        a: "Yes. Managed services covers around-the-clock monitoring, a service desk your staff can reach, patching and infrastructure management on one SLA.",
        href: "/services/managed-services",
      },
      {
        q: "Which ERP systems do you work with?",
        a: "SAP, Oracle and Microsoft Dynamics, implemented around the way your business works and supported by the same team after go-live.",
        href: "/services/erp",
      },
    ],
  },
};
