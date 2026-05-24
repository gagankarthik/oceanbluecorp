# Ocean Blue Corporation

The corporate website and operations platform for Ocean Blue Solutions Inc., an IT staffing, enterprise solutions, and managed-services firm. It is a single Next.js application that runs the public marketing site, a careers portal, an internal back office for recruiting and account management, and a public Job Feed API. Content shown to visitors is editable in the admin panel and goes live without a redeploy.

## What's inside

The codebase is one app that serves four distinct products:

1. **Public marketing site** — company pages (about, services, products, team, developers, resources, contact) plus legal, accessibility, and brand pages. Landing-page copy and the announcement bar are CMS-driven.
2. **Careers portal** — job search, listings, individual job detail pages, and an application flow that uploads a resume and emails a confirmation.
3. **Admin back office (ATS)** — a role-gated applicant tracking and account-management system covering jobs, applications, candidates, the talent bench, clients, vendors, contacts, users and roles, the resume bank, notifications, content, settings, and API keys.
4. **Job Feed API (v1)** — a public, read-only jobs endpoint secured by per-client API keys, so partners and job boards can pull active postings.

## Key features

**Public site**
- Marketing pages composed from reusable landing sections (hero, services, impact stats, insights, case study, testimonials, certifications, client logos, call to action).
- A content CMS: admins edit content blocks at `/admin/content`, and pages read them through a server reader (`getSiteContent`) with ISR (`revalidate` 60s), so edits appear within a minute without a rebuild.
- SEO and metadata: `robots.txt`, a dynamic `/sitemap.xml` plus a human-readable `/sitemap` page, and per-job OpenGraph images.
- Accessibility statement, cookie consent, and a sitewide announcement bar.
- Security headers set at the framework level: HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`.

**Careers**
- Job search and listings backed by DynamoDB, with individual job detail pages.
- Application submission that stores the record, uploads the resume file to S3, and sends the applicant a confirmation email while notifying recruiters of the new application.

**Admin (ATS)**
- Role-based access enforced both on routes and in the UI, with the hierarchy ADMIN > HR > RECRUITER / SALES > USER mapped from Cognito groups.
- Modules for jobs, applications, candidates, the talent bench, clients, vendors, contacts, users and roles, resume bank, notifications, content CMS, settings, and API key management.
- Transactional email throughout the recruiting workflow: job-posted and job-updated notifications, interview invites, status updates, and HR/recruiter alerts.

**API**
- `GET /api/v1/jobs` and `GET /api/v1/jobs/:id` return sanitized, paginated job data.
- Authentication via an `X-API-Key` header (or `api_key` query parameter); keys are validated against DynamoDB, can be disabled, and have their last-used timestamp tracked.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI runtime | React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Components | shadcn/ui (new-york style) on Radix UI |
| Animation | framer-motion |
| Icons | Lucide |
| Fonts | Geist |
| Auth | Amazon Cognito via OIDC (`oidc-client-ts`) |
| Data | Amazon DynamoDB |
| File storage | Amazon S3 |
| Email | Amazon SES |
| Hosting | AWS Amplify |

## Architecture

The frontend and all backend logic live in one Next.js app. Server-side route handlers under `src/app/api` talk to AWS through typed clients in `src/lib/aws`. AWS credentials and table/bucket names are read at runtime through getter functions, so secrets stay server-side and never ship to the browser.

- **Authentication** — Amazon Cognito with an OIDC code flow. Cognito group membership maps to application roles (ADMIN, HR, RECRUITER, SALES, USER), and a role hierarchy gates admin routes. An auth context (`src/lib/auth`) exposes the current user and role to the client, and a `ProtectedRoute` component guards pages.
- **Data** — Amazon DynamoDB is the primary datastore (region `us-east-2`). All reads and writes go through `src/lib/aws/dynamodb.ts`. Sequential, human-readable IDs (for example application and posting numbers) are issued from a counters table.
- **Files** — resume and document uploads are stored in Amazon S3 (`src/lib/aws/s3.ts`).
- **Email** — Amazon SES (`src/lib/aws/ses.ts`) sends transactional mail: application confirmations to candidates, new-application and job-posting notifications to recruiters and HR, job-update notices, interview invites, status updates, and contact-form notifications.
- **Content** — the CMS stores editable content blocks in DynamoDB; the public site reads them server-side with ISR so changes publish without a deploy.
- **Hosting** — deployed on AWS Amplify, which injects environment variables at build time.

### DynamoDB tables

All in region `us-east-2`:

`oceanblue-jobs` · `oceanblue-applications` · `oceanblue-resumes` · `oceanblue-candidates` · `oceanblue-contacts` · `oceanblue-clients` · `oceanblue-vendors` · `oceanblue-content` (CMS) · `oceanblue-notifications` · `oceanblue-counters` · `oceanblue-api-keys`

## Project structure

```
src/
  app/                     App Router routes
    (marketing)            about, services, team, products, developers,
                           resources, contact, careers, brand-kit, legal pages
    api/                   Route handlers — jobs, applications, contacts,
                           content, users, vendors, clients, notifications,
                           resume, admin/*, v1/* (public API)
    admin/                 Admin back office
    auth/                  Cognito auth — signin, signup, callback, signout
    dashboard/             User dashboard
  components/
    layout/                Header, Footer, AnnouncementBar, LayoutWrapper,
                           CookieConsent
    landing/               Landing sections — Hero, Services, ImpactStats,
                           Insights, CaseStudy, Testimonials, Certifications,
                           ClientLogos, CallToAction
    admin/                 Admin-specific components
    ui/                    shadcn/ui primitives
    auth/                  ProtectedRoute
    providers/             Context providers
  lib/
    aws/                   AWS clients — config, dynamodb, s3, ses, cognito
    auth/                  Cognito auth context and config
    content.ts             CMS content reader
  hooks/                   Custom hooks
```

## Documentation

- `CLAUDE.md` — repository conventions, architecture notes, and guidance for working in the codebase.
- `AWS.md` — AWS resource setup and deployment.
