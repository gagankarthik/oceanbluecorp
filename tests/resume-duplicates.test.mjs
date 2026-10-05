// Duplicate resumes and the cloud indexing phase.
//
// The keeper rule decides which copy of a resume the matching engine sees and
// which copies the bank offers to delete; the server and the page must agree,
// or a recruiter deletes the one copy that was searchable.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const { findDuplicateGroups, keysToIndex, pickKeeper } = load("src/lib/resume-duplicates.ts");
const { indexJobPhase, INDEX_STALL_MS } = load("src/lib/index-job.ts");

const f = (key, fileName, size, uploadedAt, indexed = false) => ({ key, fileName, size, uploadedAt, indexed });

describe("duplicate groups", () => {
  test("groups by file name (any case) and exact size", () => {
    const groups = findDuplicateGroups([
      f("a", "Jane.pdf", 100, 1),
      f("b", "jane.PDF", 100, 2),
      f("c", "Jane.pdf", 101, 3),
    ]);
    assert.equal(groups.length, 1);
    assert.deepEqual(groups[0].files.map((x) => x.key), ["a", "b"]);
  });

  test("keeps the indexed copy even when it is newer", () => {
    const keeper = pickKeeper([f("old", "x.pdf", 1, 1), f("new", "x.pdf", 1, 9, true)]);
    assert.equal(keeper.key, "new");
  });

  test("keeps the oldest copy when none is indexed", () => {
    const [g] = findDuplicateGroups([f("b", "x.pdf", 1, 5), f("a", "x.pdf", 1, 2), f("c", "x.pdf", 1, 8)]);
    assert.equal(g.keeper.key, "a");
    assert.deepEqual(g.extras.map((x) => x.key), ["b", "c"]);
  });

  test("indexes singles and keepers, never extras", () => {
    const keys = keysToIndex([f("solo", "s.pdf", 1, 1), f("k", "d.pdf", 2, 1), f("e", "d.pdf", 2, 2)]);
    assert.deepEqual(keys.sort(), ["k", "solo"]);
  });
});

describe("indexing phase", () => {
  const now = Date.parse("2026-10-05T12:00:00Z");
  const ago = (ms) => new Date(now - ms).toISOString();

  test("idle without state, finished at zero", () => {
    assert.equal(indexJobPhase(null, now), "idle");
    assert.equal(indexJobPhase({ updatedAt: ago(1000), remaining: 0 }, now), "finished");
  });

  test("running while the heartbeat is fresh, stalled once it goes quiet", () => {
    assert.equal(indexJobPhase({ updatedAt: ago(60_000), remaining: 5 }, now), "running");
    assert.equal(indexJobPhase({ updatedAt: ago(INDEX_STALL_MS + 1), remaining: 5 }, now), "stalled");
  });

  test("a stop request reads as stopping until the chain ends or dies", () => {
    assert.equal(indexJobPhase({ updatedAt: ago(1000), remaining: 5, cancelled: true }, now), "stopping");
    assert.equal(indexJobPhase({ updatedAt: ago(1000), remaining: 0, cancelled: true }, now), "stopped");
    assert.equal(indexJobPhase({ updatedAt: ago(INDEX_STALL_MS + 1), remaining: 5, cancelled: true }, now), "stopped");
  });
});
