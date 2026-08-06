// Mapping an extraction result onto the new-applicant form.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const { buildResumePrefill, filledKeys } = load("src/lib/resume-prefill.ts");
const { normalizeState } = load("src/components/admin/theme.ts");

describe("buildResumePrefill", () => {
  test("prefers the extractor's own name split over guessing", () => {
    const p = buildResumePrefill({}, { name: "Ana Maria Ruiz", firstName: "Ana", lastName: "Ruiz" });
    assert.equal(p.firstName, "Ana");
    assert.equal(p.lastName, "Ruiz");
  });

  test("keeps a middle name with the surname rather than dropping it", () => {
    // Losing part of someone's name is worse than a long last-name field a
    // recruiter can correct.
    const p = buildResumePrefill({}, { name: "Ana Maria Ruiz" });
    assert.equal(p.firstName, "Ana");
    assert.equal(p.lastName, "Maria Ruiz");
  });

  test("handles a single-word name", () => {
    const p = buildResumePrefill({}, { name: "Prince" });
    assert.equal(p.firstName, "Prince");
    assert.equal(p.lastName, "");
  });

  test("takes city and state from the address, which is populated far more often", () => {
    // analytics.primary_location comes back null on plenty of real resumes.
    const p = buildResumePrefill({ analytics: { primary_location: null } }, { city: "Austin", state: "TX" });
    assert.equal(p.city, "Austin");
    assert.equal(p.state, "TX");
  });

  test("falls back to splitting analytics.primary_location", () => {
    const p = buildResumePrefill({ analytics: { primary_location: "Austin, TX" } }, {});
    assert.equal(p.city, "Austin");
    assert.equal(p.state, "TX");
  });

  test("normalises a full state name to its code so the picker can select it", () => {
    const p = buildResumePrefill({}, { city: "Dallas", state: "Texas" });
    assert.equal(p.state, "TX");
  });

  test("leaves the state blank rather than guessing at an unknown tail", () => {
    const p = buildResumePrefill({ analytics: { primary_location: "Toronto, Ontario" } }, {});
    assert.equal(p.city, "Toronto");
    assert.equal(p.state, "");
  });

  test("orders skills technical-first and deduplicates them", () => {
    const p = buildResumePrefill({
      skills: {
        programming_languages: ["Python", "Python"],
        frameworks_and_libraries: ["Django"],
        technical_skills: ["Python", "Docker"],
      },
    }, {});
    assert.deepEqual(p.skills, ["Python", "Django", "Docker"]);
  });

  test("builds an experience summary from roles when there is no written summary", () => {
    const p = buildResumePrefill({
      work_experience: [
        { job_title: "Senior Engineer", company_name: "Northwind", start_date: "2021", is_current: true },
      ],
      analytics: { total_years_of_experience: 8.6 },
    }, {});
    assert.ok(p.experience.includes("8.6 years"));
    assert.ok(p.experience.includes("Senior Engineer @ Northwind"));
    assert.ok(p.experience.includes("Present"));
  });

  test("prefers the extractor's professional summary when it has one", () => {
    const p = buildResumePrefill({ professional_summary: "Ten years in payments." }, {});
    assert.ok(p.experience.includes("Ten years in payments."));
  });

  test("never throws on an empty or missing analysis", () => {
    const p = buildResumePrefill(undefined, undefined);
    assert.equal(p.firstName, "");
    assert.deepEqual(p.skills, []);
    assert.deepEqual(filledKeys(p), []);
  });
});

describe("filledKeys", () => {
  test("reports only the fields that carry something", () => {
    const p = buildResumePrefill({ skills: { technical_skills: ["Go"] } }, { email: "a@b.com" });
    const keys = filledKeys(p);
    assert.ok(keys.includes("email"));
    assert.ok(keys.includes("skills"));
    assert.equal(keys.includes("phone"), false);
  });
});

describe("normalizeState", () => {
  test("accepts a code in any case, and a full name", () => {
    assert.equal(normalizeState("ca"), "CA");
    assert.equal(normalizeState("California"), "CA");
  });

  test("returns blank for anything unrecognised rather than guessing", () => {
    assert.equal(normalizeState("Ontario"), "");
    assert.equal(normalizeState(""), "");
    assert.equal(normalizeState(undefined), "");
  });
});
