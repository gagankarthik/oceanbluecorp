"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconWarning } from "@/components/admin/icons";
import { useAuth, UserRole } from "@/lib/auth";
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

  // Recruiters may view a requisition but not edit it — bounce them to the record.
  const isRecruiter = user?.role === UserRole.RECRUITER;

  useEffect(() => {
    if (user?.role === UserRole.RECRUITER) router.replace(`/admin/jobs/${id}`);
  }, [user, router, id]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [jobRes, clientsRes, vendorsRes, usersRes] = await Promise.all([
          fetch(`/api/jobs/${id}`),
          fetch("/api/clients?status=active"),
          fetch("/api/vendors"),
          fetch("/api/users"),
        ]);
        const [jobData, clientsData, vendorsData, usersData] = await Promise.all([
          jobRes.json(), clientsRes.json(), vendorsRes.json(), usersRes.json(),
        ]);
        if (!jobRes.ok) throw new Error(jobData.error || "Failed to fetch job");
        setJob(jobData.job);
        setInitialData(jobToFormData(jobData.job));
        setClients(clientsData.clients || []);
        setVendors(vendorsData.vendors || []);
        setHrUsers(
          (usersData.users || []).filter((u: AssigneeUser) =>
            ["hr", "admin", "recruiter", "sales"].includes(u.role),
          ),
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load job");
        router.push("/admin/jobs");
      } finally {
        setLoading(false);
      }
    };
    void fetchAll();
  }, [id, router]);

  const handleSubmit = async (data: JobFormData) => {
    setSubmitting(true);
    try {
      const payload = formDataToPayload(data);
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update job");
      router.push(`/admin/jobs/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update job");
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
    if (!res.ok) throw new Error(json.error || "Failed to create client");
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
          onSubmit={handleSubmit}
          onAddClient={handleAddClient}
        />
      ) : (
        <AdminCard className="px-6 py-12 text-center">
          <IconWarning className="mx-auto h-8 w-8 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
          <h2 className="mt-3 text-[15px] font-semibold text-[var(--adm-ink)]">Requisition unavailable</h2>
          <p className="mt-1 text-sm text-[var(--adm-ink-subtle)]">This job could not be loaded for editing.</p>
          <div className="mt-5">
            <WorkspaceButton onClick={() => router.push("/admin/jobs")}>
              Back to job postings
            </WorkspaceButton>
          </div>
        </AdminCard>
      )}
    </div>
  );
}
