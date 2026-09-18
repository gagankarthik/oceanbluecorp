import { NextRequest, NextResponse, after } from "next/server";
import {
  getAllJobs, createJob, createNotification, getNextPostingId,
  toFeedJob, Job,
} from "@/lib/aws/dynamodb";
import { requireApiKey } from "@/lib/auth/api-key";
import { sanitizeRichText } from "@/lib/sanitize-server";
import { validate, validationMessage, type Schema } from "@/lib/validate";
import { v4 as uuidv4 } from "uuid";
import { serverError } from "@/lib/api-errors";
import { isPubliclyOpen } from "@/lib/job-status";

const JOB_TYPES = [
  "full-time", "part-time", "contract", "contract-to-hire",
  "direct-hire", "managed-teams", "remote",
] as const;

// Statuses a partner may file a posting under. Deliberately excludes the
// recruiting-only lifecycle states (paused, closed, on-hold): a partner
// integration opens work, it does not run the desk's pipeline.
const CREATABLE_STATUSES = ["draft", "active", "open"] as const;

/**
 * Fields POST /api/v1/jobs accepts, and nothing else (STANDARDS §5.3).
 *
 * The internal POST /api/jobs reads rates, client ids, recruitment manager and
 * assignees straight off the body. None of those may be settable by a partner
 * key, and declaring the shape is what guarantees it stays that way when
 * somebody adds a field to the internal route later.
 */
const CREATE_JOB_SCHEMA: Schema = {
  title:             { kind: "string", required: true, maxLength: 200 },
  department:        { kind: "string", required: true, maxLength: 120 },
  location:          { kind: "string", required: true, maxLength: 160 },
  state:             { kind: "string", maxLength: 40 },
  type:              { kind: "string", required: true, oneOf: JOB_TYPES },
  description:       { kind: "string", required: true, maxLength: 20000 },
  requirements:      { kind: "string", maxLength: 20000 },
  responsibilities:  { kind: "string", maxLength: 20000 },
  status:            { kind: "string", oneOf: CREATABLE_STATUSES },
  submissionDueDate: { kind: "string", maxLength: 40 },
};

type CreateJobBody = {
  title: string;
  department: string;
  location: string;
  state?: string;
  type: Job["type"];
  description: string;
  requirements?: string;
  responsibilities?: string;
  status?: (typeof CREATABLE_STATUSES)[number];
  submissionDueDate?: string;
};

// Salary is an object, so it sits outside the flat schema above and is checked
// by hand. Partial or non-numeric input is dropped rather than half-stored.
function readSalary(raw: unknown): Job["salary"] | undefined {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return undefined;
  const { min, max, currency } = raw as Record<string, unknown>;
  if (typeof min !== "number" || typeof max !== "number") return undefined;
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) return undefined;
  return { min, max, currency: typeof currency === "string" ? currency.slice(0, 8) : "USD" };
}

// GET /api/v1/jobs
export async function GET(request: NextRequest) {
  const auth = await requireApiKey(request, "jobs:read");
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as Job["status"] | null;
    const department = searchParams.get("department");
    const type = searchParams.get("type");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    // Default to active/open jobs only
    const filterStatus = (status === "active" || status === "open" || status === "paused" || status === "closed")
      ? status
      : undefined;

    const result = await getAllJobs(filterStatus);
    if (!result.success) {
      return serverError("v1/jobs GET list failed", result.error, "Couldn't load jobs. Please try again.");
    }

    let jobs = (result.data || [])
      .filter((j) => (filterStatus ? true : isPubliclyOpen(j.status)))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (department) jobs = jobs.filter((j) => j.department.toLowerCase() === department.toLowerCase());
    if (type) jobs = jobs.filter((j) => j.type === type);

    const total = jobs.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginated = jobs.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginated.map(toFeedJob),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    return serverError("v1/jobs GET error", error, "Couldn't load jobs. Please try again.");
  }
}

// POST /api/v1/jobs - file a posting from a partner platform. Needs jobs:write.
export async function POST(request: NextRequest) {
  const auth = await requireApiKey(request, "jobs:write");
  if (!auth.ok) return auth.response;

  try {
    const raw = await request.json().catch(() => null);
    const checked = validate<CreateJobBody>(raw, CREATE_JOB_SCHEMA);
    if (!checked.ok) {
      return NextResponse.json({ error: validationMessage(checked.errors) }, { status: 400 });
    }
    const body = checked.value;

    const salary = readSalary((raw as Record<string, unknown> | null)?.salary);

    // Best effort, same as the internal route: a posting without an OB-ID is
    // still a posting, and failing the request over the counter would lose it.
    const postingIdResult = await getNextPostingId();

    const job: Job = {
      id: uuidv4(),
      title: body.title,
      department: body.department,
      location: body.location,
      state: body.state,
      type: body.type,
      // Authored HTML is sanitized at save time (STANDARDS §5.6); renderRichText
      // trusts whatever is in the record, and this one arrives from outside.
      description: sanitizeRichText(body.description),
      requirements: body.requirements ? sanitizeRichText(body.requirements) : [],
      responsibilities: body.responsibilities ? sanitizeRichText(body.responsibilities) : [],
      salary,
      // Draft unless the partner asks otherwise: the default for a posting
      // arriving over an integration is that a human sees it before the public
      // careers page does.
      status: body.status || "draft",
      submissionDueDate: body.submissionDueDate,
      createdAt: new Date().toISOString(),
      // Attribution comes from the verified key, never from the body.
      createdBy: `apikey:${auth.key.id}`,
      postedByName: auth.key.name,
      applicationsCount: 0,
      postingId: postingIdResult.postingId,
    };

    const result = await createJob(job);
    if (!result.success) {
      return serverError("v1/jobs POST create failed", result.error, "Couldn't create the job. Please try again.");
    }

    // Tell the desk a posting arrived from outside. Deferred with `after` for
    // the reason the internal route documents: on Lambda an unawaited promise
    // can be frozen the moment the response returns.
    if (isPubliclyOpen(job.status)) {
      after(async () => {
        try {
          await createNotification({
            id: uuidv4(),
            type: "job_posted",
            title: "New Job Posted via API",
            message: `${job.title} in ${job.department} — ${job.location} (via ${auth.key.name})`,
            link: "/admin/jobs",
            relatedId: job.id,
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        } catch (err) {
          console.error("Failed to create v1 job notification:", err);
        }
      });
    }

    return NextResponse.json({ data: toFeedJob(job) }, { status: 201 });
  } catch (error) {
    return serverError("v1/jobs POST error", error, "Couldn't create the job. Please try again.");
  }
}
