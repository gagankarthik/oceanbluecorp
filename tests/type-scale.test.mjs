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
  for (const f of [...files("src/app/admin"), ...files("src/components/admin")]) {
    const hits = readFileSync(f, "utf8").match(/text-\[\d+(?:\.\d+)?px\]/g);
    if (hits) offenders.push(`${f}: ${[...new Set(hits)].join(", ")}`);
  }
  assert.deepEqual(offenders, [], `use text-adm-* instead:\n${offenders.join("\n")}`);
});

test("the scale keeps one ratio", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  const steps = ["micro", "xs", "base", "md", "lg", "xl", "2xl", "3xl", "4xl"].map((k) => {
    const m = css.match(new RegExp(`--text-adm-${k}:\\s*([\\d.]+)px`));
    assert.ok(m, `--text-adm-${k} missing`);
    return Number(m[1]);
  });
  for (let i = 1; i < steps.length; i++) {
    const ratio = steps[i] / steps[i - 1];
    // Half-pixel rounding moves a step by at most ~0.06 off 1.125.
    assert.ok(Math.abs(ratio - 1.125) < 0.07, `step ${i} ratio ${ratio.toFixed(3)} is off 1.125`);
  }
});

test("cn() keeps a scale size beside a text colour", async () => {
  const { load } = await import("./load.mjs");
  const { cn } = load("src/lib/utils.ts");
  assert.equal(cn("text-adm-base text-[var(--adm-ink)]"), "text-adm-base text-[var(--adm-ink)]");
  assert.equal(cn("text-adm-base", "text-adm-xs"), "text-adm-xs");
});
