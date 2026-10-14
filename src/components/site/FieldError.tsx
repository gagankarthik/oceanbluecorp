/** A field's inline error. The control points at it with aria-describedby="<id>-error". */
export default function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className="mt-2 flex items-center gap-2 text-small font-normal text-navy-900">
      <span aria-hidden className="size-2 shrink-0 bg-buoy-500" />
      {message}
    </p>
  );
}
