import { NextRequest, NextResponse } from "next/server";
import { getAllJobs, createJob, Job } from "@/lib/aws/dynamodb";
import { v4 as uuidv4 } from "uuid";

// GET /api/jobs - Get all jobs (optionally filter by status)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as Job["status"] | null;

    console.log("API /api/jobs GET - fetching jobs with status:", status || "all");
    const result = await getAllJobs(status || undefined);

    if (!result.success) {
      console.error("API /api/jobs GET - failed:", result.error);
      return NextResponse.json(
        { error: result.error || "Failed to fetch jobs" },
        { status: 500 }
      );
    }

    // Sort by createdAt descending (newest first)
    const jobs = (result.data || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.log("API /api/jobs GET - success, count:", jobs.length);
    return NextResponse.json({ jobs });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("API /api/jobs GET - exception:", errorMessage, error);
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["title", "department", "location", "type", "description"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const job: Job = {
      id: uuidv4(),
      title: body.title,
      department: body.department,
      location: body.location,
      type: body.type,
      description: body.description,
      requirements: body.requirements || [],
      responsibilities: body.responsibilities || [],
      salary: body.salary,
      status: body.status || "draft",
      submissionDueDate: body.submissionDueDate,
      createdAt: new Date().toISOString(),
      createdBy: body.createdBy || "system",
      postedByName: body.postedByName,
      postedByEmail: body.postedByEmail,
      postedByRole: body.postedByRole,
      applicationsCount: 0,
      notifyHROnApplication: body.notifyHROnApplication || false,
      notifyAdminOnApplication: body.notifyAdminOnApplication || false,
    };

    const result = await createJob(job);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create job" },
        { status: 500 }
      );
    }

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
