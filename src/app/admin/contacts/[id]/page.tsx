"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Contact } from "@/lib/aws/dynamodb";
import { fmtDateTime } from "@/lib/format";
import { usePageCrumb } from "@/components/admin/admin-provider";
import { AdminCard } from "@/components/admin/admin-card";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusBadge } from "@/components/admin/status-badge";
import { RecordFact, RecordHeader, WorkspaceButton } from "@/components/admin/workspace";
import { IconBuilding, IconCalendar, IconMail, IconMessage, IconPhone } from "@/components/admin/icons";
import { ContactDetail } from "@/components/admin/contacts/contact-detail";
import { CONTACT_STATUS_META, contactName, type ContactStatus } from "@/components/admin/contacts/contact-status";
import ContactLoading from "./loading";

const BACK = { label: "Contacts", href: "/admin/contacts" };

export default function ContactRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const patchStatus = useCallback(async (status: ContactStatus) => {
    const res = await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update status");
  }, [id]);

  const fetchContact = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const res = await fetch(`/api/contacts/${id}`);
      if (res.status === 404) { setNotFound(true); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load enquiry");
      const c: Contact = data.contact;
      // Opening an unread enquiry marks it read, as the old reading pane did.
      if (c.status === "new") {
        c.status = "read";
        patchStatus("read").catch(() => {});
      }
      setContact(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load enquiry");
    } finally {
      setLoading(false);
    }
  }, [id, patchStatus]);

  useEffect(() => { void fetchContact(); }, [fetchContact]);

  const name = contact ? contactName(contact) : "";
  usePageCrumb(name || null);

  const handleStatusChange = async (status: ContactStatus) => {
    if (!contact) return;
    const prev = contact.status;
    setContact({ ...contact, status });
    try {
      await patchStatus(status);
    } catch {
      setContact((c) => (c ? { ...c, status: prev } : c));
      toast.error("Failed to update contact status");
    }
  };

  const performDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete contact");
      toast.success("Contact deleted");
      router.replace("/admin/contacts");
    } catch {
      toast.error("Failed to delete contact");
      setDeleting(false);
    }
  };

  if (loading) return <ContactLoading />;

  if (notFound || error || !contact) {
    return (
      <div className="pb-10">
        <RecordHeader back={BACK} title="Enquiry" />
        <AdminCard>
          <EmptyState
            variant={notFound ? "fresh" : "error"}
            icon={notFound ? IconMessage : undefined}
            title={notFound ? "Enquiry not found" : "Could not load this enquiry"}
            description={notFound
              ? "It may have been deleted, or the link is out of date."
              : error ?? undefined}
            action={notFound ? (
              <WorkspaceButton asChild><Link href="/admin/contacts">Back to contacts</Link></WorkspaceButton>
            ) : (
              <WorkspaceButton variant="primary" onClick={fetchContact}>Retry</WorkspaceButton>
            )}
          />
        </AdminCard>
      </div>
    );
  }

  const meta = CONTACT_STATUS_META[contact.status];

  return (
    <div className="pb-10">
      <RecordHeader
        back={BACK}
        title={name}
        subtitle={contact.jobTitle || undefined}
        status={<StatusBadge status={contact.status} tone={meta?.tone} label={meta?.label} size="md" />}
        meta={
          <>
            <RecordFact icon={IconMail}>
              <a href={`mailto:${contact.email}`} className="transition-colors hover:text-[var(--adm-accent)]">{contact.email}</a>
            </RecordFact>
            {contact.phone && (
              <RecordFact icon={IconPhone}>
                <a href={`tel:${contact.phone}`} className="tabular-nums transition-colors hover:text-[var(--adm-accent)]">{contact.phone}</a>
              </RecordFact>
            )}
            {contact.company && <RecordFact icon={IconBuilding}>{contact.company}</RecordFact>}
            <RecordFact icon={IconCalendar}>
              <time dateTime={contact.createdAt} className="tabular-nums">{fmtDateTime(contact.createdAt)}</time>
            </RecordFact>
          </>
        }
      />

      <ContactDetail
        contact={contact}
        onStatusChange={handleStatusChange}
        onDelete={() => setPendingDelete(true)}
      />

      <ConfirmDialog
        open={pendingDelete}
        title="Delete contact?"
        body="This action cannot be undone."
        busy={deleting}
        onConfirm={performDelete}
        onCancel={() => setPendingDelete(false)}
      />
    </div>
  );
}
