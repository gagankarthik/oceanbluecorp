// One rule for "publicly open": the listing, job page, sitemap and apply check
// used to disagree, so an "open" job was listed but refused applications.
import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const { isPubliclyOpen, PUBLIC_JOB_STATUSES } = load("src/lib/job-status.ts");

test("active and open are live", () => {
  assert.equal(isPubliclyOpen("active"), true);
  assert.equal(isPubliclyOpen("open"), true);
  assert.deepEqual([...PUBLIC_JOB_STATUSES], ["active", "open"]);
});

test("every other status, and a missing one, is not", () => {
  for (const s of ["draft", "paused", "closed", "on-hold", "", null, undefined, "ACTIVE"]) {
    assert.equal(isPubliclyOpen(s), false, String(s));
  }
});
