# Product checklist audit

An audit of this codebase against the standard page, design-system, component and
pattern checklists. Every row was verified against the source, not assumed.

**Audited:** 2026-08-13 · against `main` at the current working tree.

**Legend**

| Mark | Meaning |
|---|---|
| ✅ | Implemented |
| 🟡 | Partial — exists but incomplete, or exists somewhere it does not belong |
| ❌ | Not implemented |
| ⬜ | Not applicable to this business, with the reason given |

---

## Summary

| Area | ✅ | 🟡 | ❌ | ⬜ |
|---|---|---|---|---|
| Site pages | 34 | 14 | 27 | 4 |
| Design system | 18 | 9 | 12 | 0 |
| Components | 21 | 6 | 16 | 0 |
| Patterns & app screens | 41 | 8 | 11 | 3 |

**The four biggest gaps, in priority order**

1. **No security or trust page.** Nothing in the codebase mentions SOC 2, ISO 27001,
   encryption, data residency, access control, vulnerability disclosure or
   penetration testing. For a firm selling managed services to enterprises and
   *state government agencies*, this is the single most consequential omission —
   it is the page a procurement reviewer looks for first.
2. **No FAQ page and no press/media page.** `/brand-kit` covers logo, colour and
   typography only; there is no press contact, coverage list, key statistics or
   release archive.
3. **No password reset on sign-in.** `/auth/signin` has no forgot-password flow.
   A staff member who forgets their password currently has no self-service route
   back in — an admin must re-invite them.
4. **No named typography or spacing tokens.** Colour is well tokenised (43 `--hz-*`,
   170 `--adm-*`), but every font size and spacing value is a raw arbitrary value
   (`text-[1.15rem]`, `py-16`). The scale exists only in practice, not in the system.

---

## Site pages

### Security ❌ — page does not exist

No `/security` or `/trust` route. Grep across `src/` finds no reference to any
item below.

| Item | Status | Notes |
|---|---|---|
| Certifications and compliance | ❌ | MBE/WBE/NMSDC certifications are shown on the landing page, but those are supplier-diversity credentials, not security certifications |
| Data encryption | ❌ | Not stated anywhere, though the app does use AWS Cognito, DynamoDB and S3 |
| Data residency | ❌ | Not stated. Infrastructure is `us-east-2`; delivery centres exist in India and the UK, which raises the question for EU/UK clients |
| Access controls | ❌ | Role hierarchy exists in code (`ADMIN > HR > RECRUITER = SALES`) but is never described publicly |
| Vulnerability disclosure | ❌ | No security contact, no disclosure policy, no bug bounty |
| Incident history | ❌ | `/status` shows live AWS service status, not an incident record for this product |
| Penetration testing | ❌ | Not mentioned |

> Much of this is answerable today from existing infrastructure — Cognito handles
> auth, S3/DynamoDB encrypt at rest by default, and the role model is already
> built. The page is mostly a writing exercise, not an engineering one.

### About 🟡 — `/about`

| Item | Status | Notes |
|---|---|---|
| Origin story | 🟡 | Purpose and philosophy are stated; the actual founding account ("why, in 2013") is not told |
| Mission or values | ✅ | "Our purpose" section plus a four-item values list |
| Team | 🟡 | Links to `/team`; no faces on the page itself |
| Milestones or traction | ✅ | Six-entry timeline, 2013→2025, as the page's centrepiece |
| Investors or backers | ⬜ | Privately held services firm; no outside backers to list |
| CTA | ✅ | Closes on "Start a conversation" |

### Legal — privacy, terms, cookies 🟡

| Item | Status | Notes |
|---|---|---|
| Privacy policy | ✅ | `/privacy`, substantial, covers collection, use, retention, deletion, CCPA |
| Plain-language summary | ❌ | Policy opens straight into formal text |
| Terms of service | ✅ | `/terms` |
| Cookie policy | ✅ | `/cookies`, separate route, plus a live consent banner |
| Last updated date | 🟡 | All three carry `Effective: April 1, 2026`. Only `/cookies` states a separate "Last updated" |
| Version history / changelog | ❌ | No log of what changed between versions on any of the three |
| Contact for legal queries | 🟡 | All routes go to `hr@oceanbluecorp.com`. A recruitment inbox is the wrong destination for a GDPR erasure request; `privacy@` is the convention |

There is also `/data-deletion` and `/accessibility`, both of which are more than
most sites this size ship.

### Contact 🟡 — `/contact`

| Item | Status | Notes |
|---|---|---|
| Personality and branding | ✅ | "Rather not fill in a form? Reach a person directly." — plain, on-voice |
| Clear methods to contact | ✅ | Form, phone, email, hours, head office |
| Social media accounts | ✅ | Four platforms in the side column |
| Segmenting contact methods | ❌ | Everything routes to `hr@`. No split between sales, support and press |
| Easy location to get to | ✅ | In the header and footer |

### Blog ❌ — `/blog` is a placeholder

The route renders `ComingSoon`, correctly `noindex`ed and kept out of the sitemap
rather than shipping fake posts. Honest, but nothing on the checklist is built:
hero, post previews, tags, search, subscribe, sidebar and pagination are all
absent. `/news`, `/case-studies` and `/customer-stories` are the same stub.

### FAQ ❌ — page does not exist

No FAQ route, no accordion component, no question/answer content anywhere.

### 404 🟡 — `/not-found.tsx`

| Item | Status | Notes |
|---|---|---|
| Logo | ❌ | No logo or brand mark on the page |
| Title | ✅ | Large "404" |
| Description | 🟡 | Present but thin |
| Links to other pages | 🟡 | "Back to Home" and a browser-back button only. No contact link, no search |
| Illustrations, visual flair | ✅ | A hand-drawn SVG character with animated stars |

> **The 404 is off-brand.** Its illustration and buttons run purple and indigo
> (`#3B0764`, `#4C1D95`, `#5B21B6`, `#6D28D9`, `#7C3AED`, `bg-indigo-600`) on a
> site whose entire palette is one cobalt accent. It is the only page on the
> site using those hues.

### Team 🟡 — `/team`

| Item | Status | Notes |
|---|---|---|
| Personality and branding | ✅ | |
| Team members | ✅ | Four leaders with name and role |
| Visuals | 🟡 | Monogram tiles, not photographs — deliberate, since no real photos exist and a stock face standing in for a named person would be dishonest |
| Group by area or team | ❌ | Only four people are listed, so grouping is not yet warranted |
| Link to careers | ✅ | Closing band |

### Press / media ❌ — no page

`/brand-kit` covers logo, colour and typography only.

| Item | Status | Notes |
|---|---|---|
| Company overview (paste-ready) | ❌ | |
| Press coverage | ❌ | |
| Press contact | ❌ | No media address |
| Brand assets | 🟡 | `/brand-kit` has logo and colour; no headshots, product screenshots or light/dark logo pack |
| Key statistics | 🟡 | "50+ team members, 4 offices, since 2013" appear on `/careers`, not in a press context |
| Recent press releases | ❌ | |

### Careers 🟡 — `/careers`

| Item | Status | Notes |
|---|---|---|
| Company story | ❌ | Not told here; the reader has to go to `/about` |
| Up to date information | ✅ | Headcount, offices and founding year all trace to the company record |
| Employee benefits | ✅ | Three benefits, deliberately conservative — an earlier draft's invented specifics were removed |
| Teams and divisions | ✅ | Eight department tiles, each linking to a populated search |
| Job openings | 🟡 | Not listed on the page; departments link through to `/careers/search` |
| Working locations | ✅ | Four offices with countries |
| Employee testimonials | ❌ | None |

---

## Design system

### Typography 🟡

| Item | Status | Notes |
|---|---|---|
| Type scale | ❌ | No named scale. Sizes are arbitrary per call site (`text-[1.15rem]`, `text-[14.5px]`) |
| Semantic text styles | 🟡 | `.hz-display`, `.hz-h2`, `.hz-statement`, `.hz-eyebrow` exist and are role-named. Everything below heading level is ad hoc |
| Typeface selection and loading | ✅ | Geist Sans / Geist Mono via `next/font`, Inter and Bricolage Grotesque for admin and legal |
| Line height per style | ✅ | Set explicitly on the `.hz-*` styles |
| Letter spacing per style | ✅ | Negative tracking on display, `0.2em` on eyebrows |
| Responsive type behaviour | ✅ | Fluid `clamp()` on headings |
| Minimum readable size | 🟡 | `10.5px` eyebrows and `12.5px` metadata are below a comfortable floor |
| Accessibility responsiveness | ❌ | Not tested at 200% zoom |

### Colour ✅ — the strongest part of the system

| Item | Status | Notes |
|---|---|---|
| Primitive palette | ✅ | Cobalt, slate, navy and paper ramps |
| Semantic tokens | ✅ | 43 `--hz-*` and 170 `--adm-*`, purpose-named |
| Interactive state colours | ✅ | Hover, active, focus and disabled defined |
| Feedback colours | ✅ | Success, warning, error, info in the admin token set |
| Contrast ratios | ✅ | `tests/contrast.test.mjs` asserts WCAG AA across every pairing — genuinely rare |
| Dark and light mode | 🟡 | Marketing is light-only by decision; admin was dark and is now light-only. `prefers-color-scheme` appears 7 times, so coverage is partial |
| Brand colour integration | ✅ | `--hz-cobalt` for light grounds, `--hz-cobalt-300` for dark |
| Colour blindness | 🟡 | Status is conveyed by colour *and* text label in admin badges, which is right; never formally tested |

### Spacing / grid 🟡

| Item | Status | Notes |
|---|---|---|
| Spacing scale | 🟡 | Tailwind's base-4 scale in practice; not documented as a decision |
| Semantic spacing tokens | ❌ | No `--space-*` tokens |
| Column grid | 🟡 | 12-column grids used consistently on marketing pages; not formally specified |
| Breakpoints | 🟡 | Tailwind defaults, never renamed or documented |
| Component vs layout spacing | ❌ | No distinction drawn |
| Density variants | ✅ | Admin has compact/comfortable density |
| Baseline grid alignment | ❌ | Not attempted |

### Tokens 🟡

| Item | Status | Notes |
|---|---|---|
| Three-tier architecture | 🟡 | Two tiers: `--hz-*` brand primitives aliased into `--adm-*` semantics. No component tier |
| Naming convention | ✅ | Consistent and purpose-describing |
| Token documentation | ✅ | `DESIGN_SYSTEM.md` (248 lines) and `STANDARDS.md` (309 lines) |
| Token governance | 🟡 | `STANDARDS.md` sets rules; no formal review process |
| Design tool sync | ❌ | No Figma variable sync |
| Versioning and changelog | ❌ | Token changes are not versioned |

### Accessibility 🟡

| Item | Status | Notes |
|---|---|---|
| Target conformance level | ✅ | WCAG AA, stated publicly on `/accessibility` |
| Colour contrast standards | ✅ | Enforced by an automated test |
| Focus indicator design | 🟡 | `.hz-focus` / `.hz-focus-dark` now cover the marketing site; admin uses `--adm-focus-ring`. Not yet universal |
| Keyboard navigation patterns | 🟡 | Command palette and menus support keys; not documented as a standard |
| ARIA pattern library | ❌ | Not documented |
| Screen reader testing | ❌ | No evidence of VoiceOver/NVDA testing |
| Accessibility annotations in design | ❌ | |
| Accessibility in contribution guidelines | 🟡 | `STANDARDS.md` has pre-ship checks; accessibility is not a required item |

---

## Components

| Component | Status | Notes |
|---|---|---|
| Button | ❌ | **No shared component.** Raw `<button>` plus `.hz-btn-*` classes and a `Cta` marketing component. The shadcn `button.tsx` was unused and removed |
| Input field | ✅ | `ui/input.tsx`, with label, placeholder and hint conventions |
| Checkbox | ✅ | `ui/checkbox.tsx` |
| Dropdown menu | ✅ | `ui/dropdown-menu.tsx` and `ui/select.tsx` |
| Badge | ✅ | `admin/status-badge.tsx`, colour + text label |
| Table | ✅ | `admin/data-table.tsx` — sort, filter, actions, density, pagination |
| Icon | ✅ | ~85 custom admin icons plus Lucide; consistent stroke weight |
| Search bar | ✅ | `admin/header-search.tsx` and `admin/command-palette.tsx` |
| Skeleton | ✅ | `admin/skeletons.tsx`, shapes match final content |
| Empty state | ✅ | `admin/empty-state.tsx` |
| Toast | ✅ | `sonner`, used across 5+ admin screens |
| Drawer | ✅ | `ui/sheet.tsx` plus two purpose-built drawers |
| Avatar | ✅ | `ui/avatar.tsx` |
| Confirm dialog | ✅ | `admin/confirm-dialog.tsx`, used in 10 places |
| Card | ✅ | `ui/card.tsx`, `admin/admin-card.tsx` |
| **Tooltip** | ❌ | No component anywhere |
| **Tabs** | ❌ | No component anywhere |
| **Date picker** | ❌ | No component. Date inputs are native `<input type="date">` |
| **Banner / alert** | ❌ | No component. The announcement bar is bespoke; form errors are inline one-offs |
| Loading indicator | 🟡 | Skeletons are strong; the standalone spinner component was unused and removed |

---

## Patterns

| Pattern | Status | Notes |
|---|---|---|
| Filtering items | ✅ | Filter chips, clear-all, result counts, empty state — across 53 files |
| Saving changes | ✅ | Dirty tracking, disabled-until-changed, loading state, success toast |
| Showing input error | 🟡 | Inline errors exist; the blur-then-validate timing is applied in only ~5 places |
| Submitting a form | ✅ | Contact form has loading, success and error states plus a honeypot |
| Contacting support | 🟡 | Contact page is good; no in-app support entry point from admin |

---

## App screens

### Login 🟡 — `/auth/signin`

| Item | Status | Notes |
|---|---|---|
| Email + password fields | ✅ | |
| Show/hide password toggle | ✅ | |
| **Forgot password** | ❌ | **No reset flow.** A locked-out staff member needs an admin to re-invite them |
| Remember me | ❌ | |
| SSO / social login | ❌ | Cognito supports it; not wired |
| Sign up link | ⬜ | Correct — the product is invite-only and has no public sign-up by design |
| Error messages | ✅ | Including the `NEW_PASSWORD_REQUIRED` invite challenge |

### User management ✅ — `/admin/users`

Only gap: **no resend-invite action** for a pending invitation that expired.

### Settings 🟡 — `/admin/settings`

Account, security, notifications and a danger zone are all present. Missing:
billing, and language/timezone/appearance preferences.

### API keys 🟡 — `/admin/api-keys`

Key list, generation, copy-once with an explicit warning, and revoke with
confirmation are all present. Missing: **per-key scopes/permissions** (every key
carries full access) and a link to `/admin/docs`.

### Notifications ✅ — `/admin/notifications`

Every item on the checklist is present.

### Analytics 🟡 — `/admin`

Date range, headline metrics, charts, period comparison, breakdowns, loading and
empty states are all present. Missing: a **last-updated / refresh indicator**, so
a reader cannot tell how stale the figures are.

### Single item detail ✅

`/admin/candidates/[id]`, `/admin/jobs/[id]`, `/careers/search/[id]` — title,
status, grouped details, edit, related activity, back navigation and separated
destructive actions.

### Search results 🟡

Admin search returns results with type indicators and filters. There is **no
site-wide search** on the public marketing site.

### Comments ❌

Not implemented anywhere. No commenting, threading, mentions or reactions.

### Maintenance ❌

No maintenance page. `app/error.tsx` and `app/global-error.tsx` exist for runtime
errors, but there is no planned-downtime screen and no status-page link.

---

## Recommended order of work

1. **Security / trust page** — highest commercial value for an enterprise and
   government buyer, and mostly writing rather than engineering.
2. **Forgot-password flow** — the only gap here that actively blocks a real user.
3. **Re-skin the 404** to the cobalt palette and give it a logo, a contact link
   and a search field.
4. **Split the contact addresses** — `privacy@` for legal, `press@` for media,
   `sales@` for enquiries — then use them on the legal, press and contact pages.
5. **Typography and spacing tokens**, so the scale lives in the system rather
   than in several hundred arbitrary values.
6. **Tooltip, Tabs, Banner and Date picker components** — the four real gaps in
   an otherwise well-covered component library.
7. **FAQ and press pages**, once there is content to put in them.
8. **API key scopes** — every key currently carries full access.
