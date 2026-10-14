"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Article, ArticleKind, ArticleMetric, ArticleStatus } from "@/lib/aws/dynamodb";
import {
  ARTICLE_KIND_CONFIG,
  ARTICLE_SCHEMA,
  ARTICLE_STATUSES,
  SEO_LIMITS,
  deriveExcerpt,
  editorialWarnings,
  isLive,
  isPending,
  isPublishIntent,
  kindHas,
  namesAClient,
  NEWS_TYPES,
  publishBlockers,
  readingMinutes,
  slugify,
  wordCount,
} from "@/lib/articles";
import { editorialGuide } from "@/lib/editorial";
import { useAuth } from "@/lib/auth";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useFormErrors } from "@/hooks/use-form-errors";
import { check, collectErrors, email, maxLen, phone, required, url, type Rule } from "@/lib/form-validation";
import { RichTextEditor } from "@/components/portal/console/rich-text-editor";
import { TagInput } from "@/components/portal/console/forms/tag-input";
import { EditorialGuide } from "@/components/portal/console/articles/editorial-guide";
import Icon, { type IconName } from "@/components/portal/icons";
import { useToast } from "@/components/portal/toast";
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, FormSkeleton, Page, PageHeader, Panel, usePortalRouter } from "@/components/portal/kit";
import { ARTICLE_ICONS, ArticleStatusBadge, fmtDate, fmtRelative } from "@/components/portal/publishing/shared";
import { CheckRow, Counter, Field, FieldIssues, Select, TextArea, TextInput, inputCls, type Issues } from "@/components/portal/publishing/fields";

/** Plain-text fields with an input on this screen; lengths come from the route schema. */
type TextField =
  | "title" | "slug" | "subtitle" | "excerpt"
  | "clientName" | "industry" | "engagement" | "clientLogoUrl"
  | "quote" | "quoteAuthor" | "quoteAuthorRole"
  | "datelineCity" | "externalUrl" | "pressContactName" | "pressContactEmail" | "pressContactPhone"
  | "heroImageUrl" | "heroImageAlt" | "authorName" | "authorRole"
  | "seoTitle" | "seoDescription" | "canonicalUrl";

const max = (f: string) => ARTICLE_SCHEMA[f]?.maxLength;

// Where each publishBlockers / editorialWarnings message belongs, so it shows beside its field.
type Spot =
  | "title" | "slug" | "excerpt" | "publishedAt" | "datelineCity" | "pressContactEmail" | "body" | "externalUrl"
  | "challenge" | "approach" | "results" | "metrics" | "quote" | "approvalOnFile"
  | "seoTitle" | "seoDescription" | "heroImageAlt" | "heroImageUrl" | "authorName" | "category" | "quoteAuthor";

const BLOCKER_SPOTS: [RegExp, Spot[]][] = [
  [/needs a headline/i, ["title"]],
  [/URL slug/i, ["slug"]],
  [/summary/i, ["excerpt"]],
  [/no publish date/i, ["publishedAt"]],
  [/dateline/i, ["datelineCity"]],
  [/media contact/i, ["pressContactEmail"]],
  [/write the release/i, ["body", "externalUrl"]],
  [/has no body/i, ["body"]],
  [/the challenge/i, ["challenge"]],
  [/actually did/i, ["approach"]],
  [/its results/i, ["results"]],
  [/figure/i, ["metrics"]],
  [/carried by the quote/i, ["quote"]],
  [/signed off/i, ["approvalOnFile"]],
];
const WARNING_SPOTS: [RegExp, Spot[]][] = [
  [/search title/i, ["seoTitle"]],
  [/search description/i, ["seoDescription"]],
  [/alt text/i, ["heroImageAlt"]],
  [/no hero image/i, ["heroImageUrl"]],
  [/no author/i, ["authorName"]],
  [/no category/i, ["category"]],
  [/unattributed/i, ["quoteAuthor"]],
  [/baseline/i, ["metrics"]],
];
const spotsOf = (msg: string, table: [RegExp, Spot[]][]) => table.find(([re]) => re.test(msg))?.[1] ?? [];

const STATUS_HINT = Object.fromEntries(ARTICLE_STATUSES.map((s) => [s.key, s.hint])) as Record<ArticleStatus, string>;

/**
 * The editor for one piece, in any of the four sections. The kind decides
 * which field groups render (`kindHas`). Publish blockers and editorial
 * warnings show beside the field they concern and in the Publishing checklist;
 * /api/articles applies the same blockers.
 */
export function ArticleEditor({ kind, id }: { kind: ArticleKind; id: string }) {
  const config = ARTICLE_KIND_CONFIG[kind];
  const guide = editorialGuide(kind);
  const router = usePortalRouter();
  const notify = useToast();
  const { user } = useAuth();
  const isNew = id === "new";

  const [form, setForm] = useState<Partial<Article>>({ kind, status: "draft" });
  const [baseline, setBaseline] = useState<string>("");
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState<"missing" | "failed" | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [deleting, setDeleting] = useState(false);
  /** Locked once the slug is edited by hand (or the record exists), so a headline fix can't move a live URL. */
  const [slugLocked, setSlugLocked] = useState(!isNew);

  const set = useCallback(<K extends keyof Article>(key: K, value: Article[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isNew) {
      // Pre-signed by whoever writes it; only blog prints a byline.
      const seeded: Partial<Article> = {
        kind,
        status: "draft",
        authorName: user?.name || "",
        tags: [],
        services: [],
        metrics: [],
        ...(kind === "news" ? { newsType: "press-release", pressContactEmail: user?.email || "" } : {}),
      };
      setForm(seeded);
      setBaseline(JSON.stringify(seeded));
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const response = await fetch(`/api/articles/${id}`);
        if (response.status === 404) {
          if (!cancelled) setLoadError("missing");
          return;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
        if (cancelled) return;
        const loaded: Partial<Article> = { tags: [], services: [], metrics: [], ...data.article };
        setForm(loaded);
        setBaseline(JSON.stringify(loaded));
        setSlugLocked(true);
      } catch (err) {
        console.error(`Failed to load ${kind}:`, err);
        if (!cancelled) setLoadError("failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew, kind, user?.name, user?.email, attempt]);

  // ── derived ───────────────────────────────────────────────────────────────

  const dirty = baseline !== "" && JSON.stringify(form) !== baseline;
  useUnsavedChanges(dirty);

  const saved = useMemo<Partial<Article>>(() => (baseline ? JSON.parse(baseline) : {}), [baseline]);
  const savedLive = !isNew && !!saved.status && isLive(saved as Pick<Article, "status" | "publishedAt">);
  const savedPending = !isNew && !!saved.status && isPending(saved as Pick<Article, "status" | "publishedAt">);

  const blockers = useMemo(() => publishBlockers(form), [form]);
  const warnings = useMemo(() => editorialWarnings(form), [form]);
  const words = useMemo(() => wordCount(form.body), [form.body]);
  const minutes = useMemo(() => readingMinutes(form.body), [form.body]);
  const publishIntent = isPublishIntent(form.status);
  const blockedFromPublishing = publishIntent && blockers.length > 0;

  /** Inline issues per field: blockers only while the status would publish; warnings always. */
  const issues = useMemo(() => {
    const map: Partial<Record<Spot, Required<Issues>>> = {};
    const add = (spot: Spot, k: "blockers" | "warnings", msg: string) => {
      map[spot] ??= { blockers: [], warnings: [] };
      map[spot]![k].push(msg);
    };
    if (publishIntent) blockers.forEach((b) => spotsOf(b, BLOCKER_SPOTS).forEach((s) => add(s, "blockers", b)));
    warnings.forEach((w) => spotsOf(w, WARNING_SPOTS).forEach((s) => add(s, "warnings", w)));
    return map;
  }, [blockers, warnings, publishIntent]);
  const at = (spot: Spot): Issues | undefined => issues[spot];

  // Field-level format and length only; completeness is the blockers' job.
  const { errors, validateAll, revalidate, invalidProps } = useFormErrors(() => {
    const field = (f: TextField, ...rules: Rule[]) => check(form[f] as string | undefined, ...rules, maxLen(ARTICLE_SCHEMA[f].maxLength!));
    const engagement = kindHas(kind, "engagement");
    const quote = kindHas(kind, "quote");
    const press = kindHas(kind, "press");
    return collectErrors<TextField>({
      title: field("title", required("Write a headline before saving. You can change it later.")),
      slug: field("slug"),
      subtitle: field("subtitle"),
      excerpt: field("excerpt"),
      clientName: engagement ? field("clientName") : undefined,
      industry: engagement ? field("industry") : undefined,
      engagement: engagement ? field("engagement") : undefined,
      clientLogoUrl: engagement ? field("clientLogoUrl", url()) : undefined,
      quote: quote ? field("quote") : undefined,
      quoteAuthor: quote ? field("quoteAuthor") : undefined,
      quoteAuthorRole: quote ? field("quoteAuthorRole") : undefined,
      datelineCity: press ? field("datelineCity") : undefined,
      externalUrl: press ? field("externalUrl", url()) : undefined,
      pressContactName: press ? field("pressContactName") : undefined,
      pressContactEmail: press ? field("pressContactEmail", email("Enter an email a journalist can reach, like press@oceanbluecorp.com.")) : undefined,
      pressContactPhone: press ? field("pressContactPhone", phone()) : undefined,
      heroImageUrl: field("heroImageUrl", url()),
      heroImageAlt: field("heroImageAlt"),
      authorName: field("authorName"),
      authorRole: field("authorRole"),
      seoTitle: field("seoTitle"),
      seoDescription: field("seoDescription"),
      canonicalUrl: field("canonicalUrl", url()),
    });
  });

  const dateMs = form.publishedAt ? new Date(form.publishedAt).getTime() : NaN;
  const scheduledInPast = form.status === "scheduled" && Number.isFinite(dateMs) && dateMs < Date.now();
  const futureDate = Number.isFinite(dateMs) && dateMs > Date.now();

  // ── save ──────────────────────────────────────────────────────────────────

  /** `status` overrides the chosen status, for "save without publishing". */
  const save = async (status?: ArticleStatus) => {
    if (saving) return;
    setSaveError(null);
    if (!validateAll()) return;
    const next = status ? { ...form, status } : form;
    if (isPublishIntent(next.status) && publishBlockers(next).length > 0) {
      notify("Not ready to publish. See the checklist.", { tone: "error" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...next,
        kind,
        slug: next.slug || slugify(next.title ?? ""),
        excerpt: next.excerpt || deriveExcerpt(next.body),
      };
      const response = await fetch(isNew ? "/api/articles" : `/api/articles/${id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "This could not be saved. Your changes are still here; try again in a moment.");

      const record: Partial<Article> = { tags: [], services: [], metrics: [], ...data.article };
      setForm(record);
      setBaseline(JSON.stringify(record));
      notify(isNew ? `${cap(config.noun)} created` : "Saved");
      if (isNew && data.article?.id) router.replace(`${config.adminPath}/${data.article.id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "This could not be saved. Your changes are still here; try again in a moment.");
    } finally {
      setSaving(false);
    }
  };

  const performDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/articles/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      notify("Deleted");
      router.push(config.adminPath);
    } catch {
      notify("Failed to delete", { tone: "error" });
      setDeleting(false);
    }
  };

  const focusSpot = (spot: Spot) => {
    const el = document.getElementById(spot === "approvalOnFile" ? "approvalOnFile" : spot);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.focus({ preventScroll: true });
  };

  // ── states ────────────────────────────────────────────────────────────────

  const back = { href: config.adminPath, label: config.label };

  if (loading) return <FormSkeleton label={`Loading ${config.noun}`} aside />;

  if (loadError) {
    return (
      <Page>
        <PageHeader back={back} title={`Edit ${config.noun}`} icon={ARTICLE_ICONS[kind]} section="publishing" />
        {loadError === "missing" ? (
          <EmptyState
            framed
            icon="search"
            title={`This ${config.noun} doesn't exist`}
            body="It may have been deleted, or the link is out of date."
            primary={{ label: `Back to ${config.label}`, href: config.adminPath, icon: "chevronLeft" }}
          />
        ) : (
          <ErrorState title={`Couldn't open this ${config.noun}`} onRetry={() => setAttempt((n) => n + 1)} />
        )}
      </Page>
    );
  }

  const publicUrl = `${config.publicPath}/${form.slug || ""}`;
  const where = savedLive ? "On the site" : savedPending ? `Goes live ${fmtDate(saved.publishedAt)}` : "Not on the site";

  const primaryLabel = (() => {
    const s = form.status ?? "draft";
    if (s === "scheduled" || (s === "published" && futureDate)) return isNew ? "Create and schedule" : "Schedule";
    if (s === "published") return savedLive ? "Save changes" : isNew ? "Create and publish" : "Publish now";
    if (savedLive) return "Save and take offline";
    if (s === "in-review") return isNew ? "Create for review" : "Save for review";
    if (s === "archived") return "Save";
    return "Save draft";
  })();
  // A blocked publish can still keep the work: save under the last non-publishing status.
  const fallbackStatus: ArticleStatus = !isNew && saved.status && !isPublishIntent(saved.status) ? (saved.status as ArticleStatus) : "draft";
  const offerFallback = blockedFromPublishing && !savedLive;

  const intents: { key: ArticleStatus; label: string; icon: IconName }[] = [
    { key: "draft", label: "Draft", icon: "edit" },
    { key: "in-review", label: "In review", icon: "eye" },
    { key: "published", label: savedLive ? "Published" : "Publish now", icon: "send" },
    { key: "scheduled", label: "Schedule", icon: "calendar" },
    { key: "archived", label: "Archived", icon: "clock" },
  ];

  return (
    <Page width="full" className="max-w-[1360px]">
      <PageHeader
        back={back}
        icon={ARTICLE_ICONS[kind]}
        section="publishing"
        title={form.title?.trim() || `New ${config.noun}`}
        meta={!isNew && saved.status ? <ArticleStatusBadge article={saved as Pick<Article, "status" | "publishedAt">} /> : undefined}
        description={
          isNew ? (
            config.purpose
          ) : (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span className="break-all font-mono text-adm-xs">{publicUrl}</span>
              <span>{where}</span>
              {form.updatedAt && (
                <span>
                  Updated {fmtRelative(form.updatedAt).toLowerCase()}
                  {form.updatedByName ? ` by ${form.updatedByName}` : ""}
                </span>
              )}
            </span>
          )
        }
        actions={
          !isNew ? (
            <>
              {savedLive && (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-mist-0 px-4 text-adm-base font-medium text-navy-900 ring-1 ring-inset ring-mist-300 hover:bg-mist-50"
                >
                  <Icon name="external" className="size-5" />
                  View live
                </a>
              )}
              <Button variant="danger" icon="trash" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            </>
          ) : undefined
        }
      />

      {saveError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl bg-status-danger-soft p-4 text-adm-base text-status-danger ring-1 ring-inset ring-status-danger-line">
          <Icon name="alert" className="mt-0.5 size-5 shrink-0" />
          <p className="min-w-0 flex-1">
            {saveError} <span className="text-mist-700">Your changes are still here.</span>
          </p>
          <button type="button" onClick={() => setSaveError(null)} aria-label="Dismiss" className="grid size-8 shrink-0 place-items-center rounded-md hover:bg-status-danger-hover">
            <Icon name="x" className="size-4" />
          </button>
        </div>
      )}

      {/* Blur bubbles; revalidate is a no-op until the first save attempt. */}
      <div onBlur={revalidate} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* ── writing column ─────────────────────────────────────────────── */}
        <div className="grid min-w-0 gap-6">
          <Panel>
            <div className="grid gap-5">
              <Field id="title" label="Headline" required error={errors.title} issues={at("title")} counter={<Counter value={(form.title || "").length} hard={max("title")} />} helper={`Aim: ${guide.headline.good}`}>
                <TextInput
                  id="title"
                  {...invalidProps("title")}
                  value={form.title || ""}
                  placeholder="What this piece is, specifically"
                  className="h-12 text-adm-md font-semibold sm:text-adm-lg"
                  onChange={(title) =>
                    setForm((prev) => ({ ...prev, title, ...(slugLocked ? {} : { slug: slugify(title) }) }))
                  }
                />
              </Field>

              <Field
                id="slug"
                label="URL slug"
                publishRequired
                error={errors.slug}
                issues={at("slug")}
                aside={
                  slugLocked ? (
                    <span className="inline-flex items-center gap-1 text-adm-xs text-mist-600">
                      <Icon name="key" className="size-3.5" />
                      Locked
                      {isNew && (
                        <button
                          type="button"
                          onClick={() => {
                            setSlugLocked(false);
                            set("slug", slugify(form.title || ""));
                          }}
                          className="ml-1 rounded px-1 font-medium text-ocean-700 hover:underline"
                        >
                          Follow headline
                        </button>
                      )}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-adm-xs text-mist-600">
                      <Icon name="refresh" className="size-3.5" />
                      Follows the headline
                    </span>
                  )
                }
                helper={isNew ? "Set once. Changing it after publication breaks every existing link." : "Changing this breaks links already pointing at the old address."}
              >
                <div className="flex min-w-0 items-stretch rounded-lg ring-1 ring-inset ring-mist-300 focus-within:ring-2 focus-within:ring-ocean-600">
                  <span className="hidden max-w-[45%] shrink-0 items-center truncate rounded-l-lg border-r border-mist-200 bg-mist-50 px-3 font-mono text-adm-xs text-mist-600 sm:flex">
                    {config.publicPath}/
                  </span>
                  <input
                    id="slug"
                    {...invalidProps("slug")}
                    value={form.slug || ""}
                    placeholder="url-slug"
                    onChange={(e) => {
                      setSlugLocked(true);
                      set("slug", slugify(e.target.value));
                    }}
                    className="h-10 min-w-0 flex-1 rounded-lg bg-mist-0 px-3 font-mono text-adm-base text-navy-900 placeholder:text-placeholder focus:outline-none sm:rounded-l-none"
                  />
                </div>
              </Field>

              <Field id="subtitle" label="Deck" error={errors.subtitle} counter={<Counter value={(form.subtitle || "").length} hard={max("subtitle")} />} helper="One line under the headline. Who this is for and what they leave with.">
                <TextInput id="subtitle" {...invalidProps("subtitle")} value={form.subtitle || ""} onChange={(v) => set("subtitle", v)} />
              </Field>

              <Field
                id="excerpt"
                label="Summary"
                publishRequired
                error={errors.excerpt}
                issues={at("excerpt")}
                counter={<Counter value={(form.excerpt || "").length} hard={max("excerpt")} />}
                helper={
                  <>
                    The card text on the index and, unless you set one below, the search description.{" "}
                    {!form.excerpt && form.body && (
                      <button type="button" onClick={() => set("excerpt", deriveExcerpt(form.body))} className="font-medium text-ocean-700 hover:underline">
                        Start from the first lines of the body
                      </button>
                    )}
                  </>
                }
              >
                <TextArea id="excerpt" {...invalidProps("excerpt")} rows={3} value={form.excerpt || ""} onChange={(v) => set("excerpt", v)} placeholder="One or two sentences a stranger could act on." />
              </Field>
            </div>
          </Panel>

          {kindHas(kind, "engagement") && (
            <Panel title="The engagement" description="Scanned before a word of the body is read. Leave the client blank to publish anonymised.">
              <div className="grid gap-5 md:grid-cols-2">
                <Field id="clientName" label="Client" error={errors.clientName} counter={<Counter value={(form.clientName || "").length} hard={max("clientName")} />} helper="Only with written approval. Otherwise leave blank.">
                  <TextInput id="clientName" {...invalidProps("clientName")} value={form.clientName || ""} placeholder="Named, or blank for anonymised" onChange={(v) => set("clientName", v)} />
                </Field>
                <Field id="industry" label="Industry" error={errors.industry}>
                  <TextInput id="industry" {...invalidProps("industry")} value={form.industry || ""} placeholder="Healthcare payer, Manufacturing…" onChange={(v) => set("industry", v)} />
                </Field>
                <Field id="engagement" label="Engagement" error={errors.engagement} helper="Shape and length, in a phrase.">
                  <TextInput id="engagement" {...invalidProps("engagement")} value={form.engagement || ""} placeholder="18-month managed team" onChange={(v) => set("engagement", v)} />
                </Field>
                <Field id="clientLogoUrl" label="Client logo URL" error={errors.clientLogoUrl} helper="An https:// image address.">
                  <TextInput id="clientLogoUrl" {...invalidProps("clientLogoUrl")} type="url" value={form.clientLogoUrl || ""} placeholder="https://…" onChange={(v) => set("clientLogoUrl", v)} />
                </Field>
                <Field id="services" label="What we delivered" className="md:col-span-2" counter={<Counter value={(form.services || []).length} hard={6} />} helper="Up to six. Enter or comma adds one.">
                  <TagInput id="services" value={form.services || []} onChange={(v) => set("services", v)} placeholder="Contract search, SAP rollout…" suggestions={config.categories} max={6} />
                </Field>
              </div>
            </Panel>
          )}

          {kindHas(kind, "story") && (
            <Panel title="Challenge, approach, results" description="The three sections a buyer reads in that order. The body below is only the framing.">
              <div className="grid gap-6">
                {(
                  [
                    ["challenge", "The challenge", "The business problem and what it was costing them. Not “they needed developers”.", "What was going wrong, and what it cost."],
                    ["approach", "Our approach", "What we did, in order, with the decisions and trade-offs.", "What we actually did."],
                    ["results", "The results", "The figures, in prose, against their baseline. No new metrics here.", "What changed, measured."],
                  ] as const
                ).map(([key, label, helper, placeholder]) => (
                  <Field key={key} labelId={`${key}-label`} label={label} publishRequired issues={at(key)} helper={helper}>
                    <RichTextEditor id={key} labelledBy={`${key}-label`} value={form[key] || ""} onChange={(html) => set(key, html)} placeholder={placeholder} className="rounded-lg" />
                  </Field>
                ))}
              </div>
            </Panel>
          )}

          {kindHas(kind, "metrics") && (
            <Panel
              title="The figures"
              description="Two or three, each against what it is measured. A percentage with no baseline is a hope, not a result."
              action={<span className="text-adm-xs tabular-nums text-mist-600">{(form.metrics || []).length}/6</span>}
            >
              <MetricRows metrics={form.metrics || []} onChange={(metrics) => set("metrics", metrics)} required={kind === "case-study"} />
              {at("metrics") && (
                <div className="mt-3">
                  <FieldIssues {...at("metrics")!} />
                </div>
              )}
            </Panel>
          )}

          {kindHas(kind, "quote") && (
            <Panel
              title={kind === "customer-story" ? "In their words" : "The client's words"}
              description={kind === "customer-story" ? "The quote is the page. Edit for length, never for meaning." : "One quote, from the person who signed the contract."}
            >
              <div className="grid gap-5">
                <Field id="quote" label="Quote" publishRequired={kind === "customer-story"} error={errors.quote} issues={at("quote")} counter={<Counter value={(form.quote || "").length} hard={max("quote")} />}>
                  <TextArea id="quote" {...invalidProps("quote")} rows={3} value={form.quote || ""} onChange={(v) => set("quote", v)} placeholder="Their sentence, as they said it." className="text-adm-base italic" />
                </Field>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field id="quoteAuthor" label="Said by" error={errors.quoteAuthor} issues={at("quoteAuthor")} helper="A named person. Anonymous quotes persuade nobody.">
                    <TextInput id="quoteAuthor" {...invalidProps("quoteAuthor")} value={form.quoteAuthor || ""} onChange={(v) => set("quoteAuthor", v)} />
                  </Field>
                  <Field id="quoteAuthorRole" label="Their title" error={errors.quoteAuthorRole}>
                    <TextInput id="quoteAuthorRole" {...invalidProps("quoteAuthorRole")} value={form.quoteAuthorRole || ""} placeholder="VP Engineering, Acme Health" onChange={(v) => set("quoteAuthorRole", v)} />
                  </Field>
                </div>
              </div>
            </Panel>
          )}

          <Panel
            title={kind === "news" ? "The release" : "The piece"}
            description={guide.length}
            action={
              words > 0 ? (
                <span className="text-adm-xs tabular-nums text-mist-600">
                  {words.toLocaleString()} words · {minutes} min read
                </span>
              ) : (
                <Button size="sm" variant="secondary" icon="layers" onClick={() => set("body", guide.template)}>
                  Start from the template
                </Button>
              )
            }
          >
            <span id="body-label" className="sr-only">
              {kind === "news" ? "The release" : "Body"}
            </span>
            <RichTextEditor
              id="body"
              labelledBy="body-label"
              value={form.body || ""}
              onChange={(html) => set("body", html)}
              placeholder={kind === "news" ? "Lead paragraph first: who, what, when, where, why, in 40 words." : "Open at the reader's problem, in their words."}
              className="rounded-lg [&>div:last-child]:min-h-[420px] [&>div:last-child]:text-adm-base"
            />
            {at("body") && (
              <div className="mt-2">
                <FieldIssues {...at("body")!} />
              </div>
            )}
          </Panel>
        </div>

        {/* ── settings panel (stacks under the writing column below lg) ─── */}
        <aside aria-label="Settings" className="grid min-w-0 gap-6">
          <Panel title="Publishing" description={where}>
            <div className="grid gap-5">
              <fieldset className="grid gap-2">
                <legend className="mb-2 text-adm-base font-medium text-navy-900">Status</legend>
                <div role="radiogroup" aria-label="Status" className="grid grid-cols-2 gap-2">
                  {intents.map((o) => {
                    const on = (form.status ?? "draft") === o.key;
                    return (
                      <button
                        key={o.key}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => set("status", o.key)}
                        className={`flex min-h-10 items-center gap-2 rounded-lg px-3 text-left text-adm-base font-medium ring-1 ring-inset transition-colors duration-150 ${
                          on ? "bg-ocean-50 text-ocean-700 ring-2 ring-ocean-600" : "bg-mist-0 text-navy-900 ring-mist-300 hover:bg-mist-50"
                        } ${o.key === "archived" ? "col-span-2" : ""}`}
                      >
                        <Icon name={o.icon} className="size-4 shrink-0" />
                        {o.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-adm-xs text-mist-600">{STATUS_HINT[(form.status ?? "draft") as ArticleStatus]}</p>
              </fieldset>

              <Field
                id="publishedAt"
                label={form.status === "scheduled" ? "Goes live on" : "Publish date"}
                publishRequired={form.status === "scheduled"}
                issues={at("publishedAt")}
                helper={
                  scheduledInPast
                    ? undefined
                    : form.status === "scheduled"
                      ? "It appears on the site the moment this passes. Nothing else needs to happen."
                      : form.status === "published" && futureDate
                        ? "In the future, so it stays off the site until then."
                        : "Leave blank to stamp it when you publish. Your local time."
                }
              >
                <input
                  id="publishedAt"
                  type="datetime-local"
                  value={toLocalInput(form.publishedAt)}
                  onChange={(e) => set("publishedAt", fromLocalInput(e.target.value))}
                  className={`${inputCls} h-10`}
                />
                {scheduledInPast && (
                  <p className="flex gap-1.5 text-adm-xs font-medium text-status-warning">
                    <Icon name="alert" className="mt-px size-3.5 shrink-0" />
                    This time has already passed, so it goes live as soon as you save.
                  </p>
                )}
              </Field>

              <CheckRow id="featured" checked={!!form.featured} onChange={(v) => set("featured", v)} label={`Feature at the top of ${config.label}`} hint="Pins it to the top of the public index." />

              <div id="checklist" className="grid gap-3 border-t border-mist-200 pt-4">
                {blockers.length > 0 && (
                  <div role={publishIntent ? "alert" : undefined} className="rounded-lg bg-status-warning-soft p-3 ring-1 ring-inset ring-status-warning-line">
                    <p className="text-adm-xs font-semibold text-status-warning">
                      Before it can go out · {blockers.length}
                    </p>
                    <ChecklistItems items={blockers} table={BLOCKER_SPOTS} onPick={focusSpot} tone="block" />
                  </div>
                )}
                {warnings.length > 0 && (
                  <div className="rounded-lg bg-mist-50 p-3 ring-1 ring-inset ring-mist-200">
                    <p className="text-adm-xs font-semibold text-mist-700">Worth fixing · {warnings.length}</p>
                    <ChecklistItems items={warnings} table={WARNING_SPOTS} onPick={focusSpot} tone="warn" />
                  </div>
                )}
                {blockers.length === 0 && warnings.length === 0 && (
                  <p className="flex items-center gap-2 rounded-lg bg-status-success-soft p-3 text-adm-base font-medium text-status-success ring-1 ring-inset ring-status-success-line">
                    <Icon name="check" className="size-4" />
                    Nothing outstanding. Ready to publish.
                  </p>
                )}
              </div>
            </div>
          </Panel>

          {namesAClient(kind) && (
            <Panel title="Client sign-off" description={guide.signoff}>
              <div className={`grid gap-3 rounded-lg p-3 ring-1 ring-inset ${form.approvalOnFile ? "bg-status-success-soft ring-status-success-line" : "bg-status-warning-soft ring-status-warning-line"}`}>
                <CheckRow
                  id="approvalOnFile"
                  checked={!!form.approvalOnFile}
                  onChange={(v) => set("approvalOnFile", v)}
                  label={`${form.clientName || "The client"} has approved this in writing`}
                  hint="Until this is ticked, the piece cannot be published."
                />
                <Field id="approvalNote" label="Approval note" counter={<Counter value={(form.approvalNote || "").length} hard={max("approvalNote")} />}>
                  <TextInput id="approvalNote" value={form.approvalNote || ""} placeholder="Who approved it, when, and where the email lives" onChange={(v) => set("approvalNote", v)} />
                </Field>
              </div>
              {at("approvalOnFile") && (
                <div className="mt-2">
                  <FieldIssues {...at("approvalOnFile")!} />
                </div>
              )}
            </Panel>
          )}

          {kindHas(kind, "press") && (
            <Panel title="Release details" description="What a journalist needs before they will run it.">
              <div className="grid gap-5">
                <Field id="newsType" label="Announcement type" helper={NEWS_TYPES.find((t) => t.value === (form.newsType || "press-release"))?.hint}>
                  <Select id="newsType" value={form.newsType || "press-release"} onChange={(v) => set("newsType", v)}>
                    {NEWS_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field id="datelineCity" label="Dateline city" publishRequired error={errors.datelineCity} issues={at("datelineCity")} helper="The date half comes from the publish date.">
                  <TextInput id="datelineCity" {...invalidProps("datelineCity")} value={form.datelineCity || ""} placeholder="COLUMBUS, Ohio" onChange={(v) => set("datelineCity", v)} />
                </Field>
                <Field id="externalUrl" label="Coverage link" error={errors.externalUrl} issues={at("externalUrl")} helper="For “In the press”: link to whoever wrote it. Needed when the release has no body.">
                  <TextInput id="externalUrl" {...invalidProps("externalUrl")} type="url" value={form.externalUrl || ""} placeholder="https://…" onChange={(v) => set("externalUrl", v)} />
                </Field>
                <div className="grid gap-5 border-t border-mist-200 pt-4">
                  <p className="text-adm-base font-semibold text-navy-900">Media contact</p>
                  <Field id="pressContactName" label="Name" error={errors.pressContactName}>
                    <TextInput id="pressContactName" {...invalidProps("pressContactName")} value={form.pressContactName || ""} onChange={(v) => set("pressContactName", v)} />
                  </Field>
                  <Field id="pressContactEmail" label="Email" publishRequired error={errors.pressContactEmail} issues={at("pressContactEmail")} helper="A journalist on deadline who can't reach anyone writes the story without us.">
                    <TextInput id="pressContactEmail" {...invalidProps("pressContactEmail")} type="email" autoComplete="off" value={form.pressContactEmail || ""} onChange={(v) => set("pressContactEmail", v)} />
                  </Field>
                  <Field id="pressContactPhone" label="Phone" error={errors.pressContactPhone}>
                    <TextInput id="pressContactPhone" {...invalidProps("pressContactPhone")} type="tel" value={form.pressContactPhone || ""} onChange={(v) => set("pressContactPhone", v)} />
                  </Field>
                </div>
              </div>
            </Panel>
          )}

          <Panel title="Presentation">
            <div className="grid gap-5">
              <Field id="heroImageUrl" label="Hero image URL" error={errors.heroImageUrl} issues={at("heroImageUrl")}>
                <TextInput id="heroImageUrl" {...invalidProps("heroImageUrl")} type="url" value={form.heroImageUrl || ""} placeholder="https://…" onChange={(v) => set("heroImageUrl", v)} />
              </Field>
              <HeroPreview key={form.heroImageUrl || ""} src={form.heroImageUrl || ""} alt={form.heroImageAlt || ""} />
              <Field
                id="heroImageAlt"
                label="Image description"
                error={errors.heroImageAlt}
                issues={at("heroImageAlt")}
                counter={<Counter value={(form.heroImageAlt || "").length} hard={max("heroImageAlt")} />}
                helper="What the image shows, for a reader who can't see it."
              >
                <TextInput id="heroImageAlt" {...invalidProps("heroImageAlt")} value={form.heroImageAlt || ""} onChange={(v) => set("heroImageAlt", v)} />
              </Field>

              {config.categories.length > 0 && (
                <Field id="category" label="Category" issues={at("category")}>
                  <Select id="category" value={form.category || ""} onChange={(v) => set("category", v)}>
                    <option value="">Not categorised</option>
                    {config.categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}

              <Field id="tags" label="Tags" counter={<Counter value={(form.tags || []).length} hard={8} />} helper="Up to eight. They are how a reader finds the next piece.">
                <TagInput id="tags" value={form.tags || []} onChange={(v) => set("tags", v)} placeholder="hiring, sap, cloud…" max={8} />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                <Field
                  id="authorName"
                  label={kind === "blog" ? "Author" : "Internal author"}
                  error={errors.authorName}
                  issues={at("authorName")}
                  helper={kind === "blog" ? "A real colleague. “The team” is not a byline." : `Kept for the record; ${config.plural} print no byline.`}
                >
                  <TextInput id="authorName" {...invalidProps("authorName")} value={form.authorName || ""} onChange={(v) => set("authorName", v)} />
                </Field>
                <Field id="authorRole" label="Their role" error={errors.authorRole}>
                  <TextInput id="authorRole" {...invalidProps("authorRole")} value={form.authorRole || ""} placeholder="Principal Recruiter" onChange={(v) => set("authorRole", v)} />
                </Field>
              </div>
            </div>
          </Panel>

          <Panel title="Search and sharing">
            <div className="grid gap-5">
              <SearchSnippet
                title={form.seoTitle || form.title || `New ${config.noun}`}
                path={publicUrl}
                description={form.seoDescription || form.excerpt || ""}
                noIndex={!!form.noIndex}
              />
              <Field
                id="seoTitle"
                label="Search title"
                error={errors.seoTitle}
                issues={at("seoTitle")}
                counter={<Counter value={(form.seoTitle || form.title || "").length} soft={SEO_LIMITS.title} hard={max("seoTitle")} />}
                helper="Leave blank to use the headline."
              >
                <TextInput id="seoTitle" {...invalidProps("seoTitle")} value={form.seoTitle || ""} placeholder={form.title || ""} onChange={(v) => set("seoTitle", v)} />
              </Field>
              <Field
                id="seoDescription"
                label="Search description"
                error={errors.seoDescription}
                issues={at("seoDescription")}
                counter={<Counter value={(form.seoDescription || form.excerpt || "").length} soft={SEO_LIMITS.description} hard={max("seoDescription")} />}
                helper="Leave blank to use the summary."
              >
                <TextArea id="seoDescription" {...invalidProps("seoDescription")} rows={3} value={form.seoDescription || ""} placeholder={form.excerpt || ""} onChange={(v) => set("seoDescription", v)} />
              </Field>
              <Field id="canonicalUrl" label="Canonical URL" error={errors.canonicalUrl} helper="Only if this was published somewhere else first.">
                <TextInput id="canonicalUrl" {...invalidProps("canonicalUrl")} type="url" value={form.canonicalUrl || ""} placeholder="https://…" onChange={(v) => set("canonicalUrl", v)} />
              </Field>
              <CheckRow id="noIndex" checked={!!form.noIndex} onChange={(v) => set("noIndex", v)} label="Keep out of search results" hint="For a page that exists only to be linked to directly." />
            </div>
          </Panel>

          <EditorialGuide kind={kind} bodyIsEmpty={!form.body?.trim()} onInsertTemplate={() => set("body", guide.template)} />
        </aside>
      </div>

      {/* Sticky action bar: floats over the page bottom, never pads the page. */}
      <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-xl bg-mist-0 px-4 py-3 ring-1 ring-mist-200">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-adm-base">
          {dirty ? (
            <span className="inline-flex items-center gap-2 font-medium text-status-warning">
              <span aria-hidden className="size-2 rounded-full bg-status-warning-mark" />
              Unsaved changes
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-mist-600">
              <Icon name="check" className="size-4 text-status-success" />
              {isNew ? "Not saved yet" : "All changes saved"}
            </span>
          )}
          {blockedFromPublishing && (
            <button
              type="button"
              onClick={() => document.getElementById("checklist")?.scrollIntoView({ block: "center", behavior: "smooth" })}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-md font-medium text-status-warning hover:underline"
            >
              <Icon name="alert" className="size-4" />
              {blockers.length} to settle before publishing
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={() => (dirty ? setConfirmLeave(true) : router.push(config.adminPath))}>
            Cancel
          </Button>
          {offerFallback && (
            <Button variant="secondary" disabled={saving} onClick={() => save(fallbackStatus)}>
              {fallbackStatus === "in-review" ? "Save, keep in review" : "Save draft"}
            </Button>
          )}
          <Button icon={publishIntent ? (form.status === "scheduled" || futureDate ? "calendar" : "send") : "check"} loading={saving} disabled={blockedFromPublishing} onClick={() => save()}>
            {primaryLabel}
          </Button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete this ${config.noun}?`}
          body={savedLive ? `This is live. Deleting it breaks every link pointing at ${publicUrl}. Archiving keeps the URL working.` : "This cannot be undone."}
          confirmLabel="Delete"
          busy={deleting}
          onConfirm={performDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      {confirmLeave && (
        <ConfirmDialog
          title="Discard unsaved changes?"
          body={`Your edits to this ${config.noun} have not been saved.`}
          confirmLabel="Discard"
          onConfirm={() => router.push(config.adminPath)}
          onCancel={() => setConfirmLeave(false)}
        />
      )}
    </Page>
  );
}

// ── pieces ───────────────────────────────────────────────────────────────────

/** Checklist rows; each jumps to the field it concerns when there is one. */
function ChecklistItems({ items, table, onPick, tone }: { items: string[]; table: [RegExp, Spot[]][]; onPick: (s: Spot) => void; tone: "block" | "warn" }) {
  return (
    <ul className="mt-2 grid gap-1">
      {items.map((msg) => {
        const spot = spotsOf(msg, table)[0];
        const dot = <span aria-hidden className={`mt-[7px] size-1.5 shrink-0 rounded-full ${tone === "block" ? "bg-status-warning-mark" : "bg-mist-400"}`} />;
        return (
          <li key={msg}>
            {spot ? (
              <button type="button" onClick={() => onPick(spot)} className="flex w-full gap-2 rounded-md px-1 py-1 text-left text-adm-xs leading-normal text-navy-900 hover:bg-mist-0/70 hover:underline">
                {dot}
                {msg}
              </button>
            ) : (
              <p className="flex gap-2 px-1 py-1 text-adm-xs leading-normal text-navy-900">
                {dot}
                {msg}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function HeroPreview({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!/^https:\/\/\S+$/i.test(src.trim())) {
    return (
      <p className="text-adm-xs text-mist-600">{src.trim() ? "Use an https:// address to preview." : "No hero image yet."}</p>
    );
  }
  return failed ? (
    <p className="flex gap-1.5 rounded-lg bg-status-danger-soft p-3 text-adm-xs font-medium text-status-danger ring-1 ring-inset ring-status-danger-line">
      <Icon name="alert" className="mt-px size-3.5 shrink-0" />
      That address didn&apos;t load as an image. Check the link.
    </p>
  ) : (
    <img src={src} alt={alt} onError={() => setFailed(true)} className="aspect-[16/9] w-full rounded-lg bg-mist-100 object-cover ring-1 ring-mist-200" />
  );
}

/** Roughly how a search result shows the page. */
function SearchSnippet({ title, path, description, noIndex }: { title: string; path: string; description: string; noIndex: boolean }) {
  const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
  return (
    <div className="grid gap-0.5 rounded-lg bg-mist-50 p-3 ring-1 ring-inset ring-mist-200">
      <p className="flex items-center justify-between gap-2 text-adm-xs font-medium text-mist-600">
        Search preview
        {noIndex && <Badge tone="amber">Hidden from search</Badge>}
      </p>
      <p className="mt-1 truncate text-adm-xs text-mist-600">oceanbluecorp.com{path.replace(/\/+$/, "").replace(/\//g, " › ")}</p>
      <p className="line-clamp-2 break-words text-adm-md leading-snug text-ocean-700">{clip(title, SEO_LIMITS.title)}</p>
      <p className="line-clamp-3 break-words text-adm-base text-mist-700">{description ? clip(description, SEO_LIMITS.description) : <span className="text-mist-600">Write a summary to fill this in.</span>}</p>
    </div>
  );
}

/** Proof points: label, value, baseline. Capped at six to match the route's normaliser. */
function MetricRows({ metrics, onChange, required: needed }: { metrics: ArticleMetric[]; onChange: (metrics: ArticleMetric[]) => void; required: boolean }) {
  const update = (index: number, patch: Partial<ArticleMetric>) => onChange(metrics.map((m, i) => (i === index ? { ...m, ...patch } : m)));

  return (
    <div id="metrics" tabIndex={-1} className="grid gap-3 focus:outline-none">
      {metrics.length === 0 ? (
        <EmptyState
          compact
          icon="chart"
          title="No figures yet"
          body={needed ? "A case study needs at least one. Without them it is a brochure." : "Optional for a customer story, but one number makes the quote land."}
          primary={{ label: "Add a figure", icon: "plus", onClick: () => onChange([{ label: "", value: "" }]) }}
        />
      ) : (
        <>
          <div className="hidden grid-cols-[minmax(0,1fr)_9rem_minmax(0,1fr)_2.5rem] gap-2 px-0.5 text-adm-xs font-medium text-mist-600 sm:grid">
            <span>Label</span>
            <span>Value</span>
            <span>Measured against</span>
            <span />
          </div>
          {metrics.map((metric, i) => (
            <div key={i} className="grid gap-2 rounded-lg p-3 ring-1 ring-inset ring-mist-200 sm:grid-cols-[minmax(0,1fr)_9rem_minmax(0,1fr)_2.5rem] sm:p-0 sm:ring-0">
              <TextInput aria-label={`Figure ${i + 1} label`} value={metric.label} placeholder="Time to fill" onChange={(v) => update(i, { label: v })} />
              <TextInput aria-label={`Figure ${i + 1} value`} value={metric.value} placeholder="38% faster" className="font-semibold tabular-nums" onChange={(v) => update(i, { value: v })} />
              <TextInput aria-label={`Figure ${i + 1} baseline`} value={metric.note || ""} placeholder="vs. their 2025 average" onChange={(v) => update(i, { note: v })} />
              <Button variant="ghost" icon="trash" label={`Remove figure ${i + 1}`} onClick={() => onChange(metrics.filter((_, index) => index !== i))} className="justify-self-end sm:justify-self-auto" />
            </div>
          ))}
          {metrics.length < 6 && (
            <div>
              <Button variant="secondary" icon="plus" onClick={() => onChange([...metrics, { label: "", value: "" }])}>
                Add a figure
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── small helpers ────────────────────────────────────────────────────────────

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** ISO ⇄ `datetime-local` (local time, no zone), through the local offset. */
function toLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}
