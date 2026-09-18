// In-app password change: every Cognito failure lands on a message a person
// can act on, and none of Cognito's own text gets through.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const { classifyPasswordChangeError: classify, passwordChangeResponse: respond } =
  load("src/lib/password-change.ts");

describe("classifyPasswordChangeError", () => {
  test("a rejected current password is wrong-current, not a lockout", () => {
    assert.equal(classify("verify", "NotAuthorizedException", "Incorrect username or password."), "wrong-current");
  });

  test("Cognito's lockout, which also arrives as NotAuthorized, is throttled", () => {
    assert.equal(classify("verify", "NotAuthorizedException", "Password attempts exceeded"), "throttled");
    assert.equal(classify("change", "LimitExceededException"), "throttled");
    assert.equal(classify("verify", "TooManyRequestsException"), "throttled");
  });

  test("policy failures on the new password are weak; history is reused", () => {
    assert.equal(classify("change", "InvalidPasswordException", "Password did not conform with policy"), "weak");
    assert.equal(classify("change", "InvalidParameterException"), "weak");
    assert.equal(classify("change", "PasswordHistoryPolicyViolationException"), "reused");
  });

  test("a disabled account or an unknown error is unavailable", () => {
    assert.equal(classify("verify", "NotAuthorizedException", "User is disabled."), "unavailable");
    assert.equal(classify("verify", "InternalErrorException"), "unavailable");
    assert.equal(classify("verify", ""), "unavailable");
  });

  test("reset-required is its own case", () => {
    assert.equal(classify("verify", "PasswordResetRequiredException"), "reset-required");
  });
});

describe("passwordChangeResponse", () => {
  test("wrong current password is a 400 on that field with the agreed words", () => {
    assert.deepEqual(respond("wrong-current"), {
      status: 400,
      field: "currentPassword",
      error: "Your current password is incorrect.",
    });
  });

  test("a weak password lists exactly what is missing", () => {
    const r = respond("weak", "abc");
    assert.equal(r.status, 400);
    assert.equal(r.field, "newPassword");
    assert.match(r.error, /8 characters/);
    assert.match(r.error, /uppercase/);
    assert.match(r.error, /number/);
    assert.match(r.error, /symbol/);
    assert.doesNotMatch(r.error, /lowercase letter/);
  });

  test("weak with nothing missing locally still explains the policy", () => {
    const r = respond("weak", "Abcdef1!");
    assert.match(r.error, /policy/);
  });

  test("throttled is a 429 telling them to wait", () => {
    const r = respond("throttled");
    assert.equal(r.status, 429);
    assert.equal(r.error, "Too many attempts. Try again in a few minutes.");
  });

  test("challenge states are explained, not reported as a wrong password", () => {
    assert.equal(respond("new-password-required").status, 409);
    assert.equal(respond("mfa-required").status, 409);
    assert.equal(respond("reset-required").status, 409);
  });

  test("no response carries an SDK error name", () => {
    for (const reason of ["wrong-current", "weak", "reused", "same", "throttled", "new-password-required", "mfa-required", "reset-required", "unavailable"]) {
      assert.doesNotMatch(respond(reason, "x").error, /Exception|Cognito/);
    }
  });
});
