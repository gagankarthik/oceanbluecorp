// Public salary display: currency formatting, pay period, legacy records.
import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const { formatSalary, currencyCode, salaryUnitText } = load("src/lib/salary.ts");

test("annual range, no decimals, missing period reads as yearly", () => {
  assert.equal(formatSalary({ min: 90000, max: 120000, currency: "USD" }), "$90,000 – $120,000/yr");
  assert.equal(formatSalary({ min: 90000, max: 120000, currency: "USD", period: "year" }), "$90,000 – $120,000/yr");
});

test("period suffixes", () => {
  assert.equal(formatSalary({ min: 45, max: 60, currency: "USD", period: "hour" }), "$45 – $60/hr");
  assert.equal(formatSalary({ min: 8000, max: 8000, currency: "USD", period: "month" }), "$8,000/mo");
  assert.equal(formatSalary({ min: 2000, max: 2500, currency: "USD", period: "week" }), "$2,000 – $2,500/wk");
  assert.equal(formatSalary({ min: 400, max: 500, currency: "USD", period: "day" }), "$400 – $500/day");
});

test("cents are kept rather than rounded", () => {
  assert.equal(formatSalary({ min: 42.5, max: 50, currency: "USD", period: "hour" }), "$42.50 – $50/hr");
});

test("legacy symbol currency, one-sided and empty ranges", () => {
  assert.equal(currencyCode("$"), "USD");
  assert.equal(currencyCode("eur"), "EUR");
  assert.equal(currencyCode(""), "USD");
  assert.equal(formatSalary({ min: 70000, max: 0, currency: "$" }), "From $70,000/yr");
  assert.equal(formatSalary({ min: 0, max: 60, currency: "USD", period: "hour" }), "Up to $60/hr");
  assert.equal(formatSalary({ min: 0, max: 0, currency: "USD" }), null);
  assert.equal(formatSalary(undefined), null);
  assert.equal(formatSalary({ min: 120000, max: 90000, currency: "USD" }), "$90,000 – $120,000/yr");
});

test("schema.org unitText", () => {
  assert.equal(salaryUnitText({}), "YEAR");
  assert.equal(salaryUnitText({ period: "hour" }), "HOUR");
});
