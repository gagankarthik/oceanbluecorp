.env.local - Fill in these values:

  # AWS Credentials (get from AWS IAM)
  AWS_ACCESS_KEY_ID=your_access_key
  AWS_SECRET_ACCESS_KEY=your_secret_key

  # S3 Bucket name (create in AWS S3)
  AWS_S3_BUCKET_NAME=your-bucket-name

  # Cognito Domain (get from Cognito Console > App Integration > Domain)
  NEXT_PUBLIC_COGNITO_DOMAIN=https://your-domain.auth.us-east-2.amazoncognito.com

  ---
  AWS Services Structure

  Files Created:
  ┌────────────────────────────────────┬───────────────────────────────────────┐
  │                File                │                Purpose                │
  ├────────────────────────────────────┼───────────────────────────────────────┤
  │ src/lib/aws/config.ts              │ AWS configuration using env variables │
  ├────────────────────────────────────┼───────────────────────────────────────┤
  │ src/lib/aws/s3.ts                  │ S3 service for resume uploads         │
  ├────────────────────────────────────┼───────────────────────────────────────┤
  │ src/lib/aws/dynamodb.ts            │ DynamoDB service for data storage     │
  ├────────────────────────────────────┼───────────────────────────────────────┤
  │ src/lib/aws/index.ts               │ Exports all AWS functions             │
  ├────────────────────────────────────┼───────────────────────────────────────┤
  │ src/app/api/resume/upload/route.ts │ API: Get presigned upload URL         │
  ├────────────────────────────────────┼───────────────────────────────────────┤
  │ src/app/api/resume/[id]/route.ts   │ API: Download/delete resume           │
  └────────────────────────────────────┴───────────────────────────────────────┘
  ---
  AWS Setup Required

  1. S3 Bucket

  Create a bucket in us-east-2 with these settings:
  - CORS Configuration:
  [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": [
        "http://localhost:3000",
        "https://oceanbluecorp.vercel.app",
        "https://main.d3dliwgutz7tdq.amplifyapp.com"
      ],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]

  2. DynamoDB Tables

  Create these tables in us-east-2:
  ┌────────────────────────┬───────────────┬───────────────────────────┐
  │       Table Name       │ Partition Key │            GSI            │
  ├────────────────────────┼───────────────┼───────────────────────────┤
  │ oceanblue-resumes      │ id (String)   │ userId-index on userId    │
  ├────────────────────────┼───────────────┼───────────────────────────┤
  │ oceanblue-applications │ id (String)   │ userId-index, jobId-index │
  ├────────────────────────┼───────────────┼───────────────────────────┤
  │ oceanblue-jobs         │ id (String)   │ -                         │
  └────────────────────────┴───────────────┴───────────────────────────┘
  3. IAM Policy

  Create an IAM user with this policy:
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
        "Action": ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem", "dynamodb:Query", "dynamodb:Scan"],
        "Resource": [
          "arn:aws:dynamodb:us-east-2:*:table/oceanblue-*",
          "arn:aws:dynamodb:us-east-2:*:table/oceanblue-*/index/*"
        ]
      }
    ]
  }

  ---
  Usage Example

  // Upload a resume
  const response = await fetch('/api/resume/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    }),
  });

  const { uploadUrl, resumeId } = await response.json();

  // Upload directly to S3 using the presigned URL
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  Step 1: Check Your Cognito Domain                                                                                                                                                                                                                                                                                                                                                                                 
  Go to AWS Console > Cognito > User Pools > us-east-2_D3AxYF4S9 > App Integration > Domain                                                                                                                                                                                                                                                                                                                         
  Your domain should look like one of these:
  - Cognito domain: https://oceanblue.auth.us-east-2.amazoncognito.com (you choose the prefix)
  - Custom domain: Your own domain

  If no domain is set up, create one now.

  Step 2: Configure App Client Callback URLs

  Go to App Integration > App clients and analytics > ca8hpv5amnaqbi8j9031f08ec

  Under Hosted UI, click Edit and add:

  Allowed callback URLs:
  https://oceanbluecorp.vercel.app/auth/callback
  https://main.d3dliwgutz7tdq.amplifyapp.com/auth/callback
  http://localhost:3000/auth/callback

  Allowed sign-out URLs:
  https://oceanbluecorp.vercel.app
  https://main.d3dliwgutz7tdq.amplifyapp.com
  http://localhost:3000

  Step 3: Enable OAuth Flows

  In the same App Client settings, ensure:
  - OAuth 2.0 grant types: Check Authorization code grant
  - OpenID Connect scopes: Check email, openid, phone

1. Go to AWS Console → Cognito → User Pools                                                                                                                                                             
  2. Select your user pool                                                                                                                                                                                  3. Go to App integration → App client list
  4. Click on your app client (ca8hpv5amnaqbi8j9031f08ec)
  5. Under Hosted UI, click Edit
  6. In the Allowed sign-out URLs field, add:
    - http://localhost:3000 (for local development)
    - Your production URL (e.g., https://yourdomain.com)
  7. Click Save changes

  Fix: Add this CORS configuration to your S3 bucket:

  1. Go to AWS Console → S3 → oceanblue-solutions bucket
  2. Click Permissions tab → Cross-origin resource sharing (CORS)
  3. Add this configuration:

  [
      {
          "AllowedHeaders": ["*"],
          "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
          "AllowedOrigins": [
              "http://localhost:3000",
              "https://oceanbluecorp.vercel.app",
              "https://main.d3dliwgutz7tdq.amplifyapp.com"
          ],
          "ExposeHeaders": ["ETag"],
          "MaxAgeSeconds": 3000
      }
  ]

  4. Click Save changes

  This allows your frontend (localhost and production) to upload files directly to S3.

  ---
  Alternative: If you'd prefer to avoid S3 CORS setup, I can modify the code to upload through your API  
  instead of directly to S3. This routes the file through your server, which avoids CORS entirely but    
  uses more server bandwidth. Would you like me to implement that approach instead?
