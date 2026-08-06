// Loader for the tests.
//
// The suite runs on `node --test` — built into Node, so the project gains a real
// test gate without a new dependency. The modules under test are TypeScript and
// use the `@/*` path alias, which plain Node will not resolve, so they are loaded
// through jiti (already present in node_modules) which handles both.
//
// Only PURE modules are tested here: no AWS calls, no network, no React. That is
// deliberate — these functions encode business rules (margin, stage progression,
// what a search matches) where a silent regression is expensive and a test is
// cheap.
import { createJiti } from "jiti";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const jiti = createJiti(import.meta.url, {
  alias: { "@": resolve(root, "src") },
  interopDefault: true,
});

/** Load a project module by repo-relative path, e.g. "src/lib/format.ts". */
export function load(relativePath) {
  return jiti(resolve(root, relativePath));
}
