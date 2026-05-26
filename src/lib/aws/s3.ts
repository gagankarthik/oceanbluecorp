import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { awsConfig, s3Config } from "./config";

// Initialize S3 Client
const s3Client = new S3Client({
  region: s3Config.region,
  credentials: awsConfig.credentials,
  ...(s3Config.endpoint && { endpoint: s3Config.endpoint }),
});

// Resume file types allowed
export const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Maximum file size (5MB)
export const MAX_RESUME_SIZE = 5 * 1024 * 1024;

// Generate a unique key for the resume
export function generateResumeKey(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `resumes/${userId}/${timestamp}-${sanitizedFileName}`;
}

// Generate a key for resume bank uploads — encodes candidateName + fileName in the key
// Format: resume-bank/{email}/{timestamp}--{candidateName}--{fileName}
export function generateResumeBankKey(uploaderEmail: string, fileName: string, candidateName?: string): string {
  const timestamp = Date.now();
  // Email: only strip / (emails don't normally have it, but be safe)
  const safeEmail = uploaderEmail.replace(/\//g, "_");
  const safeCandidate = candidateName
    ? candidateName.replace(/[^a-zA-Z0-9 _-]/g, "").replace(/\s+/g, "_").slice(0, 60) || "unknown"
    : "unknown";
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `resume-bank/${safeEmail}/${timestamp}--${safeCandidate}--${safeFileName}`;
}

// Parse a resume-bank S3 key back into metadata
export function parseResumeBankKey(key: string): {
  uploaderEmail: string;
  fileName: string;
  candidateName?: string;
  timestamp: number;
} {
  const parts = key.split("/");
  const uploaderEmail = parts[1] || "";
  const segment = parts[2] || "";

  const i1 = segment.indexOf("--");
  const i2 = i1 >= 0 ? segment.indexOf("--", i1 + 2) : -1;

  if (i1 < 0 || i2 < 0) {
    return { uploaderEmail, fileName: segment, timestamp: 0 };
  }

  const timestamp = parseInt(segment.slice(0, i1)) || 0;
  const candidateRaw = segment.slice(i1 + 2, i2);
  const fileName = segment.slice(i2 + 2);
  const candidateName =
    candidateRaw && candidateRaw !== "unknown"
      ? candidateRaw.replace(/_/g, " ").trim()
      : undefined;

  return { uploaderEmail, fileName, candidateName, timestamp };
}

// List all objects in the resume-bank/ prefix
export async function listResumeBankObjects(): Promise<{
  success: boolean;
  objects?: Array<{ key: string; size: number; lastModified: Date }>;
  error?: string;
}> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: s3Config.bucketName,
      Prefix: "resume-bank/",
    });
    const response = await s3Client.send(command);
    const objects = (response.Contents || []).map((obj) => ({
      key: obj.Key!,
      size: obj.Size || 0,
      lastModified: obj.LastModified || new Date(),
    }));
    return { success: true, objects };
  } catch (error) {
    console.error("Error listing resume bank objects:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list resumes",
    };
  }
}

// Upload resume to S3
export async function uploadResume(
  file: Buffer,
  key: string,
  contentType: string
): Promise<{ success: boolean; key?: string; error?: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: s3Config.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: {
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    return { success: true, key };
  } catch (error) {
    console.error("Error uploading resume to S3:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload resume",
    };
  }
}

// Get a signed URL for downloading a resume
export async function getResumeDownloadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const command = new GetObjectCommand({
      Bucket: s3Config.bucketName,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return { success: true, url };
  } catch (error) {
    console.error("Error generating download URL:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate download URL",
    };
  }
}

// Get a signed URL for uploading a resume (client-side upload)
export async function getResumeUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 300 // 5 minutes default
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: s3Config.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return { success: true, url };
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate upload URL",
    };
  }
}

// Delete a resume from S3
export async function deleteResume(
  key: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: s3Config.bucketName,
      Key: key,
    });

    await s3Client.send(command);

    return { success: true };
  } catch (error) {
    console.error("Error deleting resume from S3:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete resume",
    };
  }
}

// Check if a resume exists
export async function resumeExists(
  key: string
): Promise<{ exists: boolean; error?: string }> {
  try {
    const command = new HeadObjectCommand({
      Bucket: s3Config.bucketName,
      Key: key,
    });

    await s3Client.send(command);

    return { exists: true };
  } catch (error) {
    if ((error as { name?: string }).name === "NotFound") {
      return { exists: false };
    }
    console.error("Error checking resume existence:", error);
    return {
      exists: false,
      error: error instanceof Error ? error.message : "Failed to check resume",
    };
  }
}

// Validate resume file
export function validateResumeFile(
  file: { type: string; size: number }
): { valid: boolean; error?: string } {
  if (!ALLOWED_RESUME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload a PDF or Word document.",
    };
  }

  if (file.size > MAX_RESUME_SIZE) {
    return {
      valid: false,
      error: "File too large. Maximum size is 5MB.",
    };
  }

  return { valid: true };
}

/* ============================================================
   PROFILE PHOTOS (avatars)
   Stored at a stable per-user key so each upload overwrites the
   previous photo. The private object is served through the app's
   /api/users/avatar/[userId] route, not a public S3 URL.
   ============================================================ */

export const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

export function generateAvatarKey(userId: string): string {
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `avatars/${safe}`;
}

export function validateAvatarFile(
  file: { type: string; size: number }
): { valid: boolean; error?: string } {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return { valid: false, error: "Invalid file type. Please upload a JPG, PNG, or WebP image." };
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return { valid: false, error: "Image too large. Maximum size is 2MB." };
  }
  return { valid: true };
}

export async function uploadAvatar(
  file: Buffer,
  key: string,
  contentType: string
): Promise<{ success: boolean; key?: string; error?: string }> {
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
      })
    );
    return { success: true, key };
  } catch (error) {
    console.error("Error uploading avatar to S3:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to upload avatar" };
  }
}

export async function getAvatarObject(
  key: string
): Promise<{ success: boolean; body?: Uint8Array; contentType?: string; notFound?: boolean; error?: string }> {
  try {
    const res = await s3Client.send(
      new GetObjectCommand({ Bucket: s3Config.bucketName, Key: key })
    );
    const body = await res.Body?.transformToByteArray();
    if (!body) return { success: false, notFound: true };
    return { success: true, body, contentType: res.ContentType };
  } catch (error) {
    const name = (error as { name?: string }).name;
    if (name === "NoSuchKey" || name === "NotFound") {
      return { success: false, notFound: true };
    }
    console.error("Error fetching avatar from S3:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch avatar" };
  }
}

export async function deleteAvatar(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: s3Config.bucketName, Key: key }));
    return { success: true };
  } catch (error) {
    console.error("Error deleting avatar from S3:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete avatar" };
  }
}
