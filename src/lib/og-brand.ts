import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Reversed lockup (white type) for the dark share cards. PNG, not the SVG:
// Satori's SVG support drops masks, which the mark's wave cut-outs depend on.
export const OG_LOGO = { width: 1024, height: 304 } as const;

export async function ogLogoSrc(): Promise<string> {
  const data = await readFile(join(process.cwd(), "public", "brand", "oceanblue-logo-reversed.png"));
  return `data:image/png;base64,${data.toString("base64")}`;
}
