/* ============================================================
   WCAG contrast maths.

   Pure functions, no DOM, so the colour choices in this app can
   be asserted in a test rather than eyeballed in a screenshot.
   Eyeballing is how a 3.9:1 ships: it looks fine to whoever
   picked it, on their monitor, at their size.

   Reference: WCAG 2.2, 1.4.3 (Contrast Minimum) and 1.4.11
   (Non-text Contrast).
   ============================================================ */

export type Rgb = { r: number; g: number; b: number };

/** `#rrggbb` or `#rgb`. */
export function hexToRgb(hex: string): Rgb {
  const h = hex.trim().replace(/^#/, "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`Not a hex colour: ${hex}`);
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** `rgba(r, g, b, a)` / `rgb(r, g, b)`. Returns the alpha alongside. */
export function parseRgba(css: string): { rgb: Rgb; a: number } {
  const m = css.trim().match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)$/);
  if (!m) throw new Error(`Not an rgb/rgba colour: ${css}`);
  return {
    rgb: { r: +m[1], g: +m[2], b: +m[3] },
    a: m[4] === undefined ? 1 : +m[4],
  };
}

/** Any of the forms the tokens use. */
export function parseColor(css: string): { rgb: Rgb; a: number } {
  const s = css.trim();
  if (s.startsWith("#")) return { rgb: hexToRgb(s), a: 1 };
  return parseRgba(s);
}

/**
 * Composite a translucent colour over an opaque one.
 *
 * Every `*-soft` token in this system is a 10% tint, so the colour a reader
 * actually sees behind text is never the token itself, it is the token
 * composited over whatever surface it sits on. Comparing text against the
 * un-composited tint overstates the contrast and passes things that fail.
 */
export function blendOver(fg: { rgb: Rgb; a: number }, bg: Rgb): Rgb {
  return {
    r: fg.rgb.r * fg.a + bg.r * (1 - fg.a),
    g: fg.rgb.g * fg.a + bg.g * (1 - fg.a),
    b: fg.rgb.b * fg.a + bg.b * (1 - fg.a),
  };
}

/** WCAG relative luminance. */
export function luminance({ r, g, b }: Rgb): number {
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/** Contrast ratio, 1–21. Order of arguments does not matter. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Ratio for a possibly-translucent foreground colour over a known surface. */
export function ratioOn(colorCss: string, surfaceCss: string, base = "#ffffff"): number {
  const baseRgb = hexToRgb(base);
  const surface = parseColor(surfaceCss);
  const surfaceRgb = surface.a === 1 ? surface.rgb : blendOver(surface, baseRgb);
  const fg = parseColor(colorCss);
  const fgRgb = fg.a === 1 ? fg.rgb : blendOver(fg, surfaceRgb);
  return contrastRatio(fgRgb, surfaceRgb);
}

/** WCAG 2.2 thresholds. */
export const AA = {
  /** 1.4.3, body text below 18.66px regular / 24px bold. */
  text: 4.5,
  /** 1.4.3, large text at or above those sizes. */
  largeText: 3,
  /** 1.4.11, icons, borders, control boundaries. */
  nonText: 3,
} as const;
