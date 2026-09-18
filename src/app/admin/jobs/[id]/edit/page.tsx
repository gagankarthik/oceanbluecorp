"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { useAuth, canEditJobs, canSeeJobCommercials } from "@/lib/auth";
import type { Job, Client, Vendor } from "@/lib/aws/dynamodb";
import {
  JobForm, JobFormData, jobToFormData, formDataToPayload,
} from "@/components/admin/forms/job-form";
import type { AssigneeUser } from "@/components/admin/forms/primitives";
import { AdminCard } from "@/components/admin/admin-card";
import { WorkspaceButton } from "@/components/admin/workspace";
import { AdminFormSkeleton } from "@/components/admin/skeletons";

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [initialData, setInitialData] = useState<JobFormData | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [hrUsers, setHrUsers] = useState<AssigneeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Recruiters may view a requisition but not edit it, bounce them to the record.
  const isRecruiter = !canEditJobs(user?.role);
  // Media edits the posting's copy and never its commercials, so the three
  // reference lists behind those panels are not fetched for it — all three
  // routes answer a media account 403, and it renders none of the fields.
  const canPrice = canSeeJobCommercials(user?.role);

  useEffect(() => {
    if (user?.role && !canEditJobs(user.role)) router.replace(`/admin/jobs/${id}`);
  }, [user, router, id]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const jobRes = await fetch(`/api/jobs/${id}`);
        // No initialData renders the not-found state below.
        if (jobRes.status === 404) return;
        const jobData = await jobRes.json();
        if (!jobRes.ok) throw new Error(jobData.error || `HTTP ${jobRes.status}`);
        setJob(jobData.job);
        setInitialData(jobToFormData(jobData.job));

        if (canPrice) {
          const [clientsRes, vendorsRes, usersRes] = await Promise.all([
            fetch("/api/clients?status=active"),
            fetch("/api/vendors"),
            fetch("/api/users"),
          ]);
          const [clientsData, vendorsData, usersData] = await Promise.all([
            clientsRes.json(), vendorsRes.json(), usersRes.json(),
          ]);
          setClients(clientsData.clients || []);
          setVendors(vendorsData.vendors || []);
          setHrUsers(
            (usersData.users || []).filter((u: AssigneeUser) =>
              ["hr", "admin", "recruiter", "sales"].includes(u.role),
            ),
          );
        }
      } catch (err) {
        console.error("Failed to load job for editing:", err);
        setLoadFailed(true);
      } finally {
        setLoading(false);
      }
    };
    void fetchAll();
  }, [id, router, canPrice]);

  const handleSubmit = async (data: JobFormData) => {
    if (submitting) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const payload = formDataToPayload(data);
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Your changes could not be saved. Try again in a moment.");
      router.push(`/admin/jobs/${id}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Your changes could not be saved. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddClient = async (clientData: {
    name: string; websiteUrl: string; email: string; phone: string;
  }): Promise<Client> => {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...clientData, status: "active" }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "The client could not be added. Try again in a moment.");
    setClients((prev) => [json.client, ...prev]);
    return json.client;
  };

  // Hold the skeleton rather than flashing an editable form the redirect is
  // about to take away.
  if (loading || isRecruiter) return <AdminFormSkeleton />;

  return (
    <div className="pb-10">
      {initialData ? (
        <JobForm
          mode="edit"
          initialData={initialData}
          job={job}
          clients={clients}
          vendors={vendors}
          hrUsers={hrUsers}
          submitting={submitting}
          serverError={serverError}
          onDismissError={() => setServerError(null)}
          onSubmit={handleSubmit}
          onAddClient={handleAddClient}
        />
      ) : (
        <AdminCard>
          <EmptyState
            variant={loadFailed ? "error" : "fresh"}
            icon={loadFailed ? undefined : SearchX}
            title={loadFailed ? "Couldn't load this job posting" : "This job posting doesn't exist"}
            description={
              loadFailed
                ? "Check your connection and try again."
                : "It may have been deleted, or the link is out of date."
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {loadFailed && (
                  <WorkspaceButton variant="primary" onClick={() => window.location.reload()}>Try again</WorkspaceButton>
                )}
                <WorkspaceButton onClick={() => router.push("/admin/jobs")}>
                  Back to job postings
                </WorkspaceButton>
              </div>
            }
          />
        </AdminCard>
      )}
    </div>
  );
}
