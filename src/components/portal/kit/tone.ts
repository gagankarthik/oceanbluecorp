/**
 * Nav sections. Sections are told apart by label and place, not hue: every
 * section takes the brand ocean (green, amber and red are reserved for status).
 */
export type Section = "recruiting" | "relationships" | "publishing" | "workspace";

const OCEAN = { chip: "bg-ocean-50 text-ocean-700", spark: "#0a72c0" }; // ocean-600; SVG attributes take a literal

export const sectionTone: Record<Section, { chip: string; spark: string; label: string }> = {
  recruiting: { ...OCEAN, label: "Recruiting" },
  relationships: { ...OCEAN, label: "Relationships" },
  publishing: { ...OCEAN, label: "Publishing" },
  workspace: { ...OCEAN, label: "Workspace" },
};
