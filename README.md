# Ocean Blue Corporation — Enterprise Website

Production website and internal admin platform for Ocean Blue Corporation, built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS 4**, and **AWS** (Cognito · DynamoDB · S3 · SES · Amplify).

Live: [oceanbluecorp.com](https://oceanbluecorp.com) · Status: [oceanbluecorp.com/status](https://oceanbluecorp.com/status)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, shadcn/ui (new-york), Radix UI |
| Language | TypeScript |
| Auth | AWS Cognito (OIDC via `oidc-client-ts`) |
| Database | AWS DynamoDB (10 tables, us-east-2) |
| File Storage | AWS S3 |
| Email | AWS SES (SMTP via Nodemailer) |
| Deployment | AWS Amplify |
| Animation | Framer Motion, Motion, GSAP |
| Icons | Lucide React, Tabler Icons |

---

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (public pages)
│   │   ├── page.tsx            # Home
│   │   ├── about/
│   │   ├── services/
│   │   ├── careers/
│   │   ├── careers/search/
│   │   ├── contact/
│   │   ├── products/
│   │   ├── resources/
│   │   │   ├── blog/
│   │   │   ├── case-studies/
│   │   │   └── ebook/
│   │   ├── privacy/
│   │   ├── terms/
│   │   ├── cookies/
│   │   ├── status/             # Public AWS service status page
│   │   └── dashboard/          # Authenticated user dashboard
│   ├── admin/                  # Internal admin panel (role-gated)
│   │   ├── page.tsx            # Dashboard with stats & charts
│   │   ├── jobs/               # Job postings CRUD
│   │   ├── applications/       # Applicant pipeline (ATS)
│   │   ├── bench/              # Talent bench
│   │   ├── resumes/            # Resume bank
│   │   ├── candidates/         # Candidate profiles
│   │   ├── clients/            # Client accounts
│   │   ├── vendors/            # Vendor management
│   │   ├── contacts/           # Site contact submissions
│   │   ├── users/              # User management
│   │   ├── roles/              # Role management
│   │   ├── content/            # CMS content editor
│   │   ├── settings/           # Platform settings
│   │   └── docs/               # Admin documentation
│   ├── api/                    # API routes (Next.js Route Handlers)
│   │   ├── jobs/
│   │   ├── applications/
│   │   ├── users/
│   │   ├── resume/
│   │   ├── resume-bank/
│   │   ├── clients/
│   │   ├── vendors/
│   │   ├── contacts/
│   │   ├── notifications/
│   │   ├── content/
│   │   ├── status/             # AWS health check (fetches status.aws.amazon.com)
│   │   └── admin/
│   │       ├── stats/
│   │       └── search/
│   └── auth/                   # Cognito OIDC pages
│       ├── signin/
│       ├── signup/
│       ├── callback/
│       └── signout/
├── components/
│   ├── ui/                     # shadcn/ui component library
│   ├── admin/                  # Admin-specific components
│   ├── dashboard/              # User dashboard components
│   ├── providers/              # Context providers
│   ├── Footer.tsx
│   └── Navbar.tsx
├── lib/
│   ├── auth/                   # Cognito config, AuthContext, ProtectedRoute
│   └── aws/
│       ├── config.ts           # AWS credentials + table/bucket config
│       ├── dynamodb.ts         # DynamoDB CRUD operations
│       ├── s3.ts               # S3 file upload / presigned URLs
│       └── ses.ts              # SES SMTP transactional email
└── hooks/                      # Custom React hooks
```

---

## AWS Services

### Region: `us-east-2` (US East — Ohio)

| Service | Purpose |
|---|---|
| **Cognito** | User authentication, OIDC flow, role-based access via groups |
| **DynamoDB** | Primary datastore — 10 tables (see below) |
| **S3** | Resume / document file storage with presigned URLs |
| **SES (SMTP)** | Transactional email — application confirmations, recruiter alerts |
| **Amplify** | CI/CD deployment pipeline and hosting |

### DynamoDB Tables

| Table | Partition Key | GSI(s) | Purpose |
|---|---|---|---|
| `oceanblue-jobs` | `id` | `status-index` | Job postings |
| `oceanblue-applications` | `id` | `userId-index`, `jobId-index` | Job applications / ATS |
| `oceanblue-candidates` | `id` | `email-index`, `userId-index` | Candidate profiles |
| `oceanblue-resumes` | `id` | `userId-index` | Resume bank |
| `oceanblue-contacts` | `id` | — | Site contact form submissions |
| `oceanblue-notifications` | `id` | — | In-app admin notifications |
| `oceanblue-clients` | `id` | — | Client company accounts |
| `oceanblue-vendors` | `id` | — | Vendor / supplier records |
| `oceanblue-counters` | `id` | — | Sequential ID counters (APP-YYYY-XXXX, OB-YYYY-XXXX) |
| `oceanblue-content` | `id` | — | CMS content (homepage, services, etc.) |

---

## Authentication & Roles

Auth uses **AWS Cognito OIDC** via `oidc-client-ts`. Tokens are stored in browser `localStorage`. Cognito group membership maps to roles:

| Cognito Group | Role | Access |
|---|---|---|
| `admin` | ADMIN | Full platform — all features, user management, content, settings |
| `hr` | HR | Jobs, applications, candidates, clients, vendors, contacts |
| `recruiter` | RECRUITER | Jobs, applications, candidates, talent bench |
| `sales` | SALES | Same as Recruiter + clients/vendors read-only |
| _(none)_ | USER | Career portal — apply for jobs, upload resume, view own applications |

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local
# Fill in all values — see Environment Variables section below

# 3. Start dev server
npm run dev
# → http://localhost:3000

# 4. Production build check
npm run build
```

---

## Environment Variables

Create `.env.local` from `.env.example`:

```env
# AWS Credentials (server-side only — never exposed to browser)
NEXT_AWS_ACCESS_KEY_ID=
NEXT_AWS_SECRET_ACCESS_KEY=

# AWS Region
NEXT_PUBLIC_AWS_REGION=us-east-2

# Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=
NEXT_PUBLIC_COGNITO_CLIENT_ID=
NEXT_PUBLIC_COGNITO_DOMAIN=
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback

# DynamoDB Table Names
NEXT_AWS_DYNAMODB_TABLE_JOBS=oceanblue-jobs
NEXT_AWS_DYNAMODB_TABLE_APPLICATIONS=oceanblue-applications
NEXT_AWS_DYNAMODB_TABLE_CANDIDATES=oceanblue-candidates
NEXT_AWS_DYNAMODB_TABLE_RESUMES=oceanblue-resumes
NEXT_AWS_DYNAMODB_TABLE_CONTACTS=oceanblue-contacts
NEXT_AWS_DYNAMODB_TABLE_NOTIFICATIONS=oceanblue-notifications
NEXT_AWS_DYNAMODB_TABLE_CLIENTS=oceanblue-clients
NEXT_AWS_DYNAMODB_TABLE_VENDORS=oceanblue-vendors
NEXT_AWS_DYNAMODB_TABLE_COUNTERS=oceanblue-counters
NEXT_AWS_DYNAMODB_TABLE_CONTENT=oceanblue-content

# S3
NEXT_AWS_S3_BUCKET_NAME=oceanblue-resumes

# SES SMTP
NEXT_AWS_STMP=
NEXT_AWS_STMP_PASSWORD=
NEXT_AWS_SES_FROM_EMAIL=hiring@oceanbluecorp.com
```

---

## API Routes

### Public (no auth)
| Method | Route | Description |
|---|---|---|
| GET | `/api/jobs` | List active job postings |
| GET | `/api/jobs/[id]` | Get single job |
| POST | `/api/applications` | Submit job application |
| POST | `/api/contacts` | Submit contact form |
| GET | `/api/status` | AWS service health (from status.aws.amazon.com) |

### Admin (requires session)
| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/search` | Global search across entities |
| GET/POST/PUT/DELETE | `/api/users` | User management |
| GET/POST/PUT/DELETE | `/api/clients` | Client records |
| GET/POST/PUT/DELETE | `/api/vendors` | Vendor records |
| GET/PUT | `/api/notifications` | In-app notifications |
| GET/POST/PUT/DELETE | `/api/content` | CMS content |
| GET/POST/PUT/DELETE | `/api/resume-bank` | Resume bank management |

---

## Deployment

Deployed via **AWS Amplify** with configuration in `amplify.yml`.

```bash
# Amplify build command
npm run build

# Output directory
.next
```

Environment variables are injected at build time through the Amplify console under **App Settings → Environment Variables**.

### Security Headers (configured in `next.config.ts`)
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`

---

## Public Pages

| Route | Description |
|---|---|
| `/` | Homepage |
| `/about` | Company overview |
| `/services` | IT services (ERP, Cloud, AI, Salesforce, Staffing, Training) |
| `/products` | Products showcase |
| `/careers` | Careers landing page |
| `/careers/search` | Live job listings |
| `/careers/search/[id]` | Individual job detail + apply |
| `/resources/blog` | Blog articles |
| `/resources/case-studies` | Case studies |
| `/resources/ebook` | eBooks & guides |
| `/contact` | Contact form |
| `/status` | Live AWS service status monitor |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/cookies` | Cookie policy |

---

## Admin Panel

| Route | Description | Min. Role |
|---|---|---|
| `/admin` | Dashboard (stats, charts) | All |
| `/admin/jobs` | Job postings list + create/edit | All |
| `/admin/jobs/[id]` | Job detail — info + applicants tab | All |
| `/admin/applications` | Applications pipeline (ATS) | All |
| `/admin/applications/new` | Manually add an applicant | All |
| `/admin/applications/[id]` | Applicant profile + status history | All |
| `/admin/bench` | Talent bench (saved candidates) | All |
| `/admin/resumes` | Resume bank | All |
| `/admin/clients` | Client accounts | HR+ |
| `/admin/vendors` | Vendor management | HR+ |
| `/admin/contacts` | Site contact submissions | HR+ |
| `/admin/users` | User management | Admin |
| `/admin/roles` | Role management | Admin |
| `/admin/content` | CMS content editor | Admin |
| `/admin/settings` | Platform settings | Admin |
| `/admin/docs` | Admin documentation | All |

---

## License

Proprietary — Ocean Blue Corporation. All Rights Reserved.

---

## Support

- General: [contact@oceanbluecorp.com](mailto:contact@oceanbluecorp.com)
- HR: [hr@oceanbluecorp.com](mailto:hr@oceanbluecorp.com)
- Phone: +1 614-844-6925
