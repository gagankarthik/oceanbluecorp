// Portal colour comes from tokens (DESIGN_SYSTEM §2.2): no hex inside a class.
// Chart constants passed to SVG attributes stay literal and are not classes.
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

test("portal classes take colour from tokens, never a hex", () => {
  const offenders = [];
  for (const f of [...files("src/app/portal"), ...files("src/components/portal")]) {
    const hits = readFileSync(f, "utf8").match(/\[[^\]\s]*#[0-9a-fA-F]{3,8}[^\]\s]*\]/g);
    if (hits) offenders.push(`${f}: ${[...new Set(hits)].join(", ")}`);
  }
  assert.deepEqual(offenders, [], `use a status-* or scale class:\n${offenders.join("\n")}`);
});
