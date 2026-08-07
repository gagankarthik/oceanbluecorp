// The 13-year celebration gate. TEMPORARY — delete alongside
// src/lib/anniversary.ts when the celebration retires.
//
// Worth a test despite being small: it decides whether a banner is on the
// homepage, the failure is visible to every visitor, and the interesting
// cases are the boundaries — which are exactly what nobody checks by hand.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const { isAnniversaryLive, ANNIVERSARY_YEARS } = load("src/lib/anniversary.ts");

const at = (y, m, d) => new Date(Date.UTC(y, m - 1, d));

describe("isAnniversaryLive", () => {
  test("is on across the celebration window when nothing is configured", () => {
    assert.equal(isAnniversaryLive({}, at(2026, 8, 8)), true, "the day itself");
    assert.equal(isAnniversaryLive({}, at(2026, 8, 1)), true, "window opens");
    assert.equal(isAnniversaryLive({}, at(2026, 8, 22)), true, "last full day");
  });

  test("retires itself outside the window", () => {
    // The reason the window exists: nobody has to remember to switch it off.
    assert.equal(isAnniversaryLive({}, at(2026, 7, 31)), false, "before it opens");
    assert.equal(isAnniversaryLive({}, at(2026, 8, 23)), false, "after it closes");
    assert.equal(isAnniversaryLive({}, at(2026, 12, 25)), false, "months later");
    assert.equal(isAnniversaryLive({}, at(2027, 8, 8)), false, "the next year is not this one");
  });

  test("the CMS toggle overrides the window in both directions", () => {
    // "false" has to win mid-celebration — it is the kill switch, and a switch
    // that only works when the thing is already off is not a switch.
    assert.equal(isAnniversaryLive({ anniversary: "false" }, at(2026, 8, 8)), false);
    assert.equal(isAnniversaryLive({ anniversary: "true" }, at(2026, 9, 30)), true);
  });

  test("tolerates the shapes a toggle field actually arrives in", () => {
    assert.equal(isAnniversaryLive({ anniversary: " TRUE " }, at(2027, 1, 1)), true);
    assert.equal(isAnniversaryLive({ anniversary: "False" }, at(2026, 8, 8)), false);
    // An empty string is an untouched field, not an instruction — it must fall
    // through to the window rather than reading as "off".
    assert.equal(isAnniversaryLive({ anniversary: "" }, at(2026, 8, 8)), true);
    assert.equal(isAnniversaryLive(undefined, at(2026, 8, 8)), true);
  });

  test("the year count is derived, not typed in twice", () => {
    assert.equal(ANNIVERSARY_YEARS, 13);
  });
});
