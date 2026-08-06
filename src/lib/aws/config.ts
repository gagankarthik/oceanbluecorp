// AWS Configuration
// This file contains the base AWS configuration used by all AWS services

// Use getter functions to read environment variables at runtime
// This ensures env vars are read when needed, not at module load time

export const getAwsConfig = () => ({
  region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY || "",
  },
});

// Legacy export for backward compatibility - reads at runtime via getter
export const awsConfig = {
  get region() {
    return process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2";
  },
  get credentials() {
    return {
      accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY || "",
    };
  },
};

// S3 Configuration
export const s3Config = {
  get bucketName() {
    return process.env.NEXT_AWS_S3_BUCKET_NAME || "oceanblue-resumes";
  },
  get region() {
    return process.env.NEXT_AWS_S3_BUCKET_REGION || process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2";
  },
  get endpoint() {
    return process.env.NEXT_AWS_S3_ENDPOINT;
  },
};

// DynamoDB Configuration
export const dynamoDBConfig = {
  get tables() {
    return {
      resumes: process.env.NEXT_AWS_DYNAMODB_TABLE_RESUMES || "oceanblue-resumes",
      applications: process.env.NEXT_AWS_DYNAMODB_TABLE_APPLICATIONS || "oceanblue-applications",
      jobs: process.env.NEXT_AWS_DYNAMODB_TABLE_JOBS || "oceanblue-jobs",
      candidates: process.env.NEXT_AWS_DYNAMODB_TABLE_CANDIDATES || "oceanblue-candidates",
      contacts: process.env.NEXT_AWS_DYNAMODB_TABLE_CONTACTS || "oceanblue-contacts",
      clients: process.env.NEXT_AWS_DYNAMODB_TABLE_CLIENTS || "oceanblue-clients",
      vendors: process.env.NEXT_AWS_DYNAMODB_TABLE_VENDORS || "oceanblue-vendors",
      // Submissions, interviews and placements — the recruiting lifecycle after
      // "candidate". One table with a `kind` discriminator, because these are
      // almost always read together for one application.
      pipeline: process.env.NEXT_AWS_DYNAMODB_TABLE_PIPELINE || "oceanblue-pipeline",
    };
  },
  get endpoint() {
    return process.env.NEXT_AWS_DYNAMODB_ENDPOINT;
  },
};

// Validate required environment variables
export function validateAwsConfig(): { valid: boolean; missing: string[] } {
  const required = [
    "NEXT_AWS_ACCESS_KEY_ID",
    "NEXT_AWS_SECRET_ACCESS_KEY",
    "NEXT_AWS_S3_BUCKET_NAME",
  ];

  const missing = required.filter((key) => !process.env[key]);

  return {
    valid: missing.length === 0,
    missing,
  };
}
