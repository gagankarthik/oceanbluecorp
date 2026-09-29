"use client";

import * as React from "react";
import { Dialog as D } from "radix-ui";
import { cn } from "@/lib/utils";
import { IconX } from "./icons";

/**
 * A side sheet for focused tasks (applying to a role, a long form). Radix
 * Dialog underneath, so focus is trapped inside, Escape and the overlay close
 * it, focus returns to whatever opened it, and the page behind cannot scroll.
 *
 * Phones get a bottom sheet with a grab handle, nearly full height, since a
 * side panel on a 375px screen is just a narrower page. From sm it slides in
 * from the right. The header and footer hold still; only the body scrolls.
 */
export function SideSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Pinned under the scrolling body: the primary action lives here. */
  footer?: React.ReactNode;
  className?: string;
}) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="sheet-overlay fixed inset-0 z-[10000] bg-ink/45 backdrop-blur-[2px]" />
        <D.Content
          ref={contentRef}
          // Land in the first field rather than on the close button, when there is one.
          onOpenAutoFocus={(e) => {
            const field = contentRef.current?.querySelector<HTMLElement>("input:not([type=hidden]), textarea, [data-autofocus]");
            if (field) {
              e.preventDefault();
              field.focus();
            }
          }}
          className={cn(
            "site side-sheet fixed z-[10001] flex flex-col bg-white shadow-[var(--shadow-modal)] focus:outline-none",
            // Phones: bottom sheet.
            "inset-x-0 bottom-0 max-h-[94dvh] rounded-t-3xl",
            // sm and up: right-hand panel, full height.
            "sm:inset-y-0 sm:right-0 sm:left-auto sm:h-dvh sm:max-h-none sm:w-full sm:max-w-[560px] sm:rounded-none sm:rounded-l-3xl",
            className,
          )}
        >
          <div aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-line-strong sm:hidden" />

          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-6 pt-4 pb-5 sm:px-8 sm:pt-7">
            <div className="min-w-0">
              <D.Title className="type-title-lg text-ink">{title}</D.Title>
              {description ? (
                <D.Description className="mt-1 text-[14.5px] text-ink-subtle">{description}</D.Description>
              ) : (
                <D.Description className="sr-only">{typeof title === "string" ? title : "Dialog"}</D.Description>
              )}
            </div>
            <D.Close
              aria-label="Close"
              className="-mr-2 flex size-10 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-paper hover:text-ink"
            >
              <IconX size={18} />
            </D.Close>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8">{children}</div>

          {footer && (
            <footer className="shrink-0 border-t border-line bg-white px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 sm:pb-6">{footer}</footer>
          )}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
