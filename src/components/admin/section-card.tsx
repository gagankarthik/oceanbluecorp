import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
}

export function SectionCard({
  title, description, icon: Icon, actions, toolbar, children, className, bodyClassName, noPadding,
}: SectionCardProps) {
  const hasHeader = title || description || actions || Icon;
  return (
    <div className={cn("bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden", className)}>
      {hasHeader && (
        <div className="px-4 sm:px-5 pt-4 pb-3 flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100">
          <div className="flex items-start gap-2.5 min-w-0">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <div className="min-w-0">
              {title && <h3 className="text-[15px] font-semibold text-slate-900 leading-tight">{title}</h3>}
              {description && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
      )}
      {toolbar && <div className="px-4 sm:px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">{toolbar}</div>}
      <div className={cn(noPadding ? "" : "p-4 sm:p-5", bodyClassName)}>{children}</div>
    </div>
  );
}
