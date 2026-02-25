import * as nodemailer from "nodemailer";

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
  process.env.NEXT_AWS_SES_FROM_EMAIL || "noreply@oceanbluecorp.com";

// Create transporter
const createTransporter = () => {
  const config = getSmtpConfig();
  if (!config.auth.user || !config.auth.pass) {
    console.error("SMTP credentials not configured");
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
  textBody: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = createTransporter();
  if (!transporter) {
    return { success: false, error: "SMTP not configured" };
  }

  try {
    const result = await transporter.sendMail({
      from: `"Ocean Blue Careers" <${getDefaultSender()}>`,
      to,
      subject,
      text: textBody,
      html: htmlBody,
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

// Email Templates

function getEmailHeader(): string {
  return `
    <div style="background-color: #f8fafc; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #0891b2 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 600;">
            Ocean Blue Corporation
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
            Ocean Blue Corporation | Enterprise IT Solutions
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
  const subject = `Application Received - ${data.jobTitle}`;
  const companyName = data.companyName || "Ocean Blue Corporation";

  const htmlBody = `
    ${getEmailHeader()}
    <h2 style="color: #1e293b; margin: 0 0 20px; font-size: 20px; font-weight: 600;">
      Thank You for Your Application
    </h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      Dear ${data.candidateName},
    </p>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      Thank you for applying to the <strong>${data.jobTitle}</strong> position at ${companyName}.
      We have received your application and our team will review it carefully.
    </p>
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #1e293b; margin: 0 0 15px; font-size: 16px; font-weight: 600;">
        Position Details
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Position:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${data.jobTitle}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Department:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${data.jobDepartment}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Location:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${data.jobLocation}</td>
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
      ${companyName}
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
  const subject = `New Application - ${data.jobTitle}`;
  const appliedDate = new Date(data.appliedAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const htmlBody = `
    ${getEmailHeader()}
    <h2 style="color: #1e293b; margin: 0 0 20px; font-size: 20px; font-weight: 600;">
      New Application Received
    </h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      Hi ${data.recruiterName},
    </p>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      A new candidate has applied for the <strong>${data.jobTitle}</strong> position that you posted.
    </p>
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #1e293b; margin: 0 0 15px; font-size: 16px; font-weight: 600;">
        Candidate Information
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Name:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${data.candidateName}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Email:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">
            <a href="mailto:${data.candidateEmail}" style="color: #2563eb; text-decoration: none;">${data.candidateEmail}</a>
          </td>
        </tr>
        ${data.candidatePhone ? `
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Phone:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${data.candidatePhone}</td>
        </tr>
        ` : ""}
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Applied:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${appliedDate}</td>
        </tr>
      </table>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://oceanbluecorp.com"}/admin/applications"
         style="display: inline-block; background: linear-gradient(135 135deg, #2563eb 0%, #0891b2 100%); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        View Application
      </a>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0;">
      Best regards,<br>
      <strong>Ocean Blue Recruiting System</strong>
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

View the application at: ${process.env.NEXT_PUBLIC_APP_URL || "https://oceanbluecorp.com"}/admin/applications

Best regards,
Ocean Blue Recruiting System
  `;

  return sendEmail(data.recruiterEmail, subject, htmlBody, textBody);
}

// Send notification about new job posting to HR/Admin
export async function sendJobPostedNotification(
  data: JobPostedNotificationEmail
): Promise<{ success: boolean; error?: string }> {
  const subject = `New Job Posted - ${data.jobTitle}`;

  const htmlBody = `
    ${getEmailHeader()}
    <h2 style="color: #1e293b; margin: 0 0 20px; font-size: 20px; font-weight: 600;">
      New Job Posting Published
    </h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      Hi ${data.recipientName},
    </p>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      A new job has been posted by <strong>${data.postedByName}</strong>.
    </p>
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #1e293b; margin: 0 0 15px; font-size: 16px; font-weight: 600;">
        Job Details
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Position:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${data.jobTitle}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Department:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${data.jobDepartment}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Location:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${data.jobLocation}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Type:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${data.jobType}</td>
        </tr>
      </table>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://oceanbluecorp.com"}/careers/${data.jobId}"
         style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #0891b2 100%); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        View Job Posting
      </a>
    </div>
    ${getEmailFooter()}
  `;

  const textBody = `
New Job Posting Published

Hi ${data.recipientName},

A new job has been posted by ${data.postedByName}.

Job Details:
- Position: ${data.jobTitle}
- Department: ${data.jobDepartment}
- Location: ${data.jobLocation}
- Type: ${data.jobType}

View the job at: ${process.env.NEXT_PUBLIC_APP_URL || "https://oceanbluecorp.com"}/careers/${data.jobId}
  `;

  return sendEmail(data.recipientEmail, subject, htmlBody, textBody);
}

// Send interview invitation
export async function sendInterviewInvite(
  data: InterviewInviteEmail
): Promise<{ success: boolean; error?: string }> {
  const subject = `Interview Invitation - ${data.jobTitle}`;

  const htmlBody = `
    ${getEmailHeader()}
    <h2 style="color: #1e293b; margin: 0 0 20px; font-size: 20px; font-weight: 600;">
      Interview Invitation
    </h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      Dear ${data.candidateName},
    </p>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      We are pleased to invite you for an interview for the <strong>${data.jobTitle}</strong> position at Ocean Blue Corporation.
    </p>
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #1e293b; margin: 0 0 15px; font-size: 16px; font-weight: 600;">
        Interview Details
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Date:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${data.interviewDate}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Time:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${data.interviewTime}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Type:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${data.interviewType}</td>
        </tr>
        ${data.interviewerName ? `
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Interviewer:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${data.interviewerName}</td>
        </tr>
        ` : ""}
        ${data.location ? `
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Location:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${data.location}</td>
        </tr>
        ` : ""}
        ${data.meetingLink ? `
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Meeting Link:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">
            <a href="${data.meetingLink}" style="color: #2563eb;">${data.meetingLink}</a>
          </td>
        </tr>
        ` : ""}
      </table>
    </div>
    ${data.notes ? `
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      <strong>Additional Notes:</strong><br>
      ${data.notes}
    </p>
    ` : ""}
    <p style="color: #475569; line-height: 1.6; margin: 0;">
      Please confirm your availability by replying to this email.<br><br>
      Best regards,<br>
      <strong>The Recruiting Team</strong><br>
      Ocean Blue Corporation
    </p>
    ${getEmailFooter()}
  `;

  const textBody = `
Interview Invitation

Dear ${data.candidateName},

We are pleased to invite you for an interview for the ${data.jobTitle} position at Ocean Blue Corporation.

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
Ocean Blue Corporation
  `;

  return sendEmail(data.candidateEmail, subject, htmlBody, textBody);
}

// Send status update to candidate
export async function sendStatusUpdate(
  data: StatusUpdateEmail
): Promise<{ success: boolean; error?: string }> {
  const subject = `Application Update - ${data.jobTitle}`;

  const statusMessages: Record<string, string> = {
    reviewing: "Your application is currently under review by our hiring team.",
    interview: "Congratulations! You have been selected for an interview.",
    offered: "We are pleased to extend an offer for the position.",
    hired: "Congratulations! You have been selected for the position.",
    rejected: "After careful consideration, we have decided to move forward with other candidates.",
  };

  const message = data.message || statusMessages[data.newStatus] || "Your application status has been updated.";

  const htmlBody = `
    ${getEmailHeader()}
    <h2 style="color: #1e293b; margin: 0 0 20px; font-size: 20px; font-weight: 600;">
      Application Status Update
    </h2>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      Dear ${data.candidateName},
    </p>
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      We wanted to update you regarding your application for the <strong>${data.jobTitle}</strong> position.
    </p>
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <p style="color: #475569; line-height: 1.6; margin: 0;">
        ${message}
      </p>
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0;">
      Thank you for your interest in Ocean Blue Corporation.<br><br>
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

Thank you for your interest in Ocean Blue Corporation.

Best regards,
The Recruiting Team
  `;

  return sendEmail(data.candidateEmail, subject, htmlBody, textBody);
}

// Send custom email
export async function sendCustomEmail(
  data: CustomEmail
): Promise<{ success: boolean; error?: string }> {
  const htmlBody = `
    ${getEmailHeader()}
    <p style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      Dear ${data.recipientName},
    </p>
    <div style="color: #475569; line-height: 1.6; margin: 0 0 20px;">
      ${data.body.replace(/\n/g, "<br>")}
    </div>
    <p style="color: #475569; line-height: 1.6; margin: 0;">
      Best regards,<br>
      <strong>Ocean Blue Corporation</strong>
    </p>
    ${getEmailFooter()}
  `;

  const textBody = `
Dear ${data.recipientName},

${data.body}

Best regards,
Ocean Blue Corporation
  `;

  return sendEmail(data.recipientEmail, data.subject, htmlBody, textBody);
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

  const subject = `New Job Posting - ${jobPosting.title} (${jobPosting.postingId})`;

  const excludedText = excludedDepartments && excludedDepartments.length > 0
    ? `<p style="color: #64748b; font-size: 12px; margin-top: 20px;">
        <strong>Note:</strong> This posting excludes the following departments: ${excludedDepartments.join(", ")}
       </p>`
    : "";

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
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${jobPosting.postingId}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Title:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${jobPosting.title}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Client:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${jobPosting.clientName}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Location:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">${jobPosting.location}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Pay Rate:</td>
          <td style="color: #1e293b; padding: 8px 0; font-size: 14px; font-weight: 500;">$${jobPosting.payRate.toLocaleString()}</td>
        </tr>
      </table>
    </div>
    <div style="margin: 20px 0;">
      <h4 style="color: #1e293b; margin: 0 0 10px; font-size: 14px; font-weight: 600;">Description:</h4>
      <p style="color: #475569; line-height: 1.6; margin: 0; white-space: pre-wrap;">${jobPosting.description.slice(0, 500)}${jobPosting.description.length > 500 ? "..." : ""}</p>
    </div>
    ${excludedText}
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://oceanbluecorp.com"}/admin/jobs"
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

${excludedDepartments && excludedDepartments.length > 0 ? `Note: This posting excludes: ${excludedDepartments.join(", ")}` : ""}

View the job posting at: ${process.env.NEXT_PUBLIC_APP_URL || "https://oceanbluecorp.com"}/admin/jobs
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
export async function sendJobPostedNotifications(
  recipients: Array<{ name: string; email: string }>,
  jobData: {
    jobTitle: string;
    jobDepartment: string;
    jobLocation: string;
    jobType: string;
    postedByName: string;
    jobId: string;
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
