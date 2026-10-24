import "server-only";
import * as nodemailer from "nodemailer";
import { renderRichText, renderListField, richTextToPlain } from "@/lib/rich-text";
import { escapeHtml } from "@/lib/email-templates";

// SMTP Configuration for AWS SES
const getSmtpConfig = () => ({
  host: `email-smtp.${process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2"}.amazonaws.com`,
  port: 587,
  secure: false,
  auth: {
    user: process.env.NEXT_AWS_STMP || "",
    pass: process.env.NEXT_AWS_STMP_PASSWORD || "",
  },
});

// Default sender email
const getDefaultSender = () =>
  process.env.NEXT_AWS_SES_FROM_EMAIL || "hiring@oceanbluecorp.com";

// Create transporter
const createTransporter = () => {
  const config = getSmtpConfig();
  if (!config.auth.user || !config.auth.pass) {
    return null;
  }
  return nodemailer.createTransport(config);
};

// Email template types
export interface ApplicationConfirmationEmail {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  jobDepartment: string;
  jobLocation: string;
  companyName?: string;
}

export interface NewApplicationNotificationEmail {
  recruiterName: string;
  recruiterEmail: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  jobTitle: string;
  jobId: string;
  applicationId: string;
  appliedAt: string;
}

export interface JobPostedNotificationEmail {
  recipientName: string;
  recipientEmail: string;
  jobTitle: string;
  jobDepartment: string;
  jobLocation: string;
  jobType: string;
  postedByName: string;
  jobId: string;
  postingId?: string;
  description?: string;
  requirements?: string | string[];
  responsibilities?: string | string[];
  salary?: {
    min: number;
    max: number;
    currency?: string;
  };
  payRate?: number;
  clientBillRate?: number;
  clientName?: string;
  vendorName?: string;
  submissionDueDate?: string;
}

export interface JobUpdatedNotificationEmail {
  recipientName: string;
  recipientEmail: string;
  jobTitle: string;
  payRate?: number;
  jobId: string;
  postingId?: string;
  updatedByName: string;
  changes: string[];
}

export interface InterviewInviteEmail {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  interviewDate: string;
  interviewTime: string;
  interviewType: string;
  interviewerName?: string;
  location?: string;
  meetingLink?: string;
  notes?: string;
}

export interface StatusUpdateEmail {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  newStatus: string;
  message?: string;
}

export interface CustomEmail {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
}

// Send email helper
async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string,
  extra: { replyTo?: string; fromName?: string; ics?: string } = {},
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = getSmtpConfig();
  const sender = getDefaultSender();

  const transporter = createTransporter();
  if (!transporter) {
    return { success: false, error: "SMTP not configured - missing credentials" };
  }

  try {
    const result = await transporter.sendMail({
      from: `"${(extra.fromName || "Oceanblue Careers").replace(/["\r\n]/g, "")}" <${sender}>`,
      to,
      subject,
      text: textBody,
      html: htmlBody,
      ...(extra.replyTo && { replyTo: extra.replyTo }),
      ...(extra.ics && { icalEvent: { method: "REQUEST", filename: "interview.ics", content: extra.ics } }),
    });
    return { success: true, messageId: result.messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to send email";
    return { success: false, error: errorMessage };
  }
}

// Email Templates

/**
 * HTML-escaped copy of an email payload's string fields. Templates read `h.*`
 * inside HTML so a name like `<a href=...>` arrives as text, not a link.
 * Rich-text fields still go through renderRichText/renderListField from `data`.
 */
function escapeFields<T extends object>(data: T): { [K in keyof T]: T[K] } {
  const out = { ...data } as Record<string, unknown>;
  for (const [k, v] of Object.entries(out)) if (typeof v === "string") out[k] = escapeHtml(v);
  return out as { [K in keyof T]: T[K] };
}

function getEmailHeader(): string {
  return `
    <div style="background-color: #f8fafc; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #0891b2 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 600;">
            Oceanblue Solutions, Inc.
          </h1>
        </div>
        <div style="padding: 40px 30px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  `;
}

function getEmailFooter(): string {
  return `
        </div>
        <div style="background-color: #f1f5f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #64748b; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            Oceanblue Solutions, Inc. | Enterprise IT Solutions
          </p>
          <p style="margin: 8px 0 0; color: #94a3b8; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            This is an automated message. Please do not reply directly to this email.
          </p>
        </div>
      </div>
    </div>
  `;
}

// Send application confirmation to candidate
export async function sendApplicationConfirmation(
  data: ApplicationConfirmationEmail
): Promise<{ success: boolean; error?: string }> {
  const subject = `Application Received - ${data.jobTitle}`.replace(/[\r\n]+/g, " ");
  const companyName = data.companyName || "Oceanblue Solutions, Inc.";

  const h = escapeFields(data);

  const htmlBody = `
    ${getEmailHeader()}
    <h2 style="color: #1e293b; margin: 0 0 20px; font-size: 20px; font-weight: 600;">
      Thank You for Your Application
    </h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      Dear ${h.candidateName},
    </p>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      Thank you for applying to the <strong>${h.jobTitle}</strong> position at ${escapeHtml(companyName)}.
      We have received your application and our team will review it carefully.
    </p>
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #1e293b; margin: 0 0 15px; font-size: 16px; font-weight: 600;">
        Position Details
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Position:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.jobTitle}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Department:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.jobDepartment}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Location:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.jobLocation}</td>
        </tr>
      </table>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      <strong>What happens next?</strong>
    </p>
    <ul style="color: #475569; line-height: 1.8; margin: 0 0 20px; padding-left: 20px;">
      <li>Our recruiting team will review your application</li>
      <li>If your qualifications match our requirements, we will contact you for an interview</li>
      <li>You can expect to hear from us within 5-7 business days</li>
    </ul>
    <p style="color: #475569; line-height: 1.6; margin: 0;">
      Best regards,<br>
      <strong>The Recruiting Team</strong><br>
      ${escapeHtml(companyName)}
    </p>
    ${getEmailFooter()}
  `;

  const textBody = `
Thank You for Your Application

Dear ${data.candidateName},

Thank you for applying to the ${data.jobTitle} position at ${companyName}. We have received your application and our team will review it carefully.

Position Details:
- Position: ${data.jobTitle}
- Department: ${data.jobDepartment}
- Location: ${data.jobLocation}

What happens next?
- Our recruiting team will review your application
- If your qualifications match our requirements, we will contact you for an interview
- You can expect to hear from us within 5-7 business days

Best regards,
The Recruiting Team
${companyName}
  `;

  return sendEmail(data.candidateEmail, subject, htmlBody, textBody);
}

// Send notification to recruiter about new application
export async function sendNewApplicationNotification(
  data: NewApplicationNotificationEmail
): Promise<{ success: boolean; error?: string }> {
  const subject = `New Application - ${data.jobTitle}`.replace(/[\r\n]+/g, " ");
  const appliedDate = new Date(data.appliedAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const h = escapeFields(data);

  const htmlBody = `
    ${getEmailHeader()}
    <h2 style="color: #1e293b; margin: 0 0 20px; font-size: 20px; font-weight: 600;">
      New Application Received
    </h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      Hi ${h.recruiterName},
    </p>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      A new candidate has applied for the <strong>${h.jobTitle}</strong> position that you posted.
    </p>
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #1e293b; margin: 0 0 15px; font-size: 16px; font-weight: 600;">
        Candidate Information
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Name:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.candidateName}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Email:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">
            <a href="mailto:${h.candidateEmail}" style="color: #2563eb; text-decoration: none;">${h.candidateEmail}</a>
          </td>
        </tr>
        ${h.candidatePhone ? `
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Phone:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.candidatePhone}</td>
        </tr>
        ` : ""}
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Applied:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${appliedDate}</td>
        </tr>
      </table>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://oceanbluecorp.com"}/portal/applications"
         style="display: inline-block; background: linear-gradient(135 135deg, #2563eb 0%, #0891b2 100%); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        View Application
      </a>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0;">
      Best regards,<br>
      <strong>Oceanblue Recruiting System</strong>
    </p>
    ${getEmailFooter()}
  `;

  const textBody = `
New Application Received

Hi ${data.recruiterName},

A new candidate has applied for the ${data.jobTitle} position that you posted.

Candidate Information:
- Name: ${data.candidateName}
- Email: ${data.candidateEmail}
${data.candidatePhone ? `- Phone: ${data.candidatePhone}` : ""}
- Applied: ${appliedDate}

View the application at: ${process.env.NEXT_PUBLIC_APP_URL || "https://oceanbluecorp.com"}/portal/applications

Best regards,
Oceanblue Recruiting System
  `;

  return sendEmail(data.recruiterEmail, subject, htmlBody, textBody);
}

// Send notification about new job posting to HR/Admin
export async function sendJobPostedNotification(
  data: JobPostedNotificationEmail
): Promise<{ success: boolean; error?: string }> {
  const subject = `New Job Posted - ${data.jobTitle}${data.postingId ? ` (${data.postingId})` : ""}`;

  // Format submission due date if present
  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
  };

  const dueDate = formatDueDate(data.submissionDueDate);

  const h = escapeFields(data);

  const htmlBody = `
    ${getEmailHeader()}
    <h2 style="color: #1e293b; margin: 0 0 20px; font-size: 20px; font-weight: 600;">
      New Job Posting Published
    </h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      Hi ${h.recipientName},
    </p>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      A new job has been posted by <strong>${h.postedByName}</strong>. Please review the complete details below:
    </p>

    <!-- Basic Job Information -->
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #2563eb;">
      <h3 style="color: #1e293b; margin: 0 0 15px; font-size: 16px; font-weight: 600;">
        Basic Information
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${h.postingId ? `
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px; width: 35%;">Job ID:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.postingId}</td>
        </tr>
        ` : ""}
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px; width: 35%;">Position:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.jobTitle}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Department:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.jobDepartment}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Location:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.jobLocation}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Job Type:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500; text-transform: capitalize;">${h.jobType.replace(/-/g, " ")}</td>
        </tr>
        ${h.clientName ? `
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Client:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.clientName}</td>
        </tr>
        ` : ""}
        ${h.vendorName ? `
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Vendor:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.vendorName}</td>
        </tr>
        ` : ""}
        ${dueDate ? `
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Submission Due:</td>
          <td style="color: #ef4444; padding: 8px 0; font-size: 14px; font-weight: 600;">${dueDate}</td>
        </tr>
        ` : ""}
      </table>
    </div>

    <!-- Compensation Details -->
    ${h.salary || h.payRate || h.clientBillRate ? `
    <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #10b981;">
      <h3 style="color: #1e293b; margin: 0 0 15px; font-size: 16px; font-weight: 600;">
        Compensation Details
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${h.salary ? `
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px; width: 35%;">Salary Range:</td>
          <td style="color: #059669; padding: 8px 0; font-size: 14px; font-weight: 600;">$${h.salary.min.toLocaleString()} - $${h.salary.max.toLocaleString()} ${h.salary.currency || "USD"}</td>
        </tr>
        ` : ""}
        ${h.payRate ? `
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Pay Rate:</td>
          <td style="color: #059669; padding: 8px 0; font-size: 14px; font-weight: 600;">$${h.payRate}/hour</td>
        </tr>
        ` : ""}
        ${h.clientBillRate ? `
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Client Bill Rate:</td>
          <td style="color: #059669; padding: 8px 0; font-size: 14px; font-weight: 600;">$${h.clientBillRate}/hour</td>
        </tr>
        ` : ""}
      </table>
    </div>
    ` : ""}

    <!-- Job Description -->
    ${h.description ? `
    <div style="margin: 25px 0;">
      <h3 style="color: #1e293b; margin: 0 0 12px; font-size: 16px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
        Job Description
      </h3>
      <div style="color: #475569; line-height: 1.8; margin: 0; font-size: 14px;">${renderRichText(data.description).__html}</div>
    </div>
    ` : ""}

    <!-- Key Responsibilities -->
    ${richTextToPlain(data.responsibilities) ? `
    <div style="margin: 25px 0;">
      <h3 style="color: #1e293b; margin: 0 0 12px; font-size: 16px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
        Key Responsibilities
      </h3>
      <div style="color: #475569; line-height: 1.8; margin: 8px 0; font-size: 14px;">${renderListField(data.responsibilities).__html}</div>
    </div>
    ` : ""}

    <!-- Requirements & Qualifications -->
    ${richTextToPlain(data.requirements) ? `
    <div style="margin: 25px 0;">
      <h3 style="color: #1e293b; margin: 0 0 12px; font-size: 16px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
        Requirements & Qualifications
      </h3>
      <div style="color: #475569; line-height: 1.8; margin: 8px 0; font-size: 14px;">${renderListField(data.requirements).__html}</div>
    </div>
    ` : ""}

    <!-- Action Buttons -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://oceanbluecorp.com"}/portal/jobs/${h.jobId}"
         style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #0891b2 100%); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 8px;">
        View in Admin Panel
      </a>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://oceanbluecorp.com"}/careers/${h.jobId}"
         style="display: inline-block; background: #f1f5f9; color: #475569; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 8px; border: 1px solid #cbd5e1;">
        View Public Posting
      </a>
    </div>

    <p style="color: #64748b; line-height: 1.6; margin: 20px 0 0; font-size: 13px; text-align: center;">
      Posted by <strong>${h.postedByName}</strong>
    </p>
    ${getEmailFooter()}
  `;

  const textBody = `
New Job Posting Published

Hi ${data.recipientName},

A new job has been posted by ${data.postedByName}. Please review the complete details below:

=== BASIC INFORMATION ===
${data.postingId ? `Job ID: ${data.postingId}` : ""}
Position: ${data.jobTitle}
Department: ${data.jobDepartment}
Location: ${data.jobLocation}
Job Type: ${data.jobType}
${data.clientName ? `Client: ${data.clientName}` : ""}
${data.vendorName ? `Vendor: ${data.vendorName}` : ""}
${dueDate ? `Submission Due: ${dueDate}` : ""}

${data.salary || data.payRate || data.clientBillRate ? `
=== COMPENSATION DETAILS ===
${data.salary ? `Salary Range: $${data.salary.min.toLocaleString()} - $${data.salary.max.toLocaleString()} ${data.salary.currency || "USD"}` : ""}
${data.payRate ? `Pay Rate: $${data.payRate}/hour` : ""}
${data.clientBillRate ? `Client Bill Rate: $${data.clientBillRate}/hour` : ""}
` : ""}

${data.description ? `
=== JOB DESCRIPTION ===
${richTextToPlain(data.description)}
` : ""}

${richTextToPlain(data.responsibilities) ? `
=== KEY RESPONSIBILITIES ===
${richTextToPlain(data.responsibilities)}
` : ""}

${richTextToPlain(data.requirements) ? `
=== REQUIREMENTS & QUALIFICATIONS ===
${richTextToPlain(data.requirements)}
` : ""}

View in Admin Panel: ${process.env.NEXT_PUBLIC_APP_URL || "https://oceanbluecorp.com"}/portal/jobs/${data.jobId}
View Public Posting: ${process.env.NEXT_PUBLIC_APP_URL || "https://oceanbluecorp.com"}/careers/${data.jobId}
  `;

  return sendEmail(data.recipientEmail, subject, htmlBody, textBody);
}

// Send notification about job posting update to manager/assignees
export async function sendJobUpdatedNotification(
  data: JobUpdatedNotificationEmail
): Promise<{ success: boolean; error?: string }> {
  const subject = `Job Updated - ${data.jobTitle}${data.postingId ? ` (${data.postingId})` : ""}`;

  const changesHtml = data.changes.length > 0
    ? `<ul style="color: #475569; line-height: 1.8; margin: 0 0 20px; padding-left: 20px;">
        ${data.changes.map(change => `<li>${escapeHtml(change)}</li>`).join("")}
       </ul>`
    : `<p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">General updates were made to this job posting.</p>`;

  const h = escapeFields(data);

  const htmlBody = `
    ${getEmailHeader()}
    <h2 style="color: #1e293b; margin: 0 0 20px; font-size: 20px; font-weight: 600;">
      Job Posting Updated
    </h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      Hi ${h.recipientName},
    </p>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      The job posting <strong>${h.jobTitle}</strong>${h.postingId ? ` (${h.postingId})` : ""} has been updated by <strong>${h.updatedByName}</strong>.
    </p>
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #1e293b; margin: 0 0 15px; font-size: 16px; font-weight: 600;">
        Changes Made
      </h3>
      ${changesHtml}
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://oceanbluecorp.com"}/portal/jobs/${h.jobId}"
         style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #0891b2 100%); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        View Job Posting
      </a>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0;">
      Best regards,<br>
      <strong>Oceanblue Recruiting System</strong>
    </p>
    ${getEmailFooter()}
  `;

  const textBody = `
Job Posting Updated

Hi ${data.recipientName},

The job posting ${data.jobTitle}${data.postingId ? ` (${data.postingId})` : ""} has been updated by ${data.updatedByName}.

Changes Made:
${data.changes.length > 0 ? data.changes.map(c => `- ${c}`).join("\n") : "General updates were made to this job posting."}

View the job posting at: ${process.env.NEXT_PUBLIC_APP_URL || "https://oceanbluecorp.com"}/portal/jobs/${data.jobId}

Best regards,
Oceanblue Recruiting System
  `;

  return sendEmail(data.recipientEmail, subject, htmlBody, textBody);
}

// Send job update notifications to multiple recipients
export async function sendJobUpdatedNotifications(
  recipients: Array<{ name: string; email: string }>,
  jobData: {
    jobTitle: string;
    jobId: string;
    postingId?: string;
    updatedByName: string;
    changes: string[];
  }
): Promise<{ success: boolean; sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendJobUpdatedNotification({
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      ...jobData,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
      console.error(`Failed to send update notification to ${recipient.email}:`, result.error);
    }
  }

  return { success: failed === 0, sent, failed };
}

// Send interview invitation
export async function sendInterviewInvite(
  data: InterviewInviteEmail
): Promise<{ success: boolean; error?: string }> {
  const subject = `Interview Invitation - ${data.jobTitle}`.replace(/[\r\n]+/g, " ");

  const h = escapeFields(data);

  const htmlBody = `
    ${getEmailHeader()}
    <h2 style="color: #1e293b; margin: 0 0 20px; font-size: 20px; font-weight: 600;">
      Interview Invitation
    </h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      Dear ${h.candidateName},
    </p>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      We are pleased to invite you for an interview for the <strong>${h.jobTitle}</strong> position at Oceanblue Solutions, Inc.
    </p>
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #1e293b; margin: 0 0 15px; font-size: 16px; font-weight: 600;">
        Interview Details
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Date:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.interviewDate}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Time:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.interviewTime}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Type:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.interviewType}</td>
        </tr>
        ${h.interviewerName ? `
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Interviewer:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.interviewerName}</td>
        </tr>
        ` : ""}
        ${h.location ? `
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Location:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.location}</td>
        </tr>
        ` : ""}
        ${h.meetingLink ? `
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Meeting Link:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">
            <a href="${h.meetingLink}" style="color: #2563eb;">${h.meetingLink}</a>
          </td>
        </tr>
        ` : ""}
      </table>
    </div>
    ${h.notes ? `
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      <strong>Additional Notes:</strong><br>
      ${h.notes}
    </p>
    ` : ""}
    <p style="color: #475569; line-height: 1.6; margin: 0;">
      Please confirm your availability by replying to this email.<br><br>
      Best regards,<br>
      <strong>The Recruiting Team</strong><br>
      Oceanblue Solutions, Inc.
    </p>
    ${getEmailFooter()}
  `;

  const textBody = `
Interview Invitation

Dear ${data.candidateName},

We are pleased to invite you for an interview for the ${data.jobTitle} position at Oceanblue Solutions, Inc.

Interview Details:
- Date: ${data.interviewDate}
- Time: ${data.interviewTime}
- Type: ${data.interviewType}
${data.interviewerName ? `- Interviewer: ${data.interviewerName}` : ""}
${data.location ? `- Location: ${data.location}` : ""}
${data.meetingLink ? `- Meeting Link: ${data.meetingLink}` : ""}

${data.notes ? `Additional Notes: ${data.notes}` : ""}

Please confirm your availability by replying to this email.

Best regards,
The Recruiting Team
Oceanblue Solutions, Inc.
  `;

  return sendEmail(data.candidateEmail, subject, htmlBody, textBody);
}

// Send status update to candidate
export async function sendStatusUpdate(
  data: StatusUpdateEmail
): Promise<{ success: boolean; error?: string }> {
  const subject = `Application Update - ${data.jobTitle}`.replace(/[\r\n]+/g, " ");

  const statusMessages: Record<string, string> = {
    reviewing: "Your application is currently under review by our hiring team.",
    submitted: "Your application has been submitted to the hiring manager for further consideration.",
    interview: "Congratulations! You have been selected for an interview.",
    offered: "We are pleased to extend an offer for the position.",
    hired: "Congratulations! You have been selected for the position.",
    rejected: "After careful consideration, we have decided to move forward with other candidates.",
  };

  const message = data.message || statusMessages[data.newStatus] || "Your application status has been updated.";

  const h = escapeFields(data);

  const htmlBody = `
    ${getEmailHeader()}
    <h2 style="color: #1e293b; margin: 0 0 20px; font-size: 20px; font-weight: 600;">
      Application Status Update
    </h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      Dear ${h.candidateName},
    </p>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      We wanted to update you regarding your application for the <strong>${h.jobTitle}</strong> position.
    </p>
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <p style="color: #475569; line-height: 1.6; margin: 0;">
        ${escapeHtml(message)}
      </p>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0;">
      Thank you for your interest in Oceanblue Solutions, Inc.<br><br>
      Best regards,<br>
      <strong>The Recruiting Team</strong>
    </p>
    ${getEmailFooter()}
  `;

  const textBody = `
Application Status Update

Dear ${data.candidateName},

We wanted to update you regarding your application for the ${data.jobTitle} position.

${message}

Thank you for your interest in Oceanblue Solutions, Inc.

Best regards,
The Recruiting Team
  `;

  return sendEmail(data.candidateEmail, subject, htmlBody, textBody);
}

// Send custom email
export async function sendCustomEmail(
  data: CustomEmail
): Promise<{ success: boolean; error?: string }> {
  const h = escapeFields(data);
  const htmlBody = `
    ${getEmailHeader()}
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      Dear ${h.recipientName},
    </p>
    <div style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      ${h.body.replace(/\n/g, "<br>")}
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0;">
      Best regards,<br>
      <strong>Oceanblue Solutions, Inc.</strong>
    </p>
    ${getEmailFooter()}
  `;

  const textBody = `
Dear ${data.recipientName},

${data.body}

Best regards,
Oceanblue Solutions, Inc.
  `;

  return sendEmail(data.recipientEmail, data.subject, htmlBody, textBody);
}

/**
 * A recruiter's message to a candidate. The body is plain text, escaped into
 * the HTML; replies go to the recruiter, not the no-reply sender.
 */
export async function sendCandidateEmail(data: {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
  senderName?: string;
  ics?: string;
}): Promise<{ success: boolean; error?: string }> {
  const h = escapeFields(data);
  const htmlBody = `
    ${getEmailHeader()}
    <div style="color: #475569; line-height: 1.6; margin: 0; white-space: normal;">
      ${escapeHtml(data.body).replace(/\n/g, "<br>")}
    </div>
    ${getEmailFooter().replace("This is an automated message. Please do not reply directly to this email.", "Reply to this email to reach your recruiter.")}
  `;
  return sendEmail(data.to, data.subject.replace(/[\r\n]/g, " "), htmlBody, data.body, {
    replyTo: data.replyTo,
    fromName: data.senderName ? `${data.senderName} · Oceanblue` : undefined,
    ics: data.ics,
  });
}

// Send job posting notification to HR team
export async function sendJobPostingNotificationToHR(
  jobPosting: {
    title: string;
    postingId: string;
    clientName: string;
    location: string;
    payRate: number;
    description: string;
  },
  hrEmails: string[],
  excludedDepartments?: string[]
): Promise<{ success: boolean; sent: number; failed: number; error?: string }> {
  if (!hrEmails || hrEmails.length === 0) {
    return { success: true, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  const subject = `New Job Posting - ${jobPosting.title} (${jobPosting.postingId})`.replace(/[\r\n]+/g, " ");

  const excludedText = excludedDepartments && excludedDepartments.length > 0
    ? `<p style="color: #64748b; font-size: 12px; margin-top: 20px;">
        <strong>Note:</strong> This posting excludes the following departments: ${escapeHtml(excludedDepartments.join(", "))}
       </p>`
    : "";

  const h = escapeFields(jobPosting);

  const htmlBody = `
    ${getEmailHeader()}
    <h2 style="color: #1e293b; margin: 0 0 20px; font-size: 20px; font-weight: 600;">
      New Job Posting Available
    </h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      A new job posting has been created and requires your attention.
    </p>
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #1e293b; margin: 0 0 15px; font-size: 16px; font-weight: 600;">
        Job Details
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Job ID:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.postingId}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Title:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.title}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Client:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.clientName}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Location:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.location}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Pay Rate:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">$${h.payRate.toLocaleString()}</td>
        </tr>
      </table>
    </div>
    <div style="margin: 20px 0;">
      <h4 style="color: #1e293b; margin: 0 0 10px; font-size: 14px; font-weight: 600;">Description:</h4>
      <p style="color: #475569; line-height: 1.6; margin: 0; white-space: pre-wrap;">${h.description.slice(0, 500)}${h.description.length > 500 ? "..." : ""}</p>
    </div>
    ${excludedText}
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://oceanbluecorp.com"}/portal/jobs"
         style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #0891b2 100%); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        View Job Posting
      </a>
    </div>
    ${getEmailFooter()}
  `;

  const textBody = `
New Job Posting Available

A new job posting has been created and requires your attention.

Job Details:
- Job ID: ${jobPosting.postingId}
- Title: ${jobPosting.title}
- Client: ${jobPosting.clientName}
- Location: ${jobPosting.location}
- Pay Rate: $${jobPosting.payRate.toLocaleString()}

Description:
${jobPosting.description.slice(0, 500)}${jobPosting.description.length > 500 ? "..." : ""}

${excludedDepartments && excludedDepartments.length > 0 ? `Note: This posting excludes: ${escapeHtml(excludedDepartments.join(", "))}` : ""}

View the job posting at: ${process.env.NEXT_PUBLIC_APP_URL || "https://oceanbluecorp.com"}/portal/jobs
  `;

  for (const email of hrEmails) {
    const result = await sendEmail(email, subject, htmlBody, textBody);
    if (result.success) {
      sent++;
    } else {
      failed++;
      console.error(`Failed to send job notification to ${email}:`, result.error);
    }
  }

  return {
    success: failed === 0,
    sent,
    failed,
    error: failed > 0 ? `Failed to send to ${failed} recipient(s)` : undefined,
  };
}

// Send to multiple recipients
// Send contact submission notification to admin
export async function sendContactNotificationEmail(data: {
  adminEmail: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  jobTitle?: string;
  inquiryType: string;
  message: string;
  /** Deep-links the email to the enquiry instead of the inbox. */
  contactId?: string;
}): Promise<{ success: boolean; error?: string }> {
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://oceanbluecorp.com"}/portal/contacts${data.contactId ? `/${encodeURIComponent(data.contactId)}` : ""}`;
  const h = escapeFields(data);
  const htmlBody = `
    ${getEmailHeader()}
    <h2 style="color: #1e293b; margin: 0 0 20px; font-size: 20px; font-weight: 600;">
      New Contact Form Submission
    </h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      A new inquiry has been submitted via the Oceanblue Solutions, Inc. website.
    </p>
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #1e293b; margin: 0 0 15px; font-size: 16px; font-weight: 600;">Contact Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="color: #64748b; padding: 8px 0; font-size: 14px; width: 40%;">Name:</td><td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.firstName} ${h.lastName}</td></tr>
        <tr><td style="color: #64748b; padding: 8px 0; font-size: 14px;">Email:</td><td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.email}</td></tr>
        ${h.phone ? `<tr><td style="color: #64748b; padding: 8px 0; font-size: 14px;">Phone:</td><td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.phone}</td></tr>` : ""}
        <tr><td style="color: #64748b; padding: 8px 0; font-size: 14px;">Company:</td><td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.company}</td></tr>
        ${h.jobTitle ? `<tr><td style="color: #64748b; padding: 8px 0; font-size: 14px;">Job Title:</td><td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.jobTitle}</td></tr>` : ""}
        <tr><td style="color: #64748b; padding: 8px 0; font-size: 14px;">Inquiry Type:</td><td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${h.inquiryType}</td></tr>
      </table>
    </div>
    <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 4px; padding: 16px; margin: 20px 0;">
      <h4 style="color: #0369a1; margin: 0 0 8px; font-size: 14px; font-weight: 600;">Message</h4>
      <p style="color: #1e293b; margin: 0; line-height: 1.6; font-size: 14px;">${h.message.replace(/\n/g, "<br>")}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${adminUrl}"
         style="background-color: #0ea5e9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
        View in Admin Panel
      </a>
    </div>
    ${getEmailFooter()}
  `;

  const textBody = `New Contact Form Submission

Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}\n` : ""}Company: ${data.company}
${data.jobTitle ? `Job Title: ${data.jobTitle}\n` : ""}Inquiry Type: ${data.inquiryType}

Message:
${data.message}

View in Admin: ${adminUrl}`;

  return sendEmail(data.adminEmail, `New Contact: ${data.firstName} ${data.lastName} - ${data.inquiryType}`, htmlBody, textBody);
}

export async function sendJobPostedNotifications(
  recipients: Array<{ name: string; email: string }>,
  jobData: {
    jobTitle: string;
    jobDepartment: string;
    jobLocation: string;
    jobType: string;
    postedByName: string;
    jobId: string;
    postingId?: string;
    description?: string;
    requirements?: string[];
    responsibilities?: string[];
    salary?: {
      min: number;
      max: number;
      currency?: string;
    };
    payRate?: number;
    clientBillRate?: number;
    clientName?: string;
    vendorName?: string;
    submissionDueDate?: string;
  }
): Promise<{ success: boolean; sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendJobPostedNotification({
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      ...jobData,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
      console.error(`Failed to send to ${recipient.email}:`, result.error);
    }
  }

  return { success: failed === 0, sent, failed };
}
