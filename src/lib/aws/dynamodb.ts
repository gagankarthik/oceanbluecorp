import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  BatchGetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

// Read environment variables directly every time (no caching)
const getEnvConfig = () => {
  const accessKeyId = process.env.NEXT_AWS_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.NEXT_AWS_SECRET_ACCESS_KEY || "";
  const region = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2";
  const endpoint = process.env.NEXT_AWS_DYNAMODB_ENDPOINT;

  return {
    accessKeyId,
    secretAccessKey,
    region,
    endpoint,
    tables: {
      resumes: process.env.NEXT_AWS_DYNAMODB_TABLE_RESUMES || "oceanblue-resumes",
      applications: process.env.NEXT_AWS_DYNAMODB_TABLE_APPLICATIONS || "oceanblue-applications",
      jobs: process.env.NEXT_AWS_DYNAMODB_TABLE_JOBS || "oceanblue-jobs",
      candidates: process.env.NEXT_AWS_DYNAMODB_TABLE_CANDIDATES || "oceanblue-candidates",
      contacts: process.env.NEXT_AWS_DYNAMODB_TABLE_CONTACTS || "oceanblue-contacts",
      notifications: process.env.NEXT_AWS_DYNAMODB_TABLE_NOTIFICATIONS || "oceanblue-notifications",
      clients: process.env.NEXT_AWS_DYNAMODB_TABLE_CLIENTS || "oceanblue-clients",
      vendors: process.env.NEXT_AWS_DYNAMODB_TABLE_VENDORS || "oceanblue-vendors",
      counters: process.env.NEXT_AWS_DYNAMODB_TABLE_COUNTERS || "oceanblue-counters",
      content: process.env.NEXT_AWS_DYNAMODB_TABLE_CONTENT || "oceanblue-content",
      apiKeys: process.env.NEXT_AWS_DYNAMODB_TABLE_API_KEYS || "oceanblue-api-keys",
      pipeline: process.env.NEXT_AWS_DYNAMODB_TABLE_PIPELINE || "oceanblue-pipeline",
    },
  };
};

// Check if AWS credentials are configured
const isAwsConfigured = (): boolean => {
  const { accessKeyId, secretAccessKey } = getEnvConfig();
  const configured = !!(accessKeyId && secretAccessKey && accessKeyId !== "" && secretAccessKey !== "");

  if (!configured) {
    console.error("AWS credentials are not configured");
  }

  return configured;
};

// Create a fresh DynamoDB client (no caching to avoid stale credentials)
const createDocClient = (): DynamoDBDocumentClient | null => {
  const config = getEnvConfig();

  if (!config.accessKeyId || !config.secretAccessKey) {
    console.error("Cannot create DynamoDB client - missing credentials");
    return null;
  }

  const dynamoClient = new DynamoDBClient({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    ...(config.endpoint && { endpoint: config.endpoint }),
  });

  return DynamoDBDocumentClient.from(dynamoClient, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });
};

// Helper to check if DB is available and get client
const checkDbAvailable = (): { available: boolean; client?: DynamoDBDocumentClient; error?: string } => {
  if (!isAwsConfigured()) {
    return {
      available: false,
      error: "AWS credentials not configured. Please set NEXT_AWS_ACCESS_KEY_ID and NEXT_AWS_SECRET_ACCESS_KEY environment variables.",
    };
  }

  const client = createDocClient();
  if (!client) {
    return {
      available: false,
      error: "DynamoDB client could not be initialized",
    };
  }

  return { available: true, client };
};

// Get table names (read fresh each time)
const getTables = () => getEnvConfig().tables;

/**
 * Scan a whole table, following the pagination cursor.
 *
 * A DynamoDB Scan returns at most 1MB per call and hands back a
 * LastEvaluatedKey when there is more; every list in this file issued a single
 * ScanCommand and read `result.Items`, so once a table crossed 1MB the extra
 * records simply stopped existing as far as the UI was concerned. Nothing
 * errored — the list just came back short, which is why it looked like
 * individual records had gone missing while their detail pages still loaded
 * (those fetch by key, not by scan).
 *
 * Applications hit this first: a parsed resume stores work history, education,
 * skills, projects and certifications on the record, so a few hundred analysed
 * candidates is enough to blow through the page limit.
 *
 * The page cap is a runaway guard, not a product limit — 40MB of records is far
 * past the point where these screens should be paginating server-side.
 */
async function scanAll<T>(
  client: DynamoDBDocumentClient,
  params: ConstructorParameters<typeof ScanCommand>[0],
  maxPages = 40,
): Promise<T[]> {
  const items: T[] = [];
  let cursor: Record<string, unknown> | undefined;
  let pages = 0;

  do {
    const result = await client.send(new ScanCommand({ ...params, ExclusiveStartKey: cursor }));
    if (result.Items?.length) items.push(...(result.Items as T[]));
    cursor = result.LastEvaluatedKey;
    pages += 1;
    if (cursor && pages >= maxPages) {
      console.warn(
        `[dynamodb] scan of ${params?.TableName} stopped at ${maxPages} pages (${items.length} items); results are incomplete`,
      );
      break;
    }
  } while (cursor);

  return items;
}

/** Same pagination contract as scanAll, for GSI queries. */
async function queryAll<T>(
  client: DynamoDBDocumentClient,
  params: ConstructorParameters<typeof QueryCommand>[0],
  maxPages = 40,
): Promise<T[]> {
  const items: T[] = [];
  let cursor: Record<string, unknown> | undefined;
  let pages = 0;

  do {
    const result = await client.send(new QueryCommand({ ...params, ExclusiveStartKey: cursor }));
    if (result.Items?.length) items.push(...(result.Items as T[]));
    cursor = result.LastEvaluatedKey;
    pages += 1;
    if (cursor && pages >= maxPages) {
      console.warn(
        `[dynamodb] query of ${params?.IndexName || params?.TableName} stopped at ${maxPages} pages (${items.length} items); results are incomplete`,
      );
      break;
    }
  } while (cursor);

  return items;
}

// ===========================================
// Types
// ===========================================

/**
 * Where a candidate came from. Shared by Application and Candidate — the two
 * had drifted apart (Candidate was missing "Career Portal"), so the candidate
 * form could write a value its own type rejected. Mirrors SOURCE_OPTIONS in
 * components/admin/theme.ts, which is what every picker renders.
 */
export type ApplicationSource =
  | "LinkedIn" | "Indeed" | "Company Website" | "Referral"
  | "Agency" | "Career Portal" | "Other";

/**
 * Which talent pool a bench record belongs to. "internal" = our own hired
 * consultants on the bench between placements; "external" = market candidates
 * kept warm for future roles.
 */
export type BenchType = "internal" | "external";

/**
 * Work authorization. Mirrors WORK_AUTH_OPTIONS in components/admin/theme.ts.
 *
 * Widened from the original six because the pickers had already outgrown it:
 * the Applications filter offered H4 EAD / E3 / L1 and split OPT and CPT apart,
 * none of which this union permitted — the write paths cast around it, so
 * invalid values were reaching the table. DynamoDB is schemaless, so widening
 * the type needs no migration.
 *
 * "OPT/CPT" is retained for records written before OPT and CPT were separated.
 * It is deliberately absent from the picker (offering it alongside the split
 * values would be ambiguous); the edit form renders any stored value that isn't
 * in the list as an extra option so legacy records survive a round-trip.
 */
export type WorkAuthorization =
  | "US Citizen" | "Green Card" | "H1-B" | "H4 EAD" | "OPT" | "CPT"
  | "TN Visa" | "E3 Visa" | "L1 Visa" | "O1 Visa" | "Other"
  | "OPT/CPT";

/**
 * The engagement a candidate is being placed on. Distinct from Job["type"],
 * which describes the requisition: a single contract requisition can be filled
 * W2 by one candidate and corp-to-corp by another, and the payroll treatment is
 * the candidate's fact, not the job's.
 *
 * Mirrors HIRE_TYPE_OPTIONS in components/admin/theme.ts, which is what every
 * picker renders.
 */
export type HireType =
  | "W2" | "C2C" | "1099" | "Full-time" | "Contract-to-Hire" | "Internal";

export interface NoteEntry {
  id: string;           // UUID for each note
  text: string;         // Note content
  addedAt: string;      // ISO timestamp
  addedBy: string;      // User ID
  addedByName: string;  // User display name
}

export interface Resume {
  id: string; // PK
  userId: string; // User ID (GSI)
  fileName: string;
  fileKey: string; // S3 key
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  updatedAt?: string;
}


// ===========================================
// Resume Analysis (output of the resume-extraction Lambda)
// Personal information is intentionally NOT stored here — the candidate's own
// name/email/phone on the Application are the source of truth and never changed.
// ===========================================

export interface ResumeWorkExperience {
  company_name?: string | null;
  job_title?: string | null;
  employment_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_current?: boolean | null;
  duration?: string | null;
  location?: string | null;
  remote?: boolean | null;
  department?: string | null;
  reporting_to?: string | null;
  team_size?: number | null;
  responsibilities?: string[];
  achievements?: string[];
  technologies_used?: string[];
  description?: string | null;
}

export interface ResumeEducation {
  institution_name?: string | null;
  degree?: string | null;
  degree_type?: string | null;
  field_of_study?: string | null;
  major?: string | null;
  minor?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_current?: boolean | null;
  gpa?: number | null;
  percentage?: number | null;
  grade?: string | null;
  honors?: string[];
  relevant_coursework?: string[];
  thesis_title?: string | null;
  location?: string | null;
  activities?: string[];
  description?: string | null;
}

export interface ResumeSkills {
  all_skills_raw?: string[];
  technical_skills?: string[];
  soft_skills?: string[];
  programming_languages?: string[];
  frameworks_and_libraries?: string[];
  databases?: string[];
  cloud_platforms?: string[];
  tools_and_platforms?: string[];
  operating_systems?: string[];
  methodologies?: string[];
  domain_skills?: string[];
  design_skills?: string[];
  languages_spoken?: string[];
  other_skills?: string[];
  categories?: Array<{ name?: string | null; skills?: string[] }>;
}

export interface ResumeCertification {
  name?: string | null;
  issuing_organization?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  credential_id?: string | null;
  credential_url?: string | null;
  description?: string | null;
}

export interface ResumeProject {
  name?: string | null;
  description?: string | null;
  role?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_current?: boolean | null;
  technologies?: string[];
  url?: string | null;
  repository_url?: string | null;
  highlights?: string[];
  team_size?: number | null;
  type?: string | null;
}

export interface ResumeAward {
  title?: string | null;
  issuer?: string | null;
  date?: string | null;
  description?: string | null;
  level?: string | null;
}

export interface ResumeLanguage {
  language?: string | null;
  proficiency?: string | null;
  reading?: string | null;
  writing?: string | null;
  speaking?: string | null;
}

export interface ResumeAnalytics {
  total_years_of_experience?: number | null;
  total_months_of_experience?: number | null;
  career_level?: string | null;
  primary_industry?: string | null;
  secondary_industries?: string[];
  job_functions?: string[];
  highest_education_level?: string | null;
  number_of_companies?: number | null;
  number_of_roles?: number | null;
  average_tenure_months?: number | null;
  has_international_experience?: boolean | null;
  primary_location?: string | null;
  salary_mentioned?: string | null;
  resume_language?: string | null;
}

export interface ResumeAnalysis {
  professional_summary?: string | null;
  objective?: string | null;
  work_experience?: ResumeWorkExperience[];
  education?: ResumeEducation[];
  skills?: ResumeSkills;
  certifications?: ResumeCertification[];
  projects?: ResumeProject[];
  awards_and_honors?: ResumeAward[];
  languages?: ResumeLanguage[];
  interests_and_hobbies?: string[];
  publications?: Array<Record<string, unknown>>;
  volunteer_experience?: Array<Record<string, unknown>>;
  courses?: Array<Record<string, unknown>>;
  training?: Array<Record<string, unknown>>;
  professional_memberships?: Array<Record<string, unknown>>;
  conferences_and_talks?: Array<Record<string, unknown>>;
  patents?: Array<Record<string, unknown>>;
  references?: Array<Record<string, unknown>>;
  analytics?: ResumeAnalytics;
  _metadata?: Record<string, unknown>;
}

// Cached fit verdict from the Resume Matching Engine (one resume vs one job).
export interface JobFitResult {
  fitScore: number;                 // 0–100
  qualified: boolean;
  verdict: "strong" | "possible" | "weak";
  matchedSkills: string[];
  missingSkills: string[];
  rationale?: string | null;
}

// One ranked candidate cached on a Job (engine's snake_case shape, stored as-is
// so the "Best candidates" panel renders cached and fresh results identically).
export interface JobCandidateMatch {
  resume_id: string;
  candidate_name?: string | null;
  fit_score: number;
  similarity: number;
  qualified: boolean;
  verdict: "strong" | "possible" | "weak";
  matched_skills: string[];
  missing_skills: string[];
  rationale?: string | null;
}

// Unified Application interface - supports both portal applications and HR-created applications
export interface Application {
  id: string; // PK (UUID)
  applicationId?: string; // Auto-generated APP-XXXX format for display
  userId?: string; // User ID (GSI) - for portal applicants
  jobId?: string; // Job ID (GSI)
  jobTitle?: string; // Auto-populated from Job ID
  resumeId?: string; // S3 resume reference
  resumeFileName?: string; // Original resume file name
  resumeFileKey?: string; // S3 file key for direct access

  // Status - unified status values
  status: "pending" | "reviewing" | "submitted" | "interview" | "offered" | "hired" | "rejected" | "active" | "inactive";

  // Timestamps
  appliedAt: string;
  createdAt?: string;
  updatedAt?: string;

  // Notes & Rating
  notes?: string;
  notesHistory?: NoteEntry[];  // New structured notes array
  rating?: number; // 1-5 star rating

  // Applicant info - core fields
  name: string; // Full name (firstName + lastName)
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;

  // Extended applicant info
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;

  // Skills & Experience (for portal applications)
  skills?: string[];
  experience?: string;
  coverLetter?: string;

  // HR-specific fields
  source?: ApplicationSource;
  workAuthorization?: WorkAuthorization;
  /** Engagement type this candidate is being placed on (W2, C2C, 1099, …). */
  hireType?: HireType;
  /**
   * Whether the candidate will need sponsorship, and when their current
   * authorization lapses (ISO date). Both were collected by the new/edit
   * application forms but existed on neither this type nor the write paths, so
   * every value entered was silently discarded on save.
   */
  visaSponsorshipRequired?: boolean;
  visaExpiry?: string;
  ownership?: string; // HR user ID assigned
  ownershipName?: string; // HR user name for display
  ownershipClaimedAt?: string; // When ownership was claimed

  // Creator info
  createdBy?: string; // User ID who created (for HR-created)
  createdByName?: string;

  benchAddedBy?: string;   // Email of user who added to talent bench

  // Talent bench flag
  addToTalentBench?: boolean;
  /**
   * Which pool a bench record belongs to: "internal" = our own hires sitting
   * on the bench between placements, "external" = market candidates kept warm
   * for future roles. Only meaningful when addToTalentBench is true. Legacy
   * rows predate the field — readers fall back to status === "hired" ?
   * "internal" : "external" (same rule the backfill script applies).
   */
  benchType?: BenchType;

  // Resume analysis (parsed by the resume-extraction Lambda)
  resumeAnalysis?: ResumeAnalysis;
  resumeAnalyzedAt?: string;          // ISO timestamp of last successful analysis
  resumeAnalysisStatus?: "pending" | "processing" | "completed" | "failed";
  resumeAnalysisError?: string;       // last failure message, if any
  /**
   * Whether the last failure is worth trying again on its own (a service
   * outage, a timeout, a rejected token — things that get fixed elsewhere) as
   * opposed to a dead end (no resume attached, file gone from storage, a
   * document nothing can be read from). Drives the automatic retry; absent on
   * records that failed before the flag existed, which are retried once.
   */
  resumeAnalysisRetryable?: boolean;
  resumeAnalysisAttempts?: number;    // failed attempts since the last success
  /**
   * Lowercased searchable text — skills, employers, role titles, technologies —
   * built by the API for LIST responses only, and never stored.
   *
   * List reads drop `resumeAnalysis` (2.43MB of a 2.76MB payload across 174
   * candidates) and send this instead, so a skill search still runs instantly in
   * the browser without shipping every parsed resume to it.
   */
  searchText?: string;

  // Job-fit verdict (this application's resume vs its job), cached from the
  // Resume Matching Engine so the card doesn't re-score on every view.
  jobFit?: JobFitResult;
  jobFitAt?: string;                  // ISO timestamp of last scoring
  /** The job the cached fit was scored against. A verdict is only meaningful
   *  for one requisition, so without this a moved candidate's old score is
   *  indistinguishable from a current one. */
  jobFitJobId?: string;

  // Status history for timeline
  statusHistory?: Array<{
    status: string;
    changedAt: string;
    changedBy?: string;
    changedByName?: string;
    notes?: string;
  }>;
}

export interface Job {
  id: string; // PK
  title: string;
  department: string;
  location: string;
  type: "full-time" | "part-time" | "contract" | "contract-to-hire" | "direct-hire" | "managed-teams" | "remote";
  description: string;
  // Rich HTML (new records) or a legacy string[] of bullet items. Read via
  // renderListField / richTextToPlain (src/lib/rich-text) which handle both.
  requirements: string | string[];
  responsibilities: string | string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  status: "active" | "paused" | "closed" | "draft" | "open" | "on-hold";
  submissionDueDate?: string; // ISO date string for application deadline
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  postedByName?: string; // Name of admin/HR who posted
  postedByEmail?: string; // Email of admin/HR who posted
  postedByRole?: string; // Role of poster (admin/hr)
  applicationsCount?: number;

  // Cached "best candidates" — the matching engine's ranking of the resume bank
  // for this job. Recomputed on demand; stored so the panel loads instantly and
  // resumes aren't re-vectorized per view.
  candidateMatches?: JobCandidateMatch[];
  candidateMatchesAt?: string;

  // Job Posting ID (auto-generated OB-YYYY-XXXX format)
  postingId?: string;

  // Client Information
  clientId?: string; // FK to oceanblue-clients
  clientName?: string; // Denormalized for display
  clientNotes?: string; // Quick note about client

  // State (separate from location)
  state?: string;

  // Rates
  clientBillRate?: number; // Client Bill Rate ($)
  payRate?: number; // Pay Rate ($)

  // Assignments - Recruitment Manager
  recruitmentManagerId?: string; // HR user ID
  recruitmentManagerName?: string; // HR user name
  recruitmentManagerEmail?: string; // HR email for notifications

  // Assignments - Multi-select assignees (HR/Admin)
  assignedToIds?: string[]; // Array of team member IDs
  assignedToNames?: string[]; // Array of team member names
  assignedToEmails?: string[]; // Array of team member emails for notifications

  // Legacy single assignee fields (for backward compatibility)
  assignedToId?: string;
  assignedToName?: string;

  // Vendor Information
  vendorId?: string; // FK to oceanblue-vendors
  vendorName?: string; // Denormalized for display

  excludedDepartments?: string[];
  notificationSentAt?: string;
}

// Public-safe projection of a Job — strips internal fields (pay/bill rates,
// client & vendor info, recruiter assignments, emails, creator) before a job is
// served to anonymous visitors on the careers site.
export type PublicJob = Pick<
  Job,
  | "id" | "postingId" | "title" | "department" | "location" | "state" | "type"
  | "description" | "requirements" | "responsibilities" | "salary" | "status"
  | "submissionDueDate" | "createdAt" | "updatedAt" | "applicationsCount"
>;

export function toPublicJob(job: Job): PublicJob {
  return {
    id: job.id,
    postingId: job.postingId,
    title: job.title,
    department: job.department,
    location: job.location,
    state: job.state,
    type: job.type,
    description: job.description,
    requirements: job.requirements,
    responsibilities: job.responsibilities,
    salary: job.salary,
    status: job.status,
    submissionDueDate: job.submissionDueDate,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    applicationsCount: job.applicationsCount,
  };
}

export interface Contact {
  id: string; // PK
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  jobTitle?: string;
  inquiryType: string;
  message: string;
  status: "new" | "read" | "responded" | "archived";
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

export interface Notification {
  id: string; // PK
  type: "job_posted" | "application_received" | "contact_received";
  title: string;
  message: string;
  link?: string; // URL to navigate to when clicked
  relatedId?: string; // ID of related entity (jobId, applicationId, contactId)
  isRead: boolean;
  createdAt: string;
  // TTL field - DynamoDB will auto-delete items when this timestamp passes
  // Set to 7 days from creation
  ttl?: number; // Unix timestamp in seconds
}

export interface Client {
  id: string; // PK
  name: string; // Client Name (mandatory)
  websiteUrl: string; // Website URL (mandatory)
  status: "active" | "inactive"; // Status (mandatory)
  email?: string; // Email ID
  phone?: string; // Phone Number
  address?: string; // Physical Address
  city?: string;
  state?: string;
  zipCode?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Vendor {
  id: string; // PK
  name: string; // Vendor Name (mandatory)
  contactPerson?: string; // Contact Person
  email?: string; // Email
  zipCode?: string; // ZIP Code
  state?: string; // State
  vendorLeadId: string; // Vendor Lead user ID (mandatory)
  vendorLeadName: string; // Vendor Lead user name for display
  vendorLeadRole: "admin" | "hr"; // Role of the vendor lead
  createdAt: string;
  updatedAt?: string;
}

export interface CandidateApplication {
  id: string; // PK
  applicationId: string; // Auto-generated APP-XXXX format
  name: string; // Combined firstName + lastName for compatibility
  firstName: string; // Mandatory
  lastName: string; // Mandatory
  phone: string; // Mandatory
  email: string; // Mandatory
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  source: ApplicationSource;
  status: "active" | "inactive" | "hired" | "rejected";
  jobId?: string; // FK to jobs table
  jobTitle?: string; // Auto-populated from Job ID
  ownership?: string; // HR user assigned
  ownershipName?: string; // HR user name for display
  ownershipClaimedAt?: string; // When ownership was claimed
  workAuthorization: WorkAuthorization;
  createdBy: string; // Auto-populate with current user
  createdByName?: string;
  createdAt: string; // Auto-populate with current date
  appliedAt: string; // Same as createdAt for compatibility with existing pages
  updatedAt?: string;
  rating?: number; // 1-5 star rating
  notes?: string; // Text area for additional comments
  notesHistory?: NoteEntry[]; // New structured notes array
  addToTalentBench?: boolean; // Add to talent bench for future opportunities
}

// ===========================================
// Resume Operations
// ===========================================

export async function createResume(resume: Resume): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    await dbCheck.client!.send(
      new PutCommand({
        TableName: getTables().resumes,
        Item: resume,
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error creating resume:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create resume",
    };
  }
}

export async function getResume(id: string): Promise<{ success: boolean; data?: Resume; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    const result = await dbCheck.client!.send(
      new GetCommand({
        TableName: getTables().resumes,
        Key: { id },
      })
    );
    return { success: true, data: result.Item as Resume | undefined };
  } catch (error) {
    console.error("Error getting resume:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get resume",
    };
  }
}

export async function getResumesByUser(userId: string): Promise<{ success: boolean; data?: Resume[]; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    const data = await queryAll<Resume>(dbCheck.client!, {
      TableName: getTables().resumes,
      IndexName: "userId-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error getting resumes by user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get resumes",
    };
  }
}

export async function deleteResume(id: string): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    await dbCheck.client!.send(
      new DeleteCommand({
        TableName: getTables().resumes,
        Key: { id },
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error deleting resume:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete resume",
    };
  }
}

// ===========================================
// Application Operations
// ===========================================

export async function createApplication(application: Application): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    await dbCheck.client!.send(
      new PutCommand({
        TableName: getTables().applications,
        Item: application,
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error creating application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create application",
    };
  }
}

export async function getApplication(id: string): Promise<{ success: boolean; data?: Application; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    const result = await dbCheck.client!.send(
      new GetCommand({
        TableName: getTables().applications,
        Key: { id },
      })
    );
    return { success: true, data: result.Item as Application | undefined };
  } catch (error) {
    console.error("Error getting application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get application",
    };
  }
}

export async function getApplicationsByUser(userId: string): Promise<{ success: boolean; data?: Application[]; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    const data = await queryAll<Application>(dbCheck.client!, {
      TableName: getTables().applications,
      IndexName: "userId-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error getting applications by user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get applications",
    };
  }
}

export async function getApplicationsByJob(jobId: string): Promise<{ success: boolean; data?: Application[]; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    const data = await queryAll<Application>(dbCheck.client!, {
      TableName: getTables().applications,
      IndexName: "jobId-index",
      KeyConditionExpression: "jobId = :jobId",
      ExpressionAttributeValues: {
        ":jobId": jobId,
      },
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error getting applications by job:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get applications",
    };
  }
}

export async function getAllApplications(): Promise<{ success: boolean; data?: Application[]; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    console.warn("DynamoDB not available:", dbCheck.error);
    return { success: true, data: [] }; // Return empty array instead of error
  }

  try {
    const data = await scanAll<Application>(dbCheck.client!, {
      TableName: getTables().applications,
    });
    console.log("Applications fetched successfully, count:", data.length);
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error("Error getting all applications:", errorName, errorMessage, error);
    // Return empty array for read operations to allow the app to function
    return { success: true, data: [] };
  }
}

export async function updateApplicationStatus(
  id: string,
  status: Application["status"],
  notes?: string,
  rating?: number,
  changedBy?: string,
  changedByName?: string
): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    // First get the current application to append to status history
    const currentApp = await getApplication(id);
    const statusHistory = currentApp.data?.statusHistory || [];

    // Add new status change to history
    const newHistoryEntry = {
      status,
      changedAt: new Date().toISOString(),
      changedBy,
      changedByName,
      notes,
    };

    const updateExpressions: string[] = [
      "#status = :status",
      "#updatedAt = :updatedAt",
      "#statusHistory = :statusHistory",
    ];
    const expressionAttributeValues: Record<string, unknown> = {
      ":status": status,
      ":updatedAt": new Date().toISOString(),
      ":statusHistory": [...statusHistory, newHistoryEntry],
    };
    const expressionAttributeNames: Record<string, string> = {
      "#status": "status",
      "#updatedAt": "updatedAt",
      "#statusHistory": "statusHistory",
    };

    if (notes !== undefined) {
      updateExpressions.push("#notes = :notes");
      expressionAttributeNames["#notes"] = "notes";
      expressionAttributeValues[":notes"] = notes;
    }

    if (rating !== undefined) {
      updateExpressions.push("#rating = :rating");
      expressionAttributeNames["#rating"] = "rating";
      expressionAttributeValues[":rating"] = rating;
    }

    await dbCheck.client!.send(
      new UpdateCommand({
        TableName: getTables().applications,
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error updating application status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update application",
    };
  }
}

/**
 * Patch an application.
 *
 * `remove` deletes attributes outright, which setting them cannot do: an
 * undefined value is skipped by the loop below, and an empty string leaves a
 * present-but-blank attribute behind. Replacing a resume needs the real thing —
 * the previous resume's parsed analysis has to disappear, not linger as stale
 * detail attributed to a document that is no longer on file.
 */
type ApplicationPatch = Partial<Omit<Application, "id" | "applicationId" | "createdAt" | "createdBy">>;

export async function updateApplication(
  id: string,
  updates: ApplicationPatch,
  remove: (keyof ApplicationPatch)[] = []
): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    const updateExpressions: string[] = ["#updatedAt = :updatedAt"];
    const expressionAttributeValues: Record<string, unknown> = {
      ":updatedAt": new Date().toISOString(),
    };
    const expressionAttributeNames: Record<string, string> = {
      "#updatedAt": "updatedAt",
    };

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        expressionAttributeNames[`#${key}`] = key;
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    // A field being both set and removed would make the expression invalid, so
    // an explicit set always wins.
    const removals = [...new Set(remove)].filter((k) => updates[k] === undefined);
    for (const key of removals) {
      expressionAttributeNames[`#${key}`] = key as string;
    }

    const expression = [
      `SET ${updateExpressions.join(", ")}`,
      removals.length ? `REMOVE ${removals.map((k) => `#${k}`).join(", ")}` : "",
    ].filter(Boolean).join(" ");

    await dbCheck.client!.send(
      new UpdateCommand({
        TableName: getTables().applications,
        Key: { id },
        UpdateExpression: expression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error updating application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update application",
    };
  }
}

export async function deleteApplication(id: string): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    await dbCheck.client!.send(
      new DeleteCommand({
        TableName: getTables().applications,
        Key: { id },
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error deleting application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete application",
    };
  }
}

// ===========================================
// Job Operations
// ===========================================

/**
 * Get next posting ID with atomic increment
 * Returns OB-YYYY-XXXX format (e.g., OB-2026-0001)
 */
export async function getNextPostingId(): Promise<{ success: boolean; postingId?: string; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  const currentYear = new Date().getFullYear();
  const counterId = `job-posting-${currentYear}`;

  try {
    // Use atomic increment to get the next sequence number
    const result = await dbCheck.client!.send(
      new UpdateCommand({
        TableName: getTables().counters,
        Key: { id: counterId },
        UpdateExpression: "SET #counter = if_not_exists(#counter, :start) + :inc",
        ExpressionAttributeNames: {
          "#counter": "counter",
        },
        ExpressionAttributeValues: {
          ":start": 0,
          ":inc": 1,
        },
        ReturnValues: "UPDATED_NEW",
      })
    );

    const counter = (result.Attributes?.counter as number) || 1;
    const postingId = `OB-${currentYear}-${counter.toString().padStart(4, "0")}`;

    return { success: true, postingId };
  } catch (error) {
    console.error("Error getting next posting ID:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate posting ID",
    };
  }
}

export async function createJob(job: Job): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    await dbCheck.client!.send(
      new PutCommand({
        TableName: getTables().jobs,
        Item: job,
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error creating job:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create job",
    };
  }
}

export async function getJob(id: string): Promise<{ success: boolean; data?: Job; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    const result = await dbCheck.client!.send(
      new GetCommand({
        TableName: getTables().jobs,
        Key: { id },
      })
    );
    return { success: true, data: result.Item as Job | undefined };
  } catch (error) {
    console.error("Error getting job:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get job",
    };
  }
}

export async function getAllJobs(status?: Job["status"]): Promise<{ success: boolean; data?: Job[]; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    console.warn("DynamoDB not available:", dbCheck.error);
    return { success: true, data: [] }; // Return empty array instead of error
  }

  try {
    const data = await scanAll<Job>(dbCheck.client!, {
      TableName: getTables().jobs,
      ...(status && {
        FilterExpression: "#status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": status },
      }),
    });
    console.log("Jobs fetched successfully, count:", data.length);
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error("Error getting jobs:", errorName, errorMessage, error);
    // Return empty array for read operations to allow the app to function
    return { success: true, data: [] };
  }
}

export async function updateJob(
  id: string,
  updates: Partial<Omit<Job, "id" | "createdAt" | "createdBy">>
): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    const updateExpressions: string[] = ["#updatedAt = :updatedAt"];
    const expressionAttributeValues: Record<string, unknown> = {
      ":updatedAt": new Date().toISOString(),
    };
    const expressionAttributeNames: Record<string, string> = {
      "#updatedAt": "updatedAt",
    };

    // Use expression attribute names for all keys to avoid reserved keyword issues
    // (location, status, name, type, etc. are DynamoDB reserved words)
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        expressionAttributeNames[`#${key}`] = key;
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    await dbCheck.client!.send(
      new UpdateCommand({
        TableName: getTables().jobs,
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error updating job:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update job",
    };
  }
}

export async function deleteJob(id: string): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    await dbCheck.client!.send(
      new DeleteCommand({
        TableName: getTables().jobs,
        Key: { id },
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error deleting job:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete job",
    };
  }
}

// ===========================================
// Contact Operations
// ===========================================

export async function createContact(contact: Contact): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    await dbCheck.client!.send(
      new PutCommand({
        TableName: getTables().contacts,
        Item: contact,
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error creating contact:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create contact",
    };
  }
}

export async function getContact(id: string): Promise<{ success: boolean; data?: Contact; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    const result = await dbCheck.client!.send(
      new GetCommand({
        TableName: getTables().contacts,
        Key: { id },
      })
    );
    return { success: true, data: result.Item as Contact | undefined };
  } catch (error) {
    console.error("Error getting contact:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get contact",
    };
  }
}

export async function getAllContacts(status?: Contact["status"]): Promise<{ success: boolean; data?: Contact[]; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    console.warn("DynamoDB not available:", dbCheck.error);
    return { success: true, data: [] };
  }

  try {
    const data = await scanAll<Contact>(dbCheck.client!, {
      TableName: getTables().contacts,
      ...(status && {
        FilterExpression: "#status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": status },
      }),
    });
    console.log("Contacts fetched successfully, count:", data.length);
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error("Error getting contacts:", errorName, errorMessage, error);
    return { success: true, data: [] };
  }
}

export async function updateContactStatus(
  id: string,
  status: Contact["status"],
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    const updateExpressions: string[] = ["#status = :status", "#updatedAt = :updatedAt"];
    const expressionAttributeValues: Record<string, unknown> = {
      ":status": status,
      ":updatedAt": new Date().toISOString(),
    };
    const expressionAttributeNames: Record<string, string> = {
      "#status": "status",
      "#updatedAt": "updatedAt",
    };

    if (notes !== undefined) {
      updateExpressions.push("#notes = :notes");
      expressionAttributeNames["#notes"] = "notes";
      expressionAttributeValues[":notes"] = notes;
    }

    await dbCheck.client!.send(
      new UpdateCommand({
        TableName: getTables().contacts,
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error updating contact status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update contact",
    };
  }
}

export async function deleteContact(id: string): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    await dbCheck.client!.send(
      new DeleteCommand({
        TableName: getTables().contacts,
        Key: { id },
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error deleting contact:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete contact",
    };
  }
}

// ===========================================
// Notification Operations
// ===========================================

export async function createNotification(notification: Omit<Notification, 'ttl'>): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    // Calculate TTL: 7 days from now in Unix timestamp (seconds)
    const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;
    const ttl = Math.floor(Date.now() / 1000) + SEVEN_DAYS_IN_SECONDS;

    await dbCheck.client!.send(
      new PutCommand({
        TableName: getTables().notifications,
        Item: {
          ...notification,
          ttl, // DynamoDB will auto-delete after 7 days
        },
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error creating notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create notification",
    };
  }
}

export async function getAllNotifications(limit?: number): Promise<{ success: boolean; data?: Notification[]; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    console.warn("DynamoDB not available:", dbCheck.error);
    return { success: true, data: [] };
  }

  try {
    // Note: `limit` caps rows read per page, NOT the number returned — a Scan
    // Limit is applied before sorting, so it cannot mean "the newest N".
    // Sorting happens below, over everything, then the caller slices.
    const notifications = await scanAll<Notification>(dbCheck.client!, {
      TableName: getTables().notifications,
    });

    // Sort by createdAt descending
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { success: true, data: limit ? notifications.slice(0, limit) : notifications };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error getting notifications:", errorMessage, error);
    return { success: true, data: [] };
  }
}

export async function getUnreadNotifications(): Promise<{ success: boolean; data?: Notification[]; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    console.warn("DynamoDB not available:", dbCheck.error);
    return { success: true, data: [] };
  }

  try {
    const notifications = await scanAll<Notification>(dbCheck.client!, {
      TableName: getTables().notifications,
      FilterExpression: "isRead = :isRead",
      ExpressionAttributeValues: { ":isRead": false },
    });

    // Sort by createdAt descending
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { success: true, data: notifications };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error getting unread notifications:", errorMessage, error);
    return { success: true, data: [] };
  }
}

export async function markNotificationAsRead(id: string): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    await dbCheck.client!.send(
      new UpdateCommand({
        TableName: getTables().notifications,
        Key: { id },
        UpdateExpression: "SET isRead = :isRead",
        ExpressionAttributeValues: {
          ":isRead": true,
        },
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update notification",
    };
  }
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    // First get all unread notifications
    const unreadResult = await getUnreadNotifications();
    if (!unreadResult.success || !unreadResult.data) {
      return { success: false, error: "Failed to get unread notifications" };
    }

    // Mark each as read
    for (const notification of unreadResult.data) {
      await markNotificationAsRead(notification.id);
    }

    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update notifications",
    };
  }
}

export async function deleteNotification(id: string): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    await dbCheck.client!.send(
      new DeleteCommand({
        TableName: getTables().notifications,
        Key: { id },
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete notification",
    };
  }
}

// ===========================================
// Client Operations
// ===========================================

export async function createClient(client: Client): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    await dbCheck.client!.send(
      new PutCommand({
        TableName: getTables().clients,
        Item: client,
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error creating client:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create client",
    };
  }
}

export async function getClient(id: string): Promise<{ success: boolean; data?: Client; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    const result = await dbCheck.client!.send(
      new GetCommand({
        TableName: getTables().clients,
        Key: { id },
      })
    );
    return { success: true, data: result.Item as Client | undefined };
  } catch (error) {
    console.error("Error getting client:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get client",
    };
  }
}

export async function getAllClients(status?: Client["status"]): Promise<{ success: boolean; data?: Client[]; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    console.warn("DynamoDB not available:", dbCheck.error);
    return { success: true, data: [] };
  }

  try {
    const data = await scanAll<Client>(dbCheck.client!, {
      TableName: getTables().clients,
      ...(status && {
        FilterExpression: "#status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": status },
      }),
    });
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error getting clients:", errorMessage, error);
    return { success: true, data: [] };
  }
}

export async function updateClient(
  id: string,
  updates: Partial<Omit<Client, "id" | "createdAt">>
): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    const updateExpressions: string[] = ["#updatedAt = :updatedAt"];
    const expressionAttributeValues: Record<string, unknown> = {
      ":updatedAt": new Date().toISOString(),
    };
    const expressionAttributeNames: Record<string, string> = {
      "#updatedAt": "updatedAt",
    };

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        expressionAttributeNames[`#${key}`] = key;
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    await dbCheck.client!.send(
      new UpdateCommand({
        TableName: getTables().clients,
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error updating client:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update client",
    };
  }
}

export async function deleteClient(id: string): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    await dbCheck.client!.send(
      new DeleteCommand({
        TableName: getTables().clients,
        Key: { id },
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error deleting client:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete client",
    };
  }
}

// ===========================================
// Vendor Operations
// ===========================================

export async function createVendor(vendor: Vendor): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    await dbCheck.client!.send(
      new PutCommand({
        TableName: getTables().vendors,
        Item: vendor,
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error creating vendor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create vendor",
    };
  }
}

export async function getVendor(id: string): Promise<{ success: boolean; data?: Vendor; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    const result = await dbCheck.client!.send(
      new GetCommand({
        TableName: getTables().vendors,
        Key: { id },
      })
    );
    return { success: true, data: result.Item as Vendor | undefined };
  } catch (error) {
    console.error("Error getting vendor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get vendor",
    };
  }
}

export async function getAllVendors(vendorLeadRole?: Vendor["vendorLeadRole"]): Promise<{ success: boolean; data?: Vendor[]; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    console.warn("DynamoDB not available:", dbCheck.error);
    return { success: true, data: [] };
  }

  try {
    const data = await scanAll<Vendor>(dbCheck.client!, {
      TableName: getTables().vendors,
      ...(vendorLeadRole && {
        FilterExpression: "vendorLeadRole = :vendorLeadRole",
        ExpressionAttributeValues: { ":vendorLeadRole": vendorLeadRole },
      }),
    });
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error getting vendors:", errorMessage, error);
    return { success: true, data: [] };
  }
}

export async function updateVendor(
  id: string,
  updates: Partial<Omit<Vendor, "id" | "createdAt">>
): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    const updateExpressions: string[] = ["#updatedAt = :updatedAt"];
    const expressionAttributeValues: Record<string, unknown> = {
      ":updatedAt": new Date().toISOString(),
    };
    const expressionAttributeNames: Record<string, string> = {
      "#updatedAt": "updatedAt",
    };

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        expressionAttributeNames[`#${key}`] = key;
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    await dbCheck.client!.send(
      new UpdateCommand({
        TableName: getTables().vendors,
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error updating vendor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update vendor",
    };
  }
}

export async function deleteVendor(id: string): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    await dbCheck.client!.send(
      new DeleteCommand({
        TableName: getTables().vendors,
        Key: { id },
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete vendor",
    };
  }
}

// ===========================================
// Bank-resume contact cards
// ===========================================
// The resume bank stores raw files in S3 with no per-file record. When a bank
// file is parsed for indexing, the extracted contact details (name, email,
// phone) are kept here — keyed by the S3 file key, in the otherwise-idle
// candidates table — so Lead Sourcing / Best candidates can show who a match
// actually is instead of "Unnamed candidate".

export interface BankResumeContact {
  id: string; // resume-bank S3 file key
  name?: string;
  email?: string;
  phone?: string;
  source: "resume-bank";
  updatedAt: string;
}

export async function putBankResumeContact(
  contact: Omit<BankResumeContact, "source" | "updatedAt">,
): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) return { success: false, error: dbCheck.error };
  try {
    await dbCheck.client!.send(
      new PutCommand({
        TableName: getTables().candidates,
        Item: { ...contact, source: "resume-bank", updatedAt: new Date().toISOString() },
      }),
    );
    return { success: true };
  } catch (error) {
    console.error("Error saving bank resume contact:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to save contact" };
  }
}

/** Fetch contact cards for a set of bank file keys. Missing ids are simply absent. */
export async function getBankResumeContacts(ids: string[]): Promise<Record<string, BankResumeContact>> {
  const out: Record<string, BankResumeContact> = {};
  if (ids.length === 0) return out;
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) return out;
  try {
    const table = getTables().candidates;
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = [...new Set(ids.slice(i, i + 100))];
      const result = await dbCheck.client!.send(
        new BatchGetCommand({ RequestItems: { [table]: { Keys: chunk.map((id) => ({ id })) } } }),
      );
      for (const item of result.Responses?.[table] || []) {
        const c = item as BankResumeContact;
        out[c.id] = c;
      }
    }
  } catch (error) {
    console.error("Error fetching bank resume contacts:", error);
  }
  return out;
}

// ===========================================
// Resume-index job state
// ===========================================
// One small item in the counters table tracks the cloud indexing chain, so a
// second "Index all" can't start a parallel chain (duplicate parses cost real
// money) and the UI can tell whether a run is already in flight.

const INDEX_JOB_ID = "resume-index-job";

export interface IndexJobState {
  id: string;
  updatedAt: string; // last hop heartbeat
  remaining: number; // items left; 0 = finished
}

export async function putIndexJobState(remaining: number): Promise<void> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) return;
  try {
    await dbCheck.client!.send(
      new PutCommand({
        TableName: getTables().counters,
        Item: { id: INDEX_JOB_ID, updatedAt: new Date().toISOString(), remaining },
      }),
    );
  } catch (error) {
    console.error("Error writing index job state:", error);
  }
}

export async function getIndexJobState(): Promise<IndexJobState | null> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) return null;
  try {
    const result = await dbCheck.client!.send(
      new GetCommand({ TableName: getTables().counters, Key: { id: INDEX_JOB_ID } }),
    );
    return (result.Item as IndexJobState) || null;
  } catch (error) {
    console.error("Error reading index job state:", error);
    return null;
  }
}

// ===========================================
// Candidate Application Operations
// ===========================================

/**
 * Get next application ID with atomic increment
 * Returns APP-YYYY-XXXX format (e.g., APP-2026-0001)
 */
export async function getNextApplicationId(): Promise<string> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    throw new Error(dbCheck.error || "Database not available");
  }

  const currentYear = new Date().getFullYear();
  const counterId = `application-${currentYear}`;

  try {
    // Use atomic increment to get the next sequence number
    const result = await dbCheck.client!.send(
      new UpdateCommand({
        TableName: getTables().counters,
        Key: { id: counterId },
        UpdateExpression: "SET #counter = if_not_exists(#counter, :start) + :inc",
        ExpressionAttributeNames: {
          "#counter": "counter",
        },
        ExpressionAttributeValues: {
          ":start": 0,
          ":inc": 1,
        },
        ReturnValues: "UPDATED_NEW",
      })
    );

    const counter = (result.Attributes?.counter as number) || 1;
    const applicationId = `APP-${currentYear}-${counter.toString().padStart(4, "0")}`;

    return applicationId;
  } catch (error) {
    console.error("Error getting next application ID:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to generate application ID");
  }
}

export async function createCandidateApplication(application: CandidateApplication): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    await dbCheck.client!.send(
      new PutCommand({
        TableName: getTables().applications,
        Item: application,
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error creating candidate application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create candidate application",
    };
  }
}

export async function getCandidateApplication(id: string): Promise<{ success: boolean; data?: CandidateApplication; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    const result = await dbCheck.client!.send(
      new GetCommand({
        TableName: getTables().applications,
        Key: { id },
      })
    );
    return { success: true, data: result.Item as CandidateApplication | undefined };
  } catch (error) {
    console.error("Error getting candidate application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get candidate application",
    };
  }
}

export async function getAllCandidateApplications(status?: CandidateApplication["status"]): Promise<{ success: boolean; data?: CandidateApplication[]; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    console.warn("DynamoDB not available:", dbCheck.error);
    return { success: true, data: [] };
  }

  try {
    const data = await scanAll<CandidateApplication>(dbCheck.client!, {
      TableName: getTables().applications,
      ...(status && {
        FilterExpression: "#status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": status },
      }),
    });
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error getting candidate applications:", errorMessage, error);
    return { success: true, data: [] };
  }
}

export async function updateCandidateApplication(
  id: string,
  updates: Partial<Omit<CandidateApplication, "id" | "applicationId" | "createdAt" | "createdBy">>
): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    const updateExpressions: string[] = ["#updatedAt = :updatedAt"];
    const expressionAttributeValues: Record<string, unknown> = {
      ":updatedAt": new Date().toISOString(),
    };
    const expressionAttributeNames: Record<string, string> = {
      "#updatedAt": "updatedAt",
    };

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        expressionAttributeNames[`#${key}`] = key;
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    await dbCheck.client!.send(
      new UpdateCommand({
        TableName: getTables().applications,
        Key: { id },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error updating candidate application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update candidate application",
    };
  }
}

export async function deleteCandidateApplication(id: string): Promise<{ success: boolean; error?: string }> {
  const dbCheck = checkDbAvailable();
  if (!dbCheck.available) {
    return { success: false, error: dbCheck.error };
  }

  try {
    await dbCheck.client!.send(
      new DeleteCommand({
        TableName: getTables().applications,
        Key: { id },
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error deleting candidate application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete candidate application",
    };
  }
}

// ===========================================
// CMS Content
// ===========================================

export interface ContentBlock {
  id: string;           // PK — e.g. "homepage", "about", "services", "contact"
  section: string;      // Same as id, kept for clarity
  fields: Record<string, string>;  // Arbitrary key → value map
  updatedAt: string;
  updatedBy?: string;
  updatedByName?: string;
  version?: number;
}

export async function getContentBlock(id: string): Promise<{ success: boolean; data?: ContentBlock; error?: string }> {
  const db = checkDbAvailable();
  if (!db.available || !db.client) return { success: false, error: db.error };
  try {
    const result = await db.client.send(new GetCommand({ TableName: getTables().content, Key: { id } }));
    return { success: true, data: result.Item as ContentBlock | undefined };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to get content" };
  }
}

export async function getAllContentBlocks(): Promise<{ success: boolean; data?: ContentBlock[]; error?: string }> {
  const db = checkDbAvailable();
  if (!db.available || !db.client) return { success: false, error: db.error };
  try {
    const data = await scanAll<ContentBlock>(db.client, { TableName: getTables().content });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to get content" };
  }
}

export async function upsertContentBlock(
  id: string,
  fields: Record<string, string>,
  updatedBy?: string,
  updatedByName?: string
): Promise<{ success: boolean; error?: string }> {
  const db = checkDbAvailable();
  if (!db.available || !db.client) return { success: false, error: db.error };
  try {
    const existing = await db.client.send(new GetCommand({ TableName: getTables().content, Key: { id } }));
    const currentVersion = (existing.Item as ContentBlock | undefined)?.version || 0;
    await db.client.send(new PutCommand({
      TableName: getTables().content,
      Item: {
        id,
        section: id,
        fields,
        updatedAt: new Date().toISOString(),
        updatedBy,
        updatedByName,
        version: currentVersion + 1,
      } as ContentBlock,
    }));
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to save content" };
  }
}

// ===========================================
// API Key Operations
// ===========================================

export interface ApiKey {
  id: string;         // PK (UUID)
  key: string;        // The actual API key string (obk_live_...)
  name: string;       // Platform / partner name
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  lastUsedAt?: string;
  createdBy: string;  // Admin user who created the key
  createdByName?: string;
}

export async function createApiKey(apiKey: ApiKey): Promise<{ success: boolean; error?: string }> {
  const db = checkDbAvailable();
  if (!db.available || !db.client) return { success: false, error: db.error };
  try {
    await db.client.send(new PutCommand({ TableName: getTables().apiKeys, Item: apiKey }));
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create API key" };
  }
}

export async function getApiKeyByValue(key: string): Promise<{ success: boolean; data?: ApiKey; error?: string }> {
  const db = checkDbAvailable();
  if (!db.available || !db.client) return { success: false, error: db.error };
  try {
    // Paginated deliberately: a FilterExpression is applied AFTER each 1MB page
    // is read, so an unpaginated scan can return an empty page while the
    // matching key sits on the next one — which would reject a valid API key
    // intermittently, and more often as the table grows.
    const items = await scanAll<ApiKey>(db.client, {
      TableName: getTables().apiKeys,
      FilterExpression: "#k = :key",
      ExpressionAttributeNames: { "#k": "key" },
      ExpressionAttributeValues: { ":key": key },
    });
    return { success: true, data: items[0] };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to validate API key" };
  }
}

export async function getAllApiKeys(): Promise<{ success: boolean; data?: ApiKey[]; error?: string }> {
  const db = checkDbAvailable();
  if (!db.available || !db.client) return { success: false, error: db.error };
  try {
    const data = await scanAll<ApiKey>(db.client, { TableName: getTables().apiKeys });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to list API keys" };
  }
}

export async function updateApiKey(
  id: string,
  updates: Partial<Pick<ApiKey, "name" | "description" | "isActive" | "lastUsedAt">>
): Promise<{ success: boolean; error?: string }> {
  const db = checkDbAvailable();
  if (!db.available || !db.client) return { success: false, error: db.error };
  try {
    const expressions: string[] = ["#updatedAt = :updatedAt"];
    const names: Record<string, string> = { "#updatedAt": "updatedAt" };
    const values: Record<string, unknown> = { ":updatedAt": new Date().toISOString() };

    if (updates.name !== undefined) { expressions.push("#name = :name"); names["#name"] = "name"; values[":name"] = updates.name; }
    if (updates.description !== undefined) { expressions.push("#desc = :desc"); names["#desc"] = "description"; values[":desc"] = updates.description; }
    if (updates.isActive !== undefined) { expressions.push("#active = :active"); names["#active"] = "isActive"; values[":active"] = updates.isActive; }
    if (updates.lastUsedAt !== undefined) { expressions.push("#used = :used"); names["#used"] = "lastUsedAt"; values[":used"] = updates.lastUsedAt; }

    await db.client.send(new UpdateCommand({
      TableName: getTables().apiKeys,
      Key: { id },
      UpdateExpression: `SET ${expressions.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    }));
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to update API key" };
  }
}

export async function deleteApiKey(id: string): Promise<{ success: boolean; error?: string }> {
  const db = checkDbAvailable();
  if (!db.available || !db.client) return { success: false, error: db.error };
  try {
    await db.client.send(new DeleteCommand({ TableName: getTables().apiKeys, Key: { id } }));
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete API key" };
  }
}

/* ============================================================
   RECRUITING PIPELINE — submissions, interviews, placements

   Everything after "candidate" used to be a status label on the
   application: `status: "submitted"` could not say WHO the person was
   submitted to, at what rate, or when, so none of the questions a desk
   actually runs on could be answered — submittals this week,
   submission-to-interview ratio, which client is sitting on a candidate,
   time-to-fill, margin on a placement.

   All three live in ONE table behind a `kind` discriminator. They are
   almost always read together for a single application, they share the
   same audit shape, and a submission's interviews and placement are
   meaningless apart from it. Two GSIs cover both access patterns:
   everything for one application, and everything of one kind in a date
   window (which is what the reporting reads).
   ============================================================ */

export type PipelineKind = "submission" | "interview" | "placement";

/** How a money figure should be read. Contract desks quote hourly; perm quotes annual. */
export type RateUnit = "hourly" | "daily" | "weekly" | "monthly" | "annual";

/** Shared by all three kinds. `occurredAt` is the date the record is ABOUT
 *  (sent / scheduled / start date) rather than when it was typed in — it is the
 *  sort key on both indexes, so it is what every list and report orders by. */
export interface PipelineBase {
  id: string;                  // PK (UUID)
  kind: PipelineKind;
  applicationId: string;       // GSI: applicationId-index
  occurredAt: string;          // GSI sort key (ISO)
  /** Denormalised so cross-candidate lists need no second read. */
  candidateName?: string;
  jobId?: string;
  jobTitle?: string;
  /** Interviews and placements point back at the submission that produced them.
   *  Optional: a direct-hire interview can happen with no submission at all. */
  submissionId?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
  createdByName?: string;
  updatedAt?: string;
}

export type SubmissionStatus =
  | "sent"
  | "under-review"
  | "shortlisted"
  | "interviewing"
  | "offered"
  | "placed"
  | "rejected"
  | "withdrawn";

export interface Submission extends PipelineBase {
  kind: "submission";
  /** Submitted to a client directly, or through a vendor/prime. */
  clientId?: string;
  clientName?: string;
  vendorId?: string;
  vendorName?: string;
  /** Person on the other side — the one to chase for a response. */
  submittedTo?: string;
  rate?: number;
  rateUnit?: RateUnit;
  currency?: string;
  status: SubmissionStatus;
  /** When the client came back, whatever the answer — drives response-time reporting. */
  respondedAt?: string;
  rejectionReason?: string;
}

export type InterviewMode = "phone" | "video" | "onsite";
export type InterviewStatus = "scheduled" | "completed" | "cancelled" | "no-show" | "rescheduled";
export type InterviewOutcome = "pending" | "pass" | "fail" | "hold";

export interface Interview extends PipelineBase {
  kind: "interview";
  round: number;
  mode: InterviewMode;
  /** Mirrors occurredAt; kept named for readability at call sites. */
  scheduledAt: string;
  durationMinutes?: number;
  /** Room, address, or meeting link depending on mode. */
  location?: string;
  panel?: string[];
  status: InterviewStatus;
  outcome?: InterviewOutcome;
  feedback?: string;
}

export type PlacementStatus = "active" | "completed" | "terminated" | "extended";

export interface Placement extends PipelineBase {
  kind: "placement";
  /** Mirrors occurredAt. */
  startAt: string;
  endAt?: string;
  billRate?: number;
  payRate?: number;
  rateUnit?: RateUnit;
  currency?: string;
  status: PlacementStatus;
  poNumber?: string;
}

export type PipelineRecord = Submission | Interview | Placement;

export async function createPipelineRecord(
  record: PipelineRecord
): Promise<{ success: boolean; error?: string }> {
  const db = checkDbAvailable();
  if (!db.available || !db.client) return { success: false, error: db.error };
  try {
    await db.client.send(new PutCommand({ TableName: getTables().pipeline, Item: record }));
    return { success: true };
  } catch (error) {
    console.error("Error creating pipeline record:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create record" };
  }
}

export async function getPipelineRecord(
  id: string
): Promise<{ success: boolean; data?: PipelineRecord; error?: string }> {
  const db = checkDbAvailable();
  if (!db.available || !db.client) return { success: false, error: db.error };
  try {
    const result = await db.client.send(
      new GetCommand({ TableName: getTables().pipeline, Key: { id } })
    );
    return { success: true, data: result.Item as PipelineRecord | undefined };
  } catch (error) {
    console.error("Error getting pipeline record:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to get record" };
  }
}

/**
 * Everything recorded against one application, oldest first.
 *
 * Returns an empty list rather than an error when the table is missing, so a
 * candidate screen still renders on a deployment where the pipeline table has
 * not been created yet.
 */
export async function listPipelineByApplication(
  applicationId: string
): Promise<{ success: boolean; data?: PipelineRecord[]; error?: string }> {
  const db = checkDbAvailable();
  if (!db.available || !db.client) return { success: true, data: [] };
  try {
    const result = await db.client.send(
      new QueryCommand({
        TableName: getTables().pipeline,
        IndexName: "applicationId-index",
        KeyConditionExpression: "applicationId = :a",
        ExpressionAttributeValues: { ":a": applicationId },
      })
    );
    const data = ((result.Items || []) as PipelineRecord[]).sort(
      (x, y) => (x.occurredAt || "").localeCompare(y.occurredAt || "")
    );
    return { success: true, data };
  } catch (error) {
    const name = (error as { name?: string }).name;
    if (name === "ResourceNotFoundException") {
      console.warn("Pipeline table does not exist yet - returning an empty pipeline.");
      return { success: true, data: [] };
    }
    console.error("Error listing pipeline records:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to list records" };
  }
}

/**
 * All records of one kind, newest first, optionally inside a date window.
 *
 * This is the reporting read: submittals this week, interviews next week,
 * placements ending this month. Because `kind` is the partition key on the
 * index, it touches only the rows asked for instead of scanning the table.
 */
export async function listPipelineByKind(
  kind: PipelineKind,
  range?: { from?: string; to?: string }
): Promise<{ success: boolean; data?: PipelineRecord[]; error?: string }> {
  const db = checkDbAvailable();
  if (!db.available || !db.client) return { success: true, data: [] };

  const values: Record<string, string> = { ":k": kind };
  let condition = "#kind = :k";
  if (range?.from && range?.to) {
    condition += " AND occurredAt BETWEEN :from AND :to";
    values[":from"] = range.from;
    values[":to"] = range.to;
  } else if (range?.from) {
    condition += " AND occurredAt >= :from";
    values[":from"] = range.from;
  } else if (range?.to) {
    condition += " AND occurredAt <= :to";
    values[":to"] = range.to;
  }

  try {
    const result = await db.client.send(
      new QueryCommand({
        TableName: getTables().pipeline,
        IndexName: "kind-date-index",
        KeyConditionExpression: condition,
        ExpressionAttributeNames: { "#kind": "kind" },
        ExpressionAttributeValues: values,
        ScanIndexForward: false, // newest first
      })
    );
    return { success: true, data: (result.Items || []) as PipelineRecord[] };
  } catch (error) {
    const name = (error as { name?: string }).name;
    if (name === "ResourceNotFoundException") return { success: true, data: [] };
    console.error("Error listing pipeline by kind:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to list records" };
  }
}

/**
 * Submissions raised against one requisition.
 *
 * Filtered from the kind query rather than given its own index: submissions are
 * a small slice of the table, and one more GSI to maintain buys nothing at this
 * size.
 */
export async function listSubmissionsByJob(
  jobId: string
): Promise<{ success: boolean; data?: Submission[]; error?: string }> {
  const result = await listPipelineByKind("submission");
  if (!result.success) return { success: false, error: result.error };
  const data = (result.data || [])
    .filter((r): r is Submission => r.kind === "submission" && r.jobId === jobId);
  return { success: true, data };
}

export async function updatePipelineRecord(
  id: string,
  updates: Partial<Omit<PipelineRecord, "id" | "kind" | "applicationId" | "createdAt">>
): Promise<{ success: boolean; data?: PipelineRecord; error?: string }> {
  const db = checkDbAvailable();
  if (!db.available || !db.client) return { success: false, error: db.error };

  const entries = Object.entries({ ...updates, updatedAt: new Date().toISOString() })
    .filter(([, v]) => v !== undefined);
  if (entries.length === 0) return { success: false, error: "No fields to update" };

  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const sets = entries.map(([key, value], i) => {
    names[`#f${i}`] = key;
    values[`:v${i}`] = value;
    return `#f${i} = :v${i}`;
  });

  try {
    const result = await db.client.send(
      new UpdateCommand({
        TableName: getTables().pipeline,
        Key: { id },
        UpdateExpression: `SET ${sets.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      })
    );
    return { success: true, data: result.Attributes as PipelineRecord };
  } catch (error) {
    console.error("Error updating pipeline record:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update record" };
  }
}

/**
 * Delete a record, and anything hanging off it.
 *
 * Deleting a submission takes its interviews and placement with it: they
 * describe a submission that no longer exists, and leaving them orphaned would
 * keep them in every report.
 */
export async function deletePipelineRecord(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const db = checkDbAvailable();
  if (!db.available || !db.client) return { success: false, error: db.error };

  try {
    const existing = await getPipelineRecord(id);
    const record = existing.data;

    if (record?.kind === "submission") {
      const siblings = await listPipelineByApplication(record.applicationId);
      const children = (siblings.data || []).filter((r) => r.submissionId === id);
      for (const child of children) {
        await db.client.send(
          new DeleteCommand({ TableName: getTables().pipeline, Key: { id: child.id } })
        );
      }
    }

    await db.client.send(new DeleteCommand({ TableName: getTables().pipeline, Key: { id } }));
    return { success: true };
  } catch (error) {
    console.error("Error deleting pipeline record:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete record" };
  }
}

/**
 * Atomically count one request against a rate-limit bucket, returning the new
 * count — or null when the counter is unavailable, which callers treat as
 * "allow" (see lib/rate-limit.ts on failing open).
 *
 * `expiresAt` is written as a TTL attribute so buckets tidy themselves up if TTL
 * is enabled on the counters table; harmless if it is not.
 */
export async function incrementRateCounter(
  counterId: string,
  expiresAt: number,
): Promise<number | null> {
  const db = checkDbAvailable();
  if (!db.available || !db.client) return null;

  try {
    const result = await db.client.send(
      new UpdateCommand({
        TableName: getTables().counters,
        Key: { id: counterId },
        UpdateExpression:
          "SET #c = if_not_exists(#c, :zero) + :one, #ttl = if_not_exists(#ttl, :exp)",
        ExpressionAttributeNames: { "#c": "counter", "#ttl": "expiresAt" },
        ExpressionAttributeValues: { ":zero": 0, ":one": 1, ":exp": expiresAt },
        ReturnValues: "UPDATED_NEW",
      })
    );
    const count = result.Attributes?.counter;
    return typeof count === "number" ? count : null;
  } catch (error) {
    console.error("Rate counter unavailable (allowing the request):", error);
    return null;
  }
}
