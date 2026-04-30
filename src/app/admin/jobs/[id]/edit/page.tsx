"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth";
import { Job, Client, Vendor } from "@/lib/aws/dynamodb";
import {
  JobForm, JobFormData, jobToFormData, formDataToPayload,
} from "@/components/admin/forms/job-form";
import type { AssigneeUser } from "@/components/admin/forms/primitives";

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
        alert(err instanceof Error ? err.message : "Failed to load job");
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
      alert(err instanceof Error ? err.message : "Failed to update job");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
          <p className="text-gray-500 text-sm">Loading job…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {initialData && (
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
      )}
    </div>
  );
}
