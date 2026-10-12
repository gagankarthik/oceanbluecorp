// Saved candidate rankings: when one is out of date, when a run is still live.
import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const { jobFingerprint, isRunning, RUN_STALE_MS } = load("src/lib/ranking.ts");

const job = { title: "Data Engineer", description: "<p>Pipelines</p>", requirements: ["SQL"], location: "Columbus", type: "contract" };

test("a ranking goes stale only when what the engine reads changes", () => {
  const base = jobFingerprint(job);
  assert.equal(jobFingerprint({ ...job }), base);
  // Fields the engine never sees don't matter.
  assert.equal(jobFingerprint({ ...job, status: "closed", clientName: "Acme" }), base);
  assert.notEqual(jobFingerprint({ ...job, description: "<p>Pipelines and dashboards</p>" }), base);
  assert.notEqual(jobFingerprint({ ...job, requirements: ["SQL", "Python"] }), base);
  assert.notEqual(jobFingerprint({ ...job, title: "Senior Data Engineer" }), base);
  assert.match(base, /^[0-9a-f]{8}$/);
});

test("a run counts as live until it is older than the stale window", () => {
  const now = Date.parse("2026-10-12T12:00:00Z");
  const at = (msAgo) => new Date(now - msAgo).toISOString();
  assert.equal(isRunning({ state: "running", startedAt: at(30_000) }, now), true);
  assert.equal(isRunning({ state: "running", startedAt: at(RUN_STALE_MS + 1) }, now), false);
  assert.equal(isRunning({ state: "failed", startedAt: at(1_000) }, now), false);
  assert.equal(isRunning(undefined, now), false);
});
