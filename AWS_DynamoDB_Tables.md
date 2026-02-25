# AWS DynamoDB Tables Setup Guide

This document provides step-by-step instructions for setting up the required DynamoDB tables for the Ocean Blue application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Table Overview](#table-overview)
3. [Creating Tables via AWS Console](#creating-tables-via-aws-console)
4. [Creating Tables via AWS CLI](#creating-tables-via-aws-cli)
5. [Environment Variables](#environment-variables)
6. [Data Schemas](#data-schemas)

---

## Prerequisites

- AWS Account with DynamoDB access
- AWS CLI installed and configured (for CLI method)
- IAM user with the following permissions:
  - `dynamodb:CreateTable`
  - `dynamodb:PutItem`
  - `dynamodb:GetItem`
  - `dynamodb:Query`
  - `dynamodb:Scan`
  - `dynamodb:UpdateItem`
  - `dynamodb:DeleteItem`

---

## Table Overview

| Table Name              | Primary Key | GSI (Global Secondary Index) | Purpose              |
| ----------------------- | ----------- | ---------------------------- | -------------------- |
| `oceanblue-jobs`        | `id` (S)    | `status-index`               | Job postings         |
| `oceanblue-applications`| `id` (S)    | `userId-index`, `jobId-index`| Job applications     |
| `oceanblue-resumes`     | `id` (S)    | `userId-index`               | Resume metadata      |
| `oceanblue-candidates`  | `id` (S)    | `email-index`, `userId-index`| Candidate profiles   |
| `oceanblue-contacts`    | `id` (S)    | -                            | Contact submissions  |
| `oceanblue-notifications`| `id` (S)   | -                            | Admin notifications  |

---

## Creating Tables via AWS Console

### Step 1: Navigate to DynamoDB

1. Log in to [AWS Console](https://console.aws.amazon.com)
2. Search for "DynamoDB" in the services search bar
3. Click on "DynamoDB" to open the dashboard

### Step 2: Create `oceanblue-jobs` Table

1. Click **"Create table"**
2. Configure the table:
   - **Table name:** `oceanblue-jobs`
   - **Partition key:** `id` (String)
3. Under **Table settings**, select "Customize settings"
4. Under **Secondary indexes**, click **"Create global index"**:
   - **Index name:** `status-index`
   - **Partition key:** `status` (String)
   - **Sort key:** `createdAt` (String)
5. Set **Read/Write capacity** to "On-demand" (recommended for variable workloads)
6. Click **"Create table"**

### Step 3: Create `oceanblue-applications` Table

1. Click **"Create table"**
2. Configure the table:
   - **Table name:** `oceanblue-applications`
   - **Partition key:** `id` (String)
3. Under **Table settings**, select "Customize settings"
4. Under **Secondary indexes**, create TWO global indexes:

   **First GSI:**
   - **Index name:** `userId-index`
   - **Partition key:** `userId` (String)
   - **Sort key:** `appliedAt` (String)

   **Second GSI:**
   - **Index name:** `jobId-index`
   - **Partition key:** `jobId` (String)
   - **Sort key:** `appliedAt` (String)

5. Set capacity to "On-demand"
6. Click **"Create table"**

### Step 4: Create `oceanblue-resumes` Table

1. Click **"Create table"**
2. Configure the table:
   - **Table name:** `oceanblue-resumes`
   - **Partition key:** `id` (String)
3. Under **Table settings**, select "Customize settings"
4. Under **Secondary indexes**, click **"Create global index"**:
   - **Index name:** `userId-index`
   - **Partition key:** `userId` (String)
   - **Sort key:** `uploadedAt` (String)
5. Set capacity to "On-demand"
6. Click **"Create table"**

### Step 5: Create `oceanblue-candidates` Table

1. Click **"Create table"**
2. Configure the table:
   - **Table name:** `oceanblue-candidates`
   - **Partition key:** `id` (String)
3. Under **Table settings**, select "Customize settings"
4. Under **Secondary indexes**, create TWO global indexes:

   **First GSI:**
   - **Index name:** `email-index`
   - **Partition key:** `email` (String)

   **Second GSI:**
   - **Index name:** `userId-index`
   - **Partition key:** `userId` (String)

5. Set capacity to "On-demand"
6. Click **"Create table"**

---

## Creating Tables via AWS CLI

### Prerequisites

```bash
# Configure AWS CLI with your credentials
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-2)
# Enter output format (json)
```

### Create Jobs Table

```bash
aws dynamodb create-table \
    --table-name oceanblue-jobs \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=status,AttributeType=S \
        AttributeName=createdAt,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        '[
            {
                "IndexName": "status-index",
                "KeySchema": [
                    {"AttributeName": "status", "KeyType": "HASH"},
                    {"AttributeName": "createdAt", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            }
        ]' \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-2
```

### Create Applications Table

```bash
aws dynamodb create-table \
    --table-name oceanblue-applications \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=userId,AttributeType=S \
        AttributeName=jobId,AttributeType=S \
        AttributeName=appliedAt,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        '[
            {
                "IndexName": "userId-index",
                "KeySchema": [
                    {"AttributeName": "userId", "KeyType": "HASH"},
                    {"AttributeName": "appliedAt", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            },
            {
                "IndexName": "jobId-index",
                "KeySchema": [
                    {"AttributeName": "jobId", "KeyType": "HASH"},
                    {"AttributeName": "appliedAt", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            }
        ]' \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-2
```

### Create Resumes Table

```bash
aws dynamodb create-table \
    --table-name oceanblue-resumes \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=userId,AttributeType=S \
        AttributeName=uploadedAt,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        '[
            {
                "IndexName": "userId-index",
                "KeySchema": [
                    {"AttributeName": "userId", "KeyType": "HASH"},
                    {"AttributeName": "uploadedAt", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            }
        ]' \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-2
```

### Create Candidates Table

```bash
aws dynamodb create-table \
    --table-name oceanblue-candidates \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=email,AttributeType=S \
        AttributeName=userId,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        '[
            {
                "IndexName": "email-index",
                "KeySchema": [
                    {"AttributeName": "email", "KeyType": "HASH"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            },
            {
                "IndexName": "userId-index",
                "KeySchema": [
                    {"AttributeName": "userId", "KeyType": "HASH"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            }
        ]' \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-2
```

### Verify Tables Created

```bash
aws dynamodb list-tables --region us-east-2
```

Expected output:
```json
{
    "TableNames": [
        "oceanblue-applications",
        "oceanblue-candidates",
        "oceanblue-jobs",
        "oceanblue-resumes"
    ]
}
```

---

## Environment Variables

Add these to your `.env.local` file:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
NEXT_PUBLIC_AWS_REGION=us-east-2

# DynamoDB Tables
AWS_DYNAMODB_TABLE_JOBS=oceanblue-jobs
AWS_DYNAMODB_TABLE_APPLICATIONS=oceanblue-applications
AWS_DYNAMODB_TABLE_RESUMES=oceanblue-resumes
AWS_DYNAMODB_TABLE_CANDIDATES=oceanblue-candidates

# S3 Bucket (for resume files)
AWS_S3_BUCKET_NAME=oceanblue-resumes
AWS_S3_BUCKET_REGION=us-east-2
```

---

## Data Schemas

### Jobs Table Schema

```typescript
interface Job {
  id: string;                    // Primary Key (UUID)
  title: string;                 // Job title
  department: string;            // Department name
  location: string;              // Job location
  type: "full-time" | "part-time" | "contract" | "remote";
  description: string;           // Job description
  requirements: string[];        // List of requirements
  responsibilities: string[];    // List of responsibilities
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  benefits?: string[];           // List of benefits
  experienceLevel?: "entry" | "mid" | "senior" | "lead";
  status: "active" | "paused" | "closed" | "draft";
  createdAt: string;             // ISO date string
  updatedAt?: string;            // ISO date string
  createdBy: string;             // User ID who created
  applicationsCount?: number;    // Number of applications
}
```

### Applications Table Schema

```typescript
interface Application {
  id: string;                    // Primary Key (UUID)
  userId: string;                // Cognito User ID (GSI)
  jobId: string;                 // Reference to Job (GSI)
  resumeId: string;              // Reference to Resume in S3
  status: "pending" | "reviewing" | "interview" | "offered" | "hired" | "rejected";
  appliedAt: string;             // ISO date string
  updatedAt?: string;            // ISO date string

  // Applicant Information
  name: string;
  email: string;
  phone?: string;
  linkedIn?: string;
  portfolio?: string;

  // Application Details
  coverLetter?: string;
  expectedSalary?: number;
  availableFrom?: string;

  // Skills & Experience
  skills?: string[];
  experience?: string;
  education?: string;

  // Admin Fields
  notes?: string;                // Internal notes
  rating?: number;               // 1-5 rating
  interviewDate?: string;        // Scheduled interview
  interviewNotes?: string;
}
```

### Resumes Table Schema

```typescript
interface Resume {
  id: string;                    // Primary Key (UUID)
  userId: string;                // Cognito User ID (GSI)
  fileName: string;              // Original file name
  fileKey: string;               // S3 object key
  fileSize: number;              // File size in bytes
  fileType: string;              // MIME type
  uploadedAt: string;            // ISO date string
  updatedAt?: string;            // ISO date string
}
```

### Candidates Table Schema

```typescript
interface Candidate {
  id: string;                    // Primary Key (UUID)
  userId?: string;               // Cognito User ID (if registered)
  email: string;                 // Email address (GSI)

  // Personal Information
  firstName: string;
  lastName: string;
  phone?: string;
  location?: string;

  // Professional Information
  linkedIn?: string;
  portfolio?: string;
  currentTitle?: string;
  currentCompany?: string;
  yearsOfExperience?: number;

  // Skills & Preferences
  skills?: string[];
  preferredLocations?: string[];
  preferredJobTypes?: string[];
  expectedSalary?: {
    min: number;
    max: number;
    currency: string;
  };

  // Status
  status: "active" | "inactive" | "hired";
  source?: string;               // Where they came from

  // Timestamps
  createdAt: string;
  updatedAt?: string;
  lastActivityAt?: string;
}
```

---

## S3 Bucket Setup for Resumes

### Create S3 Bucket via AWS Console

1. Navigate to S3 in AWS Console
2. Click **"Create bucket"**
3. Configure:
   - **Bucket name:** `oceanblue-resumes` (must be globally unique)
   - **Region:** `us-east-2`
   - **Block Public Access:** Keep all options checked (bucket should be private)
4. Click **"Create bucket"**

### CORS Configuration

Add this CORS configuration to allow uploads from your application:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": [
            "http://localhost:3000",
            "https://your-production-domain.com"
        ],
        "ExposeHeaders": ["ETag"]
    }
]
```

### Create S3 Bucket via AWS CLI

```bash
# Create bucket
aws s3 mb s3://oceanblue-resumes --region us-east-2

# Apply CORS configuration
aws s3api put-bucket-cors --bucket oceanblue-resumes --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["http://localhost:3000"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}'
```

---

## IAM Policy for Application

Create an IAM policy with these permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "DynamoDBAccess",
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            "Resource": [
                "arn:aws:dynamodb:us-east-2:YOUR_ACCOUNT_ID:table/oceanblue-jobs",
                "arn:aws:dynamodb:us-east-2:YOUR_ACCOUNT_ID:table/oceanblue-jobs/index/*",
                "arn:aws:dynamodb:us-east-2:YOUR_ACCOUNT_ID:table/oceanblue-applications",
                "arn:aws:dynamodb:us-east-2:YOUR_ACCOUNT_ID:table/oceanblue-applications/index/*",
                "arn:aws:dynamodb:us-east-2:YOUR_ACCOUNT_ID:table/oceanblue-resumes",
                "arn:aws:dynamodb:us-east-2:YOUR_ACCOUNT_ID:table/oceanblue-resumes/index/*",
                "arn:aws:dynamodb:us-east-2:YOUR_ACCOUNT_ID:table/oceanblue-candidates",
                "arn:aws:dynamodb:us-east-2:YOUR_ACCOUNT_ID:table/oceanblue-candidates/index/*"
            ]
        },
        {
            "Sid": "S3Access",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::oceanblue-resumes",
                "arn:aws:s3:::oceanblue-resumes/*"
            ]
        }
    ]
}
```

Replace `YOUR_ACCOUNT_ID` with your AWS account ID.

---

## Testing the Setup

### Test DynamoDB Connection

```bash
# List items in jobs table (should be empty initially)
aws dynamodb scan --table-name oceanblue-jobs --region us-east-2

# Insert a test job
aws dynamodb put-item \
    --table-name oceanblue-jobs \
    --item '{
        "id": {"S": "test-job-1"},
        "title": {"S": "Software Engineer"},
        "department": {"S": "Engineering"},
        "location": {"S": "Remote"},
        "type": {"S": "full-time"},
        "status": {"S": "active"},
        "createdAt": {"S": "2024-01-01T00:00:00Z"},
        "createdBy": {"S": "admin"}
    }' \
    --region us-east-2

# Verify the item was created
aws dynamodb get-item \
    --table-name oceanblue-jobs \
    --key '{"id": {"S": "test-job-1"}}' \
    --region us-east-2
```

---

## Troubleshooting

### Common Issues

1. **AccessDeniedException**: Check IAM permissions
2. **ResourceNotFoundException**: Table doesn't exist, verify table name and region
3. **ValidationException**: Check attribute definitions and key schema

### Useful Commands

```bash
# Describe table structure
aws dynamodb describe-table --table-name oceanblue-jobs --region us-east-2

# Check table status
aws dynamodb describe-table --table-name oceanblue-jobs --query "Table.TableStatus" --region us-east-2

# Delete table (if needed)
aws dynamodb delete-table --table-name oceanblue-jobs --region us-east-2
```


# DynamoDB contacts
table name and id(String)

 Go to DynamoDB console → Create table
  2. Table name: oceanblue-notifications
  3. Partition key: id (String)
  4. Click "Create table"
  5. After creation, go to table → Additional settings → Turn on TTL
  6. TTL attribute name: ttl

  Table 1: oceanblue-clients

  aws dynamodb create-table \
    --table-name oceanblue-clients \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-2

  Table 2: oceanblue-vendors

  aws dynamodb create-table \
    --table-name oceanblue-vendors \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-2
You may need to create the oceanblue-counters DynamoDB table in AWS for the OB-ID auto-generation feature to work. The table should have:                                                           - Partition key: id (String)
  - No sort key required   