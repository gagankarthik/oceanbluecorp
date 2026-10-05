// Public job titles: tidy dash spacing without touching hyphenated words.
import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const { displayTitle } = load("src/lib/careers.ts");

test("spaces a dash that has a space on one side only", () => {
  assert.equal(displayTitle("PM- Systems Integration (Paychex)"), "PM – Systems Integration (Paychex)");
  assert.equal(displayTitle("Lead -Data"), "Lead – Data");
});

test("turns a spaced hyphen or em dash into a spaced en dash", () => {
  assert.equal(displayTitle("IT Security Analyst - Hybrid, OH"), "IT Security Analyst – Hybrid, OH");
  assert.equal(displayTitle("PM Level 2 — Retail"), "PM Level 2 – Retail");
});

test("leaves hyphenated words and clean titles alone", () => {
  assert.equal(displayTitle("Contract-to-hire ETL Lead"), "Contract-to-hire ETL Lead");
  assert.equal(displayTitle("PM Level 2 – Retail Infrastructure PM"), "PM Level 2 – Retail Infrastructure PM");
  assert.equal(displayTitle("  Data   Engineer "), "Data Engineer");
});
