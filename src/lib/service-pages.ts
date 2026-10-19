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
