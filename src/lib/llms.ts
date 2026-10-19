// llms.txt and llms-full.txt (llmstxt.org): a plain-text map of the site for AI
// assistants. Built from site-content so it cannot drift from the pages.
import { company, services, industries, certifications, partners, officeAddresses, layers } from "./site-content";
import { FAQS } from "./faqs";
import { serviceFaqs } from "./service-pages";
import { ARTICLE_KINDS, ARTICLE_KIND_CONFIG } from "./articles";
import { getLiveArticles } from "./articles-public";
import { SITE_URL } from "./seo";

const url = (path: string) => `${SITE_URL}${path}`;

const facts = () => [
  `- Legal name: ${company.name}`,
  `- Founded: ${company.founded}, in Powell, Ohio (Columbus metro area)`,
  `- Headquarters: ${company.address.join(", ")}, United States`,
  `- Phone: ${company.phone}; email: ${company.email}; hours: ${company.hours}`,
  `- Ownership: minority-owned and women-owned`,
  `- Certifications: ${certifications.flatMap((c) => c.certs.map((x) => x.name)).join("; ")}`,
  `- Partners: ${partners.map((p) => `${p.name} (${p.tier})`).join("; ")}`,
  `- Offices: ${officeAddresses.map((o) => `${o.city}, ${o.country}`).join("; ")}`,
  `- Serves: enterprises and state government agencies across North America`,
];

async function articleLinks(): Promise<string[]> {
  const lines: string[] = [];
  for (const kind of ARTICLE_KINDS) {
    const live = await getLiveArticles(kind).catch(() => []);
    for (const a of live) {
      if (a.noIndex) continue;
      const summary = (a.seoDescription || a.excerpt || "").trim();
      lines.push(`- [${a.title}](${url(`${ARTICLE_KIND_CONFIG[kind].publicPath}/${a.slug}`)})${summary ? `: ${summary}` : ""}`);
    }
  }
  return lines;
}

export async function llmsTxt(full: boolean): Promise<string> {
  const out: string[] = [
    `# ${company.name}`,
    "",
    `> ${company.mission}`,
    "",
    `${company.position} Three practices: ${Object.values(layers).map((l) => `${l.name} (${l.summary.replace(/\.$/, "")})`).join("; ")}.`,
    "",
    "## Services",
    "",
  ];
  for (const s of services) {
    out.push(`- [${s.name}](${url(`/services/${s.slug}`)}): ${s.tagline}`);
    if (full) {
      out.push("", `  ${s.intro}`, "", `  ${s.facetsLabel}: ${s.facets.join("; ")}.`);
      for (const i of s.includes) out.push(`  - ${i.title}: ${i.body}`);
      for (const f of serviceFaqs[s.slug] ?? []) out.push(`  - Q: ${f.q} A: ${f.a}`);
      out.push("");
    }
  }

  out.push("", "## Industries", "");
  for (const i of industries) out.push(`- [${i.name}](${url(`/industries/${i.slug}`)}): ${i.body}`);
  out.push(`- Overview: ${url("/industries")}`);

  out.push(
    "",
    "## Company",
    "",
    `- [About](${url("/about")}): history, leadership and offices`,
    `- [How we work](${url("/how-we-work")}): engagement models and delivery`,
    `- [Certifications](${url("/certifications")}): MBE and WBE certifications and partners`,
    `- [Security](${url("/security")}): how client and candidate data is protected`,
    `- [Contact](${url("/contact")}): ${company.phone}, ${company.email}`,
    "",
    "## Careers",
    "",
    `- [Open jobs](${url("/jobs")}): current openings, updated daily`,
    `- [Careers](${url("/careers")}): working at Oceanblue`,
  );

  const articles = await articleLinks();
  if (articles.length) out.push("", "## Resources", "", ...articles);

  out.push("", "## Key facts", "", ...facts());

  if (full) {
    out.push("", "## Frequently asked questions", "");
    for (const f of FAQS) out.push(`### ${f.q}`, "", f.a, "");
  } else {
    out.push("", "## Optional", "", `- [Full text version](${url("/llms-full.txt")}): every service in full, plus answers to common questions`);
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
