import { createHash } from "node:crypto";

// Keys are 256 bits of randomness, so a plain SHA-256 is enough: there is
// nothing to brute-force, and a deterministic hash keeps the lookup a filter.
export const hashApiKey = (raw: string) => createHash("sha256").update(raw, "utf8").digest("hex");

/** Enough to tell keys apart on screen, never enough to use */
export const apiKeyPreview = (raw: string) => `${raw.slice(0, 12)}...`;
