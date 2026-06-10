import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, icon: Icon, actions, meta, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 pb-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4", className)}>
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="hidden sm:flex w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--hz-cobalt)] to-cyan-500 items-center justify-center shadow-sm shadow-[rgba(29,78,216,0.2)] flex-shrink-0">
            <Icon className="w-[18px] h-[18px] text-white" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-[19px] font-bold tracking-tight text-slate-900 leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{subtitle}</p>}
          {meta && <div className="mt-2">{meta}</div>}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}

// Reuses the shared ui/Button but bases every intent on the "ghost" variant —
// ghost has no background or hover of its own, so our explicit colors apply
// cleanly (the navy "default"/cyan "outline" variants otherwise fight these
// through tailwind-merge and the accent background can drop out). Colors use the
// proven --hz-cobalt tokens the rest of admin relies on.
const headerButtonVariant = {
  primary:   { variant: "ghost" as const, className: "bg-[var(--hz-cobalt)] text-white shadow-sm hover:bg-[var(--hz-cobalt-600)] hover:text-white" },
  secondary: { variant: "ghost" as const, className: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100 hover:text-slate-900" },
  ghost:     { variant: "ghost" as const, className: "text-slate-600 hover:bg-slate-100 hover:text-slate-900" },
};

/** Header action button — thin styling layer over the shared ui/Button. */
export function PageHeaderButton({
  variant = "primary",
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "variant"> & { variant?: "primary" | "secondary" | "ghost" }) {
  const v = headerButtonVariant[variant];
  return <Button variant={v.variant} className={cn("font-semibold", v.className, className)} {...props} />;
}
