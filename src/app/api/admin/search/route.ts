import { NextRequest, NextResponse } from "next/server";
import {
  getAllJobs,
  getAllApplications,
  getAllContacts,
  Job,
  Application,
  Contact,
} from "@/lib/aws/dynamodb";
import { requireStaff } from "@/lib/auth/verify";

interface SearchResult {
  type: "job" | "application" | "contact";
  id: string;
  title: string;
  subtitle: string;
  link: string;
  status?: string;
}

// GET /api/admin/search - Search across all admin data
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.toLowerCase().trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Fetch all data in parallel
    const [jobsResult, applicationsResult, contactsResult] = await Promise.all([
      getAllJobs(),
      getAllApplications(),
      getAllContacts(),
    ]);

    const results: SearchResult[] = [];

    // Search jobs
    if (jobsResult.success && jobsResult.data) {
      const matchingJobs = jobsResult.data.filter((job: Job) =>
        job.title.toLowerCase().includes(query) ||
        job.department.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query)
      );

      matchingJobs.slice(0, 5).forEach((job: Job) => {
        results.push({
          type: "job",
          id: job.id,
          title: job.title,
          subtitle: `${job.department} - ${job.location}`,
          link: `/admin/jobs/${job.id}`,
          status: job.status,
        });
      });
    }

    // Search applications
    if (applicationsResult.success && applicationsResult.data) {
      const matchingApps = applicationsResult.data.filter((app: Application) =>
        app.name.toLowerCase().includes(query) ||
        app.email.toLowerCase().includes(query) ||
        (app.phone?.toLowerCase().includes(query) || false) ||
        (app.skills?.some(skill => skill.toLowerCase().includes(query)) || false)
      );

      matchingApps.slice(0, 5).forEach((app: Application) => {
        results.push({
          type: "application",
          id: app.id,
          title: app.name,
          subtitle: app.email,
          link: `/admin/applications?search=${encodeURIComponent(app.name)}`,
          status: app.status,
        });
      });
    }

    // Search contacts
    if (contactsResult.success && contactsResult.data) {
      const matchingContacts = contactsResult.data.filter((contact: Contact) =>
        contact.firstName.toLowerCase().includes(query) ||
        contact.lastName.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.company.toLowerCase().includes(query) ||
        contact.message.toLowerCase().includes(query)
      );

      matchingContacts.slice(0, 5).forEach((contact: Contact) => {
        results.push({
          type: "contact",
          id: contact.id,
          title: `${contact.firstName} ${contact.lastName}`,
          subtitle: `${contact.company} - ${contact.inquiryType}`,
          link: `/admin/contacts?search=${encodeURIComponent(contact.firstName + " " + contact.lastName)}`,
          status: contact.status,
        });
      });
    }

    // Sort by relevance (exact matches first)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().startsWith(query) ? 0 : 1;
      const bExact = b.title.toLowerCase().startsWith(query) ? 0 : 1;
      return aExact - bExact;
    });

    return NextResponse.json({ results: results.slice(0, 10) });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
