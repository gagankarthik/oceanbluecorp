// Job posting data rules: skills, pay toggle, commercial fields, JSON-LD.
import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const { jobInputError, parseSkills, parsePct, SKILLS_MAX } = load("src/lib/job-input.ts");
const { salaryIfShown, baseSalaryLd, jobPostingJsonLd } = load("src/lib/job-jsonld.ts");
const { toPublicJob, toCandidateJob, toFeedJob } = load("src/lib/aws/dynamodb.ts");
const { JOB_COMMERCIAL_FIELDS } = load("src/lib/auth/config.ts");

const base = { title: "Java Developer", department: "Engineering", type: "full-time", description: "x", location: "Columbus" };

test("skills are trimmed, deduped case-insensitively, first spelling wins", () => {
  const r = parseSkills([" React ", "react", "Node.js", "", "  AWS   Lambda "]);
  assert.deepEqual(r, { ok: true, value: ["React", "Node.js", "AWS Lambda"] });
  assert.deepEqual(parseSkills("Java, SQL\nJava"), { ok: true, value: ["Java", "SQL"] });
  assert.deepEqual(parseSkills(null), { ok: true, value: [] });
});

test("skills limits: 25 items, 40 chars, text only", () => {
  const many = Array.from({ length: SKILLS_MAX + 1 }, (_, i) => `skill ${i}`);
  assert.equal(parseSkills(many).ok, false);
  assert.equal(parseSkills(Array.from({ length: SKILLS_MAX }, (_, i) => `s${i}`)).ok, true);
  // Duplicates do not count toward the cap.
  assert.equal(parseSkills([...many.slice(0, SKILLS_MAX), "SKILL 0"]).ok, true);
  assert.equal(parseSkills(["x".repeat(41)]).ok, false);
  assert.equal(parseSkills([1, 2]).ok, false);
  assert.equal(parseSkills({ a: 1 }).ok, false);
});

test("percentages: fee 0–100, target margin 0–90, '15%' reads as 15, blank clears", () => {
  assert.deepEqual(parsePct("15%", "feePct", 100), { ok: true, value: 15 });
  assert.deepEqual(parsePct("", "feePct", 100), { ok: true, value: null });
  assert.deepEqual(parsePct(null, "feePct", 100), { ok: true, value: null });
  assert.equal(parsePct(101, "feePct", 100).ok, false);
  assert.equal(parsePct(-1, "feePct", 100).ok, false);
  assert.equal(parsePct("abc", "feePct", 100).ok, false);
  assert.equal(jobInputError({ ...base, targetMarginPct: 91 }), "targetMarginPct must be a number from 0 to 90");
  assert.equal(jobInputError({ ...base, targetMarginPct: 90, feePct: 100 }), null);
  assert.equal(jobInputError({ feePct: 120 }, { partial: true }), "feePct must be a number from 0 to 100");
});

test("showPay must be boolean; skills validated on writes", () => {
  assert.equal(jobInputError({ ...base, showPay: "yes" }), "showPay must be true or false");
  assert.equal(jobInputError({ ...base, showPay: true, skills: ["Java"] }), null);
  assert.equal(jobInputError({ skills: ["x".repeat(41)] }, { partial: true }), "Each skill must be 40 characters or fewer");
});

test("fee and target margin are commercial; skills and showPay are not", () => {
  for (const f of ["feePct", "targetMarginPct", "sourceContactId", "clientNotes"]) assert.ok(JOB_COMMERCIAL_FIELDS.includes(f), f);
  for (const f of ["skills", "showPay"]) assert.ok(!JOB_COMMERCIAL_FIELDS.includes(f), f);
});

const record = {
  ...base, id: "j1", postingId: "OB-2026-0001", status: "active", createdAt: "2026-10-01T00:00:00Z",
  requirements: "", responsibilities: "", state: "OH",
  salary: { min: 90000, max: 120000, currency: "USD", period: "year" },
  skills: ["Java", "Spring"], clientName: "Acme", clientBillRate: 90, payRate: 60, feePct: 20, targetMarginPct: 25,
};

test("projections never carry a commercial field", () => {
  for (const out of [toPublicJob(record), toCandidateJob(record), toCandidateJob({ ...record, showPay: true })]) {
    for (const f of JOB_COMMERCIAL_FIELDS) assert.equal(out[f], undefined, f);
  }
  const feed = toFeedJob(record);
  for (const f of ["feePct", "targetMarginPct", "clientBillRate", "payRate", "clientNotes"]) assert.equal(feed[f], undefined, f);
});

test("candidate and feed projections show salary only with showPay; skills always", () => {
  assert.equal(toCandidateJob(record).salary, undefined);
  assert.equal(toCandidateJob({ ...record, showPay: false }).salary, undefined);
  assert.deepEqual(toCandidateJob({ ...record, showPay: true }).salary, record.salary);
  assert.deepEqual(toCandidateJob(record).skills, ["Java", "Spring"]);
  assert.equal(toCandidateJob({ ...record, showPay: true }).showPay, true);
  assert.equal("showPay" in toCandidateJob({ ...record, showPay: false }), false);
  assert.equal(toFeedJob(record).salary, undefined);
  assert.deepEqual(toFeedJob({ ...record, showPay: true }).salary, record.salary);
  assert.deepEqual(toFeedJob(record).skills, ["Java", "Spring"]);
  assert.equal(salaryIfShown({ showPay: true }), undefined);
});

test("baseSalary: range, single figure, hourly unit, empty", () => {
  assert.deepEqual(baseSalaryLd({ min: 90000, max: 120000, currency: "$" }), {
    "@type": "MonetaryAmount", currency: "USD",
    value: { "@type": "QuantitativeValue", minValue: 90000, maxValue: 120000, unitText: "YEAR" },
  });
  assert.deepEqual(baseSalaryLd({ min: 55, max: 55, currency: "USD", period: "hour" }).value, { "@type": "QuantitativeValue", value: 55, unitText: "HOUR" });
  assert.equal(baseSalaryLd({ min: 0, max: 60, currency: "USD", period: "hour" }).value.value, 60);
  assert.equal(baseSalaryLd({ min: 0, max: 0, currency: "USD" }), undefined);
  assert.equal(baseSalaryLd(undefined), undefined);
});

test("jobPostingJsonLd adds skills always and baseSalary only when shown", () => {
  const hidden = jobPostingJsonLd(record);
  assert.deepEqual(hidden.skills, ["Java", "Spring"]);
  assert.equal(hidden.baseSalary, undefined);
  assert.equal(jobPostingJsonLd({ ...record, showPay: false }).baseSalary, undefined);
  assert.equal(jobPostingJsonLd({ ...record, showPay: true }).baseSalary.value.unitText, "YEAR");
  assert.equal(jobPostingJsonLd(toCandidateJob({ ...record, showPay: true })).baseSalary.currency, "USD");
  assert.equal(jobPostingJsonLd(toCandidateJob(record)).baseSalary, undefined);
  assert.equal(jobPostingJsonLd({ ...record, skills: [] }).skills, undefined);
  assert.equal(hidden["@type"], "JobPosting");
  assert.equal(hidden.employmentType, "FULL_TIME");
  assert.equal(hidden.url, "https://oceanbluecorp.com/jobs/j1");
});
