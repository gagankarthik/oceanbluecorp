import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const { hashApiKey, apiKeyPreview } = load("src/lib/api-key-hash.ts");

test("hash is stable, hex, and never the key itself", () => {
  const key = "obk_live_" + "a".repeat(64);
  const h = hashApiKey(key);
  assert.equal(h, hashApiKey(key));
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.ok(!h.includes(key.slice(9)));
});

test("different keys hash differently", () => {
  assert.notEqual(hashApiKey("obk_live_1"), hashApiKey("obk_live_2"));
});

test("preview keeps only the prefix", () => {
  const key = "obk_live_" + "b".repeat(64);
  assert.equal(apiKeyPreview(key), "obk_live_bbb...");
});
