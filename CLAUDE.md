# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ocean Blue Corporation enterprise website built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4. Uses AWS services (Cognito, DynamoDB, S3) for authentication and data storage. Deployed on AWS Amplify.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
```

No test runner is configured.

## Architecture

### Frontend Stack
- **Next.js 16** with App Router (`src/app/`)
- **React 19** with TypeScript
- **Tailwind CSS 4** with shadcn/ui components (new-york style)
- **Radix UI** primitives for accessible components
- Path alias: `@/*` maps to `./src/*`

### AWS Integration
All AWS services configured in `src/lib/aws/`:
- **config.ts** - AWS credentials and table/bucket configuration (uses getter functions for runtime env var access)
- **dynamodb.ts** - CRUD operations for jobs, applications, resumes, contacts, candidates
- **s3.ts** - Resume file uploads with presigned URLs

DynamoDB tables (region: us-east-2):
- `oceanblue-jobs` (GSI: status-index)
- `oceanblue-applications` (GSI: userId-index, jobId-index)
- `oceanblue-resumes` (GSI: userId-index)
- `oceanblue-candidates` (GSI: email-index, userId-index)
- `oceanblue-contacts`

### Authentication
AWS Cognito with OIDC flow via `oidc-client-ts`:
- **AuthContext** (`src/lib/auth/AuthContext.tsx`) - Provides `useAuth()` hook
- **ProtectedRoute** component for route guarding
- Role-based access: ADMIN > HR > USER (hierarchy defined in `src/lib/auth/config.ts`)
- Cognito groups map to roles: "admin" -> ADMIN, "hr" -> HR, default -> USER

### Key Directories
```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes (jobs, applications, contacts, resume)
│   ├── admin/          # Admin panel (jobs, applications, contacts, users, settings)
│   ├── auth/           # Authentication pages (signin, signup, callback, signout)
│   └── dashboard/      # User dashboard
├── components/
│   ├── ui/             # shadcn/ui components
│   ├── dashboard/      # Dashboard-specific components
│   └── providers/      # Context providers (wraps AuthProvider)
├── lib/
│   ├── auth/           # Cognito auth config and context
│   └── aws/            # AWS service clients (S3, DynamoDB)
└── hooks/              # Custom React hooks
```

### UI Components
Using shadcn/ui (new-york style) with Lucide icons. Components in `src/components/ui/`. Add new components via:
```bash
npx shadcn@latest add <component-name>
```

### Environment Variables
Copy `.env.example` to `.env.local`. Key variables:
- `NEXT_AWS_ACCESS_KEY_ID`, `NEXT_AWS_SECRET_ACCESS_KEY` - AWS credentials (server-side only)
- `NEXT_PUBLIC_AWS_REGION` - AWS region (us-east-2)
- `NEXT_PUBLIC_COGNITO_*` - Cognito configuration
- `NEXT_AWS_DYNAMODB_TABLE_*` - DynamoDB table names
- `NEXT_AWS_S3_BUCKET_NAME` - S3 bucket for resumes

### Deployment
AWS Amplify deployment configured in `amplify.yml`. Environment variables injected during build phase.
