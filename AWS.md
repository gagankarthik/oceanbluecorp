# AWS services

Canonical reference for every AWS service the Ocean Blue Solutions website uses, the
code that talks to each one, the DynamoDB tables, and the setup required to stand the
backend up. All resources live in **us-east-2** and the app is hosted on **AWS Amplify**.

| Service | Used for |
| --- | --- |
| **Amazon Cognito** | Authentication (OIDC) and role mapping |
| **Amazon DynamoDB** | Primary datastore — jobs, applications, candidates, CMS content, etc. |
| **Amazon S3** | Resume file storage |
| **Amazon SES** | Transactional email (application confirmations, job-posting notifications) |

---

## 1. The AWS code layer (`src/lib/aws/`)

All AWS access is isolated in one folder. **These modules are server-only** — client
components may import their *types* (`import type { Job } from "@/lib/aws/dynamodb"`)
but must never value-import them, or the AWS SDK and credentials would ship to the
browser.

| File | Purpose |
| --- | --- |
| `config.ts` | Reads env vars at runtime via getter functions; builds the shared credentials/region/table config |
| `dynamodb.ts` | All DynamoDB CRUD (jobs, applications, resumes, candidates, contacts, clients, vendors, content, notifications, counters, API keys) |
| `s3.ts` | Resume uploads/downloads (presigned URLs and server-side upload) |
| `ses.ts` | Transactional email — sends over SMTP via `nodemailer` (application confirmation, job notifications) |
| `cognito.ts` | Cognito admin operations (user/group lookups for the admin user manager) |
| `index.ts` | Barrel re-export of the above |

## 2. Which parts of the app use AWS

| Feature | AWS service | Code path |
| --- | --- | --- |
| Sign in / up / session | Cognito | `src/lib/auth/AuthContext.tsx`, `src/app/auth/*`, `src/lib/aws/cognito.ts` |
| Admin user manager | Cognito | `src/app/api/users/*` → `cognito.ts` |
| Jobs, applications, candidates, clients, vendors, contacts | DynamoDB | `src/app/api/*` → `dynamodb.ts`; admin UI under `src/app/admin/*` |
| Landing-page CMS | DynamoDB (`oceanblue-content`) | `/admin/content` → `api/content` → `dynamodb.ts`; read by `src/lib/content.ts` with ISR |
| Resume upload / resume bank | S3 + DynamoDB | `src/app/api/resume/*`, `api/resume-bank/*` → `s3.ts` + `dynamodb.ts` |
| Application confirmation & job alerts | SES (SMTP) | `api/applications`, `api/jobs` → `ses.ts` |
| Public Job Feed API | DynamoDB (`oceanblue-api-keys`) | `src/app/api/v1/jobs/*` (API-key auth) |

---

## 3. Environment variables

Set these in **Amplify › Hosting › Environment variables** (and `.env.local` for local
work). `NEXT_PUBLIC_*` values are exposed to the browser; everything else is server-only.

| Variable | Scope | Required | Description |
| --- | --- | --- | --- |
| `NEXT_AWS_ACCESS_KEY_ID` | server | yes | IAM access key (DynamoDB/S3) |
| `NEXT_AWS_SECRET_ACCESS_KEY` | server | yes | IAM secret key — never expose to the browser |
| `NEXT_PUBLIC_AWS_REGION` | public | yes | `us-east-2` |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | public | yes | Cognito user pool id |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | public | yes | Cognito app client id |
| `NEXT_PUBLIC_COGNITO_DOMAIN` | public | yes | Hosted UI domain (`https://<prefix>.auth.us-east-2.amazoncognito.com`) |
| `NEXT_PUBLIC_APP_URL` | public | yes | Public site URL (`https://oceanbluecorp.com`) |
| `NEXT_AWS_S3_BUCKET_NAME` | server | yes | Resume bucket name |
| `NEXT_AWS_S3_BUCKET_REGION` | server | no | Defaults to `NEXT_PUBLIC_AWS_REGION` |
| `NEXT_AWS_S3_ENDPOINT` | server | no | Custom endpoint; leave unset for AWS |
| `NEXT_AWS_STMP` | server | for email | SES SMTP username |
| `NEXT_AWS_STMP_PASSWORD` | server | for email | SES SMTP password |
| `NEXT_AWS_SES_FROM_EMAIL` | server | for email | Verified sender (e.g. `hiring@oceanbluecorp.com`) |
| `NEXT_AWS_DYNAMODB_TABLE_*` | server | no | Override table names (see §4 for the 11 keys); each defaults to its `oceanblue-*` name |
| `NEXT_AWS_DYNAMODB_ENDPOINT` | server | no | Custom DynamoDB endpoint; leave unset for AWS |
| `OCEAN_BLUE_API_KEY` | server | no | Master key for the public `/api/v1/jobs` feed |

---

## 4. DynamoDB tables

Region **us-east-2**, billing mode **on-demand (PAY_PER_REQUEST)**. Each table name can
be overridden by the matching `NEXT_AWS_DYNAMODB_TABLE_*` env var; the default is shown.

| Table | Partition key | GSIs | Env override | Purpose |
| --- | --- | --- | --- | --- |
| `oceanblue-jobs` | `id` (S) | `status-index` (status, createdAt) | `…_TABLE_JOBS` | Job postings |
| `oceanblue-applications` | `id` (S) | `userId-index` (userId, appliedAt), `jobId-index` (jobId, appliedAt) | `…_TABLE_APPLICATIONS` | Job applications |
| `oceanblue-resumes` | `id` (S) | `userId-index` (userId, uploadedAt) | `…_TABLE_RESUMES` | Resume metadata |
| `oceanblue-candidates` | `id` (S) | `email-index` (email), `userId-index` (userId) | `…_TABLE_CANDIDATES` | Candidate profiles / bench |
| `oceanblue-contacts` | `id` (S) | — | `…_TABLE_CONTACTS` | Contact-form submissions |
| `oceanblue-clients` | `id` (S) | — | `…_TABLE_CLIENTS` | Client accounts |
| `oceanblue-vendors` | `id` (S) | — | `…_TABLE_VENDORS` | Vendor records |
| `oceanblue-content` | `id` (S) | — | `…_TABLE_CONTENT` | CMS content blocks (`/admin/content`) |
| `oceanblue-notifications` | `id` (S) | — | `…_TABLE_NOTIFICATIONS` | Admin notifications |
| `oceanblue-counters` | `id` (S) | — | `…_TABLE_COUNTERS` | Sequence counters (e.g. job posting ids) |
| `oceanblue-api-keys` | `id` (S) | — | `…_TABLE_API_KEYS` | Public API keys for `/api/v1` |

> **Item schemas** are the TypeScript interfaces in `src/lib/aws/dynamodb.ts`
> (`Job`, `Application`, `Resume`, `Candidate`, `Contact`, `Client`, `Vendor`,
> `ContentBlock`, `Notification`, `ApiKey`). Treat those as the source of truth.

### Create a table (AWS CLI)

```bash
# Jobs (with the status GSI)
aws dynamodb create-table \
  --table-name oceanblue-jobs \
  --attribute-definitions \
      AttributeName=id,AttributeType=S \
      AttributeName=status,AttributeType=S \
      AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes '[{
      "IndexName": "status-index",
      "KeySchema": [
        {"AttributeName": "status", "KeyType": "HASH"},
        {"AttributeName": "createdAt", "KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
  }]' \
  --billing-mode PAY_PER_REQUEST --region us-east-2

# Applications (two GSIs)
aws dynamodb create-table \
  --table-name oceanblue-applications \
  --attribute-definitions \
      AttributeName=id,AttributeType=S \
      AttributeName=userId,AttributeType=S \
      AttributeName=jobId,AttributeType=S \
      AttributeName=appliedAt,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes '[
    {"IndexName":"userId-index","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"},{"AttributeName":"appliedAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}},
    {"IndexName":"jobId-index","KeySchema":[{"AttributeName":"jobId","KeyType":"HASH"},{"AttributeName":"appliedAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}
  ]' \
  --billing-mode PAY_PER_REQUEST --region us-east-2
```

Tables without GSIs (contacts, clients, vendors, content, notifications, counters,
api-keys) only need `--key-schema AttributeName=id,KeyType=HASH`. In the console: create
each table with partition key `id` (String), choose **Customize settings**, set capacity
to **On-demand**, and add the GSIs listed above where applicable.

---

## 5. Amazon S3 (resumes)

Create the bucket in `us-east-2` with **Block all public access ON** — files are served
through the app via presigned URLs, never publicly. Apply this CORS configuration
(Permissions › Cross-origin resource sharing), replacing the origins with your domains:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "https://oceanbluecorp.com",
      "https://main.<amplify-id>.amplifyapp.com",
      "http://localhost:3000"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## 6. Amazon Cognito (authentication)

- **User pool** and **app client** in `us-east-2`. Hosted UI domain under
  *App integration › Domain*.
- **Allowed callback URLs:** `https://oceanbluecorp.com/auth/callback`,
  `https://main.<amplify-id>.amplifyapp.com/auth/callback`,
  `http://localhost:3000/auth/callback`.
- **Allowed sign-out URLs:** the same origins (the app uses `/auth/signout`).
- **OAuth:** Authorization code grant; scopes `openid`, `email`, `phone`.
- **Roles:** Cognito groups map to app roles. The hierarchy (see
  `src/lib/auth/config.ts`) is **ADMIN (4) > HR (3) > RECRUITER / SALES (2) > USER (1)**.
  RECRUITER and SALES sit at the same level as HR but with narrower access — for
  example, they can reach jobs/applications/candidates but not contacts, clients, or
  vendors. ADMIN-only areas include `/admin/roles`, `/admin/content`, `/admin/settings`.

> Sign-out is intentionally **local-only** in the app (clears the local OIDC session and
> returns to `/`); it does not call the Cognito hosted `/logout`. Keep the sign-out URL
> registered anyway for completeness.

---

## 7. Amazon SES (email)

Email is sent over **SMTP** via `nodemailer` (the `@aws-sdk/client-ses` SDK is not used).

- Verify the sending domain or the from-address (`NEXT_AWS_SES_FROM_EMAIL`).
- If the account is in the **SES sandbox**, request production access — otherwise only
  verified recipients receive mail.
- Create **SMTP credentials** and set `NEXT_AWS_STMP` / `NEXT_AWS_STMP_PASSWORD`.

---

## 8. IAM policy

Attach this to the IAM user whose keys are in `NEXT_AWS_ACCESS_KEY_ID` /
`NEXT_AWS_SECRET_ACCESS_KEY`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:HeadObject"],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem",
        "dynamodb:DeleteItem", "dynamodb:Query", "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-2:*:table/oceanblue-*",
        "arn:aws:dynamodb:us-east-2:*:table/oceanblue-*/index/*"
      ]
    }
  ]
}
```

SMTP send does not require an IAM SES action (it authenticates with the SMTP
credentials), so no `ses:*` permission is needed for the app's email path.

---

## 9. Setup checklist

1. Create the IAM user and attach the policy in §8; generate an access key.
2. Create the 11 DynamoDB tables (§4).
3. Create the S3 bucket and apply CORS (§5).
4. Configure the Cognito user pool, app client, domain, and callback/sign-out URLs (§6).
5. Verify the SES sender and create SMTP credentials (§7).
6. Add every environment variable from §3 to Amplify (and `.env.local` locally).
7. Deploy. See the deployment runbook for Amplify build settings and the post-deploy
   checklist.
