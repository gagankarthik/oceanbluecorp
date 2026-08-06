# Engineering standards

How code in this repo is written, where it goes, and what must be true before it
ships. Rules are stated with the reason attached — a rule whose reason is gone
should be deleted, not worked around.

Companion documents: `CLAUDE.md` (orientation), `DESIGN_SYSTEM.md` (visual
language and admin component inventory). This file covers structure, naming,
reuse, security, and accessibility.

---

## 1. Structure — where code goes

| Kind of code | Home | Notes |
|---|---|---|
| Pages / routes | `src/app/**` | App Router. A page composes; it does not hold business logic. |
| HTTP handlers | `src/app/api/**/route.ts` | Guard, validate, delegate, respond. No DynamoDB expressions inline. |
| AWS access | `src/lib/aws/*` | The only place the AWS SDK is imported. |
| Pure logic / helpers | `src/lib/*` | No AWS SDK, no React. Safe to import anywhere. |
| Shared admin components | `src/components/admin/*` | Reusable across admin screens. |
| shadcn primitives | `src/components/ui/*` | Generated/vendored. Extend, don't fork. |
| Hooks | `src/hooks/*` | |
| One-off scripts | `scripts/*.mjs` | Dry run by default, `--apply` to write. See §7. |

**A route handler is thin.** Reading DynamoDB means calling a function in
`src/lib/aws/dynamodb.ts`, not building an `UpdateExpression` in the handler.

**Page files should compose, not accumulate.** These are past the point where
that holds and should shed logic into `src/lib` and `src/components/admin` as
they are next touched:

```
2638  src/lib/aws/dynamodb.ts      (acceptable — one entity section per block)
2222  src/app/admin/bench/page.tsx           ← worst offender
1321  src/components/admin/workspace.tsx
1180  src/app/admin/applications/page.tsx
1162  src/app/admin/page.tsx
1080  src/app/admin/candidates/[id]/page.tsx
```

Rule of thumb: past ~600 lines a page is carrying something that belongs in a
component or a lib helper.

---

## 2. Naming conventions

**Files.** `kebab-case.tsx` for everything new (`pipeline-panel.tsx`,
`confirm-dialog.tsx`). `src/components/landing/*` and
`src/components/auth/ProtectedRoute.tsx` use `PascalCase` for historical reasons
— leave them, but do not add to that set. 44 admin components are kebab-case;
that is the convention.

**Code.**

- Components and types: `PascalCase`.
- Functions, variables, props: `camelCase`.
- Module constants and lookup tables: `SCREAMING_SNAKE_CASE`
  (`PIPELINE_STAGES`, `SUBMISSION_STATUS_LABELS`, `MAX_ANALYSIS_ATTEMPTS`).
- Booleans read as assertions: `isStaff`, `hasAnalysis`, `resumeChanged`.
- Async functions that hit the network: `fetchX` / `loadX` (read),
  `createX` / `updateX` / `deleteX` (write).
- Design tokens: `--adm-*`. Never a raw hex in a component — see DESIGN_SYSTEM.md.

**Data-layer return shape.** Every function in `src/lib/aws/*` returns
`{ success: boolean; data?: T; error?: string }`. Callers check `success`; they
never catch a thrown SDK error. List functions return `{ success: true, data: [] }`
on a missing table so a screen renders empty instead of erroring.

**Environment variables.** `NEXT_AWS_*` server-side, `NEXT_PUBLIC_*` only for
values safe in a browser bundle. A table name is
`NEXT_AWS_DYNAMODB_TABLE_<PLURAL_ENTITY>`, and it must appear in three places or
it will silently fall back in production: `.env.local`, `src/lib/aws/config.ts`
(and the `getEnvConfig` copy in `dynamodb.ts`), and `amplify.yml`.

> **Found and fixed in audit:** `.env.local` defined
> `NEXT_AWS_DYNAMODB_TABLE_SITE_CONTENT` while the code read
> `NEXT_AWS_DYNAMODB_TABLE_CONTENT` — it worked only because the hardcoded
> fallback happened to name the same table. Renamed, and now echoed in
> `amplify.yml` too. This is the failure mode the three-places rule exists for.

---

## 3. Reusability — use the helper that exists

Before writing a helper, check this list. Every entry here exists **because it
was duplicated first**.

| Need | Use | Never |
|---|---|---|
| Format a date / time / "3d ago" | `fmtDate`, `fmtDateTime`, `fmtRelative` (`lib/format.ts`) | a local `fmt()` with `toLocaleDateString` |
| Stage age, staleness | `lib/pipeline.ts` (`daysInStage`, `isStale`, `TERMINAL`) | recomputing from `statusHistory` |
| Submission/interview/placement labels, tones, margin | `lib/pipeline-records.ts` | inline switch on status |
| Search a candidate incl. parsed resume | `lib/candidate-search.ts` | a bespoke field list per screen |
| Confirm a destructive action | `<ConfirmDialog>` | `window.confirm` |
| Status chip | `<StatusBadge tone label>` | a hand-rolled span |
| Empty state | `<EmptyState>` | ad-hoc centred text |
| Table | `<DataTable>` | a fresh `<table>` unless the shape genuinely differs |
| Form field | `Field` + `FormInput/FormSelect/FormTextarea` | raw `<input>` in admin |
| Class merging | `cn()` | template-string class concatenation |
| Rich text out of the DB | `renderRichText` / `renderListField` | raw `dangerouslySetInnerHTML` |
| CSV export | `lib/csv.ts` `downloadCsv` | building a blob inline |
| Validate a request body | `lib/validate.ts` | reading fields straight off `body` |
| Throttle an open route | `lib/rate-limit.ts` | an in-memory counter (see §5.4) |

**Denormalise deliberately.** Pipeline records copy `candidateName` and
`jobTitle` so cross-candidate lists need no second read. That is a considered
trade (a renamed candidate goes stale in old records), not an accident — write
the comment when you do it.

---

## 4. The client/server boundary

**Client components must `import type` from `src/lib/aws/*`.** A value import
pulls the AWS SDK — and the `process.env` references around it — into the browser
bundle.

```ts
import type { Application, Submission } from "@/lib/aws/dynamodb";   // correct
import { getApplication } from "@/lib/aws/dynamodb";                 // never in "use client"
```

Verify after touching this boundary:

```bash
grep -rl '"use client"' src --include=*.tsx | xargs grep -l 'from "@/lib/aws'   # inspect each
grep -rc "@aws-sdk" .next/static 2>/dev/null                                     # must be 0
```

A pure helper that needs an AWS *type* (`lib/pipeline-records.ts`,
`lib/candidate-search.ts`) is fine: type imports are erased at build.

*Audit result: 0 violations.*

---

## 5. Security

### 5.1 Every route handler guards first

```ts
const auth = await requireStaff(request);   // or requireAdmin / requireUserAdmin
if (!auth.ok) return auth.response;
```

The guard is the **first statement**, before `request.json()`. Use
`auth.claims.sub` for attribution — never a user id from the body.

Deliberately unguarded, and why:

| Route | Reason |
|---|---|
| `auth/signin`, `auth/session`, `auth/complete-invite` | they establish the session |
| `status` | health check, returns no data |
| `resume/upload` | the public careers form uploads through it |
| `applications` (POST only) | the public careers form posts through it |

### 5.2 Public routes need a field allowlist

An open route must never take privileged fields off the body. Where a route
serves both public and staff callers, resolve the caller and gate explicitly:

```ts
const claims = await getClaims(request);
const isStaff = !!claims && hasStaffAccess(claims.groups);
const staffOnly = <T,>(value: T, fallback: T): T => (isStaff ? value : fallback);
```

> **Found and fixed in audit:** `POST /api/applications` accepted `status`,
> `ownership`, `ownershipName`, `createdBy`, `createdByName`, `rating`, `notes`,
> `addToTalentBench`, `benchAddedBy` and `resumeAnalysis` from anonymous callers.
> An applicant could file themselves as `status: "hired"`, claim ownership, seed
> internal notes a recruiter would read as a colleague's, self-rate, or add
> themselves to the talent bench. All are now gated behind `staffOnly`; a public
> application still succeeds with safe defaults.

### 5.3 Declare the body, do not filter it

`lib/validate.ts`: a handler states the fields it accepts, and everything else is
dropped before it can reach a record.

```ts
const checked = validate(raw, SCHEMAS[kind]);
if (!checked.ok) {
  return NextResponse.json({ error: validationMessage(checked.errors) }, { status: 400 });
}
const body = checked.value;   // declared fields only
```

Gating dangerous fields one at a time (§5.2) fixes the instance. Declaring the
shape fixes the class: a field nobody declared cannot reach the database however
it arrives, including one somebody adds to the client later. Errors name the
field — a 400 reading "Invalid request" costs an afternoon.

Applied to: `api/pipeline`. Everything else predates it; convert on next touch.

### 5.4 Rate limiting

Unauthenticated routes are throttled per client through `lib/rate-limit.ts`
(`RATE_LIMITS.application`, `RATE_LIMITS.resumeUpload`). Three properties matter
and should be preserved by anything added to it:

- The counter lives in DynamoDB, not in a `Map`. Each Lambda instance has its own
  memory and a cold start resets it, so an in-memory counter would report
  protection it does not provide.
- It **fails open**: if the counter cannot be read, the request is allowed. A
  limiter that is down must never be why a real applicant cannot apply.
- Staff are exempt. A recruiter entering a batch is a legitimate burst.

### 5.5 Secrets

- Never `NEXT_PUBLIC_` for a credential. `NEXT_EXTRACTION_SHARED_SECRET` signs
  extraction tickets and is server-side only.
- `.env*` is gitignored (`.gitignore:34`) — confirmed. Keep it that way.
- Amplify env vars must be declared in the console *and* echoed in `amplify.yml`,
  or the deployed runtime silently falls back.
- Outbound service credentials belong in `src/lib/aws/*` or a server-only module,
  never in a component.

### 5.6 HTML and injection

- Rich text is sanitized **at save time** with `sanitizeRichText`
  (`lib/sanitize-server.ts`) — see `api/jobs/route.ts` and `api/jobs/[id]/route.ts`.
  Any new route that stores authored HTML must do the same; `renderRichText`
  trusts what it is given.
- `dangerouslySetInnerHTML` on public pages is JSON-LD from `JSON.stringify`
  only — verified. Keep it to that, or sanitize.
- DynamoDB expressions are always parameterised
  (`ExpressionAttributeNames` / `Values`), never string-built from input.

### 5.7 Known gaps, not yet closed

Recorded honestly rather than left implied:

1. **Validation is not yet on every route.** `lib/validate.ts` exists and guards
   the pipeline routes; the older handlers still hand-check a few fields and pass
   the rest through. Convert each as it is next touched.
2. **Audit trail is partial.** `statusHistory` covers stage changes on an
   application; there is no general record of who edited what.
3. **No optimistic concurrency.** Last write wins, so two people editing one
   candidate silently overwrite each other.

Closed since the audit: the public routes are now rate limited (§5.4), and the
privileged-field hole in §5.2 is gated.

---

## 6. Access and usability

Non-negotiable, and already established in the codebase:

- **Focus is always visible** — the global `:focus-visible` ring in `globals.css`.
  Never `outline: none` without a replacement.
- **Touch targets ≥ 24px** (WCAG 2.5.8). Controls that draw a fixed-size box
  (checkbox, radio, switch) are exempt from the global `min-height` — a
  `min-height` on a 16px checkbox renders a 16×24 rectangle. They carry a
  transparent oversized `::before` instead: 24px by default, 40px in a DataTable
  row where there is room.
- **Every icon-only control gets an `aria-label`**; decorative icons get
  `aria-hidden="true"`.
- **Errors are announced** — `role="alert"` on error blocks.
- **Destructive actions confirm** through `<ConfirmDialog>`, which traps focus,
  closes on Escape, and focuses Cancel first.
- **Skip-to-content link** stays first in the admin layout tab order.
- **A failure never blocks the task.** A resume that will not parse still
  attaches; a failed analysis still lets the record save. Report it and move on.
- **Empty states say what to do next**, not just that something is empty.

---

## 7. Scripts and migrations

One-off work lives in `scripts/*.mjs`, loads `.env.local` itself, and:

- **dry run by default**, mutating only with `--apply`;
- is **idempotent** — safe to run twice (see `create-pipeline-table.mjs`, which
  reports an existing table and refuses to alter it);
- prints what it would do before doing it.

---

## 8. Before it ships

```bash
npm test             # node --test over tests/*.test.mjs — must be green
npm run typecheck    # tsc --noEmit — must exit 0
npm run build        # before deploying
```

There is no ESLint config, so those two are the automated gate.

**What belongs in `tests/`.** Pure functions only — no AWS, no network, no React.
Modules are loaded through `tests/load.mjs` (jiti, already a transitive
dependency), which resolves TypeScript and the `@/*` alias without adding a test
framework. Business rules with money or state transitions in them get a test:
margin, stage progression, what a search matches, how an extraction maps onto a
form.

And by hand:

1. Exercise the change in the running app, including its failure path.
2. For anything touching AWS, verify against the real service — a `scripts/`
   smoke test beats assuming.
3. For a client-boundary change, confirm no `@aws-sdk` in `.next/static`.
4. State plainly what was verified and what was not.

Comments explain **why**, not what. The convention throughout this codebase is a
short note on the decision and the failure it prevents; match it.
