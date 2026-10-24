// The portal's own palettes (portal-light.css, portal-dark.css) override the site tokens;
// these pairs keep them at WCAG AA: text 4.5:1, control edges and marks 3:1.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function palette(file) {
  const css = readFileSync(file, "utf8");
  const out = {};
  for (const m of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) out[m[1]] ??= m[2];
  return out;
}
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

for (const file of ["src/styles/portal-light.css", "src/styles/portal-dark.css"]) {
  test(`${file}: text and edges read at AA on the surface and its washes`, () => {
    const p = palette(file);
    const failures = [];
    const need = (fg, bg, min) => {
      const r = ratio(p[fg], p[bg]);
      if (r < min) failures.push(`${fg} on ${bg} ${r.toFixed(2)}:1 < ${min}`);
    };
    for (const bg of ["mist-0", "mist-50", "mist-100"]) {
      need("navy-900", bg, 4.5);
      need("mist-600", bg, 4.5);
      need("mist-700", bg, 4.5);
    }
    need("mist-550", "mist-0", 4.5); // placeholders
    need("mist-500", "mist-0", 3); // control edges, icons
    assert.deepEqual(failures, []);
  });
}
