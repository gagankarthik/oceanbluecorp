// Job posting checks: blocking mirrors the server rules, the rest is advice.
import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const {
  jobChecks, summarizeChecks, wordCount, bulletCount, titleProblem, nameLeaks, inclusiveLanguageHits,
  placeholders, googleJobsReadiness,
} = load("src/lib/job-quality.ts");
const { jobTemplate } = load("src/lib/job-templates.ts");

const words = (n) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");
const list = (n) => `<ul>${Array.from({ length: n }, (_, i) => `<li>Point ${i}</li>`).join("")}</ul>`;
const NOW = new Date(2026, 9, 15);

const good = {
  title: "Senior Data Engineer",
  type: "contract",
  workplace: "hybrid",
  location: "Columbus",
  description: `<p>${words(200)}</p>`,
  responsibilities: list(4),
  requirements: list(3),
  skills: ["Python", "Spark", "AWS"],
  submissionDueDate: "2026-11-30",
  clientName: "Acme Insurance, Inc.",
  vendorName: "",
  canPrice: true,
};
const byId = (checks) => Object.fromEntries(checks.map((c) => [c.id, c]));

test("a complete posting passes every check", () => {
  const s = summarizeChecks(jobChecks(good, NOW));
  assert.equal(s.passed, s.total);
  assert.equal(s.blockingLeft.length, 0);
  assert.equal(s.advisoryLeft.length, 0);
});

test("blocking checks are the server's required fields", () => {
  const c = byId(jobChecks({ ...good, title: " ", type: "", location: "", description: "<p><br></p>" }, NOW));
  for (const id of ["title", "type", "location", "description"]) assert.equal(c[id].ok, false, id);
  assert.deepEqual(jobChecks(good, NOW).filter((x) => x.blocking).map((x) => x.id), ["title", "type", "location", "description"]);
});

test("remote roles do not need a city", () => {
  assert.equal(byId(jobChecks({ ...good, workplace: "remote", location: "" }, NOW)).location.ok, true);
});

test("about length, bullets, skills and deadline are advisory ranges", () => {
  const c = byId(jobChecks({ ...good, description: `<p>${words(50)}</p>`, responsibilities: list(2), skills: ["A"], submissionDueDate: "2026-10-01" }, NOW));
  assert.equal(c["about-length"].ok, false);
  assert.equal(c["about-length"].blocking, false);
  assert.equal(c["do-bullets"].ok, false);
  assert.equal(c.skills.ok, false);
  assert.equal(c.deadline.ok, false);
  assert.equal(byId(jobChecks({ ...good, description: `<p>${words(800)}</p>` }, NOW))["about-length"].ok, false);
  assert.equal(byId(jobChecks({ ...good, skills: Array.from({ length: 11 }, (_, i) => `S${i}`) }, NOW)).skills.ok, false);
  assert.equal(byId(jobChecks({ ...good, submissionDueDate: "2026-10-15" }, NOW)).deadline.ok, true, "today still counts");
  assert.equal(byId(jobChecks({ ...good, submissionDueDate: "" }, NOW)).deadline.ok, false);
});

test("word and bullet counting read editor HTML and legacy text", () => {
  assert.equal(wordCount("<p>One two</p><p>three&nbsp;four</p>"), 4);
  assert.equal(wordCount("<p><br></p>"), 0);
  assert.equal(bulletCount("<ul><li>a</li><li> </li><li>b</li></ul>"), 2);
  assert.equal(bulletCount("line one\nline two\n\n"), 2);
  assert.equal(bulletCount("<p>prose only</p>"), 0);
});

test("title style", () => {
  assert.equal(titleProblem("Senior Developer"), null);
  assert.equal(titleProblem("SAP FICO SME"), null);
  assert.match(titleProblem("SENIOR DEVELOPER"), /capitals/);
  assert.match(titleProblem("Java Developer!!!"), /exclamation/);
  assert.match(titleProblem("Rockstar Dev 🚀"), /emoji/);
});

test("client and vendor names are caught in public text, with or without the suffix", () => {
  assert.deepEqual(nameLeaks("You will work on Acme Insurance claims", ["Acme Insurance, Inc."]), ["Acme Insurance, Inc."]);
  assert.deepEqual(nameLeaks("Our insurer client", ["Acme Insurance, Inc."]), []);
  assert.deepEqual(nameLeaks("abc", ["AB"]), [], "short names ignored");
  const c = byId(jobChecks({ ...good, description: `<p>${words(150)} Acme Insurance</p>` }, NOW));
  assert.equal(c["name-leak"].ok, false);
  assert.equal(byId(jobChecks({ ...good, canPrice: false, description: `<p>${words(150)} Acme Insurance</p>` }, NOW))["name-leak"], undefined, "media never sees the check");
});

test("inclusive language list with suggestions", () => {
  const hits = inclusiveLanguageHits("We want a rockstar ninja; he will own manpower planning.");
  assert.deepEqual(hits.map((h) => h.term), ["rockstar", "ninja", "he / his", "manpower"]);
  assert.ok(hits.every((h) => h.suggestion));
  assert.deepEqual(inclusiveLanguageHits("This hero thinks other thoughts"), []);
});

test("template prompts left in the text are flagged", () => {
  assert.deepEqual(placeholders("Join [team name] in [city]. Use [team name]."), ["[team name]", "[city]"]);
  const t = jobTemplate("Data & AI", "contract");
  const c = byId(jobChecks({ ...good, description: t.description }, NOW));
  assert.equal(c.placeholders.ok, false);
});

test("templates cover every practice and stay inside the editor's HTML subset", () => {
  const { DEPARTMENTS } = load("src/lib/job-options.ts");
  for (const d of DEPARTMENTS) {
    for (const type of ["full-time", "contract", "direct-hire"]) {
      const t = jobTemplate(d, type);
      for (const html of [t.description, t.responsibilities, t.requirements]) {
        assert.ok(html.length > 0);
        assert.doesNotMatch(html.replace(/<\/?(p|ul|li|strong|em)>/g, ""), /<[a-z]/i, `${d}: only p/ul/li/strong/em`);
      }
      assert.ok(bulletCount(t.responsibilities) >= 3 && bulletCount(t.requirements) >= 3);
      assert.ok(t.skills.length >= 3 && t.skills.length <= 10, d);
    }
  }
  assert.match(jobTemplate("Engineering", "contract").description, /contract/i);
  assert.ok(jobTemplate("Something new", "full-time").skills.length >= 3, "unknown practice falls back");
});

test("Google Jobs readiness", () => {
  const base = { title: "T", description: "<p>x</p>", hiringOrganization: {}, employmentType: "FULL_TIME" };
  assert.deepEqual(googleJobsReadiness({ ...base, jobLocationType: "TELECOMMUTE" }).missing, []);
  assert.deepEqual(googleJobsReadiness({ ...base, jobLocation: { address: { addressCountry: "US" } } }).missing, ["location"]);
  const r = googleJobsReadiness({ ...base, jobLocation: { address: { addressLocality: "Columbus" } }, validThrough: "x" });
  assert.equal(r.ready, true);
  assert.deepEqual(r.recommended, ["pay range shown"]);
  assert.deepEqual(googleJobsReadiness({ description: "" }).missing, ["title", "description", "hiring organization", "location"]);
});
