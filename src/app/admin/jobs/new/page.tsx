"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/lib/auth";
import { Client, Vendor } from "@/lib/aws/dynamodb";
import {
  JobForm, JobFormData, DEFAULT_JOB_FORM, formDataToPayload,
} from "@/components/admin/forms/job-form";
import type { AssigneeUser } from "@/components/admin/forms/primitives";

export default function NewJobPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [hrUsers, setHrUsers] = useState<AssigneeUser[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === UserRole.RECRUITER) router.replace("/admin/jobs");
  }, [user, router]);

  useEffect(() => {
    Promise.all([
      fetch("/api/clients?status=active").then((r) => r.json()).then((d) => setClients(d.clients || [])),
      fetch("/api/vendors").then((r) => r.json()).then((d) => setVendors(d.vendors || [])),
      fetch("/api/users").then((r) => r.json()).then((d) => {
        setHrUsers(
          (d.users || []).filter((u: AssigneeUser) =>
            ["hr", "admin", "recruiter", "sales"].includes(u.role),
          ),
        );
      }),
    ]).catch(console.error);
  }, []);

  const handleSubmit = async (data: JobFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        ...formDataToPayload(data),
        postedByName: user?.name || user?.email?.split("@")[0] || "Admin",
        postedByEmail: user?.email || "",
        postedByRole: user?.role || "admin",
      };
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create job");
      router.push("/admin/jobs");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create job");
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

  return (
    <div className="max-w-5xl mx-auto">
      <JobForm
        mode="create"
        initialData={DEFAULT_JOB_FORM}
        clients={clients}
        vendors={vendors}
        hrUsers={hrUsers}
        submitting={submitting}
        onSubmit={handleSubmit}
        onAddClient={handleAddClient}
      />
    </div>
  );
}
