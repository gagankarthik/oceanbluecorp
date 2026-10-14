// Staffing margin against target, markup, placement fee.
import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const { marginStatus, markupPct, placementFee, DEFAULT_TARGET_MARGIN_PCT } = load("src/lib/margin.ts");

test("no green for any positive margin: judged against the 20% default", () => {
  assert.equal(DEFAULT_TARGET_MARGIN_PCT, 20);
  assert.equal(marginStatus(100, 80).tone, "success"); // exactly 20%
  assert.equal(marginStatus(100, 70).label, "On target");
  const thin = marginStatus(100, 90);
  assert.equal(thin.tone, "warning");
  assert.equal(thin.label, "Below target (20%)");
  assert.equal(Math.round(thin.marginPct), 10);
});

test("zero or negative margin is a loss", () => {
  assert.equal(marginStatus(100, 100).tone, "danger");
  assert.equal(marginStatus(100, 100).label, "Loss");
  assert.equal(marginStatus(100, 120).tone, "danger");
});

test("custom target, and a missing target falls back to 20", () => {
  assert.equal(marginStatus(100, 75, 30).tone, "warning");
  assert.equal(marginStatus(100, 75, 30).label, "Below target (30%)");
  assert.equal(marginStatus(100, 75, 25).tone, "success");
  assert.equal(marginStatus(100, 85, undefined).tone, "warning");
  assert.equal(marginStatus(100, 85, null).label, "Below target (20%)");
});

test("no status without a positive bill and a pay rate", () => {
  assert.equal(marginStatus(0, 50), null);
  assert.equal(marginStatus(undefined, 50), null);
  assert.equal(marginStatus(100, undefined), null);
});

test("markup is on pay, beside margin on bill", () => {
  assert.equal(Math.round(markupPct(100, 80) * 10) / 10, 25);
  assert.equal(Math.round(marginStatus(100, 80).markupPct), 25);
  assert.equal(markupPct(100, 0), null);
  assert.equal(marginStatus(100, 0).markupPct, null);
});

test("placement fee: fee % of salary midpoint, or the one figure given", () => {
  assert.equal(placementFee(20, 100000, 120000), 22000);
  assert.equal(placementFee(25, 0, 80000), 20000);
  assert.equal(placementFee(0, 100000, 120000), null);
  assert.equal(placementFee(20, 0, 0), null);
  assert.equal(placementFee(undefined, 100000, 120000), null);
});
