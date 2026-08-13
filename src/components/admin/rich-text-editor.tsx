"use client";

import * as React from "react";
import { Bold, Italic, Underline, List, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import { isHtml } from "@/lib/rich-text";

/* ============================================================
   Minimal rich text editor, a contentEditable surface with a
   small formatting toolbar. Dependency-free (uses the built-in
   execCommand); outputs HTML into a plain string field.

   Descriptions written before this editor existed are plain
   text with newlines, so `toHtml` converts their line breaks to
   <br> when they load, and `renderRichText` does the same at the
   display side, old records keep their formatting, new ones get
   real HTML.
   ============================================================ */

/**
 * Strip the XSS vectors before the HTML is stored. Job descriptions render on
 * the PUBLIC careers page, so even though the author is staff this content is
 * sanitized at save time: script/style/iframe/etc. elements removed, all
 * `on*` handlers and inline styles dropped, and `javascript:` URLs neutralised.
 * Runs client-side (the editor's onChange), so DOMParser is available; on the
 * server it is a no-op and callers rely on the already-sanitized stored value.
 */
function sanitizeHtml(html: string): string {
  if (typeof window === "undefined" || !html) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, iframe, object, embed, link, meta, form, input").forEach((n) => n.remove());
  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on") || name === "style") { el.removeAttribute(attr.name); continue; }
      if ((name === "href" || name === "src") && /^\s*javascript:/i.test(attr.value)) el.removeAttribute(attr.name);
    }
  });
  return doc.body.innerHTML;
}

/** Seed value for the editable surface: HTML passes through, plain text keeps
 *  its line breaks as <br>. */
function toHtml(value: string): string {
  if (!value) return "";
  return isHtml(value) ? value : value.replace(/\n/g, "<br>");
}

type Cmd = { icon: React.ComponentType<{ className?: string }>; command: string; label: string };
const COMMANDS: Cmd[] = [
  { icon: Bold, command: "bold", label: "Bold" },
  { icon: Italic, command: "italic", label: "Italic" },
  { icon: Underline, command: "underline", label: "Underline" },
  { icon: List, command: "insertUnorderedList", label: "Bulleted list" },
  { icon: ListOrdered, command: "insertOrderedList", label: "Numbered list" },
];

export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder,
  required,
  className,
}: {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  // Seed the surface on mount and when the value is replaced from OUTSIDE (e.g.
  // switching records), but never while the user is typing in it, writing
  // innerHTML would drop the caret back to the top on every keystroke.
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const html = toHtml(value);
    if (el.innerHTML !== html && document.activeElement !== el) {
      el.innerHTML = html;
    }
  }, [value]);

  const exec = (command: string) => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    document.execCommand(command, false);
    onChange(sanitizeHtml(el.innerHTML));
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] transition-colors focus-within:border-[var(--adm-accent)] focus-within:ring-2 focus-within:ring-[var(--adm-focus-ring)]",
        className,
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-1.5 py-1">
        {COMMANDS.map((c) => (
          <button
            key={c.command}
            type="button"
            title={c.label}
            aria-label={c.label}
            // Keep the selection in the editor when the button is pressed.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(c.command)}
            className="grid h-8 w-8 place-items-center rounded-[6px] text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]"
          >
            <c.icon className="h-4 w-4" aria-hidden="true" />
          </button>
        ))}
      </div>

      {/* Editable surface. `data-placeholder` shows through the empty:before
          rule below until the first character is typed. */}
      <div
        id={id}
        ref={ref}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-required={required}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={(e) => onChange(sanitizeHtml((e.currentTarget as HTMLDivElement).innerHTML))}
        className={cn(
          "min-h-[160px] w-full px-3.5 py-2.5 text-[14px] leading-relaxed text-[var(--adm-ink)] outline-none",
          "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5",
          "[&_a]:text-[var(--adm-accent)] [&_a]:underline",
          "empty:before:pointer-events-none empty:before:text-[var(--adm-ink-subtle)] empty:before:content-[attr(data-placeholder)]",
        )}
      />
    </div>
  );
}
