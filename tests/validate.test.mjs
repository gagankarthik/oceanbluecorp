// Route-boundary validation: the mechanism that makes undeclared fields
// unreachable rather than individually blocked.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const { validate, validationMessage } = load("src/lib/validate.ts");

describe("validate", () => {
  test("drops any field the schema does not declare", () => {
    // The whole point. An anonymous caller posting `status: "hired"` and
    // `ownership` to an open route cannot reach the record with them, whatever
    // gets added to the body later.
    const r = validate(
      { email: "a@b.com", status: "hired", ownership: "someone-else", rating: 5 },
      { email: { kind: "string", required: true } },
    );
    assert.equal(r.ok, true);
    assert.deepEqual(r.value, { email: "a@b.com" });
    assert.equal("status" in r.value, false);
    assert.equal("ownership" in r.value, false);
  });

  test("reports a missing required field by name", () => {
    const r = validate({}, { applicationId: { kind: "string", required: true } });
    assert.equal(r.ok, false);
    assert.deepEqual(r.errors, ["applicationId is required"]);
  });

  test("treats blank and whitespace as absent", () => {
    const r = validate({ name: "   " }, { name: { kind: "string", required: true } });
    assert.equal(r.ok, false);
  });

  test("trims accepted strings", () => {
    const r = validate({ name: "  Jane  " }, { name: { kind: "string" } });
    assert.equal(r.value.name, "Jane");
  });

  test("enforces a closed set of values", () => {
    const rule = { status: { kind: "string", oneOf: ["sent", "rejected"] } };
    assert.equal(validate({ status: "sent" }, rule).ok, true);
    const bad = validate({ status: "hired" }, rule);
    assert.equal(bad.ok, false);
    assert.match(bad.errors[0], /must be one of/);
  });

  test("rejects over-long input instead of truncating it", () => {
    // Silent truncation stores a value nobody typed.
    const r = validate({ notes: "x".repeat(50) }, { notes: { kind: "string", maxLength: 20 } });
    assert.equal(r.ok, false);
    assert.equal(r.value.notes, undefined);
  });

  test("checks numeric bounds", () => {
    const rule = { rate: { kind: "number", min: 0, max: 1000 } };
    assert.equal(validate({ rate: 85 }, rule).ok, true);
    assert.equal(validate({ rate: -1 }, rule).ok, false);
    assert.equal(validate({ rate: 5000 }, rule).ok, false);
    assert.equal(validate({ rate: "85" }, rule).ok, false); // no coercion unless asked
  });

  test("coerces a numeric string only when the rule opts in", () => {
    const r = validate({ rate: "85.5" }, { rate: { kind: "number", coerce: true } });
    assert.equal(r.value.rate, 85.5);
  });

  test("rejects a number that is not one", () => {
    const r = validate({ rate: "abc" }, { rate: { kind: "number", coerce: true } });
    assert.equal(r.ok, false);
    assert.match(r.errors[0], /must be a number/);
  });

  test("cleans a string list and drops the junk in it", () => {
    const r = validate(
      { panel: ["Alex ", "", "  ", "Dana", 42, null] },
      { panel: { kind: "stringArray" } },
    );
    assert.deepEqual(r.value.panel, ["Alex", "Dana"]);
  });

  test("requires booleans to be boolean", () => {
    assert.equal(validate({ flag: true }, { flag: { kind: "boolean" } }).ok, true);
    assert.equal(validate({ flag: "yes" }, { flag: { kind: "boolean" } }).ok, false);
    assert.equal(validate({ flag: "true" }, { flag: { kind: "boolean", coerce: true } }).value.flag, true);
  });

  test("rejects an array or a primitive posted as the whole body", () => {
    assert.equal(validate([], { a: { kind: "string" } }).ok, false);
    assert.equal(validate("nope", { a: { kind: "string" } }).ok, false);
    assert.equal(validate(null, { a: { kind: "string" } }).ok, false);
  });

  test("collects every problem rather than stopping at the first", () => {
    const r = validate(
      { a: 1, b: "x".repeat(10) },
      { a: { kind: "string" }, b: { kind: "string", maxLength: 3 }, c: { kind: "string", required: true } },
    );
    assert.equal(r.errors.length, 3);
  });
});

describe("validationMessage", () => {
  test("passes a single error through unchanged", () => {
    assert.equal(validationMessage(["email is required"]), "email is required");
  });

  test("counts and joins several", () => {
    assert.equal(validationMessage(["a bad", "b bad"]), "2 problems: a bad; b bad");
  });
});
