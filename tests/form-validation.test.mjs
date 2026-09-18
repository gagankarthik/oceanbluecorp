// Client-side form checks shared by the admin forms.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const fv = load("src/lib/form-validation.ts");

describe("predicates", () => {
  test("isEmail accepts ordinary addresses and rejects obvious typos", () => {
    assert.equal(fv.isEmail("jane.doe@acme.co"), true);
    assert.equal(fv.isEmail(" jane@acme.com "), true);
    assert.equal(fv.isEmail("jane@acme"), false);
    assert.equal(fv.isEmail("jane acme.com"), false);
    assert.equal(fv.isEmail("jane@acme.c"), false);
  });

  test("isPhone is lenient on punctuation, strict on digit count", () => {
    assert.equal(fv.isPhone("(614) 555-0100"), true);
    assert.equal(fv.isPhone("+1 614.555.0100"), true);
    assert.equal(fv.isPhone("555-01"), false);
    assert.equal(fv.isPhone("614-555-0100 ext 4"), false);
    assert.equal(fv.isPhone("1".repeat(21)), false);
  });

  test("isUrl requires http(s) and a dotted host", () => {
    assert.equal(fv.isUrl("https://example.com"), true);
    assert.equal(fv.isUrl("http://sub.example.co.uk/path?q=1"), true);
    assert.equal(fv.isUrl("example.com"), false);
    assert.equal(fv.isUrl("ftp://example.com"), false);
    assert.equal(fv.isUrl("javascript:alert(1)"), false);
    assert.equal(fv.isUrl("https://localhost"), false);
  });

  test("htmlText treats an empty editor as blank", () => {
    assert.equal(fv.htmlText("<p><br></p>"), "");
    assert.equal(fv.htmlText("<p>&nbsp;</p>"), "");
    assert.equal(fv.htmlText("<p>Hello <b>there</b></p>"), "Hello there");
  });
});

describe("rules", () => {
  test("format rules skip blank values", () => {
    assert.equal(fv.check("", fv.email(), fv.phone(), fv.url(), fv.nonNegative()), undefined);
  });

  test("check returns the first failing message", () => {
    assert.equal(fv.check("  ", fv.required("Enter a name."), fv.maxLen(3)), "Enter a name.");
    assert.match(fv.check("abcd", fv.required("x"), fv.maxLen(3)), /under 3 characters/);
  });

  test("nonNegative rejects negatives and non-numbers", () => {
    assert.ok(fv.check("-1", fv.nonNegative()));
    assert.ok(fv.check("abc", fv.nonNegative()));
    assert.equal(fv.check("0", fv.nonNegative()), undefined);
  });

  test("collectErrors keeps only failing fields", () => {
    const errors = fv.collectErrors({ a: undefined, b: "bad", c: "" });
    assert.deepEqual(errors, { b: "bad" });
    assert.equal(fv.hasErrors(errors), true);
    assert.equal(fv.hasErrors(fv.collectErrors({ a: undefined })), false);
  });
});

describe("password policy", () => {
  test("names every missing requirement", () => {
    assert.deepEqual(fv.passwordNeeds("Abcdefg1!"), []);
    assert.deepEqual(fv.passwordNeeds("abc"), ["8 characters", "an uppercase letter", "a number", "a symbol"]);
    assert.equal(fv.check("abcdefgh1!", fv.strongPassword()), "The password still needs an uppercase letter.");
    assert.equal(fv.check("", fv.strongPassword()), undefined);
  });
});

describe("warnings", () => {
  test("pay over bill warns only when both are numbers", () => {
    assert.ok(fv.payOverBillWarning("60", "50"));
    assert.equal(fv.payOverBillWarning("50", "60"), undefined);
    assert.equal(fv.payOverBillWarning("60", ""), undefined);
  });

  test("past date compares by calendar day", () => {
    const now = new Date(2026, 8, 18, 23, 0);
    assert.ok(fv.pastDateWarning("2026-09-17", undefined, now));
    assert.equal(fv.pastDateWarning("2026-09-18", undefined, now), undefined);
    assert.equal(fv.pastDateWarning("", undefined, now), undefined);
  });

  test("endBeforeStart and rangeInverted", () => {
    assert.equal(fv.endBeforeStart("2026-01-10", "2026-01-09"), true);
    assert.equal(fv.endBeforeStart("2026-01-10", ""), false);
    assert.equal(fv.rangeInverted("100", "50"), true);
    assert.equal(fv.rangeInverted("50", "100"), false);
  });
});
