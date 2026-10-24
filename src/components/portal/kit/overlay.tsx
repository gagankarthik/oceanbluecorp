"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Icon from "../icons";
import { usePortalChrome } from "../chrome";
import { Button } from "./Button";
import { FieldError, inputCls } from "../fields/base";

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
  // The autoFocus target, so a re-run effect (Strict Mode) restores it rather than the panel.
  const initial = useRef<HTMLElement | null>(null);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!enabled) return;
    const id = Symbol("dialog");
    stack.push(id);
    const panel = ref.current;
    const inside = !!panel?.contains(document.activeElement);
    // Panels that stay mounted (enabled toggles) read the opener here instead.
    const back = inside ? opener : (document.activeElement as HTMLElement | null);

    if (locks++ === 0) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    if (inside) initial.current = document.activeElement as HTMLElement;
    else if (panel) (initial.current && panel.contains(initial.current) ? initial.current : panel).focus({ preventScroll: true });

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
  role = "dialog",
}: {
  title: string;
  description?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: keyof typeof modalWidth;
  role?: "dialog" | "alertdialog";
}) {
  const ref = useDialog<HTMLDivElement>(onClose);
  const titleId = useId();
  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
        <div aria-hidden className="kit-fade absolute inset-0 bg-navy-950/40" onClick={onClose} />
        <div
          ref={ref}
          role={role}
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={`kit-rise relative flex max-h-[calc(100svh-0.5rem)] w-full flex-col rounded-t-2xl bg-mist-0 text-navy-900 shadow-2xl focus:outline-none sm:max-h-[calc(100svh-3rem)] sm:rounded-2xl ${modalWidth[size]}`}
        >
          <div className="flex items-start justify-between gap-4 border-b border-mist-200 px-5 py-4 sm:px-6">
            <div className="min-w-0 py-1">
              <h2 id={titleId} className="text-adm-md font-semibold leading-snug text-navy-900">{title}</h2>
              {description && <p className="mt-0.5 text-adm-base text-mist-600">{description}</p>}
            </div>
            <CloseButton onClose={onClose} />
          </div>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
          {footer && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-mist-200 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">{footer}</div>
          )}
        </div>
      </div>
    </Portal>
  );
}

const typed = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

/** `requireText` for a delete: "delete N" for a batch, else the record's name, else "delete". */
export const deleteConfirmText = (name?: string | null, count = 1) => (count > 1 ? `delete ${count}` : name?.trim() || "delete");

/**
 * Confirmation for an irreversible action. Cancel takes focus first, so Enter
 * never destroys anything by accident. Closing is blocked while `busy`.
 * `requireText` adds typed friction: confirm stays disabled until it matches
 * (trimmed, case-insensitive). Reserve it for high-impact deletes.
 */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
  tone = "danger",
  requireText,
}: {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** "danger" for deletes (trash icon); "primary" for a weighty but safe action */
  tone?: "danger" | "primary";
  /** Text the user must type before confirming, e.g. the record's name */
  requireText?: string;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const inputId = useId();
  const bodyId = useId();
  const needed = requireText?.trim() || undefined;
  const ok = !needed || typed(value) === typed(needed);
  const cancel = () => !busy && onCancel();
  const confirm = () => {
    if (busy) return;
    if (!ok) return setError(`Type "${needed}" exactly to confirm.`);
    onConfirm();
  };
  return (
    <Modal
      title={title}
      size="sm"
      role="alertdialog"
      onClose={cancel}
      footer={
        <>
          <Button variant="ghost" onClick={cancel} disabled={busy} autoFocus>
            Cancel
          </Button>
          <Button variant={tone} icon={tone === "danger" ? "trash" : undefined} onClick={confirm} loading={busy} disabled={!ok}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div id={bodyId} className="text-adm-base leading-normal text-mist-700">{body}</div>
      {needed && (
        <div className="mt-4">
          <label htmlFor={inputId} className="mb-1.5 block text-adm-base text-navy-900">
            Type <strong className="font-semibold">{needed}</strong> to confirm
          </label>
          <input
            id={inputId}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError("");
            }}
            onBlur={() => value.trim() && !ok && setError(`Type "${needed}" exactly to confirm.`)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              confirm();
            }}
            disabled={busy}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : bodyId}
            className={inputCls}
          />
          <FieldError id={`${inputId}-error`}>{error}</FieldError>
        </div>
      )}
    </Modal>
  );
}

/**
 * Record panel. Slides in from the right (max 34rem, `lg` 48rem) from sm; a bottom sheet
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
  const section = usePortalChrome()?.sectionTitle;
  return (
    <Portal>
      {/* Plane's side peek: from sm it sits in the work surface under the top bar, its left edge a
          hairline over the list (a faint scrim catches the click out); a bottom sheet on phones. */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end">
        <div aria-hidden className="kit-fade absolute inset-0 bg-navy-950/40 sm:bg-navy-950/5" onClick={onClose} />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={`kit-peek relative flex h-[92svh] w-full flex-col rounded-t-2xl bg-mist-0 text-navy-900 shadow-2xl focus:outline-none sm:mb-2 sm:mr-2 sm:mt-13 sm:h-auto sm:rounded-none sm:rounded-r-lg sm:border sm:border-mist-200 sm:shadow-[-12px_0_32px_rgba(15,23,42,0.08)] ${
            width === "lg" ? "sm:max-w-3xl lg:w-[60%] lg:max-w-[64rem]" : "sm:max-w-136 lg:w-1/2 lg:max-w-[56rem]"
          }`}
        >
          <div className="flex h-12 shrink-0 items-center gap-2 border-b border-mist-200 px-3 sm:px-4">
            <button type="button" onClick={onClose} aria-label="Close" title="Close" className={PEEK_ICON}>
              <Icon name="collapse" className="size-4" />
            </button>
            <span aria-hidden className="h-4 w-px bg-mist-200" />
            {/* The record names itself in the body; the header says where it lives, as Plane's does */}
            {section ? (
              <>
                <span className="min-w-0 flex-1 truncate text-adm-base font-medium text-mist-700">{section}</span>
                <h2 id={titleId} className="sr-only">{title}</h2>
              </>
            ) : (
              <h2 id={titleId} className="min-w-0 flex-1 truncate text-adm-base font-medium text-mist-700">{title}</h2>
            )}
            {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
          </div>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8">{children}</div>
          {footer && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-mist-200 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8">{footer}</div>
          )}
        </div>
      </div>
    </Portal>
  );
}

const PEEK_ICON = "grid size-7 shrink-0 place-items-center rounded-md text-mist-600 transition-colors duration-150 hover:bg-mist-100 hover:text-navy-900";
