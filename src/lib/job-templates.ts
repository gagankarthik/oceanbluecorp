// Posting skeletons per practice and job type, for "Insert template" in the job
// editor. Same idea as editorial.ts: the house structure lives beside the
// editor. Bracketed prompts are meant to be replaced; job-quality.ts flags any
// left behind. HTML stays inside the editor's subset (p, ul, li, strong, em).

export interface JobTemplate {
  practice: string;
  description: string;
  responsibilities: string;
  requirements: string;
  /** Suggested skills, 3–10 */
  skills: string[];
}

interface PracticeKit {
  /** What the team does, one clause */
  team: string;
  doing: string[];
  bring: string[];
  skills: string[];
}

const PRACTICES: Record<string, PracticeKit> = {
  "ERP Solutions": {
    team: "implements and supports ERP platforms for [client industry] organisations",
    doing: [
      "Configure and test [module, e.g. SAP FICO] to the agreed design",
      "Run requirement workshops and turn them into functional specifications",
      "Support data migration, cutover and hypercare",
      "Resolve production tickets within the agreed service levels",
    ],
    bring: [
      "[N]+ years hands-on with [ERP platform and modules]",
      "At least one full-cycle implementation, from blueprint to go-live",
      "Clear written specifications that developers can build from",
    ],
    skills: ["SAP S/4HANA", "SAP FICO", "Data migration", "Functional specifications", "Integration testing"],
  },
  "Cloud Services": {
    team: "designs, migrates and runs cloud infrastructure for [client industry] teams",
    doing: [
      "Build and maintain infrastructure as code for [AWS / Azure / GCP] environments",
      "Automate build, test and release pipelines",
      "Monitor cost, security and reliability, and fix what the numbers show",
      "Write runbooks the on-call team can follow at 3 a.m.",
    ],
    bring: [
      "[N]+ years running production workloads on [cloud provider]",
      "Infrastructure as code with [Terraform / CloudFormation / Bicep]",
      "CI/CD pipelines you have built, not only used",
    ],
    skills: ["AWS", "Terraform", "Kubernetes", "CI/CD", "Linux", "Python"],
  },
  "Data & AI": {
    team: "builds data platforms and machine-learning products for [client industry] organisations",
    doing: [
      "Design and build batch and streaming data pipelines",
      "Model data for analytics and reporting in [warehouse / lakehouse]",
      "Put models into production and monitor how they behave",
      "Work with analysts and product owners to define what good data looks like",
    ],
    bring: [
      "[N]+ years building data pipelines in production",
      "Strong SQL and [Python / Scala]",
      "Experience with [Spark / Databricks / Snowflake]",
    ],
    skills: ["Python", "SQL", "Spark", "Databricks", "Airflow", "Machine learning"],
  },
  Salesforce: {
    team: "implements and extends Salesforce for [client industry] sales and service teams",
    doing: [
      "Configure [Sales / Service / Experience] Cloud to the agreed design",
      "Build automation with Flow and, where needed, Apex",
      "Integrate Salesforce with [ERP / marketing / data] systems",
      "Run releases through sandboxes with tests and change records",
    ],
    bring: [
      "[N]+ years on the Salesforce platform",
      "Salesforce [Administrator / Platform Developer] certification",
      "Experience with data loads, sharing rules and security reviews",
    ],
    skills: ["Salesforce", "Apex", "Lightning Web Components", "Flow", "SOQL"],
  },
  Engineering: {
    team: "builds and maintains software products for [client industry] customers",
    doing: [
      "Design, build and ship features in [language / framework]",
      "Review code and keep the test suite trustworthy",
      "Work with product and design to size and shape the work",
      "Own what you ship in production, including fixes",
    ],
    bring: [
      "[N]+ years building production software in [language]",
      "Experience with [framework] and relational databases",
      "Comfort with automated testing and code review",
    ],
    skills: ["Java", "TypeScript", "React", "REST APIs", "SQL", "Git"],
  },
  "Information and Computers": {
    team: "keeps [client industry] systems, networks and end users running",
    doing: [
      "Support users across [hardware / software / accounts] by ticket, phone and on site",
      "Maintain servers, networks and endpoints to the agreed standards",
      "Document fixes so the next person solves them faster",
      "Escalate and follow through on incidents",
    ],
    bring: [
      "[N]+ years in IT support or systems administration",
      "Working knowledge of [Windows Server / Active Directory / networking]",
      "[Certification, e.g. CompTIA A+ / Network+], or equivalent experience",
    ],
    skills: ["Active Directory", "Windows Server", "Networking", "ServiceNow", "Microsoft 365"],
  },
  Training: {
    team: "designs and delivers training for [client industry] staff and system users",
    doing: [
      "Plan courses around what learners need to do on the job",
      "Deliver sessions in person and online to groups of [size]",
      "Write guides, exercises and quick-reference material",
      "Measure what learners can do afterwards and improve the course",
    ],
    bring: [
      "[N]+ years designing or delivering training",
      "Experience teaching [system or subject] to non-specialists",
      "Clear writing and a calm presence in front of a group",
    ],
    skills: ["Instructional design", "Facilitation", "eLearning", "Technical writing", "LMS"],
  },
  PMO: {
    team: "plans and governs [client industry] programmes so they land on time and on budget",
    doing: [
      "Build and keep the plan, RAID log and status reports current",
      "Run governance meetings and follow up on actions",
      "Track budget, resourcing and dependencies across workstreams",
      "Flag risk early, with a recommendation attached",
    ],
    bring: [
      "[N]+ years in project or programme management",
      "[PMP / PRINCE2 / Scrum] certification, or equivalent experience",
      "Experience reporting to senior stakeholders",
    ],
    skills: ["Project management", "Agile", "Jira", "Risk management", "Stakeholder management"],
  },
  Operations: {
    team: "runs the day-to-day operations behind [client industry] services",
    doing: [
      "Run [process] to the agreed service levels",
      "Track and report the numbers that show how the work is going",
      "Improve processes and document them",
      "Coordinate with [teams / vendors] to resolve issues",
    ],
    bring: [
      "[N]+ years in [operations area]",
      "Comfort with [tools, e.g. Excel / ServiceNow / ERP]",
      "Clear, prompt communication",
    ],
    skills: ["Process improvement", "Reporting", "Excel", "Vendor management", "Customer service"],
  },
};

const FALLBACK = PRACTICES.Engineering;

/** How the engagement reads in the opening paragraph, by job type. */
function engagement(type: string): string {
  switch (type) {
    case "contract":
      return "This is a [length]-month contract, [hours] hours a week, with possible extension.";
    case "contract-to-hire":
      return "This starts as a [length]-month contract with the intent to convert to a permanent role.";
    case "direct-hire":
      return "This is a permanent, direct-hire role with our client.";
    case "part-time":
      return "This is a part-time role, about [hours] hours a week.";
    case "managed-teams":
      return "You will join an Oceanblue delivery team working on [engagement].";
    default:
      return "This is a full-time, permanent role.";
  }
}

const ul = (items: string[]) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;

export function jobTemplate(practice: string, type: string): JobTemplate {
  const kit = PRACTICES[practice] ?? FALLBACK;
  return {
    practice: PRACTICES[practice] ? practice : "Engineering",
    description:
      `<p>Our client ${kit.team}. They need a [job title] to [the outcome this hire delivers in the first six months].</p>` +
      `<p>${engagement(type)} You will work with [team size and who you report to] from [location or remote arrangement].</p>` +
      `<p><strong>Why it matters:</strong> [what changes for the client when this work is done well].</p>`,
    responsibilities: ul(kit.doing),
    requirements: ul([...kit.bring, "<em>Nice to have:</em> [one or two skills that help but are not required]"]),
    skills: kit.skills,
  };
}
