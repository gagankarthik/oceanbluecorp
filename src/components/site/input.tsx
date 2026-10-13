import { cn } from "@/lib/utils";

/* Site text fields. One style: 48px, a 3.4:1 edge, a 2px cobalt ring on focus,
   a danger edge when aria-invalid, and the shared disabled opacity. */

const FIELD =
  "w-full rounded-xl border border-[var(--input-border)] bg-white px-4 type-body text-ink placeholder:text-ink-subtle " +
  "transition-[border-color,outline-color] duration-[var(--dur-short)] ease-out " +
  "hover:border-[var(--input-border-hover)] " +
  "focus-visible:border-[var(--input-border-focus)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-border-focus)] " +
  "aria-[invalid=true]:border-[var(--input-border-invalid)] " +
  "disabled:cursor-not-allowed disabled:bg-paper disabled:opacity-[var(--opacity-disabled)]";

export const inputClass = (className?: string) => cn(FIELD, "h-[var(--input-height)]", className);
export const textareaClass = (className?: string) => cn(FIELD, "min-h-32 resize-y py-3", className);

export function Input({ className, ...rest }: React.ComponentProps<"input">) {
  return <input className={inputClass(className)} {...rest} />;
}

export function Textarea({ className, ...rest }: React.ComponentProps<"textarea">) {
  return <textarea className={textareaClass(className)} {...rest} />;
}

/** The message under an invalid field; its id is `${id}-error` for aria-describedby. */
export function FieldError({ id, message, className }: { id: string; message?: string; className?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className={cn("mt-2 type-body-sm text-danger", className)}>
      {message}
    </p>
  );
}

export const LABEL = "mb-2 block type-label text-ink";
