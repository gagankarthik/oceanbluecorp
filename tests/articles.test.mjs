// The editorial rules: what a URL becomes, when a piece is live, and what stops
// one going out. These decide whether a public URL is stable and whether a
// client's name can reach the site without their signature, so they get a test.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const {
  slugify,
  uniqueSlug,
  readingMinutes,
  wordCount,
  deriveExcerpt,
  normalizeMetrics,
  isLive,
  isPending,
  publishBlockers,
  editorialWarnings,
  matchesArticleSearch,
  byNewest,
} = load("src/lib/articles.ts");

describe("slugify", () => {
  test("makes a URL segment out of a headline", () => {
    assert.equal(
      slugify("What we learned filling 40 SAP roles in 90 days"),
      "what-we-learned-filling-40-sap-roles-in-90-days",
    );
  });

  test("folds accents rather than dropping the letter", () => {
    // "Über" must not become "ber": the word disappears from the URL.
    assert.equal(slugify("Über den Wolken"), "uber-den-wolken");
  });

  test("drops apostrophes instead of turning them into separators", () => {
    assert.equal(slugify("The client's own words"), "the-clients-own-words");
  });

  test("collapses punctuation and trims the edges", () => {
    assert.equal(slugify("  Hiring in 2026: what changed?  "), "hiring-in-2026-what-changed");
  });

  test("caps the length on a word boundary", () => {
    const slug = slugify("a".repeat(30) + " " + "b".repeat(30) + " " + "c".repeat(40));
    assert.ok(slug.length <= 80, `expected <= 80, got ${slug.length}`);
    assert.ok(!slug.endsWith("-"));
  });

  test("returns empty for input with nothing usable in it", () => {
    assert.equal(slugify("!!! ???"), "");
  });
});

describe("uniqueSlug", () => {
  test("keeps the slug when it is free", () => {
    assert.equal(uniqueSlug("hiring-in-2026", ["something-else"]), "hiring-in-2026");
  });

  test("suffixes a collision rather than refusing the save", () => {
    assert.equal(uniqueSlug("hiring-in-2026", ["hiring-in-2026"]), "hiring-in-2026-2");
    assert.equal(
      uniqueSlug("hiring-in-2026", ["hiring-in-2026", "hiring-in-2026-2"]),
      "hiring-in-2026-3",
    );
  });

  test("falls back to a usable slug when the title yields nothing", () => {
    assert.equal(uniqueSlug("???", []), "untitled");
  });
});

describe("reading aids", () => {
  test("counts words with the markup stripped", () => {
    assert.equal(wordCount("<p>one <strong>two</strong> three</p>"), 3);
    assert.equal(wordCount(""), 0);
    assert.equal(wordCount(undefined), 0);
  });

  test("never reports a 1-word post as a 0 minute read", () => {
    assert.equal(readingMinutes("<p>hello</p>"), 1);
  });

  test("reports nothing for an empty body", () => {
    assert.equal(readingMinutes(""), 0);
  });

  test("rounds to 225 words a minute", () => {
    const body = `<p>${"word ".repeat(450)}</p>`;
    assert.equal(readingMinutes(body), 2);
  });
});

describe("deriveExcerpt", () => {
  test("strips tags and keeps the sentence readable", () => {
    assert.equal(
      deriveExcerpt("<p>We filled twelve roles.</p><p>It took six weeks.</p>"),
      "We filled twelve roles. It took six weeks.",
    );
  });

  test("cuts on a word boundary and marks the truncation", () => {
    const excerpt = deriveExcerpt(`<p>${"alpha ".repeat(80)}</p>`, 40);
    assert.ok(excerpt.length <= 41, `expected <= 41, got ${excerpt.length}`);
    assert.ok(excerpt.endsWith("…"));
    assert.ok(!excerpt.includes("  "));
  });
});

describe("normalizeMetrics", () => {
  test("keeps only the declared keys", () => {
    const result = normalizeMetrics([
      { label: "Time to fill", value: "38% faster", note: "vs 2025", rogue: "dropped" },
    ]);
    assert.deepEqual(result, [{ label: "Time to fill", value: "38% faster", note: "vs 2025" }]);
  });

  test("drops rows missing a label or a value", () => {
    assert.deepEqual(normalizeMetrics([{ label: "Only a label" }, { value: "42" }]), []);
  });

  test("caps at six", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ label: `m${i}`, value: `${i}` }));
    assert.equal(normalizeMetrics(many).length, 6);
  });

  test("survives junk", () => {
    assert.deepEqual(normalizeMetrics(null), []);
    assert.deepEqual(normalizeMetrics("nope"), []);
    assert.deepEqual(normalizeMetrics([null, 5, "x"]), []);
  });
});

describe("isLive", () => {
  const now = new Date("2026-08-13T12:00:00Z");
  const past = "2026-08-01T00:00:00Z";
  const future = "2026-09-01T00:00:00Z";

  test("a draft is never live, whatever its date says", () => {
    assert.equal(isLive({ status: "draft", publishedAt: past }, now), false);
    assert.equal(isLive({ status: "in-review", publishedAt: past }, now), false);
    assert.equal(isLive({ status: "archived", publishedAt: past }, now), false);
  });

  test("a scheduled piece goes live the moment its date passes, with no job to run", () => {
    assert.equal(isLive({ status: "scheduled", publishedAt: future }, now), false);
    assert.equal(isLive({ status: "scheduled", publishedAt: past }, now), true);
  });

  test("a published piece dated in the future is not live yet", () => {
    assert.equal(isLive({ status: "published", publishedAt: future }, now), false);
    assert.equal(isPending({ status: "published", publishedAt: future }, now), true);
  });

  test("published with no date at all is live", () => {
    assert.equal(isLive({ status: "published" }, now), true);
  });
});

describe("publishBlockers", () => {
  const readyPost = {
    kind: "blog",
    title: "What we learned",
    slug: "what-we-learned",
    excerpt: "A summary.",
    body: "<p>Words.</p>",
  };

  test("a complete blog post has nothing outstanding", () => {
    assert.deepEqual(publishBlockers(readyPost), []);
  });

  test("scheduling without a date would never appear, so it is held back", () => {
    const blockers = publishBlockers({ ...readyPost, status: "scheduled" });
    assert.equal(blockers.length, 1);
    assert.match(blockers[0], /never appear/);
    assert.deepEqual(
      publishBlockers({ ...readyPost, status: "scheduled", publishedAt: "2026-09-01T00:00:00Z" }),
      [],
    );
  });

  test("names every missing essential rather than the first", () => {
    const blockers = publishBlockers({ kind: "blog" });
    assert.ok(blockers.length >= 3);
  });

  test("a case study naming a client cannot go out without sign-off", () => {
    const study = {
      kind: "case-study",
      title: "Twelve roles in six weeks",
      slug: "twelve-roles",
      excerpt: "A summary.",
      challenge: "<p>Hard.</p>",
      approach: "<p>We did this.</p>",
      results: "<p>It worked.</p>",
      metrics: [{ label: "Time to fill", value: "38% faster" }],
      clientName: "Acme Health",
    };
    const blockers = publishBlockers(study);
    assert.equal(blockers.length, 1);
    assert.match(blockers[0], /Acme Health/);
    assert.deepEqual(publishBlockers({ ...study, approvalOnFile: true }), []);
  });

  test("an anonymised case study still needs approval on file", () => {
    // Anonymising is a courtesy to the client; it is not consent to publish
    // their engagement, so the signature is still required.
    const blockers = publishBlockers({
      kind: "case-study",
      title: "T",
      slug: "t",
      excerpt: "e",
      challenge: "<p>c</p>",
      approach: "<p>a</p>",
      results: "<p>r</p>",
      metrics: [{ label: "l", value: "v" }],
    });
    assert.equal(blockers.length, 1);
    assert.match(blockers[0], /signed off/);
  });

  test("a case study with no figures is held back", () => {
    const blockers = publishBlockers({
      kind: "case-study",
      title: "T",
      slug: "t",
      excerpt: "e",
      challenge: "<p>c</p>",
      approach: "<p>a</p>",
      results: "<p>r</p>",
      approvalOnFile: true,
    });
    assert.equal(blockers.length, 1);
    assert.match(blockers[0], /figure/);
  });

  test("a customer story without a quote is not a story", () => {
    const blockers = publishBlockers({
      kind: "customer-story",
      title: "T",
      slug: "t",
      excerpt: "e",
      approvalOnFile: true,
    });
    assert.equal(blockers.length, 1);
    assert.match(blockers[0], /quote/);
  });

  test("a release needs a dateline and a reachable media contact", () => {
    const blockers = publishBlockers({
      kind: "news",
      title: "T",
      slug: "t",
      excerpt: "e",
      body: "<p>b</p>",
    });
    assert.equal(blockers.length, 2);
    assert.ok(blockers.some((b) => /dateline/.test(b)));
    assert.ok(blockers.some((b) => /media contact/.test(b)));
  });

  test("a coverage item may link out instead of carrying a body", () => {
    assert.deepEqual(
      publishBlockers({
        kind: "news",
        title: "T",
        slug: "t",
        excerpt: "e",
        datelineCity: "COLUMBUS, Ohio",
        pressContactEmail: "press@example.com",
        externalUrl: "https://example.com/story",
      }),
      [],
    );
  });
});

describe("editorialWarnings", () => {
  test("flags an over-long search title without blocking the piece", () => {
    const warnings = editorialWarnings({ kind: "blog", title: "x".repeat(80) });
    assert.ok(warnings.some((w) => /search title/.test(w)));
  });

  test("flags an image with no alt text", () => {
    const warnings = editorialWarnings({
      kind: "blog",
      title: "T",
      heroImageUrl: "https://example.com/a.png",
    });
    assert.ok(warnings.some((w) => /alt text/.test(w)));
  });

  test("flags an unattributed quote", () => {
    const warnings = editorialWarnings({ kind: "customer-story", title: "T", quote: "It worked." });
    assert.ok(warnings.some((w) => /unattributed/.test(w)));
  });
});

describe("matchesArticleSearch", () => {
  const article = {
    title: "Twelve roles in six weeks",
    clientName: "Acme Health",
    tags: ["sap", "healthcare"],
    services: ["Contract search"],
    slug: "twelve-roles",
  };

  test("matches across title, client and tags", () => {
    assert.equal(matchesArticleSearch(article, "acme"), true);
    assert.equal(matchesArticleSearch(article, "SAP"), true);
    assert.equal(matchesArticleSearch(article, "contract"), true);
    assert.equal(matchesArticleSearch(article, "kubernetes"), false);
  });

  test("an empty query matches everything", () => {
    assert.equal(matchesArticleSearch(article, "   "), true);
  });
});

describe("byNewest", () => {
  test("sorts on the publish date, falling back to creation", () => {
    const rows = [
      { title: "old", publishedAt: "2026-01-01T00:00:00Z", createdAt: "2026-01-01T00:00:00Z" },
      { title: "new", publishedAt: "2026-08-01T00:00:00Z", createdAt: "2026-02-01T00:00:00Z" },
      { title: "draft", createdAt: "2026-07-01T00:00:00Z" },
    ];
    assert.deepEqual(rows.sort(byNewest).map((r) => r.title), ["new", "draft", "old"]);
  });
});
