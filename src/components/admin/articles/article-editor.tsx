"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import type { Article, ArticleKind, ArticleMetric } from "@/lib/aws/dynamodb";
import {
  ARTICLE_KIND_CONFIG,
  ARTICLE_STATUSES,
  SEO_LIMITS,
  articleStatusLabel,
  articleStatusTone,
  deriveExcerpt,
  editorialWarnings,
  isPublishIntent,
  kindHas,
  NEWS_TYPES,
  publishBlockers,
  readingMinutes,
  slugify,
  wordCount,
} from "@/lib/articles";
import { editorialGuide } from "@/lib/editorial";
import { useAuth } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { AdminFormSkeleton } from "@/components/admin/skeletons";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Field, FormInput, FormSection, FormSelect, FormTextarea } from "@/components/admin/forms/primitives";
import { TagInput } from "@/components/admin/forms/tag-input";
import { EditorialGuide } from "@/components/admin/articles/editorial-guide";
import {
  FormActionBar, RecordHeader, WorkspaceButton,
} from "@/components/admin/workspace";
import {
  IconBook, IconBuilding, IconChart, IconEdit, IconEye, IconLayers,
  IconMessage, IconRadar, IconTrash, IconWarning,
} from "@/components/admin/icons";
import { cn } from "@/lib/utils";

/**
 * The editor for one piece, in any of the four sections.
 *
 * The kind decides which field groups render (`kindHas`), so a press release
 * never shows a "reading time" and a blog post never shows a client-approval
 * checkbox. The alternative, one form with every field and half of them
 * greyed out, is how a CMS teaches people to ignore its fields.
 *
 * Two things are load-bearing here and are the reason this is not just a form:
 *
 *   - The publish blockers (rail, bottom) are the editorial standard made
 *     mechanical. A case study with no figures, or a client story with no
 *     signature on file, cannot be saved as published, from this screen or
 *     from a fetch call, since /api/articles applies the same list.
 *   - The guide panel puts the house style beside the field it governs, rather
 *     than in a document nobody opens.
 */
export function ArticleEditor({ kind, id }: { kind: ArticleKind; id: string }) {
  const config = ARTICLE_KIND_CONFIG[kind];
  const guide = editorialGuide(kind);
  const router = useRouter();
  const { user } = useAuth();
  const isNew = id === "new";

  const [form, setForm] = useState<Partial<Article>>({ kind, status: "draft" });
  const [baseline, setBaseline] = useState<string>("");
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  /** Locked once the author edits the slug, so a headline fix cannot move a live URL. */
  const slugTouched = useRef(false);

  const set = useCallback(<K extends keyof Article>(key: K, value: Article[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isNew) {
      // A new piece is pre-signed by whoever is writing it. Only blog posts
      // carry a byline on the site, but recording the author on every kind is
      // what makes "who wrote this?" answerable a year later.
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
        const response = await fetch(`/api/articles/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load");
        if (cancelled) return;
        const loaded: Partial<Article> = {
          tags: [],
          services: [],
          metrics: [],
          ...data.article,
        };
        setForm(loaded);
        setBaseline(JSON.stringify(loaded));
        slugTouched.current = true; // an existing slug is a published promise
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isNew, kind, user?.name, user?.email]);

  // ── derived ───────────────────────────────────────────────────────────────

  const dirty = baseline !== "" && JSON.stringify(form) !== baseline;

  // Leaving with unsaved words in the box is the one loss this screen can
  // actually cause, so the browser asks. Registered only while dirty.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const blockers = useMemo(() => publishBlockers(form), [form]);
  const warnings = useMemo(() => editorialWarnings(form), [form]);
  const words = useMemo(() => wordCount(form.body), [form.body]);
  const minutes = useMemo(() => readingMinutes(form.body), [form.body]);
  const publishIntent = isPublishIntent(form.status);
  const blockedFromPublishing = publishIntent && blockers.length > 0;

  // ── save ──────────────────────────────────────────────────────────────────

  const save = async () => {
    if (!form.title?.trim()) {
      toast.error("It needs a headline before it can be saved.");
      return;
    }
    if (blockedFromPublishing) {
      toast.error("Not ready to publish. See the checklist on the right.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        kind,
        slug: form.slug || slugify(form.title),
        excerpt: form.excerpt || deriveExcerpt(form.body),
      };
      const response = await fetch(isNew ? "/api/articles" : `/api/articles/${id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save");

      const saved: Partial<Article> = { tags: [], services: [], metrics: [], ...data.article };
      setForm(saved);
      setBaseline(JSON.stringify(saved));
      toast.success(isNew ? `${cap(config.noun)} created` : "Saved");
      if (isNew && data.article?.id) {
        router.replace(`${config.adminPath}/${data.article.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const performDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/articles/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      toast.success("Deleted");
      router.push(config.adminPath);
    } catch {
      toast.error("Failed to delete");
      setDeleting(false);
    }
  };

  // ── states ────────────────────────────────────────────────────────────────

  if (loading) return <AdminFormSkeleton />;

  if (loadError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)]">
          <EmptyState
            variant="error"
            icon={IconWarning}
            title={`Could not open this ${config.noun}`}
            description={loadError}
            action={
              <WorkspaceButton variant="primary" onClick={() => router.push(config.adminPath)}>
                Back to {config.label}
              </WorkspaceButton>
            }
          />
        </div>
      </div>
    );
  }

  const publicUrl = `${config.publicPath}/${form.slug || ""}`;

  return (
    <>
      <RecordHeader
        back={{ label: config.label, href: config.adminPath }}
        title={form.title?.trim() || `New ${config.noun}`}
        subtitle={form.subtitle}
        status={
          <StatusBadge
            tone={articleStatusTone(form.status)}
            label={articleStatusLabel(form.status)}
            size="md"
          />
        }
        meta={
          !isNew ? (
            <>
              <span className="font-mono text-[12.5px]">{publicUrl}</span>
              {form.updatedAt && <span>Updated {fmtDateTime(form.updatedAt)}</span>}
              {form.updatedByName && <span>by {form.updatedByName}</span>}
            </>
          ) : undefined
        }
        actions={
          !isNew ? (
            <>
              {form.status === "published" && (
                <WorkspaceButton asChild>
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <IconEye className="h-4 w-4" aria-hidden="true" />
                    View
                  </a>
                </WorkspaceButton>
              )}
              <WorkspaceButton onClick={() => setConfirmDelete(true)}>
                <IconTrash className="h-4 w-4" aria-hidden="true" />
                Delete
              </WorkspaceButton>
            </>
          ) : undefined
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ── the piece ──────────────────────────────────────────────────── */}
        <div className="min-w-0 space-y-4">
          <FormSection
            icon={IconEdit}
            title="Headline and summary"
            description={guide.premise}
          >
            <div className="space-y-4">
              <Field
                label="Headline"
                required
                htmlFor="title"
                helper={`Aim: ${guide.headline.good}`}
              >
                <FormInput
                  id="title"
                  value={form.title || ""}
                  placeholder="What this piece is, specifically"
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      title,
                      // The slug follows the headline until somebody edits it,
                      // then it stops. A live URL must not move because a typo
                      // was fixed in the title three months later.
                      ...(slugTouched.current ? {} : { slug: slugify(title) }),
                    }));
                  }}
                />
              </Field>

              <Field
                label="URL slug"
                htmlFor="slug"
                hint={`${config.publicPath}/`}
                helper={
                  isNew
                    ? "Set once. Changing it after publication breaks every existing link."
                    : "Changing this breaks links already pointing at the old address."
                }
              >
                <FormInput
                  id="slug"
                  value={form.slug || ""}
                  placeholder="url-slug"
                  onChange={(e) => {
                    slugTouched.current = true;
                    set("slug", slugify(e.target.value));
                  }}
                />
              </Field>

              <Field
                label="Deck"
                htmlFor="subtitle"
                helper="One line under the headline. Who this is for and what they leave with."
              >
                <FormInput
                  id="subtitle"
                  value={form.subtitle || ""}
                  onChange={(e) => set("subtitle", e.target.value)}
                />
              </Field>

              <Field
                label="Summary"
                required
                htmlFor="excerpt"
                hint={`${(form.excerpt || "").length}/${SEO_LIMITS.description}`}
                helper="The card text on the index AND the description in a search result. Write it, do not settle for the generated one."
              >
                <FormTextarea
                  id="excerpt"
                  rows={3}
                  value={form.excerpt || ""}
                  onChange={(e) => set("excerpt", e.target.value)}
                  placeholder="One or two sentences a stranger could act on."
                />
              </Field>
              {!form.excerpt && form.body && (
                <button
                  type="button"
                  onClick={() => set("excerpt", deriveExcerpt(form.body))}
                  className="text-[13px] font-semibold text-[var(--adm-accent)] hover:underline"
                >
                  Start from the first lines of the body
                </button>
              )}
            </div>
          </FormSection>

          {/* Engagement facts, case studies and customer stories */}
          {kindHas(kind, "engagement") && (
            <FormSection
              icon={IconBuilding}
              title="The engagement"
              description="Scanned before a word of the body is read. Leave the client name blank to publish it anonymised."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Client"
                  htmlFor="clientName"
                  helper="Only with written approval. Otherwise leave blank and describe them in the body."
                >
                  <FormInput
                    id="clientName"
                    value={form.clientName || ""}
                    placeholder="Named, or blank for “a Fortune 500 payer”"
                    onChange={(e) => set("clientName", e.target.value)}
                  />
                </Field>
                <Field label="Industry" htmlFor="industry">
                  <FormInput
                    id="industry"
                    value={form.industry || ""}
                    placeholder="Healthcare payer, Manufacturing, Public sector…"
                    onChange={(e) => set("industry", e.target.value)}
                  />
                </Field>
                <Field label="Engagement" htmlFor="engagement" helper="Shape and length, in a phrase.">
                  <FormInput
                    id="engagement"
                    value={form.engagement || ""}
                    placeholder="18-month managed team"
                    onChange={(e) => set("engagement", e.target.value)}
                  />
                </Field>
                <Field label="Client logo URL" htmlFor="clientLogoUrl">
                  <FormInput
                    id="clientLogoUrl"
                    type="url"
                    value={form.clientLogoUrl || ""}
                    placeholder="https://…"
                    onChange={(e) => set("clientLogoUrl", e.target.value)}
                  />
                </Field>
                <Field label="What we delivered" fullWidth htmlFor="services">
                  <TagInput
                    id="services"
                    value={form.services || []}
                    onChange={(v) => set("services", v)}
                    placeholder="Contract search, SAP rollout…"
                    suggestions={config.categories}
                    max={6}
                  />
                </Field>
              </div>
            </FormSection>
          )}

          {/* Challenge / approach / results, case studies */}
          {kindHas(kind, "story") && (
            <FormSection
              icon={IconLayers}
              title="Challenge, approach, results"
              description="The three sections a buyer reads in that order. Each one is the case study; the body below is only the framing."
            >
              <div className="space-y-5">
                <Field
                  label="The challenge"
                  required
                  helper="The business problem and what it was costing them. Not “they needed developers”."
                >
                  <RichTextEditor
                    value={form.challenge || ""}
                    onChange={(html) => set("challenge", html)}
                    placeholder="What was going wrong, and what it cost."
                  />
                </Field>
                <Field
                  label="Our approach"
                  required
                  helper="What we did, in order, including the decisions and the trade-offs. Specific enough that a competitor could copy it."
                >
                  <RichTextEditor
                    value={form.approach || ""}
                    onChange={(html) => set("approach", html)}
                    placeholder="What we actually did."
                  />
                </Field>
                <Field
                  label="The results"
                  required
                  helper="The figures above, in prose, against their baseline. No new metrics here."
                >
                  <RichTextEditor
                    value={form.results || ""}
                    onChange={(html) => set("results", html)}
                    placeholder="What changed, measured."
                  />
                </Field>
              </div>
            </FormSection>
          )}

          {/* Metrics */}
          {kindHas(kind, "metrics") && (
            <FormSection
              icon={IconChart}
              title="The figures"
              description="Two or three, at the top of the page. Each one states what it is measured against, a percentage with no baseline is a hope, not a result."
            >
              <MetricRows
                metrics={form.metrics || []}
                onChange={(metrics) => set("metrics", metrics)}
              />
            </FormSection>
          )}

          {/* Quote */}
          {kindHas(kind, "quote") && (
            <FormSection
              icon={IconMessage}
              title={kind === "customer-story" ? "In their words" : "The client's words"}
              description={
                kind === "customer-story"
                  ? "The quote is the page. Edit for length, never for meaning."
                  : "One quote, from the person who signed the contract."
              }
            >
              <div className="space-y-4">
                <Field label="Quote" required={kind === "customer-story"} htmlFor="quote">
                  <FormTextarea
                    id="quote"
                    rows={3}
                    value={form.quote || ""}
                    onChange={(e) => set("quote", e.target.value)}
                    placeholder="Their sentence, as they said it."
                  />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Said by" htmlFor="quoteAuthor" helper="A named person. Anonymous quotes persuade nobody.">
                    <FormInput
                      id="quoteAuthor"
                      value={form.quoteAuthor || ""}
                      onChange={(e) => set("quoteAuthor", e.target.value)}
                    />
                  </Field>
                  <Field label="Their title" htmlFor="quoteAuthorRole">
                    <FormInput
                      id="quoteAuthorRole"
                      value={form.quoteAuthorRole || ""}
                      placeholder="VP Engineering, Acme Health"
                      onChange={(e) => set("quoteAuthorRole", e.target.value)}
                    />
                  </Field>
                </div>

                {/* Approval. The one control on this screen that can cost an
                    account, so it is a deliberate act with a note attached and
                    not a checkbox someone ticks on the way past. */}
                <div
                  className={cn(
                    "rounded-[10px] border p-4",
                    form.approvalOnFile
                      ? "border-[var(--adm-success)]/30 bg-[var(--adm-success-soft)]"
                      : "border-[var(--adm-warning)]/40 bg-[var(--adm-warning-soft)]",
                  )}
                >
                  <label className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={!!form.approvalOnFile}
                      onChange={(e) => set("approvalOnFile", e.target.checked)}
                      className="adm-hit mt-0.5 h-4 w-4 flex-none rounded-[4px] accent-[var(--adm-accent)]"
                    />
                    <span>
                      <span className="block text-[14px] font-semibold text-[var(--adm-ink)]">
                        {form.clientName || "The client"} has approved this in writing
                      </span>
                      <span className="block text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">
                        {guide.signoff} Until this is ticked, the piece cannot be published.
                      </span>
                    </span>
                  </label>
                  <div className="mt-3">
                    <FormInput
                      value={form.approvalNote || ""}
                      placeholder="Who approved it, when, and where the email lives"
                      onChange={(e) => set("approvalNote", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </FormSection>
          )}

          {/* Press release details */}
          {kindHas(kind, "press") && (
            <FormSection
              icon={IconRadar}
              title="Release details"
              description="The parts a journalist needs before they will run it: what kind of announcement this is, where it is datelined, and who answers the phone."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Announcement type" htmlFor="newsType">
                  <FormSelect
                    id="newsType"
                    value={form.newsType || "press-release"}
                    onChange={(e) => set("newsType", e.target.value)}
                  >
                    {NEWS_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </FormSelect>
                </Field>
                <Field
                  label="Dateline city"
                  required
                  htmlFor="datelineCity"
                  helper="The date half comes from the publish date, so the two can never disagree."
                >
                  <FormInput
                    id="datelineCity"
                    value={form.datelineCity || ""}
                    placeholder="COLUMBUS, Ohio"
                    onChange={(e) => set("datelineCity", e.target.value)}
                  />
                </Field>
                <Field
                  label="Coverage link"
                  fullWidth
                  htmlFor="externalUrl"
                  helper="For “In the press”: link out to whoever wrote it rather than restating their story here."
                >
                  <FormInput
                    id="externalUrl"
                    type="url"
                    value={form.externalUrl || ""}
                    placeholder="https://…"
                    onChange={(e) => set("externalUrl", e.target.value)}
                  />
                </Field>
                <Field label="Media contact" htmlFor="pressContactName">
                  <FormInput
                    id="pressContactName"
                    value={form.pressContactName || ""}
                    onChange={(e) => set("pressContactName", e.target.value)}
                  />
                </Field>
                <Field
                  label="Contact email"
                  required
                  htmlFor="pressContactEmail"
                  helper="A journalist on deadline who cannot reach anyone writes the story without us."
                >
                  <FormInput
                    id="pressContactEmail"
                    type="email"
                    value={form.pressContactEmail || ""}
                    onChange={(e) => set("pressContactEmail", e.target.value)}
                  />
                </Field>
                <Field label="Contact phone" htmlFor="pressContactPhone">
                  <FormInput
                    id="pressContactPhone"
                    type="tel"
                    value={form.pressContactPhone || ""}
                    onChange={(e) => set("pressContactPhone", e.target.value)}
                  />
                </Field>
              </div>
            </FormSection>
          )}

          {/* Body */}
          <FormSection
            icon={IconBook}
            title={kind === "news" ? "The release" : "The piece"}
            description={guide.length}
            action={
              words > 0 ? (
                <span className="flex-none text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]">
                  {words.toLocaleString()} words · {minutes} min read
                </span>
              ) : undefined
            }
          >
            <RichTextEditor
              value={form.body || ""}
              onChange={(html) => set("body", html)}
              placeholder={
                kind === "news"
                  ? "Lead paragraph first: who, what, when, where, why, in 40 words."
                  : "Open at the reader's problem, in their words."
              }
              className="[&>div:last-child]:min-h-[420px]"
            />
          </FormSection>
        </div>

        {/* ── rail ───────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Publishing */}
          <AdminCard>
            <AdminCardHeader title="Publishing" />
            <div className="space-y-4 px-6 py-5">
              <Field label="Status" htmlFor="status" helper={statusHint(form.status)}>
                <FormSelect
                  id="status"
                  value={form.status || "draft"}
                  onChange={(e) => set("status", e.target.value as Article["status"])}
                >
                  {ARTICLE_STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </FormSelect>
              </Field>

              <Field
                label="Publish date"
                htmlFor="publishedAt"
                helper={
                  form.status === "scheduled"
                    ? "It appears on the site the moment this passes. Nothing else needs to happen."
                    : "Leave blank to stamp it when you publish."
                }
              >
                <FormInput
                  id="publishedAt"
                  type="datetime-local"
                  value={toLocalInput(form.publishedAt)}
                  onChange={(e) => set("publishedAt", fromLocalInput(e.target.value))}
                />
              </Field>

              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={!!form.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                  className="adm-hit h-4 w-4 flex-none rounded-[4px] accent-[var(--adm-accent)]"
                />
                <span className="text-[13.5px] font-medium text-[var(--adm-ink-mute)]">
                  Feature at the top of {config.label}
                </span>
              </label>

              {/* The checklist. Ordered blockers first, then the things a
                  reviewer would mention but would not hold the piece for,
                  mixing the two teaches people to skip all of it. */}
              {blockers.length > 0 && (
                <div
                  role={publishIntent ? "alert" : undefined}
                  className="rounded-[8px] border border-[var(--adm-warning)]/40 bg-[var(--adm-warning-soft)] p-3"
                >
                  <p className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-[var(--adm-warning)]">
                    Before it can go out
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {blockers.map((b) => (
                      <li key={b} className="flex gap-1.5 text-[12.5px] leading-relaxed text-[var(--adm-ink-mute)]">
                        <span aria-hidden className="mt-1.5 h-1 w-1 flex-none rounded-full bg-[var(--adm-warning)]" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] p-3">
                  <p className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-[var(--adm-ink-subtle)]">
                    Worth fixing
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {warnings.map((w) => (
                      <li key={w} className="flex gap-1.5 text-[12.5px] leading-relaxed text-[var(--adm-ink-mute)]">
                        <span aria-hidden className="mt-1.5 h-1 w-1 flex-none rounded-full bg-[var(--adm-ink-subtle)]" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {blockers.length === 0 && warnings.length === 0 && (
                <p className="rounded-[8px] border border-[var(--adm-success)]/30 bg-[var(--adm-success-soft)] p-3 text-[12.5px] font-medium text-[var(--adm-success)]">
                  Nothing outstanding. Ready to publish.
                </p>
              )}
            </div>
          </AdminCard>

          {/* Presentation */}
          <AdminCard>
            <AdminCardHeader title="Presentation" />
            <div className="space-y-4 px-6 py-5">
              <Field label="Hero image URL" htmlFor="heroImageUrl">
                <FormInput
                  id="heroImageUrl"
                  type="url"
                  value={form.heroImageUrl || ""}
                  placeholder="https://…"
                  onChange={(e) => set("heroImageUrl", e.target.value)}
                />
              </Field>
              <Field
                label="Image description"
                htmlFor="heroImageAlt"
                helper="What the image shows, for a reader who cannot see it."
              >
                <FormInput
                  id="heroImageAlt"
                  value={form.heroImageAlt || ""}
                  onChange={(e) => set("heroImageAlt", e.target.value)}
                />
              </Field>

              {config.categories.length > 0 && (
                <Field label="Category" htmlFor="category">
                  <FormSelect
                    id="category"
                    value={form.category || ""}
                    onChange={(e) => set("category", e.target.value)}
                  >
                    <option value="">Not categorised</option>
                    {config.categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </FormSelect>
                </Field>
              )}

              <Field label="Tags" htmlFor="tags" helper="Three to six. They are how a reader finds the next piece.">
                <TagInput
                  id="tags"
                  value={form.tags || []}
                  onChange={(v) => set("tags", v)}
                  placeholder="hiring, sap, cloud…"
                  max={8}
                />
              </Field>

              <Field label="Author" htmlFor="authorName" helper="A real colleague. “The team” is not a byline.">
                <FormInput
                  id="authorName"
                  value={form.authorName || ""}
                  onChange={(e) => set("authorName", e.target.value)}
                />
              </Field>
              <Field label="Their role" htmlFor="authorRole">
                <FormInput
                  id="authorRole"
                  value={form.authorRole || ""}
                  placeholder="Principal Recruiter"
                  onChange={(e) => set("authorRole", e.target.value)}
                />
              </Field>
            </div>
          </AdminCard>

          {/* SEO */}
          <AdminCard>
            <AdminCardHeader title="Search and sharing" />
            <div className="space-y-4 px-6 py-5">
              <Field
                label="Search title"
                htmlFor="seoTitle"
                hint={`${(form.seoTitle || form.title || "").length}/${SEO_LIMITS.title}`}
                helper="Leave blank to use the headline."
              >
                <FormInput
                  id="seoTitle"
                  value={form.seoTitle || ""}
                  placeholder={form.title || ""}
                  onChange={(e) => set("seoTitle", e.target.value)}
                />
              </Field>
              <Field
                label="Search description"
                htmlFor="seoDescription"
                hint={`${(form.seoDescription || form.excerpt || "").length}/${SEO_LIMITS.description}`}
                helper="Leave blank to use the summary."
              >
                <FormTextarea
                  id="seoDescription"
                  rows={3}
                  value={form.seoDescription || ""}
                  placeholder={form.excerpt || ""}
                  onChange={(e) => set("seoDescription", e.target.value)}
                />
              </Field>
              <Field
                label="Canonical URL"
                htmlFor="canonicalUrl"
                helper="Only if this was published somewhere else first."
              >
                <FormInput
                  id="canonicalUrl"
                  type="url"
                  value={form.canonicalUrl || ""}
                  onChange={(e) => set("canonicalUrl", e.target.value)}
                />
              </Field>
              <label className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={!!form.noIndex}
                  onChange={(e) => set("noIndex", e.target.checked)}
                  className="adm-hit mt-0.5 h-4 w-4 flex-none rounded-[4px] accent-[var(--adm-accent)]"
                />
                <span className="text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">
                  Keep out of search results. For a page that exists only to be linked to directly.
                </span>
              </label>
            </div>
          </AdminCard>

          <EditorialGuide
            kind={kind}
            bodyIsEmpty={!form.body?.trim()}
            onInsertTemplate={() => set("body", guide.template)}
          />
        </div>
      </div>

      <FormActionBar
        dirty={dirty}
        message={
          blockedFromPublishing
            ? (
              <span className="inline-flex items-center gap-2 font-medium text-[var(--adm-warning)]">
                <span className="h-2 w-2 rounded-full bg-[var(--adm-warning)]" />
                {blockers.length} thing{blockers.length === 1 ? "" : "s"} to settle before publishing
              </span>
            )
            : undefined
        }
      >
        <WorkspaceButton onClick={() => router.push(config.adminPath)}>Cancel</WorkspaceButton>
        <WorkspaceButton
          variant="primary"
          onClick={save}
          disabled={saving || blockedFromPublishing || !form.title?.trim()}
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isNew ? `Create ${config.noun}` : publishIntent ? "Save and publish" : "Save"}
        </WorkspaceButton>
      </FormActionBar>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete this ${config.noun}?`}
        body={
          form.status === "published"
            ? `This is live. Deleting it breaks every link pointing at ${publicUrl}. Archiving keeps the URL working.`
            : "This cannot be undone."
        }
        busy={deleting}
        onConfirm={performDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

// ── metrics editor ───────────────────────────────────────────────────────────

/**
 * The proof points, as rows.
 *
 * Three fields per row, not two, because the third is the one that makes a
 * figure mean anything: "38% faster" is a claim, "38% faster, against their
 * 2025 average" is a result. Capped at six to match the route's normaliser, a
 * results band of ten numbers is a table nobody reads.
 */
function MetricRows({
  metrics,
  onChange,
}: {
  metrics: ArticleMetric[];
  onChange: (metrics: ArticleMetric[]) => void;
}) {
  const update = (index: number, patch: Partial<ArticleMetric>) =>
    onChange(metrics.map((m, i) => (i === index ? { ...m, ...patch } : m)));

  return (
    <div className="space-y-3">
      {metrics.length === 0 && (
        <p className="rounded-[8px] border border-dashed border-[var(--adm-line-strong)] p-4 text-center text-[13px] text-[var(--adm-ink-subtle)]">
          No figures yet. A case study without them is a brochure.
        </p>
      )}

      {metrics.map((metric, i) => (
        <div key={i} className="grid gap-2 sm:grid-cols-[1fr_9rem_1fr_auto]">
          <FormInput
            aria-label={`Metric ${i + 1} label`}
            value={metric.label}
            placeholder="Time to fill"
            onChange={(e) => update(i, { label: e.target.value })}
          />
          <FormInput
            aria-label={`Metric ${i + 1} value`}
            value={metric.value}
            placeholder="38% faster"
            className="font-semibold tabular-nums"
            onChange={(e) => update(i, { value: e.target.value })}
          />
          <FormInput
            aria-label={`Metric ${i + 1} baseline`}
            value={metric.note || ""}
            placeholder="vs. their 2025 average"
            onChange={(e) => update(i, { note: e.target.value })}
          />
          <button
            type="button"
            onClick={() => onChange(metrics.filter((_, index) => index !== i))}
            aria-label={`Remove metric ${i + 1}`}
            className="grid h-10 w-10 place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}

      {metrics.length < 6 && (
        <WorkspaceButton onClick={() => onChange([...metrics, { label: "", value: "" }])}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add a figure
        </WorkspaceButton>
      )}
    </div>
  );
}

// ── small helpers ────────────────────────────────────────────────────────────

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const statusHint = (status?: string) =>
  ARTICLE_STATUSES.find((s) => s.key === status)?.hint ?? "";

/**
 * ISO ⇄ the `datetime-local` input's format, which is local time with no zone.
 * Converting through the local offset rather than slicing the ISO string keeps
 * an author in a different timezone from scheduling a piece for the wrong hour.
 */
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
