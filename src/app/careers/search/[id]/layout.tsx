import { notFound } from "next/navigation";
import { loadJob } from "./job";

/**
 * Existence check for the job detail route.
 *
 * It lives in the layout rather than page.tsx because loading.tsx wraps the
 * *page* in a Suspense boundary: Next flushes that shell — committing HTTP 200
 * — before the page body ever runs, so a notFound() thrown down there renders
 * the 404 UI under a 200 status. Every retired job URL answered 200 with a
 * "Job Not Found" body, which Google files as a soft 404 and never drops from
 * the index. A layout renders above that boundary, so throwing here still sets
 * the status.
 *
 * The read is shared with generateMetadata and the page through loadJob's
 * cache(), so the guard costs no extra round trip.
 */
export default async function JobDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let exists = false;
  try {
    const result = await loadJob(id);
    exists = Boolean(result.success && result.data);
  } catch (error) {
    console.error("Error checking job:", error);
  }

  if (!exists) notFound();

  return <>{children}</>;
}
