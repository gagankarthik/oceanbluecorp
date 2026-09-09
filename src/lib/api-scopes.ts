// What a partner API key is allowed to do.
//
// Keys used to be a single yes/no: hold one and you could read the job feed.
// Adding a write endpoint made that insufficient — a syndication partner that
// only mirrors postings must not be able to create them, and revoking the
// whole key is the only lever if read and write travel together.
//
// Scopes are stored as a list rather than a single "level" column so a third
// capability (applications, say) is one more entry here, not a schema change
// and a migration of every issued key.
//
// Pure module: no AWS, no React, imported by both the route guards and the
// admin screen.

export const API_SCOPES = ["jobs:read", "jobs:write"] as const;
export type ApiScope = (typeof API_SCOPES)[number];

/**
 * The two choices an admin actually makes when issuing a key.
 *
 * Presenting raw scopes would ask the person issuing the key to reason about
 * whether write implies read. It does not, so the write level carries both.
 */
export const API_ACCESS_LEVELS = [
  {
    id: "read",
    label: "View jobs",
    summary: "Read-only",
    description: "Read the job feed. Cannot create, change or remove a posting.",
    scopes: ["jobs:read"] as ApiScope[],
  },
  {
    id: "write",
    label: "Create and view jobs",
    summary: "Read + write",
    description: "Everything above, plus POST /api/v1/jobs to file a new posting as a draft.",
    scopes: ["jobs:read", "jobs:write"] as ApiScope[],
  },
] as const;

export type ApiAccessLevel = (typeof API_ACCESS_LEVELS)[number]["id"];

export const DEFAULT_ACCESS_LEVEL: ApiAccessLevel = "read";

export function isApiScope(value: unknown): value is ApiScope {
  return typeof value === "string" && (API_SCOPES as readonly string[]).includes(value);
}

export function isApiAccessLevel(value: unknown): value is ApiAccessLevel {
  return API_ACCESS_LEVELS.some((l) => l.id === value);
}

/** The scopes a level grants. Unknown level falls back to read-only. */
export function scopesForLevel(level: string | null | undefined): ApiScope[] {
  const match = API_ACCESS_LEVELS.find((l) => l.id === level);
  return [...(match ?? API_ACCESS_LEVELS[0]).scopes];
}

/**
 * The scopes a stored key actually holds.
 *
 * Keys issued before scopes existed have no `scopes` attribute. They resolve to
 * read-only, which is exactly what they could do the day before this shipped —
 * the alternative, treating an absent list as "everything", would silently hand
 * every existing partner the ability to create postings.
 */
export function scopesOf(key: { scopes?: string[] | null } | null | undefined): ApiScope[] {
  const stored = key?.scopes?.filter(isApiScope) ?? [];
  return stored.length > 0 ? stored : ["jobs:read"];
}

export function hasScope(key: { scopes?: string[] | null } | null | undefined, scope: ApiScope): boolean {
  return scopesOf(key).includes(scope);
}

/** Which level a stored key reads as, for display and for the edit form. */
export function accessLevelOf(key: { scopes?: string[] | null } | null | undefined): ApiAccessLevel {
  return hasScope(key, "jobs:write") ? "write" : "read";
}

export function accessLevelMeta(level: ApiAccessLevel) {
  return API_ACCESS_LEVELS.find((l) => l.id === level) ?? API_ACCESS_LEVELS[0];
}
