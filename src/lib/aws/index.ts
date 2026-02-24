// AWS Configuration
export { awsConfig, s3Config, dynamoDBConfig, validateAwsConfig } from "./config";

// S3 Operations
export {
  uploadResume,
  getResumeDownloadUrl,
  getResumeUploadUrl,
  deleteResume as deleteResumeFromS3,
  resumeExists,
  validateResumeFile,
  generateResumeKey,
  ALLOWED_RESUME_TYPES,
  MAX_RESUME_SIZE,
} from "./s3";

// DynamoDB Operations
export type { Resume, Application, Job } from "./dynamodb";
export {
  // Resume operations
  createResume,
  getResume,
  getResumesByUser,
  deleteResume,
  // Application operations
  createApplication,
  getApplication,
  getApplicationsByUser,
  getApplicationsByJob,
  getAllApplications,
  updateApplicationStatus,
  // Job operations
  createJob,
  getJob,
  getAllJobs,
  updateJob,
  deleteJob,
} from "./dynamodb";

// Cognito Operations
export type { CognitoUser } from "./cognito";
export {
  listCognitoUsers,
  getCognitoUser,
  getUserGroups,
  addUserToGroup,
  removeUserFromGroup,
  updateUserRole,
  enableUser,
  disableUser,
  deleteUser,
  listGroups,
} from "./cognito";

// SES Email Operations
export type {
  ApplicationConfirmationEmail,
  NewApplicationNotificationEmail,
  JobPostedNotificationEmail,
  InterviewInviteEmail,
  StatusUpdateEmail,
  CustomEmail,
} from "./ses";
export {
  sendApplicationConfirmation,
  sendNewApplicationNotification,
  sendJobPostedNotification,
  sendJobPostedNotifications,
  sendInterviewInvite,
  sendStatusUpdate,
  sendCustomEmail,
} from "./ses";
