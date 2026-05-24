import * as React from "react";
import { cn } from "@/lib/utils";

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
          <div className="hidden sm:flex w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--hz-cobalt)] to-cyan-500 items-center justify-center shadow-sm shadow-[rgba(29,78,216,0.2)] flex-shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900 leading-tight">{title}</h1>
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

export function PageHeaderButton({
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const styles = {
    primary:   "bg-[var(--hz-cobalt)] hover:bg-[var(--hz-cobalt-600)] text-white shadow-sm shadow-[rgba(29,78,216,0.2)]",
    secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm",
    ghost:     "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
  }[variant];
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors",
        styles,
        props.className,
      )}
    >
      {children}
    </button>
  );
}
