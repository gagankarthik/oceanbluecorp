// The console type scale (DESIGN_SYSTEM §2.6): sizes come from text-adm-*,
// one ratio from a 14px body. A literal pixel size is a size off the scale.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(name) ? [p] : [];
  });
}

test("admin code sizes text only from the type scale", () => {
  const offenders = [];
  for (const f of [...files("src/app/portal/(console)"), ...files("src/components/portal/console")]) {
    const hits = readFileSync(f, "utf8").match(/text-\[\d+(?:\.\d+)?px\]/g);
    if (hits) offenders.push(`${f}: ${[...new Set(hits)].join(", ")}`);
  }
  assert.deepEqual(offenders, [], `use text-adm-* instead:\n${offenders.join("\n")}`);
});

test("the scale keeps one ratio, 1.2 from a 14px body", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  const keys = ["xs", "base", "md", "lg", "xl", "2xl"];
  keys.forEach((k, i) => {
    const m = css.match(new RegExp(`--text-adm-${k}:\\s*([\\d.]+)px`));
    assert.ok(m, `--text-adm-${k} missing`);
    const ideal = 14 * 1.2 ** (i - 1);
    // Half-pixel rounding moves a step by under 2% off the ideal.
    assert.ok(Math.abs(Number(m[1]) / ideal - 1) < 0.02, `--text-adm-${k} ${m[1]}px is off 14 × 1.2^${i - 1} = ${ideal.toFixed(2)}`);
  });
  for (const gone of ["micro", "3xl", "4xl"]) assert.ok(!css.includes(`--text-adm-${gone}:`), `--text-adm-${gone} is retired`);
});

test("cn() keeps a scale size beside a text colour", async () => {
  const { load } = await import("./load.mjs");
  const { cn } = load("src/lib/utils.ts");
  assert.equal(cn("text-adm-base text-[var(--adm-ink)]"), "text-adm-base text-[var(--adm-ink)]");
  assert.equal(cn("text-adm-base", "text-adm-xs"), "text-adm-xs");
});
