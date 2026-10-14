"use client";

import { use, useCallback, useState } from "react";
import type { Contact } from "@/lib/aws/dynamodb";
import { isJobSeeker, seekerArea } from "@/lib/contact";
import { fmtDateTime } from "@/lib/format";
import { useResource } from "@/hooks/use-resource";
import { Button, ConfirmDialog, EmptyState, ErrorState, Page, PageHeader, Panel, Skeleton, PanelSkeleton, usePortalRouter } from "@/components/portal/kit";
import { errorText, send, useToast } from "@/components/portal/relationships/shared";
import {
  AudienceBadge,
  ContactFacts,
  ContactMessage,
  ContactNotes,
  ContactRespond,
  ContactStatusBadge,
  contactName,
  contactStatusMeta,
  dropContact,
  saveContactNotes,
  saveContactStatus,
  syncContact,
  useMarkReadOnOpen,
  type ContactStatus,
} from "@/components/portal/relationships/contact";

const BACK = { href: "/portal/contacts", label: "Contacts" };

/** Same grid as the loaded record so nothing jumps. */
function BodySkeleton() {
  return (
    <div role="status" aria-label="Loading enquiry" className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <PanelSkeleton height="h-72" />
      <div className="grid gap-6">
        <PanelSkeleton height="h-40" />
        <div className="grid gap-3 rounded-xl bg-mist-0 p-5 ring-1 ring-mist-200">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-3.5 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ContactRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const key = `/api/contacts/${id}`;
  const router = usePortalRouter();
  const toast = useToast();
  const { data, error, isLoading, isValidating, reload } = useResource<{ contact?: Contact }>(key);
  const contact = data?.contact;
  const notFound = (error as (Error & { status?: number }) | undefined)?.status === 404;
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const markRead = useCallback(
    (c: Contact) => {
      syncContact(c.id, (x) => ({ ...x, status: "read" }));
      saveContactStatus(c.id, "read").catch(() => {
        syncContact(c.id, (x) => (x.status === "read" ? { ...x, status: "new" } : x));
        toast.error("Couldn't mark this enquiry as read. Change the status to retry.");
      });
    },
    // toast's methods are stable; its wrapper object is not.
    [],
  );
  useMarkReadOnOpen(contact, markRead);

  const setStatus = async (status: ContactStatus) => {
    if (!contact) return;
    const prev = contact.status;
    setBusy(true);
    syncContact(id, (c) => ({ ...c, status }));
    try {
      await saveContactStatus(id, status);
      toast.show(`Marked ${contactStatusMeta(status).label.toLowerCase()}`);
    } catch {
      syncContact(id, (c) => ({ ...c, status: prev }));
      toast.error("Couldn't update the status. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const saveNotes = async (notes: string) => {
    if (!contact) return;
    await saveContactNotes(contact, notes);
    syncContact(id, (c) => ({ ...c, notes, updatedAt: new Date().toISOString() }));
    toast.show("Notes saved");
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await send(key, "DELETE");
      dropContact(id);
      toast.show("Enquiry deleted");
      router.replace("/portal/contacts");
    } catch (e) {
      toast.error(errorText(e, "Couldn't delete the enquiry. Try again."));
      setDeleting(false);
      setAsking(false);
    }
  };

  if (!contact) {
    return (
      <Page>
        <PageHeader back={BACK} title="Enquiry" icon="contact" section="relationships" />
        {isLoading ? (
          <BodySkeleton />
        ) : notFound ? (
          <EmptyState framed icon="contact" title="Enquiry not found" body="It may have been deleted, or the link is out of date." secondary={{ label: "Back to contacts", href: BACK.href }} />
        ) : (
          <ErrorState title="Couldn't load this enquiry" message={error?.message} onRetry={() => void reload()} retrying={isValidating} />
        )}
      </Page>
    );
  }

  const seeker = isJobSeeker(contact.inquiryType);
  const name = contactName(contact);

  return (
    <Page>
      <PageHeader
        back={BACK}
        title={name}
        icon="contact"
        section="relationships"
        meta={<ContactStatusBadge status={contact.status} />}
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{[contact.jobTitle, seeker ? `Looking for work · ${seekerArea(contact.inquiryType)}` : contact.company].filter(Boolean).join(" · ")}</span>
            <span aria-hidden className="text-mist-400">·</span>
            <time dateTime={contact.createdAt} className="tabular-nums">
              {fmtDateTime(contact.createdAt)}
            </time>
          </span>
        }
      />

      {/* Phones: Respond comes first; from lg it sits in the right rail. */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title="Respond" className="lg:col-start-2 lg:row-start-1">
          <ContactRespond c={contact} onStatus={(s) => void setStatus(s)} busy={busy} />
        </Panel>

        <div className="grid min-w-0 gap-6 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <Panel title={`${contact.inquiryType} enquiry`} action={<AudienceBadge c={contact} />}>
            <ContactMessage c={contact} />
          </Panel>
          <Panel title="Notes" description="Internal context for the team">
            <ContactNotes c={contact} onSave={saveNotes} />
          </Panel>
        </div>

        <div className="grid gap-6 lg:col-start-2 lg:row-start-2">
          <Panel title="Contact details">
            <ContactFacts c={contact} stacked />
          </Panel>
          <div>
            <Button variant="danger" icon="trash" onClick={() => setAsking(true)}>
              Delete enquiry
            </Button>
          </div>
        </div>
      </div>

      {asking && (
        <ConfirmDialog
          title="Delete this enquiry?"
          body={`The enquiry from ${name} is removed permanently. This cannot be undone.`}
          confirmLabel="Delete enquiry"
          busy={deleting}
          onConfirm={() => void remove()}
          onCancel={() => setAsking(false)}
        />
      )}
    </Page>
  );
}
