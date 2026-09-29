"use client";

import * as React from "react";
import { Select as S } from "radix-ui";
import { cn } from "@/lib/utils";
import { IconCheck, IconChevronDown } from "./icons";

/**
 * The site's select. Radix underneath, so it is a real listbox: full keyboard
 * support, typeahead, screen-reader semantics, and a native <select> mirrored
 * for form submission when `name` is set. Styled to the site system and
 * rendered in a portal, so it is never clipped by a card or a sticky bar.
 *
 * `hint` renders to the right of an option (a count, say) and is left out of
 * the trigger, which shows the label alone.
 */

export type SelectOption = {
  value: string;
  label: string;
  hint?: React.ReactNode;
  disabled?: boolean;
};

type Size = "md" | "lg";

const triggerSize: Record<Size, string> = {
  md: "h-10 pl-4 pr-3 text-[14px]",
  lg: "h-12 pl-4 pr-3.5 text-[15px]",
};

export function Select({
  id,
  label,
  hideLabel,
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  size = "lg",
  shape = "pill",
  name,
  required,
  disabled,
  invalid,
  describedBy,
  className,
  triggerClassName,
}: {
  id: string;
  label: string;
  /** Keep the label for assistive tech but do not draw it. */
  hideLabel?: boolean;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  size?: Size;
  /** Pills in toolbars, rounded rectangles inside forms. */
  shape?: "pill" | "field";
  name?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
  triggerClassName?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "mb-1.5 block text-[14px] font-medium text-ink"}>
        {label}
        {required && !hideLabel && <span className="text-danger"> *</span>}
      </label>
      {/* "" shows the placeholder, so a form reset clears the control. */}
      <S.Root value={value} onValueChange={onValueChange} name={name} required={required} disabled={disabled}>
        <S.Trigger
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            "group inline-flex w-full items-center justify-between gap-2 border bg-white text-left text-ink transition-colors",
            "border-line-strong hover:border-ink-subtle focus:outline-none focus-visible:border-cobalt focus-visible:ring-4 focus-visible:ring-cobalt/15",
            "data-[placeholder]:text-ink-subtle data-[state=open]:border-cobalt disabled:cursor-not-allowed disabled:opacity-50",
            "aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/15",
            shape === "pill" ? "rounded-full" : "rounded-xl",
            triggerSize[size],
            triggerClassName,
          )}
        >
          <span className="min-w-0 truncate">
            <S.Value placeholder={placeholder} />
          </span>
          <S.Icon asChild>
            <IconChevronDown size={16} className="shrink-0 text-ink-subtle transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </S.Icon>
        </S.Trigger>

        <S.Portal>
          <S.Content
            position="popper"
            sideOffset={6}
            collisionPadding={12}
            className={cn(
              "site z-[10002] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-overlay)]",
              "max-h-[min(360px,var(--radix-select-content-available-height))]",
              "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            )}
          >
            <S.ScrollUpButton className="flex h-7 items-center justify-center text-ink-subtle">
              <IconChevronDown size={14} className="rotate-180" />
            </S.ScrollUpButton>
            <S.Viewport className="p-1.5">
              {options.map((o) => (
                <S.Item
                  key={o.value}
                  value={o.value}
                  disabled={o.disabled}
                  className={cn(
                    "relative flex cursor-pointer items-center justify-between gap-4 rounded-xl py-2.5 pr-9 pl-3 text-[14.5px] text-ink outline-none! select-none",
                    "data-[highlighted]:bg-paper data-[state=checked]:font-semibold data-[disabled]:cursor-default data-[disabled]:opacity-40",
                  )}
                >
                  <S.ItemText>{o.label}</S.ItemText>
                  {o.hint != null && <span className="text-[13.5px] font-normal text-ink-subtle tabular-nums">{o.hint}</span>}
                  <S.ItemIndicator className="absolute right-3 inline-flex">
                    <IconCheck size={16} className="text-cobalt" />
                  </S.ItemIndicator>
                </S.Item>
              ))}
            </S.Viewport>
            <S.ScrollDownButton className="flex h-7 items-center justify-center text-ink-subtle">
              <IconChevronDown size={14} />
            </S.ScrollDownButton>
          </S.Content>
        </S.Portal>
      </S.Root>
    </div>
  );
}
