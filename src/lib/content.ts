import { getContentBlock } from "@/lib/aws/dynamodb";

/**
 * Sitewide announcement bar text/link, edited under /admin/content → Homepage.
 * Read by the root layout. The layout/pages are ISR (revalidate=60) and the
 * content API calls revalidatePath("/", "layout") on save, so clearing the
 * announcement removes the bar immediately, and within 60s as a fallback.
 */
export async function getAnnouncement(): Promise<{ text: string; href: string; scroll: boolean }> {
  const c = await getSiteContent("homepage");
  return {
    text: (c.announcement || "").trim(),
    href: (c.announcementHref || "").trim(),
    scroll: c.announcementScroll === "true",
  };
}

/**
 * Server-side reader for CMS content edited at /admin/content.
 * Returns the `fields` map for a page (e.g. "homepage", "services", "contact"),
 * or an empty object if the table is unavailable / not yet edited, so pages
 * always render with their hard-coded fallback copy and never break.
 */
export async function getSiteContent(pageId: string): Promise<Record<string, string>> {
  try {
    const res = await getContentBlock(pageId);
    if (res.success && res.data?.fields && typeof res.data.fields === "object") {
      return res.data.fields;
    }
  } catch {
    // swallow, fall back to static copy
  }
  return {};
}

/**
 * Site-wide maintenance switch, toggled at /admin/settings.
 *
 * Stored in the same content table as everything else and read by the root
 * layout, which is ISR at 60s; the settings API calls
 * revalidatePath("/", "layout") on save, so flipping it takes effect at once
 * rather than on the next revalidation.
 *
 * Deliberately NOT enforced in middleware. Middleware would need a database
 * read on every single request, and if that read failed the whole site would
 * go dark. Read here it fails safe: a lookup error returns `false` and the
 * site stays up, which is the correct way round for a switch whose job is
 * taking the site down.
 */
export async function getMaintenance(): Promise<{
  enabled: boolean;
  message: string;
  eta: string;
}> {
  const c = await getSiteContent("site");
  return {
    enabled: c.maintenance === "true",
    message: (c.maintenanceMessage || "").trim(),
    eta: (c.maintenanceEta || "").trim(),
  };
}
