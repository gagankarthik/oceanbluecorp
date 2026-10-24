"use client";

import { use, useCallback, useState } from "react";
import type { Contact } from "@/lib/aws/dynamodb";
import { isJobSeeker, seekerArea } from "@/lib/contact";
import { canCreateRoleFromContact } from "@/lib/job-from-contact";
import { useSession } from "@/components/portal/session";
import { permissionsFor } from "@/components/portal/recruiting/model";
import { fmtDateTime, fmtRelative } from "@/lib/format";
import { safeHttpUrl } from "@/lib/portal/format";
import { useResource } from "@/hooks/use-resource";
import Icon, { type IconName } from "@/components/portal/icons";
import { ActionMenu, type MenuEntry } from "@/components/portal/records/Menu";
import { Avatar, Button, ConfirmDialog, EmptyState, ErrorState, Page, PageHeader, Panel, Skeleton, PanelSkeleton, usePortalRouter } from "@/components/portal/kit";
import { errorText, send, useToast } from "@/components/portal/relationships/shared";
import {
  AudienceBadge,
  ContactMessage,
  ContactNotes,
  ContactStatusBadge,
  contactName,
  contactStatusMeta,
  dropContact,
  replyHref,
  saveContactNotes,
  saveContactStatus,
  syncContact,

  useMarkReadOnOpen,
  type ContactStatus,
} from "@/components/portal/relationships/contact";

const BACK = { href: "/portal/contacts", label: "Contacts" };
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** Same grid as the loaded record so nothing jumps. */
function BodySkeleton() {
  return (
    <div role="status" aria-label="Loading enquiry" className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid gap-6">
        <PanelSkeleton height="h-64" />
        <PanelSkeleton height="h-40" />
      </div>
      <div className="grid gap-3 rounded-lg bg-mist-0 p-5 ring-1 ring-mist-200">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

/** One labelled line in the details rail; links stay links, empty fields are left out. */
function Detail({ icon, label, children }: { icon: IconName; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-3 py-2.5">
      <Icon name={icon} className="mt-0.5 size-4 shrink-0 text-mist-500" />
      <div className="min-w-0">
        <dt className="text-adm-xs font-medium text-mist-600">{label}</dt>
        <dd className="break-words text-adm-base text-navy-900">{children}</dd>
      </div>
    </div>
  );
}

function ContactDetails({ c }: { c: Contact }) {
  const linkedin = safeHttpUrl(c.linkedinUrl);
  const link = "text-ocean-700 underline-offset-2 hover:underline focus-visible:underline";
  return (
    <div className="grid gap-4">
      <dl className="divide-y divide-mist-100">
        <Detail icon="mail" label="Email">
          <a href={`mailto:${c.email}`} className={link}>
            {c.email}
          </a>
        </Detail>
        {c.phone && (
          <Detail icon="phone" label="Phone">
            <a href={telHref(c.phone)} className={`${link} tabular-nums`}>
              {c.phone}
            </a>
          </Detail>
        )}
        {(linkedin || c.linkedinUrl) && (
          <Detail icon="external" label="LinkedIn">
            {linkedin ? (
              <a href={linkedin} target="_blank" rel="noopener noreferrer" className={link}>
                View profile
              </a>
            ) : (
              c.linkedinUrl
            )}
          </Detail>
        )}
      </dl>
      <dl className="divide-y divide-mist-100 border-t border-mist-200 pt-2">
        {c.company && (
          <Detail icon="building" label="Company">
            {c.company}
          </Detail>
        )}
        {c.jobTitle && (
          <Detail icon="briefcase" label="Job title">
            {c.jobTitle}
          </Detail>
        )}
        <Detail icon="clock" label="Received">
          <time dateTime={c.createdAt} className="tabular-nums">
            {fmtDateTime(c.createdAt)}
          </time>
        </Detail>
        {c.updatedAt && (
          <Detail icon="refresh" label="Last updated">
            <time dateTime={c.updatedAt} className="tabular-nums">
              {fmtDateTime(c.updatedAt)}
            </time>
          </Detail>
        )}
      </dl>
    </div>
  );
}

export default function ContactRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const key = `/api/contacts/${id}`;
  const router = usePortalRouter();
  const toast = useToast();
  const { canEditJobs } = permissionsFor(useSession().role);
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

  const setStatus = async (status: ContactStatus, quiet = false) => {
    if (!contact || busy || contact.status === status) return;
    const prev = contact.status;
    setBusy(true);
    syncContact(id, (c) => ({ ...c, status }));
    try {
      await saveContactStatus(id, status);
      if (!quiet) toast.show(`Marked ${contactStatusMeta(status).label.toLowerCase()}`);
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

  const copyEmail = async () => {
    if (!contact) return;
    try {
      await navigator.clipboard.writeText(contact.email);
      toast.show("Email copied");
    } catch {
      toast.error("Couldn't copy. Select the address in Details instead.");
    }
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
  const archived = contact.status === "archived";
  const subline = [contact.jobTitle, seeker ? `Looking for work · ${seekerArea(contact.inquiryType)}` : contact.company].filter(Boolean).join(" · ");

  // Status changes live in the overflow: replying already marks it responded
  const menu: MenuEntry[] = [
    ...(contact.status !== "responded" && !archived ? [{ label: "Mark responded", icon: "check" as const, onSelect: () => void setStatus("responded") }] : []),
    ...(contact.status !== "new" && !archived ? [{ label: "Mark unread", icon: "mail" as const, onSelect: () => void setStatus("new") }] : []),
    archived
      ? { label: "Restore from archive", icon: "refresh", onSelect: () => void setStatus("read") }
      : { label: "Archive", icon: "layers", onSelect: () => void setStatus("archived") },
    { label: "Copy email", icon: "copy", onSelect: () => void copyEmail() },
    ...(canEditJobs && canCreateRoleFromContact(contact)
      ? [{ label: "Create role from enquiry", icon: "briefcase" as const, onSelect: () => router.push(`/portal/jobs/new?fromContact=${encodeURIComponent(contact.id)}`) }]
      : []),
    { kind: "separator" },
    { label: "Delete enquiry", icon: "trash", danger: true, onSelect: () => setAsking(true) },
  ];

  return (
    <Page tinted>
      <PageHeader
        hero
        leading={<Avatar name={name} size="lg" />}
        back={BACK}
        title={name}
        icon="contact"
        section="relationships"
        meta={
          <span className="flex items-center gap-1.5">
            <ContactStatusBadge status={contact.status} />
            <AudienceBadge c={contact} />
          </span>
        }
        description={subline || undefined}
        actions={
          <div className="flex items-center gap-2">
            {/* Replying marks the enquiry responded */}
            <Button href={replyHref(contact)} icon="send" onClick={() => void setStatus("responded", true)}>
              Reply by email
            </Button>
            {contact.phone && (
              <Button href={telHref(contact.phone)} variant="secondary" icon="phone">
                Call
              </Button>
            )}
            <ActionMenu label="More actions" items={menu} />
          </div>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid min-w-0 gap-6">
          <Panel title="Message" action={<span className="text-adm-base tabular-nums text-mist-600">{fmtRelative(contact.createdAt)}</span>}>
            <p className="mb-3 text-adm-base text-mist-600">{seeker ? `Looking for work in ${seekerArea(contact.inquiryType)}` : `${contact.inquiryType} enquiry`}</p>
            <ContactMessage c={contact} />
          </Panel>
          <Panel title="Notes" description="Only staff see these">
            <ContactNotes c={contact} onSave={saveNotes} />
          </Panel>
        </div>

        <Panel title="Details">
          <ContactDetails c={contact} />
        </Panel>
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
