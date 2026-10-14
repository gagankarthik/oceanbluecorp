"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Icon from "../icons";
import { Button } from "./Button";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Open overlays, innermost last: only the top one answers Escape and Tab.
const stack: symbol[] = [];
let locks = 0;
let savedOverflow = "";

/**
 * Dialog behaviour for any overlay panel (give it tabIndex={-1}): focus moves
 * in (a child with autoFocus keeps it, else the panel takes it), Tab is
 * trapped, Escape closes, the page behind stops scrolling, and focus returns
 * to the opener on close. `onClose` may change identity every render.
 */
export function useDialog<T extends HTMLElement>(onClose: () => void, enabled = true) {
  const ref = useRef<T>(null);
  // Read during render: by the effect, autoFocus has already moved focus inside.
  const [opener] = useState(() => (typeof document === "undefined" ? null : (document.activeElement as HTMLElement | null)));
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!enabled) return;
    const id = Symbol("dialog");
    stack.push(id);
    const panel = ref.current;
    // Panels that stay mounted (enabled toggles) read the opener here instead.
    const back = panel?.contains(document.activeElement) ? opener : (document.activeElement as HTMLElement | null);

    if (locks++ === 0) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    if (panel && !panel.contains(document.activeElement)) panel.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id || !panel) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const head = items[0];
      const tail = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === head || active === panel || !panel.contains(active))) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && (active === tail || !panel.contains(active))) {
        e.preventDefault();
        head.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      stack.splice(stack.indexOf(id), 1);
      if (--locks === 0) document.body.style.overflow = savedOverflow;
      if (back?.isConnected) back.focus({ preventScroll: true });
    };
  }, [enabled]);

  return ref;
}

const subscribe = () => () => {};
/** Renders into <body> once on the client, so fixed overlays escape every stacking context. */
function Portal({ children }: { children: React.ReactNode }) {
  const client = useSyncExternalStore(subscribe, () => true, () => false);
  return client ? createPortal(children, document.body) : null;
}

const modalWidth = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-6xl" } as const;

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="-mr-2 grid size-10 shrink-0 place-items-center rounded-lg text-mist-600 hover:bg-mist-100 hover:text-navy-900"
    >
      <Icon name="x" />
    </button>
  );
}

/**
 * Dialog for small forms and confirmations. Centred from sm; a bottom sheet
 * on phones that can grow to full height. Escape, the backdrop and the close
 * button all call `onClose` (pass a no-op while busy). `footer` pins actions
 * below the scrolling body.
 */
export function Modal({
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
}: {
  title: string;
  description?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: keyof typeof modalWidth;
}) {
  const ref = useDialog<HTMLDivElement>(onClose);
  const titleId = useId();
  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
        <div aria-hidden className="kit-fade absolute inset-0 bg-navy-950/40" onClick={onClose} />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={`kit-rise relative flex max-h-[calc(100svh-0.5rem)] w-full flex-col rounded-t-2xl bg-mist-0 text-navy-900 shadow-2xl focus:outline-none sm:max-h-[calc(100svh-3rem)] sm:rounded-2xl ${modalWidth[size]}`}
        >
          <div className="flex items-start justify-between gap-4 border-b border-mist-200 px-5 py-3.5 sm:px-6">
            <div className="min-w-0 py-1.5">
              <h2 id={titleId} className="text-[18px] font-semibold leading-snug text-navy-900">{title}</h2>
              {description && <p className="mt-0.5 text-[13px] text-mist-600">{description}</p>}
            </div>
            <CloseButton onClose={onClose} />
          </div>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
          {footer && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-mist-200 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:px-6">{footer}</div>
          )}
        </div>
      </div>
    </Portal>
  );
}

/**
 * Confirmation for an irreversible action. Cancel takes focus first, so Enter
 * never destroys anything by accident. Closing is blocked while `busy`.
 */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
  tone = "danger",
}: {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** "danger" for deletes (trash icon); "primary" for a weighty but safe action */
  tone?: "danger" | "primary";
}) {
  const cancel = () => !busy && onCancel();
  return (
    <Modal
      title={title}
      size="sm"
      onClose={cancel}
      footer={
        <>
          <Button variant="ghost" onClick={cancel} disabled={busy} autoFocus>
            Cancel
          </Button>
          <Button variant={tone} icon={tone === "danger" ? "trash" : undefined} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-[14px] leading-relaxed text-mist-700">{body}</div>
    </Modal>
  );
}

/**
 * Record panel. Slides in from the right (max 36rem) from sm; a bottom sheet
 * at 92% height on phones. Same focus, Escape and scroll rules as Modal.
 */
export function Drawer({
  title,
  onClose,
  children,
  footer,
  actions,
  width = "md",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Header buttons beside the close button, e.g. "Open job" */
  actions?: React.ReactNode;
  width?: "md" | "lg";
}) {
  const ref = useDialog<HTMLDivElement>(onClose);
  const titleId = useId();
  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end">
        <div aria-hidden className="kit-fade absolute inset-0 bg-navy-950/40" onClick={onClose} />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={`kit-slide relative flex h-[92svh] w-full flex-col rounded-t-2xl bg-mist-0 text-navy-900 shadow-2xl focus:outline-none sm:h-full sm:rounded-none ${width === "lg" ? "sm:max-w-3xl" : "sm:max-w-xl"}`}
        >
          <div className="flex items-center justify-between gap-4 border-b border-mist-200 px-5 py-3 sm:px-6">
            <h2 id={titleId} className="min-w-0 truncate text-[18px] font-semibold text-navy-900">{title}</h2>
            <div className="flex shrink-0 items-center gap-2">
              {actions}
              <CloseButton onClose={onClose} />
            </div>
          </div>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
          {footer && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-mist-200 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:px-6">{footer}</div>
          )}
        </div>
      </div>
    </Portal>
  );
}
