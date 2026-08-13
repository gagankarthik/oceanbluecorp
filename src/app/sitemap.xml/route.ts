import { getAllJobs } from "@/lib/aws/dynamodb";
import { ARTICLE_KINDS, ARTICLE_KIND_CONFIG } from "@/lib/articles";
import { getLiveArticles } from "@/lib/articles-public";

const BASE = "https://oceanbluecorp.com";

type Entry = { url: string; lastmod?: string; changefreq?: string; priority?: number };

// Static public pages (kept in sync with the human sitemap at /sitemap)
const STATIC: Entry[] = [
  { url: BASE, changefreq: "weekly", priority: 1.0 },
  { url: `${BASE}/about`, changefreq: "monthly", priority: 0.8 },
  { url: `${BASE}/solutions`, changefreq: "monthly", priority: 0.9 },
  { url: `${BASE}/solutions/staffing`, changefreq: "monthly", priority: 0.85 },
  { url: `${BASE}/solutions/cloud`, changefreq: "monthly", priority: 0.85 },
  { url: `${BASE}/solutions/cybersecurity`, changefreq: "monthly", priority: 0.85 },
  { url: `${BASE}/solutions/erp`, changefreq: "monthly", priority: 0.85 },
  { url: `${BASE}/solutions/salesforce`, changefreq: "monthly", priority: 0.85 },
  { url: `${BASE}/solutions/ai`, changefreq: "monthly", priority: 0.85 },
  { url: `${BASE}/solutions/managed`, changefreq: "monthly", priority: 0.85 },
  { url: `${BASE}/solutions/transformation`, changefreq: "monthly", priority: 0.85 },
  { url: `${BASE}/solutions/engineering`, changefreq: "monthly", priority: 0.85 },
  { url: `${BASE}/team`, changefreq: "monthly", priority: 0.7 },
  { url: `${BASE}/products`, changefreq: "monthly", priority: 0.75 },
  { url: `${BASE}/developers`, changefreq: "monthly", priority: 0.6 },
  { url: `${BASE}/brand-kit`, changefreq: "yearly", priority: 0.4 },
  { url: `${BASE}/careers`, changefreq: "daily", priority: 0.95 },
  { url: `${BASE}/careers/search`, changefreq: "daily", priority: 0.9 },
  { url: `${BASE}/contact`, changefreq: "monthly", priority: 0.75 },
  { url: `${BASE}/faq`, changefreq: "monthly", priority: 0.6 },
  { url: `${BASE}/sitemap`, changefreq: "yearly", priority: 0.3 },
  // Security sits above the legal block: procurement reads it, and it is a
  // page we want indexed rather than merely available.
  { url: `${BASE}/security`, changefreq: "yearly", priority: 0.5 },
  { url: `${BASE}/legal`, changefreq: "yearly", priority: 0.35 },
  { url: `${BASE}/privacy`, changefreq: "yearly", priority: 0.2 },
  { url: `${BASE}/terms`, changefreq: "yearly", priority: 0.2 },
  { url: `${BASE}/cookies`, changefreq: "yearly", priority: 0.1 },
  { url: `${BASE}/accessibility`, changefreq: "yearly", priority: 0.2 },
  { url: `${BASE}/data-deletion`, changefreq: "yearly", priority: 0.2 },
];

// Re-build at most hourly (active job listings change).
export const revalidate = 3600;

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET() {
  const entries: Entry[] = [...STATIC];

  try {
    const result = await getAllJobs();
    if (result.success && result.data) {
      for (const job of result.data) {
        if (job.status === "active" || job.status === "open") {
          entries.push({
            url: `${BASE}/careers/search/${job.id}`,
            lastmod: new Date(job.updatedAt || job.createdAt).toISOString(),
            changefreq: "weekly",
            priority: 0.85,
          });
        }
      }
    }
  } catch {
    // Non-fatal: still serve the static URLs if the DB is unavailable.
  }

  /*
   * Published articles, and the section index once it holds anything.
   *
   * The four section pages are deliberately NOT in STATIC above. They carry
   * `robots: index:false` while empty (see sectionMetadata), and listing a page
   * in a sitemap while asking robots not to index it is a contradiction search
   * engines report as an error. Both come off together, driven by the same
   * fact: whether the section has a live entry.
   */
  try {
    for (const kind of ARTICLE_KINDS) {
      const articles = await getLiveArticles(kind);
      if (articles.length === 0) continue;

      const base = ARTICLE_KIND_CONFIG[kind].publicPath;
      entries.push({
        url: `${BASE}${base}`,
        lastmod: new Date(articles[0].publishedAt || articles[0].createdAt).toISOString(),
        changefreq: "weekly",
        priority: 0.7,
      });

      for (const article of articles) {
        // A piece marked "keep out of search results" is excluded here too,
        // otherwise the sitemap invites the crawler the page then turns away.
        if (article.noIndex) continue;
        entries.push({
          url: `${BASE}${base}/${article.slug}`,
          lastmod: new Date(article.updatedAt || article.publishedAt || article.createdAt).toISOString(),
          changefreq: "monthly",
          priority: 0.65,
        });
      }
    }
  } catch {
    // Non-fatal, same contract as the jobs block above.
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map((e) => {
        const parts = [`    <loc>${escapeXml(e.url)}</loc>`];
        if (e.lastmod) parts.push(`    <lastmod>${e.lastmod}</lastmod>`);
        if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
        if (e.priority !== undefined) parts.push(`    <priority>${e.priority.toFixed(1)}</priority>`);
        return `  <url>\n${parts.join("\n")}\n  </url>`;
      })
      .join("\n") +
    `\n</urlset>`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
