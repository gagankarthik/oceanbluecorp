import { NextRequest, NextResponse } from "next/server";
import {
  getArticle,
  getAllArticles,
  updateArticle,
  deleteArticle,
  toPublicArticle,
  type Article,
  type ArticleKind,
} from "@/lib/aws/dynamodb";
import { requirePublisher, getClaims } from "@/lib/auth/verify";
import { hasPublishingAccess } from "@/lib/auth/config";
import { validate, validationMessage } from "@/lib/validate";
import { revalidateSection, sanitizeArticleHtml } from "@/lib/articles-server";
import {
  ARTICLE_SCHEMA,
  isLive,
  isPublishIntent,
  normalizeMetrics,
  publishBlockers,
  readingMinutes,
  slugify,
  uniqueSlug,
} from "@/lib/articles";

/** GET /api/articles/[id]. Anonymous callers see it only once it is live. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await getArticle(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to fetch article" }, { status: 500 });
    }
    if (!result.data) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const claims = await getClaims(request);
    const isStaff = !!claims && hasPublishingAccess(claims.groups);

    if (!isStaff) {
      // A draft answers 404, not 403: confirming that an unpublished piece
      // exists at a guessable id is itself a leak.
      if (!isLive(result.data)) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 });
      }
      return NextResponse.json({ article: toPublicArticle(result.data) });
    }

    return NextResponse.json({ article: result.data });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** PATCH /api/articles/[id], edit a piece. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePublisher(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const existing = await getArticle(id);
    if (!existing.success || !existing.data) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    const current = existing.data;

    const raw = await request.json();
    const checked = validate<Partial<Article>>(raw, ARTICLE_SCHEMA);
    if (!checked.ok) {
      return NextResponse.json({ error: validationMessage(checked.errors) }, { status: 400 });
    }

    const body = sanitizeArticleHtml(checked.value);
    // The kind is fixed at creation. A case study is not a blog post with the
    // fields renamed, and moving one between sections would break its URL.
    const kind = current.kind as ArticleKind;

    const metricsSent = Array.isArray((raw as { metrics?: unknown })?.metrics);
    const metrics = metricsSent
      ? normalizeMetrics((raw as { metrics?: unknown }).metrics)
      : current.metrics;

    // Only re-derive the slug if the author actually changed it. A published URL
    // is a promise: re-slugging on every save would silently break inbound links
    // the first time somebody fixed a typo in the headline.
    let slug = current.slug;
    const desired = body.slug ? slugify(body.slug) : "";
    if (desired && desired !== current.slug) {
      const siblings = await getAllArticles(kind);
      const taken = (siblings.data || [])
        .filter((a) => a.id !== id)
        .map((a) => a.slug)
        .filter(Boolean);
      slug = uniqueSlug(desired, taken);
    }

    const merged: Partial<Article> = { ...current, ...body, kind, slug, metrics };

    if (isPublishIntent(body.status ?? current.status)) {
      const blockers = publishBlockers(merged);
      if (blockers.length > 0) {
        return NextResponse.json(
          { error: `Not ready to publish: ${blockers.join(" ")}`, blockers },
          { status: 400 },
        );
      }
    }

    const goingLiveNow =
      body.status === "published" && current.status !== "published" && !current.publishedAt;

    const updates: Partial<Omit<Article, "id" | "createdAt">> = {
      ...body,
      slug,
      metrics,
      readingMinutes: readingMinutes(body.body ?? current.body),
      publishedAt: body.publishedAt || (goingLiveNow ? new Date().toISOString() : current.publishedAt),
      updatedBy: auth.claims.sub,
      updatedByName: auth.claims.email,
    };
    // The kind never moves, and neither does authorship of the original.
    delete (updates as Partial<Article>).kind;

    const result = await updateArticle(id, updates);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to update article" }, { status: 500 });
    }

    // Revalidate the old path too: renaming a slug leaves the previous URL
    // cached and serving the piece from two addresses.
    revalidateSection(kind, slug);
    if (slug !== current.slug) revalidateSection(kind, current.slug);

    return NextResponse.json({ article: { ...current, ...updates, id } });
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE /api/articles/[id]. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePublisher(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const existing = await getArticle(id);
    if (!existing.success || !existing.data) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const result = await deleteArticle(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to delete article" }, { status: 500 });
    }

    revalidateSection(existing.data.kind, existing.data.slug);

    return NextResponse.json({ message: "Article deleted" });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
