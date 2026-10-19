/** The separate HR product (own user pool, own accounts); `ref` names the surface that linked to it. */
export function hrPortalUrl(ref: "website" | "portal" | "sign-in") {
  return `https://hr.oceanbluecorp.com/?ref=${ref}`;
}

export const company = {
  name: "Oceanblue Solutions, Inc.",
  short: "Oceanblue",
  phone: "+1 (614) 844-6925",
  phoneShort: "(614) 844-6925",
  tel: "tel:+16148446925",
  email: "hr@oceanbluecorp.com",
  address: ["9775 Fairway Drive, Suite C", "Powell, Ohio 43065"],
  founded: "August 8, 2013",
  hours: "Monday to Friday, 8 a.m. to 5 p.m. Eastern",
  motto: "The people behind the platform.",
  tagline: "The people, platforms, and partners you can rely on.",
  mission:
    "We help organizations build capable teams and dependable technology. From IT staffing and managed services to AI and infrastructure, we bring the right people and solutions to what’s next.",
  position:
    "The single accountable partner for the people, engineering, platforms and operations an enterprise runs on.",
  /** staff: sign-in for this site's portal. hr: the separate HR product, tagged with where the visit came from. */
  portals: {
    staff: "/auth/sign-in",
    hr: hrPortalUrl("website"),
  },
  social: {
    linkedin: "https://www.linkedin.com/company/ocean-blue-solutions-inc/",
    x: "https://x.com/OceanBlueSol",
    youtube: "https://www.youtube.com/@OceanBlueSolutions",
    instagram: "https://www.instagram.com/oceanbluesolutions",
  },
};

import type { PhotoKey } from "./photos";

/**
 * The bar above the navigation. Change the text and link here; give it a new
 * id whenever the message changes so visitors who dismissed the old one see it.
 * Set to null to hide the bar.
 */
export const announcement: { id: string; tag?: string; text: string; link: { href: string; label: string } } | null = {
  id: "now-hiring-2026",
  tag: "Now hiring",
  text: "Cloud, data, Salesforce, SAP and engineering roles in Ohio and remote across the US.",
  link: { href: "/jobs", label: "View open jobs" },
};

export type LayerId = "people" | "platforms" | "operations";

export const layers: Record<LayerId, { name: string; practice: string; summary: string }> = {
  people: {
    name: "People",
    practice: "Talent",
    summary: "Skilled people faster than you can hire them, and training for the team you already have.",
  },
  platforms: {
    name: "Platforms",
    practice: "Technology",
    summary: "We design, build and modernize the systems your business runs on.",
  },
  operations: {
    name: "Operations",
    practice: "Managed services",
    summary: "Once systems are live, we look after them around the clock on one SLA.",
  },
};

export type Service = {
  slug: string;
  layer: LayerId;
  name: string;
  tagline: string;
  intro: string;
  facetsLabel: string;
  facets: string[];
  includes: { title: string; body: string }[];
  image: string;
  photo: PhotoKey;
};

export const services: Service[] = [
  {
    slug: "it-staffing",
    layer: "people",
    name: "IT Staffing & Talent",
    tagline: "Engineers who join your team and own the work.",
    intro:
      "When you need skilled people faster than you can hire them, we supply them. Vetted engineers, developers, analysts and architects join your team and take ownership of the work, and we stay accountable for them for the length of the engagement.",
    facetsLabel: "Roles we place",
    facets: [
      "Cloud, data and security engineers",
      "Software engineers and developers",
      "AI and machine learning engineers",
      "Data scientists",
      "Data and business analysts",
      "Cloud and solution architects",
      "ERP and Salesforce specialists",
      "QA and DevOps engineers",
      "Project and program managers",
    ],
    includes: [
      { title: "Scoped roles", body: "We write the role with you before we search, so the shortlist matches the work, not a job title." },
      { title: "Technical screening", body: "Candidates are tested on the skills the role needs, by people who do that work." },
      { title: "Background and reference checks", body: "Done before anyone reaches your shortlist, not after you pick them." },
      { title: "A shortlist within 48 hours", body: "A short, matched list of candidates, not a stack of resumes." },
      { title: "One point of ownership", body: "We stay accountable through onboarding and for the length of the engagement." },
    ],
    image: "Engineer pairing with a client team member",
    photo: "engineerLaptop",
  },
  {
    slug: "engineering-talent",
    layer: "people",
    name: "Engineering Talent",
    tagline: "Physical engineering, staffed the same way.",
    intro:
      "Our engineering practice does for physical engineering what our IT practice does for software. We place engineers on contract, as direct hires, or as complete project teams that deliver a defined scope.",
    facetsLabel: "Disciplines",
    facets: [
      "Mechanical",
      "Electrical and electronics",
      "Structural and civil",
      "Aerospace",
      "Manufacturing and industrial",
      "Controls and automation",
      "Quality and reliability",
      "Power and energy",
      "Communications and RF",
    ],
    includes: [
      { title: "Contract engineers", body: "Specialists who join your project for as long as you need them." },
      { title: "Direct hire", body: "We find, screen and place permanent engineers on your staff." },
      { title: "Project teams", body: "A complete team that owns a defined engineering scope from start to finish." },
      { title: "Alongside your IT", body: "Controls and electrical engineers who work with the systems that run the plant." },
    ],
    image: "Controls engineer at a plant panel",
    photo: "plant",
  },
  {
    slug: "training",
    layer: "people",
    name: "Training & Upskilling",
    tagline: "Grow the team you already have.",
    intro:
      "The best long-term answer is often to grow the team you already have. Our instructors run courses on the stack you actually run, including preparation for professional certifications.",
    facetsLabel: "Course areas",
    facets: ["Cloud and DevOps", "Data, analytics and AI", "Security awareness and engineering", "ERP and Salesforce enablement"],
    includes: [
      { title: "Taught by practitioners", body: "Instructors who deliver this work for clients, with time for your team's real questions." },
      { title: "Built around your stack", body: "Labs and examples drawn from the platforms and tools your team runs, not a generic syllabus." },
      { title: "Certification preparation", body: "Structured preparation for the professional exams your team is working toward." },
      { title: "Measured", body: "Skills assessed before and after, so progress is visible." },
    ],
    image: "Instructor-led classroom session",
    photo: "notebookLaptop",
  },
  {
    slug: "cloud-engineering",
    layer: "platforms",
    name: "Cloud Engineering",
    tagline: "Move to the cloud without stopping the business.",
    intro:
      "Our cloud engineers move applications to AWS, Microsoft Azure and Google Cloud, then modernize them once they are there. We work in planned, reversible steps so the business keeps running throughout, with security and cost control designed in from the start.",
    facetsLabel: "Platforms",
    facets: ["AWS (Advanced Tier Services Partner)", "Microsoft Azure", "Google Cloud"],
    includes: [
      { title: "Migration", body: "Applications moved in planned, reversible steps, each one tested before the next." },
      { title: "Modernization", body: "Once workloads are in the cloud, we rebuild the parts that hold you back, with CI/CD and infrastructure as code." },
      { title: "Security from the start", body: "Identity, network and data controls designed in, not bolted on after go-live." },
      { title: "Cost control", body: "Sizing, tagging and budgets set up so the bill matches what you planned." },
    ],
    image: "Cloud architecture whiteboard session",
    photo: "workstation",
  },
  {
    slug: "cybersecurity",
    layer: "platforms",
    name: "Cybersecurity",
    tagline: "Protection that starts with the gaps an attacker would use.",
    intro:
      "Our cybersecurity team protects cloud environments, identity and applications. We start with the gaps an attacker would actually use, and map every control to the frameworks you must report against, so audits run on evidence instead of scrambles.",
    facetsLabel: "What we protect",
    facets: ["Cloud environments", "Identity and access", "Applications"],
    includes: [
      { title: "Risk-first priorities", body: "We fix what an attacker would reach first, not what is easiest to report." },
      { title: "Identity at the core", body: "Least-privilege access across your cloud and applications." },
      { title: "Framework mapping", body: "Every control mapped to the frameworks you are measured against." },
      { title: "Audit evidence", body: "Records kept as the work happens, so an audit is a review, not a project." },
    ],
    image: "Security engineer reviewing identity controls",
    photo: "keyboard",
  },
  {
    slug: "erp",
    layer: "platforms",
    name: "ERP Solutions",
    tagline: "ERP that fits the way your business works.",
    intro:
      "Our ERP team implements and integrates SAP, Oracle and Microsoft Dynamics to fit the way your business actually works, rather than asking your business to change around the software.",
    facetsLabel: "Platforms",
    facets: ["SAP", "Oracle", "Microsoft Dynamics"],
    includes: [
      { title: "Implementation", body: "Configured around your processes, with your people involved from the first workshop." },
      { title: "Integration", body: "Connected to the systems around it so data moves without re-keying." },
      { title: "Platform depth", body: "SAP, Oracle and Microsoft Dynamics specialists on one team." },
      { title: "Support after go-live", body: "The same team stays to fix, tune and extend what was built." },
    ],
    image: "Finance team working in an ERP system",
    photo: "deskTop",
  },
  {
    slug: "salesforce",
    layer: "platforms",
    name: "Salesforce Services",
    tagline: "Salesforce that serves the people who use it every day.",
    intro:
      "Our Salesforce team implements, develops, automates and administers Salesforce so it serves the people who use it every day, not just the people who bought it.",
    facetsLabel: "Clouds and tools",
    facets: ["Sales Cloud", "Service Cloud", "Apex", "Lightning Web Components"],
    includes: [
      { title: "Implementation", body: "Set up around how your sales and service teams actually work." },
      { title: "Development and automation", body: "Custom work and automated flows mapped to how your teams work, removing repetitive steps." },
      { title: "Integrated", body: "Connected to ERP, marketing and the rest of your systems." },
      { title: "Managed administration", body: "Ongoing admin so changes, users and data stay in order and the org stays clean as you grow." },
    ],
    image: "Sales team using a Salesforce dashboard",
    photo: "phoneLaptop",
  },
  {
    slug: "ai-data",
    layer: "platforms",
    name: "AI & Data Intelligence",
    tagline: "Practical AI, tied to real business decisions.",
    intro:
      "Our AI and data practice builds practical AI, automation and predictive analytics, along with the data engineering underneath them. The work is secure, tied to real decisions, and taken from pilot to production on Snowflake and Databricks.",
    facetsLabel: "Platforms",
    facets: ["Snowflake", "Databricks", "AWS"],
    includes: [
      { title: "Data engineering", body: "Pipelines, warehouses and BI your teams can query and trust." },
      { title: "Predictive analytics", body: "Models built around a decision someone actually has to make." },
      { title: "AI and automation", body: "Models taken from pilot to production, with the controls to run them safely." },
    ],
    image: "Data team reviewing a pipeline",
    photo: "windowDesk",
  },
  {
    slug: "digital-transformation",
    layer: "platforms",
    name: "Digital Transformation",
    tagline: "A roadmap with outcomes you can measure.",
    intro:
      "Our digital transformation practice sets the technology strategy, the architecture and a roadmap with outcomes that can be measured, then hands it to the same team that will build it.",
    facetsLabel: "Brings together",
    facets: ["Technology strategy", "Architecture", "Change management"],
    includes: [
      { title: "Strategy", body: "Where technology should take the business, written down and agreed." },
      { title: "Architecture", body: "The target design, and the steps to reach it from where you are." },
      { title: "Roadmap", body: "Work sequenced into stages, each with a measure of success agreed up front." },
      { title: "Value early", body: "Increments that deliver measurable wins along the way, not a big-bang gamble." },
    ],
    image: "Leadership roadmap workshop",
    photo: "teamTable",
  },
  {
    slug: "managed-services",
    layer: "operations",
    name: "Managed Services",
    tagline: "One team responsible. One number to call.",
    intro:
      "Once systems are live, someone has to look after them. Our managed services team monitors infrastructure and applications around the clock, runs the helpdesk, applies patches and manages the infrastructure, all to one service level agreement.",
    facetsLabel: "Covered",
    facets: [
      "Monitoring and response, around the clock",
      "Helpdesk and application support",
      "Cloud and infrastructure management",
      "Security monitoring",
      "Patch and release management",
      "Quarterly business reviews",
    ],
    includes: [
      { title: "24/7 monitoring", body: "Infrastructure and applications watched day and night, with alerts that reach a person." },
      { title: "Service desk", body: "A service desk your staff can reach, run by the team that knows your systems." },
      { title: "Patch management", body: "Updates applied on a schedule you agree, tested before they reach production." },
      { title: "Infrastructure management", body: "Servers, networks and cloud accounts kept healthy, sized and documented." },
      { title: "One SLA for everything", body: "All of it on one service level agreement, one team and one number to call, with improvements reviewed every quarter." },
    ],
    image: "Operations center or on-call engineer",
    photo: "console",
  },
];

export const servicesByLayer = (layer: LayerId) => services.filter((s) => s.layer === layer);
export const getService = (slug: string) => services.find((s) => s.slug === slug);

export const steps = [
  {
    name: "Discovery",
    body: "We learn the business, the constraints and the outcome that matters before proposing anything.",
    detail: ["Interviews with the people who own the outcome", "A look at the systems and teams as they are today", "Constraints written down: budget, timing, compliance"],
  },
  {
    name: "Strategy",
    body: "We design the solution and the roadmap with you, with success measures agreed up front.",
    detail: ["Options with trade-offs, not a single pitch", "A roadmap broken into stages", "Measures of success both sides sign off on"],
  },
  {
    name: "Implementation",
    body: "We deliver in short increments: working software, and people who fit the team.",
    detail: ["Short delivery cycles you can see and test", "People placed into your team, not beside it", "Progress reported against the agreed measures"],
  },
  {
    name: "Optimization",
    body: "We monitor, review and improve against the SLA, with quarterly reviews.",
    detail: ["Monitoring against the service levels", "A review with you every quarter", "Improvements planned from what the numbers show"],
  },
];

export const models = [
  { name: "Contract", body: "Specialists join your team for as long as you need them, scaling up or down as the workload moves.", direct: "You", owns: "You, with our people accountable" },
  { name: "Contract-to-hire", body: "Prove the fit on a real deliverable before you bring someone on permanently.", direct: "You", owns: "You, with our people accountable" },
  { name: "Direct hire", body: "We run the search and vetting, and you make the permanent hire.", direct: "You", owns: "You" },
  { name: "Project team", body: "A team under an outcome-based statement of work: we own scope, staffing and delivery from start to finish.", direct: "We do", owns: "We do" },
  { name: "Managed services", body: "We run the work for you, measured against one SLA.", direct: "We do", owns: "We do, to the SLA" },
];

export const industries = [
  {
    slug: "government",
    name: "Government and public sector",
    short: "Public sector",
    tagline: "Certified staffing for state agencies",
    body: "Staff augmentation and managed services for state agencies, from a certified MBE and WBE supplier. Work placed with us counts toward your supplier-diversity goals.",
    services: ["it-staffing", "managed-services", "cybersecurity"],
    image: "State agency workplace",
    photo: "civicDome" as PhotoKey,
  },
  {
    slug: "healthcare",
    name: "Healthcare",
    short: "Healthcare",
    tagline: "Secure systems for patient data",
    body: "Cloud, data and application specialists for the systems that hold patient information, where security and uptime are not optional.",
    services: ["cloud-engineering", "ai-data", "it-staffing"],
    image: "Healthcare IT team",
    photo: "tablet" as PhotoKey,
  },
  {
    slug: "financial-services",
    name: "Financial services",
    short: "Financial services",
    tagline: "Engineering for regulated platforms",
    body: "Security, data and platform engineers for regulated systems that can't go down.",
    services: ["cybersecurity", "ai-data", "cloud-engineering"],
    image: "Financial operations floor",
    photo: "skyline" as PhotoKey,
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    short: "Manufacturing",
    tagline: "Engineers for the plant and its IT",
    body: "Mechanical, electrical and controls engineers working alongside the IT that runs the plant.",
    services: ["engineering-talent", "erp", "managed-services"],
    image: "Plant floor with controls engineer",
    photo: "plant" as PhotoKey,
  },
  {
    slug: "retail-hospitality",
    name: "Retail and hospitality",
    short: "Retail and hospitality",
    tagline: "Store systems and back-office support",
    body: "Technology and staffing support for restaurant groups, wholesalers and retailers, from store systems to the back office.",
    services: ["it-staffing", "erp", "managed-services"],
    image: "Restaurant or store operations",
    photo: "restaurant" as PhotoKey,
  },
];

export const certifications = [
  {
    level: "National",
    who: "Corporate supplier-diversity programs",
    certs: [
      {
        name: "NMSDC certified MBE",
        issuer: "National Minority Supplier Development Council",
        body: "The national body that certifies minority-owned businesses for corporate supplier-diversity programs. Enterprise procurement teams use it to find and count minority-owned suppliers, so work with us counts toward diverse spend.",
      },
    ],
  },
  {
    level: "State",
    who: "Ohio agency set-asides and spending goals",
    certs: [
      {
        name: "State of Ohio MBE",
        issuer: "State of Ohio",
        body: "State agencies in Ohio set aside contracts and spending goals for certified minority businesses. This makes us eligible for that work and countable toward those goals.",
      },
      {
        name: "State of Ohio WBE",
        issuer: "State of Ohio",
        body: "Certified as a women-owned business. Agencies and companies with women-owned business goals can count work placed with us toward them.",
      },
    ],
  },
  {
    level: "City",
    who: "City of Columbus contracts",
    certs: [
      {
        name: "City of Columbus MBE",
        issuer: "City of Columbus, Office of Diversity and Inclusion",
        body: "Makes us eligible for the City's minority business participation goals on city contracts in Columbus, our home region.",
      },
    ],
  },
];

export const partners = [
  {
    name: "AWS",
    tier: "Advanced Tier Services Partner",
    body: "AWS awards Advanced Tier to partners with proven experience delivering AWS projects. Our cloud engineers design, migrate and run workloads to AWS's own standards.",
  },
  {
    name: "Snowflake",
    tier: "Technology partner",
    body: "We build data warehouses and analytics on Snowflake that teams can query and trust.",
  },
  {
    name: "Databricks",
    tier: "Technology partner",
    body: "We build data pipelines on Databricks and take machine learning and AI models from pilot to production.",
  },
];

export const milestones: { year: string; title: string; text: string; icon: "flag" | "document" | "building" | "globe" | "spark" }[] = [
  { year: "2013", title: "Company founded", text: "Oceanblue opened in Ohio with a vision to transform enterprise IT.", icon: "flag" },
  {
    year: "2015",
    title: "Breakthrough engagement",
    text: "Signed our first Master Service Agreement with a prime vendor, establishing credibility as a delivery partner.",
    icon: "document",
  },
  {
    year: "2021",
    title: "Enterprise trust",
    text: "Secured an MSA with a Fortune 500 client, taking our teams into enterprise-scale programs.",
    icon: "building",
  },
  {
    year: "2022",
    title: "Global delivery",
    text: "Opened a delivery center in India with local operations, adding a second hub alongside the US.",
    icon: "globe",
  },
  {
    year: "2024",
    title: "Major expansion",
    text: "Opened offices in the United Kingdom to strengthen our European presence and client service.",
    icon: "globe",
  },
  { year: "2025", title: "AI expertise", text: "Launched a dedicated AI practice that takes models from pilot to production.", icon: "spark" },
]

/** Office locations. Add an address to show it on the contact page with directions. */
export const offices: {
  place: string;
  country: string;
  role: string;
  since: string;
  tz: string;
  image: string;
  photo: PhotoKey;
  address?: string[];
}[] = [
  { place: "Powell, Ohio", country: "United States", address: ["9775 Fairway Drive, Suite C", "Powell, Ohio 43065"], role: "Headquarters", since: "2013", tz: "America/New_York", image: "Powell, Ohio headquarters", photo: "columbusRiver" as PhotoKey },
  { place: "India", country: "India", role: "Delivery center", since: "2022", tz: "Asia/Kolkata", image: "India delivery center team", photo: "litOffice" as PhotoKey },
  { place: "United Kingdom", country: "United Kingdom", role: "Offices", since: "2024", tz: "Europe/London", image: "United Kingdom office", photo: "londonNight" as PhotoKey },
];

/** Every office with a street address, in the order the contact page lists them. */
export const officeAddresses: {
  city: string;
  country: string;
  address: string[];
  phone?: string;
  hq?: boolean;
}[] = [
  { city: "Powell, Ohio", country: "United States", address: ["9775 Fairway Drive, Suite C", "Powell, Ohio 43065"], phone: "+1 (614) 844-6925", hq: true },
  { city: "Hyderabad", country: "India", address: ["13th Floor, Building 9, Raheja Mindspace", "Madhapur, Hyderabad 500081"], phone: "+91 814 312 4665" },
  { city: "Vizianagaram", country: "India", address: ["Plot No. 87, CMR Green Field Layout", "Vizianagaram, Andhra Pradesh 535004"], phone: "+91 814 294 9111" },
  { city: "London", country: "United Kingdom", address: ["910 London Road, Thornton Heath", "London CR7 7PE"] },
];

/** Digits only, so a tel: link dials from a phone. */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** No photographs of these people, so they are shown as initials, never a stand-in face. */
export const leadership: { name: string; role: string; linkedin?: string }[] = [
  { name: "Sarojini Gude", role: "President" },
  { name: "Brent Wallace", role: "SVP, Workforce Solutions", linkedin: "https://www.linkedin.com/in/brentwallace1/" },
  { name: "Sushma Moturu", role: "Human Resource Director", linkedin: "https://www.linkedin.com/in/sushma-moturu-4ba752236/" },
  { name: "Clark Cristofoli", role: "Executive Recruiter", linkedin: "https://www.linkedin.com/in/clark-cristofoli-0402b988/" },
];

export const clients = [
  "Ohio Department of Development",
  "Diebold Nixdorf",
  "PivotPoint",
  "City Barbeque",
  "Satya Wholesalers",
  "Condado Tacos & Tequila",
];

/** company and logo are shown on each quote; logo is optional until supplied */
export const testimonials: { quote: string; name: string; role: string; company: string; logo?: string; logoOnDark?: boolean }[] = [
  {
    quote:
      "Oceanblue's resources demonstrated high levels of skill and professionalism, delivering quality results that met our expectations and deadlines.",
    name: "Damodar B.",
    role: "Project Director, Diebold Nixdorf",
    company: "Diebold Nixdorf",
    logo: "/logos/clients/diebold-nixdorf.svg",
  },
  {
    quote:
      "Oceanblue operates as a true strategic partner. Their team brings deep expertise, a disciplined approach to execution, and a consistent commitment to quality.",
    name: "Brian K.",
    role: "Co-Founder, Pivotpoint",
    company: "Pivotpoint",
    logo: "/logos/clients/pivotpoint.png",
    logoOnDark: true,
  },
  {
    quote:
      "I have partnered with Oceanblue for many years. They are trustworthy, honest, motivated, and bring a high degree of work ethic to everything they do.",
    name: "Ken H.",
    role: "Senior Account Executive, Mapsys, Inc.",
    company: "Mapsys, Inc.",
    logo: "/logos/clients/mapsys.png",
    logoOnDark: true,
  },
];

export const reasons = [
  { title: "One accountable partner", body: "One team, one contract, one person who answers for it." },
  { title: "Certified diverse supplier", body: "NMSDC, State of Ohio and City of Columbus certifications, so programs with supplier-diversity goals can buy through us." },
  { title: "Hands-on platform expertise", body: "Our cloud, data and AI work runs on AWS, Snowflake and Databricks." },
  { title: "Thirteen years of delivery", body: "From a single Ohio office in 2013 to delivery in the US, India and the UK." },
];
