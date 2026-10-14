"use client";

import { use, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth, canEditJobs, canSeeJobCommercials } from "@/lib/auth";
import type { Client, Job, Vendor } from "@/lib/aws/dynamodb";
import {
  JobForm, JobFormData, DEFAULT_JOB_FORM, duplicateFormData, formDataToPayload, createVendorFromForm, type AssigneeUser,
} from "@/components/portal/records/JobForm";
import { JobCreatedDialog } from "@/components/portal/records/JobCreatedDialog";
import { jobCategory, JOB_LIST_HREF as LIST_HREF } from "@/lib/job-status";
import { useNavSection } from "@/components/admin/admin-provider";
import { refreshJobs, useUserDirectory } from "@/hooks/use-console-data";
import { FormSkeleton } from "@/components/portal/kit";
import { useToast } from "@/components/portal/toast";

export default function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; from?: string }>;
}) {
  const params = use(searchParams);
  const category = jobCategory(params);
  // ?from=<id>: Duplicate seeds the form from that role.
  const fromId = params.from;
  useNavSection(LIST_HREF[category]);
  const { user } = useAuth();
  const router = useRouter();
  const notify = useToast();
  // Stable identity: JobForm re-seeds from initialData whenever it changes.
  // Bumped by "Create another" so the form re-seeds empty.
  const [formKey, setFormKey] = useState(0);
  const [source, setSource] = useState<Job | null>(null);
  const [loadingSource, setLoadingSource] = useState(!!fromId);
  const initialData = useMemo(() => (source ? duplicateFormData(source) : { ...DEFAULT_JOB_FORM, category }), [source, category]);
  const [created, setCreated] = useState<Job | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Recruiters cannot create requisitions, bounce them back to the list.
  const isRecruiter = !canEditJobs(user?.role);

  useEffect(() => {
    if (user?.role && !canEditJobs(user.role)) router.replace(LIST_HREF[category]);
  }, [user, router, category]);

  // Clients, vendors and staff back the commercial half of the form. Media renders
  // none of it and those routes answer it 403, so it does not ask.
  const canPrice = canSeeJobCommercials(user?.role);

  useEffect(() => {
    if (!canPrice) return;
    Promise.all([
      fetch("/api/clients?status=active").then((r) => r.json()).then((d) => setClients(d.clients || [])),
      fetch("/api/vendors").then((r) => r.json()).then((d) => setVendors(d.vendors || [])),
    ]).catch((err) => {
      console.error(err);
      notify("Couldn't load the client and vendor lists. Refresh to try again.", { tone: "error" });
    });
  }, [canPrice, notify]);

  const { users: directory, error: usersError } = useUserDirectory(canPrice);
  const hrUsers = useMemo(
    () => (directory || []).filter((u): u is AssigneeUser & { role: string } =>
      !!u.role && ["hr", "admin", "recruiter", "sales"].includes(u.role)),
    [directory],
  );
  useEffect(() => {
    if (usersError) notify("Couldn't load the assignee list. Refresh to try again.", { tone: "error" });
  }, [usersError, notify]);

  useEffect(() => {
    if (!fromId) return;
    let on = true;
    fetch(`/api/jobs/${encodeURIComponent(fromId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => on && d?.job && setSource(d.job))
      .catch(() => on && notify("Couldn't load the role to duplicate. Starting from a blank form.", { tone: "error" }))
      .finally(() => on && setLoadingSource(false));
    return () => {
      on = false;
    };
  }, [fromId, notify]);

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
      setCreated(json.job);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Couldn't create the job. Try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddClient = async (clientData: { name: string; websiteUrl: string; email: string; phone: string }): Promise<Client> => {
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

  // Hold the skeleton rather than flashing an editable form the redirect is about to take away.
  if (isRecruiter || loadingSource) return <FormSkeleton label="Loading job form" sections={3} />;

  return (
    <>
      <JobForm
        key={formKey}
        mode="create"
        initialData={initialData}
        clients={clients}
        vendors={vendors}
        hrUsers={hrUsers}
        submitting={submitting}
        serverError={serverError}
        onDismissError={() => setServerError(null)}
        notice={source ? <>Duplicated from <strong className="font-semibold">{source.title}</strong>. It saves as a new role; applicants and history stay with the original.</> : undefined}
        onSubmit={handleSubmit}
        onAddClient={handleAddClient}
        onAddVendor={async (vendorData) => {
          const vendor = await createVendorFromForm(vendorData);
          setVendors((prev) => [vendor, ...prev]);
          return vendor;
        }}
      />
      <JobCreatedDialog
        job={created}
        listHref={LIST_HREF[created?.category === "open" ? "open" : category]}
        onCreateAnother={() => {
          setCreated(null);
          // Another role starts blank, not as a second copy.
          setSource(null);
          setFormKey((k) => k + 1);
          window.scrollTo({ top: 0 });
        }}
      />
    </>
  );
}
