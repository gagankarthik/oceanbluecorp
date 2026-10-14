# Portal design briefs: Relationships, Publishing, Workspace

What each page is for and what it asks of the user, gathered from the old `/admin` screens
(`git show HEAD:src/app/admin/...`), the current `/portal` screens, the API routes, and the
validation libraries. Designers should build from the **purpose and inputs** here, not from
the current look. Rules in `docs/DESIGN_LAWS.md` and `docs/DESIGN_SYSTEM.md` still apply.

**Sources, cited as short paths:**
`config.ts` = `src/lib/auth/config.ts` (routeAccess, role sets) · `verify.ts` = `src/lib/auth/verify.ts`
· `fv.ts` = `src/lib/form-validation.ts` (`LIMITS`: name 100, title 120, short 200, email 254, url 2048)
· `articles.ts` = `src/lib/articles.ts` (`ARTICLE_SCHEMA`, `publishBlockers`, `editorialWarnings`, `SEO_LIMITS` 60/160)
· `editorial.ts` = `src/lib/editorial.ts` · `rel/shared` = `src/components/portal/relationships/shared.tsx`.

**Roles.** Admin, HR, Recruiter, Sales, Media (Media shows as "marketing" inside
`src/lib/portal/roles.ts`). Page access is the longest-prefix match in `routeAccess`. The API
guard is what actually binds; the UI gate is a courtesy.

---

# RELATIONSHIPS

## 1. Contacts list (`/portal/contacts`)

### Purpose
This is the inbox for the public website contact form. The primary task is triage: see who
wrote, reply, and move each enquiry from New to Responded or Archived. There are two kinds of
sender: companies **hiring staff**, and people **looking for work**. An `inquiryType` that
starts with "Job Seeker - " marks a job seeker (`src/lib/contact.ts`).

### Who uses it
- Page: Admin and HR (`routeAccess["/portal/contacts"]`).
- API: `requireUserAdmin` (Admin and HR) on GET, PATCH and DELETE. POST is public, rate-limited and spam-filtered.
- Recruiter, Sales and Media get no access. Both roles that can open the page have the same powers.

### What it shows (priority order)
1. **Awaiting a reply**: the count of `status=new`. This is the number that drives work.
2. The table: Name (avatar plus email; bold when unread) · For (Hiring staff / Looking for work) · Company (blank for seekers) · Enquiry / area · Status · Received (relative time; full timestamp on hover).
   Hidden columns you can switch on: Email, Phone, Job title, LinkedIn, Date, Message.
3. KPIs: total enquiries (with "N in the last 30 days" and a 12-week sparkline) · awaiting reply · looking for work vs hiring.
4. Insights: enquiries per week for the last 12 weeks, split hiring vs seeker · a donut by type (top 5 plus "Other") whose chips also filter the table.

Statuses: New (blue) · Read · Responded (green) · Archived. The Archived tab is hidden while the archive is empty.

### Inputs
| Field | Type | Notes |
|---|---|---|
| Search | text | Matches name, email, company and message. `?search=` deep link pre-fills it. |
| Status tabs | segmented | All / New / Read / Responded / Archived, each with a count |
| Filter "For" | select | Hiring staff, Looking for work |
| Filter "Enquiry" | select | The distinct topics in the data |
| Status (per row, in the drawer) | segmented | `PATCH /api/contacts/:id {status}`. The server accepts only new, read, responded, archived. |

The API also accepts `notes` on PATCH (`updateContactStatus(id, status, notes)`), and the drawer
shows notes, but **no screen can write them**. That is a gap: either add a notes field or remove it.

Reference for what the public form sends (`api/contacts/route.ts`): firstName and lastName (max 60;
letters, space, `.`, `'` and `-`, starting with a letter) · email (max 254) · phone (optional, 7–20 digits)
· company (max 120; required unless the sender is a job seeker) · jobTitle (max 120) ·
inquiryType (2–60 characters) · linkedinUrl (optional, max 2048) · message (10–4000).

### Actions
- Row click opens a **drawer** with Reply (a `mailto:` with subject "Re: {type} enquiry", which also sets the status to Responded), Call (`tel:`, only when a phone is on file), Open record, the status segmented control, and Delete.
- **Bulk** (rows selected): Mark read · Mark responded · Archive. These update optimistically, roll back on failure, and toast how many failed (for example "2 of 5 couldn't be updated").
- Export CSV: the full record for the filtered rows, whatever columns are showing.
- **Destructive:** Delete enquiry. It uses an inline confirm ("removed permanently, cannot be undone"). There is no undo.

### States
- Loading: a page skeleton.
- Error before any data has loaded: "Couldn't load contacts" with Retry.
- First use: "No enquiries yet. Submissions from the website contact form appear here."
- No results: "No enquiries match your filters". The old admin had a "Clear filters" button here; the portal dropped it, so bring it back.
- Permission denied: the RoleGate "no access" panel.
- Gone: if the drawer is open on a record someone else deleted, show a "This enquiry was deleted" notice.

### Workflow links
- In: notification `contact_received` → `/portal/contacts/{id}`; the command palette → `?search=`.
- Out: the record page `/portal/contacts/{id}`, the mail client, the phone.

### Design notes
- Lay it out as an inbox: a list with a drawer, or a split pane on wide screens. Unread weight matters more than the charts. Put the **New** queue above the fold, and push the analytics below the table or behind a "Trends" disclosure. Charts above an inbox slow down triage.
- Reply is the primary action and it changes status as a side effect. Say so in the button, for example "Reply (marks responded)", or show a toast with Undo.
- On mobile, the list is cards (name, type chip, status, age) and the drawer opens full-screen.
- Pain points: opening the drawer does **not** mark an enquiry read, but opening the full record page does. Pick one rule. There are two different status tones (portal: Read grey, Archived red; old: Read sky, Archived slate). Archived should not be red, because archiving is not an error.

## 2. Contact detail (`/portal/contacts/[id]`)

### Purpose
This page shows the full enquiry for reading and replying. It is the deep-link target from
notifications and emails. The primary task is to read the message and respond.

### Who uses it
Admin and HR, the same as the list.

### What it shows
- Header: the name, the job title as a subtitle, a status badge, and a facts line: email (`mailto:`) · phone (`tel:`) · "Looking for work · {area}" or the company · LinkedIn (shown only for `http(s)` URLs) · received date and time.
- Main: the message card, titled "{type} enquiry", with pre-wrapped text capped at 70ch.
- Rail: a **Respond** card (Reply via email; Mark as responded, hidden once responded; a status menu) and a **Contact details** card (Email, Phone, Company, Job title, Enquiry type, Received, Updated).

### Inputs
- Status menu with New, Read, Responded and Archived → `PATCH /api/contacts/:id {status}`. It updates optimistically and reverts on failure.
- **Auto side effect:** opening a `new` enquiry PATCHes it to `read`. If that fails, the toast offers Retry and the status goes back to `new`.

### Actions
Reply via email (also marks it responded) · Mark as responded · Delete enquiry. **Destructive:** delete uses a ConfirmDialog ("Delete contact?") and then returns to the list.

### States
Loading skeleton · 404 "Enquiry not found: it may have been deleted, or the link is out of date" (no action) · other errors show "Could not load this enquiry" with Retry.

### Workflow links
Back to `/portal/contacts`. This page is the target of `contact_received` notifications and of the SES email link.

### Design notes
- Read-first layout: the message on the left at a readable measure, actions on the right. On mobile, the Respond card should come **above** the message as a sticky action bar.
- If the list keeps its drawer, this page and the drawer should share one component. Today they are two separate implementations (`ContactsView.ContactDetail` and `admin/contacts/contact-detail.tsx`) with different fact sets.
- Add a notes field for internal context. The API already supports it.

## 3. Clients (`/portal/clients`): list, detail, add/edit

### Purpose
This is the register of companies we place consultants with. Job postings link to a client
(`job.clientId`), so the page also answers "how many roles do we hold for them?". The primary
tasks are to find a client, check their open roles, and keep contact details current.

### Who uses it
- Page: Admin and HR.
- API: `requireStaff` (all four recruiting roles) on every method. The UI is stricter than the API. Either align them, or accept that recruiters and sales can read the list through the job form's client picker.
- There are no role differences inside the page.

### What it shows
1. Table: Client (avatar, name, domain) · Contact (email or phone, or "No contact on file") · Location (city, state) · Roles ("N open of M") · Status (Active/Inactive) · Added. Hidden columns: Website, Email, Phone, Address, ZIP.
2. KPIs: Active clients (of total) · Open roles (across N clients) · **Missing contact details** (no email and no phone; this is a data-quality prompt).
3. Insights: a bar chart of roles by client (top 8, open vs other) · a stacked active/inactive bar · the top 5 states.
4. A Table/Cards view toggle. The cards show name, domain, location, open and all roles, contact, and added date.

**Detail drawer:** header and status · Edit client · Website (opens in a new tab) · Email · stat tiles (Open roles, All roles, Added) · facts (Email, Phone, Address, Location and ZIP, Last updated) · **Roles**: a linked job list built from `useJobSummaries` filtered by `clientId` · Delete.

### Inputs: Add/Edit client (modal, `size=lg`)
| Field | Type | Req. | Validation (fv.ts / api) | Default |
|---|---|---|---|---|
| Client name | text | **yes** | "Enter the client's name." · max 100 (`LIMITS.name`) | blank |
| Website | text (url keyboard) | **yes** | `website()`: https:// is optional and added on save (`normalizeWebsite`) · max 2048. API: `isUrl` after normalising | blank |
| Status | select: Active / Inactive | **yes** (the API requires it) | must be `active` or `inactive` | Active |
| Email | email | no | `email()` · max 254 · API regex | |
| Phone | tel | no | `phone()`: 7–20 digits, extension allowed | |
| Street address | text | no | max 200 | |
| City | text | no | max 100 | |
| State | text (free) | no | max 100 | |
| ZIP code | text (numeric keyboard) | no | max 10 | |

Submit: `POST /api/clients` (create) or `PATCH /api/clients/:id`. The whole form is sent. On PATCH, `""` clears a field.
A **discard guard** (`useDiscardGuard`) asks before closing a dirty form. A server error shows as a FormError banner at the top of the form.

### Actions
Add client (primary, in the header) · Edit · Open website · Email · Export CSV (full record including role counts) · Filters (State, Contact details on file/missing, Has/No open roles) · status chips.
**Destructive:** Delete client uses an inline confirm: "Roles that name it keep their copy of the name. This cannot be undone." There is no bulk action.

### States
Skeleton · "Couldn't load clients" with Retry · first use "No clients yet. Add your first client to start tracking accounts." (cards view: an Add client button) · "No clients match your filters" (cards: Clear filter) · the roles chart is empty until a job is linked ("Pick a client on a job posting and it shows up here") · the linked-roles list has its own loading and error state.

### Workflow links
Linked roles → `/portal/jobs/{id}`. Clients are picked on the job form (commercial field: hidden from Media).

### Design notes
- A list with a detail drawer is right. The form is short and grouped as identity → contact → address, which works well in a modal. Keep it to three groups.
- State is free text, so "OH" and "Ohio" both appear in the by-state facet. Use a US-state select or a combobox (see the shared patterns).
- Treat Missing contact details as a fix-it queue: clicking the KPI should apply the filter.
- Cards view duplicates the table and adds little. Drop it, or make it the mobile layout only.
- On mobile, the table collapses to name, open roles and status; the drawer opens full-screen.

## 4. Vendors (`/portal/vendors`): list, detail, add/edit

### Purpose
This is the register of partner staffing vendors (sub-vendors and primes) that we source
through. Each vendor has an internal **vendor lead**, an HR or Admin teammate who owns the
relationship. The primary tasks are to find a vendor, see who owns it, and see the roles that go through it.

### Who uses it
- Page: Admin and HR.
- API: `requireStaff` (all recruiting roles). This is the same mismatch as Clients.

### What it shows
1. Table: Vendor · Contact (contact person or email) · Location (state and ZIP) · Roles (open of all) · Vendor lead (name and role) · Added. Hidden columns: Email, Lead role.
2. KPIs: Vendors (N with roles) · Open roles through vendors · Missing contact details (no contact person and no email).
3. Insights: roles by vendor (bar) · vendors by lead (donut, top 5 plus "Others"; the chips filter the table).
4. Detail drawer: badges "Lead: {name}" and HR/Admin · Edit vendor · Email contact · stat tiles · facts (Contact person, Email, Location, Vendor lead, Last updated) · linked Roles (`job.vendorId`) · Delete.

### Inputs: Add/Edit vendor (modal)
| Field | Type | Req. | Validation | Notes |
|---|---|---|---|---|
| Vendor name | text | **yes** | max 100 | |
| Vendor lead | select (people picker) | **yes** | "Choose the HR or admin teammate who owns this vendor." | Options come from `useUserDirectory()`, filtered to role hr or admin and sorted by name. Each option shows the role as a description. A lead who has since left HR or Admin stays selectable as "Current lead". Helper text: "HR or admin teammates only." |
| Contact person | text | no | max 100 | |
| Email | email | no | `email()` · max 254 | |
| State | text | no | max 100 | |
| ZIP code | text | no | max 10 | |

Payload: `{name, contactPerson, email, state, zipCode, vendorLeadId, vendorLeadName, vendorLeadRole}` →
`POST /api/vendors` / `PATCH /api/vendors/:id`. The API requires `name`, `vendorLeadId`, `vendorLeadName` and `vendorLeadRole`, and `vendorLeadRole` must be `hr` or `admin`.
There is a discard guard on close.

Note: vendors have **no phone, website, address or city**, but clients do. Either confirm this
is intended or give vendors the same contact block (see the inconsistencies section).

### Actions
Add vendor · Edit · Email contact · Export CSV · Filters (Lead role, State, Contact on file/missing) · lead chips.
**Destructive:** Delete vendor uses an inline confirm with the same wording as clients.

### States
The same pattern as Clients. Also: while teammates load, the lead select reads "Loading teammates…" and is disabled when it has no options.

### Workflow links
Linked roles → job detail. Vendors are picked on the job form (commercial field: hidden from Media).

### Design notes
- Same layout as Clients. Clients and Vendors should be **one template** with a different field set.
- The vendor lead is a person picker. Use the shared person-picker component (avatar, name, role) that the jobs pages use for recruitment manager and assignees.

---

# PUBLISHING

All four sections (Blog, Case studies, Customer stories, News) are **one record type** with a
`kind` (`oceanblue-content`, `recordType: "article"`). They share one list template
(`src/components/portal/publishing/ArticleWorkspace.tsx`) and one editor
(`src/components/admin/articles/article-editor.tsx`, mounted at `/portal/<kind>/[id]`, where `id` is a record id or `new`).
What changes between kinds is the field groups (`ARTICLE_KIND_CONFIG[kind].sections`) and the publish rules.

## 5. Shared rules (read before the per-kind pages)

### Who uses it (all four)
- Page: Admin, HR and Media (`PUBLISHING_ROLES`). Media lands on `/portal/blog` after sign-in (`landingRouteFor`).
- API: `/api/articles` POST/PATCH/DELETE use `requirePublisher`. GET is open, but anonymous callers get only live pieces through `toPublicArticle`; a draft returns 404, not 403.
- Inside the page: `canEdit(role)` = admin, hr or marketing. Anyone else would see a read-only note ("View only. Admin, HR and Media can edit this content"), but routeAccess already keeps them out, so in practice everyone who sees the page can edit. **There is no separate approver role.** "In review" is a convention, and any publisher can publish.

### Status model (`ARTICLE_STATUSES`)
| Status | Meaning shown to the user | Live? |
|---|---|---|
| Draft | "Being written. Not on the site." | no |
| In review | "Written, waiting on a second reader." | no |
| Scheduled | "Approved. Goes live on its publish date." | yes, once `publishedAt` ≤ now (`isLive`) |
| Published | "Live on the site now." | yes; a future `publishedAt` makes it **pending** |
| Archived | "Retired. The URL still resolves." | no |

- **Scheduling** is `status=scheduled` plus `publishedAt`. No background job runs: a piece goes live when its date passes.
- Publishing without a date stamps `now`. A PATCH that first moves to `published` with no date stamps `now`.
- **Publish blockers** (`publishBlockers`) apply when the status is `published` or `scheduled`. The editor disables Save and the **API rejects** with 400 `{error, blockers[]}`:
  - every kind: headline; slug; **summary (excerpt)**; scheduled needs a publish date
  - blog: body
  - news: dateline city; press contact email; body **or** external coverage URL
  - case study: challenge; approach; results; ≥1 metric; client approval on file
  - customer story: quote; client approval on file
- **Warnings** (`editorialWarnings`) never block: search title longer than 60 · search description longer than 160 · hero image without alt text · no hero image · blog with no author · blog with no category · quote with no author · a metric with no baseline note.
- **Slug:** follows the headline until it is edited by hand, then locks. Existing records are locked. `slugify` produces lower-case ASCII, max 80 characters on a word boundary. The server makes it unique within the kind with a `-2`, `-3` suffix. A PATCH re-slugs only when the slug actually changed, and revalidates both the old and new URLs.
- **Kind** is fixed at creation; a PATCH cannot move a piece between sections.
- Rich-text fields (`body`, `challenge`, `approach`, `results`) are sanitised server-side. The allowed subset is p, strong, em, ul, ol, li, a.
- `readingMinutes` is computed on the server at 225 wpm. `metrics` are normalised to at most 6 items (label 60, value 40, note 120). A metric missing a label or value is dropped silently.
- Attribution (`createdBy`, `updatedByName`) comes from the session, never from the body.

## 6. Article list: Blog (`/portal/blog`), Case studies, Customer stories, News

### Purpose
Shows where every piece in a section stands, what goes live next, and lets the user start a new
piece. The primary tasks are to find a piece to edit or move it along the status flow, and to write a new one.
Purpose line per kind (shown as the description):
- Blog: "What we know, written by the person who knows it. Useful to a reader who never buys from us."
- Case studies: "One engagement, told as challenge → approach → results, with figures a buyer can check."
- Customer stories: "The client's account in their own words, led by a quote. Shorter and warmer than a case study."
- News: "Dated company announcements in press-release form, written so a journalist can quote them unedited."

### Who uses it
Admin, HR and Media, all with the same powers.

### What it shows
1. KPIs: **Live** (with a 12-month sparkline) · second KPI: **Awaiting sign-off** for case studies and stories (client approval not on file, excluding drafts and archived) or **In review** for blog and news · **Scheduled** ("next {date}") · **Drafts**.
2. Table columns:
   - All kinds: Title/Headline (hero thumbnail or kind icon, a featured star, `/slug`) · Status · Publish date (pending dates in accent with the tooltip "Scheduled, not live yet").
   - Blog: + Category · Author · Read (minutes).
   - News: + Type (press release, award, certification, partnership, milestone, event, in the press) · Dateline.
   - Case studies and stories: + Client (or "Anonymised") · Industry · **Client approval** (On file / Not signed).
   - Hidden: Updated · Summary · Tags.
3. Insights: went live per month for 12 months · donut by facet (category for blog, industry for client pieces, type for news; it also filters the table) · by status · blog only: "Posts by author", otherwise "Coming up" (the next 6 scheduled).

### Inputs (list level)
Search (`matchesArticleSearch`: title, subtitle, excerpt, slug, author, client, industry, category, quote author, tags, services) · Filters: Status, facet · facet chips.

### Actions
- Header: **View on site** (the public section) · **New {noun}** → `/portal/<kind>/new`.
- Detail drawer: hero image · status badge plus "On the site" / "Goes live {date}" / "Not on the site" · Featured · tags · deck and summary · key facts per kind · last edited by · public URL · **"Before it can go live"** blocker list (computed as if publishing) · Edit · View live · Copy link.
- Drawer status buttons (each is a PATCH `{kind, title, status}`): Send for review · Publish now · Back to draft · Archive · Feature/Unfeature (`{featured}`). Publish is hidden when the piece is already live.
- **Bulk** (rows selected): Send for review · Publish · Archive. These run per item and toast "N of M not changed" with the first server error. A bulk publish is still subject to the blockers.
- Export CSV: Title, Status, URL, Publish date, Updated, facet, Author, Client, Featured, Tags, Summary.
- **Destructive:** Delete. The modal asks for confirmation. If the piece is live, the copy says deleting "breaks every link pointing at {url}. Archiving keeps the URL working", and the modal offers an **Archive instead** button. There is no undo.

### States
Skeleton (4 KPI tiles and a table) · error "Couldn't load {plural}" with Try again · **first use**: "No {plural} yet" plus the purpose line plus "Write the first one" · no chart data: "Nothing went live in the last year" / "Nothing scheduled." · a drawer on a deleted piece: "This {noun} was deleted".

### Workflow links
→ `/portal/<kind>/{id}` (editor) · → the public URL `/resources/<section>/<slug>` · `/portal/<kind>/new`.

### Design notes
- Make this a pipeline view, not a dashboard. Above the fold: status tabs with counts (Draft · In review · Scheduled · Live · Archived), the "awaiting sign-off" queue for client pieces, and the table. The old admin had status tabs; the portal replaced them with a filter, which is worse for this workflow. Move the charts below the table or onto a separate "Insights" tab.
- A kanban toggle (columns by status) would suit a four-person editorial team. It is optional, and the drag must still respect the blockers.
- The drawer is useful for quick status changes. Editing always opens the full editor.
- Mobile: a card list (thumbnail, title, status, date). Bulk actions only on desktop.

## 7. Article editor (`/portal/<kind>/[id]`, `id = new | uuid`)

### Purpose
Writes one piece in the house style of its kind, and makes it mechanically impossible to
publish one that breaks the editorial rules. The primary tasks are to write the piece, clear
the checklist, and save or publish it.

### Who uses it
Admin, HR and Media (publishers). The API re-applies the blockers on every write.

### What it shows
- Header: back link to the section · title (or "New {noun}") · deck as subtitle · status badge · meta: the public URL in monospace, "Updated {time} by {email}" · actions: **View** (only when published) and **Delete** (existing pieces only).
- Main column: the field groups in order (below), then the body editor with "N words · M min read".
- Right rail: Publishing (status, date, featured, **checklist**) · Presentation (hero image, category, tags, author) · Search and sharing (SEO) · the **Editorial guide** panel (premise, length, sign-off, structure, rules, good/bad headline, and an "Insert template" button that is enabled only when the body is empty).
- A sticky action bar: dirty indicator · "{N} things to settle before publishing" (warning) · Cancel · Save.

### Inputs: every field, by group and kind

Limits come from `ARTICLE_SCHEMA` (server maxLength). The client re-checks format and length on
blur, after the first save attempt (`useFormErrors`). "Blocker" means it is required only to publish or schedule; a draft can be saved without it.

**A. Headline and summary (all kinds)**
| Field | Type | Req. | Limit / rule | Notes |
|---|---|---|---|---|
| Headline `title` | text | **always** (even for a draft) | 180 | Helper: "Aim: {guide.headline.good}". Typing it updates the slug until the slug is touched. |
| URL slug `slug` | text, prefixed with the public path | blocker | 120 (server), slugify caps it at 80 | Forced to slugify on every keystroke. Helper: changing it after publication breaks links. |
| Deck `subtitle` | text | no | 220 | "One line under the headline. Who this is for and what they leave with." |
| Summary `excerpt` | textarea, 3 rows | blocker | 400 (server); the counter shows `/160` | This is the card text **and** the meta description. A "Start from the first lines of the body" link appears when the summary is empty and the body is not. If still empty, it is auto-filled from `deriveExcerpt(body)` on save. |

**B. The engagement (case study, customer story)**
| Field | Type | Req. | Limit | Notes |
|---|---|---|---|---|
| Client `clientName` | text | no | 120 | Leave it blank to publish anonymised. "Only with written approval." |
| Industry | text | no | 80 | Free text; it drives the list facet. |
| Engagement | text | no | 120 | "18-month managed team" |
| Client logo URL | url | no | 500, must be `https://…` (`url()`) | **URL only, no upload** |
| What we delivered `services` | chip input | no | max 6 chips, each 60 characters | Suggestions are the kind's categories (Contract Staffing, Direct Hire, Managed Teams, Enterprise Platforms, Cloud & Infrastructure, Data & Analytics). Enter or comma adds a chip. |

**C. Challenge, approach, results (case study only)**
| Field | Type | Req. | Limit |
|---|---|---|---|
| The challenge | rich text | blocker | 40,000 |
| Our approach | rich text | blocker | 40,000 |
| The results | rich text | blocker | 40,000 |

**D. The figures `metrics` (case study, customer story)**
A repeatable row of three inputs: **Label** ("Time to fill", max 60) · **Value** ("38% faster", max 40, bold and tabular) · **Baseline note** ("vs. their 2025 average", max 120), plus a remove button.
Up to 6 rows; "Add a figure" hides at 6. Empty state: "No figures yet. A case study without them is a brochure."
Case study: ≥1 is a blocker. Customer story: optional. A missing baseline is a warning.

**E. Quote and approval (case study: "The client's words"; customer story: "In their words")**
| Field | Type | Req. | Limit |
|---|---|---|---|
| Quote | textarea | blocker for a customer story; optional for a case study | 1,200 |
| Said by `quoteAuthor` | text | no (a warning if there is a quote but no author) | 80 |
| Their title `quoteAuthorRole` | text | no | 120 |
| **"{Client} has approved this in writing"** `approvalOnFile` | checkbox in a tinted panel (warning colour when off, success colour when on) | blocker for both kinds | n/a |
| Approval note `approvalNote` | text, placeholder "Who approved it, when, and where the email lives" | no | 400 |

The sign-off text comes from the guide (for example "The client sponsor signs off in writing before it is published. No exceptions.").

**F. Release details (news only)**
| Field | Type | Req. | Limit / rule | Default |
|---|---|---|---|---|
| Announcement type `newsType` | select | n/a | one of press-release, award, certification, partnership, milestone, event, coverage (label "In the press"). Each has a hint in `NEWS_TYPES`, which is not surfaced today. | press-release |
| Dateline city | text, "COLUMBUS, Ohio" | blocker | 80 | |
| Coverage link `externalUrl` | url | blocker **if the body is empty** | 500, https | |
| Media contact `pressContactName` | text | no | 80 | |
| Contact email `pressContactEmail` | email | blocker | 160, `email()` | the signed-in user's email |
| Contact phone `pressContactPhone` | tel | no | 40, `phone()` | |

**G. Body (all kinds)**
A rich-text editor with a minimum height of 420px. Limit 120,000. A blocker for blog; for news only if there is no coverage link; optional for case studies and stories, where it is the framing.
The title is "The release" (news) or "The piece". The description is the guide's target length (blog 900–1,600 words · case study 600–1,000 · news under 500 · story 350–600).
The placeholder for news is "Lead paragraph first…"; for the others, "Open at the reader's problem…".
"Insert template" in the guide drops in a per-kind HTML skeleton. The news template includes the fixed About boilerplate (`PRESS_BOILERPLATE`).

**H. Publishing (rail)**
| Field | Type | Default | Notes |
|---|---|---|---|
| Status | select (the 5 statuses) | draft | The helper is the status hint. |
| Publish date `publishedAt` | `datetime-local`, converted through the local offset to ISO | blank | Helper changes with status. A warning shows when scheduled in the past: "goes live as soon as you save". |
| Feature at the top of {Section} `featured` | checkbox | off | Pins the piece to the top of the public index. |
| Checklist | read-only | n/a | "Before it can go out" (the blockers; becomes `role=alert` when the status is a publish intent) · "Worth fixing" (the warnings) · or "Nothing outstanding. Ready to publish." |

**I. Presentation (rail)**
| Field | Type | Limit | Notes |
|---|---|---|---|
| Hero image URL | url | 500, https | **URL only, no upload or picker.** No hero is a warning. |
| Image description `heroImageAlt` | text | 200 | A warning if there is an image but no alt text. |
| Category | select | 60 | **Blog only** (Hiring & Talent, Engineering, Enterprise Platforms, Compliance, Industry Analysis, Inside Oceanblue), plus "Not categorised". A missing category is a warning on blog. |
| Tags | chip input | 8 max (the helper says "Three to six"), each 40 | |
| Author `authorName` | text | 80 | Pre-filled with the signed-in user's name on new pieces. A missing author is a warning on blog. |
| Their role `authorRole` | text | 80 | "Principal Recruiter" |

The author is shown for every kind, but only blog renders a byline publicly. Consider hiding it or labelling it "Internal author" for the other kinds.

**J. Search and sharing (rail)**
| Field | Type | Limit | Notes |
|---|---|---|---|
| Search title `seoTitle` | text | 200 (server); counter `/60` | Falls back to the headline (shown as the placeholder). |
| Search description `seoDescription` | textarea | 400; counter `/160` | Falls back to the summary. |
| Canonical URL | url | 500, https | "Only if this was published somewhere else first." |
| Keep out of search results `noIndex` | checkbox | n/a | |

**Submit:** `POST /api/articles` (new; it then redirects to `/portal/<kind>/{id}`) or `PATCH /api/articles/:id`, with the whole form plus `kind`, the slug (generated if empty) and the excerpt (derived if empty).
Responses: 201 or 200 `{article}` · 400 `{error, blockers?}` · 404.
The Save label is "Create {noun}" for a new piece, "Save and publish" when the status is published or scheduled, otherwise "Save". Save is disabled while saving or while a publish intent has blockers.

### Actions
Save / Create / Save and publish · Cancel (asks "Discard unsaved changes?" when dirty) · View (when published) · Insert template · Add/remove a figure · **Delete** (ConfirmDialog; when published the copy warns that links will break and suggests archiving, but unlike the list there is **no Archive button here**). There is also a browser-level unsaved-changes guard (`useUnsavedChanges`).

### States
- Loading: form skeleton.
- 404: "This {noun} doesn't exist" (no action).
- Load error: "Couldn't open this {noun}" with Try again (a full page reload).
- Save error: a dismissible banner above the form. The draft stays in memory: "Your changes are still here".
- Blocked: the action-bar message and the rail checklist.
- New: the header reads "New {noun}"; no URL, delete or view.

### Workflow links
Back to the section list · the public URL · after create, `router.replace` to the record URL.

### Design notes
- Recommended layout: a **writing canvas plus a settings side panel**. Headline, deck and body get the canvas, at a comfortable measure. Kind-specific structured groups (engagement, story, figures, quote, release) sit between the summary and the body, in the order the guide says a reader meets them. Status, date, checklist, presentation and SEO go in the side panel.
- Above the fold: the headline, the status and date, and the checklist count ("3 to settle"). The guide and SEO should be collapsible, or tabs in the side panel ("Publish · Details · SEO · Guide").
- Status and date are really one decision. Replace the separate select and date with a **Publish control**: "Save draft" / "Send for review" / "Publish now" / "Schedule…" (which opens the date picker). This removes the impossible combination of scheduled with no date.
- The client-approval control is the most consequential input on the screen. Keep it as a deliberate act with its note, not a stray checkbox.
- Add a **media picker or upload** for the hero image and client logo. Pasting a URL is the main pain point, and the list already renders thumbnails.
- Live preview of the card (title, summary, hero) and the search result snippet next to the SEO fields.
- On mobile, the side panel moves below the canvas as an accordion, and the action bar stays sticky with Save and the blocker count.
- Pain points in the old UI: the summary counter shows /160 against a 400-character limit · the tag helper says 3–6 but the cap is 8 · the `NEWS_TYPES` hints are never shown · the editor has no "Archive instead" · the author shows for kinds that never print it · the editor uses the old admin component kit while the list uses the portal kit.

### Per-kind field matrix (what the editor renders)
| Group | Blog | Case study | Customer story | News |
|---|---|---|---|---|
| Headline, slug, deck, summary | yes | yes | yes | yes |
| Engagement (client, industry, engagement, logo, services) | no | yes | yes | no |
| Challenge / approach / results | no | **required** | no | no |
| Figures (metrics) | no | **≥1 required** | optional | no |
| Quote + approval | no | quote optional, **approval required** | **quote and approval required** | no |
| Release details | no | no | no | **dateline and contact email required** |
| Body | **required** | optional framing | optional framing | required unless there is a coverage link |
| Category select | yes | no | no | no |
| Tags, hero, author, SEO, featured, status/date | yes | yes | yes | yes |

## 8. Content (`/portal/content`)

### Purpose
Edits the **site-wide announcement bar** and shows which stored CMS blocks the redesigned site
still reads. The primary task is to show, change or hide the announcement. It also shows a
read-only maintenance-mode status that links to Settings.

### Who uses it
Admin only (`routeAccess` and `requireAdmin` on GET and PUT `/api/content`).

### What it shows
1. **Announcement bar** editor beside a **live preview** that copies `AnnouncementBar` (a navy bar, a cyan tag pill, the message, and an underlined link label).
2. **Maintenance mode** status: "Site offline" (red) or "Site online" (green), plus the current message, with "Change in Settings".
3. **Stored content blocks** table: Block id · "Used by the site for" (homepage → announcement bar only; site → maintenance mode; help-directory → help page; anything else → "Not read by the site") · field count · last edited by. The drawer lists every field with a "Read by the site" or "Not used" badge, and the help-directory block links to "Edit on the Help page".

### Inputs: announcement (stored on block `homepage`)
| Field | Key | Type | Limit (UI) | Notes |
|---|---|---|---|---|
| Message | `announcement` | textarea, 2 rows | 140 | **Blank hides the bar.** |
| Tag | `announcementTag` | text | 24 | Optional pill before the message ("Now hiring") |
| Link label | `announcementLinkLabel` | text | 32 | Shown only when there is a link; defaults to "Learn more" |
| Link | `announcementHref` | text | must start with `/` or `http(s)://` | "/careers" |
| *(not editable)* | `announcementScroll` | toggle in the old admin | n/a | `getAnnouncement()` still reads it, but the **portal dropped the control**. Restore it or remove it from the reader. |

Submit: `PUT /api/content {id:"homepage", fields}`. A PUT **replaces** every field on the block, so the view merges the legacy homepage keys back in.
Server limits: id ≤100 characters · ≤200 fields · each value ≤100,000 characters and must be text. The server calls `revalidatePath("/", "layout")`, so the change is live immediately.
Counters turn red when over the limit, and Save is disabled while any field is too long or the link is invalid.

The old `/admin/content` edited a lot more copy (homepage hero, stats, CTA; about; services; contact phone, email, address and hours). The redesign reads page copy from code, so those fields are **intentionally gone**. The blocks table explains this.

### Actions
"Save and publish" (or "Save, bar hidden" when the message is blank) · Discard · **Hide the bar** (danger; it saves immediately with an empty message and has no confirm) · Open website · Change in Settings.

### States
Skeleton (two panels) · error: "Couldn't load the site content… Nothing can be saved until it loads, so live copy is never overwritten" with Try again · preview empty: "The bar is hidden" · no blocks: "No content saved yet. Saving the announcement creates the first block."

### Workflow links
→ `/portal/settings` (System tab) for maintenance · → `/portal/help` for the directory · → `/` (the site).

### Design notes
- A form beside its preview is correct. Keep the preview the same size as the real bar and sticky beside the form.
- Hiding the live bar is a one-click public change. Give it a toast with Undo rather than a confirm dialog.
- The blocks table is a developer view. Collapse it under "Advanced: stored blocks".
- Consider moving **maintenance mode onto this page**, so all "public site switches" live in one place, and leaving Settings personal.

---

# WORKSPACE

## 9. Users (`/portal/users`)

### Purpose
Manages staff accounts in Cognito: invite people, give them a role, turn sign-in on or off, and
remove accounts. The primary tasks are to invite a teammate and to change someone's role or access.

### Who uses it
- Page: Admin and HR.
- API: GET `/api/users` uses `requireStaff`; it also feeds the people pickers. PATCH and DELETE `/api/users/:id` and POST `/api/users/invite` use `requireUserAdmin` (Admin and HR) **plus** `denyElevatedAction`.
- **HR vs Admin rules:**
  - HR can invite, and assign only **Sales, Recruiter or Media**. The UI filters the role list; the API returns 403 "Only an administrator can grant the Admin or HR role."
  - HR **cannot** change, deactivate or delete an existing Admin or HR account. The API returns 403 "Only an administrator can change an Admin or HR account." The UI shows a read-only role with a note.
  - **Nobody can change their own account here.** This is enforced by the UI (`isSelf`) only; **the API does not block it**.
  - Admin sees an extra "Roles" button and can grant every role.

### What it shows
1. KPIs: Active (of total) · Invited ("awaiting first sign-in") · Inactive ("sign-in turned off") · **Without a role** ("can't open any section"; a warning when above 0).
2. Insights: accounts per role split by status (bar) · a donut by role (its chips filter the table).
3. Tabs: **Users** (the table) | **Roles & permissions** (a matrix of nav sections × roles, built from `canAccess`).
4. Table: User (avatar, name or "Unnamed", "(you)", email) · Role badge (Admin, HR, Recruiter, Sales, Media, or "No role") · Status (Active, Invited (= Cognito pending), Inactive) · Phone · Joined. Hidden: Email.
5. Detail drawer: identity and badges · Email and Call buttons · facts (Email, Phone, Joined, Last changed) · an **Access** section (Role select plus Save role; Deactivate or Reactivate; or "Invite sent. They finish setting up the account on first sign-in.") · Delete.

### Inputs
**Invite a teammate** (modal) → `POST /api/users/invite {email, role}`
| Field | Type | Req. | Validation | Default |
|---|---|---|---|---|
| Work email | email | **yes** | `required` + `email()` + max 254; the client also blocks emails already on the list ("Change their role from the list instead"). Cognito errors are mapped to friendly 400s. | blank, placeholder `name@oceanbluecorp.com` |
| Role | select with description per role | **yes** | must be in `STAFF_ROLES`; HR is limited as above | Recruiter |

Hint: "We email them a temporary password. They set their name, phone and password on first sign-in" (the `NEW_PASSWORD_REQUIRED` flow, `/api/auth/complete-invite`).

**Change role** (drawer) → `PATCH /api/users/:id {role}`. Save role is disabled until the value changes. "No role" is offered only if the user has none.
**Activate/deactivate** → `PATCH /api/users/:id {status: "active"|"inactive"}` (Cognito enable/disable). The toast has **Undo**.
Role descriptions shown in the picker (`src/lib/portal/roles.ts`):
- Admin: full access.
- HR: recruiting, contacts, clients, vendors, publishing, staff accounts.
- Recruiter: applications, bench, resumes; reads postings.
- Sales: the same, plus creates and edits postings.
- Media: publishing and posting copy, with no candidate, client or rate data.

### Actions
Invite user (primary) · Roles (Admin only) · Email · Call · Save role · Deactivate (danger) / Reactivate · **Delete user** (inline confirm: "Their account and access are removed permanently. This cannot be undone."; no undo). Export CSV comes from the table's default export (`exportName="users"`, visible columns). There is no resend-invite action (see gaps).

### States
Skeleton (4 KPIs) · "Couldn't load users" with Retry · first use: "No teammates yet. Invite a teammate to give them access." · no results · not manageable (self, or HR viewing Admin/HR): the note above the read-only role · pending: no activate toggle.

### Workflow links
→ `/portal/roles` (Admin) · the role list feeds the vendor-lead and assignee pickers elsewhere · invite email → `/auth/signin` → complete-invite.

### Design notes
- List plus drawer is right. Put **Invite** and the "Without a role" and Invited queues above the fold. Charts add little for a team of about 20; a single summary line would do.
- The Roles & permissions tab duplicates `/portal/roles` with different content (see the inconsistencies). Keep one.
- Gaps to design for: **resend invite** or expired temporary password (Cognito `pending` accounts have no action today) · invite-and-set-role in one step for several emails · a confirm for deactivating (Undo covers it).
- Mobile: a card list; actions in the drawer.

## 10. Roles (`/portal/roles`)

### Purpose
A read-only reference: which screens each role can open. It answers "why can't X see Y?".
Roles are fixed in code; this page edits nothing.

### Who uses it
Admin only (page). No API; it is derived from `routeAccess` and `roleHierarchy`.

### What it shows
- One card per role: name (Administrator, HR Manager, Recruiter, Sales, Media) · "N of 13 screens" · a description.
- A matrix: routes (Dashboard, State roles, Open roles, Applications, Candidates, Talent bench, Contacts, Clients, Vendors, Content, Users, Roles, Settings) × roles, with tick or dash marks (which have screen-reader text).

### Inputs
None. The column header sort is the only interaction.

### Actions
"Users" link. Text: "Change a teammate's role from the Users page."

### States
Static; empty: "No screens defined".

### Workflow links
↔ `/portal/users`.

### Design notes
- **Merge this with the Users "Roles & permissions" tab** and generate both from one source (`nav` plus `routeAccess`). The hand-written route list here **leaves out Blog, Case studies, Customer stories, News, Developer/API keys, Docs, Help and Notifications**, which are exactly the sections where Media differs. The card descriptions also drift from `roles.ts`; for example HR's description here omits publishing.
- Add a second axis that the matrix cannot show: the **data rules** (Media cannot see rates or clients on jobs; HR cannot grant Admin or HR; Recruiter reads but does not edit postings). These are the questions people actually ask.

## 11. Developer / API keys (`/portal/developer`, plus the classic `/portal/api-keys`)

### Purpose
Issues and controls the **partner API keys** for the public job feed (`/api/v1/jobs`). The
primary tasks are to create a key for a partner, copy it once, and later disable or revoke it.

### Who uses it
Admin only (both pages, and `requireAdmin` on `/api/admin/api-keys`).

### What it shows
1. KPIs: Active keys (N disabled) · Keys that can write ("can file draft postings") · Used in 30 days.
2. Table: Key (name and `keyPreview` in monospace) · Access ("Read-only" or "Read + write") · Status (Active/Disabled) · Last used ("Never") · Created · Created by. Hidden: Description.
3. Side panel "Partner API": send the key in the `x-api-key` header; the endpoints: `GET /api/v1/jobs` (jobs:read), `GET /api/v1/jobs/{id}` (jobs:read), `POST /api/v1/jobs` (jobs:write; files a draft); a curl example; links to the full reference and the classic manager; "Disabling or revoking a key takes effect on its next request."
4. Detail drawer: status and scope badges · preview · description · facts (Created, Created by, Last used, Last changed) · Access select · Enable/Disable · Revoke.

### Inputs
**Create API key** → `POST /api/admin/api-keys {name, description, accessLevel, createdBy, createdByName}`
| Field | Type | Req. | Validation | Default |
|---|---|---|---|---|
| Partner or platform `name` | text | **yes** | required; ≤100 (client only; the server checks presence only) | blank, "For example: Dice syndication" |
| Description | text | no | none | "what uses it, and who to ask before revoking it" |
| Access | radio cards | **yes** | `read` = "View jobs" (jobs:read) · `write` = "Create and view jobs" (jobs:read + jobs:write). An unknown level falls back to read on the server. | read (`DEFAULT_ACCESS_LEVEL`) |

**Success step:** "Copy your new key" shows the full key **once only**, with a Copy button (and a manual-copy fallback) and Done.
**Change access** → `PUT /api/admin/api-keys/:id {accessLevel}` (400 "Unknown access level").
**Enable/disable** → `PUT … {isActive}`.
**Revoke** → `DELETE …`.
The server also accepts `name` and `description` on PUT, but no UI edits them.

### Actions
Create API key (primary) · API docs · Change access · Disable/Enable (no confirm) · **Revoke** (danger; ConfirmModal: "stops working immediately and is deleted. Anything using it starts getting 401 errors. To pause it instead, disable it."; no undo).

### States
Skeleton · "Couldn't load API keys" with Retry · first use: "No API keys yet. Create one for each partner that reads the job feed." · no results · copy failure toast.

### Workflow links
→ `/portal/docs` · → `/portal/api-keys` (the classic manager, which duplicates this page).

### Design notes
- **Retire `/portal/api-keys`**; it is a second implementation of the same job (it still uses the old admin kit). Keep a single Developer page with tabs: **Keys** · **Reference** (absorbing the endpoint panel and `/portal/docs` API section).
- The create flow is a two-step modal: details, then the reveal. The reveal step must not close on an outside click or Escape until the user confirms they have copied the key.
- Security inconsistency: `createdBy` and `createdByName` come from the **request body**. Elsewhere attribution comes from the verified token. The design does not depend on it, but flag it to engineering.
- Show "Last used" prominently. It is how an admin decides whether revoking is safe.

## 12. Docs (`/portal/docs`)

### Purpose
An internal reference for admins: how the console works, the internal REST API, AWS services, and
auth and security. It has no inputs; it exists to be read and searched.

### Who uses it
Admin only (routeAccess plus a `ProtectedRoute[ADMIN]` wrapper inside the page).

### What it shows
- A sticky contents rail (it becomes a collapsible "Contents · {current}" bar below `lg`), grouped as:
  - Introduction (Overview, Getting started)
  - Core features (Job postings, Applications, Talent bench)
  - Relationships (Clients & vendors, Contacts)
  - Administration (Users & roles, Search & alerts, Content & settings)
  - Technical (API reference, AWS services, Auth & security)
- Long-form sections with tables (for example search scope, CSV columns, keyboard shortcuts). Scroll-spy highlights the current section (IntersectionObserver).

### Inputs
None. Navigation only: rail links scroll to sections.

### Actions
Dashboard · API keys (header buttons).

### States
Static content. Permission-denied comes from ProtectedRoute.

### Workflow links
↔ Developer / API keys; it is linked from Help ("Developer docs") for admins.

### Design notes
- Add an in-page search and deep-linkable section anchors (`#api-reference`). Today the hash is not written to the URL.
- **Publishing is missing** from the contents, and some copy is stale. For example, Clients says it is "linked via the Client Name field", but jobs now link by `clientId`. Treat the copy as content to refresh, not as layout.
- Use the same layout as Help (rail plus reading column) so the two read as one documentation area.

## 13. Settings (`/portal/settings`)

### Purpose
Personal account settings for every staff member, plus the admin-only site switch. The primary
tasks are to update one's own name, phone or photo, and to change one's password. Admins also
take the site offline and bring it back.

### Who uses it
- Page: every role, Media included (`EVERY_ROLE`).
- The **System** tab is Admin only. It is filtered from the tabs, and the page falls back to Profile if the role resolves late.
- APIs: `/api/users/me` and `/api/users/me/password` use `requireSignedIn`, and the target is the caller's token, never the body. Avatar uses `requireSignedIn`. `/api/content` is Admin only.

### Tabs and inputs

**Profile**
- **Profile photo:** the avatar (initials fallback) with a camera button · Upload/Change photo · Remove (only when a photo exists).
  - Validation: JPG, PNG or WebP; **≤2 MB**. Checked on the client and on the server (`validateAvatarFile`).
  - Upload: `POST /api/users/avatar?userId={id}` with the raw bytes and `Content-Type` set to the image type.
  - Remove: `DELETE /api/users/avatar/{id}`. A cache-buster refreshes the image.
  - The photo saves on selection, separately from the Save button.
- **Personal information:**
  | Field | Type | Req. | Validation | Notes |
  |---|---|---|---|---|
  | First name | text | **yes** | max 100 | The stored name is split on the first space |
  | Last name | text | no | max 100 | |
  | Email address | email, read-only | n/a | n/a | "Managed by your administrator" |
  | Phone number | tel | no | `phone()`; server max 20. **Cognito wants E.164**, so the server returns "Enter the phone number in international format, e.g. +16145551234." | |
  | Role | read-only | n/a | n/a | "Assigned by an administrator" |

  Submit: `PATCH /api/users/me {name: first + " " + last, phone}`. The name is limited to 200 characters by the schema.

**Security: Change password** → `POST /api/users/me/password {currentPassword, newPassword}`
| Field | Req. | Validation |
|---|---|---|
| Current password | yes | required. The server can return `field: "currentPassword"` (wrong password), shown inline with focus moved to the field. |
| New password | yes | `strongPassword()`: 8+ characters, uppercase, lowercase, a number, a symbol from Cognito's set. Must differ from the current password. The server can return `field: "newPassword"`. |
| Confirm new password | yes | must match |

Each field has a show/hide toggle. A note above the fields lists the policy. On success the fields clear and "All changes saved" appears.

**System (Admin)**
- **Maintenance mode** (block `site`): a status badge "Site is offline" or "Site is live" · Message shown to visitors (`maintenanceMessage`; optional, blank uses the default wording) · Expected back (`maintenanceEta`; free text such as "by 3:00 PM EST". The helper says leaving it empty makes the page read as an unexpected outage).
  - Take the site offline (danger) opens a confirm: "Take the public site offline? Visitors will see the maintenance screen until you turn this off. The admin console stays available."
  - Bring the site back online has no confirm.
  - Update message appears while offline.
  - "Preview what visitors will see" opens `/maintenance` in a new tab.
  - Save: `PUT /api/content {id:"site", fields:{maintenance:"true"|"false", maintenanceMessage, maintenanceEta}}`.
  - The fields are disabled until the current setting loads. A load error says "Refresh before changing it."
- **Site details** (read-only, hard-coded): site name, contact email, phone, address.
- **Social links** (read-only, hard-coded): LinkedIn, Twitter, Website.

**Notification preferences: does not exist.** The scope asked for it, but no settings tab,
API or stored preference exists. Notifications are filtered only by role audience
(`src/lib/notifications.ts`). If the owner wants preferences, this is **new scope**: per-type
in-app and email toggles for `job_posted`, `application_received`, `contact_received`,
`task_assigned`, `application_deleted`, limited to the types the role can receive.

### Actions
Save changes (one button for Profile or Security; it is **not shown on System**) · photo upload and remove · maintenance toggle, update and preview.

### States
- Save error: a dismissible banner at the top.
- Success: "All changes saved" for 2.5s.
- Photo uploading: a spinner on the camera button.
- Maintenance: "Saving…" and "Saved".
- Non-admin: no System tab.

### Workflow links
From the account menu (top right) and from Help ("Change your password"). Content links here for maintenance.

### Design notes
- Use a left tab rail on desktop and segmented tabs on mobile. Put the tab in the URL (`?tab=security`) so Help can deep-link to Security. Today it cannot.
- One "Save changes" shared by two different forms is confusing. Give each card its own save, as photo and maintenance already have.
- The phone field needs the shared phone input that normalises to E.164, otherwise the server rejects "(614) 555-0100" after the client has accepted it.
- Move Site details and Social links out (they are not editable) or make them editable on Content. Read-only rows in a settings page look like broken inputs.
- Consider moving maintenance to Content, as noted in section 8.

## 14. Notifications (`/portal/notifications`)

### Purpose
The full history behind the bell: what happened (new application, enquiry, posting, task) and a
link to it. The primary tasks are to scan the unread items, open the item, and mark all as read.

### Who uses it
- Every role (`EVERY_ROLE`, `requireSignedIn`). The API filters the rows by role audience (`NOTIFICATION_AUDIENCE`):
  - job_posted → recruiting roles plus Media
  - application_received and task_assigned → recruiting roles (task_assigned is addressed to one person)
  - contact_received → Admin and HR
  - application_deleted → Admin
- Read and dismiss are **per user**. **Delete for everyone** is Admin only (`requireAdmin`).

### What it shows
- Header meta with the unread count · tabs All / Unread · a Type filter offering only the types the viewer can receive.
- Table: Type chip (Job posted, New application, Contact received, **and "Other" for task_assigned and application_deleted**, which have no label) · Title (bold when unread) · Received (relative).

### Inputs
Tabs, the Type filter, search. API calls:
- `PATCH /api/notifications {action:"read_all"}`
- `PATCH /api/notifications/:id {action:"read"|"dismiss"}`
- `DELETE /api/notifications/:id` (Admin)

### Actions
Mark all as read (primary) · per row: Mark as read (unread only), Dismiss (hides it for me), **Delete for everyone** (Admin; ConfirmDialog: "will be removed from every teammate's notifications. This can't be undone."), View details (the link, or a fallback route by type).

### States
Skeleton · first use: "No notifications" · "Nothing matches these filters" · error with Retry.

### Workflow links
Each row → its `link`, for example `/portal/contacts/{id}` or the application or job.

### Design notes
- A feed is better than a table: group by day, unread dot, one line of message, a single click target, with actions on hover or swipe on mobile.
- Label the two unlabelled types. Dismiss and Delete-for-everyone look alike, so separate them visually.

## 15. Help (`/portal/help`)

### Purpose
"Who do I ask?": a team directory with contact details, plus shortcuts to common tasks. Admin
and HR keep the directory current. The primary task is to find a person and email or call them.

### Who uses it
- Page: every role. GET `/api/help/directory` uses `requireSignedIn`.
- **Edit directory:** Admin and HR (UI `canEdit`; API PUT `requireUserAdmin`).
- Common tasks are filtered by role:
  - Post a job → `JOB_EDIT_ROLES`
  - Add an applicant → recruiting roles
  - Change your password → everyone
  - Developer docs → Admin

### What it shows
- The directory grouped by team in a fixed order: Leadership · People & HR · Recruiting · Sales. Each card has the name, title ("No title on record"), and email and phone rows with copy buttons.
- Team tabs with counts, plus search ("Find a person, role or team").
- Rail: **Get in touch** (the HR contact) and **Common tasks**.
- Until someone saves a directory, the built-in `DEFAULT_TEAM` seed is shown.

### Inputs: Edit directory (modal, a repeatable row editor)
| Field | Type | Req. | Validation |
|---|---|---|---|
| Name | text | yes, if the row has any content | max 120 |
| Title `designation` | text | no | max 120 |
| Email | email | no | `email()`, max 160 |
| Phone | tel | no | `phone()`, max 40 |
| Team | select: Leadership, People & HR, Recruiting, Sales | n/a | server max 40 |

Rows can be added ("Add person") and removed. Fully blank rows are dropped on save. A discard confirm appears when dirty.
Submit: `PUT /api/help/directory {members: TeamMember[]}` (≤500). This saves the whole list to the `help-directory` content block.

### Actions
Edit directory (Admin/HR) · copy email and phone · `mailto:` and `tel:` · common-task links.

### States
- Loading.
- No search results: "No one matches "{q}"".
- Empty team: "No one in this team yet".
- Save error: a banner inside the modal.

### Workflow links
→ `/portal/jobs/new?category=state`, `/portal/applications/new`, `/portal/settings`, `/portal/docs`. The Content page links here for the directory block.

### Design notes
- Editing 9+ people in one modal grid is cramped. Use inline edit per card, or a table editor on its own route. There is no reorder within a team; add drag or ordering.
- The directory is separate from Users. Consider seeding from the Users list (name, email, phone already exist in Cognito) with an "include in directory" flag, so the two do not drift.
- The "Get in touch" phone is hard-coded.

---

# CROSS-PAGE

## Shared field patterns: build one input component each

| Pattern | Used on | One component should own |
|---|---|---|
| **Website / URL** | Client website (`website()`, https optional), article hero, logo, canonical and coverage URLs (`url()`, https required), announcement link (`/` or `http(s)`), contact LinkedIn | One `UrlInput` with modes `site` (adds https on save), `absolute`, `internal-or-absolute`; inline normalisation preview; an "open" affordance |
| **Email** | Client, vendor, invite, press contact, directory | `EmailInput`: `email()` + max 254, `type=email`, autocomplete off for other people's addresses |
| **Phone** | Client, profile (needs E.164), press contact, directory, contacts (display) | `PhoneInput`: lenient entry (`isPhone`), formats US numbers for display, **emits E.164 where Cognito needs it** |
| **Person picker** | Vendor lead (HR/Admin only), job recruitment manager and assignees, invite role context | `PersonSelect` (avatar, name, role, role filter, keeps a departed current value selectable) |
| **Role select with descriptions** | Invite, change role | `RoleSelect` from `roles.ts`, with an `allowedRoles` prop for HR limits |
| **Status select / segmented** | Contacts (4), clients (2), articles (5), users (3), keys (2) | `StatusControl` with one tone map per domain; never red for "archived" or "inactive-by-choice" |
| **US state + ZIP** | Clients, vendors | `AddressFields` with a state combobox (stores the code) and ZIP ≤10 |
| **Character-counted text** | Article summary and SEO, announcement fields | `CountedInput` / `CountedTextarea` whose `soft` (guidance) and `hard` (schema) limits are **separate props** |
| **Chip / tag input** | Article tags (8), services (6, with suggestions) | `TagInput` (exists in `admin/forms/tag-input.tsx`; port it once) |
| **Rich text** | Article body, challenge, approach, results | One editor limited to the sanitiser's subset |
| **Repeatable rows** | Metrics (6), help directory (500) | `RepeatableRows` with add, remove, (re)order, per-row errors |
| **Image** | Hero, client logo, avatar (the only real upload) | `ImageField`: upload or paste URL, preview, alt text, type and size limits (avatar: JPG/PNG/WebP ≤2 MB) |
| **Date-time** | Article publish date (`datetime-local` ⇄ ISO via local offset) | `DateTimeInput` showing the timezone |
| **Destructive confirm** | Every delete; revoke; take site offline | One `ConfirmAction` with consequence text and an optional safer alternative (Archive instead, Disable instead) |
| **Discard guard** | Client/vendor modals, article editor, directory editor | One hook (`useDiscardGuard` and `useUnsavedChanges` now coexist) |

## Inconsistencies to fix

1. **Two component kits.** Lists use `components/portal/*`. The detail and editor screens (contact record, article editor, roles, settings, notifications, help, docs, classic API keys) still use `components/admin/*`. Each page is one product and needs one kit.
2. **Duplicate pages.**
   - `/portal/developer` and `/portal/api-keys` both manage keys.
   - The Users "Roles & permissions" tab and `/portal/roles` both describe access, and the Roles page omits the publishing, developer, help and notifications routes.
   - The contact drawer and the contact record page render different fact sets.
3. **UI gate vs API gate.** Clients and vendors pages are Admin and HR, but `/api/clients` and `/api/vendors` accept every recruiting role. Users "can't edit yourself" is UI only.
4. **Read-on-open.** The contact record auto-marks an enquiry read; the drawer does not.
5. **Limit mismatches.** Summary counter /160 vs schema 400 · SEO title /60 vs 200 · tags helper "3–6" vs cap 8 · client-side API-key name ≤100 is not enforced on the server · profile phone passes the client check and then fails Cognito's E.164 rule.
6. **Lost or unused fields.**
   - `announcementScroll` is read by the site but cannot be edited.
   - Contact `notes` is accepted by the API but cannot be edited.
   - The API-key `name` and `description` are updatable by the API, but there is no UI for it.
   - The `NEWS_TYPES` hints are never shown.
   - Author shows for kinds that never print it.
7. **Vendors vs clients** have different contact blocks: vendors have no phone, website or address. Decide on purpose.
8. **Status tones.** The same concept gets different colours across pages, for example Archived is red on contacts and grey on articles, and Read is grey in one place and sky in another. Define one semantic map.
9. **Delete affordances vary.** There is an inline confirm on relationships and users, a modal on articles, keys and notifications, and no confirm on "Hide the bar". There is "Archive instead" in the article list but not in the article editor.
10. **Charts above work queues.** Contacts, Clients, Vendors, Users and the article lists lead with KPIs and charts. For inbox-style pages (Contacts, articles in review, users awaiting invite), the queue should come first.
11. **Notification types** `task_assigned` and `application_deleted` render as "Other".
12. **Attribution.** API-key `createdBy` comes from the request body, but everywhere else it comes from the token.
13. **Not built yet:** notification preferences, resend invite, image upload for articles, settings tab deep links.
