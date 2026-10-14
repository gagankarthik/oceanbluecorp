"use client";

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Icon, { type IconName } from "../icons";

export type MenuEntry =
  | { kind?: "item"; label: string; icon?: IconName; onSelect: () => void; danger?: boolean; disabled?: boolean; checked?: boolean; hint?: string }
  | { kind: "label"; label: string }
  | { kind: "separator" };

/** Overflow menu on portal tokens (Radix: keyboard, focus and outside-click handled). */
export function ActionMenu({
  label = "More actions",
  items,
  trigger,
  align = "end",
  width = "w-60",
}: {
  label?: string;
  items: MenuEntry[];
  /** Replaces the default "⋯" icon button */
  trigger?: React.ReactNode;
  align?: "start" | "end";
  width?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            aria-label={label}
            title={label}
            onClick={(e) => e.stopPropagation()}
            className="grid size-10 shrink-0 place-items-center rounded-lg bg-mist-0 text-navy-900 ring-1 ring-inset ring-mist-300 hover:bg-mist-50 data-[state=open]:bg-mist-100"
          >
            <Icon name="dots" className="size-[18px]" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} sideOffset={6} className={`${width} max-w-[calc(100vw-2rem)] rounded-xl border-0 bg-mist-0 p-1.5 shadow-xl ring-1 ring-mist-200`}>
        {items.map((it, i) =>
          it.kind === "separator" ? (
            <DropdownMenuSeparator key={i} className="my-1 bg-mist-200" />
          ) : it.kind === "label" ? (
            <DropdownMenuLabel key={i} className="px-2.5 pb-1 pt-2 text-[12px] font-semibold text-mist-500">
              {it.label}
            </DropdownMenuLabel>
          ) : (
            <DropdownMenuItem
              key={i}
              disabled={it.disabled}
              onSelect={() => it.onSelect()}
              className={`flex min-h-10 cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-[14px] focus:bg-mist-100 data-[disabled]:cursor-default data-[disabled]:opacity-60 ${
                it.danger ? "text-[#b42318] focus:bg-[#fef3f2] focus:text-[#b42318]" : "text-navy-900"
              }`}
            >
              {it.checked !== undefined ? (
                <Icon name="check" className={`mt-0.5 size-4 shrink-0 ${it.checked ? "text-ocean-600" : "text-transparent"}`} />
              ) : (
                it.icon && <Icon name={it.icon} className={`mt-0.5 size-4 shrink-0 ${it.danger ? "" : "text-mist-600"}`} />
              )}
              <span className="min-w-0 flex-1">
                <span className="block">{it.label}</span>
                {it.hint && <span className="mt-0.5 block text-[12px] leading-snug text-mist-600">{it.hint}</span>}
              </span>
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
