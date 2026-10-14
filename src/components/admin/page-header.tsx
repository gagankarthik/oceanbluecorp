import * as React from "react";
import { cn } from "@/lib/utils";
import { InfoTip } from "./info-tip";
import { WorkspaceButton } from "./workspace";

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

/** Header for a detail, form or settings screen, matching the portal's page headers. */
export function PageHeader({ title, subtitle, info, actions, meta, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-none flex-col gap-4 md:flex-row md:items-center md:justify-between", className)}>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-adm-xl font-semibold tracking-tight text-[var(--adm-ink)]">{title}</h1>
          {subtitle && info && <InfoTip label={title}>{info}</InfoTip>}
        </div>
        {(subtitle ?? info) && <div className="mt-0.5 max-w-[60ch] text-adm-base text-[var(--adm-ink-subtle)]">{subtitle ?? info}</div>}
        {meta && <div className="mt-2">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:justify-end">{actions}</div>}
    </div>
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
