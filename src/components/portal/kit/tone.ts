/**
 * Section colour coding. Each nav section has one accent, used for its icon
 * chips: a dark shade on a pale tint, so every icon clears WCAG non-text
 * contrast (3:1).
 */
export type Section = "recruiting" | "relationships" | "publishing" | "workspace";

export const sectionTone: Record<Section, { chip: string; spark: string; label: string }> = {
  recruiting: { chip: "bg-ocean-50 text-ocean-700", spark: "#0a72c0", label: "Recruiting" },
  relationships: { chip: "bg-[#e3f6ee] text-[#0b6e4a]", spark: "#13915f", label: "Relationships" },
  publishing: { chip: "bg-[#fdede4] text-[#a83d14]", spark: "#d4561f", label: "Publishing" },
  workspace: { chip: "bg-[#eeebfb] text-[#4a3aa7]", spark: "#5b4bd0", label: "Workspace" },
};
