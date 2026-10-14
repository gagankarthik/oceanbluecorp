// A job draft seeded from a hiring enquiry.
import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const { jobDraftFromContact, roleFromMessage, canCreateRoleFromContact } = load("src/lib/job-from-contact.ts");
const { fmtDate } = load("src/lib/format.ts");

const contact = {
  id: "c1", firstName: "Dana", lastName: "Lee", email: "dana@acme.com", company: " Acme Corp ",
  inquiryType: "IT Staffing", message: "We need two AWS engineers for a migration starting next month.",
  status: "new", createdAt: "2026-10-01T15:00:00Z",
};

test("titles only when the message clearly names a role", () => {
  assert.equal(roleFromMessage("We need two AWS engineers for a migration"), "AWS Engineer");
  assert.equal(roleFromMessage("Hiring a senior Java developer, remote"), "Senior Java Developer");
  assert.equal(roleFromMessage("looking for an SAP FICO consultant"), "SAP FICO Consultant");
  assert.equal(roleFromMessage("We are seeking 3 DBAs"), "DBA");
  assert.equal(roleFromMessage("Need a few data analysts asap"), "Data Analyst");
  assert.equal(roleFromMessage("Can we talk about a managed services contract?"), "");
  assert.equal(roleFromMessage("We need help with our cloud strategy"), "");
  assert.equal(roleFromMessage("We need leadership training"), "");
  assert.equal(roleFromMessage(""), "");
});

test("draft: client from company, enquiry in internal notes, contact linked", () => {
  const d = jobDraftFromContact(contact);
  assert.equal(d.title, "AWS Engineer");
  assert.equal(d.clientName, "Acme Corp");
  assert.equal(d.sourceContactId, "c1");
  assert.equal(d.clientNotes, `From enquiry by Dana Lee on ${fmtDate(contact.createdAt)}: ${contact.message}`);
  assert.equal(Object.keys(d).includes("description"), false);
});

test("long messages are cut to the notes limit; a nameless enquiry uses the email", () => {
  const d = jobDraftFromContact({ ...contact, firstName: "", lastName: "", message: "x".repeat(6000) });
  assert.ok(d.clientNotes.length <= 5000);
  assert.ok(d.clientNotes.startsWith("From enquiry by dana@acme.com on "));
});

test("only hiring enquiries become roles", () => {
  assert.equal(canCreateRoleFromContact(contact), true);
  assert.equal(canCreateRoleFromContact({ inquiryType: "Job Seeker - Cloud & DevOps" }), false);
  const seeker = jobDraftFromContact({ ...contact, inquiryType: "Job Seeker - ERP", company: "" });
  assert.equal(seeker.title, "");
  assert.equal(seeker.clientName, "");
});
