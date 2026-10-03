"use client";

import { use, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth, canEditJobs, canSeeJobCommercials } from "@/lib/auth";
import type { Client, Vendor } from "@/lib/aws/dynamodb";
import {
  JobForm, JobFormData, DEFAULT_JOB_FORM, formDataToPayload, createVendorFromForm,
} from "@/components/admin/forms/job-form";
import type { AssigneeUser } from "@/components/admin/forms/primitives";
import { AdminFormSkeleton } from "@/components/admin/skeletons";
import { jobCategory, JOB_LIST_HREF as LIST_HREF } from "@/lib/job-status";
import { useNavSection } from "@/components/admin/admin-provider";
import { refreshJobs, useUserDirectory } from "@/hooks/use-console-data";

export default function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const category = jobCategory(use(searchParams));
  useNavSection(LIST_HREF[category]);
  const { user } = useAuth();
  const router = useRouter();
  // Stable identity: JobForm re-seeds from initialData whenever it changes, so a
  // new object per render wiped the form each time a client or vendor was added.
  const initialData = useMemo(() => ({ ...DEFAULT_JOB_FORM, category }), [category]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Recruiters cannot create requisitions, bounce them back to the list.
  const isRecruiter = !canEditJobs(user?.role);

  useEffect(() => {
    if (user?.role && !canEditJobs(user.role)) router.replace(LIST_HREF[category]);
  }, [user, router, category]);

  // Clients, vendors and the staff list are the reference data behind the
  // commercial half of the form. Media does not render those panels and the
  // three routes rightly answer it 403, so it does not ask: fetching them
  // would buy three failed requests and a toast about data it cannot use.
  const canPrice = canSeeJobCommercials(user?.role);

  useEffect(() => {
    if (!canPrice) return;
    Promise.all([
      fetch("/api/clients?status=active").then((r) => r.json()).then((d) => setClients(d.clients || [])),
      fetch("/api/vendors").then((r) => r.json()).then((d) => setVendors(d.vendors || [])),
    ]).catch((err) => {
      console.error(err);
      toast.error("Couldn't load the client and vendor lists. Refresh to try again.");
    });
  }, [canPrice]);

  const { users: directory, error: usersError } = useUserDirectory(canPrice);
  const hrUsers = useMemo(
    () => (directory || []).filter((u): u is AssigneeUser =>
      !!u.role && ["hr", "admin", "recruiter", "sales"].includes(u.role)),
    [directory],
  );
  useEffect(() => {
    if (usersError) toast.error("Couldn't load the assignee list. Refresh to try again.");
  }, [usersError]);

  const handleSubmit = async (data: JobFormData) => {
    if (submitting) return;
    setSubmitting(true);
    setServerError(null);
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
      if (!res.ok) throw new Error(json.error || "Couldn't create the job. Try again.");
      void refreshJobs();
      router.push(LIST_HREF[data.category]);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Couldn't create the job. Try again.");
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
    if (!res.ok) throw new Error(json.error || "Couldn't add the client. Try again.");
    setClients((prev) => [json.client, ...prev]);
    return json.client;
  };

  // Hold the skeleton rather than flashing an editable form the redirect is
  // about to take away.
  if (isRecruiter) return <AdminFormSkeleton label="Loading job form" />;

  return (
    <div className="pb-10">
      <JobForm
        mode="create"
        initialData={initialData}
        clients={clients}
        vendors={vendors}
        hrUsers={hrUsers}
        submitting={submitting}
        serverError={serverError}
        onDismissError={() => setServerError(null)}
        onSubmit={handleSubmit}
        onAddClient={handleAddClient}
        onAddVendor={async (vendorData) => {
          const vendor = await createVendorFromForm(vendorData);
          setVendors((prev) => [vendor, ...prev]);
          return vendor;
        }}
      />
    </div>
  );
}
