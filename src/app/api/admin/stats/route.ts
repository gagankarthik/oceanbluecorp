import { NextRequest, NextResponse } from "next/server";
import { getAllJobs, getAllApplications } from "@/lib/aws/dynamodb";
import { requireStaff } from "@/lib/auth/verify";

// GET /api/admin/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    // Fetch all data in parallel
    const [jobsResult, applicationsResult] = await Promise.all([
      getAllJobs(),
      getAllApplications(),
    ]);

    if (!jobsResult.success || !applicationsResult.success) {
      return NextResponse.json(
        { error: "Failed to fetch statistics" },
        { status: 500 }
      );
    }

    const jobs = jobsResult.data || [];
    const applications = applicationsResult.data || [];

    // Calculate stats
    const stats = {
      // Job stats
      totalJobs: jobs.length,
      activeJobs: jobs.filter((j) => j.status === "active").length,
      pausedJobs: jobs.filter((j) => j.status === "paused").length,
      draftJobs: jobs.filter((j) => j.status === "draft").length,
      closedJobs: jobs.filter((j) => j.status === "closed").length,

      // Application stats
      totalApplications: applications.length,
      pendingApplications: applications.filter((a) => a.status === "pending").length,
      reviewingApplications: applications.filter((a) => a.status === "reviewing").length,
      submittedApplications: applications.filter((a) => a.status === "submitted").length,
      interviewApplications: applications.filter((a) => a.status === "interview").length,
      offeredApplications: applications.filter((a) => a.status === "offered").length,
      hiredApplications: applications.filter((a) => a.status === "hired").length,
      rejectedApplications: applications.filter((a) => a.status === "rejected").length,

      // Recent items (last 5)
      recentApplications: applications
        .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
        .slice(0, 5)
        .map((app) => ({
          id: app.id,
          name: app.name,
          email: app.email,
          position: jobs.find((j) => j.id === app.jobId)?.title || "Unknown Position",
          status: app.status,
          appliedAt: app.appliedAt,
        })),

      recentJobs: jobs
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((job) => ({
          id: job.id,
          title: job.title,
          department: job.department,
          location: job.location,
          applicants: job.applicationsCount || 0,
          status: job.status,
        })),

      // Applications by status for charts
      applicationsByStatus: {
        pending: applications.filter((a) => a.status === "pending").length,
        reviewing: applications.filter((a) => a.status === "reviewing").length,
        submitted: applications.filter((a) => a.status === "submitted").length,
        interview: applications.filter((a) => a.status === "interview").length,
        offered: applications.filter((a) => a.status === "offered").length,
        hired: applications.filter((a) => a.status === "hired").length,
        rejected: applications.filter((a) => a.status === "rejected").length,
      },

      // Jobs by department
      jobsByDepartment: jobs.reduce((acc, job) => {
        acc[job.department] = (acc[job.department] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),

      // Monthly applications trend (last 6 months)
      monthlyApplications: (() => {
        const now = new Date();
        return Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
          const nextMonth = new Date(now.getFullYear(), now.getMonth() - 5 + i + 1, 1);
          const count = applications.filter((a) => {
            const appDate = new Date(a.appliedAt);
            return appDate >= d && appDate < nextMonth;
          }).length;
          return {
            month: d.toLocaleString("en-US", { month: "short" }) + " '" + String(d.getFullYear()).slice(2),
            applications: count,
          };
        });
      })(),
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
