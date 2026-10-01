import * as React from "react";
import { cn } from "@/lib/utils";
import { InfoTip } from "./info-tip";
import { BrandBand, WorkspaceButton } from "./workspace";

interface PageHeaderProps {
  title: string;
  /** Visible line under the title, for data (an email, "Editing X"). */
  subtitle?: string;
  /** What the screen is for, as an ⓘ tooltip beside the title. */
  info?: React.ReactNode;
  /**
   * @deprecated Accepted but no longer rendered. The tinted icon tile was
   * removed with the header band; the prop stays so the ~20 existing call
   * sites keep compiling. Drop it as each page is touched.
   */
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

/**
 * Header for an admin screen.
 *
 * Stripped back to plain content on the canvas. The previous version was a
 * full-bleed white band with a bottom rule and a 40px tinted icon tile beside
 * the title, and it was rejected across the board: "I don't like this part of
 * design on all pages they look very bad."
 *
 * What went and why:
 *  - the white fill, the border and the negative margins, a band that framed
 *    a heading the sidebar and breadcrumb had already stated twice
 *  - the tinted icon tile, decoration; the sidebar's active row carries the
 *    same icon 200px to the left
 *  - 20px bold title → 18px semibold; it is a label, not a banner
 *
 * List screens should not use this at all, they lead with `ViewTabs` from
 * workspace.tsx. It stays for detail, form and settings screens, where the
 * title is the record's own name and so is genuinely worth stating.
 */
export function PageHeader({ title, subtitle, info, actions, meta, className }: PageHeaderProps) {
  const line = subtitle ?? info;
  return (
    <BrandBand
      size="sm"
      className={cn("mb-5", className)}
      title={title}
      // Chips are tinted for a white surface, so they sit on a white tab inside the band.
      meta={line || meta ? (
        <>
          {line}
          {meta && <div className={line ? "mt-2" : undefined}><span className="inline-flex rounded-[8px] bg-white p-0.5">{meta}</span></div>}
        </>
      ) : undefined}
      actions={actions}
    />
  );
}

/**
 * Action button for a header or toolbar.
 *
 * Now a thin alias over `WorkspaceButton` rather than its own styling. It had
 * drifted into a second, flatter button, same size but no elevation, no hover
 * lift and no press, so screens still using it looked a generation behind the
 * ones that had been migrated. One implementation means they cannot drift
 * again; `secondary` maps to WorkspaceButton's default.
 *
 * Prefer importing `WorkspaceButton` directly in new code.
 */
export function PageHeaderButton({
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost"; asChild?: boolean }) {
  return <WorkspaceButton variant={variant} {...props} />;
}
