import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
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
    },
  };
};

// Check if AWS credentials are configured
const isAwsConfigured = (): boolean => {
  const { accessKeyId, secretAccessKey } = getEnvConfig();
  const configured = !!(accessKeyId && secretAccessKey && accessKeyId !== "" && secretAccessKey !== "");

  if (!configured) {
    console.log("AWS Config Check - accessKeyId present:", !!accessKeyId, "length:", accessKeyId?.length || 0);
    console.log("AWS Config Check - secretAccessKey present:", !!secretAccessKey, "length:", secretAccessKey?.length || 0);
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

  console.log("Creating DynamoDB client with region:", config.region);

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

// ===========================================
// Types
// ===========================================

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

export interface Application {
  id: string; // PK
  userId: string; // User ID (GSI)
  jobId: string; // Job ID (GSI)
  resumeId: string;
  status: "pending" | "reviewing" | "interview" | "offered" | "hired" | "rejected";
  appliedAt: string;
  updatedAt?: string;
  notes?: string;
  rating?: number;
  // Applicant info
  name: string;
  email: string;
  phone?: string;
  skills?: string[];
  experience?: string;
  coverLetter?: string;
}

export interface Job {
  id: string; // PK
  title: string;
  department: string;
  location: string;
  type: "full-time" | "part-time" | "contract" | "contract-to-hire" | "direct-hire" | "managed-teams" | "remote";
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  status: "active" | "paused" | "closed" | "draft";
  submissionDueDate?: string; // ISO date string for application deadline
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  postedByName?: string; // Name of admin/HR who posted
  postedByEmail?: string; // Email of admin/HR who posted
  postedByRole?: string; // Role of poster (admin/hr)
  applicationsCount?: number;
  // Email notification settings
  notifyHROnApplication?: boolean; // Notify all HR users when someone applies
  notifyAdminOnApplication?: boolean; // Notify all Admin users when someone applies
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
    const result = await dbCheck.client!.send(
      new QueryCommand({
        TableName: getTables().resumes,
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      })
    );
    return { success: true, data: result.Items as Resume[] };
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
    const result = await dbCheck.client!.send(
      new QueryCommand({
        TableName: getTables().applications,
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      })
    );
    return { success: true, data: result.Items as Application[] };
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
    const result = await dbCheck.client!.send(
      new QueryCommand({
        TableName: getTables().applications,
        IndexName: "jobId-index",
        KeyConditionExpression: "jobId = :jobId",
        ExpressionAttributeValues: {
          ":jobId": jobId,
        },
      })
    );
    return { success: true, data: result.Items as Application[] };
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
    console.log("Fetching applications from table:", getTables().applications);
    const result = await dbCheck.client!.send(
      new ScanCommand({
        TableName: getTables().applications,
      })
    );
    console.log("Applications fetched successfully, count:", result.Items?.length || 0);
    return { success: true, data: result.Items as Application[] };
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
  rating?: number
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

// ===========================================
// Job Operations
// ===========================================

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
    console.log("Fetching jobs from table:", getTables().jobs);
    let result;

    if (status) {
      result = await dbCheck.client!.send(
        new ScanCommand({
          TableName: getTables().jobs,
          FilterExpression: "#status = :status",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":status": status,
          },
        })
      );
    } else {
      result = await dbCheck.client!.send(
        new ScanCommand({
          TableName: getTables().jobs,
        })
      );
    }

    console.log("Jobs fetched successfully, count:", result.Items?.length || 0);
    return { success: true, data: result.Items as Job[] };
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
    console.log("Fetching contacts from table:", getTables().contacts);
    let result;

    if (status) {
      result = await dbCheck.client!.send(
        new ScanCommand({
          TableName: getTables().contacts,
          FilterExpression: "#status = :status",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":status": status,
          },
        })
      );
    } else {
      result = await dbCheck.client!.send(
        new ScanCommand({
          TableName: getTables().contacts,
        })
      );
    }

    console.log("Contacts fetched successfully, count:", result.Items?.length || 0);
    return { success: true, data: result.Items as Contact[] };
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
    const result = await dbCheck.client!.send(
      new ScanCommand({
        TableName: getTables().notifications,
        ...(limit && { Limit: limit }),
      })
    );

    // Sort by createdAt descending
    const notifications = (result.Items as Notification[]) || [];
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { success: true, data: notifications };
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
    const result = await dbCheck.client!.send(
      new ScanCommand({
        TableName: getTables().notifications,
        FilterExpression: "isRead = :isRead",
        ExpressionAttributeValues: {
          ":isRead": false,
        },
      })
    );

    // Sort by createdAt descending
    const notifications = (result.Items as Notification[]) || [];
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
