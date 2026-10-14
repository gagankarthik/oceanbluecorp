// The site type scale (SITE_DESIGN_LANGUAGE §2): sizes come from the text-*
// roles in globals.css. A literal size is a size off the scale.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SKIP = [join("src", "app", "portal"), join("src", "app", "api")];

function files(dir) {
  if (SKIP.includes(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(name) ? [p] : [];
  });
}

const site = () => ["src/app", "src/components/site", "src/components/layout", "src/components/visuals"].flatMap(files);

test("site code sizes text only from the type scale", () => {
  const offenders = [];
  for (const f of site()) {
    // px, rem and inline clamp() sizes; em stays relative to its parent and is fine
    const hits = readFileSync(f, "utf8").match(/text-\[(?:\d+(?:\.\d+)?(?:px|rem)|clamp\([^\]]*\))\]/g);
    if (hits) offenders.push(`${f}: ${[...new Set(hits)].join(", ")}`);
  }
  assert.deepEqual(offenders, [], `use a text-* role instead:\n${offenders.join("\n")}`);
});

test("running text uses the measure tokens, not ad-hoc ch widths", () => {
  const offenders = [];
  for (const f of site()) {
    // Under 30ch is a heading constraint, not a measure
    const hits = (readFileSync(f, "utf8").match(/max-w-\[(\d+)ch\]/g) || []).filter((h) => Number(h.match(/\d+/)[0]) >= 30);
    if (hits.length) offenders.push(`${f}: ${[...new Set(hits)].join(", ")}`);
  }
  assert.deepEqual(offenders, [], `use max-w-measure or max-w-measure-narrow:\n${offenders.join("\n")}`);
});

test("the scale steps rise at 1280px, 1.15–1.4 apart", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  const order = ["caption", "small", "body", "title", "head-sm", "head-md", "head", "head-xl"];
  // Evaluate each clamp() at 1280px (1rem = 16px)
  const at1280 = (k) => {
    const m = css.match(new RegExp(`--text-${k}:\\s*([^;]+);`));
    assert.ok(m, `--text-${k} missing`);
    const px = (s) => s.trim().split(/\s*\+\s*/).reduce((sum, t) => sum + (t.endsWith("vw") ? (parseFloat(t) * 1280) / 100 : parseFloat(t) * 16), 0);
    const c = m[1].match(/clamp\(([^,]+),([^,]+),([^)]+)\)/);
    return c ? Math.min(Math.max(px(c[1]), px(c[2])), px(c[3])) : px(m[1]);
  };
  for (let i = 1; i < order.length; i++) {
    const r = at1280(order[i]) / at1280(order[i - 1]);
    assert.ok(r >= 1.15 && r <= 1.4, `text-${order[i]} / text-${order[i - 1]} is ${r.toFixed(2)} at 1280px`);
  }
});

test("cn() keeps a site size beside a text colour", async () => {
  const { load } = await import("./load.mjs");
  const { cn } = load("src/lib/utils.ts");
  assert.equal(cn("text-small text-navy-900"), "text-small text-navy-900");
  assert.equal(cn("text-head display text-mist-600"), "text-head display text-mist-600");
  assert.equal(cn("text-small", "text-body"), "text-body");
});
