// Who can see which talent-pool records.
//
// This one earns a test more than most: the rule decides whether one
// recruiter's private sourcing pipeline is readable by their colleagues, it is
// invisible when it goes wrong (the screen looks correct either way — the leak
// is in the payload), and its trickiest case is a legacy fallback that infers
// the pool from `status` when `benchType` was never written.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const { canView, poolOf, isOwnRecord, adderKeyOf } = load("src/lib/bench.ts");

const ALICE = { id: "u-alice", email: "alice@oceanbluecorp.com", isAdmin: false };
const BOB = { id: "u-bob", email: "bob@oceanbluecorp.com", isAdmin: false };
const ADMIN = { id: "u-admin", email: "admin@oceanbluecorp.com", isAdmin: true };

const bench = (over = {}) => ({
  addToTalentBench: true,
  status: "reviewing",
  benchAddedBy: "alice@oceanbluecorp.com",
  ...over,
});

describe("canView", () => {
  test("Talent Bench is company property — everyone sees it", () => {
    const shared = bench({ benchType: "internal" });
    assert.equal(canView(shared, ALICE), true, "the person who added it");
    assert.equal(canView(shared, BOB), true, "a colleague");
    assert.equal(canView(shared, ADMIN), true, "an admin");
  });

  test("My Pool is private to whoever built it", () => {
    const mine = bench({ benchType: "external" });
    assert.equal(canView(mine, ALICE), true, "the owner sees their own pool");
    assert.equal(canView(mine, BOB), false, "a colleague must not");
  });

  test("admins see every pool, because they audit the team's pipeline", () => {
    assert.equal(canView(bench({ benchType: "external" }), ADMIN), true);
  });

  test("ownership matches on either email or id, case-insensitively", () => {
    assert.equal(canView(bench({ benchType: "external", benchAddedBy: "ALICE@OceanBlueCorp.com" }), ALICE), true);
    assert.equal(canView(bench({ benchType: "external", benchAddedBy: "u-alice" }), ALICE), true);
  });

  test("falls back to createdBy when benchAddedBy was never written", () => {
    const legacy = { addToTalentBench: true, status: "reviewing", benchType: "external", createdBy: "alice@oceanbluecorp.com" };
    assert.equal(canView(legacy, ALICE), true);
    assert.equal(canView(legacy, BOB), false);
  });

  test("an unattributed private record is not readable by a non-admin", () => {
    // No adder recorded at all: it cannot be shown to be anyone's, so it stays
    // shut rather than falling open to the whole company.
    const orphan = { addToTalentBench: true, status: "reviewing", benchType: "external" };
    assert.equal(adderKeyOf(orphan), "");
    assert.equal(isOwnRecord(orphan, ALICE), false);
    assert.equal(canView(orphan, ALICE), false);
    assert.equal(canView(orphan, ADMIN), true);
  });
});

describe("poolOf — the legacy fallback", () => {
  test("an explicit benchType always wins", () => {
    assert.equal(poolOf({ benchType: "internal", status: "reviewing" }), "internal");
    assert.equal(poolOf({ benchType: "external", status: "hired" }), "external");
  });

  test("without one, a hire is a consultant and belongs to the shared bench", () => {
    assert.equal(poolOf({ status: "hired" }), "internal");
  });

  test("without one, anything not hired is treated as private", () => {
    // The safe direction: a record whose pool nobody recorded is withheld
    // rather than published to the company.
    assert.equal(poolOf({ status: "reviewing" }), "external");
    assert.equal(canView({ addToTalentBench: true, status: "reviewing" }, BOB), false);
  });
});

describe("the API predicate", () => {
  // Mirrors the filter both application routes apply. Scoping to bench records
  // is load-bearing: poolOf() calls anything not-hired "external", so running
  // every application through canView would hide most of the pipeline from
  // everyone on every screen that reads these endpoints.
  const visibleTo = (viewer) => (app) => !app.addToTalentBench || canView(app, viewer);

  test("leaves non-bench applications alone", () => {
    const ordinary = { addToTalentBench: false, status: "reviewing", createdBy: "someone-else" };
    assert.equal(visibleTo(BOB)(ordinary), true);
    const hired = { addToTalentBench: false, status: "hired", createdBy: "someone-else" };
    assert.equal(visibleTo(BOB)(hired), true);
  });

  test("removes a colleague's private pool but keeps the shared bench", () => {
    const rows = [
      { id: "1", addToTalentBench: true, benchType: "internal", status: "hired", benchAddedBy: "alice@oceanbluecorp.com" },
      { id: "2", addToTalentBench: true, benchType: "external", status: "reviewing", benchAddedBy: "alice@oceanbluecorp.com" },
      { id: "3", addToTalentBench: false, status: "reviewing" },
    ];
    assert.deepEqual(rows.filter(visibleTo(BOB)).map((r) => r.id), ["1", "3"]);
    assert.deepEqual(rows.filter(visibleTo(ALICE)).map((r) => r.id), ["1", "2", "3"]);
    assert.deepEqual(rows.filter(visibleTo(ADMIN)).map((r) => r.id), ["1", "2", "3"]);
  });
});
