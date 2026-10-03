// Email templates, calendar invites and the change log.
import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const { fillTemplate, unfilledPlaceholders, escapeHtml, EMAIL_TEMPLATES, templateById } = load("src/lib/email-templates.ts");
const { buildIcs } = load("src/lib/ics.ts");
const { changedFields, describeChange, changeKind } = load("src/lib/application-input.ts");

test("templates fill known placeholders and leave the rest visible", () => {
  const out = fillTemplate("Hi {{firstName}}, re {{jobTitle}} at {{interviewWhen}}", { firstName: "Jane", jobTitle: "Dev" });
  assert.equal(out, "Hi Jane, re Dev at {{interviewWhen}}");
  assert.deepEqual(unfilledPlaceholders(out), ["interviewWhen"]);
  assert.ok(templateById("rejection"));
  for (const t of EMAIL_TEMPLATES) assert.ok(t.subject && t.body && t.label, t.id);
});

test("email bodies are escaped", () => {
  assert.equal(escapeHtml(`<img src=x onerror="a">&'`), "&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;");
});

test("an interview invite is a valid, folded VEVENT", () => {
  const ics = buildIcs({
    uid: "abc@x", start: new Date("2026-10-05T15:00:00Z"), durationMinutes: 45,
    title: "Interview: Dev, Senior; Ops", description: "Line one\nline two " + "x".repeat(120),
    organizer: { name: "Rec", email: "rec@x.com" }, attendees: [{ name: "Jane", email: "jane@x.com" }],
    stamp: new Date("2026-10-01T00:00:00Z"),
  });
  assert.match(ics, /DTSTART:20261005T150000Z\r\n/);
  assert.match(ics, /DTEND:20261005T154500Z\r\n/);
  assert.ok(ics.includes("SUMMARY:Interview: Dev\\, Senior\\; Ops"));
  assert.ok(ics.includes("DESCRIPTION:Line one\\nline two"));
  assert.match(ics, /ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;CN=Jane:mailto:jane@x.com/);
  for (const line of ics.split("\r\n")) assert.ok(Buffer.byteLength(line) <= 75, line);
});

test("the change log names only what really changed", () => {
  const before = { email: "a@x.com", phone: "1", skills: ["js"], updatedAt: "t" };
  const fields = changedFields(before, { email: "a@x.com", phone: "2", skills: ["js"], city: "Austin", updatedAt: "u", jobFit: undefined });
  assert.deepEqual(fields, ["city", "phone"]);
  assert.equal(describeChange(fields), "Changed city and phone");
  assert.equal(describeChange(["linkedinUrl"]), "Changed LinkedIn");
  assert.equal(changeKind(["resumeId", "city"]), "resume");
  assert.equal(changeKind(["ownership"]), "ownership");
  assert.equal(changeKind(["addToTalentBench"]), "bench");
  assert.equal(changeKind(["city"]), "edit");
});
