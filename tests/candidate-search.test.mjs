// What a candidate search matches — the rules behind "search java, find people
// who can do java" rather than "find people who applied to a job named java".
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const { candidateHaystack, haystackOf, searchTerms, matchesTerms } =
  load("src/lib/candidate-search.ts");

/** A candidate who applied to a role whose title says nothing about their skills. */
const platformEngineer = {
  id: "a1",
  name: "Jane Q Candidate",
  email: "jane@example.com",
  applicationId: "APP-2026-0001",
  jobTitle: "Platform Engineer",
  status: "pending",
  appliedAt: "2026-08-01T00:00:00.000Z",
  city: "Austin",
  state: "TX",
  skills: [],
  resumeAnalysis: {
    professional_summary: "Seasoned engineer with a long history of shipping.",
    skills: {
      technical_skills: ["Java", "Kubernetes"],
      programming_languages: ["Java", "Go"],
      databases: ["PostgreSQL"],
    },
    work_experience: [
      {
        job_title: "Senior Engineer",
        company_name: "Northwind Systems",
        description: "A long paragraph about responsibilities and achievements.",
        technologies_used: ["Kafka"],
      },
    ],
    certifications: [{ name: "AWS Solutions Architect" }],
    analytics: { primary_industry: "Logistics" },
  },
};

const match = (app, query) => matchesTerms(haystackOf(app), searchTerms(query));

describe("candidateHaystack", () => {
  test("finds a skill that appears only in the parsed resume", () => {
    // The whole point: this candidate applied to "Platform Engineer" and would
    // have been invisible to a search for the skill they actually have.
    assert.equal(match(platformEngineer, "java"), true);
    assert.equal(match(platformEngineer, "kubernetes"), true);
    assert.equal(match(platformEngineer, "postgresql"), true);
  });

  test("finds an employer, a past title, a technology and a certification", () => {
    assert.equal(match(platformEngineer, "northwind"), true);
    assert.equal(match(platformEngineer, "senior engineer"), true);
    assert.equal(match(platformEngineer, "kafka"), true);
    assert.equal(match(platformEngineer, "solutions architect"), true);
  });

  test("still finds the identity fields it always did", () => {
    assert.equal(match(platformEngineer, "jane"), true);
    assert.equal(match(platformEngineer, "APP-2026-0001"), true);
    assert.equal(match(platformEngineer, "austin"), true);
    assert.equal(match(platformEngineer, "platform"), true);
  });

  test("does not match a skill the candidate does not have", () => {
    assert.equal(match(platformEngineer, "cobol"), false);
  });

  test("requires every term, so two skills mean both", () => {
    assert.equal(match(platformEngineer, "java kubernetes"), true);
    assert.equal(match(platformEngineer, "java cobol"), false);
  });

  test("is case insensitive", () => {
    assert.equal(match(platformEngineer, "JAVA"), true);
    assert.equal(match(platformEngineer, "NorthWind"), true);
  });

  test("excludes long prose, which would bloat every list payload", () => {
    // Descriptions and the summary are deliberately left out: this string is sent
    // for every candidate in a list, and paragraphs would put back most of the
    // payload the lean list exists to avoid.
    const hay = candidateHaystack(platformEngineer);
    assert.equal(hay.includes("seasoned"), false);
    assert.equal(hay.includes("responsibilities"), false);
  });

  test("deduplicates repeated skills", () => {
    // "Java" appears in both technical_skills and programming_languages.
    const hay = candidateHaystack(platformEngineer);
    assert.equal(hay.split("java").length - 1, 1);
  });

  test("survives a candidate with no resume at all", () => {
    const bare = { id: "b", name: "No Resume", email: "n@x.com", status: "pending", appliedAt: "" };
    assert.equal(match(bare, "no resume"), true);
    assert.equal(match(bare, "java"), false);
  });
});

describe("haystackOf", () => {
  test("prefers the searchText the server built", () => {
    // List responses carry searchText and no resumeAnalysis; the client must use
    // it rather than rebuilding from an analysis that is not there.
    const lean = { id: "c", name: "Lean Record", email: "l@x.com", status: "pending", appliedAt: "", searchText: "java  kafka" };
    assert.equal(haystackOf(lean), "java  kafka");
    assert.equal(match(lean, "kafka"), true);
  });

  test("falls back to computing when searchText is absent", () => {
    assert.ok(haystackOf(platformEngineer).includes("java"));
  });
});

describe("searchTerms", () => {
  test("splits on whitespace and drops the empties", () => {
    assert.deepEqual(searchTerms("  java   aws "), ["java", "aws"]);
  });

  test("an empty query yields no terms, which callers treat as no filter", () => {
    assert.deepEqual(searchTerms(""), []);
    assert.deepEqual(searchTerms("   "), []);
  });
});
