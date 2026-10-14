"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { downloadCsv } from "@/lib/csv";
import DataTable, { TableTabs, type Column } from "@/components/portal/DataTable";
import Icon, { type IconName } from "@/components/portal/icons";
import Link from "next/link";
import { Badge, BarList, KeyValue } from "@/components/portal/ui";
import { Button, EmptyState, ErrorState, InsightsSheet, Page, PageHeader, Panel } from "@/components/portal/kit";
import { BarChart, DonutChart, StackedBar } from "@/components/portal/charts";
import { useSession } from "@/components/portal/session";
import { useToast } from "@/components/portal/toast";
import type { Article, ArticleKind, ArticleStatus } from "@/lib/aws/dynamodb";
import {
  ARTICLE_KIND_CONFIG,
  ARTICLE_STATUSES,
  NEWS_TYPES,
  articleStatusLabel,
  byNewest,
  isLive,
  isPending,
  matchesArticleSearch,
  namesAClient,
  publishBlockers,
} from "@/lib/articles";
import {
  ARTICLE_ICONS,
  ArticleStatusBadge,
  ChartFilter,
  CopyLinkButton,
  MiniStat,
  Modal,
  ReadOnlyNote,
  canEdit,
  countBy,
  fmtDate,
  fmtRelative,
} from "./shared";
import { ArticleListSkeleton } from "./skeleton";

export { ArticleStatusBadge };

const ICONS = ARTICLE_ICONS;

/** Queue tabs: every published/scheduled piece is either live or still pending. */
type Tab = "all" | "draft" | "in-review" | "pending" | "live" | "archived" | "signoff";
const inTab = (t: Tab, a: Article) =>
  t === "all" ||
  (t === "live" ? isLive(a) : t === "pending" ? isPending(a) : t === "signoff" ? awaitingSignOff(a) : a.status === t);
const awaitingSignOff = (a: Article) => !a.approvalOnFile && a.status !== "draft" && a.status !== "archived";

const newsTypeLabel = (v?: string) => NEWS_TYPES.find((t) => t.value === v)?.label ?? v ?? "";

/** The second breakdown per kind: category for posts, industry for client pieces, type for news. */
function facetOf(kind: ArticleKind): { label: string; plural: string; value: (a: Article) => string } {
  if (kind === "news") return { label: "Type", plural: "types", value: (a) => newsTypeLabel(a.newsType) || "Untyped" };
  if (namesAClient(kind)) return { label: "Industry", plural: "industries", value: (a) => a.industry || "No industry" };
  return { label: "Category", plural: "categories", value: (a) => a.category || "Uncategorised" };
}

const time = (iso?: string) => (iso ? new Date(iso).getTime() || 0 : 0);

/** Pieces that went live in each of the last `n` months, by publish date. */
function wentLivePerMonth(articles: Article[], n = 12) {
  const now = new Date();
  const months = Array.from({ length: n }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1));
  const counts = months.map(() => 0);
  for (const a of articles) {
    if (!a.publishedAt || a.status === "draft" || a.status === "in-review") continue;
    const d = new Date(a.publishedAt);
    if (Number.isNaN(d.getTime()) || d > now) continue;
    const i = months.findIndex((m) => m.getFullYear() === d.getFullYear() && m.getMonth() === d.getMonth());
    if (i >= 0) counts[i]++;
  }
  return { labels: months.map((m) => m.toLocaleString("en-US", { month: "short" })), counts };
}

type Patch = Partial<Pick<Article, "status" | "featured">>;

export default function ArticleWorkspace({ kind }: { kind: ArticleKind }) {
  const config = ARTICLE_KIND_CONFIG[kind];
  const facet = useMemo(() => facetOf(kind), [kind]);
  const { role } = useSession();
  const editable = canEdit(role);
  const notify = useToast();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Article | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  // Closes the detail drawer once the piece it shows is deleted.
  const closeDetail = useRef<(() => void) | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/articles?kind=${kind}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Couldn't load ${config.plural}.`);
      setArticles(((data.articles as Article[]) || []).sort(byNewest));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Couldn't load ${config.plural}.`);
    } finally {
      setLoading(false);
    }
  }, [kind, config.plural]);

  useEffect(() => {
    void load();
  }, [load]);

  const byId = useMemo(() => new Map(articles.map((a) => [a.id, a])), [articles]);

  /** PATCH needs kind and title (required by the schema); everything else is a partial update. */
  const patchOne = async (a: Article, patch: Patch): Promise<Article> => {
    const res = await fetch(`/api/articles/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: a.kind, title: a.title, ...patch }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Couldn't save the change.");
    return data.article as Article;
  };

  const apply = async (ids: string[], patch: Patch, done: string) => {
    const targets = ids.map((id) => byId.get(id)).filter((a): a is Article => !!a);
    if (!targets.length) return;
    setBusy(true);
    const results = await Promise.allSettled(targets.map((a) => patchOne(a, patch)));
    setBusy(false);
    const saved = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const failed = results.flatMap((r) => (r.status === "rejected" ? [r.reason as Error] : []));
    if (saved.length) {
      const map = new Map(saved.map((a) => [a.id, a]));
      setArticles((all) => all.map((a) => map.get(a.id) ?? a));
      notify(saved.length === 1 ? `“${saved[0].title}” ${done}` : `${saved.length} ${config.plural} ${done}`);
    }
    if (failed.length) {
      const lead = targets.length > 1 ? `${failed.length} of ${targets.length} not changed. ` : "";
      notify(`${lead}${failed[0].message}`, { tone: "error" });
    }
  };

  const remove = async () => {
    const a = pendingDelete;
    if (!a) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/articles/${a.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Couldn't delete it.");
      closeDetail.current?.();
      setArticles((all) => all.filter((x) => x.id !== a.id));
      notify(`Deleted “${a.title}”`);
      setPendingDelete(null);
    } catch (err) {
      notify(err instanceof Error ? err.message : `Couldn't delete this ${config.noun}.`, { tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  // ── derived ───────────────────────────────────────────────────────────────

  const live = articles.filter((a) => isLive(a));
  const pending = articles.filter((a) => isPending(a)).sort((a, b) => time(a.publishedAt) - time(b.publishedAt));
  const countOf = (s: ArticleStatus) => articles.filter((a) => a.status === s).length;
  const signOffCount = namesAClient(kind) ? articles.filter(awaitingSignOff).length : 0;
  const monthly = useMemo(() => wentLivePerMonth(articles), [articles]);
  const byFacet = useMemo(() => countBy(articles, facet.value), [articles, facet]);
  const byStatus = ARTICLE_STATUSES.map((s) => ({ label: s.label, value: countOf(s.key) })).filter((d) => d.value > 0);
  const byAuthor = countBy(articles.filter((a) => a.authorName), (a) => a.authorName!).sort((a, b) => b.value - a.value).slice(0, 6);
  const shown = articles.filter((a) => inTab(tab, a) && (!focus || facet.value(a) === focus));

  const publicUrl = (a: Article) => `${config.publicPath}/${a.slug}`;
  const editUrl = (a: Article) => `${config.adminPath}/${a.id}`;

  // ── columns ───────────────────────────────────────────────────────────────

  const dash = <span className="text-mist-400">—</span>;
  const columns: Column<Article>[] = [
    {
      key: "title",
      header: config.label === "News" ? "Headline" : "Title",
      sortable: true,
      value: (a) => a.title,
      cell: (a) => (
        <div className="flex min-w-[16rem] items-center gap-3">
          {a.heroImageUrl ? (
            <img src={a.heroImageUrl} alt="" className="size-11 shrink-0 rounded-md object-cover" />
          ) : (
            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-mist-100 text-mist-400">
              <Icon name={ICONS[kind]} className="size-5" />
            </span>
          )}
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-medium text-navy-900">
              {a.featured && <Icon name="star" className="size-3.5 shrink-0 text-[#b54708]" title="Featured" />}
              <span className="line-clamp-1">{a.title}</span>
            </p>
            <p className="line-clamp-1 text-[12px] text-mist-500">/{a.slug}</p>
          </div>
        </div>
      ),
    },
    { key: "status", header: "Status", sortable: true, value: (a) => articleStatusLabel(a.status), cell: (a) => <ArticleStatusBadge article={a} /> },
    ...(kind === "blog"
      ? ([
          { key: "category", header: "Category", sortable: true, hideBelow: "lg", value: (a) => a.category || "", cell: (a) => (a.category ? <Badge tone="blue">{a.category}</Badge> : dash) },
          { key: "author", header: "Author", sortable: true, hideBelow: "lg", value: (a) => a.authorName || "", cell: (a) => <span className="whitespace-nowrap">{a.authorName || dash}</span> },
          { key: "reading", header: "Read", sortable: true, hideBelow: "xl", value: (a) => a.readingMinutes || 0, cell: (a) => <span className="tabular-nums">{a.readingMinutes ? `${a.readingMinutes} min` : "—"}</span> },
        ] satisfies Column<Article>[])
      : []),
    ...(kind === "news"
      ? ([
          { key: "type", header: "Type", sortable: true, hideBelow: "md", value: (a) => newsTypeLabel(a.newsType), cell: (a) => (a.newsType ? <Badge tone="blue">{newsTypeLabel(a.newsType)}</Badge> : dash) },
          { key: "dateline", header: "Dateline", sortable: true, hideBelow: "xl", value: (a) => a.datelineCity || "", cell: (a) => <span className="whitespace-nowrap">{a.datelineCity || dash}</span> },
        ] satisfies Column<Article>[])
      : []),
    ...(namesAClient(kind)
      ? ([
          { key: "client", header: "Client", sortable: true, hideBelow: "md", value: (a) => a.clientName || "", cell: (a) => (a.clientName ? <span className="whitespace-nowrap font-medium">{a.clientName}</span> : <span className="text-mist-500">Anonymised</span>) },
          { key: "industry", header: "Industry", sortable: true, hideBelow: "xl", value: (a) => a.industry || "", cell: (a) => <span className="whitespace-nowrap">{a.industry || dash}</span> },
          {
            key: "approval",
            header: "Client approval",
            sortable: true,
            hideBelow: "lg",
            value: (a) => (a.approvalOnFile ? "On file" : "Not signed"),
            cell: (a) => <Badge tone={a.approvalOnFile ? "green" : "amber"}>{a.approvalOnFile ? "On file" : "Not signed"}</Badge>,
          },
        ] satisfies Column<Article>[])
      : []),
    {
      key: "published",
      header: "Publish date",
      sortable: true,
      hideBelow: "md",
      value: (a) => time(a.publishedAt),
      cell: (a) =>
        a.publishedAt ? (
          <span className={`whitespace-nowrap ${isPending(a) ? "text-ocean-700" : ""}`} title={isPending(a) ? "Scheduled, not live yet" : undefined}>
            {fmtDate(a.publishedAt)}
          </span>
        ) : (
          dash
        ),
    },
    { key: "updated", header: "Updated", sortable: true, defaultHidden: true, value: (a) => time(a.updatedAt || a.createdAt), cell: (a) => <span className="whitespace-nowrap text-mist-600">{fmtRelative(a.updatedAt || a.createdAt)}</span> },
    // Hidden by default, but searchable and exportable.
    { key: "excerpt", header: "Summary", defaultHidden: true, value: (a) => a.excerpt || "", cell: (a) => <span className="line-clamp-2 max-w-[28rem]">{a.excerpt || "—"}</span> },
    { key: "tags", header: "Tags", defaultHidden: true, value: (a) => (a.tags || []).join(", ") },
  ];

  // ── detail ────────────────────────────────────────────────────────────────

  const exportCsv = (rows: Article[]) =>
    downloadCsv(
      kind,
      ["Title", "Status", "URL", "Publish date", "Updated", facet.label, "Author", "Client", "Featured", "Tags", "Summary"],
      rows.map((a) => [
        a.title,
        articleStatusLabel(a.status),
        publicUrl(a),
        a.publishedAt ? fmtDate(a.publishedAt) : "",
        fmtDate(a.updatedAt || a.createdAt),
        facet.value(a),
        a.authorName || "",
        a.clientName || "",
        a.featured ? "Yes" : "No",
        (a.tags || []).join(", "),
        a.excerpt || "",
      ]),
    );

  const detail = (row: Article, close: () => void) => {
    const a = byId.get(row.id);
    if (!a) return <EmptyState icon="trash" title={`This ${config.noun} was deleted`} />;
    const blockers = isLive(a) || a.status === "archived" ? [] : publishBlockers({ ...a, status: "published" });
    const next: { status: ArticleStatus; label: string; icon: IconName }[] = (
      [
        { status: "in-review", label: "Send for review", icon: "eye" },
        { status: "published", label: "Publish now", icon: "send" },
        { status: "draft", label: "Back to draft", icon: "edit" },
        { status: "archived", label: "Archive", icon: "clock" },
      ] as const
    ).filter((s) => s.status !== a.status && !(s.status === "published" && isLive(a)));

    return (
      <div className="grid gap-6">
        {a.heroImageUrl && <img src={a.heroImageUrl} alt={a.heroImageAlt || ""} className="aspect-[16/9] w-full rounded-lg object-cover" />}
        <div className="flex flex-wrap items-center gap-2">
          <ArticleStatusBadge article={a} />
          <Badge tone={isLive(a) ? "green" : "grey"}>{isLive(a) ? "On the site" : isPending(a) ? `Goes live ${fmtDate(a.publishedAt)}` : "Not on the site"}</Badge>
          {a.featured && <Badge tone="amber">Featured</Badge>}
          {(a.tags || []).map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
        {a.subtitle && <p className="text-[15px] font-medium text-navy-900">{a.subtitle}</p>}
        {a.excerpt && <p className="text-[15px] text-mist-700">{a.excerpt}</p>}

        <KeyValue
          items={[
            ...(kind === "blog"
              ? [
                  { k: "Author", v: a.authorName ? `${a.authorName}${a.authorRole ? `, ${a.authorRole}` : ""}` : "—" },
                  { k: "Category", v: a.category || "—" },
                  { k: "Reading time", v: a.readingMinutes ? `${a.readingMinutes} min` : "—" },
                ]
              : []),
            ...(kind === "news"
              ? [
                  { k: "Type", v: newsTypeLabel(a.newsType) || "—" },
                  { k: "Dateline", v: a.datelineCity || "—" },
                  { k: "Media contact", v: a.pressContactEmail || "—" },
                ]
              : []),
            ...(namesAClient(kind)
              ? [
                  { k: "Client", v: a.clientName || "Anonymised" },
                  { k: "Industry", v: a.industry || "—" },
                  { k: "Client approval", v: a.approvalOnFile ? a.approvalNote || "On file" : "Not signed" },
                ]
              : []),
            { k: "Publish date", v: fmtDate(a.publishedAt) },
            { k: "Last edited", v: `${fmtRelative(a.updatedAt || a.createdAt)}${a.updatedByName ? ` by ${a.updatedByName}` : ""}` },
            { k: "URL", v: <span className="break-all">{publicUrl(a)}</span> },
          ]}
        />

        {blockers.length > 0 && (
          <div className="rounded-lg bg-[#fffaeb] p-4 ring-1 ring-inset ring-[#fedf89]">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-[#b54708]">
              <Icon name="alert" className="size-4" />
              Before it can go live
            </p>
            <ul className="mt-2 grid list-disc gap-1 pl-5 text-[13px] text-navy-900">
              {blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {editable && (
            <Button icon="edit" href={editUrl(a)}>
              Edit {config.noun}
            </Button>
          )}
          {isLive(a) && (
            <a
              href={publicUrl(a)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-mist-0 px-3 text-[13px] font-medium text-navy-900 ring-1 ring-inset ring-mist-300 hover:bg-mist-50"
            >
              <Icon name="globe" className="size-4" />
              View live
            </a>
          )}
          {isLive(a) && <CopyLinkButton path={publicUrl(a)} />}
        </div>

        {editable && (
          <div className="grid gap-3 border-t border-mist-200 pt-5">
            <p className="text-[12px] font-medium text-mist-500">Status</p>
            <div className="flex flex-wrap gap-2">
              {next.map((s) => (
                <Button key={s.status} size="sm" variant="secondary" icon={s.icon} disabled={busy} onClick={() => apply([a.id], { status: s.status }, `set to ${articleStatusLabel(s.status).toLowerCase()}`)}>
                  {s.label}
                </Button>
              ))}
              <Button size="sm" variant="secondary" icon="star" disabled={busy} onClick={() => apply([a.id], { featured: !a.featured }, a.featured ? "unfeatured" : "featured")}>
                {a.featured ? "Unfeature" : "Feature"}
              </Button>
              <Button size="sm" variant="danger" icon="trash" disabled={busy} onClick={() => {
                  closeDetail.current = close;
                  setPendingDelete(a);
                }}>
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── render ────────────────────────────────────────────────────────────────

  const newHref = `${config.adminPath}/new`;
  const header = (
    <PageHeader
      title={config.label}
      icon={ICONS[kind]}
      section="publishing"
      description={config.purpose}
      actions={
        <>
          <Button variant="secondary" icon="globe" href={config.publicPath}>
            View on site
          </Button>
          {!loading && !error && articles.length > 0 && (
            <InsightsSheet title={`${config.label} insights`} description={`What is scheduled next, how the ${config.plural} break down and how often they go live.`}>
              {(close) => (
                <>
                  <Panel title="Coming up" description="The next pieces to go live" padded={false}>
                    {pending.length === 0 ? (
                      <p className="p-5 text-[14px] text-mist-600">Nothing scheduled.</p>
                    ) : (
                      <ul className="divide-y divide-mist-100">
                        {pending.slice(0, 6).map((a) => (
                          <li key={a.id}>
                            <Link href={editable ? editUrl(a) : publicUrl(a)} className="flex min-h-12 items-center justify-between gap-3 px-5 py-3 text-[14px] hover:bg-mist-50">
                              <span className="min-w-0 truncate font-medium text-navy-900">{a.title}</span>
                              <span className="shrink-0 tabular-nums text-ocean-700">{fmtDate(a.publishedAt)}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Panel>
                  <Panel title={`By ${facet.label.toLowerCase()}`} description="Select one to filter the queue">
                    <ChartFilter
                      label="Filter the queue"
                      data={byFacet}
                      value={focus}
                      onChange={(v) => {
                        setFocus(v);
                        close();
                      }}
                      bare
                    />
                  </Panel>
                  <Panel title="Went live, last 12 months">
                    {monthly.counts.some((n) => n) ? (
                      <BarChart
                        title={`${config.label} that went live each month`}
                        labels={monthly.labels}
                        series={[{ name: config.label, values: monthly.counts }]}
                        highlight={monthly.counts.length - 1}
                        height={260}
                      />
                    ) : (
                      <EmptyState compact icon="calendar" title="Nothing went live in the last year" />
                    )}
                  </Panel>
                  <Panel title={`Share by ${facet.label.toLowerCase()}`}>
                    <DonutChart
                      title={`${config.label} by ${facet.label.toLowerCase()}`}
                      data={byFacet}
                      centerLabel={config.plural[0].toUpperCase() + config.plural.slice(1)}
                      size={140}
                    />
                  </Panel>
                  <Panel title="By status">
                    <StackedBar title={`${config.label} by status`} data={byStatus} />
                  </Panel>
                  {kind === "blog" && byAuthor.length > 0 && (
                    <Panel title="Posts by author">
                      <BarList items={byAuthor} />
                    </Panel>
                  )}
                </>
              )}
            </InsightsSheet>
          )}
          {editable && (
            <Button icon="plus" href={newHref}>
              New {config.noun}
            </Button>
          )}
        </>
      }
    />
  );

  if (loading) {
    return (
      <Page>
        {header}
        <ArticleListSkeleton header={false} label={`Loading ${config.plural}`} />
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        {header}
        <ErrorState title={`Couldn't load ${config.plural}`} message={error} onRetry={load} />
      </Page>
    );
  }

  if (articles.length === 0) {
    return (
      <Page>
        {header}
        <EmptyState
          framed
          variant="first-use"
          icon={ICONS[kind]}
          title={`No ${config.plural} yet`}
          body={config.purpose}
          primary={editable ? { label: "Write the first one", icon: "pen", href: newHref } : undefined}
        />
      </Page>
    );
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "All", count: articles.length },
    { id: "draft", label: "Drafts", count: countOf("draft") },
    { id: "in-review", label: "In review", count: countOf("in-review") },
    ...(namesAClient(kind) ? [{ id: "signoff" as Tab, label: "Awaiting sign-off", count: signOffCount }] : []),
    { id: "pending", label: "Scheduled", count: pending.length },
    { id: "live", label: "Live", count: live.length },
    { id: "archived", label: "Archived", count: countOf("archived") },
  ];
  const tabLabel = tabs.find((t) => t.id === tab)?.label ?? "";
  const statusTabs = <TableTabs label={`${config.label} by status`} value={tab} onChange={setTab} options={tabs.map((t) => ({ value: t.id, label: t.label, count: t.count }))} />;
  // Stat tiles are shortcuts into the tabs; a second click returns to All.
  const pick = (t: Tab) => setTab((cur) => (cur === t ? "all" : t));

  return (
    <Page>
      {header}
      {!editable && <ReadOnlyNote />}

      <section aria-label="At a glance" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Live" value={live.length} icon="globe" hint="on the site now" onClick={() => pick("live")} active={tab === "live"} />
        {namesAClient(kind) ? (
          <MiniStat
            label="Awaiting sign-off"
            value={signOffCount}
            icon="userCheck"
            tone={signOffCount ? "warn" : "default"}
            hint="client approval not on file"
            onClick={() => pick("signoff")}
            active={tab === "signoff"}
          />
        ) : (
          <MiniStat label="In review" value={countOf("in-review")} icon="eye" hint="waiting on a second reader" onClick={() => pick("in-review")} active={tab === "in-review"} />
        )}
        <MiniStat
          label="Scheduled"
          value={pending.length}
          icon="timer"
          hint={pending[0] ? `next ${fmtDate(pending[0].publishedAt)}` : "nothing queued"}
          onClick={() => pick("pending")}
          active={tab === "pending"}
        />
        <MiniStat label="Drafts" value={countOf("draft")} icon="edit" hint="being written" onClick={() => pick("draft")} active={tab === "draft"} />
      </section>

      <section aria-label={`${config.label} queue`} className="grid min-w-0 gap-4">
        {shown.length === 0 ? (
          <div className="min-w-0 rounded-xl bg-mist-0 ring-1 ring-mist-200">
            <div className="border-b border-mist-200 px-2 sm:px-4">{statusTabs}</div>
            <EmptyState
              variant="no-results"
              title={tab === "all" ? `No ${config.plural} for ${focus}` : `Nothing in ${tabLabel}${focus ? ` for ${focus}` : ""}`}
              body="Switch tabs or clear the filters to see the rest."
              onClearFilters={() => {
                setTab("all");
                setFocus(null);
              }}
            />
          </div>
        ) : (
          <DataTable
            rows={shown}
            tabs={statusTabs}
            extraChips={focus ? [{ key: "focus", label: `${facet.label}: ${focus}`, clear: () => setFocus(null) }] : []}
            columns={columns}
            exportName={kind}
            onExport={exportCsv}
            searchMatch={matchesArticleSearch}
            selectable={editable}
            bulkActions={(ids) => (
              <>
                <Button size="sm" variant="secondary" icon="eye" disabled={busy} onClick={() => apply(ids, { status: "in-review" }, "sent for review")}>
                  Send for review
                </Button>
                <Button size="sm" variant="secondary" icon="send" disabled={busy} onClick={() => apply(ids, { status: "published" }, "published")}>
                  Publish
                </Button>
                <Button size="sm" variant="secondary" icon="clock" disabled={busy} onClick={() => apply(ids, { status: "archived" }, "archived")}>
                  Archive
                </Button>
              </>
            )}
            searchPlaceholder={`Search ${config.plural}`}
            filters={[{ key: "facet", label: facet.label, options: byFacet.map((d) => d.label).sort(), value: facet.value }]}
            detailTitle={(a) => a.title}
            renderDetail={detail}
          />
        )}
      </section>

      {pendingDelete && (
        <Modal
          title={`Delete this ${config.noun}?`}
          onClose={() => {
            if (busy) return;
            closeDetail.current = null;
            setPendingDelete(null);
          }}
          footer={
            <>
              <Button variant="ghost" onClick={() => setPendingDelete(null)} disabled={busy} autoFocus>
                Cancel
              </Button>
              {isLive(pendingDelete) && (
                <Button
                  variant="secondary"
                  icon="clock"
                  disabled={busy}
                  onClick={async () => {
                    await apply([pendingDelete.id], { status: "archived" }, "archived");
                    setPendingDelete(null);
                  }}
                >
                  Archive instead
                </Button>
              )}
              <Button variant="danger" icon="trash" loading={busy} onClick={remove}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-[14px] leading-relaxed text-mist-700">
            {isLive(pendingDelete)
              ? `“${pendingDelete.title}” is live. Deleting it breaks every link pointing at ${publicUrl(pendingDelete)}. Archiving keeps the URL working.`
              : `“${pendingDelete.title}” will be removed. This cannot be undone.`}
          </p>
        </Modal>
      )}
    </Page>
  );
}
