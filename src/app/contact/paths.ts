export type ContactPath = "hiring" | "work";

export const CONTACT_PATH_PARAM = "for";

/** `?for=work` picks the job-seeker path; anything else is hiring. */
export const parseContactPath = (v: string | string[] | undefined): ContactPath =>
  (Array.isArray(v) ? v[0] : v) === "work" ? "work" : "hiring";
