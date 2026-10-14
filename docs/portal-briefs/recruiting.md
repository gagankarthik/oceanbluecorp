# Portal design briefs: Recruiting

These briefs describe what each recruiting page in `/portal` is for and what it asks of staff, so the pages can be redesigned from their purpose and not from how they look today. Every page uses the same eight headings: purpose, who uses it, what it shows, inputs, actions, states, workflow links and design notes. A cross-page section at the end lists the shared inputs and the inconsistencies to fix.

Sources: the old console at `HEAD:src/app/admin/**`, the portal list pages at `src/app/portal/<section>/View.tsx`, the carried-over screens at `src/app/portal/(console)/**`, and the components in `src/components/admin/**` and `src/components/portal/**`. API guards and validation come from `src/app/api/**`, `src/lib/job-input.ts`, `src/lib/application-input.ts`, `src/lib/form-validation.ts` and `src/lib/validate.ts`.

---

## 0. Access matrix (applies to every page below)

Page access is set by `routeAccess` in `src/lib/auth/config.ts`. The API enforces the same sets again on the server: `requireStaff` is the recruiting roles and `requireJobEditor` is `JOB_EDIT_ROLES`.

| Capability | Admin | HR | Recruiter | Sales | Media |
|---|---|---|---|---|---|
| Dashboard `/portal` | yes | yes | yes | yes | no (lands on `/portal/blog`) |
| State / Open roles list, job detail | yes | yes | yes, read only | yes | yes, public projection |
| Create, edit, duplicate or change status of a job | yes | yes | **no** | yes | yes |
| See job commercials (client, vendor, bill/pay rate, manager, assignees, applicants, pipeline) | yes | yes | yes | yes | **no** |
| Delete a job (also deletes its applications) | yes | yes | yes | yes | no |
| Applications, candidates, talent bench, lead sourcing, resumes | yes | yes | yes | yes | no |
| Delete an application or a resume | yes | yes | yes | yes | no |
| See other people's "My Pool" bench records | yes (admin only) | own only | own only | own only | n/a |

Permission denied today: `RoleGate` (`src/components/portal/session.tsx`) and the console layout render `NoAccess`. Inside a page, controls the role can never use are **removed, not disabled** (job form comment, DESIGN_SYSTEM §5). Keep that rule in the redesign.

---

## 1. Dashboard (`/portal`)

`src/app/portal/Dashboard.tsx`. Old: `HEAD:src/app/admin/page.tsx`.

### 1. Purpose
This is the morning check for the recruiting desk: what is live, what is stuck, and what is mine to do today. Most visits are for scanning the Needs attention list and My tasks, then jumping into a filtered list.

### 2. Who uses it
Admin, HR, Recruiter and Sales. Media never lands here. Differences by role:
- **Header shortcuts:** sales sees "State roles", HR sees "Resumes", job editors (admin, hr, sales) see "New role".
- **My tasks:** the panel hides itself if `/api/tasks` returns 401 or 403.

### 3. What it shows (priority order)
1. **Greeting and date**, with "updated hh:mm", plus a Refresh button.
2. **View switch:** Overview or Team performance (`?view=team`). **Date range:** 7D, 30D, 90D (default), 12M, All.
3. **KPI row.** Each card links to a filtered list.
   - **Live roles:** count of `active` jobs, with "N with no candidates".
   - **Active candidates:** non-terminal applications in range, with a sparkline.
   - **Interviewing now.**
   - **Placements:** hires in range, with the median days to hire.
4. **Needs attention.** Four counted rows, each a link.
   - Roles with no candidates
   - Offers awaiting response (offered for 7+ days, `OFFER_STALE_DAYS`)
   - Stalled in screening (`STALE_DAYS`)
   - Unassigned candidates
5. **Applications and hires trend chart.** Applications, hires and rejections, with the % change against the previous period and the offer acceptance rate.
6. **Hiring funnel.** Applied → Screening → Submitted → Interview → Offered → Hired. Clicking a stage opens the list. Also names the slowest stage by median days.
7. **Recent applications.** Six rows, with Latest / Interviews / Offers tabs.
8. **My tasks.** Six open follow-ups, with overdue and due-today counts.
9. **Tabbed "more insights"** panel:
   - Team (leaderboard)
   - Sources (donut)
   - Role coverage (thinnest live roles first)
   - Pipeline by client (flags any client holding 40% or more)
   - Requisitions by status (`/api/admin/stats`)
   - Six-month bar chart
10. **Team performance view.**
    - Period choice: 30 days, 90 days or 12 months.
    - KPIs: submissions, interviews, placements and median days to hire.
    - A trend chart.
    - Top placements.
    - Submit-to-interview conversion by owner.
    - A per-owner table: active, submitted, interviews, offers, placed, both conversion rates, days to hire and a sparkline. Clicking a row opens a drawer.

### 4. Inputs
| Field | Type | Notes |
|---|---|---|
| Dashboard view | segmented: Overview / Team performance | Kept in the URL `?view=team`. |
| Date range | segmented: 7D / 30D / 90D / 12M / All | Default 90D. Not kept in the URL. |
| Recent filter | segmented: Latest / Interviews / Offers | Local state only. |
| Team period | segmented: 30d / 90d / 12m | In the team view. |
| Team metric | segmented: Placements / Submissions | Changes what the trend chart plots. |
| Mark task done | checkbox button | `POST /api/applications/{applicationId}/tasks` with `{op:"update", taskId, done:true}`. Optimistic, rolled back on error. |

### 5. Actions
- **Refresh:** reloads applications, jobs and stats.
- **Shortcut buttons:** New role → `/portal/jobs/new`, Applications, and the role-specific shortcuts above.
- **Complete a task inline.** It is reversible by reopening the task from the candidate's Tasks tab. There is no undo on the dashboard; add one.
- Every KPI, attention row, funnel stage, recent row and coverage row is a link. Nothing on this page is destructive.

### 6. States
- **Loading:** a full-page `LoadingState`. The header stays on screen.
- **Error:** `ErrorState` with Retry. A stats failure only affects the Requisitions and Six months tabs, each with its own retry line.
- **Empty:**
  - "No applications in this period."
  - "Nothing here yet."
  - "No open tasks assigned to you. Add follow-ups from a candidate's record."
  - "No live roles."
  - There is no first-use dashboard: a brand-new tenant sees zeros everywhere.
- **Permission:** Media is redirected by the role home.

### 7. Workflow links
| From | Goes to |
|---|---|
| Live roles card, "Roles with no candidates" | `/portal/state-roles` (open roles are never linked) |
| Active candidates | `/portal/applications` |
| Interviewing now | `/portal/applications?status=interview` |
| Placements | `/portal/applications?status=hired` |
| Offers awaiting response | `/portal/applications?status=offered` |
| Stalled in screening | `/portal/applications?saved=stale` |
| Unassigned candidates | `/portal/applications` (no filter) |
| Funnel stage | `/portal/applications?status=<stage>` |
| Recent row, task row | `/portal/candidates/{id}` |
| Coverage row | `/portal/jobs/{id}` |

### 8. Design notes
- **Above the fold:** Needs attention and My tasks. These are the "do" items. KPIs are context, and charts are reading.
- **Make the attention links honest:**
  - "Unassigned candidates" lands on an unfiltered list. It needs an `owner=none` filter.
  - "Roles with no candidates" counts both categories but links only to state roles.
  - Dashboard "stale" means pending or reviewing past `STALE_DAYS`, while the list's Stalled view uses `isStale()`. Make it one definition.
- **Keep the date range in the URL** (`?range=30d`) so a link can be shared.
- **Show the date range once at the top.** Today the KPIs mix "current" counts (live roles, interviewing now) with range-bound ones (placements). Label each KPI with its scope.
- **First-use state:** when there are no jobs, show one prompt, "Post your first role", for job editors.
- **Mobile:** stack attention first, then tasks, then KPIs as a two-by-two grid. Collapse the tabbed insights.

---

## 2. State roles and Open roles (`/portal/state-roles`, `/portal/open-roles`)

`src/components/portal/recruiting/JobsView.tsx` is used by both lists (`category="state" | "open"`). Old: `src/components/admin/jobs/jobs-workspace.tsx`.

### 1. Purpose
The requisition board: every posting in one category, with its status, deadline, team and pipeline. Most visits are to find a role, check its pipeline or deadline, or change its status. Job editors also come here to post a new role.

### 2. Who uses it
All five roles.
- **Recruiter:** reads only. Status shows as a badge, and there is no Post, Edit or Duplicate. Recruiter can still **Delete** and **Add applicant**.
- **Media:** gets `toPublicJob`. It has no client, vendor, rates, manager, assignees, applicant counts or pipeline columns, KPIs or filters. Its KPI row becomes Live, Due this week, Drafts and Closed, and its export has only seven columns.
- **Sales, HR, Admin:** everything.

### 3. What it shows
**Header:** "{n} state roles, {m} applicants. State agency requisitions, deadlines and applicants." Open roles read "Commercial client requisitions."

**KPI cards.** Each card toggles a focus filter.
- Live roles: `active`, with a sparkline of jobs posted in the last 8 weeks.
- Due this week: live jobs with a deadline within 7 days.
- No applicants yet: live jobs with 0 applicants. Shown only to roles that can price.
- Applicants: total, and per role.

**Insights row:**
- Applicants by stage on live roles. Media sees Roles by status instead.
- Deadlines in the next 3 weeks. Clicking one opens the drawer.
- Behind "more": a status mix donut with chips, and roles by client with chips.

**Table columns, in display order:**

| Column | Notes |
|---|---|
| Role | Title, with the posting ID in mono underneath. |
| Assignees | Commercial roles only. |
| Client | Commercial roles only. |
| Job ID | Hidden by default. |
| Vendor | Hidden by default. Commercial roles only. |
| Manager | Hidden by default. Commercial roles only. |
| Department | Hidden by default. |
| Location | Uses `jobLocationLabel`, e.g. "Columbus, OH (Hybrid)". |
| Type | Hidden by default. |
| Pay rate | Hidden by default. Commercial roles only. |
| Bill rate | Hidden by default. Commercial roles only. |
| Deadline | Date plus "In N days". Red when 3 days or fewer. |
| Applicants | Commercial roles only. |
| Pipeline by stage | Count per stage, with dots. Commercial roles only. |
| Status | Inline select for job editors, a badge otherwise. |
| Posted | Date. |

**Row drawer:**
- Status.
- Key facts: ID, client, vendor, manager, location, type and workplace, salary, pay and bill rate, department, assignees, deadline, posted date.
- Applicants by stage.
- Description, fetched on open because rows are summaries.
- Actions.

### 4. Inputs
| Input | Type / options | Notes |
|---|---|---|
| Search | text | Matches title, client, location and ID. |
| Status filter | select: Draft, Open, Active, On hold, Closed | `model.ts JOB_STATUSES`. Note that **Paused is missing** here but present in the form. |
| Type filter | select, built from the data | Uses the job type labels. |
| Posted filter | select: Today, Last 7 days, Last 30 days, Older | |
| Posted from / to | two date inputs | `from` ≤ `to` is enforced with min and max. |
| Assignee filter | select, built from the data, plus "Unassigned" | Matches any of a job's assignees. Commercial roles only. |
| Client filter | select, built from the data, plus "No client" | Commercial roles only. |
| Status (inline, per row) | select over `JOB_STATUSES` | `PUT /api/jobs/{id}` `{status}`. Optimistic, rolled back on failure, toast "{title} set to {status}". The row is locked while the save is pending. |
| Column visibility, density, rows per page | portal DataTable options | Kept in local storage. |

**Status values** (`src/lib/job-input.ts`): `active | paused | closed | draft | open | on-hold`.
- Only `active` is public (`src/lib/job-status.ts`). `open` is an internal-only status.
- The staff list endpoint **auto-closes** past-deadline roles whenever it is read (`src/app/api/jobs/route.ts`).

### 5. Actions
| Action | Who | API |
|---|---|---|
| Post a {state, open} role | job editors | → `/portal/jobs/new[?category=open]` |
| Export CSV | all | Columns are fixed by role. Commercial: ID, Title, Client, Vendor, Location, Status, Pay, Bill, Manager, Assignees, Applicants, Created, Deadline. |
| Open job page | all | → `/portal/jobs/{id}` |
| Edit | job editors | → `/portal/jobs/{id}/edit` |
| Duplicate | job editors | `POST /api/jobs/{id}/duplicate`. Creates a draft. |
| Add applicant | commercial roles | → `/portal/applications/new?jobId={id}` |
| **Delete (destructive)** | commercial roles | `DELETE /api/jobs/{id}`. A confirm dialog reads: "This is permanent. The posting and every application attached to it are removed." There is no undo. |

### 6. States
- **Loading:** `LoadingState`.
- **Error:** `ErrorState` with retry.
- **Empty:**
  - First use: "No state roles posted yet".
  - Filtered: "No state roles match your filters".
  - The old console also showed a first-use action, "Post a state role". Restore it for job editors.
- **Description in the drawer:** loading skeleton, plus an error line: "Couldn't load the description. Open the job page to read it."

### 7. Workflow links
- A row click opens the drawer. "Open job page" goes to the detail, and Edit goes to the form.
- The query `?category=open` is carried on detail, edit and new links so the back link and the new-role default are right.
- `/portal/jobs` redirects to `/portal/state-roles`.

### 8. Design notes
- **Layout:** a list with a right-hand drawer, which works well.
  - Above the fold: the KPI strip, then the table.
  - Collapse the insights row to one line by default ("3 due this week · 2 with no applicants"). Today it pushes the table below the fold on a laptop.
- **One status vocabulary.** Today the list offers 5 statuses and the form 6, and `open` and `active` read as synonyms to users even though only Active is public. Recommended changes:
  - Show a "Public" marker on Active.
  - Rename Open to "Internal open" or merge it.
  - Retire "Paused", which duplicates On hold.
- **Inline status changes go live immediately.** Moving to Active publishes the role on the careers site, and that is a one-click change with no confirm or undo. Add an undo toast, and a confirm when going to or from Active.
- **Recruiter Delete looks wrong.** A recruiter cannot edit a posting but can delete it, along with every application on it. Decide on purpose. Recommendation: delete is admin and HR only, or archive instead of delete.
- **Mobile:** use cards showing the title, ID, status badge, deadline countdown and applicant count. Put actions in a bottom sheet.

---

## 3. Job detail (`/portal/jobs/[id]`)

`src/app/portal/(console)/jobs/[id]/page.tsx`. Parts (`src/components/portal/records/`): `JobTeam.tsx`, `JobSubmissions.tsx`, `BestCandidates.tsx`, `MatchProfileDrawer.tsx`, `fit.tsx`, `CandidateEditDrawer.tsx`.

### 1. Purpose
This is the working page for one requisition: who is on it, where every applicant stands, what has been sent to the client, and who in the bank fits best. Most visits are for triaging applicants (stage moves) and adding an applicant.

### 2. Who uses it
All five roles.
- **Media:** sees only the "About job" tab (description, requirements, responsibilities, client notes), the basic facts, and Edit. It does not fetch applicants.
- **Recruiter:** everything except Edit.
- **Commercial roles:** see client, vendor, rates and the Team card.

### 3. What it shows
1. **Record header:**
   - Title and status badge.
   - Facts: posting ID (mono), department, location, client, vendor and type.
   - Actions: More menu, Edit, and Add applicant (the primary action).
2. **Stage strip:** counts for All, New, Screening, Submitted, Interview, Offered, Hired and Rejected. Clicking a stage filters the Applicants tab.
3. **Role details card:**
   - Client, vendor, pay rate, bill rate, salary range, deadline, created and posted by.
   - Missing fields collapse into "Not recorded: …", with an "Add them" link for editors.
4. **Team card:** recruitment manager and assignees, with inline add and remove for editors.
5. **Tabs:**
   - **Applicants:** search, a stage chip and a table with Applicant (name and email), Location, Source, Skills (2 plus a count), Stage (inline select), Applied, and a row menu. This tab is the default when the job has applicants.
   - **Submissions:** each submission's candidate, client and vendor, submitted-to, rate, sent date, status, and interview count with the next interview.
   - **Best candidates:** an AI ranking of the resume bank against the job. Each result has a fit score, verdict, and matched and missing skills. The ranking is saved, and a stale-ranking warning appears after the job is edited.
   - **About job:** the posting copy. This tab is the default when the job has no applicants.

### 4. Inputs
| Input | Type | Submits |
|---|---|---|
| Applicant stage (inline) | select: New, Screening, Submitted, Interview, Offered, Hired, Rejected | `PUT /api/applications/{id}` `{status}`. Optimistic, toast on error, **no undo**. Choosing Hired also auto-adds the candidate to the internal bench (server). |
| Row menu, "Move to" | same list | same |
| Search applicants | text | Name or email, filtered on the client. |
| Team, add a recruiter | searchable staff picker (admin, hr, recruiter, sales) | `PUT /api/jobs/{id}` with the manager and assignee arrays. |
| Team, remove | icon button | same |
| Best candidates, Find / Re-run | button | `POST /api/jobs/{id}/match-candidates` (`{topK}`, max 50). Only one run per job at a time. |
| Edit applicant (drawer) | the full candidate form (§6) | `PUT /api/applications/{id}` |

### 5. Actions
- **More menu:**
  - Share link (active jobs only; otherwise the item reads "Share link (set the role to Active first)").
  - View public posting, which goes to `/careers/search/{id}`.
  - Export applicants as CSV.
- **Edit** goes to the job form. **Add applicant** goes to `/portal/applications/new?jobId=`.
- **Applicant row:** View profile, Edit applicant (drawer), Move to stage.
- **Nothing on this page is destructive.** Job delete lives only in the list drawer. Consider adding it here behind a confirm, or archiving.

### 6. States
- **Loading:** `JobDetailLoading` skeleton.
- **Not found:** "This job posting doesn't exist."
- **Error:** "Couldn't load this job posting", with Try again.
- **No applicants:** "Add the first applicant for this role."
- **No posting copy:** "No posting copy yet", with "Write the posting" for editors.
- **Best candidates states:**
  - intro text before the first run
  - "Ranking…" with skeletons ("usually under a minute")
  - running in another tab
  - load or run errors with retry
  - "This ranking couldn't be saved"
  - empty result ("Index resumes in the Resumes tab…")
- **Submissions empty:** "Nothing submitted for this role yet. Submissions are recorded from a candidate's page."

### 7. Workflow links
- An applicant row goes to `/portal/candidates/{id}`.
- A best-candidate result goes to the candidate record if one exists, or opens the bank-resume profile drawer (fit, contact and an embedded resume).
- A submission row goes to the candidate.
- Back goes to the category list. `usePageCrumb` shows the posting ID in the top bar.

### 8. Design notes
- **Layout:** a master record with tabs. The page is good but long.
  - Above the fold: the header, stage strip and applicants table.
  - The Role details and Team cards push the table down. Merge them into one compact "Requisition facts" side rail on wide screens.
- **Stage changes need undo.** A stage change here is silent on success. The candidate page offers undo, and this page should behave the same.
- **Submissions are read-only here.** They can only be recorded from a candidate's page. Add a "Record submission" action on the job too, with a candidate picker. That is how a recruiter thinks about a client submittal.
- **Name the AI.** Rename the "Best candidates" tab as a clearly AI-assisted feature and put its saved timestamp in the tab header.
- **Mobile:** turn the tabs into a select, and show the applicants as cards with a stage chip.

---

## 4. Job form: new and edit (`/portal/jobs/new`, `/portal/jobs/[id]/edit`)

The form is `src/components/admin/forms/job-form.tsx`. The pages are `src/app/portal/(console)/jobs/new/page.tsx` and `.../[id]/edit/page.tsx`, and the server rules are in `src/lib/job-input.ts`.

### 1. Purpose
Create or change a requisition: its public copy (what candidates read) and its commercial frame (client, rates, team). Most visits are for creating a new role quickly with the three required steps, or for editing the copy or deadline.

### 2. Who uses it
Job editors: Admin, HR, Sales and Media. Recruiters are redirected (to the list on create, to the record on edit).
- **Media** sees no Client, Vendor, bill/pay rate, client notes or Team step. Step 5 becomes "Deadline" only. The server also drops commercial fields from anything Media writes.
- The edit page fetches clients, vendors and users only for roles that can price.

### 3. What it shows
**Layout:** a single-page form split into numbered step cards, with a sticky right rail. The rail shows step progress, a live summary (Title, Type and workplace, Location, Pay, Status), the primary button and "N required steps left". On narrow screens a sticky bottom bar shows "N required steps left" or "Ready to save".

- **Header:** "New state role" or "Edit open role". Edit also shows the posting ID chip and a Preview button. Preview opens a modal that mimics the public posting.
- **Edit footer:** Created, Updated and Posted by.
- **After create:** a success dialog, "Job created successfully". It says either "It's live on the careers page" or "It's saved as a draft. Set it to Active when it should go live." Choices: View job, or Create another.

### 4. Inputs (every step and field)

**Step 1, Role (required)**

| Label | Type | Req | Rules / default |
|---|---|---|---|
| Job title | text | yes | Required. Client max 120 (`LIMITS.title`), server max 200. Placeholder "e.g. Senior Software Engineer". |
| Department | select | yes | Options: ERP Solutions, Cloud Services, Data & AI, Salesforce, Engineering, Information and Computers, Training, PMO, Operations. Default: ERP Solutions. Server max 200. |
| Job type | select | yes | Full-time, Part-time, Contract, Contract-to-hire, Direct hire, Managed teams. Default Full-time. A legacy "remote" type shows "Select job type…" and must be chosen ("Remote is now set under Workplace"). |
| Listed under | select | no | State role / Open role. Defaults from `?category=`. |
| Status | select | no | Draft (default), Open, Active, On hold, Paused, Closed. Helper text: "Drafts stay off the careers page." The value is colour-coded. |

**Step 2, Location (required unless remote)**

| Label | Type | Req | Rules |
|---|---|---|---|
| Workplace | segmented: On-site / Hybrid / Remote | no | Default On-site. |
| City | text | yes unless Remote | Client max 120, server max 200. With Remote the placeholder is "Leave blank if anywhere". Server: `locationRequired()` is enforced whenever a write touches location, workplace or type. |
| State | select of US states (shows the name, stores the 2-letter code) | no | Legacy full names are normalised on read. Server max 100. |

**Step 3, Description (required)**

| Label | Type | Req | Rules |
|---|---|---|---|
| Description | rich text | yes | Must contain text ("<p></p>" counts as empty). Client max 20,000 characters of text, server max 50,000 of HTML. |
| Requirements | rich text (list button) | no | Server max 50,000. Legacy `string[]` is rendered as `<ul>`. |
| Responsibilities | rich text | no | Server max 50,000. |

**Step 4, Compensation (optional)**

| Label | Type | Shown when | Rules |
|---|---|---|---|
| Pay basis | segmented: Hourly / Annual (plus a legacy period if the record has one) | always | Default Annual (`year`). Switching basis **parks** the range and restores it on switching back. |
| Bill rate ($/hr) | money | Hourly **and** a role that can price | ≥ 0 (`nonNegative`). Only sent when Hourly. |
| Pay rate ($/hr) | money | Hourly and a role that can price | ≥ 0. Non-blocking warning: "Pay rate is higher than the bill rate, so this placement would run at a loss." |
| Min rate ($/hr) or Min salary ($/yr) | money | always | ≥ 0. Both ends or neither ("Add a maximum salary too…"). |
| Max rate or Max salary | money | always | ≥ min ("The maximum salary is lower than the minimum."). Server: `parseSalary` accepts "$80,000" and stores an ISO currency (the form sends "$" and the server stores "USD"). |

**Step 5, Client and deadline (optional); "Deadline" for Media**

| Label | Type | Shown when | Rules |
|---|---|---|---|
| Client | select of active clients, plus "+ Add new client" | can price | "+ Add new client" opens a modal (below). |
| Vendor | select: No vendor / + Add new vendor / vendors | can price | "No vendor" clears it (sends `""`). |
| Submission deadline | date | always | Non-blocking warning if the date has passed. Past-deadline roles auto-close server-side. |
| Client notes | text (single line) | can price **and** a client is chosen | Max 5,000. |

**Step 6, Team (optional; roles that can price only)**

| Label | Type | Rules |
|---|---|---|
| Recruitment manager | single person picker over staff in admin, hr, recruiter or sales | Choosing someone removes them from Assignees. |
| Assignees | multi person picker, excludes the manager | Shows "N assigned". Everyone on the team gets the job's notifications. |

**Add new client modal:** `POST /api/clients` `{name, websiteUrl, email, phone, status:"active"}`.
- Client name: required, max 100.
- Website URL: required. `website()` accepts "acme.com" and adds `https://`. Max 2048.
- Email: optional, loose email check.
- Phone: optional, 7 to 20 digits, extensions allowed.

**Add new vendor modal:** `POST /api/vendors`.
- Vendor name: required, max 100.
- Contact person: optional, max 100.
- Email: optional.
- Vendor lead: required. A select of admin and HR users, defaulting to the current user.

**Submit:**
- Create: `POST /api/jobs` (`requireJobEditor`) with `formDataToPayload` plus `postedByName/Email/Role`. The server generates `postingId` (e.g. JOB-2026-0042) and `publishedAt` on the first move to Active.
- Edit: `PUT /api/jobs/{id}`.
- Empty `""` and `[]` are sent on purpose so that clearing a manager, vendor or assignees actually clears them, and `salary: null` clears the range.
- Server errors show in a `FormErrorBanner` above the form, and field errors are shown inline on blur.
- An unsaved-changes guard (`useUnsavedChanges`) warns before leaving.

### 5. Actions
Preview (modal), Create job / Save changes, Back, Add client, Add vendor, and Create another (after create). Nothing in the form itself is destructive.

### 6. States
- **Loading:** `AdminFormSkeleton`. It is also held while a recruiter is being redirected.
- **Edit, not found:** "This job posting doesn't exist."
- **Edit, load failed:** "Couldn't load this job posting", with Try again.
- **Reference lists failed:** a toast. Create: "Couldn't load the client and vendor lists…" or "Couldn't load the assignee list…".

### 7. Workflow links
- After create, the success dialog offers View job (`/portal/jobs/{id}`), Back to all roles, or Create another (re-seeds the form empty).
- After edit, the page goes to `/portal/jobs/{id}`.

### 8. Design notes
- **Keep the single scrolling page with the step rail.** The fields are few enough, and editors jump between sections. Do not split it into a wizard.
- **Make "three required steps" visible as such.** Mark steps 4 to 6 as optional and collapsed by default on create. Expand them when they have values (on edit).
- **Move Status out of step 1** and into the save area: "Save as draft" (secondary) and "Publish" (primary). Today publishing is a dropdown hidden among the role fields, and the success copy has to explain it afterwards.
- **"Listed under" (state vs open)** is chosen by the page the user came from. Show it as a read-only chip with a "change" link instead of a field.
- **Client notes** is a one-line input for up to 5,000 characters. Make it a textarea.
- **Department options are hard-coded** in the component. Move them to config.
- **Remove the dead currency field.** Currency is always "$" and there is no currency control.
- **Back link bug.** On edit it always reads "Back to state roles" with `href="/portal/jobs"`, even for open roles.
- **Mobile:** keep the sticky bottom bar. Collapse the rail into a "Steps" sheet.

---

## 5. Applications list (`/portal/applications`)

`src/app/portal/applications/View.tsx` and `src/components/portal/recruiting/applications-views.tsx`. Old: `HEAD:src/app/admin/applications/page.tsx`.

### 1. Purpose
The pipeline across every job: triage new applicants, move people between stages, and find a candidate by skill. Most visits are for working "To review" or "My queue" and moving candidates forward.

### 2. Who uses it
Admin, HR, Recruiter and Sales (`requireStaff`). All four have the same capabilities, including delete. Media is denied.

### 3. What it shows
- **Header:** "{n} applicants across {m} positions, {k} awaiting review".
  - Controls: Table/Board toggle, Saved views menu, and Add applicant (primary).
- **KPI cards.** Each toggles a stage focus.
  - New, with a weekly sparkline
  - In interviews
  - Offers out
  - Hired, with the count for the last 4 weeks
- **Insights:**
  - Applications per week (12 weeks), alongside hires.
  - A pipeline conversion funnel that can be clicked to filter.
  - Behind "more": sources (donut).
- **Saved view chips:** My queue, To review, Interviewing, Offers, Stalled, Hired, each with a count.

**Table columns:**

| Column | Notes |
|---|---|
| Applicant | Avatar, name, and the application ID or location. |
| Email | Hidden by default. |
| Phone | Hidden by default. |
| Position | |
| Stage | Inline select. |
| In stage | Days; amber once past `STALE_DAYS`. |
| Location | |
| Owner | Shows "Unassigned" when empty. |
| Source | Hidden by default. |
| Hire type | Hidden by default. |
| Work authorization | Hidden by default. |
| Skills | Hidden by default. |
| Applied | |
| Rating | Inline stars. |

- **Board:** columns New, Screening, Submitted, Interview, Offered, Hired and Rejected. Cards can be dragged between stages and have a "move to next" button.
- **Row drawer:**
  - Avatar and name, stage badge, days in stage, rating, Bench badge.
  - A "Move to stage" select.
  - Email, phone, location, applied date, source, owner, work authorization and hire type.
  - Skills, and the last 6 stage-history entries.

### 4. Inputs
| Input | Type / options | Submits |
|---|---|---|
| Search | text. All terms must match, over the server-built resume haystack (`candidate-search.ts`). | client-side |
| Stage filter | New, Screening, Submitted, Interview, Offered, Hired, Rejected, Active, Inactive | |
| Position filter | job titles from the data | |
| State filter | full state names, plus "No location recorded" | |
| Source filter | from the data | |
| Hire type filter | from the data | |
| Work authorization filter | known options first, then others | |
| Minimum rating | 1+ to 5 stars | |
| Saved view chip | single choice | `?saved=` deep link |
| Saved views (named) | name text, max 60, limited to `MAX_SAVED` | localStorage `portal.applications.savedSearches`. Legacy `adm.*` views are migrated. |
| Stage (inline, board drag, drawer, "Move to next") | select | `PUT /api/applications/{id}` `{status}`. Optimistic, toast **with Undo**. |
| Rating (inline) | 0 to 5 stars (integer, server-checked) | `PUT` `{rating}` |
| Bulk "Move to stage" | select | one PUT per id. Reports partial failures. |

### 5. Actions
- Add applicant goes to `/portal/applications/new`.
- Export CSV: ID, name, email, phone, job, status, source, hire type, work authorization, city, state, applied date and rating.
- **Drawer actions:**
  - Open record
  - Move to {next}
  - Edit, which goes to `/portal/applications/{id}/edit?return=/portal/applications`
  - Email (mailto)
  - Reject (danger-styled but reversible, with no confirm)
  - **Delete (destructive)**
- **Bulk:** Move to stage, and **Delete (destructive)**.
- **Delete** (single or bulk): `DELETE /api/applications/{id}`. Confirm text: "This is permanent and cannot be undone." There is no undo.

### 6. States
- **Loading:** `LoadingState`. **Error:** `ErrorState` with retry.
- **Refresh failed:** a toast, "Showing the last loaded list."
- **Empty:**
  - "No applicants yet" (first use)
  - "No matching applicants" (filters)
  - "Nothing in {scope}" (a saved view or focus)

### 7. Workflow links
- **Deep links in:** `?status=` or `?stage=`, `?saved=`, and `?view=board|table` (`kanban` is also accepted).
- A row goes to the drawer, then "Open record" goes to `/portal/candidates/{id}`. The dashboard links here.

### 8. Design notes
- **Layout:** a list (or board) with a drawer. This is the right pattern. Make the board a first-class choice, not a secondary toggle.
  - Above the fold: the saved-view chips and the table.
  - The KPI cards and the stage chips both filter by stage. Pick one.
- **Too many filter mechanisms layered on each other.** Saved-view chips, KPI focus, a funnel click, filter selects and named saved views all filter at once, and only some are visible as chips. Use one filter bar that shows every active constraint as a removable chip, including the saved view.
- **Owner filter.** There is an Owner column but no Owner filter, apart from "My queue". Add an Owner filter with "Unassigned" (this also fixes the dashboard link).
- **Name the danger correctly.** Reject is styled as danger but is reversible, while Delete is permanent. Make Reject a normal action with undo, and keep Delete behind a confirm in an overflow menu.
- **Mobile:** use cards, with a swipe or button for "Move to next". Keep the board horizontally scrollable, one column per screen.

---

## 6. Candidate form: new and edit application

The form is `src/components/admin/candidate-form/candidate-form.tsx`, with its logic in `src/hooks/use-candidate-form.ts`. The pages are `src/app/portal/(console)/applications/new/page.tsx` and `.../[id]/edit/page.tsx`. The same form also appears as a drawer (`candidate-edit-drawer.tsx`), opened from job detail and from the candidate record's "Edit profile".

### 1. Purpose
Create or update a candidate record and place it on the pipeline. Most visits to "new" are for entering a candidate from a resume. Most visits to "edit" are for fixing contact details, work authorization or ownership.

### 2. Who uses it
Admin, HR, Recruiter and Sales. They all get the same fields. Staff-only fields (stage, owner, rating, notes, bench) are accepted from staff only; the public careers post ignores them (`src/app/api/applications/route.ts`).

### 3. What it shows
**New, step 0 — "How do you want to add this candidate?"** Three choices:
1. **Upload a resume (PDF/Word, ≤5 MB).** The resume is read first, with the message "Reading {file}…", and fills the blanks in the form. "Skip and fill it in myself" is offered while it reads.
2. **Enter details manually.**
3. **Pick from talent bench.** A searchable list of bench profiles. Picking one copies their fields and stored resume into a **new** application. This choice is hidden in bench mode.

Banners after the choice:
- "Filled from {file}: {fields}. Check the values before saving."
- "Filled from {name}'s bench profile."
- A parse failure, with Try again.
- "Still reading…" while the read finishes.

A "Applying for {job} · View job" line appears when `jobId` is set.

**Form layout:** on a full page, two columns. The left column holds details, location, skills and the resume; the right column holds position and pipeline, work authorization, and rating and notes. In the drawer, the cards are stacked.

**Bench mode** (`?bench=1`) changes the title to "Add bench profile", starts with the bench option on and the stage set to Active, and returns to the talent bench after saving.

### 4. Inputs
Client rules are in `validateCandidate` (`use-candidate-form.ts`). Server limits are in `src/lib/application-input.ts`.

**Candidate details**

| Label | Type | Req | Rules |
|---|---|---|---|
| First name | text | yes | max 100 (server 100). Blur triggers the duplicate check. |
| Last name | text | no | max 100. Blur triggers the duplicate check. |
| Email | email | yes | Loose email shape, max 254. Blur triggers the duplicate check. |
| Phone | tel | no | 7 to 20 digits, extensions accepted (`isPhone`). Server max 40. |
| LinkedIn profile | url-ish text | no | `website()`: "linkedin.com/in/x" gets `https://` added. Max 2048. The server stores only http(s) addresses. |

**Duplicate warning** (new only), from `GET /api/applications/duplicates?email=&name=`:
- Matches on email, or on full name (accent-insensitive, at least two tokens).
- Shows linked matches: "This candidate already exists" or "A candidate with the same name already exists". It is advisory only and never blocks saving.

**Location**

| Label | Type | Rules |
|---|---|---|
| Street address | text | max 200 (server 300) |
| City | text | max 100 |
| State | select of US states (stores the code). An unknown legacy value is kept as an option. | |
| ZIP code | text | max 10 ("5-digit ZIP or ZIP+4"). Server 20. |

**Skills and experience**

| Label | Type | Rules |
|---|---|---|
| Skills | tag input. Press Enter or comma to add. Suggestions come from `COMMON_SKILLS`. | max 60 tags in the client. Server: up to 200, each ≤100 characters. |
| Experience summary | textarea (4 rows) | max 5,000 (server 20,000) |

**Resume**

| Element | Rules |
|---|---|
| Upload or replace (dropzone) | .pdf, .doc or .docx by extension, ≤ 5 MB (`resumeFileError`). It uploads **on save** via `POST /api/resume/upload` (multipart). |
| Current resume | Download (record) or Remove. Removing on edit sends empty `resumeId/FileName/FileKey`. |
| "Fill form from resume" | Appears for a file attached late. Calls `POST /api/resume/parse` (raw body). Only blanks are filled and skills are merged. |

**Position and pipeline**

| Label | Type / options | Default / rules |
|---|---|---|
| Job posting | select: "Unassigned" plus **active** jobs only, plus the current job | `?jobId=` prefill. Changing the job clears the stored job-fit score on the server. |
| Stage | New, Screening, Submitted, Interview, Offered, Hired, Rejected. Active and Inactive are added when on the bench, and legacy values are kept. | Default New (`pending`), or Active in bench mode. Choosing Hired auto-adds the candidate to the internal bench. |
| Source | LinkedIn, Indeed, Company Website, Referral, Agency, Career Portal, Other | optional, server max 100 |
| Type of hire | W2, C2C (Corp-to-Corp), 1099, Full-time / Permanent, Contract-to-Hire, Internal / Employee. The helper text describes the choice. | optional |
| Assigned to | select: Unassigned plus staff (admin, hr, recruiter, sales) | Sent only when it changes, so `ownershipClaimedAt` isn't re-stamped. |
| Add to talent bench | checkbox | "Keep this candidate available for future requisitions." |
| Talent pool | select: Talent Bench · internal / My Pool · external. **Shown only when "Add to talent bench" is checked.** | Default external (My Pool). The helper explains who can see it. |

**Work authorization**

| Label | Type / options | Shown when / rules |
|---|---|---|
| Visa or authorization | grouped select (`WORK_AUTH_GROUPS`) | Groups: **Permanent** (US Citizen, Green Card) · **Employment visa, transfer** (H-1B, L-1, O-1, E-3, TN) · **Time-limited, sponsorship needed** (OPT, CPT, H-4 EAD) · Other |
| Expiry date | date | Shown only when the authorization is time-limited. Warns if the date has passed. |
| Requires sponsorship | checkbox | Always shown. **Not defaulted** from the visa type, even though `workAuthNeedsSponsorship` exists for that. |
| Info well | read-only | Shows "Permanent US work authorization", the H-1B, OPT or CPT wording, or "Verify authorization docs…". |

**Rating and notes**

| Label | Type | Rules |
|---|---|---|
| Rating | 5 stars. Clicking the current value clears it. | Integer 0 to 5 (server-checked). |
| Notes | textarea, "Visible to staff only" | max 5,000. This writes the **legacy single `notes` field**, not the Notes tab timeline (see cross-page). |

**Submit:**
- New: `POST /api/applications`. Includes the upload result, the parsed `resumeAnalysis` (so the server doesn't re-parse), `userId:"anonymous"` and `appliedAt`. The server assigns `applicationId` (APP-YYYY-NNNN), `createdBy` and starts the background analysis.
- Edit: `PUT /api/applications/{id}`. Empty strings are sent so that cleared fields clear.
- Errors: a `FormErrorBanner`, plus a sticky action bar showing "Fix the highlighted fields…".
- An unsaved-changes guard is active. The drawer version asks "Discard your changes?".

### 5. Actions
- Add applicant / Add to bench / Save changes.
- Cancel, which goes to `?return=` (only `/portal…` paths are accepted), the record, or the list.
- Choose a path, Back (from the bench picker), Try again (parse), and remove the selected file.

### 6. States
- **Choose screen.**
- **Reading the resume:** a spinner, with "usually a few seconds, up to a minute".
- **Bench picker:** loading, error, "Nobody on the bench yet", or no matches.
- **Edit:** a skeleton that mirrors the form; "This applicant doesn't exist"; or "Couldn't load this applicant".
- **Upload states:** "Uploading…", and "The resume didn't upload. Try again, or remove it and save without one."

### 7. Workflow links
- New goes to `/portal/candidates/{id}`, or to `?return=` (the talent bench in bench mode).
- Edit goes to `?return=` or the candidate record.
- **Entry points:**
  - Applications header
  - Job detail "Add applicant" (`?jobId=`)
  - Job drawer
  - Talent bench "Add profile" (`?bench=1`)
  - The list drawer's Edit (`?return=`)

### 8. Design notes
- **Keep the "start from a resume" chooser.** It is the best part of this flow. Make resume upload the visual default, and the other two choices secondary links.
- **Split the form by urgency.** It has 25 fields on one screen today, and only First name and Email are required. Recommended order:
  - **Essentials:** name, email, phone, job, stage, owner.
  - **Profile:** location, skills, work authorization, LinkedIn.
  - **More** (collapsed): address, ZIP, experience summary, hire type, source, rating, notes, bench.
  - Mark the two required fields clearly, and say "everything else is optional".
- **One edit surface.** The same form opens as a full page (`/applications/{id}/edit`) and as a drawer (candidate "Edit profile", job detail). Pick the drawer for record edits, and keep the full page only for create.
- **Default "Requires sponsorship"** from the visa group using `workAuthNeedsSponsorship()`, and still let the user override it.
- **The job picker hides `open`-status (internal) roles.** Only `active` jobs can be chosen unless the user arrived with `?jobId=`. Show every non-closed role, grouped by status.
- **Mobile:** a single column, with the sticky Save bar (already there).

---

## 7. Candidate detail (`/portal/candidates/[id]`)

`src/app/portal/(console)/candidates/[id]/page.tsx`. Parts: `candidate/record-bar.tsx`, `stage-track.tsx`, `applicant-details.tsx`, `record-sidebar.tsx`, `notes-tab.tsx`, `tasks-tab.tsx`, `activity-tab.tsx`, `email-composer.tsx`, `PipelinePanel.tsx`, `JobFitCard.tsx`, `ResumeAnalysis.tsx`, `ResumeAnalysisEditDrawer.tsx` (now in `src/components/portal/records/`).

### 1. Purpose
The candidate's full record: decide whether to proceed, move them through the pipeline, log submissions and interviews, and coordinate the team (notes, tasks, email). Most visits are for "Move to next stage", adding a note or task, or emailing the candidate.

### 2. Who uses it
Admin, HR, Recruiter and Sales, all with the same capabilities. Visibility: a "My Pool" (external bench) record is visible only to the person who added it, or to an admin (`loadVisible` on the API). There is no role-specific UI.

### 3. What it shows

**Identity card** (scrolls away):
- Avatar, name, stage badge, and pool badge (if on the bench).
- "Applied for {job} · {department}", which links to the job.
- Email (mailto), phone (tel) and city/state.
- Owner ("Unclaimed, claim" button) and Rating (stars, "n/5").
- Actions: Email, Edit profile, and a More menu.

**Pinned strip:**
- A stage track: New → Screening → Submitted → Interview → Offered → Hired. Any segment can be clicked to jump.
- "{n}d in stage", Reject, and **Move to {next}** (the page's one filled action). When the candidate is rejected it reads "Rejected, pick a stage to reopen".
- Tabs: Overview, Resume, Pipeline, Tasks (open count), Notes (count), Activity (count).

**Right rail (sticky):**
- Position: the job, its department, location and type, with a link.
- Owner: since-date, Release (owner only) or Claim.
- Resume file: view or download.
- Application facts: ID, pool, applied, updated, analysed, added by.

**Tabs:**

| Tab | What it holds |
|---|---|
| **Overview** | Job fit card first while the decision is open (it moves below once hired or rejected). Applicant details: work authorization, type of hire, source, visa expiry, sponsorship, LinkedIn, address, ZIP, applied, added by — blanks collapse into "N fields are not recorded. Show". Manual experience (when there is no analysis), cover letter, and the analysis call-to-action. |
| **Resume** | Parsed analysis: profile summary stats (years, career level, industry, education, companies, roles, average tenure, location), professional summary, work experience, skills, education, certifications, projects, awards, languages, interests. Edit and Re-analyze buttons, plus "Last analyzed" time. |
| **Pipeline** | Submissions, each with nested interviews and a placement; records not tied to a submission are listed separately. |
| **Tasks** | Open tasks by due date; completed tasks behind "Show completed (n)". |
| **Notes** | Composer, then team notes newest first. |
| **Activity** | Stage moves plus edits, emails, bench, ownership, resume and task events on one timeline, newest first. Edits list the changed fields. |

### 4. Inputs

**Header and record**

| Input | Type | Submits |
|---|---|---|
| Stage (track segment, Move to next, Reject) | button | `PUT /api/applications/{id}` `{status}`. Toast **with undo**, no confirm. |
| Rating | stars; clicking the current value clears it | `PUT` `{rating}` (0 to 5) |
| Claim / Release ownership | button | `PUT` `{ownership, ownershipName}`, with undo |
| Talent bench (More menu) | Add to Talent Bench / Add to My Pool / Remove from bench | `PUT` `{addToTalentBench, benchType}`, with undo |
| Edit profile | opens the candidate form drawer (§6) | `PUT /api/applications/{id}` |

**Notes tab**

| Field | Type | Rules |
|---|---|---|
| New note | textarea, 3 rows. Ctrl/⌘+Enter posts. | Required (not just spaces), max 5,000 (server). Shows a character count. `PUT` `{addNote:{text}}`. Notes are append-only, with no edit or delete. |

**Tasks tab** — `POST /api/applications/{id}/tasks`

| Field | Type | Rules |
|---|---|---|
| Task | text | Required, max 500 characters. The candidate has a maximum task count (`MAX_TASKS`). |
| Due date | date | optional |
| Assignee | select: Me (default) plus staff | Assigning to someone else toasts "Task assigned". The task shows on the assignee's dashboard. |
| Toggle done / Delete | checkbox / icon | `{op:"update", done}` / `{op:"delete"}`. **Delete has no confirm and no undo.** |

**Email composer** (right sheet) — `POST /api/applications/{id}/email`, limited to 60 per hour per user

| Field | Type | Rules |
|---|---|---|
| Template | select: Blank message, Follow-up, Interview invitation, Submitted to client, Offer, Not moving forward | Fills the subject and body. Interview templates switch the invite on. |
| Subject | text | Required, max 200 |
| Message | textarea (12 rows) | Required, max 10,000. Any `{{placeholder}}` still unfilled **blocks sending** and is listed. |
| Attach interview invite | checkbox | Sends an .ics invite |
| Starts | datetime-local | Required when the invite is on |
| Length | select: 15, 30, 45, 60, 90, 120 min | Default 30 |
| Location or link | text | Max 500 |
| (footer) Open in my mail app | mailto link | |

**Pipeline tab** — `POST /api/pipeline` / `PUT /api/pipeline/{id}`. The schema is in `src/app/api/pipeline/route.ts`.
- Recording an event moves the application **forward only**: a submission sets Submitted, an interview sets Interview, a placement sets Hired (`pipeline-records.ts`).
- Client, vendor and rates default from the job.

| Record | Fields |
|---|---|
| Submission | **Client** (select; defaults to "{client} (from the job)"). **Through vendor** (select; "Direct"). **Submitted to** (text, max 200, "the person to chase"). **Date sent** (date). **Status**: Sent, Under review, Shortlisted, Interviewing, Offered, Placed, Rejected, Withdrawn. **Rate submitted** (number ≥ 0) with **Per**: /hr, /day, /wk, /mo, /yr. **Rejection reason** (text, max 500; only when Status = Rejected). |
| Interview | **Round** (number 1 to 20). **Mode**: Phone, Video, On site. **When** (datetime). **Duration (min)** (0 to 1440, step 15). **Address** (on site) or **Meeting link** (max 500). **Panel** (comma-separated names, each ≤120). **Status**: Scheduled, Completed, Cancelled, No show, Rescheduled. **Outcome**: Awaiting feedback, Passed, Did not pass, On hold. **Feedback** (textarea, max 5,000). Download a .ics invite. |
| Placement | **Start date**. **End date** (blank means open-ended). **Bill rate** and **Pay rate** (≥ 0), with **Per**, plus a live gross-margin preview. **Status**: Active, Completed, Terminated, Extended. **PO number** (max 60). |
| All records | **Notes** (max 5,000, "Visible to staff only") |

**Resume analysis**
- Analyze / Retry / Re-analyze: `POST /api/applications/{id}/analyze`. Takes up to a minute. Retries automatically once per visit after a retryable failure, and the page polls every 5 seconds while the analysis is pending.
- **Edit resume analysis** (sheet), saved with `PUT` `{resumeAnalysis, resumeAnalyzedAt}`:
  - Summary and Objective.
  - Career level: Entry-Level, Mid-Level, Senior, Director, Executive.
  - Years of experience, primary industry and highest education.
  - Technical, programming, tools and soft skills (comma or new line).
  - Repeatable work entries: company, title, start, end, location, responsibilities (one per line), technologies.
  - Repeatable education entries: institution, degree, field, start, end.
  - Repeatable certifications: name, issuer, issued.
  - Contact details are **not** edited here.
- **Job fit:** Score fit / Re-score with `POST /api/applications/{id}/job-fit`. The previous score is withheld if the candidate moved jobs.

### 5. Actions
- **Primary:** Move to {next}.
- **Secondary:** Email, Edit profile, Reject, Claim/Release, rating, bench pool, View job posting, Post note, Add task, record Submission / Interview / Placement, Analyze, Score fit, and View resume.
- **Destructive:**
  - Delete a pipeline record: a ConfirmDialog, "Delete this {kind}?".
  - Delete a task: **no confirm**.
  - Discarding pipeline edits: "Discard changes?".
- **There is no "delete candidate" on this page.** It exists only in the applications list. Decide whether that is intended.

### 6. States
- **Loading:** `AdminDetailSkeleton`.
- **Not found:** "This candidate doesn't exist."
- **Error:** "Couldn't load this candidate", with Try again.
- **Analysis states:**
  - "Analyzing resume…" (spinner)
  - "Resume not analyzed yet"
  - "Last analysis didn't finish" (with the server's error text)
  - No resume, with "Add details manually"
- **Empty tab states:**
  - Notes: "No notes yet"
  - Tasks: "No tasks yet. Add a follow-up with a due date…", or "All tasks are done."
  - Activity: "No activity recorded yet"
  - Pipeline: "Nothing submitted yet", with "Record submission"
- **Composer:** the send button stays disabled until the message is valid. A 429 shows "You've sent a lot of emails in the last hour."

### 7. Workflow links
- To the job (`/portal/jobs/{jobId}`) from the header, the rail and the More menu.
- Back uses `router.back()`; the error state goes back to `/portal/applications`.
- The top bar shows the application ID (APP-…).
- **Arrives from:** the applications drawer, job applicants, the dashboard, best candidates, lead sourcing, bench, and duplicate warnings.

### 8. Design notes
- **Layout:** a master record with a pinned stage track, tabs and a reference rail. This is correct.
  - Above the fold: identity, the stage track with Move to next, and the Overview (fit and details).
  - The identity card plus the pinned strip takes a lot of height on a laptop. Combine name, stage and the next action into a single pinned bar once the user scrolls.
- **Two kinds of notes.** Notes come from the timeline (`notesHistory`) and also from a legacy free-text "Notes" field in the edit form. The legacy field is migrated into the timeline the next time someone posts a note. Remove the form field and keep only the Notes tab.
- **Tasks:** add confirm or undo on delete. Also allow editing a task's text, due date and assignee; today they can only be toggled or deleted.
- **Pipeline tab:** it is the system of record for submissions, interviews and placements, and it drives the stage. Its importance isn't signalled. Add a short summary in Overview, e.g. "Submitted to Acme · R2 interview Tue".
- **Email composer:** keep it as a side sheet. Show a preview of the merged text before sending.
- **Mobile:**
  - Pinned: a compact stage chip and the "Move to next" button.
  - Tabs: a horizontal scroller.
  - The rail moves below the content (already does).

---

## 8. Talent bench (`/portal/talent-bench`)

`src/app/portal/talent-bench/View.tsx`, `src/lib/bench.ts`. Old: `HEAD:src/app/admin/bench/page.tsx`.

### 1. Purpose
The roster of people ready for future roles. There are two pools:
- **Talent Bench (internal):** our own consultants between placements. Shared with the whole team. Every hire lands here automatically.
- **My Pool (external):** candidates a recruiter is sourcing. Private to whoever added them.

Most visits are for finding an available consultant by skill or work authorization, re-engaging idle profiles, or adding a profile.

### 2. Who uses it
Admin, HR, Recruiter and Sales.
- My Pool records are visible only to the person who added them; admins see all of them (the API filters, and `canView` re-checks in the client).
- The "Added by" column and filter appear only for admins, or when the Talent Bench pool is selected.

### 3. What it shows
- **Header:** "{n} profiles ready for future roles, {k} idle 30+ days". Buttons: Lead sourcing, and Add profile (primary).
- **Pool chips:** Talent Bench / My Pool, with counts.
- **KPI cards:**
  - Active (focus)
  - Submitted, with an interviewing count (focus)
  - Idle 30+ days (focus)
  - With a resume

**Insights:**
- Top skills (bar chart plus skill chips).
- Profiles by stage (donut).

**Table columns:**

| Column | Notes |
|---|---|
| Candidate | Name, plus last position or ID. |
| Added by | Only for admins, or when the Talent Bench pool is selected. |
| Email | |
| Phone | Hidden by default. |
| Last position | Hidden by default. |
| App ID | Hidden by default. |
| Skills | First 3, plus a count. |
| Location | |
| On bench | Days. Amber after 90. |
| Rating | Inline. |
| Hire type | |
| Work authorization | Hidden by default. |
| Pool | |
| Stage | Inline select: Active, New, Screening, Submitted, Interview, Hired, Inactive. |

- **Cards layout** (toggle): the same facts, with quick actions.
- **Drawer:**
  - Stage, pool and days on the bench.
  - Email, phone, location, work authorization, hire type, rating, added by (with role), added date and ID.
  - Skills, and the legacy notes.
  - Actions.

### 4. Inputs
| Input | Type / options | Submits |
|---|---|---|
| Pool | chips: Talent Bench / My Pool (default all) | `?pool=` deep link |
| Skill | select of every skill, with counts | |
| Stage / Work authorization / Hire type / Location (state) / Added by filters | selects | |
| Search | name, email or skill (searches the resume haystack too) | |
| Layout | segmented: Table / Cards | |
| Stage (inline) | select over `BENCH_STAGES` | `PUT /api/applications/{id}` `{status}`. Optimistic, toast, no undo. |
| Rating (inline) | stars | `PUT` `{rating}` |

### 5. Actions
- Add profile goes to `/portal/applications/new?bench=1`. Lead sourcing goes to `/portal/lead-sourcing?from={pool}`.
- Export CSV.
- Per row: Open record, Edit profile (`/applications/{id}/edit?return=/portal/talent-bench`), download the resume (`GET /api/resume/{id}` gives a presigned URL), Email (mailto).
- **Remove from bench:** `PUT` `{addToTalentBench:false}`. It acts immediately with an **Undo** toast and does not delete the candidate.

### 6. States
- **Loading / error:** with retry.
- **Empty, by pool:**
  - Talent Bench: "No consultants on the Talent Bench yet. Hired candidates move here automatically."
  - My Pool: "Nothing in your pool yet. Add the external candidates you are sourcing; only you see them."
  - All: "No candidates on the bench yet"
  - Filtered: "No candidates match your filters"

### 7. Workflow links
- **Out:** to the candidate record, the edit form (returning here), lead sourcing (with the pool), and add-profile (returning here).
- **In:** `?pool=all|internal|external`, which lead sourcing's back link uses.

### 8. Design notes
- **Layout:** a list with a drawer, plus a card toggle. Cards suit this page best because people browse a bench by skills and availability, so consider making cards the default.
- **Lead with the pool split.** It is the most important concept on the page and is easy to miss as a chip row. Use a clear two-tab header, "Talent Bench (team) | My Pool (only you)", with the privacy rule stated next to it.
- **Missing "availability" model.** The bench has no available-from date or rate expectation, which is what a desk actually filters on. Note this as a data gap; the stages Active and Inactive are standing in for it.
- **Stage overlap.** The bench uses the same stage values as the pipeline, plus Active and Inactive. "New" and "Screening" mean little on the bench. Consider a separate bench status (Available, On assignment, Not available).
- **Mobile:** cards, with the skill filter as a search-first sheet.

---

## 9. Lead sourcing (`/portal/lead-sourcing`)

`src/app/portal/(console)/lead-sourcing/page.tsx`.

### 1. Purpose
Rank the resume bank and the talent bench against a job, or against pasted requirements, and get a shortlist with fit scores and matched and missing skills. Most visits are for "who do we have for this req?" before going to an external search.

### 2. Who uses it
Admin, HR, Recruiter and Sales (`requireStaff` on `/api/match` and `/api/jobs/{id}/match-candidates`). The page is **not in the sidebar nav**; it can only be reached from the Talent bench header.

### 3. What it shows
**Find candidates card:**
- A mode switch: From a job / Paste a description.
- A job select, or a description textarea.
- The Find candidates button.

**Matched candidates** (ranked list, up to 15). Each row shows:
- Rank, name and origin badge (bench, applicant or bank file).
- Contact details, or the file name.
- Verdict badge and fit score out of 100.
- When expanded: the rationale ("Why they fit" or "Why they may not fit"), matched and missing skill chips, and either "View full profile" or "Open resume".

### 4. Inputs
| Field | Type | Rules / submit |
|---|---|---|
| Search input | segmented: From a job / Paste a description | |
| Job | select of every job, showing "title · department (status)" | Required in job mode. `POST /api/jobs/{id}/match-candidates` `{topK:15}`. The ranking is saved on the job and shared with the job's Best candidates tab. |
| Job description | textarea (6 rows) | Required in paste mode. Max 20,000 characters (server, 413). `POST /api/match` `{jobText, topK:15}`. topK is clamped to 1–50. |

### 5. Actions
Find candidates; expand or collapse a result; View full profile, which goes to `/portal/candidates/{profileId}`; and Open resume, which opens the bank file's presigned URL in a new tab. Nothing on this page is destructive.

### 6. States
- **Initial:** the input card only.
- **Loading:** a skeleton list, "Ranking your resume bank and talent bench…".
- **Error:** an alert. Messages include "Unable to find candidates right now." and "Couldn't reach the matcher…". Unlike Best candidates, there is no retry button.
- **Empty result:** "No matching candidates. Resumes become searchable once they are indexed…", with "Open resume bank".
- **Job list failed:** a toast. Paste mode still works.

### 7. Workflow links
Back goes to `/portal/talent-bench?pool={from}`. The empty state leads to `/portal/resumes`. Results lead to candidate records or bank files.

### 8. Design notes
- **This page duplicates the job page's Best candidates tab** for job mode, using the same endpoint and saved ranking. Either:
  - make lead sourcing the "paste requirements" tool only, and link to the job's tab for job mode, or
  - surface it in the nav under Recruiting.
- **Bank-file results are dead ends.** A result that is only a bank file has no "Add as applicant to {job}" action, and that is the obvious next step. Add it; it can reuse the new-application bench path or the resume prefill.
- **Mobile:** one column. The results already work as an accordion.

---

## 10. Resumes: resume bank (`/portal/resumes`)

`src/app/portal/resumes/View.tsx`, `src/lib/resume-duplicates.ts`, `src/app/api/resume-bank/**`. Old: `HEAD:src/app/admin/resumes/page.tsx`.

### 1. Purpose
A store of resume files that are not yet candidate records, indexed so that Lead sourcing and Best candidates can search them. Most visits are for bulk-uploading resumes, then indexing them and cleaning up duplicates.

### 2. Who uses it
Admin, HR, Recruiter and Sales. Every staff member sees the whole bank, and anyone in those roles can delete any file. HR gets a dashboard shortcut to this page.

### 3. What it shows
- **Header:** "{n} resumes on file, {k} not indexed. Drop files anywhere to upload." Upload button.
- **Upload queue panel** (appears when files are added): each file shows its type badge, name and size, a "Candidate name (optional)" input, and status (pending, uploading, done or error). Buttons: Clear done, Close, and Upload N files.
- **Status notices**, stacked:
  - Cloud indexing in progress: a progress bar, "n of N done, k left, last activity…", and Stop.
  - Stalled: Resume indexing.
  - Failures: Show failed, Retry failed. Also counts failures in bench and applicant resumes.
  - Not searchable yet: Index all.
  - Duplicates: Show in list, Review duplicates.
- **KPI cards:**
  - On file, with a weekly sparkline
  - Searchable (%)
  - Not indexed
  - Failed
- **Insights:** uploads per week (12 weeks), and files per uploader.
- **Status chips:** Indexed / Not indexed / Failed / Duplicates.
- **Table:**
  - File (with "Extra copy" or "Kept copy" badges)
  - Type (PDF or Word)
  - Candidate
  - Uploaded by
  - Size
  - Uploaded
  - Indexed (Indexed, Indexing, "Extra copy, skipped", "Failed, retry" button, or Not indexed)
- **Drawer:** type, index state, candidate, uploader, uploaded time, size, the failure reason, and actions.

### 4. Inputs
| Input | Type | Rules / submit |
|---|---|---|
| Files | file picker (multiple) **or drag and drop anywhere on the page** | PDF, DOC or DOCX by MIME type, ≤ 5 MB each. Files that fail are skipped with a toast ("N files skipped…"). The server re-checks with `validateResumeFile`. |
| Candidate name (per queued file) | text, optional | Sent as the `x-candidate-name` header. |
| Upload | button | `POST /api/resume-bank`, raw body plus `x-file-name`, `x-file-type`, `x-uploaded-by` headers. One request per file, run in parallel. |
| Search | text | Matches file, candidate or uploader. |
| Type filter | PDF / Word | |
| Uploaded by filter | uploader emails | |
| Status chip | Indexed / Not indexed / Failed / Duplicates | |
| Duplicates dialog | one radio per group to pick the copy to keep (default: the system's choice) | Deletes the other copies via `POST /api/resume-bank/delete` `{fileKeys}`, in chunks of 500. |

### 5. Actions
- **Index now** (one file): `POST /api/resume-bank/index` `{fileKeys:[key]}`.
- **Index all / Resume / Retry failed:** `POST /api/resume-bank/index-all` `{retryFailed}`. This runs in the cloud; "you can close this page". The page polls every 10 seconds.
- **Stop:** `DELETE /api/resume-bank/index-all`. It stops after the current batch.
- **Preview:** PDFs open in an iframe modal, Word files download. **Download:** a presigned URL. **Export CSV.**
- **Delete a file (destructive):** `DELETE /api/resume-bank/{id}`. Confirm: "{file} will be permanently removed from storage." No undo.
- **Delete extra copies (destructive):** a two-step confirm inside the dialog ("Permanently deletes N files"). It warns "The indexed copy will be deleted. Run Index all afterwards" when the kept copy isn't the indexed one.

### 6. States
- **Loading / error:** with retry.
- **Empty:**
  - First use: "No resumes yet". The old console had a "Choose files" action here; restore it.
  - Filtered: "No files match".
- **Drag overlay:** "Drop resumes to upload."
- **Indexing phases:** running, stopping, stalled and finished. A finished run toasts either "Everything is searchable" or "N couldn't be indexed".
- **Per-file:** indexing spinner, failed with a reason on hover.

### 7. Workflow links
- Linked from Lead sourcing's empty state and from the Best candidates empty-state copy.
- **There are no links out** from a bank file to a candidate record. A bank file never becomes an applicant from this page.

### 8. Design notes
- **Notices overload.** Up to five notices stack above the KPIs. Merge them into a single "Bank health" bar showing indexed %, failed, duplicates and a running job, with one action menu.
  - Above the fold: Upload (drop zone), then health, then the table.
- **"Indexed" is jargon.** Use "Searchable" consistently: the KPI already says Searchable, while the column says Indexed.
- **No path from a file to a candidate.** Add "Add as applicant", reusing the new-application resume path with this file, and show whether the file is already attached to a candidate.
- **Candidate name should be prefilled.** It is an optional free-text field per file, but the parser could fill it after upload. Prefill or derive it rather than asking.
- **Trust issue:** the uploader's identity comes from a client header (`x-uploaded-by`). It should come from the session. This is not a design issue, but the "Uploaded by" column depends on it.
- **Mobile:** upload via the picker only (drag and drop does not apply). Show the table as file cards.

---

## 11. Cross-page

### Shared field patterns: build each as one input component

| Pattern | Where it appears today | One component should own |
|---|---|---|
| **Location** (city plus a US state stored as the 2-letter code) | Job form (City, State, Workplace), candidate form (Street, City, State, ZIP), list filters (State name / "No location recorded"), bench | `LocationInput` with optional `workplace` (on-site, hybrid, remote) and `address`/`zip` parts. Normalises legacy full names (`normalizeState`). Shared display `jobLocationLabel` / `locationOf`. |
| **Work authorization** (grouped visa select + expiry when time-limited + sponsorship) | Candidate form; filters on applications and bench; shown in the drawer and record | `WorkAuthInput` that shows expiry only for `timeLimited`, **defaults sponsorship** from `workAuthNeedsSponsorship`, and carries the info well. |
| **Money / rates** (bill, pay, rate submitted, salary min–max, unit) | Job form (`MoneyInput`, $/hr or $/yr, pay > bill warning), pipeline submission (rate plus Per), placement (bill, pay, Per, margin preview) | `RateInput` (amount plus unit: hr, day, wk, mo, yr) and `RangeInput` (min–max plus basis). Both use `toNumber` (accepts "$80,000", "55/hr") and share the pay-over-bill warning and margin preview. Today the job form uses `MoneyInput` and the pipeline uses `type="number"`: different tolerance on the same kind of data. |
| **Person picker** (staff) | Job manager / assignees (`PersonPicker` / `AssigneePicker`), candidate owner (plain `<select>`), task assignee (plain select with "Me"), job team card (search), vendor lead (select) | One `StaffPicker` (single or multi, "Me" first, role filter). Candidate "Assigned to" and task "Assignee" are plain selects today. |
| **Stage select** | Applications inline, job applicants inline, bench inline, candidate track, candidate form, bulk move | One `StageSelect` with consistent option sets (pipeline vs bench) and **undo everywhere**. Undo exists only on the applications list and the candidate page. |
| **Rating** | Applications, bench, candidate bar, candidate form | One star input with "click again to clear". It already behaves that way in most places, so confirm it does everywhere. |
| **Resume file** | Candidate form (≤5 MB, pdf/doc/docx by extension), resume bank (≤5 MB, by MIME type), new-application chooser | One `ResumeDrop` that validates by extension **and** type, with the same copy everywhere ("PDF or Word, up to 5 MB"). |
| **Skills** | Tag input (candidate form, max 60), comma textareas (resume analysis edit), chips (filters) | One `SkillsInput`, with the same suggestions and limit (the server allows 200). |
| **Job picker** | Candidate form (active jobs only), lead sourcing (all jobs), pipeline (implicit from the candidate) | One `JobPicker` grouped by status that shows the posting ID. |
| **Client / vendor picker with "+ Add new"** | Job form (modals), pipeline submission (plain selects, no add) | One picker with inline create, used in both places. |

### Inconsistencies to fix

1. **Job statuses.** The form offers 6 (including Paused), the list and filters 5, and the dashboard merges On hold with Paused. "Open" (internal) and "Active" (public) read as synonyms. Define one list and mark which status is public.
2. **Recruiter permissions.** A recruiter can delete a job and all its applications but cannot edit the job (`JobsView` gates Delete on `canPrice`, and the API uses `requireStaff`). Reconcile.
3. **Undo vs confirm is inconsistent.**
   - Stage moves have undo on the applications list and the candidate page, but none on job detail or the bench.
   - Task delete has neither confirm nor undo.
   - Moving a job to or from Active (public) has neither.
4. **Two notes systems.** Legacy `notes` in the candidate form versus `notesHistory` in the Notes tab. The bench drawer and CSV still show the legacy field.
5. **Two edit surfaces for a candidate:** the full page and the drawer. Pick one per context.
6. **Dashboard links lie.**
   - "Unassigned candidates" opens an unfiltered list, because applications has no owner filter.
   - "Roles with no candidates" links only to state roles.
   - "Stalled" is defined differently on the dashboard and the list.
7. **Job edit back link** always says "Back to state roles" (`/portal/jobs`), even for open roles.
8. **Candidate form job picker** excludes `open`-status (internal) jobs unless they are deep-linked.
9. **Sponsorship flag** is not defaulted from the visa type, although the helper exists for exactly that.
10. **Lead sourcing** is missing from the nav and duplicates the job's Best candidates tab.
11. **Resume bank has no file-to-candidate path**, and uses "Indexed" vs "Searchable" interchangeably.
12. **Mixed visual systems.** Lists use the portal kit (`components/portal/*`); detail and editor screens still use `components/admin/*` (`--adm-*` tokens). The redesign should move the detail and editor screens onto the portal kit so drawers, toasts (sonner vs portal toast), confirms and empty states are one family.
13. **Field limits drift between client and server.**
    - Job title: client 120, server 200.
    - Address: client 200, server 300.
    - Experience: client 5,000, server 20,000.
    - ZIP: client 10, server 20.
    - Skills: client 60, server 200.
    Pick one source (`LIMITS`) and import it on both sides.
