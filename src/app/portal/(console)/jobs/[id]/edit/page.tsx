"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth, canEditJobs, canSeeJobCommercials } from "@/lib/auth";
import type { Job, Client, Vendor } from "@/lib/aws/dynamodb";
import {
  JobForm, JobFormData, jobToFormData, formDataToPayload, createVendorFromForm, clearJobDraft, jobDraftKey,
} from "@/components/portal/records/JobForm";
import { refreshJobs } from "@/hooks/use-console-data";
import type { AssigneeUser } from "@/components/portal/records/JobForm";
import { EmptyState, ErrorState, FormSkeleton, Page, PageHeader } from "@/components/portal/kit";
import { useNavSection } from "@/components/portal/console/provider";
import { jobCategory, JOB_LIST_HREF, JOB_LIST_LABEL } from "@/lib/job-status";
import { scrollPageTop } from "@/components/portal/chrome";

export default function EditJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { id } = use(params);
  const hint = use(searchParams);
  const router = useRouter();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  // The link's hint until the record loads, then the record itself.
  useNavSection(JOB_LIST_HREF[jobCategory(job ?? hint)]);
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
    if (user?.role && !canEditJobs(user.role)) router.replace(`/portal/jobs/${id}`);
  }, [user, router, id]);

  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setLoadFailed(false);
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
  }, [id, router, canPrice, attempt]);

  const handleSubmit = async (data: JobFormData) => {
    if (submitting) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const payload = formDataToPayload(data, { canPrice });
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Your changes could not be saved. Try again in a moment.");
      clearJobDraft(draftKey);
      void refreshJobs();
      router.push(`/portal/jobs/${id}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Your changes could not be saved. Try again in a moment.");
      scrollPageTop(true);
    } finally {
      setSubmitting(false);
    }
  };

  const draftKey = user?.id ? jobDraftKey(user.id, `edit.${id}`) : undefined;

  // Draft records save in place as you type; the form never calls this for a live or open role.
  const handleAutosave = async (data: JobFormData) => {
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formDataToPayload(data, { canPrice }), status: "draft" }),
    });
    if (!res.ok) throw new Error("Autosave failed");
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

  // Hold the skeleton rather than flashing an editable form the redirect is about to take away.
  if (loading || isRecruiter) return <FormSkeleton label="Loading job form" sections={3} />;

  if (!initialData) {
    // The record's own list once known, else the link's hint: never a fixed "state roles".
    const category = jobCategory(job ?? hint);
    return (
      <Page>
        <PageHeader back={{ href: JOB_LIST_HREF[category], label: JOB_LIST_LABEL[category] }} title="Edit role" />
        {loadFailed ? (
          <ErrorState title="Couldn't load this job posting" message="Check your connection and try again." onRetry={() => setAttempt((n) => n + 1)} />
        ) : (
          <EmptyState
            framed
            icon="search"
            title="This job posting doesn't exist"
            body="It may have been deleted, or the link is out of date."
            primary={{ label: `Go to ${JOB_LIST_LABEL[category].toLowerCase()}`, href: JOB_LIST_HREF[category] }}
          />
        )}
      </Page>
    );
  }

  return (
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
      draftKey={draftKey}
      onAutosave={handleAutosave}
      onAddClient={handleAddClient}
      onAddVendor={async (vendorData) => {
        const vendor = await createVendorFromForm(vendorData);
        setVendors((prev) => [vendor, ...prev]);
        return vendor;
      }}
    />
  );
}
