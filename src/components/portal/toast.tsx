"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import Icon from "./icons";

type ToastTone = "success" | "info" | "error";
type Toast = { id: number; message: string; tone: ToastTone; undo?: () => void };

const ToastContext = createContext<(message: string, opts?: { tone?: ToastTone; undo?: () => void }) => void>(() => {});

/** Shared feedback for portal actions. Every button that changes something confirms it here. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const notify = useCallback(
    (message: string, opts?: { tone?: ToastTone; undo?: () => void }) => {
      const id = ++next.current;
      setToasts((t) => [...t.slice(-2), { id, message, tone: opts?.tone ?? "success", undo: opts?.undo }]);
      setTimeout(() => dismiss(id), opts?.undo ? 6000 : 3500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl bg-navy-950 px-4 py-3 text-adm-base text-white shadow-xl ring-1 ring-white/10"
          >
            <Icon
              name={t.tone === "error" ? "alert" : t.tone === "info" ? "bell" : "check"}
              className={`size-5 shrink-0 ${t.tone === "error" ? "text-status-danger-on-dark" : t.tone === "info" ? "text-cyan-300" : "text-status-success-on-dark"}`}
            />
            <span className="min-w-0 flex-1">{t.message}</span>
            {t.undo && (
              <button
                type="button"
                onClick={() => {
                  t.undo?.();
                  dismiss(t.id);
                }}
                className="rounded-md px-2 py-1 font-semibold text-cyan-300 hover:bg-white/10"
              >
                Undo
              </button>
            )}
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} title="Dismiss" className="adm-hit grid size-7 place-items-center rounded-md text-white/70 hover:bg-white/10 hover:text-white">
              <Icon name="x" className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
