import {
  Users, Cloud, Shield, Database, Settings, Cpu, Headphones, Lightbulb,
  Clock, ShieldCheck, Layers, GitBranch, Gauge, LockKeyhole, Workflow,
  BarChart3, RefreshCw, LineChart, Boxes, Plug, Sparkles, HeartPulse,
  Map, Rocket, type LucideIcon,
} from "lucide-react";
import { IMG } from "@/components/landing/media";

/* ============================================================
   Per-solution page content. Each entry powers a dedicated,
   self-contained /solutions/<slug> page — no shared landing
   sections (stats / certifications) are repeated here.
   ============================================================ */

export type Highlight = { icon: LucideIcon; title: string; desc: string };
export type Step = { title: string; desc: string };

export type SolutionPage = {
  slug: string;
  icon: LucideIcon;
  image: string;
  eyebrow: string;
  title: string;
  lede: string;
  tags?: string[];
  overviewHeading: string;
  overviewBody: string;
  capabilities: string[];
  highlights: Highlight[];
  approach: Step[];
  meta: { title: string; description: string; keywords: string[] };
};

export const SOLUTIONS: Record<string, SolutionPage> = {
  staffing: {
    slug: "staffing",
    icon: Users,
    image: IMG.serviceTalent,
    eyebrow: "IT Staffing & Talent",
    title: "Specialists who deliver from the first sprint.",
    lede: "Pre-vetted engineers who integrate into your team and own the work, on flexible or permanent terms, or as a fully managed team.",
    tags: ["By the project", "Try before you hire", "Permanent hire", "Managed teams"],
    overviewHeading: "Talent that fits the role and the team.",
    overviewBody:
      "We place cloud, data, security, ERP, and Salesforce specialists who own outcomes, not just seats. You get a curated shortlist matched to the skills, the seniority, and the way your team works — typically within 48 hours of an agreed scope.",
    capabilities: [
      "Cloud, data & security engineers",
      "ERP & Salesforce specialists",
      "AI/ML engineers & data scientists",
      "Project & program managers",
      "Flexible or permanent hiring",
      "Shortlists in 48 hours",
    ],
    highlights: [
      { icon: Users, title: "Embedded specialists", desc: "Engineers who join your team and own the work — not a résumé firehose." },
      { icon: Clock, title: "48-hour shortlists", desc: "A curated shortlist matched to the role, delivered fast." },
      { icon: ShieldCheck, title: "Vetted & accountable", desc: "Technical screening, reference checks, and one point of ownership." },
    ],
    approach: [
      { title: "Scope the role", desc: "We learn the skills, seniority, and team dynamics before sourcing anyone." },
      { title: "Source & vet", desc: "Technical screening, background and reference checks against your bar." },
      { title: "Shortlist in 48h", desc: "A short, curated list that fits — not a stack of maybes." },
      { title: "Onboard & support", desc: "We stay accountable through onboarding and the length of the engagement." },
    ],
    meta: {
      title: "IT Staffing & Talent",
      description:
        "Pre-vetted cloud, data, security, ERP, Salesforce, and AI specialists embedded into your team on flexible or permanent terms. Shortlists in 48 hours.",
      keywords: ["IT staffing", "technical recruiting", "contract IT staffing", "direct placement", "managed teams", "cloud engineer staffing"],
    },
  },

  cloud: {
    slug: "cloud",
    icon: Cloud,
    image: IMG.serviceSolutions,
    eyebrow: "Cloud Engineering",
    title: "Migrate, modernize, and scale without downtime.",
    lede: "Cloud migration and modernization with security and performance engineered in from the start.",
    tags: ["AWS", "Azure", "GCP", "DevOps"],
    overviewHeading: "Cloud that is built to run, not just to launch.",
    overviewBody:
      "We move workloads to the cloud and modernize the ones already there — with landing zones, infrastructure-as-code, and observability so nothing is a black box. Performance, cost, and security are engineering requirements, not afterthoughts.",
    capabilities: [
      "Migration — AWS, Azure, GCP",
      "Infrastructure modernization",
      "DevOps & CI/CD automation",
      "Landing zones & infrastructure-as-code",
      "Observability & performance tuning",
      "Cost optimization (FinOps)",
    ],
    highlights: [
      { icon: GitBranch, title: "Automated delivery", desc: "CI/CD pipelines and IaC so releases are repeatable and safe." },
      { icon: Gauge, title: "Performance & cost", desc: "Tuned for the workload and the bill — observed, not assumed." },
      { icon: LockKeyhole, title: "Secure by default", desc: "Identity, network, and data controls built into the architecture." },
    ],
    approach: [
      { title: "Assess", desc: "We map workloads, dependencies, and the target architecture up front." },
      { title: "Design", desc: "Landing zones, security guardrails, and a migration plan agreed together." },
      { title: "Migrate", desc: "Move in safe increments with automation and rollback at every step." },
      { title: "Optimize", desc: "Continuous tuning for performance, reliability, and cost." },
    ],
    meta: {
      title: "Cloud Engineering",
      description:
        "Cloud migration, modernization, and DevOps across AWS, Azure, and GCP — landing zones, infrastructure-as-code, observability, and FinOps cost optimization.",
      keywords: ["cloud migration", "cloud engineering", "AWS Azure GCP", "DevOps", "infrastructure as code", "FinOps"],
    },
  },

  cybersecurity: {
    slug: "cybersecurity",
    icon: Shield,
    image: IMG.heroSlides[2],
    eyebrow: "Cybersecurity",
    title: "Protect what matters across cloud, identity, and apps.",
    lede: "Proactive, compliance-aligned security that reduces real risk instead of generating noise.",
    tags: ["HIPAA", "SOC 2", "NIST"],
    overviewHeading: "Security that is measured by risk reduced.",
    overviewBody:
      "We assess, harden, and monitor across your cloud, identity, and application layers — aligned to the frameworks you are held to. The goal is fewer exploitable gaps and a program you can evidence to auditors and customers.",
    capabilities: [
      "Security assessments & hardening",
      "Identity & access management",
      "Vulnerability management",
      "Cloud security posture (CSPM)",
      "HIPAA, SOC 2, NIST compliance",
      "Incident response readiness",
    ],
    highlights: [
      { icon: ShieldCheck, title: "Risk-first", desc: "We prioritize the gaps an attacker would actually use." },
      { icon: LockKeyhole, title: "Identity at the core", desc: "Least-privilege access across your cloud and applications." },
      { icon: BarChart3, title: "Audit-ready", desc: "Evidence and controls mapped to the frameworks you report against." },
    ],
    approach: [
      { title: "Assess", desc: "Baseline your posture across cloud, identity, and applications." },
      { title: "Prioritize", desc: "Rank findings by exploitability and business impact." },
      { title: "Harden", desc: "Close the gaps that matter and codify the controls." },
      { title: "Monitor", desc: "Continuous visibility and response readiness over time." },
    ],
    meta: {
      title: "Cybersecurity",
      description:
        "Proactive, compliance-aligned cybersecurity — assessments, identity & access management, vulnerability management, cloud security posture, and HIPAA / SOC 2 / NIST readiness.",
      keywords: ["cybersecurity services", "IAM", "vulnerability management", "cloud security", "SOC 2", "HIPAA compliance", "NIST"],
    },
  },

  erp: {
    slug: "erp",
    icon: Database,
    image: IMG.productAts,
    eyebrow: "ERP Solutions",
    title: "ERP that fits the way you work.",
    lede: "Implementations, integrations, and optimizations that make your ERP an asset, not an obstacle.",
    tags: ["SAP", "Oracle", "Dynamics"],
    overviewHeading: "From implementation to the value that follows.",
    overviewBody:
      "We deliver ERP implementations and upgrades, integrate them with the rest of your stack, and keep them optimized. The measure of success is a system your teams actually want to use — with clean data and reporting they trust.",
    capabilities: [
      "Implementations & upgrades",
      "Custom development & extensions",
      "Integrations & data migration",
      "Process design & optimization",
      "Reporting & analytics",
      "Ongoing support",
    ],
    highlights: [
      { icon: Boxes, title: "Platform depth", desc: "SAP, Oracle, and Microsoft Dynamics specialists on one team." },
      { icon: Plug, title: "Connected", desc: "Integrated cleanly with the systems around it — no islands." },
      { icon: LineChart, title: "Reporting you trust", desc: "Clean data and analytics that inform real decisions." },
    ],
    approach: [
      { title: "Discover", desc: "Map the processes, data, and outcomes the ERP has to serve." },
      { title: "Design", desc: "Configuration, extensions, and integrations planned together." },
      { title: "Implement", desc: "Deliver in increments with migration and testing at each step." },
      { title: "Support", desc: "Optimize, extend, and support as the business evolves." },
    ],
    meta: {
      title: "ERP Solutions",
      description:
        "ERP implementations, upgrades, integrations, and optimization across SAP, Oracle, and Microsoft Dynamics — with clean data migration, reporting, and ongoing support.",
      keywords: ["ERP solutions", "SAP implementation", "Oracle ERP", "Microsoft Dynamics", "ERP integration", "ERP support"],
    },
  },

  salesforce: {
    slug: "salesforce",
    icon: Settings,
    image: IMG.productPortal,
    eyebrow: "Salesforce Services",
    title: "Salesforce that works the way your teams do.",
    lede: "We implement, automate, and support Salesforce for better visibility and performance.",
    tags: ["Sales Cloud", "Service Cloud", "Apex", "LWC"],
    overviewHeading: "A CRM that drives adoption, not workarounds.",
    overviewBody:
      "From multi-cloud implementations to Apex and Lightning development, we make Salesforce fit your process — then keep it healthy with managed admin services. The result is cleaner data, useful automation, and reporting leaders act on.",
    capabilities: [
      "Multi-cloud implementations",
      "Apex & Lightning (LWC) development",
      "Workflow & process automation",
      "Integrations with your stack",
      "Data quality & reporting",
      "Managed admin services",
    ],
    highlights: [
      { icon: Workflow, title: "Automation that fits", desc: "Flows and logic mapped to how your teams actually work." },
      { icon: Plug, title: "Integrated", desc: "Connected to ERP, marketing, and the rest of your systems." },
      { icon: HeartPulse, title: "Kept healthy", desc: "Managed admin so the org stays clean as you grow." },
    ],
    approach: [
      { title: "Discover", desc: "Understand the process, the users, and the reporting that matters." },
      { title: "Configure", desc: "Implement and customize with automation and integrations." },
      { title: "Enable", desc: "Roll out with training so adoption actually sticks." },
      { title: "Support", desc: "Managed admin and continuous improvement over time." },
    ],
    meta: {
      title: "Salesforce Services",
      description:
        "Salesforce implementation, Apex & LWC development, workflow automation, integrations, and managed admin services — for cleaner data, better adoption, and reporting you can act on.",
      keywords: ["Salesforce services", "Salesforce implementation", "Apex development", "Lightning Web Components", "Salesforce admin", "CRM automation"],
    },
  },

  ai: {
    slug: "ai",
    icon: Cpu,
    image: IMG.insightCloud,
    eyebrow: "AI & Data Intelligence",
    title: "Practical AI, secure and built for the business.",
    lede: "From document processing to predictive analytics, we ship AI that produces real outcomes.",
    tags: ["Automation", "Analytics", "LLMs", "Data engineering"],
    overviewHeading: "AI that is useful, governed, and in production.",
    overviewBody:
      "We start with a business problem, not a model. Then we engineer the data foundation, ship automation and analytics that hold up in production, and govern it so security and accuracy are never an afterthought.",
    capabilities: [
      "Workflow & document automation",
      "Predictive analytics",
      "LLM integrations & assistants",
      "Data engineering & BI",
      "ML operations (MLOps)",
      "Governance & security",
    ],
    highlights: [
      { icon: Sparkles, title: "Outcome-first", desc: "We target a measurable result, then build to it." },
      { icon: Database, title: "Solid data foundation", desc: "Pipelines and BI that make AI trustworthy." },
      { icon: ShieldCheck, title: "Governed & secure", desc: "Controls for accuracy, privacy, and compliance." },
    ],
    approach: [
      { title: "Frame", desc: "Define the business outcome and how success is measured." },
      { title: "Engineer data", desc: "Build the pipelines and foundation the use case needs." },
      { title: "Build & ship", desc: "Deliver automation or analytics that survive production." },
      { title: "Govern", desc: "Monitor accuracy, security, and drift over time." },
    ],
    meta: {
      title: "AI & Data Intelligence",
      description:
        "Business-first AI and data services — workflow and document automation, predictive analytics, LLM integrations, data engineering, BI, and MLOps with governance and security built in.",
      keywords: ["AI services", "data intelligence", "predictive analytics", "LLM integration", "data engineering", "MLOps", "workflow automation"],
    },
  },

  managed: {
    slug: "managed",
    icon: Headphones,
    image: IMG.serviceManaged,
    eyebrow: "Managed Services",
    title: "Run and optimize, 24/7, on one accountable SLA.",
    lede: "Monitoring, support, and continuous optimization around the clock — one team, one SLA, one number to call.",
    tags: ["24/7", "One SLA", "QBRs"],
    overviewHeading: "The people who build it are the people who run it.",
    overviewBody:
      "We keep systems healthy with monitoring, helpdesk, and infrastructure management — then improve them through the same team that knows how they were built. You get consolidated accountability and quarterly reviews against the outcomes you set.",
    capabilities: [
      "24/7 monitoring & response",
      "Helpdesk & application support",
      "Cloud & infrastructure management",
      "Security monitoring",
      "Patch & release management",
      "Quarterly business reviews",
    ],
    highlights: [
      { icon: Clock, title: "Around the clock", desc: "Monitoring and response 24/7, so issues are caught early." },
      { icon: ShieldCheck, title: "One accountable SLA", desc: "A single team and number to call — no finger-pointing." },
      { icon: RefreshCw, title: "Always improving", desc: "Continuous optimization, reviewed with you every quarter." },
    ],
    approach: [
      { title: "Onboard", desc: "We learn your environment and set the SLA and runbooks." },
      { title: "Monitor", desc: "24/7 visibility across applications and infrastructure." },
      { title: "Respond", desc: "Resolve incidents fast against agreed response targets." },
      { title: "Review", desc: "Optimize continuously and report in quarterly reviews." },
    ],
    meta: {
      title: "Managed Services",
      description:
        "24/7 managed services — monitoring, helpdesk and application support, cloud and infrastructure management, security monitoring, and quarterly business reviews on one accountable SLA.",
      keywords: ["managed services", "24/7 monitoring", "IT helpdesk", "infrastructure management", "application support", "managed SLA"],
    },
  },

  transformation: {
    slug: "transformation",
    icon: Lightbulb,
    image: IMG.productsHero,
    eyebrow: "Digital Transformation",
    title: "Modernize with a roadmap and measurable outcomes.",
    lede: "We modernize processes, improve workflows, and adopt the right technologies — with a clear plan you can hold us to.",
    tags: ["Strategy", "Architecture", "Change management"],
    overviewHeading: "Transformation, sequenced to reduce risk.",
    overviewBody:
      "We align technology decisions to business outcomes, then sequence the work so value shows up early and risk stays low. Strategy, architecture, and change management come together — with KPIs agreed up front.",
    capabilities: [
      "Technology strategy",
      "Architecture & roadmaps",
      "Process optimization",
      "Application & platform modernization",
      "Change management & training",
      "KPIs & measurement",
    ],
    highlights: [
      { icon: Map, title: "Clear roadmap", desc: "A sequenced plan tied to outcomes, not a big-bang gamble." },
      { icon: Layers, title: "Architecture-led", desc: "Decisions that hold up as the business scales." },
      { icon: Rocket, title: "Value early", desc: "Increments that deliver measurable wins along the way." },
    ],
    approach: [
      { title: "Assess", desc: "Understand the current state, constraints, and target outcomes." },
      { title: "Strategize", desc: "Define the roadmap, architecture, and success metrics together." },
      { title: "Execute", desc: "Modernize in increments, shipping value as you go." },
      { title: "Measure", desc: "Track KPIs and adjust the plan against real results." },
    ],
    meta: {
      title: "Digital Transformation",
      description:
        "Digital transformation with a clear roadmap — technology strategy, architecture, process optimization, modernization, and change management with KPIs agreed up front.",
      keywords: ["digital transformation", "technology strategy", "IT roadmap", "application modernization", "process optimization", "change management"],
    },
  },
};

export const SOLUTION_SLUGS = Object.keys(SOLUTIONS);

// Sibling order for the "related solutions" cross-links at the bottom of each page.
export const SOLUTION_ORDER = [
  "staffing", "cloud", "cybersecurity", "erp", "salesforce", "ai", "managed", "transformation",
];
