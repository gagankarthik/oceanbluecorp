// What an API key may do. The case that matters is the key issued before
// scopes existed: it has no `scopes` attribute, and reading that as "no
// restrictions" would hand every partner already holding a key the ability to
// file postings onto the public careers site. A regression here is silent.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const {
  API_SCOPES,
  API_ACCESS_LEVELS,
  DEFAULT_ACCESS_LEVEL,
  isApiScope,
  isApiAccessLevel,
  scopesForLevel,
  scopesOf,
  hasScope,
  accessLevelOf,
  accessLevelMeta,
} = load("src/lib/api-scopes.ts");

describe("legacy keys", () => {
  test("a key with no scopes attribute is read-only", () => {
    assert.deepEqual(scopesOf({ name: "Indeed" }), ["jobs:read"]);
    assert.equal(hasScope({ name: "Indeed" }, "jobs:read"), true);
    assert.equal(hasScope({ name: "Indeed" }, "jobs:write"), false);
  });

  test("an empty or undefined scope list is read-only, never everything", () => {
    for (const key of [{ scopes: [] }, { scopes: undefined }, { scopes: null }, null, undefined]) {
      assert.deepEqual(scopesOf(key), ["jobs:read"]);
      assert.equal(hasScope(key, "jobs:write"), false);
    }
  });

  test("an unrecognised scope is dropped, not honoured", () => {
    assert.deepEqual(scopesOf({ scopes: ["jobs:delete", "*"] }), ["jobs:read"]);
    assert.deepEqual(scopesOf({ scopes: ["jobs:write", "admin:*"] }), ["jobs:write"]);
  });
});

describe("access levels", () => {
  test("the default level is read-only", () => {
    assert.equal(DEFAULT_ACCESS_LEVEL, "read");
    assert.deepEqual(scopesForLevel(DEFAULT_ACCESS_LEVEL), ["jobs:read"]);
  });

  test("write implies read, so a write key can still poll the feed", () => {
    const scopes = scopesForLevel("write");
    assert.ok(scopes.includes("jobs:read"));
    assert.ok(scopes.includes("jobs:write"));
  });

  test("an unknown or missing level falls back to read-only", () => {
    for (const level of ["admin", "", null, undefined, "READ"]) {
      assert.deepEqual(scopesForLevel(level), ["jobs:read"]);
    }
  });

  test("every declared level only grants declared scopes", () => {
    for (const level of API_ACCESS_LEVELS) {
      for (const scope of level.scopes) assert.ok(API_SCOPES.includes(scope), scope);
    }
  });

  test("a level round-trips through the scopes it grants", () => {
    for (const level of API_ACCESS_LEVELS) {
      assert.equal(accessLevelOf({ scopes: scopesForLevel(level.id) }), level.id);
      assert.equal(accessLevelMeta(level.id).label, level.label);
    }
  });
});

describe("guards", () => {
  test("isApiScope and isApiAccessLevel reject anything undeclared", () => {
    assert.equal(isApiScope("jobs:read"), true);
    assert.equal(isApiScope("jobs:delete"), false);
    assert.equal(isApiScope(null), false);
    assert.equal(isApiAccessLevel("write"), true);
    assert.equal(isApiAccessLevel("owner"), false);
    assert.equal(isApiAccessLevel(undefined), false);
  });
});
