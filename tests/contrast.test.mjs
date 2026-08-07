// WCAG contrast for every colour pairing this app puts text on.
//
// Reads the token values out of globals.css rather than restating them, so the
// test fails when somebody retunes a token rather than passing against a stale
// copy of what the colour used to be. That is the whole point: contrast is a
// property of the pair, and pairs break when one side moves.
//
// Admin is light-only (`data-theme="light"` is hardcoded), so only the light
// block is asserted.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { load } from "./load.mjs";

const { ratioOn, contrastRatio, hexToRgb, AA } = load("src/lib/contrast.ts");

const css = readFileSync("src/app/globals.css", "utf8");

/**
 * The value a token actually resolves to in the shipped light theme.
 *
 * Two traps here, both of which made the first version of this test assert
 * against colours that never render:
 *
 * 1. Several admin tokens are defined TWICE in the light scope — an earlier
 *    block and a later retune (`--adm-canvas` is #f7f8fa then #fafafa). CSS
 *    takes the last, so taking the first tests a colour nobody sees.
 * 2. Everything from `@media (prefers-color-scheme: dark)` onward is the dark
 *    palette. Admin pins itself to light (`data-theme="light"`), so those
 *    definitions must be excluded entirely rather than being allowed to win as
 *    "the last one".
 *
 * Some tokens are also aliases (`--adm-accent: var(--hz-cobalt)`), so a var()
 * reference is followed to the primitive it points at.
 */
/* Cut at the at-rule itself, anchored to the start of a line. A plain
   indexOf finds a COMMENT ten lines earlier that quotes the media query while
   explaining the theming strategy, which silently truncates the light scope
   and hides half the tokens from this test. */
const DARK_AT_RULE = /^@media \(prefers-color-scheme: dark\)/m;
const darkAt = css.search(DARK_AT_RULE);
const LIGHT_CSS = darkAt === -1 ? css : css.slice(0, darkAt);

function rawToken(name, source = LIGHT_CSS) {
  const all = [...source.matchAll(new RegExp(`--${name}:\\s*([^;]+);`, "g"))];
  assert.ok(all.length, `token --${name} not found in the light scope of globals.css`);
  return all[all.length - 1][1].trim();
}

function token(name) {
  let v = rawToken(name);
  // Follow one level of aliasing; the brand primitives are not themselves vars.
  const alias = v.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (alias) v = rawToken(alias[1].replace(/^--/, ""), css);
  return v;
}

const SURFACE = "#ffffff";
const CANVAS = token("adm-canvas");

const INK = token("adm-ink");
const INK_MUTE = token("adm-ink-mute");
const INK_SUBTLE = token("adm-ink-subtle");
const ACCENT = token("adm-accent");
const SUCCESS = token("adm-success");
const SUCCESS_INK = token("adm-success-ink");
const WARNING_INK = token("adm-warning-ink");
const DANGER = token("adm-danger");
const DANGER_INK = token("adm-danger-ink");
const WARNING = token("adm-warning");

const SUCCESS_SOFT = token("adm-success-soft");
const DANGER_SOFT = token("adm-danger-soft");
const ACCENT_SOFT = token("adm-accent-soft");

describe("body text", () => {
  test("the ink ramp carries on both surfaces", () => {
    for (const [name, ink] of [["ink", INK], ["ink-mute", INK_MUTE], ["ink-subtle", INK_SUBTLE]]) {
      for (const [sName, surf] of [["surface", SURFACE], ["canvas", CANVAS]]) {
        const r = ratioOn(ink, surf);
        assert.ok(r >= AA.text, `--adm-${name} on ${sName} is ${r.toFixed(2)}:1, needs ${AA.text}`);
      }
    }
  });
});

describe("semantic colour as text", () => {
  /* The `-ink` variants, not the base tokens. `--adm-success` (3.77:1) and
     `--adm-warning` (3.19:1) are tuned as FILLS — dots, switch tracks, tinted
     chips — and both fail as text on white. Anything rendering a semantic
     colour as words must reach for the ink variant, and this is the assertion
     that keeps that true. */
  const asText = [
    ["accent", ACCENT],
    ["success-ink", SUCCESS_INK],
    ["warning-ink", WARNING_INK],
    ["danger", DANGER],
  ];

  test("on plain surfaces", () => {
    for (const [name, c] of asText) {
      for (const [sName, surf] of [["surface", SURFACE], ["canvas", CANVAS]]) {
        const r = ratioOn(c, surf);
        assert.ok(r >= AA.text, `--adm-${name} text on ${sName} is ${r.toFixed(2)}:1, needs ${AA.text}`);
      }
    }
  });

  test("on their own 10% tint - the chip and tinted-button case", () => {
    // The claimed-owner chip, the danger claim button, the stage control: each
    // sets a semantic colour as text on a soft version of the same hue.
    for (const [name, c, soft] of [
      ["success-ink", SUCCESS_INK, SUCCESS_SOFT],
      ["danger-ink", DANGER_INK, DANGER_SOFT],
      ["accent", ACCENT, ACCENT_SOFT],
    ]) {
      const r = ratioOn(c, soft);
      assert.ok(r >= AA.text, `--adm-${name} on its soft tint is ${r.toFixed(2)}:1, needs ${AA.text}`);
    }
  });

  test("the fill tokens still read as fills", () => {
    // They are allowed to be lighter, but a dot or a track still has to be
    // discernible against the surface behind it (1.4.11).
    for (const [name, c] of [["success", SUCCESS], ["warning", WARNING]]) {
      const r = ratioOn(c, SURFACE);
      assert.ok(r >= AA.nonText, `--adm-${name} as a fill is ${r.toFixed(2)}:1, needs ${AA.nonText}`);
    }
  });
});

describe("non-text: the account switch", () => {
  /* 1.4.11 requires each state of a control to be distinguishable from the
     ADJACENT surface — not from the control's other state. An earlier version
     of this test asserted ON against OFF and failed at 2.54:1, which was the
     test being wrong rather than the design: mid-greens and mid-greys sit at
     similar luminance, and no pairing of them would ever have passed.

     What actually protects the user here is that state is never colour-alone —
     the knob moves and the label reads "Active" / "Inactive" — which is 1.4.1
     (Use of Colour) and is satisfied structurally. */
  test("each track has a discernible boundary against the surface", () => {
    // The ON track is carried by its fill; the OFF track cannot be (no light
    // grey reaches 3:1 on white) so it carries a border, and the border is what
    // this asserts.
    const onFill = ratioOn(SUCCESS, SURFACE);
    assert.ok(onFill >= AA.nonText, `switch ON fill is ${onFill.toFixed(2)}:1, needs ${AA.nonText}`);

    const offBorder = ratioOn(INK_SUBTLE, SURFACE);
    assert.ok(offBorder >= AA.nonText, `switch OFF border is ${offBorder.toFixed(2)}:1, needs ${AA.nonText}`);
  });
});

describe("stage colours from theme.ts", () => {
  /* Parsed out of theme.ts rather than copied here. A copy passes forever
     while the real palette drifts, which is the failure mode this whole file
     exists to prevent. */
  const themeSrc = readFileSync("src/components/admin/theme.ts", "utf8");
  const block = themeSrc.slice(
    themeSrc.indexOf("export const toneColor"),
    themeSrc.indexOf("};", themeSrc.indexOf("export const toneColor")),
  );
  const entries = [...block.matchAll(/(\w+):\s*"([^"]+)"/g)].map(([, k, v]) => [k, v]);

  test("the palette was found", () => {
    assert.ok(entries.length >= 10, `expected the full tone ramp, parsed ${entries.length}`);
  });

  test("every tone is legible as text on white", () => {
    const failures = [];
    for (const [name, value] of entries) {
      // Resolve `var(--adm-x)` through globals.css so aliases are checked too.
      const alias = value.match(/^var\(\s*(--[\w-]+)\s*\)$/);
      const resolved = alias ? token(alias[1].replace(/^--/, "")) : value;
      const r = ratioOn(resolved, SURFACE);
      if (r < AA.text) failures.push(`${name} ${resolved} = ${r.toFixed(2)}:1`);
    }
    assert.deepEqual(failures, [], `tones below ${AA.text}:1 as text`);
  });
});
