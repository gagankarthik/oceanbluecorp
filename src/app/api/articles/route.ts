import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  getAllArticles,
  createArticle,
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
  byNewest,
  isArticleKind,
  isLive,
  isPublishIntent,
  normalizeMetrics,
  publishBlockers,
  readingMinutes,
  slugify,
  uniqueSlug,
} from "@/lib/articles";

/**
 * GET /api/articles?kind=blog
 *
 * Serves both the admin lists and (once the public pages are wired to it) the
 * marketing site, so the projection is resolved from the CALLER: staff get every
 * record in every state, anonymous visitors get only what is actually live,
 * stripped of the internal fields. Drafts and the client-approval trail must
 * never leave the admin, which is why that is decided here rather than in a page.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kindParam = searchParams.get("kind");

    if (kindParam && !isArticleKind(kindParam)) {
      return NextResponse.json({ error: `Unknown section: ${kindParam}` }, { status: 400 });
    }

    const result = await getAllArticles((kindParam as ArticleKind) || undefined);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to fetch articles" }, { status: 500 });
    }

    const articles = (result.data || []).sort(byNewest);

    const claims = await getClaims(request);
    const isStaff = !!claims && hasPublishingAccess(claims.groups);
    const payload = isStaff ? articles : articles.filter((a) => isLive(a)).map(toPublicArticle);

    return NextResponse.json({ articles: payload });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST /api/articles, create a piece. */
export async function POST(request: NextRequest) {
  const auth = await requirePublisher(request);
  if (!auth.ok) return auth.response;

  try {
    const raw = await request.json();

    const checked = validate<Partial<Article>>(raw, ARTICLE_SCHEMA);
    if (!checked.ok) {
      return NextResponse.json({ error: validationMessage(checked.errors) }, { status: 400 });
    }

    const body = sanitizeArticleHtml(checked.value);
    const kind = body.kind as ArticleKind;
    const metrics = normalizeMetrics((raw as { metrics?: unknown })?.metrics);

    // Slug: honour what the author typed, fall back to the headline, and settle
    // a collision with a suffix rather than refusing the save. Someone who has
    // just written 1,200 words should not lose them to a slug clash.
    const existing = await getAllArticles(kind);
    const taken = (existing.data || []).map((a) => a.slug).filter(Boolean);
    const slug = uniqueSlug(slugify(body.slug || body.title || ""), taken);

    const candidate: Partial<Article> = { ...body, kind, slug, metrics };

    // The publish rules bind HERE, not only in the editor. A piece can reach
    // this route from anywhere, and naming a client who has not approved is
    // exactly the mistake that must not be one fetch call away (§5, UI gating
    // is courtesy, not security).
    if (isPublishIntent(body.status)) {
      const blockers = publishBlockers(candidate);
      if (blockers.length > 0) {
        return NextResponse.json(
          { error: `Not ready to publish: ${blockers.join(" ")}`, blockers },
          { status: 400 },
        );
      }
    }

    const now = new Date().toISOString();
    const article: Article = {
      ...candidate,
      id: uuidv4(),
      kind,
      slug,
      title: body.title!,
      status: body.status || "draft",
      metrics,
      readingMinutes: readingMinutes(body.body),
      // Publishing with no date stated means now. A draft keeps whatever the
      // author scheduled, or nothing.
      publishedAt: body.publishedAt || (body.status === "published" ? now : undefined),
      createdAt: now,
      createdBy: auth.claims.sub,
      createdByName: auth.claims.email,
      updatedBy: auth.claims.sub,
      updatedByName: auth.claims.email,
    };

    const result = await createArticle(article);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to create article" }, { status: 500 });
    }

    revalidateSection(kind, slug);

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
