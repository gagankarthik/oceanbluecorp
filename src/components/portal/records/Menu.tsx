"use client";

import { useRef } from "react";
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
  // The chosen action runs once focus is back on the trigger, so a modal or
  // drawer it opens takes focus and later returns it there (not to <body>).
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pending = useRef<(() => void) | null>(null);
  const flush = () => {
    const fn = pending.current;
    pending.current = null;
    fn?.();
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild ref={triggerRef}>
        {trigger ?? (
          <button
            type="button"
            aria-label={label}
            title={label}
            onClick={(e) => e.stopPropagation()}
            className="grid size-10 shrink-0 place-items-center rounded-lg bg-mist-0 text-navy-900 ring-1 ring-inset ring-mist-300 hover:bg-mist-50 data-[state=open]:bg-mist-100"
          >
            <Icon name="dots" className="size-5" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        sideOffset={6}
        onCloseAutoFocus={(e) => {
          if (!pending.current) return;
          e.preventDefault();
          triggerRef.current?.focus();
          flush();
        }}
        className={`${width} max-w-[calc(100vw-2rem)] rounded-xl border-0 bg-mist-0 p-1.5 shadow-xl ring-1 ring-mist-200`}>
        {items.map((it, i) =>
          it.kind === "separator" ? (
            <DropdownMenuSeparator key={i} className="my-1 bg-mist-200" />
          ) : it.kind === "label" ? (
            <DropdownMenuLabel key={i} className="px-2.5 pb-1 pt-2 text-adm-xs font-semibold text-mist-600">
              {it.label}
            </DropdownMenuLabel>
          ) : (
            <DropdownMenuItem
              key={i}
              disabled={it.disabled}
              onSelect={() => {
                pending.current = it.onSelect;
                window.setTimeout(flush, 150); // fallback if the close event never comes
              }}
              className={`flex min-h-10 cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-adm-base focus:bg-mist-100 data-[disabled]:cursor-default data-[disabled]:opacity-60 ${
                it.danger ? "text-status-danger focus:bg-status-danger-soft focus:text-status-danger" : "text-navy-900"
              }`}
            >
              {it.checked !== undefined ? (
                <Icon name="check" className={`mt-0.5 size-4 shrink-0 ${it.checked ? "text-ocean-600" : "text-transparent"}`} />
              ) : (
                it.icon && <Icon name={it.icon} className={`mt-0.5 size-4 shrink-0 ${it.danger ? "" : "text-mist-600"}`} />
              )}
              <span className="min-w-0 flex-1">
                <span className="block">{it.label}</span>
                {it.hint && <span className="mt-0.5 block text-adm-xs leading-snug text-mist-600">{it.hint}</span>}
              </span>
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
