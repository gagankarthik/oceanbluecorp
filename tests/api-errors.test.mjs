// A 500 body says what failed in words; the cause stays in the server log.
import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const { serverError, badRequest } = load("src/lib/api-errors.ts");

test("serverError returns only the user message, and logs the cause", async () => {
  const logged = [];
  const original = console.error;
  console.error = (...args) => logged.push(args);
  try {
    const cause = new Error("ResourceNotFoundException: Requested resource not found (oceanblue-clients)");
    const res = serverError("Creating client", cause, "Couldn't save the client. Please try again.");
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.deepEqual(body, { error: "Couldn't save the client. Please try again." });
    assert.equal(JSON.stringify(body).includes("oceanblue-clients"), false);
    assert.equal(logged.length, 1);
    assert.equal(logged[0][1], cause);
  } finally {
    console.error = original;
  }
});

test("serverError keeps a caller-chosen status", async () => {
  const original = console.error;
  console.error = () => {};
  try {
    assert.equal(serverError("x", null, "Not found.", 404).status, 404);
  } finally {
    console.error = original;
  }
});

test("badRequest is a 400 carrying its message", async () => {
  const res = badRequest("email is required", { field: "email" });
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { field: "email", error: "email is required" });
});
