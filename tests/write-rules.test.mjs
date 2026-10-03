// Server-side write rules: what a job or application body may carry, who sees a
// bench record, which posting still takes applications, and the rate-limit key.
import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const { jobInputError, parseSalary, publishedAtFor, jobTeamRecipients, locationRequired } = load("src/lib/job-input.ts");
const { applicationInputError } = load("src/lib/application-input.ts");
const { isAcceptingApplications } = load("src/lib/job-status.ts");
const { isVisibleApplication } = load("src/lib/bench.ts");
const { escapeCell } = load("src/lib/csv.ts");
const { clientKey } = load("src/lib/rate-limit.ts");

const job = { title: "Dev", department: "IT", type: "full-time", description: "x", location: "Columbus" };

test("a job needs a location unless it is remote", () => {
  assert.equal(jobInputError(job), null);
  assert.match(jobInputError({ ...job, location: "" }), /location/);
  assert.equal(jobInputError({ ...job, type: "remote", location: "" }), null);
  assert.equal(locationRequired("remote"), false);
  // An update leaves an absent location alone, but can't blank it on an office role.
  assert.equal(jobInputError({ title: "New" }, { partial: true, currentType: "full-time" }), null);
  assert.match(jobInputError({ location: " " }, { partial: true, currentType: "contract" }), /location/);
  assert.equal(jobInputError({ location: "" }, { partial: true, currentType: "remote" }), null);
});

test("job status and type are closed sets", () => {
  assert.match(jobInputError({ ...job, status: "hacked" }), /status/);
  assert.match(jobInputError({ ...job, type: "gig" }), /type/);
  assert.match(jobInputError({ ...job, title: "x".repeat(201) }), /title/);
});

test("salary is checked and keeps its period", () => {
  assert.deepEqual(parseSalary({ min: 40, max: 55, currency: "USD", period: "hour" }).value,
    { min: 40, max: 55, currency: "USD", period: "hour" });
  assert.equal(parseSalary({ min: 10, max: 5, currency: "USD" }).ok, false);
  assert.equal(parseSalary({ min: 1, max: 2, period: "fortnight" }).ok, false);
  assert.equal(parseSalary(null).value, null);
});

test("publishedAt is stamped once, on first going live", () => {
  const now = new Date("2026-10-03T12:00:00Z");
  assert.equal(publishedAtFor("active", undefined, now), now.toISOString());
  assert.equal(publishedAtFor("draft", undefined, now), undefined);
  assert.equal(publishedAtFor("open", { publishedAt: "2026-01-01" }, now), undefined);
});

test("job team recipients are de-duplicated", () => {
  const out = jobTeamRecipients({
    postedByEmail: "a@x.com", recruitmentManagerEmail: "A@x.com",
    assignedToEmails: ["b@x.com", "b@x.com"], assignedToNames: ["Bea"],
  });
  assert.deepEqual(out.map((r) => r.email), ["a@x.com", "b@x.com"]);
  assert.equal(out[1].name, "Bea");
});

test("staff application bodies are bounded", () => {
  assert.equal(applicationInputError({ firstName: "Jane", status: "interview", rating: 4 }), null);
  assert.match(applicationInputError({ status: "boss" }), /status/);
  assert.match(applicationInputError({ notes: "x".repeat(5001) }), /notes/);
  assert.match(applicationInputError({ rating: 9 }), /rating/);
  assert.match(applicationInputError({ skills: "js" }), /skills/);
});

test("a posting past its deadline stops taking applications that night", () => {
  const due = { status: "active", submissionDueDate: "2026-10-03" };
  assert.equal(isAcceptingApplications(due, new Date("2026-10-03T22:00:00")), true);
  assert.equal(isAcceptingApplications(due, new Date("2026-10-04T00:01:00")), false);
  assert.equal(isAcceptingApplications({ status: "draft" }), false);
  assert.equal(isAcceptingApplications({ status: "open" }), true);
});

test("My Pool records are private to their owner and admins", () => {
  const pool = { addToTalentBench: true, benchType: "external", benchAddedBy: "rec@x.com", status: "pending" };
  assert.equal(isVisibleApplication(pool, { email: "rec@x.com" }), true);
  assert.equal(isVisibleApplication(pool, { email: "other@x.com" }), false);
  assert.equal(isVisibleApplication(pool, { email: "other@x.com", isAdmin: true }), true);
  assert.equal(isVisibleApplication({ ...pool, benchType: "internal" }, { email: "other@x.com" }), true);
  assert.equal(isVisibleApplication({ status: "pending" }, { email: "other@x.com" }), true);
});

test("CSV cells can't run as spreadsheet formulas", () => {
  assert.equal(escapeCell("=HYPERLINK(1)"), `"'=HYPERLINK(1)"`);
  assert.equal(escapeCell("@SUM(A1)"), `"'@SUM(A1)"`);
  assert.equal(escapeCell("-2+3+cmd|' /C calc'!A0"), `"'-2+3+cmd|' /C calc'!A0"`);
  assert.equal(escapeCell("+1 (614) 555-0100"), `"+1 (614) 555-0100"`);
  assert.equal(escapeCell("-12.5"), `"-12.5"`);
  assert.equal(escapeCell('6" Pipe'), `"6"" Pipe"`);
});

test("the rate-limit key ignores a forged leftmost forwarded address", () => {
  const req = (h) => new Request("https://x.test", { headers: h });
  assert.equal(clientKey(req({ "x-forwarded-for": "1.1.1.1, 9.9.9.9" }), 1), "9.9.9.9");
  assert.equal(clientKey(req({ "x-forwarded-for": "1.1.1.1, 9.9.9.9, 10.0.0.1" }), 2), "9.9.9.9");
  assert.equal(clientKey(req({ "cloudfront-viewer-address": "[2001:db8::1]:443", "x-forwarded-for": "1.1.1.1" })), "2001:db8::1");
  assert.equal(clientKey(req({ "cloudfront-viewer-address": "203.0.113.9:5123" })), "203.0.113.9");
});
