"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import type { Article, ArticleKind } from "@/lib/aws/dynamodb";
import {
  ARTICLE_KIND_CONFIG,
  ARTICLE_STATUSES,
  articleStatusLabel,
  articleStatusTone,
  byNewest,
  isLive,
  isPending,
  matchesArticleSearch,
  namesAClient,
  NEWS_TYPES,
} from "@/lib/articles";
import { fmtDate, fmtRelative } from "@/lib/format";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminListSkeleton } from "@/components/admin/skeletons";
import { EmptyState } from "@/components/admin/empty-state";
import {
  IconBook, IconEdit, IconEye, IconStar, IconTrash, IconWarning,
} from "@/components/admin/icons";
import {
  ActiveFilters, DisplayMenu, FilterIcon, FilterPill, StatStrip,
  Workspace, WorkspaceButton, WorkspaceSearch, WorkspaceTitle, WorkspaceToolbar,
} from "@/components/admin/workspace";

/**
 * The index screen for one content section.
 *
 * One component for all four kinds rather than four near-identical pages: they
 * share the whole apparatus (search, status filter, publish state, delete) and
 * differ only in which three columns sit in the middle and which second filter
 * is useful. The columns are chosen by kind below; everything else is common.
 */
export function ArticleList({ kind }: { kind: ArticleKind }) {
  const config = ARTICLE_KIND_CONFIG[kind];
  const router = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [facetFilter, setFacetFilter] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebouncedValue(searchQuery, 250);

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/articles?kind=${kind}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Failed to load ${config.plural}`);
      setArticles((data.articles || []).sort(byNewest));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load ${config.plural}`);
    } finally {
      setLoading(false);
    }
  }, [kind, config.plural]);

  useEffect(() => { void fetchArticles(); }, [fetchArticles]);

  // ── derived ───────────────────────────────────────────────────────────────

  /**
   * The second filter, chosen per kind because "Category" is meaningless on a
   * press release and "Type" is meaningless on a blog post. One extra control,
   * never two: the toolbar answers one question per filter (Hick's Law).
   */
  const facet = useMemo(() => {
    if (kind === "news") {
      return {
        label: "Type",
        icon: FilterIcon.type,
        valueOf: (a: Article) => a.newsType || "",
        labelOf: (v: string) => NEWS_TYPES.find((t) => t.value === v)?.label ?? v,
      };
    }
    if (namesAClient(kind)) {
      return {
        label: "Industry",
        icon: FilterIcon.type,
        valueOf: (a: Article) => a.industry || "",
        labelOf: (v: string) => v,
      };
    }
    return {
      label: "Category",
      icon: FilterIcon.type,
      valueOf: (a: Article) => a.category || "",
      labelOf: (v: string) => v,
    };
  }, [kind]);

  const facetValues = useMemo(
    () => [...new Set(articles.map(facet.valueOf).filter(Boolean))].sort(),
    [articles, facet],
  );

  const filtered = useMemo(
    () =>
      articles.filter((a) => {
        const matchesStatus = statusFilter === "all" || a.status === statusFilter;
        const matchesFacet = facetFilter === "all" || facet.valueOf(a) === facetFilter;
        return matchesStatus && matchesFacet && matchesArticleSearch(a, debouncedSearch);
      }),
    [articles, statusFilter, facetFilter, facet, debouncedSearch],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: articles.length };
    for (const s of ARTICLE_STATUSES) counts[s.key] = articles.filter((a) => a.status === s.key).length;
    return counts;
  }, [articles]);

  /**
   * Counts worth a strip: what a reader can see now, what is queued, what is
   * waiting on a person, and, where it applies, how many finished pieces are
   * held up by a signature nobody has chased. That last one is the reason this
   * strip exists, it is invisible in the grid and it is what stalls a section.
   */
  const liveCount = useMemo(() => articles.filter((a) => isLive(a)).length, [articles]);
  const queuedCount = useMemo(() => articles.filter((a) => isPending(a)).length, [articles]);
  const awaitingApproval = useMemo(
    () =>
      namesAClient(kind)
        ? articles.filter((a) => !a.approvalOnFile && a.status !== "draft" && a.status !== "archived").length
        : 0,
    [articles, kind],
  );

  const [rows, setRows] = useLocalStorage<number>(`adm.${kind}.rows`, 25);
  const [hiddenColumns, setHiddenColumns] = useLocalStorage<string[]>(`adm.${kind}.hiddenCols`, []);

  const hasActiveFilters = statusFilter !== "all" || facetFilter !== "all" || debouncedSearch.trim() !== "";
  const clearFilters = () => { setStatusFilter("all"); setFacetFilter("all"); setSearchQuery(""); };

  // ── mutations ─────────────────────────────────────────────────────────────

  const performDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/articles/${pendingDelete.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      setArticles((prev) => prev.filter((a) => a.id !== pendingDelete.id));
      toast.success(`Deleted “${pendingDelete.title}”`);
      setPendingDelete(null);
    } catch {
      toast.error(`Failed to delete this ${config.noun}`);
    } finally {
      setDeleting(false);
    }
  };

  // ── columns ───────────────────────────────────────────────────────────────

  const Blank = () => <span className="text-[var(--adm-ink-subtle)]">—</span>;

  const columns: DataTableColumn<Article>[] = [
    {
      key: "title",
      header: "Title",
      label: "Title",
      locked: true,
      width: "340px",
      sortValue: (a) => a.title,
      cell: (a) => (
        <div className="flex min-w-0 items-center gap-2">
          {a.featured && (
            <IconStar
              className="h-3.5 w-3.5 flex-none text-[var(--adm-warning)]"
              aria-label="Featured"
            />
          )}
          <span className="truncate font-semibold text-[var(--adm-ink)]">{a.title}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      label: "Status",
      width: "130px",
      sortValue: (a) => a.status,
      cell: (a) => (
        <StatusBadge tone={articleStatusTone(a.status)} label={articleStatusLabel(a.status)} size="md" />
      ),
    },
    ...(kind === "blog"
      ? ([
          {
            key: "category",
            header: "Category",
            label: "Category",
            width: "170px",
            hideBelow: "lg",
            sortValue: (a: Article) => a.category || "",
            cell: (a: Article) =>
              a.category ? <span className="text-[var(--adm-ink-mute)]">{a.category}</span> : <Blank />,
          },
          {
            key: "author",
            header: "Author",
            label: "Author",
            width: "160px",
            hideBelow: "xl",
            sortValue: (a: Article) => a.authorName || "",
            cell: (a: Article) =>
              a.authorName ? <span className="text-[var(--adm-ink-mute)]">{a.authorName}</span> : <Blank />,
          },
          {
            key: "reading",
            header: "Read",
            label: "Reading time",
            width: "90px",
            align: "right",
            hideBelow: "xl",
            sortValue: (a: Article) => a.readingMinutes || 0,
            cell: (a: Article) =>
              a.readingMinutes ? (
                <span className="tabular-nums text-[var(--adm-ink-subtle)]">{a.readingMinutes} min</span>
              ) : (
                <Blank />
              ),
          },
        ] as DataTableColumn<Article>[])
      : []),
    ...(kind === "news"
      ? ([
          {
            key: "newsType",
            header: "Type",
            label: "Type",
            width: "160px",
            hideBelow: "lg",
            sortValue: (a: Article) => a.newsType || "",
            cell: (a: Article) =>
              a.newsType ? (
                <span className="text-[var(--adm-ink-mute)]">
                  {NEWS_TYPES.find((t) => t.value === a.newsType)?.label ?? a.newsType}
                </span>
              ) : (
                <Blank />
              ),
          },
          {
            key: "dateline",
            header: "Dateline",
            label: "Dateline",
            width: "170px",
            hideBelow: "xl",
            sortValue: (a: Article) => a.datelineCity || "",
            cell: (a: Article) =>
              a.datelineCity ? (
                <span className="truncate text-[var(--adm-ink-mute)]">{a.datelineCity}</span>
              ) : (
                <Blank />
              ),
          },
        ] as DataTableColumn<Article>[])
      : []),
    ...(namesAClient(kind)
      ? ([
          {
            key: "client",
            header: "Client",
            label: "Client",
            width: "180px",
            hideBelow: "md",
            sortValue: (a: Article) => a.clientName || "",
            cell: (a: Article) =>
              a.clientName ? (
                <span className="truncate font-medium text-[var(--adm-ink-mute)]">{a.clientName}</span>
              ) : (
                <span className="text-[var(--adm-ink-subtle)]">Anonymised</span>
              ),
          },
          {
            key: "industry",
            header: "Industry",
            label: "Industry",
            width: "160px",
            hideBelow: "xl",
            sortValue: (a: Article) => a.industry || "",
            cell: (a: Article) =>
              a.industry ? <span className="text-[var(--adm-ink-mute)]">{a.industry}</span> : <Blank />,
          },
          {
            // The column that stops a finished piece sitting in the queue for a
            // month because nobody remembered whose signature was missing.
            key: "approval",
            header: "Approval",
            label: "Client approval",
            width: "140px",
            sortValue: (a: Article) => (a.approvalOnFile ? 1 : 0),
            cell: (a: Article) =>
              a.approvalOnFile ? (
                <StatusBadge tone="emerald" label="On file" />
              ) : (
                <StatusBadge tone="amber" label="Not signed" />
              ),
          },
        ] as DataTableColumn<Article>[])
      : []),
    {
      key: "published",
      header: "Published",
      label: "Published",
      width: "150px",
      sortValue: (a) => new Date(a.publishedAt || 0).getTime(),
      cell: (a) => {
        if (!a.publishedAt) return <Blank />;
        const upcoming = isPending(a);
        return (
          <span
            className={`tabular-nums ${upcoming ? "text-[var(--adm-info)]" : "text-[var(--adm-ink-mute)]"}`}
            title={upcoming ? "Scheduled, not live yet" : undefined}
          >
            {fmtDate(a.publishedAt)}
          </span>
        );
      },
    },
    {
      key: "updated",
      header: "Updated",
      label: "Updated",
      width: "130px",
      hideBelow: "xl",
      sortValue: (a) => new Date(a.updatedAt || a.createdAt).getTime(),
      cell: (a) => (
        <span className="text-[var(--adm-ink-subtle)]">{fmtRelative(a.updatedAt || a.createdAt)}</span>
      ),
    },
  ];

  const rowActions = (a: Article) => (
    <div className="flex items-center gap-0.5">
      {isLive(a) && (
        <a
          href={`${config.publicPath}/${a.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={`View “${a.title}” on the site`}
          title="View on the site"
          className="grid h-9 w-9 place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-accent-soft)] hover:text-[var(--adm-accent)]"
        >
          <IconEye className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
      <Link
        href={`${config.adminPath}/${a.id}`}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Edit “${a.title}”`}
        title="Edit"
        className="grid h-9 w-9 place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-accent-soft)] hover:text-[var(--adm-accent)]"
      >
        <IconEdit className="h-4 w-4" aria-hidden="true" />
      </Link>
      <button
        onClick={(e) => { e.stopPropagation(); setPendingDelete(a); }}
        aria-label={`Delete “${a.title}”`}
        title="Delete"
        className="grid h-9 w-9 place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger)]"
      >
        <IconTrash className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );

  // ── states ────────────────────────────────────────────────────────────────

  if (loading) return <AdminListSkeleton stats={4} rows={8} />;

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]">
          <EmptyState
            variant="error"
            icon={IconWarning}
            title={`Could not load ${config.plural}`}
            description={error}
            action={<WorkspaceButton variant="primary" onClick={fetchArticles}>Retry</WorkspaceButton>}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <WorkspaceTitle
        title={config.label}
        meta={config.purpose}
        actions={
          <WorkspaceButton variant="primary" onClick={() => router.push(`${config.adminPath}/new`)}>
            <Plus className="h-4 w-4" />
            New {config.noun}
          </WorkspaceButton>
        }
      />

      <StatStrip
        items={[
          { label: "Live", value: liveCount, tone: "success", hint: "Visible on the site right now" },
          {
            label: "Scheduled",
            value: queuedCount,
            hint: "Approved, waiting for its publish date",
            onClick: () => setStatusFilter("scheduled"),
          },
          {
            label: "In review",
            value: statusCounts["in-review"] || 0,
            tone: (statusCounts["in-review"] || 0) > 0 ? "warning" : "default",
            hint: "Written, waiting on a second reader",
            onClick: () => setStatusFilter("in-review"),
          },
          ...(namesAClient(kind)
            ? [{
                label: "Awaiting sign-off",
                value: awaitingApproval,
                tone: (awaitingApproval > 0 ? "warning" : "success") as "warning" | "success",
                hint: "Finished, but the client has not approved it yet",
              }]
            : [{ label: "Drafts", value: statusCounts.draft || 0, onClick: () => setStatusFilter("draft") }]),
        ]}
      />

      <WorkspaceToolbar
        variant="canvas"
        search={
          <WorkspaceSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={`Filter ${config.plural} by title, client or tag`}
          />
        }
        trailing={
          <DisplayMenu
            columns={columns.map((c) => ({ key: c.key, label: c.label ?? c.key, locked: c.locked }))}
            hidden={hiddenColumns}
            onHiddenChange={setHiddenColumns}
            rows={rows}
            onRowsChange={setRows}
            onReset={() => { setHiddenColumns([]); setRows(25); }}
          />
        }
      >
        <FilterPill
          label="Status"
          icon={FilterIcon.status}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "All" },
            ...ARTICLE_STATUSES.map((s) => ({
              value: s.key as string,
              label: s.label,
              count: statusCounts[s.key] || 0,
            })),
          ]}
        />
        {facetValues.length > 0 && (
          <FilterPill
            label={facet.label}
            icon={facet.icon}
            value={facetFilter}
            onChange={setFacetFilter}
            options={[
              { value: "all", label: `All ${facet.label.toLowerCase()}` },
              ...facetValues.map((v) => ({
                value: v,
                label: facet.labelOf(v),
                count: articles.filter((a) => facet.valueOf(a) === v).length,
              })),
            ]}
          />
        )}
      </WorkspaceToolbar>

      <ActiveFilters
        variant="canvas"
        chips={[
          ...(statusFilter !== "all"
            ? [{ label: `Status: ${articleStatusLabel(statusFilter)}`, onClear: () => setStatusFilter("all") }]
            : []),
          ...(facetFilter !== "all"
            ? [{ label: `${facet.label}: ${facet.labelOf(facetFilter)}`, onClear: () => setFacetFilter("all") }]
            : []),
        ]}
        onClearAll={clearFilters}
      />

      <Workspace>
        <DataTable
          noun={config.plural}
          storageKey={`articles-${kind}`}
          columns={columns}
          rows={filtered}
          rowKey={(a) => a.id}
          onRowClick={(a) => router.push(`${config.adminPath}/${a.id}`)}
          initialSort={{ key: "published", dir: "desc" }}
          pageSize={rows}
          onPageSizeChange={setRows}
          hiddenColumns={hiddenColumns}
          rowActions={rowActions}
          pinFirstColumn
          empty={{
            icon: IconBook,
            title: articles.length === 0 ? `No ${config.plural} yet` : `No ${config.plural} match your filters`,
            description:
              articles.length === 0 ? config.purpose : "Try a different search, or clear a filter.",
            action:
              articles.length === 0 ? (
                <WorkspaceButton variant="primary" onClick={() => router.push(`${config.adminPath}/new`)}>
                  <Plus className="h-4 w-4" />
                  Write the first one
                </WorkspaceButton>
              ) : hasActiveFilters ? (
                <WorkspaceButton onClick={clearFilters}>
                  <X className="h-4 w-4" />
                  Clear filters
                </WorkspaceButton>
              ) : undefined,
          }}
        />
      </Workspace>

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete this ${config.noun}?`}
        body={
          pendingDelete && isLive(pendingDelete)
            ? `“${pendingDelete.title}” is live. Deleting it breaks every link pointing at ${config.publicPath}/${pendingDelete.slug}. Archiving keeps the URL working.`
            : "This cannot be undone."
        }
        busy={deleting}
        onConfirm={performDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
