// Money and stage-progression rules for the recruiting pipeline.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const {
  grossMarginPct, grossMarginAmount, formatRate,
  impliedApplicationStatus, isForwardStatusMove,
} = load("src/lib/pipeline-records.ts");

describe("grossMarginPct", () => {
  test("is a percentage of the BILL rate, not of the pay rate", () => {
    // 85 bill / 63 pay -> 22 profit, 25.88% of bill. Marking it up off the pay
    // rate instead would read 34.9% and overstate every deal.
    assert.equal(grossMarginPct({ billRate: 85, payRate: 63 }).toFixed(2), "25.88");
  });

  test("returns null when either rate is missing", () => {
    // A placement recorded without a pay rate has no margin. Showing 100% would
    // read as an unusually good deal rather than as missing data.
    assert.equal(grossMarginPct({ billRate: 85 }), null);
    assert.equal(grossMarginPct({ payRate: 63 }), null);
    assert.equal(grossMarginPct({}), null);
  });

  test("returns null for a zero or negative bill rate rather than dividing by it", () => {
    assert.equal(grossMarginPct({ billRate: 0, payRate: 10 }), null);
    assert.equal(grossMarginPct({ billRate: -5, payRate: 10 }), null);
  });

  test("reports a loss-making placement as negative", () => {
    assert.ok(grossMarginPct({ billRate: 50, payRate: 60 }) < 0);
    assert.equal(grossMarginAmount({ billRate: 50, payRate: 60 }), -10);
  });

  test("a zero pay rate is a real 100% margin, not missing data", () => {
    assert.equal(grossMarginPct({ billRate: 80, payRate: 0 }), 100);
  });
});

describe("formatRate", () => {
  test("renders the unit suffix", () => {
    assert.equal(formatRate(85, "hourly"), "$85.00/hr");
  });

  test("drops the cents on annual figures", () => {
    assert.equal(formatRate(140000, "annual"), "$140,000/yr");
  });

  test("shows a dash rather than $0 when there is no figure", () => {
    // En dash, not em. The em dash was removed site-wide as a written-by-AI
    // tell; as a table placeholder the glyph still belongs, so it stays as the
    // narrower dash rather than becoming an empty cell, which would be
    // indistinguishable from a rendering failure.
    assert.equal(formatRate(undefined, "hourly"), "–");
  });

  test("zero is a figure, and prints as one", () => {
    assert.equal(formatRate(0, "hourly"), "$0.00/hr");
  });
});

describe("impliedApplicationStatus", () => {
  test("maps each kind of event to the stage it implies", () => {
    assert.equal(impliedApplicationStatus({ kind: "submission" }), "submitted");
    assert.equal(impliedApplicationStatus({ kind: "interview" }), "interview");
    assert.equal(impliedApplicationStatus({ kind: "placement" }), "hired");
  });
});

describe("isForwardStatusMove", () => {
  test("advances through the pipeline", () => {
    assert.equal(isForwardStatusMove("pending", "submitted"), true);
    assert.equal(isForwardStatusMove("submitted", "interview"), true);
    assert.equal(isForwardStatusMove("interview", "hired"), true);
  });

  test("never moves a candidate backwards", () => {
    // Logging a late first-round interview must not drag someone already offered
    // back down to "interview".
    assert.equal(isForwardStatusMove("offered", "interview"), false);
    assert.equal(isForwardStatusMove("hired", "submitted"), false);
  });

  test("never reopens an ended candidate", () => {
    // "rejected" and "withdrawn" are deliberate end states: a late piece of admin
    // must not silently put the candidate back in play.
    assert.equal(isForwardStatusMove("rejected", "submitted"), false);
    assert.equal(isForwardStatusMove("withdrawn", "interview"), false);
  });

  test("is not a move when the stage is unchanged", () => {
    assert.equal(isForwardStatusMove("submitted", "submitted"), false);
  });

  test("treats a record with no stage as advanceable", () => {
    assert.equal(isForwardStatusMove(undefined, "submitted"), true);
  });
});
