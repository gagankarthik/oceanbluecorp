import { MetadataRoute } from "next";
import { getAllJobs } from "@/lib/aws/dynamodb";

const BASE = "https://oceanbluecorp.com";

// Static public pages with tuned priority + change-frequency
const STATIC_PAGES: MetadataRoute.Sitemap = [
  {
    url: BASE,
    lastModified: new Date("2025-01-01"),
    changeFrequency: "weekly",
    priority: 1.0,
  },
  {
    url: `${BASE}/about`,
    lastModified: new Date("2025-01-01"),
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    url: `${BASE}/services`,
    lastModified: new Date("2025-01-01"),
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    url: `${BASE}/products`,
    lastModified: new Date("2025-01-01"),
    changeFrequency: "monthly",
    priority: 0.75,
  },
  // Careers — high-value for staffing SEO
  {
    url: `${BASE}/careers`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.95,
  },
  {
    url: `${BASE}/careers/search`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  },
  // Resources
  {
    url: `${BASE}/resources`,
    lastModified: new Date("2025-01-01"),
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    url: `${BASE}/resources/blog`,
    lastModified: new Date("2025-01-01"),
    changeFrequency: "weekly",
    priority: 0.65,
  },
  {
    url: `${BASE}/resources/case-studies`,
    lastModified: new Date("2025-01-01"),
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: `${BASE}/resources/ebook`,
    lastModified: new Date("2025-01-01"),
    changeFrequency: "monthly",
    priority: 0.55,
  },
  {
    url: `${BASE}/contact`,
    lastModified: new Date("2025-01-01"),
    changeFrequency: "monthly",
    priority: 0.75,
  },
  {
    url: `${BASE}/privacy`,
    lastModified: new Date("2025-01-01"),
    changeFrequency: "yearly",
    priority: 0.2,
  },
  {
    url: `${BASE}/terms`,
    lastModified: new Date("2025-01-01"),
    changeFrequency: "yearly",
    priority: 0.2,
  },
  {
    url: `${BASE}/cookies`,
    lastModified: new Date("2025-01-01"),
    changeFrequency: "yearly",
    priority: 0.1,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch active job listings to include individual job pages
  let jobPages: MetadataRoute.Sitemap = [];

  try {
    const result = await getAllJobs();
    if (result.success && result.data) {
      jobPages = result.data
        .filter((job) => job.status === "active" || job.status === "open")
        .map((job) => ({
          url: `${BASE}/careers/search/${job.id}`,
          // Use updatedAt when available so Googlebot re-crawls changed listings
          lastModified: new Date(job.updatedAt || job.createdAt),
          changeFrequency: "weekly" as const,
          priority: 0.85,
        }));
    }
  } catch {
    // Non-fatal: sitemap still serves all static pages if DB is unavailable
  }

  return [...STATIC_PAGES, ...jobPages];
}
