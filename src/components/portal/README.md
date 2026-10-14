# Portal kit

One set of layout, overlay and state components for every `/portal` screen.
Import from `@/components/portal/kit` (server `loading.tsx` files import
`@/components/portal/kit/skeletons`). The area helpers (`recruiting/bits`,
`relationships/shared`, `publishing/shared`) and `ui.tsx` re-export or wrap
these; new code imports the kit directly.

| Component | Use |
| --- | --- |
| `Page` | Page root. `width`: `default` (1600px), `narrow` (forms, settings, one record), `full`. 24px between blocks. |
| `PageHeader` | `title`, `description`, `actions`, `back={{href,label}}`, `tabs`, `meta`. No icon: `icon` and `section` are accepted and ignored. |
| `KpiRow` / `StatCard` | 1 col on phones, 2 from sm, 3 or 4 across. Columns follow child count, or `cols`. `StatCard` has no icon; optional `delta` pill. |
| `InsightsSheet` | List pages' charts: an "Insights" header button, just before the primary action, opening a right sheet with the Panels stacked. Pass `(close) => …` to shut it after a chart filters the table. When the header already has a secondary, pass `open` / `onOpenChange` and open it from the header's ⋯ `ActionMenu` instead (Applications, Talent bench). |
| `InsightsRow` | `primary` (2/3) + `side` (1/3) from lg, stacked below; `more` behind a toggle. Flattens to one column inside `InsightsSheet`. |
| `Panel` | White card: `title`, `description`, `action`, `padded={false}` for edge-to-edge tables. |
| `Modal` | `size` sm/md/lg/xl, `footer`, `role="alertdialog"`. Focus trap, Escape, scroll lock, focus restore; bottom sheet on phones. |
| `ConfirmDialog` | Destructive confirm (`alertdialog`). Cancel takes focus; `busy` blocks closing; `requireText` (e.g. `deleteConfirmText(name, count)`) for typed friction. |
| `Drawer` | Record panel: right from sm (544px, `lg` 768px) on a 20% scrim, 92% bottom sheet on phones. `width` md/lg, `actions`, `footer`. |
| `EmptyState` | `variant` `first-use` / `no-results` (+`onClearFilters`) / `plain`; `primary`, `secondary`, `framed`, `compact`. |
| `ErrorState` | `title`, `message`, `onRetry`, `retrying`. Always offers Get help. |
| `Button` | `loading` disables and shows a spinner without changing width. `Spinner` for inline waits. |
| Skeletons | `Skeleton` block, `ListPageSkeleton`, `DashboardSkeleton`, `DetailSkeleton`, `FormSkeleton`, parts (`HeaderSkeleton`, `KpiRowSkeleton`, `InsightsSkeleton`, `TableSkeleton`, `PanelSkeleton`). |
| `useNavProgress` / `usePortalRouter` | Navigation state (no visible bar; route skeletons are the feedback). `usePortalRouter().push` for programmatic moves. |

## Page anatomy

```tsx
<Page>
  <PageHeader
    title="Clients" description="…"
    actions={<><InsightsSheet title="Clients insights">{/* Panels */}</InsightsSheet><Button icon="plus">Add client</Button></>}
  />
  <KpiRow>{/* 3–4 StatCards */}</KpiRow>
  <DataTable … />
</Page>
```

Detail: `<Page><PageHeader back={{ href: "/portal/clients", label: "Clients" }} … />` then a
`grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]` of Panels. Forms: `<Page width="narrow">`.

## Loading, empty, error

The header always renders; only the body swaps. The skeleton is the same shape as the content.

```tsx
<Page>
  <PageHeader … />
  {isLoading ? <ListPageSkeleton header={false} label="Loading clients" kpis={3} />
   : error && !data ? <ErrorState title="Couldn't load clients" message={error.message} onRetry={reload} />
   : rows.length === 0 ? <EmptyState framed variant="first-use" icon="building" title="No clients yet" body="Add a client to link it to roles." primary={{ label: "Add client", icon: "plus", onClick: openNew }} />
   : <>…</>}
</Page>
```

- Every list route has a `loading.tsx` (`ListPageSkeleton` with its KPI count) for the instant
  route fallback; the dashboard's `Suspense` uses `DashboardSkeleton`. Pages fetch in effects, so
  the page itself must render the skeleton while its hook loads (above).
- Filters emptied the table: `DataTable` shows `no-results`; elsewhere use `variant="no-results"` with `onClearFilters`.
- Saving: `Button loading={saving}`; never swap a button for text.
- Never `animate-pulse`: skeletons use `.kit-skel` (one calm shimmer, off under reduced motion).

## Header actions

One primary and at most one secondary in a `PageHeader`; anything else goes in an
`ActionMenu` (⋯) placed before the primary. Icon-only utilities (Refresh, with `label`)
don't count.

## Type and colour

- Text sizes come from `text-adm-*` only (xs 11.5 labels/badges/meta, base 14 body and
  controls, md 17 panel and modal titles, lg 20, xl 24 page title, 2xl 29 KPI values).
  `tests/type-scale.test.mjs` scans all of `src/app/portal` and `src/components/portal`.
- Status colour is a role class: `text-status-danger`, `bg-status-warning-soft`,
  `ring-status-success-line`, `-hover`, `-strong`, `-mark`, `-on-dark`. No hex in a class
  (`tests/portal-tokens.test.mjs`).
- Text is `mist-600` or darker; `mist-500` is for icons and edges; placeholders are
  `placeholder:text-placeholder`.

## Spacing and responsive rules

- Gutters live on `<main>`: 20px phones, 24px sm, 32px lg. Pages never pad or use negative margins.
- Rhythm: 24px (`gap-6`) between page blocks, 16px (`gap-4`) inside rows of cards, 20px panel padding.
- Container padding and gaps sit on 4px steps; half steps (`py-1.5`, `gap-1.5`) only inside badge, chip and icon atoms.
- Breakpoints: sm 640 (2-col KPIs, centred modals), md 768 (header actions move right, tables
  replace cards), lg 1024 (sidebar appears, insights split), xl 1280 (4 KPIs, sidebar expanded by default).
- Touch targets ≥ 40px (`min-h-10`). The page is the only vertical scroller: a table's header sticks
  under the 64px top bar, and only a table wider than its panel scrolls sideways (first and actions
  columns pinned).
- Sidebar: 216px (240px from 2xl) or a 64px rail (toggle on its edge, remembered per browser;
  default expanded from xl, rail from lg); an off-canvas drawer below lg.
