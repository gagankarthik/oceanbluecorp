// Stage timing: how long a candidate has waited, and when that counts as stale.
import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const { enteredStageAt, daysInStage, isStale, everReached, STALE_DAYS } = load("src/lib/pipeline.ts");

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString();

test("the current stage is timed from its LAST entry", () => {
  const a = {
    status: "interview",
    appliedAt: daysAgo(30),
    statusHistory: [
      { status: "interview", changedAt: daysAgo(20) },
      { status: "submitted", changedAt: daysAgo(15) },
      { status: "interview", changedAt: daysAgo(3) },
    ],
  };
  assert.equal(daysInStage(a), 3);
  assert.equal(enteredStageAt(a), new Date(a.statusHistory[2].changedAt).getTime());
});

test("a record that never moved has waited since it applied", () => {
  assert.equal(daysInStage({ status: "pending", appliedAt: daysAgo(9) }), 9);
});

test("stale means in play and untouched for STALE_DAYS", () => {
  assert.equal(isStale({ status: "reviewing", appliedAt: daysAgo(STALE_DAYS) }), true);
  assert.equal(isStale({ status: "reviewing", appliedAt: daysAgo(STALE_DAYS - 1) }), false);
  assert.equal(isStale({ status: "hired", appliedAt: daysAgo(90) }), false);
  assert.equal(isStale({ status: "rejected", appliedAt: daysAgo(90) }), false);
});

test("a stage passed through still counts as reached", () => {
  const a = { status: "offered", appliedAt: daysAgo(10), statusHistory: [{ status: "interview", changedAt: daysAgo(5) }] };
  assert.equal(everReached(a, "interview"), true);
  assert.equal(everReached(a, "offered"), true);
  assert.equal(everReached(a, "hired"), false);
});
