import { getAllJobs } from "@/lib/aws/dynamodb";

const BASE = "https://oceanbluecorp.com";

type Entry = { url: string; lastmod?: string; changefreq?: string; priority?: number };

// Static public pages (kept in sync with the human sitemap at /sitemap)
const STATIC: Entry[] = [
  { url: BASE, changefreq: "weekly", priority: 1.0 },
  { url: `${BASE}/about`, changefreq: "monthly", priority: 0.8 },
  { url: `${BASE}/services`, changefreq: "monthly", priority: 0.9 },
  { url: `${BASE}/team`, changefreq: "monthly", priority: 0.7 },
  { url: `${BASE}/products`, changefreq: "monthly", priority: 0.75 },
  { url: `${BASE}/developers`, changefreq: "monthly", priority: 0.6 },
  { url: `${BASE}/brand-kit`, changefreq: "yearly", priority: 0.4 },
  { url: `${BASE}/careers`, changefreq: "daily", priority: 0.95 },
  { url: `${BASE}/careers/search`, changefreq: "daily", priority: 0.9 },
  { url: `${BASE}/resources`, changefreq: "weekly", priority: 0.7 },
  { url: `${BASE}/resources/blog`, changefreq: "weekly", priority: 0.65 },
  { url: `${BASE}/resources/case-studies`, changefreq: "monthly", priority: 0.6 },
  { url: `${BASE}/resources/ebook`, changefreq: "monthly", priority: 0.55 },
  { url: `${BASE}/contact`, changefreq: "monthly", priority: 0.75 },
  { url: `${BASE}/sitemap`, changefreq: "yearly", priority: 0.3 },
  { url: `${BASE}/privacy`, changefreq: "yearly", priority: 0.2 },
  { url: `${BASE}/terms`, changefreq: "yearly", priority: 0.2 },
  { url: `${BASE}/cookies`, changefreq: "yearly", priority: 0.1 },
  { url: `${BASE}/accessibility`, changefreq: "yearly", priority: 0.2 },
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
